import { callEloraCopilot } from '../lib/api/eloraCopilotClient';
import type { LLMMessage, UseCase, GuardianAuditEvent } from '../lib/llm/types';
import { getAuthHeaders } from './dataService';
import { settingsService } from './settingsService';
import { normalizeReferenceMentions, parseReferenceMentions } from '../lib/mentions/referenceMentions';
import type { ReferenceMention, CopilotFileAttachment } from '../lib/llm/types';

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
    role?: 'teacher' | 'student' | 'parent';
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
  isHomework?: boolean;
  guardrails?: {
    requireWarmup?: boolean;
    negativeSelfTalkDetected?: boolean;
  };
  referenceMentions?: ReferenceMention[];
  fileAttachments?: CopilotFileAttachment[];
  helpAbuseCount?: number;
}

const truncate = (value: string, max: number): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 3)}...`;
};

export const detectStudentMode = (params: { message?: string; recentUserPrompts?: string[]; isFirstMessage?: boolean; role?: string }) => {
  const { message = '', recentUserPrompts, isFirstMessage, role } = params;
  const candidate = (message || '').trim();
  const recent = Array.isArray(recentUserPrompts) ? recentUserPrompts.slice(-3).join(' ') : '';
  if (role !== 'student') return null;
  if (isFirstMessage || (!candidate || candidate.length < 8)) return 'exploratory';
  if (/just tell me|just the answer|give me the answer|i need the answer/i.test(candidate)) return 'firmness';
  if (candidate.split(/\s+/).length <= 6 && /\b(idk|i don'?t know|stuck)\b/i.test(candidate)) return 'details';
  if (candidate.split(/\s+/).length > 10 || /because|therefore|so that|since|because of/i.test(candidate + ' ' + recent)) return 'dig_deeper';
  if (/i think i get it|that makes sense|i understand|thanks,? that helps/i.test(recent + ' ' + candidate)) return 'wrap_up';
  return 'exploratory';
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
  isHomework?: boolean;
  referenceMentions?: ReferenceMention[];
  fileAttachments?: CopilotFileAttachment[];
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
      isHomework: payload.isHomework,
      referenceMentions: payload.referenceMentions,
      fileAttachments: payload.fileAttachments,
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
  isHomework,
  guardrails,
  referenceMentions,
  fileAttachments,
}: AskEloraOptions): Promise<string> {
  const resolvedUseCase = useCase ?? DEFAULT_USE_CASE_BY_ROLE[role];
  const normalizedMentions = normalizeReferenceMentions(referenceMentions);
  const inferredMentions = normalizedMentions.length > 0 ? normalizedMentions : parseReferenceMentions(message);

  try {
    const baseMessages = buildMessages({
      message,
      context,
      recentUserPrompts,
    });

    // Read local user settings (stored per-role) and add a subtle system hint
    // so the assistant can respect explanation length, tone, and label preferences.
    let messagesToSend = baseMessages;
    try {
      const userSettings = settingsService.getSettings(role as any);
      if (userSettings?.copilotPreferences) {
        const pref = userSettings.copilotPreferences;
        const systemHintParts: string[] = [];
        systemHintParts.push(`User preference: explanation length = ${pref.explanationLength}.`);
        systemHintParts.push(`Tone preference = ${pref.tone}.`);
        systemHintParts.push(`Show step labels = ${pref.showStepLabels ? 'yes' : 'no'}.`);
        const systemHint = `Preference hint for assistive responses: ${systemHintParts.join(' ')}`;
        messagesToSend = [
          { role: 'system', content: systemHint },
          ...baseMessages,
        ];
      }
    } catch (err) {
      // Non-fatal: if settings can't be read, proceed with defaults.
      console.warn('Could not read user settings for Copilot preferences', err);
    }

    // Build a lightweight CopilotContextSummary to help the LLM anchor to sources.
    const buildCopilotContextSummary = () => {
      const snippets = [];
      if (Array.isArray(fileAttachments)) {
        for (const f of fileAttachments) {
          snippets.push({ id: f.id, label: f.name, type: 'file' });
        }
      }
      if (Array.isArray(inferredMentions) && inferredMentions.length > 0) {
        for (const m of inferredMentions.slice(0, 6)) {
          snippets.push({ id: m.value || m.raw, label: m.label || m.raw, type: (m.type === 'question' ? 'question' : m.type === 'assignment' ? 'assignment' : 'resource') });
        }
      }

      const detectedMode = detectStudentMode({ message, recentUserPrompts, isFirstMessage, role });

      return {
        role: role,
        activeAssignmentId: contextMeta?.roleContextId ?? null,
        activeQuestionId: null,
        sourceSnippets: snippets,
        studentQuestionMode: detectedMode,
      };
    };

    const copilotContextSummary = buildCopilotContextSummary();

    const smallIsGreeting = (text?: string) => {
      if (!text || typeof text !== 'string') return false;
      const cleaned = text.replace(/[!,.?;:\-()"']/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!cleaned) return false;
      if (cleaned.split(' ').length > 6) return false;
      if (/\b(help|solve|question|quiz|worksheet|assignment|plan|create)\b/i.test(cleaned)) return false;
      return /^(hi|hello|hey|yo|hi there|hello there|how are you|how's it going|how is it going)\b/.test(cleaned);
    };

    const normalizeIntentText = (text?: string) => {
      if (!text || typeof text !== 'string') return '';
      return text.replace(/[!,.?;:\-()"']/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    };

    const smallIsCapabilityQuery = (text?: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const cleaned = text
        .replace(/[!,.?;:\-()"']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      if (cleaned.length === 0) return false;
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length > 8) return false;
      const capabilityPatterns = /\b(can you|what can|do you|how can|what are you|what do you|are you able|capabilities?|help me|what is elora|who are you)\b/i;
      if (!capabilityPatterns.test(cleaned)) return false;
      const taskish = /\b(explain this|this topic|this file|this assignment|this question|solve|create quiz|create a quiz|create lesson|draft|differentiate|summarize|simplify)\b/i;
      if (taskish.test(cleaned)) return false;
      return true;
    };

    const smallIsGenericHelp = (text?: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const cleaned = text.replace(/[!,.?;:\-()"']/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!cleaned) return false;
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length > 10) return false;
      if (/^help$|^help me$|^i'?m stuck$|^i am stuck$|^i need help$|\bstuck\b/i.test(cleaned)) return true;
      if (/(\bhelp\b|\bstuck\b|\bneed help\b)/i.test(cleaned) && !/\b(explain|solve|create|draft|summarize|quiz|assignment|question|plan)\b/i.test(cleaned)) {
        return words.length <= 8;
      }
      return false;
    };

    const smallIsStudyPlanning = (text?: string): boolean => {
      const cleaned = normalizeIntentText(text);
      if (!cleaned) return false;
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length > 24) return false;
      const patterns = [
        /\bstudy plan\b/i,
        /\brevision plan\b/i,
        /\bstudy schedule\b/i,
        /\brevision schedule\b/i,
        /\bstudy timetable\b/i,
        /\brevision timetable\b/i,
        /\bstudy calendar\b/i,
        /\bplan (my|our|a) (study|revision)\b/i,
        /\bplan (for|my) (exam|test|finals|assessment)\b/i,
        /\bspaced repetition\b/i,
        /\bretrieval practice\b/i,
      ];
      return patterns.some((pattern) => pattern.test(cleaned));
    };

    const smallIsQuizGeneration = (text?: string): boolean => {
      const cleaned = normalizeIntentText(text);
      if (!cleaned) return false;
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length > 24) return false;
      const patterns = [
        /\bcreate (a )?quiz\b/i,
        /\bmake (a )?quiz\b/i,
        /\bgenerate (a )?quiz\b/i,
        /\bquiz me\b/i,
        /\btest me\b/i,
        /\bask me (a|some)? questions\b/i,
        /\bgive me (some )?(practice )?questions\b/i,
        /^(practice questions|practice quiz|mock test)\b/i,
        /\bpractice (quiz|test)\b/i,
      ];
      return patterns.some((pattern) => pattern.test(cleaned));
    };

    const smallIsReviewMyAttempt = (text?: string): boolean => {
      const cleaned = normalizeIntentText(text);
      if (!cleaned) return false;
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length > 40) return false;
      const patterns = [
        /\bhere('?s| is) my (answer|attempt|work|working|solution)\b/i,
        /\bhere('?s| is) what i got\b/i,
        /\bmy (answer|attempt|work|working|solution)\b/i,
        /\b(can you|could you|please) (check|review|look at) (my|this) (answer|work|attempt|solution)\b/i,
      ];
      if (patterns.some((pattern) => pattern.test(cleaned))) return true;
      if (/\bi think (it'?s|it is)\b/i.test(cleaned) && /\b(because|since|so)\b/i.test(cleaned)) return true;
      return false;
    };

    const smallIsLessonPlanning = (text?: string): boolean => {
      const cleaned = normalizeIntentText(text);
      if (!cleaned) return false;
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length > 24) return false;
      const patterns = [
        /\blesson plan\b/i,
        /\bplan (a|my|our) lesson\b/i,
        /\bplan (a|my|our) unit\b/i,
        /\bunit plan\b/i,
        /\blesson outline\b/i,
        /\bunit outline\b/i,
        /\bdesign (a|an) (lesson|activity)\b/i,
        /\bcreate (a|an) lesson\b/i,
      ];
      return patterns.some((pattern) => pattern.test(cleaned));
    };

    const smallIsReportExplanation = (text?: string): boolean => {
      const cleaned = normalizeIntentText(text);
      if (!cleaned) return false;
      const words = cleaned.split(' ').filter(Boolean);
      if (words.length > 28) return false;
      const patterns = [
        /\bexplain this report\b/i,
        /\bexplain this report card\b/i,
        /\bexplain this grade\b/i,
        /\bexplain this progress report\b/i,
        /\bhelp me understand (this|the)?\s*(report card|progress report|report|grade|grades)\b/i,
        /\bwhat does this (grade|report) mean\b/i,
        /\binterpret (this|the) report\b/i,
        /\bexplain this (iep|504)\b/i,
      ];
      return patterns.some((pattern) => pattern.test(cleaned));
    };

    const contextSources = Array.isArray(copilotContextSummary?.sourceSnippets)
      ? copilotContextSummary.sourceSnippets.map((s) => ({ id: s.id, label: s.label, type: s.type }))
      : [];

    const userNameFallback = contextMeta?.selectedStudentName || contextMeta?.selectedChildName || 'there';

    const content = await callEloraCopilot({
      role,
      useCase: resolvedUseCase,
      messages: messagesToSend,
      context: {
        role,
        userName: userNameFallback,
        isGreeting: smallIsGreeting(message),
        isCapabilityQuery: smallIsCapabilityQuery(message),
        isGenericHelp: smallIsGenericHelp(message),
        isStudyPlanning: smallIsStudyPlanning(message),
        isQuizGeneration: smallIsQuizGeneration(message),
        isReviewMyAttempt: smallIsReviewMyAttempt(message),
        isLessonPlanning: smallIsLessonPlanning(message),
        isReportExplanation: smallIsReportExplanation(message),
        contextSources,
        contextMeta,
        isFirstMessage,
        lastSelectedClassId,
        lastSelectedStudentId,
        conversationId,
        helpAbuseCount: typeof (arguments[0] as any)?.helpAbuseCount === 'number' ? (arguments[0] as any).helpAbuseCount : undefined,
        isHomework,
        userProfile: buildUserProfileHint(role, contextMeta),
        guardrails,
        referenceMentions: inferredMentions,
        fileAttachments,
        copilotContextSummary,
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
      isHomework,
      referenceMentions: inferredMentions,
      fileAttachments,
    });
  }
}

// Guardian Agent stub for audit logging
export function logGuardianEvent(event: GuardianAuditEvent): void {
  // Stub: for now, log to console. Future work: send to backend telemetry.
  console.debug('[Guardian]', event.category, event.message, event);
}
