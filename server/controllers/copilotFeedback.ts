import type { Response } from 'express';
import { logCopilotFeedback } from '../../src/lib/llm/hooks.js';
import type {
  CopilotFeedbackPayload,
  CopilotFeedbackRating,
  CopilotFeedbackReason,
  UserRole,
} from '../../src/lib/llm/types.js';
import { updateUserPreferenceSignals } from '../../src/server/memory/copilotPreferenceStore.js';
import type { AuthRequest } from '../middleware/auth.js';
import { recordCopilotFeedback } from '../metrics/copilotMetricsStore.js';

const USER_ROLES: UserRole[] = ['teacher', 'student', 'parent'];
const VALID_REASONS: CopilotFeedbackReason[] = ['not_accurate', 'too_long', 'not_my_level', 'other', 'helpful'];
const DEMO_USER_IDS = new Set(['teacher_1', 'student_1', 'parent_1']);

const normalize = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const isUserRole = (value: string): value is UserRole => {
  return USER_ROLES.includes(value as UserRole);
};

const isRating = (value: string): value is CopilotFeedbackRating => {
  return value === 'up' || value === 'down';
};

const normalizeReason = (value: unknown): CopilotFeedbackReason | undefined => {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  if (VALID_REASONS.includes(normalized as CopilotFeedbackReason)) {
    return normalized as CopilotFeedbackReason;
  }
  return 'other';
};

const normalizeComment = (value: unknown): string | undefined => {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  return normalized.slice(0, 500);
};

const normalizeSource = (value: unknown): string | undefined => {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  return normalized.slice(0, 80);
};

export const submitCopilotFeedbackHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id ?? normalize(req.headers['x-user-id']);
    const authRole = req.user?.role ?? normalize(req.headers['x-user-role']);

    if (!authUserId) {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return;
    }

    if (!isUserRole(authRole)) {
      res.status(400).json({ ok: false, error: 'Invalid role.' });
      return;
    }

    const useCase = normalize(req.body?.useCase);
    const messageId = normalize(req.body?.messageId);
    const threadId = normalize(req.body?.threadId) || undefined;
    const ratingRaw = normalize(req.body?.rating);

    if (!useCase) {
      res.status(400).json({ ok: false, error: 'useCase is required.' });
      return;
    }

    if (!messageId) {
      res.status(400).json({ ok: false, error: 'messageId is required.' });
      return;
    }

    if (!isRating(ratingRaw)) {
      res.status(400).json({ ok: false, error: "rating must be 'up' or 'down'." });
      return;
    }

    const feedback: CopilotFeedbackPayload = {
      userId: authUserId,
      role: authRole,
      useCase,
      messageId,
      threadId,
      rating: ratingRaw,
      reason: normalizeReason(req.body?.reason),
      comment: normalizeComment(req.body?.comment),
      source: normalizeSource(req.body?.source),
      entryPoint: normalizeSource(req.body?.entryPoint),
      isDemo: DEMO_USER_IDS.has(authUserId),
      createdAt: new Date().toISOString(),
    };

    logCopilotFeedback(feedback);
    recordCopilotFeedback({
      role: feedback.role,
      useCase: feedback.useCase,
      rating: feedback.rating,
      reason: feedback.reason,
      source: feedback.source,
      isDemo: feedback.isDemo,
      createdAt: feedback.createdAt,
    });
    updateUserPreferenceSignals({
      userId: feedback.userId,
      role: feedback.role,
      reason: feedback.reason,
      createdAt: feedback.createdAt,
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('[copilot-feedback] submit failed', error);
    res.status(500).json({ ok: false, error: 'Unable to submit feedback right now.' });
  }
};
