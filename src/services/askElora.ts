import { callEloraCopilot } from '../lib/api/eloraCopilotClient';
import type { LLMMessage, UseCase } from '../lib/llm/types';
import { getAuthHeaders } from './dataService';

const DEFAULT_USE_CASE_BY_ROLE: Record<'teacher' | 'student' | 'parent', UseCase> = {
  teacher: 'teacher_chat',
  student: 'student_chat',
  parent: 'parent_chat',
};

export interface AskEloraOptions {
  message: string;
  role: 'teacher' | 'student' | 'parent';
  useCase?: UseCase;
  context?: string;
  contextMeta?: {
    isDemo?: boolean;
    dashboardSource?: string | null;
    roleContextId?: string | null;
    roleContextLabel?: string | null;
    selectedClassId?: string | null;
    selectedClassName?: string | null;
    selectedStudentId?: string | null;
    selectedStudentName?: string | null;
    selectedChildId?: string | null;
    selectedChildName?: string | null;
    selectedSubject?: string | null;
  };
  isFirstMessage?: boolean;
  recentUserPrompts?: string[];
  lastSelectedClassId?: string | null;
  lastSelectedStudentId?: string | null;
  conversationId?: string | null;
}

const truncate = (value: string, max: number): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 3)}...`;
};

const buildUserProfileHint = (role: AskEloraOptions['role'], contextMeta: AskEloraOptions['contextMeta']) => {
  if (!contextMeta) {
    return undefined;
  }

  const subjects = [contextMeta.selectedSubject, contextMeta.selectedClassName]
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && !/^all\b/i.test(entry));

  const uniqueSubjects = [...new Set(subjects)].slice(0, 3);

  let level: string | undefined;
  if (role === 'student') {
    level = contextMeta.roleContextLabel ?? undefined;
  } else if (role === 'parent') {
    level = contextMeta.selectedChildName ?? undefined;
  }

  if (!level && uniqueSubjects.length === 0) {
    return undefined;
  }

  return {
    level,
    subjects: uniqueSubjects.length > 0 ? uniqueSubjects : undefined,
  };
};

const buildMessages = ({
  message,
  context,
  recentUserPrompts,
}: {
  message: string;
  context?: string;
  recentUserPrompts?: string[];
}): LLMMessage[] => {
  const messages: LLMMessage[] = [];
  const contextText = typeof context === 'string' ? truncate(context, 900) : '';

  if (contextText) {
    messages.push({
      role: 'user',
      content: `Context snapshot (use to personalize response): ${contextText}`,
    });
  }

  const normalizedRecentPrompts = Array.isArray(recentUserPrompts)
    ? recentUserPrompts
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => truncate(entry, 140))
        .filter(Boolean)
        .slice(-3)
    : [];

  if (normalizedRecentPrompts.length > 0) {
    messages.push({
      role: 'user',
      content: `Recent user intents in this conversation: ${normalizedRecentPrompts.join('; ')}`,
    });
  }

  messages.push({
    role: 'user',
    content: truncate(message, 1200),
  });

  return messages;
};

const callLegacyAskEndpoint = async (payload: {
  message: string;
  role: AskEloraOptions['role'];
  useCase?: UseCase;
  context?: string;
  contextMeta?: AskEloraOptions['contextMeta'];
  isFirstMessage?: boolean;
  recentUserPrompts?: string[];
  lastSelectedClassId?: string | null;
  lastSelectedStudentId?: string | null;
  conversationId?: string | null;
}): Promise<string> => {
  const authHeaders = getAuthHeaders();
  const response = await fetch('/api/ai/ask', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: payload.message,
      role: payload.role,
      useCase: payload.useCase,
      context: payload.context,
      contextMeta: payload.contextMeta,
      isFirstMessage: payload.isFirstMessage,
      recentUserPrompts: payload.recentUserPrompts,
      lastSelectedClassId: payload.lastSelectedClassId,
      lastSelectedStudentId: payload.lastSelectedStudentId,
      conversationId: payload.conversationId,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to get suggestion from Elora. Status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData?.error === 'string') {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignore JSON parse failures on error responses.
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (typeof data?.text === 'string' && data.text.trim()) {
    return data.text;
  }

  throw new Error('Elora Copilot returned an empty response.');
};

export async function askElora({
  message,
  role,
  useCase,
  context,
  contextMeta,
  isFirstMessage,
  recentUserPrompts,
  lastSelectedClassId,
  lastSelectedStudentId,
  conversationId,
}: AskEloraOptions): Promise<string> {
  const resolvedUseCase = useCase ?? DEFAULT_USE_CASE_BY_ROLE[role];

  try {
    const content = await callEloraCopilot({
      role,
      useCase: resolvedUseCase,
      messages: buildMessages({
        message,
        context,
        recentUserPrompts,
      }),
      context: {
        contextMeta,
        isFirstMessage,
        lastSelectedClassId,
        lastSelectedStudentId,
        conversationId,
        userProfile: buildUserProfileHint(role, contextMeta),
      },
    });

    return content || 'No suggestion generated.';
  } catch (error) {
    console.warn('Primary /api/llm request failed, using /api/ai/ask fallback.', error);

    return callLegacyAskEndpoint({
      message,
      role,
      useCase: resolvedUseCase,
      context,
      contextMeta,
      isFirstMessage,
      recentUserPrompts,
      lastSelectedClassId,
      lastSelectedStudentId,
      conversationId,
    });
  }
}
