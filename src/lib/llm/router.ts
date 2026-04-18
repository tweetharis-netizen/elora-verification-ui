import { USE_CASE_CONFIG } from './config.js';
import { logLLMUsage, updateUserMemory } from './hooks.js';
import { buildSystemPrompt } from './prompt.js';
import { callCohere } from './providers/cohere.js';
import { callGemini } from './providers/gemini.js';
import { callGroq } from './providers/groq.js';
import { callOpenRouter } from './providers/openrouter.js';
import { getStudentMemory } from '../../server/memory/studentMemoryStore.js';
import type {
  LLMMessage,
  LLMResponse,
  ProviderCallArgs,
  ProviderName,
  UseCase,
  UseCaseConfig,
  StudentMemory,
  UserProfile,
  UserRole,
} from './types.js';

const PROVIDER_CALLS: Record<ProviderName, (args: ProviderCallArgs) => Promise<LLMResponse>> = {
  openrouter: callOpenRouter,
  groq: callGroq,
  gemini: callGemini,
  cohere: callCohere,
};

const FALLBACK_CONFIG: Partial<Record<UseCase, UseCaseConfig>> = {
  teacher_planning: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 1000,
    temperature: 0.4,
  },
  student_study_help: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 900,
    temperature: 0.5,
  },
  teacher_unit_planner: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 1100,
    temperature: 0.4,
  },
  teacher_data_triage: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 900,
    temperature: 0.35,
  },
  student_study_mode: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 950,
    temperature: 0.45,
  },
  parent_chat: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 700,
    temperature: 0.4,
  },
  parent_support_mode: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 800,
    temperature: 0.4,
  },
};

const CRITICAL_RUNTIME_FALLBACK_USE_CASES = new Set<UseCase>([
  'teacher_unit_planner',
  'teacher_data_triage',
  'student_study_mode',
  'parent_support_mode',
]);

const USE_CASES_REQUIRING_SUGGESTIONS = new Set<UseCase>([
  'teacher_chat',
  'teacher_planning',
  'teacher_unit_planner',
  'teacher_data_triage',
  'student_chat',
  'student_study_help',
  'student_study_mode',
  'parent_chat',
  'parent_support_mode',
]);

const DEFAULT_SUGGESTIONS_BY_USE_CASE: Partial<Record<UseCase, string[]>> = {
  teacher_chat: [
    'Show me who to prioritise this week.',
    'Turn this into a 20-minute action plan for tomorrow.',
    'Draft a short parent update for priority students.',
  ],
  teacher_planning: [
    'Turn this into detailed lesson steps.',
    'Add quick differentiation for mixed-ability learners.',
    'Draft a 5-question exit ticket.',
  ],
  teacher_unit_planner: [
    'Turn week 1 into detailed lesson steps.',
    'Draft a quick quiz for topic X.',
    'Suggest differentiation ideas for each week.',
  ],
  teacher_data_triage: [
    'Turn this into a small-group intervention plan.',
    'Draft parent messages for struggling students.',
    'Prioritise interventions for the next 7 days.',
  ],
  student_chat: [
    'Ask me one practice question now.',
    'Give me a step-by-step worked example.',
    'Help me choose what to revise tonight.',
  ],
  student_study_help: [
    'Give me one easier warm-up question first.',
    'Now give me a harder follow-up question.',
    'Summarise what I should revise next.',
  ],
  student_study_mode: [
    'Ask me a harder example.',
    'Give me a mixed mini-quiz.',
    'Summarise what I have learned so far.',
  ],
  parent_chat: [
    'Draft a kind message to the teacher.',
    'Suggest a simple home routine.',
    'List two questions for the next check-in.',
  ],
  parent_support_mode: [
    'Draft a kind email to the teacher.',
    'Suggest two meeting questions.',
    'Outline a 1-week support plan at home.',
  ],
};

const TEMP_UNAVAILABLE_MESSAGE = 'Elora Copilot is temporarily unavailable. Please try again shortly.';

type ProviderErrorCategory = 'auth' | 'rate_limit' | 'server' | 'network' | 'invalid_response' | 'unknown';

export interface NormalizedProviderError {
  useCase: UseCase;
  provider: ProviderName;
  model: string;
  phase: 'primary' | 'fallback';
  category: ProviderErrorCategory;
  statusCode?: number;
  isKnownRuntime: boolean;
  message: string;
  raw: unknown;
}

export class LLMTemporarilyUnavailableError extends Error {
  readonly userMessage = TEMP_UNAVAILABLE_MESSAGE;
  readonly details: {
    useCase: UseCase;
    primaryError: NormalizedProviderError;
    fallbackError?: NormalizedProviderError;
  };

  constructor(details: {
    useCase: UseCase;
    primaryError: NormalizedProviderError;
    fallbackError?: NormalizedProviderError;
  }) {
    super('[llm-router] Provider temporarily unavailable');
    this.name = 'LLMTemporarilyUnavailableError';
    this.details = details;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const parseStatusCode = (message: string): number | undefined => {
  const exact = message.match(/\((\d{3})\)/);
  if (exact) {
    return Number(exact[1]);
  }

  const loose = message.match(/\b(4\d\d|5\d\d)\b/);
  if (loose) {
    return Number(loose[1]);
  }

  return undefined;
};

const SUGGESTIONS_PATTERN = /(?:^|\n+)Suggestions:\n((?:\s*[-*]\s*.+\n?)+)$/i;

const hasSuggestionsBlock = (content: string): boolean => SUGGESTIONS_PATTERN.test(content);

const normalizeResponseWhitespace = (content: string): string => {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const normalizeSuggestionsBlock = (content: string): string => {
  const normalized = normalizeResponseWhitespace(content);
  const match = normalized.match(SUGGESTIONS_PATTERN);

  if (!match) {
    return normalized;
  }

  const suggestions = match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);

  if (suggestions.length === 0) {
    return normalized;
  }

  const suggestionStart = typeof match.index === 'number' ? match.index : normalized.length;
  const lead = normalized.slice(0, suggestionStart).trimEnd();

  return [lead, 'Suggestions:', ...suggestions.map((entry) => `- ${entry}`)].join('\n');
};

const stripSuggestionsBlock = (content: string): string => {
  const normalized = normalizeSuggestionsBlock(content);
  const match = normalized.match(SUGGESTIONS_PATTERN);

  if (!match) {
    return normalized;
  }

  const suggestionStart = typeof match.index === 'number' ? match.index : normalized.length;
  return normalized.slice(0, suggestionStart).trimEnd();
};

const isClarificationOnlyTurn = (content: string): boolean => {
  const lower = content.toLowerCase();
  const questionCount = (content.match(/\?/g) || []).length;
  const clarificationSignals = [
    'clarify',
    'which class',
    'which topic',
    'which subject',
    'which subject and level',
    'what specific topic',
    'need more information',
    'need some information',
    'could you share',
    'to create an effective unit plan',
    'to create a comprehensive unit plan',
    'do you want',
    'are you looking for',
    'can you tell me',
    'what you mean by',
    'can you provide more context',
    'is this for',
    'what is on your mind',
    "what's on your mind",
    'what are you most worried about',
    'what are you mainly worried about',
    'which part should we focus on',
    'which area should we focus on',
  ];

  return questionCount >= 1 && clarificationSignals.some((signal) => lower.includes(signal));
};

const appendSuggestionsBlock = ({ useCase, content }: { useCase: UseCase; content: string }): string => {
  const normalizedContent = normalizeSuggestionsBlock(content);

  if (!USE_CASES_REQUIRING_SUGGESTIONS.has(useCase)) {
    return normalizedContent;
  }

  if (isClarificationOnlyTurn(normalizedContent)) {
    return stripSuggestionsBlock(normalizedContent);
  }

  if (hasSuggestionsBlock(normalizedContent)) {
    return normalizedContent;
  }

  const suggestions =
    DEFAULT_SUGGESTIONS_BY_USE_CASE[useCase] ?? [
      'Tell me the next action to take.',
      'Give me a concise checklist for this.',
      'Adapt this for my current context.',
    ];

  const mergedContent = [
    normalizedContent,
    'Suggestions:',
    ...suggestions.slice(0, 3).map((entry) => `- ${entry}`),
  ].join('\n');

  return normalizeSuggestionsBlock(mergedContent);
};

const normalizeProviderError = ({
  error,
  useCase,
  provider,
  model,
  phase,
}: {
  error: unknown;
  useCase: UseCase;
  provider: ProviderName;
  model: string;
  phase: 'primary' | 'fallback';
}): NormalizedProviderError => {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  const statusCode = parseStatusCode(message);

  let category: ProviderErrorCategory = 'unknown';
  if (statusCode === 401 || statusCode === 403 || /unauthorized|forbidden|missing .*api key|invalid .*api key|auth/.test(lower)) {
    category = 'auth';
  } else if (statusCode === 429 || /rate limit|quota|too many requests/.test(lower)) {
    category = 'rate_limit';
  } else if ((statusCode !== undefined && statusCode >= 500) || /timeout|timed out|econnreset|fetch failed|network|service unavailable|bad gateway/.test(lower)) {
    category = 'server';
  } else if (/empty response content|invalid response|malformed/.test(lower)) {
    category = 'invalid_response';
  }

  const isKnownRuntime = category !== 'unknown';

  return {
    useCase,
    provider,
    model,
    phase,
    category,
    statusCode,
    isKnownRuntime,
    message,
    raw: error,
  };
};

const shouldTryFallback = ({
  useCase,
  error,
}: {
  useCase: UseCase;
  error: NormalizedProviderError;
}): boolean => {
  // If a fallback is configured, always attempt it.
  // Critical use cases should fail soft whenever possible.
  void error;
  if (CRITICAL_RUNTIME_FALLBACK_USE_CASES.has(useCase)) {
    return true;
  }

  return true;
};

const normalizeMessages = (messages: LLMMessage[]): LLMMessage[] => {
  return messages
    .filter((message) => typeof message.content === 'string' && message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
};

const parseUserProfile = (context: Record<string, unknown> | undefined): UserProfile | undefined => {
  if (!context || !isRecord(context.userProfile)) {
    return undefined;
  }

  const profile = context.userProfile;
  const level = typeof profile.level === 'string' ? profile.level.trim() : undefined;
  const subjects = Array.isArray(profile.subjects)
    ? profile.subjects.filter((subject): subject is string => typeof subject === 'string').map((subject) => subject.trim()).filter(Boolean)
    : undefined;

  if (!level && (!subjects || subjects.length === 0)) {
    return undefined;
  }

  return {
    level,
    subjects,
  };
};

const loadStudentMemory = ({
  role,
  userId,
}: {
  role: UserRole;
  userId?: string;
}): StudentMemory | undefined => {
  if (role !== 'student' || typeof userId !== 'string' || userId.trim().length === 0) {
    return undefined;
  }

  try {
    return getStudentMemory(userId.trim()) ?? undefined;
  } catch (error) {
    console.warn('[llm-router] student memory load failed', {
      role,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
};

export async function llmRouter({
  role,
  useCase,
  messages,
  userId,
  context,
}: {
  role: UserRole;
  useCase: UseCase;
  messages: LLMMessage[];
  userId?: string;
  context?: Record<string, any>;
}): Promise<LLMResponse> {
  const config = USE_CASE_CONFIG[useCase];
  if (!config) {
    throw new Error(`[llm-router] Unknown useCase: ${useCase}`);
  }

  const cleanedMessages = normalizeMessages(messages);
  if (cleanedMessages.length === 0) {
    throw new Error('[llm-router] At least one message is required');
  }

  const normalizedContext = isRecord(context) ? { ...context } : {};
  const userProfile = parseUserProfile(normalizedContext);
  const studentMemory = loadStudentMemory({ role, userId });
  if (studentMemory) {
    normalizedContext.userMemory = studentMemory;
  }

  const systemPrompt = buildSystemPrompt({
    role,
    useCase,
    userProfile,
    userMemory: studentMemory,
  });

  const fullMessages: LLMMessage[] = [{ role: 'system', content: systemPrompt }, ...cleanedMessages];
  let activeProvider = config.provider;
  let activeModel = config.model;
  let response: LLMResponse;

  try {
    const providerCaller = PROVIDER_CALLS[config.provider];
    response = await providerCaller({
      model: config.model,
      messages: fullMessages,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });
  } catch (primaryError) {
    const normalizedPrimaryError = normalizeProviderError({
      error: primaryError,
      useCase,
      provider: config.provider,
      model: config.model,
      phase: 'primary',
    });

    const fallback = FALLBACK_CONFIG[useCase];
    const canUseFallback =
      Boolean(fallback) && shouldTryFallback({ useCase, error: normalizedPrimaryError });

    if (!canUseFallback || !fallback) {
      console.error('[llm-router] provider call failed without fallback', normalizedPrimaryError);
      throw new LLMTemporarilyUnavailableError({
        useCase,
        primaryError: normalizedPrimaryError,
      });
    }

    console.warn('[llm-router] primary provider failed, using fallback provider', {
      useCase,
      primaryProvider: config.provider,
      fallbackProvider: fallback.provider,
      error: normalizedPrimaryError.message,
      category: normalizedPrimaryError.category,
    });

    try {
      const fallbackCaller = PROVIDER_CALLS[fallback.provider];
      response = await fallbackCaller({
        model: fallback.model,
        messages: fullMessages,
        maxTokens: fallback.maxTokens,
        temperature: fallback.temperature,
      });
    } catch (fallbackError) {
      const normalizedFallbackError = normalizeProviderError({
        error: fallbackError,
        useCase,
        provider: fallback.provider,
        model: fallback.model,
        phase: 'fallback',
      });

      console.error('[llm-router] fallback provider also failed', {
        useCase,
        primaryError: normalizedPrimaryError,
        fallbackError: normalizedFallbackError,
      });

      throw new LLMTemporarilyUnavailableError({
        useCase,
        primaryError: normalizedPrimaryError,
        fallbackError: normalizedFallbackError,
      });
    }

    activeProvider = fallback.provider;
    activeModel = fallback.model;
  }

  response = {
    ...response,
    content: appendSuggestionsBlock({
      useCase,
      content: response.content,
    }),
  };

  try {
    await logLLMUsage({
      userId,
      role,
      useCase,
      provider: activeProvider,
      model: activeModel,
      timestamp: new Date(),
      inputMessages: cleanedMessages,
      output: response.content,
    });
  } catch (error) {
    console.warn('[llm-router] logLLMUsage failed', {
      useCase,
      role,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    await updateUserMemory({
      userId,
      role,
      useCase,
      inputMessages: cleanedMessages,
      userProfile,
    });
  } catch (error) {
    console.warn('[llm-router] updateUserMemory failed', {
      useCase,
      role,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return response;
}
