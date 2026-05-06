import { callGemini } from './providers/gemini.js';
import { callGroq } from './providers/groq.js';
import { callOpenRouter } from './providers/openrouter.js';
import type { LLMMessage, ProviderName, UseCase, UserRole } from './types.js';

export type StudentCopilotGuardrails = {
  requireWarmup?: boolean;
  negativeSelfTalkDetected?: boolean;
};

export type StudentCopilotReviewContext = {
  role: UserRole;
  useCase: UseCase;
  guardrails?: StudentCopilotGuardrails;
  conversationId?: string | null;
  usedFallback?: boolean;
  isHomework?: boolean;
};

export type StudentCopilotReviewOutcome = 'ok' | 'edited' | 'fallback' | 'error';

export type StudentCopilotReviewResult = {
  reviewUsed: boolean;
  reviewOutcome: StudentCopilotReviewOutcome;
  isSafe: boolean;
  adjustedReply: string;
  providerUsed?: ProviderName | 'mock';
  remarks?: string;
};

export type StudentReviewOutcome = StudentCopilotReviewOutcome;
export type StudentReviewResult = StudentCopilotReviewResult;

const SAFE_FALLBACK_REPLY = "I'm having trouble giving a reliable explanation. Let's try a simpler version or focus on examples.";

export const STUDENT_REVIEW_SAFE_FALLBACK_REPLY = SAFE_FALLBACK_REPLY;

const REVIEWED_USE_CASES = new Set<UseCase>([
  'student_chat',
  'student_study_help',
  'student_study_mode',
]);

const REVIEW_PROVIDER_ENV = (process.env.ELORA_REVIEW_PROVIDER || '').trim().toLowerCase();

const normalizeReply = (value: string): string => value.replace(/\r\n/g, '\n').trim();

const extractJsonObject = (value: string): string | null => {
  const trimmed = normalizeReply(value);
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return null;
  }
  return candidate.slice(start, end + 1);
};

const parseVerdict = (content: string): { isSafe: boolean; adjustedReply?: string; remarks?: string } | null => {
  const jsonText = extractJsonObject(content);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const isSafe = parsed.isSafe === true;
    const adjustedReply = typeof parsed.adjustedReply === 'string' && parsed.adjustedReply.trim().length > 0
      ? parsed.adjustedReply.trim()
      : undefined;
    const remarks = typeof parsed.remarks === 'string' && parsed.remarks.trim().length > 0
      ? parsed.remarks.trim()
      : undefined;

    return { isSafe, adjustedReply, remarks };
  } catch {
    return null;
  }
};

const buildReviewMessages = ({
  candidateReply,
  context,
}: {
  candidateReply: string;
  context: StudentCopilotReviewContext;
}): LLMMessage[] => {
  const guardrailNotes = [
    context.guardrails?.requireWarmup ? 'A warmup response is required before any full explanation.' : null,
    context.guardrails?.negativeSelfTalkDetected ? 'The student needs a gentle, encouraging tone.' : null,
    context.usedFallback ? 'The upstream answer already used a fallback path, so be extra conservative.' : null,
    context.isHomework ? 'This is homework-linked content. Do not leak a final answer; keep the response hint-based.' : null,
  ]
    .filter((note): note is string => Boolean(note))
    .join(' ');

  return [
    {
      role: 'system',
      content: [
        'You are a strict reviewer for a student tutoring assistant.',
        'Return JSON only in this exact shape: {"isSafe":boolean,"adjustedReply":string,"remarks":string}.',
        'If the reply is safe and aligned, keep adjustedReply as the original reply or a lightly edited equivalent.',
        'If the reply is unsafe, too specific, emotionally harmful, skips a required warmup, or reveals a homework answer, set isSafe to false and provide a safer adjustedReply.',
        'If homework content leaks a final answer, rewrite it into a hint instead.',
        'Never include markdown outside the JSON object.',
        guardrailNotes ? `Guardrails: ${guardrailNotes}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    },
    {
      role: 'user',
      content: [
        `Role: ${context.role}`,
        `Use case: ${context.useCase}`,
        `Conversation: ${context.conversationId ?? 'n/a'}`,
        `Homework-linked: ${context.isHomework === true ? 'yes' : 'no'}`,
        'Candidate reply:',
        candidateReply,
      ].join('\n'),
    },
  ];
};

const HOMEWORK_HINT = 'Now use these steps to work out the final answer yourself.';

const HOMEWORK_LEAK_PATTERNS = [
  /(?:^|[\n.?!]\s*)(?:the\s+)?(?:final\s+)?answer\s+is\s+[^\n.?!]+/i,
  /(?:^|[\n.?!]\s*)(?:the\s+)?correct\s+answer\s+is\s+[^\n.?!]+/i,
  /(?:^|[\n.?!]\s*)(?:the\s+)?result\s+is\s+[^\n.?!]+/i,
  /(?:^|[\n.?!]\s*)(?:therefore|so|thus|hence)[,:\s]+(?:the\s+)?(?:final\s+)?answer\s+is\s+[^\n.?!]+/i,
  /(?:^|[\n.?!]\s*)(?:therefore|so|thus|hence)[,:\s]+[a-z][a-z0-9_]*\s*=\s*[^\n.?!]+/i,
  /(?:^|[\n.?!]\s*)[a-z][a-z0-9_]*\s*=\s*[^\n.?!]+/i,
  /(?:^|[\n.?!]\s*)answer\s*:\s*[^\n.?!]+/i,
];

const isHomeworkAnswerLeak = (value: string): boolean => {
  const normalized = normalizeReply(value);
  return HOMEWORK_LEAK_PATTERNS.some((pattern) => pattern.test(normalized));
};

const rewriteHomeworkAnswerLeak = (value: string): { content: string; changed: boolean } => {
  const normalized = normalizeReply(value);
  const rewriteRules: Array<{ pattern: RegExp; replacement: string }> = [
    {
      pattern: /(?:^|[\n.?!]\s*)(?:the\s+)?(?:final\s+)?answer\s+is\s+[^\n.?!]+[.?!]?\s*/gi,
      replacement: HOMEWORK_HINT,
    },
    {
      pattern: /(?:^|[\n.?!]\s*)(?:the\s+)?correct\s+answer\s+is\s+[^\n.?!]+[.?!]?\s*/gi,
      replacement: HOMEWORK_HINT,
    },
    {
      pattern: /(?:^|[\n.?!]\s*)(?:the\s+)?result\s+is\s+[^\n.?!]+[.?!]?\s*/gi,
      replacement: HOMEWORK_HINT,
    },
    {
      pattern: /(?:^|[\n.?!]\s*)(?:therefore|so|thus|hence)[,:\s]+(?:the\s+)?(?:final\s+)?answer\s+is\s+[^\n.?!]+[.?!]?\s*/gi,
      replacement: HOMEWORK_HINT,
    },
    {
      pattern: /(?:^|[\n.?!]\s*)(?:therefore|so|thus|hence)[,:\s]+[a-z][a-z0-9_]*\s*=\s*[^\n.?!]+[.?!]?\s*/gi,
      replacement: HOMEWORK_HINT,
    },
    {
      pattern: /(?:^|[\n.?!]\s*)[a-z][a-z0-9_]*\s*=\s*[^\n.?!]+[.?!]?\s*/gi,
      replacement: HOMEWORK_HINT,
    },
    {
      pattern: /(?:^|[\n.?!]\s*)answer\s*:\s*[^\n.?!]+[.?!]?\s*/gi,
      replacement: HOMEWORK_HINT,
    },
  ];

  let rewritten = normalized;
  for (const { pattern, replacement } of rewriteRules) {
    rewritten = rewritten.replace(pattern, replacement);
  }

  if (rewritten === normalized && isHomeworkAnswerLeak(normalized)) {
    rewritten = `${normalized}\n\n${HOMEWORK_HINT}`.trim();
  }

  rewritten = rewritten.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return {
    content: rewritten,
    changed: rewritten !== normalized,
  };
};

const mockReview = ({
  candidateReply,
  context,
}: {
  candidateReply: string;
  context: StudentCopilotReviewContext;
}): StudentCopilotReviewResult => {
  const normalized = normalizeReply(candidateReply);
  const homeworkLinked = context.isHomework === true;
  const warmupRequired = context.guardrails?.requireWarmup === true;
  const hasWarmupLabel = /^warmup:/i.test(normalized);
  const warmupMissing = warmupRequired && !hasWarmupLabel;
  const negativeToneDetected = /\b(i\s+am\s+stupid|i['’]?m\s+stupid|i\s+give\s+up|i\s+cannot\s+do\s+this|i\s+can['’]?t\s+do\s+this|worthless|useless)\b/i.test(normalized);
  const homeworkLeakDetected = homeworkLinked && isHomeworkAnswerLeak(normalized);

  if (warmupMissing || negativeToneDetected) {
    return {
      reviewUsed: true,
      reviewOutcome: 'fallback',
      isSafe: false,
      adjustedReply: SAFE_FALLBACK_REPLY,
      providerUsed: 'mock',
      remarks: warmupMissing
        ? 'Mock review enforced the warmup requirement.'
        : 'Mock review flagged the reply as unsafe.',
    };
  }

  if (homeworkLeakDetected) {
    const rewritten = rewriteHomeworkAnswerLeak(normalized);

    return {
      reviewUsed: true,
      reviewOutcome: 'edited',
      isSafe: true,
      adjustedReply: rewritten.content,
      providerUsed: 'mock',
      remarks: rewritten.changed
        ? 'Mock review rewrote a homework answer leak into hints.'
        : 'Mock review accepted the reply.',
    };
  }

  const looksUnsafe = /(?:answer\s+is\s+|therefore\s+.*=|so\s+.*=)/i.test(normalized) || /\bi am stupid\b/i.test(normalized);

  if (looksUnsafe) {
    return {
      reviewUsed: true,
      reviewOutcome: 'fallback',
      isSafe: false,
      adjustedReply: SAFE_FALLBACK_REPLY,
      providerUsed: 'mock',
      remarks: 'Mock review flagged the reply as unsafe.',
    };
  }

  return {
    reviewUsed: true,
    reviewOutcome: 'ok',
    isSafe: true,
    adjustedReply: normalized,
    providerUsed: 'mock',
    remarks: 'Mock review accepted the reply.',
  };
};

const callReviewer = async ({
  provider,
  candidateReply,
  context,
}: {
  provider: Exclude<ProviderName, 'cohere'> | 'mock';
  candidateReply: string;
  context: StudentCopilotReviewContext;
}): Promise<StudentCopilotReviewResult> => {
  if (provider === 'mock') {
    return mockReview({ candidateReply, context });
  }

  const modelByProvider: Record<Exclude<ProviderName, 'cohere'>, string> = {
    groq: process.env.ELORA_REVIEW_MODEL_GROQ?.trim() || 'llama-3.1-8b-instant',
    openrouter: process.env.ELORA_REVIEW_MODEL_OPENROUTER?.trim() || 'openai/gpt-4.1-mini',
    gemini: process.env.ELORA_REVIEW_MODEL_GEMINI?.trim() || 'gemini-1.5-flash',
  };

  const messages = buildReviewMessages({ candidateReply, context });
  const model = modelByProvider[provider];
  const temperature = 0;
  const maxTokens = 220;

  const response =
    provider === 'groq'
      ? await callGroq({ model, messages, temperature, maxTokens })
      : provider === 'openrouter'
        ? await callOpenRouter({ model, messages, temperature, maxTokens })
        : await callGemini({ model, messages, temperature, maxTokens });

  const verdict = parseVerdict(response.content);
  if (!verdict) {
    throw new Error(`[student-review] ${provider} returned an invalid verdict`);
  }

  const baseReply = verdict.adjustedReply || candidateReply;

  if (!verdict.isSafe) {
    return {
      reviewUsed: true,
      reviewOutcome: 'fallback',
      isSafe: false,
      adjustedReply: verdict.adjustedReply || SAFE_FALLBACK_REPLY,
      providerUsed: provider,
      remarks: verdict.remarks,
    };
  }

  if (context.isHomework === true && isHomeworkAnswerLeak(baseReply)) {
    const rewritten = rewriteHomeworkAnswerLeak(baseReply);

    return {
      reviewUsed: true,
      reviewOutcome: 'edited',
      isSafe: true,
      adjustedReply: rewritten.content,
      providerUsed: provider,
      remarks: rewritten.changed
        ? [verdict.remarks, 'Homework answer leak rewritten into hints.'].filter(Boolean).join(' ')
        : verdict.remarks,
    };
  }

  return {
    reviewUsed: true,
    reviewOutcome: 'ok',
    isSafe: true,
    adjustedReply: baseReply,
    providerUsed: provider,
    remarks: verdict.remarks,
  };
};

const buildProviderOrder = (primaryProvider?: ProviderName): Array<Exclude<ProviderName, 'cohere'> | 'mock'> => {
  const requested = REVIEW_PROVIDER_ENV;
  const defaultOrder: Array<Exclude<ProviderName, 'cohere'> | 'mock'> = ['groq', 'openrouter', 'gemini'];

  if (requested === 'mock') {
    return ['mock'];
  }

  if (requested === 'groq' || requested === 'openrouter' || requested === 'gemini') {
    return [requested, ...defaultOrder.filter((entry) => entry !== requested)];
  }

  return defaultOrder.filter((entry) => entry !== primaryProvider);
};

export const reviewStudentCopilotReply = async ({
  candidateReply,
  context,
  primaryProvider,
}: {
  candidateReply: string;
  context: StudentCopilotReviewContext;
  primaryProvider?: ProviderName;
}): Promise<StudentCopilotReviewResult> => {
  if (!REVIEWED_USE_CASES.has(context.useCase)) {
    return {
      reviewUsed: false,
      reviewOutcome: 'ok',
      isSafe: true,
      adjustedReply: normalizeReply(candidateReply),
      remarks: 'Review skipped for this use case.',
    };
  }

  const providerOrder = buildProviderOrder(primaryProvider);
  let lastError: unknown;

  for (const provider of providerOrder) {
    try {
      return await callReviewer({ provider, candidateReply, context });
    } catch (error) {
      lastError = error;
      console.warn('[student-review] provider failed', {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const fallback = mockReview({ candidateReply, context });
  return {
    ...fallback,
    reviewOutcome: 'error',
    adjustedReply: fallback.adjustedReply || SAFE_FALLBACK_REPLY,
    remarks: [
      fallback.remarks,
      lastError ? 'Review providers failed, so a safe local fallback was used.' : 'Safe local fallback was used.',
    ]
      .filter(Boolean)
      .join(' '),
  };
};

export { STUDENT_REVIEW_SAFE_FALLBACK_REPLY as SAFE_FALLBACK_REPLY };
