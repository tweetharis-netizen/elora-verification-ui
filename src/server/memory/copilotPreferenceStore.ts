import type { CopilotFeedbackReason, UserPreferenceSignals, UserRole } from '../../lib/llm/types.js';

const MAX_STORE_ENTRIES = 1000;
const MAX_SIGNAL_COUNT = 20;

const preferenceStore = new Map<string, UserPreferenceSignals>();

const normalizeUserId = (value: string | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const toStoreKey = (userId: string, role: UserRole): string => `${userId}::${role}`;

const cloneSignals = (signals: UserPreferenceSignals): UserPreferenceSignals => ({
  userId: signals.userId,
  role: signals.role,
  tooLongCount: signals.tooLongCount,
  notMyLevelCount: signals.notMyLevelCount,
  notAccurateCount: signals.notAccurateCount,
  lastUpdatedAt: signals.lastUpdatedAt,
});

const cap = (value: number): number => Math.min(MAX_SIGNAL_COUNT, Math.max(0, value));

const ensureCapacity = (): void => {
  if (preferenceStore.size < MAX_STORE_ENTRIES) {
    return;
  }

  const oldestKey = preferenceStore.keys().next().value;
  if (typeof oldestKey === 'string') {
    preferenceStore.delete(oldestKey);
  }
};

const applyReasonSignal = ({
  reason,
  next,
}: {
  reason?: CopilotFeedbackReason;
  next: UserPreferenceSignals;
}): void => {
  if (reason === 'too_long') {
    next.tooLongCount = cap(next.tooLongCount + 1);
    return;
  }

  if (reason === 'not_my_level') {
    next.notMyLevelCount = cap(next.notMyLevelCount + 1);
    return;
  }

  if (reason === 'not_accurate') {
    next.notAccurateCount = cap(next.notAccurateCount + 1);
  }
};

export function getUserPreferenceSignals({
  userId,
  role,
}: {
  userId?: string;
  role: UserRole;
}): UserPreferenceSignals | null {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return null;
  }

  const key = toStoreKey(normalizedUserId, role);
  const existing = preferenceStore.get(key);
  return existing ? cloneSignals(existing) : null;
}

export function updateUserPreferenceSignals({
  userId,
  role,
  reason,
  createdAt,
}: {
  userId?: string;
  role: UserRole;
  reason?: CopilotFeedbackReason;
  createdAt?: string;
}): void {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return;
  }

  const key = toStoreKey(normalizedUserId, role);
  const existing = preferenceStore.get(key);
  const next: UserPreferenceSignals = existing
    ? cloneSignals(existing)
    : {
        userId: normalizedUserId,
        role,
        tooLongCount: 0,
        notMyLevelCount: 0,
        notAccurateCount: 0,
        lastUpdatedAt: new Date().toISOString(),
      };

  applyReasonSignal({ reason, next });
  next.lastUpdatedAt =
    typeof createdAt === 'string' && createdAt.trim().length > 0 ? createdAt : new Date().toISOString();

  if (!existing) {
    ensureCapacity();
  }

  preferenceStore.set(key, next);
}