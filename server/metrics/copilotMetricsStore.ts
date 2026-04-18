import type { CopilotFeedbackRating, UserRole } from '../../src/lib/llm/types.js';

export interface CopilotFeedbackEvent {
  role: UserRole;
  useCase: string;
  rating: CopilotFeedbackRating;
  reason?: string;
  createdAt: string;
}

const MAX_EVENTS = 500;
const RECENT_LIMIT = 50;

const feedbackEvents: CopilotFeedbackEvent[] = [];

const safeNumberSortDesc = (a: number, b: number): number => b - a;

export function recordCopilotFeedback(event: CopilotFeedbackEvent): void {
  try {
    if (!event || !event.role || !event.useCase || !event.rating || !event.createdAt) {
      return;
    }

    feedbackEvents.push({
      role: event.role,
      useCase: event.useCase,
      rating: event.rating,
      reason: event.reason,
      createdAt: event.createdAt,
    });

    if (feedbackEvents.length > MAX_EVENTS) {
      feedbackEvents.splice(0, feedbackEvents.length - MAX_EVENTS);
    }
  } catch (error) {
    console.error('[CopilotMetricsStore] record failed', error);
  }
}

export function getCopilotFeedbackSummary(): {
  byUseCase: Array<{
    useCase: string;
    total: number;
    up: number;
    down: number;
  }>;
  byRole: Array<{
    role: UserRole;
    total: number;
    up: number;
    down: number;
  }>;
  recent: CopilotFeedbackEvent[];
} {
  const useCaseMap = new Map<string, { total: number; up: number; down: number }>();
  const roleMap = new Map<UserRole, { total: number; up: number; down: number }>();

  for (const event of feedbackEvents) {
    const useCaseEntry = useCaseMap.get(event.useCase) ?? { total: 0, up: 0, down: 0 };
    useCaseEntry.total += 1;
    if (event.rating === 'up') useCaseEntry.up += 1;
    if (event.rating === 'down') useCaseEntry.down += 1;
    useCaseMap.set(event.useCase, useCaseEntry);

    const roleEntry = roleMap.get(event.role) ?? { total: 0, up: 0, down: 0 };
    roleEntry.total += 1;
    if (event.rating === 'up') roleEntry.up += 1;
    if (event.rating === 'down') roleEntry.down += 1;
    roleMap.set(event.role, roleEntry);
  }

  const byUseCase = Array.from(useCaseMap.entries())
    .map(([useCase, stats]) => ({ useCase, ...stats }))
    .sort((a, b) => safeNumberSortDesc(a.total, b.total));

  const byRole = Array.from(roleMap.entries())
    .map(([role, stats]) => ({ role, ...stats }))
    .sort((a, b) => safeNumberSortDesc(a.total, b.total));

  const recent = [...feedbackEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_LIMIT);

  return {
    byUseCase,
    byRole,
    recent,
  };
}
