// src/services/classSuggestionService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Abstraction layer for "Ask Elora" class suggestions.
//
// ARCHITECTURE NOTE:
// The `getClassSupportSuggestion` function is the single seam between the UI
// and the suggestion engine. Right now it uses mock / local logic derived from
// existing insights data. When you're ready to power it with a real AI model:
//   1. Replace the body of `getClassSupportSuggestion` with a `fetch` call.
//   2. Keep the same return type — no UI changes needed.
//
// ─────────────────────────────────────────────────────────────────────────────

import type { TeacherInsight } from './dataService';

// ── Public types ──────────────────────────────────────────────────────────────

export type SuggestionKind = 'practice_task' | 'parent_message' | 'lesson_idea';

export interface ClassSuggestion {
    kind: SuggestionKind;
    /** Short headline shown prominently in the card */
    title: string;
    /** Supporting body copy with more context */
    body: string;
    /** Student names, or ["whole class"] */
    suggestedTargets: string[];
    /** Topic the suggestion is focused on, if any */
    suggestedTopic?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Deduplicate values while preserving insertion order. */
function unique<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}

/**
 * Pick the most-mentioned topic from insights.
 * Returns null when no topicTag is present.
 */
function topTopic(insights: TeacherInsight[]): string | null {
    const counts: Record<string, number> = {};
    for (const i of insights) {
        if (i.topicTag) counts[i.topicTag] = (counts[i.topicTag] ?? 0) + 1;
    }
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns a single concrete suggestion for the teacher to act on.
 *
 * @param classId   - ID of the demo class (used to filter insights).
 * @param className - Human-readable class name shown in the card.
 * @param insights  - The same TeacherInsight array already fetched by the dashboard.
 *
 * ⚠ This function intentionally adds a small artificial delay so the UI can
 *   demonstrate a real async loading state.  Remove / adjust in production.
 */
export async function getClassSupportSuggestion(
    classId: string,
    className: string,
    insights: TeacherInsight[]
): Promise<ClassSuggestion> {
    try {
        const response = await fetch('/api/elora/suggestions/class', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                classId,
                className,
                teacherId: 'teacher-123',
                students: [], // Optional: fill from context if available
                insights,
                recentPerformance: { weakTopics: [] },
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: ClassSuggestion = await response.json();
        
        // Add a slight delay to simulate "AI thinking" or real network latency
        await delay(700 + Math.random() * 500);
        
        return data;
    } catch (error) {
        console.error('Failed to fetch AI suggestion, falling back to local logic', error);
        return await fallbackGetClassSupportSuggestion(classId, className, insights);
    }
}

async function fallbackGetClassSupportSuggestion(
    classId: string,
    className: string,
    insights: TeacherInsight[]
): Promise<ClassSuggestion> {
    await delay(700 + Math.random() * 500);

    const classInsights = insights.filter(
        (i) => i.className === className || i.studentId === classId
    );

    const supportInsights = classInsights.filter(
        (i) => i.type === 'weak_topic' || i.type === 'low_scores'
    );

    const supportStudents = unique(
        supportInsights
            .map((i) => i.studentName)
            .filter((n): n is string => !!n)
    );

    const topic = topTopic(classInsights);

    const formatTargets = (names: string[], fallbackTopic?: string | null): string => {
        if (names.length === 0) return `the group who are finding ${fallbackTopic ?? 'this topic'} tricky`;
        if (names.length === 1) return names[0];
        if (names.length === 2) return `${names[0]} and ${names[1]}`;
        return `${names[0]}, ${names[1]}, and ${names.length - 2} other${names.length - 2 > 1 ? 's' : ''}`;
    };

    const topInsight = supportInsights[0];
    const packName = topInsight?.assignmentTitle ?? null;
    const packLabel = packName ?? 'a short practice game';
    const topicLabel = topic ?? 'this topic';

    const useOption2 = Math.random() < 0.4;

    if (supportStudents.length > 0 && topic) {
        const targets = formatTargets(supportStudents, topic);
        const title = useOption2
            ? `A quick skills check on ${topicLabel}`
            : `Targeted practice for ${topicLabel}`;
        const body = useOption2
            ? `Ask ${targets} to play a single round of ${packLabel}. Watch how they do on the first few questions to see if they're ready to move on.`
            : `Assign one short ${packLabel} game focusing on ${topicLabel} for ${targets}. This keeps the workload light but gives them an extra chance to lock it in.`;
        return {
            kind: 'practice_task',
            title,
            body,
            suggestedTargets: supportStudents,
            suggestedTopic: topic,
        };
    }

    if (supportStudents.length > 0) {
        const targets = formatTargets(supportStudents, null);
        const title = useOption2
            ? 'A gentle heads‑up to home'
            : `Keep parents in the loop about ${topicLabel}`;
        const body = useOption2
            ? `Let families know ${targets} are finding ${topicLabel} a bit tricky. A simple '10 minutes of practice twice this week' message is enough.`
            : `Send a short note to the families of ${targets} explaining that you're revisiting ${topicLabel} and how they can encourage a bit of extra practice this week.`;
        return {
            kind: 'parent_message',
            title,
            body,
            suggestedTargets: supportStudents,
            suggestedTopic: topic ?? undefined,
        };
    }

    const nextTopic = topic ?? 'the current unit';
    const nextPackLabel = packName ?? 'a review game';
    const title = useOption2
        ? 'Celebrate progress, then review once'
        : `Consolidate ${nextTopic} for the whole class`;
    const body = useOption2
        ? `Everyone is mostly on track. Start with a quick "you're doing well on ${nextTopic}" message, then run one short review game to keep confidence high.`
        : `Open your next lesson with 3 quick, low‑stakes questions on ${nextTopic} from ${nextPackLabel}. Use hands‑up or mini whiteboards to surface any remaining gaps.`;
    return {
        kind: 'lesson_idea',
        title,
        body,
        suggestedTargets: ['whole class'],
        suggestedTopic: nextTopic,
    };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
