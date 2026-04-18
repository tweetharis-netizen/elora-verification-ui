import { getStudentMemory, setStudentMemory } from '../../server/memory/studentMemoryStore.js';
import type { LLMMessage, ProviderName, UseCase, UserProfile, UserRole } from './types.js';
import type { CopilotFeedbackPayload } from './types.js';

export interface LLMUsageLogArgs {
  userId?: string;
  role: UserRole;
  useCase: UseCase;
  provider: ProviderName;
  model: string;
  timestamp: Date;
  inputMessages: LLMMessage[];
  output: string;
}

export interface UserMemoryUpdateArgs {
  userId?: string;
  role: UserRole;
  useCase: UseCase;
  inputMessages: LLMMessage[];
  userProfile?: UserProfile;
}

const SUGGESTIONS_BLOCK_PATTERN = /\n?Suggestions:\n((?:\s*[-*]\s*.+\n?)+)$/i;

const TOPIC_KEYWORDS: Array<{ topic: string; keywords: string[] }> = [
  { topic: 'algebra', keywords: ['algebra', 'factorisation', 'quadratic', 'simultaneous equation'] },
  { topic: 'fractions', keywords: ['fractions', 'fraction', 'numerator', 'denominator'] },
  { topic: 'geometry', keywords: ['geometry', 'angles', 'triangles', 'circles', 'area', 'volume'] },
  { topic: 'calculus', keywords: ['calculus', 'derivative', 'integration', 'integral', 'differentiate'] },
  { topic: 'statistics', keywords: ['statistics', 'probability', 'mean', 'median', 'mode', 'data'] },
  { topic: 'physics', keywords: ['physics', 'force', 'motion', 'kinematics', 'acceleration'] },
  { topic: 'chemistry', keywords: ['chemistry', 'mole', 'reaction', 'acid', 'base', 'periodic'] },
  { topic: 'biology', keywords: ['biology', 'cell', 'photosynthesis', 'genetics', 'ecosystem'] },
  { topic: 'essay writing', keywords: ['essay', 'thesis', 'paragraph', 'introduction', 'conclusion'] },
  { topic: 'reading comprehension', keywords: ['comprehension', 'inference', 'passage', 'summary'] },
];

const TOPIC_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'at',
  'be',
  'can',
  'do',
  'for',
  'from',
  'help',
  'i',
  'in',
  'is',
  'it',
  'let',
  'me',
  'my',
  'of',
  'on',
  'or',
  'please',
  'practice',
  'session',
  'start',
  'study',
  'the',
  'this',
  'to',
  'want',
  'with',
]);

const truncate = (value: string, max: number): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 3)}...`;
};

export const deriveTopicFromMessages = (messages: LLMMessage[]): string | null => {
  let lastUserMessage = '';

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== 'user') {
      continue;
    }

    const trimmed = message.content.trim();
    if (!trimmed) {
      continue;
    }

    lastUserMessage = trimmed;
    break;
  }

  if (!lastUserMessage) {
    return null;
  }

  const lower = lastUserMessage.toLowerCase();
  for (const candidate of TOPIC_KEYWORDS) {
    if (candidate.keywords.some((keyword) => lower.includes(keyword))) {
      return candidate.topic;
    }
  }

  const nounishTokens = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .filter((token) => !TOPIC_STOP_WORDS.has(token));

  if (nounishTokens.length > 0) {
    return truncate(nounishTokens.slice(0, 3).join(' '), 80);
  }

  const sentence = lastUserMessage.split(/[\n.!?]/)[0] ?? lastUserMessage;
  return truncate(sentence, 100);
};

const normalizeSubjects = (subjects: unknown): string[] | undefined => {
  if (!Array.isArray(subjects)) {
    return undefined;
  }

  const cleaned = subjects
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    return undefined;
  }

  return [...new Set(cleaned)];
};

const appendTopic = (existingTopics: string[] | undefined, nextTopic: string | null): string[] | undefined => {
  const current = (existingTopics ?? [])
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!nextTopic) {
    return current.length > 0 ? current.slice(-10) : undefined;
  }

  const normalizedTopic = nextTopic.trim();
  if (!normalizedTopic) {
    return current.length > 0 ? current.slice(-10) : undefined;
  }

  const deduped = current.filter((entry) => entry.toLowerCase() !== normalizedTopic.toLowerCase());
  deduped.push(normalizedTopic);
  return deduped.slice(-10);
};

export async function logLLMUsage(args: LLMUsageLogArgs): Promise<void> {
  try {
    const safeInputMessages = Array.isArray(args.inputMessages) ? args.inputMessages : [];
    const combinedUserInput = safeInputMessages
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
      .join(' | ');

    const payload = {
      timestamp: args.timestamp.toISOString(),
      userId: args.userId ?? null,
      role: args.role,
      useCase: args.useCase,
      provider: args.provider,
      model: args.model,
      inputPreview: truncate(combinedUserInput, 200),
      outputPreview: truncate(args.output || '', 200),
      hadSuggestionsBlock: SUGGESTIONS_BLOCK_PATTERN.test(args.output || ''),
    };

    console.log('[llm-usage]', JSON.stringify(payload));
  } catch (error) {
    console.warn('[llm-usage] logging failed', {
      userId: args.userId ?? null,
      role: args.role,
      useCase: args.useCase,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function updateUserMemory(args: UserMemoryUpdateArgs): Promise<void> {
  try {
    if (args.role !== 'student') {
      return;
    }

    const normalizedUserId = typeof args.userId === 'string' ? args.userId.trim() : '';
    if (!normalizedUserId) {
      return;
    }

    const derivedTopic = deriveTopicFromMessages(args.inputMessages);
    const existing = getStudentMemory(normalizedUserId);

    const mergedSubjects =
      normalizeSubjects(args.userProfile?.subjects) ??
      normalizeSubjects(existing?.subjects);

    const mergedLevel = typeof args.userProfile?.level === 'string' && args.userProfile.level.trim().length > 0
      ? args.userProfile.level.trim()
      : existing?.level;

    const nextMemory = {
      userId: normalizedUserId,
      level: mergedLevel,
      subjects: mergedSubjects,
      lastTopics: appendTopic(existing?.lastTopics, derivedTopic),
      lastUpdatedAt: new Date().toISOString(),
    };

    setStudentMemory(nextMemory);

    console.log(
      '[llm-memory-hook]',
      JSON.stringify({
        userId: normalizedUserId,
        role: args.role,
        useCase: args.useCase,
        level: nextMemory.level ?? null,
        subjects: nextMemory.subjects ?? [],
        lastTopics: nextMemory.lastTopics ?? [],
      })
    );
  } catch (error) {
    console.warn('[llm-memory-hook] update failed', {
      userId: args.userId ?? null,
      role: args.role,
      useCase: args.useCase,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function logCopilotFeedback(feedback: CopilotFeedbackPayload): void {
  try {
    const preview = {
      ...feedback,
      comment: feedback.comment ? feedback.comment.slice(0, 200) : undefined,
    };
    console.log('[CopilotFeedback]', JSON.stringify(preview));
  } catch (error) {
    console.error('[CopilotFeedbackError]', error);
  }
}
