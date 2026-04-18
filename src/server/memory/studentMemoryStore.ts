import type { StudentMemory } from '../../lib/llm/types.js';

const store = new Map<string, StudentMemory>();

const normalizeUserId = (value: string | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cleaned = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    return undefined;
  }

  return [...new Set(cleaned)];
};

const cloneMemory = (memory: StudentMemory): StudentMemory => ({
  userId: memory.userId,
  level: memory.level,
  subjects: memory.subjects ? [...memory.subjects] : undefined,
  lastTopics: memory.lastTopics ? [...memory.lastTopics] : undefined,
  lastUpdatedAt: memory.lastUpdatedAt,
});

export function getStudentMemory(userId: string): StudentMemory | null {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return null;
  }

  const existing = store.get(normalizedUserId);
  return existing ? cloneMemory(existing) : null;
}

export function setStudentMemory(memory: StudentMemory): void {
  const normalizedUserId = normalizeUserId(memory.userId);
  if (!normalizedUserId) {
    return;
  }

  const normalizedMemory: StudentMemory = {
    userId: normalizedUserId,
    level: typeof memory.level === 'string' ? memory.level.trim() || undefined : undefined,
    subjects: normalizeStringArray(memory.subjects),
    lastTopics: normalizeStringArray(memory.lastTopics),
    lastUpdatedAt:
      typeof memory.lastUpdatedAt === 'string' && memory.lastUpdatedAt.trim().length > 0
        ? memory.lastUpdatedAt
        : new Date().toISOString(),
  };

  store.set(normalizedUserId, normalizedMemory);
}
