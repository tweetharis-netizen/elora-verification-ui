import { Request, Response } from 'express';
import { generateAssignmentObjectives } from '../agents/assignmentObjectiveAgent.js';
import { generateAssignmentTaskPlan } from '../agents/assignmentTaskPlanAgent.js';
import { generateAssignmentQualityFeedback } from '../agents/assignmentQualityAgent.js';

// ── Types ──────────────────────────────────────────────────────────────
export type SuggestionKind = 'practice_task' | 'parent_message' | 'lesson_idea';

export interface ClassSuggestion {
    kind: SuggestionKind;
    title: string;
    body: string;
    suggestedTargets: string[];
    suggestedTopic?: string;
}

export interface TeacherInsight {
    type: 'low_scores' | 'weak_topic' | 'overdue_assignment';
    studentId: string;
    studentName: string;
    topicTag?: string;
    assignmentTitle?: string;
    className?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function unique<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}

function topTopic(insights: TeacherInsight[]): string | null {
    const counts: Record<string, number> = {};
    for (const i of insights) {
        if (i.topicTag) counts[i.topicTag] = (counts[i.topicTag] ?? 0) + 1;
    }
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ── Controller ────────────────────────────────────────────────────────────────

export const getClassSupportSuggestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId, className, teacherId, students, insights, recentPerformance } = req.body;

        if (!classId) {
            res.status(400).json({ error: 'classId is required' });
            return;
        }

        const classInsights: TeacherInsight[] = insights || [];

        // ── TODO ──────────────────────────────────────────────────────────────
        // Replace this local suggestion logic with a real LLM call later.
        // E.g., const response = await llmClient.completion({ ...prompt });
        // Keeping templates below intact for prompt construction later.
        // ──────────────────────────────────────────────────────────────────────

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

        let result: ClassSuggestion;

        if (supportStudents.length > 0 && topic) {
            const targets = formatTargets(supportStudents, topic);
            const title = useOption2
                ? `A quick skills check on ${topicLabel}`
                : `Targeted practice for ${topicLabel}`;
            const body = useOption2
                ? `Ask ${targets} to play a single round of ${packLabel}. Watch how they do on the first few questions to see if they're ready to move on.`
                : `Assign one short ${packLabel} game focusing on ${topicLabel} for ${targets}. This keeps the workload light but gives them an extra chance to lock it in.`;
            result = {
                kind: 'practice_task',
                title,
                body,
                suggestedTargets: supportStudents,
                suggestedTopic: topic,
            };
        } else if (supportStudents.length > 0) {
            const targets = formatTargets(supportStudents, null);
            const title = useOption2
                ? 'A gentle heads‑up to home'
                : `Keep parents in the loop about ${topicLabel}`;
            const body = useOption2
                ? `Let families know ${targets} are finding ${topicLabel} a bit tricky. A simple '10 minutes of practice twice this week' message is enough.`
                : `Send a short note to the families of ${targets} explaining that you're revisiting ${topicLabel} and how they can encourage a bit of extra practice this week.`;
            result = {
                kind: 'parent_message',
                title,
                body,
                suggestedTargets: supportStudents,
                suggestedTopic: topic ?? undefined,
            };
        } else {
            const nextTopic = topic ?? 'the current unit';
            const nextPackLabel = packName ?? 'a review game';
            const title = useOption2
                ? 'Celebrate progress, then review once'
                : `Consolidate ${nextTopic} for the whole class`;
            const body = useOption2
                ? `Everyone is mostly on track. Start with a quick "you're doing well on ${nextTopic}" message, then run one short review game to keep confidence high.`
                : `Open your next lesson with 3 quick, low‑stakes questions on ${nextTopic} from ${nextPackLabel}. Use hands‑up or mini whiteboards to surface any remaining gaps.`;
            result = {
                kind: 'lesson_idea',
                title,
                body,
                suggestedTargets: ['whole class'],
                suggestedTopic: nextTopic,
            };
        }

        res.json(result);
    } catch (error) {
        console.error('Error generating class support suggestion:', error);
        res.status(500).json({ error: 'Failed to generate class support suggestion' });
    }
};

export const getStudentSupportSuggestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, studentName, classId, className, recentPerformance } = req.body;

        if (!studentId) {
            res.status(400).json({ error: 'studentId is required' });
            return;
        }

        // ── TODO ──────────────────────────────────────────────────────────────
        // Replace this local student suggestion logic with a real LLM call later.
        // ──────────────────────────────────────────────────────────────────────

        const weakTopics = recentPerformance?.weakTopics || [];
        const recentScores = recentPerformance?.recentScores || [];

        let kind: 'practice_task' | 'mindset_nudge' | 'review_tip' = 'mindset_nudge';
        let title = "You're on track";
        let body = "You're doing well overall. Keep your momentum by playing any short practice game you enjoy today.";
        let suggestedPackId: string | undefined = undefined;
        let suggestedTopic: string | undefined = undefined;

        const hasClearWeakTopic = weakTopics.length > 0 && weakTopics[0].severity === 'severe';
        const hasMildWeakTopic = weakTopics.length > 0 && (weakTopics[0].severity === 'mild' || weakTopics[0].severity === 'moderate');
        
        const topWeakTopic = weakTopics[0]?.topic;
        // In a real app we would look up the specific pack for this topic,
        // for simulation we just grab one from recentScores or a default.
        const relatedPackId = recentScores[0]?.packId || 'algebra-basics';
        const packName = relatedPackId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');


        if (hasClearWeakTopic) {
            kind = 'practice_task';
            title = `Focus on ${topWeakTopic} next`;
            body = `Play one short ${packName} game on ${topWeakTopic} today. It's the fastest way to strengthen this skill.`;
            suggestedPackId = relatedPackId;
            suggestedTopic = topWeakTopic;
        } else if (hasMildWeakTopic) {
             kind = 'review_tip';
             title = `Quick review on ${topWeakTopic}`;
             body = `You're close on ${topWeakTopic}. A single review game on ${packName} will help you clear up the last confusion.`;
             suggestedPackId = relatedPackId;
             suggestedTopic = topWeakTopic;
        }

        res.json({
            kind,
            title,
            body,
            suggestedPackId,
            suggestedTopic
        });

    } catch (error) {
        console.error('Error generating student support suggestion:', error);
        res.status(500).json({ error: 'Failed to generate student support suggestion' });
    }
};

type SuggestObjectivesRequest = {
    topic?: string;
    subject?: string | null;
    level?: string | null;
};

type SuggestObjectivesResponse = {
    objectives: Array<{
        text: string;
    }>;
};

const normalizeOptionalField = (value: unknown): string | undefined => {
    if (value === null || typeof value === 'undefined') {
        return undefined;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const next = value.trim().replace(/\s+/g, ' ');
    return next.length > 0 ? next.slice(0, 80) : undefined;
};

export const getAssignmentObjectiveSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = (req.body ?? {}) as SuggestObjectivesRequest;
        if (typeof body.topic !== 'string') {
            res.status(400).json({ error: 'topic is required' });
            return;
        }

        const topic = body.topic.trim().replace(/\s+/g, ' ');
        if (topic.length < 5) {
            res.status(400).json({ error: 'topic must be at least 5 characters' });
            return;
        }

        if (typeof body.subject !== 'undefined' && body.subject !== null && typeof body.subject !== 'string') {
            res.status(400).json({ error: 'subject must be a string when provided' });
            return;
        }

        if (typeof body.level !== 'undefined' && body.level !== null && typeof body.level !== 'string') {
            res.status(400).json({ error: 'level must be a string when provided' });
            return;
        }

        const result = await generateAssignmentObjectives({
            topic: topic.slice(0, 160),
            subject: normalizeOptionalField(body.subject),
            level: normalizeOptionalField(body.level),
        });

        if (result.objectives.length === 0) {
            res.status(500).json({ error: ASSIGNMENT_AI_ERROR_MESSAGE });
            return;
        }

        const response: SuggestObjectivesResponse = { objectives: result.objectives };
        res.json(response);
    } catch (error) {
        console.error('Error generating assignment objective suggestions:', {
            message: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ error: ASSIGNMENT_AI_ERROR_MESSAGE });
    }
};

// ── Task plan suggestions ─────────────────────────────────────────────────────

type SuggestTasksRequest = {
    topic?: string;
    subject?: string | null;
    level?: string | null;
    objectives?: unknown;
};

type SuggestTasksResponse = {
    tasks: Array<{
        title: string;
        type: 'warmup' | 'main' | 'reflection';
        minutes?: number;
        instructions: string;
    }>;
};

export const getAssignmentTaskSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = (req.body ?? {}) as SuggestTasksRequest;

        // Validate topic
        if (typeof body.topic !== 'string') {
            res.status(400).json({ error: 'topic is required' });
            return;
        }
        const topic = body.topic.trim().replace(/\s+/g, ' ');
        if (topic.length < 5) {
            res.status(400).json({ error: 'topic must be at least 5 characters' });
            return;
        }

        // Validate optional subject / level
        if (typeof body.subject !== 'undefined' && body.subject !== null && typeof body.subject !== 'string') {
            res.status(400).json({ error: 'subject must be a string when provided' });
            return;
        }
        if (typeof body.level !== 'undefined' && body.level !== null && typeof body.level !== 'string') {
            res.status(400).json({ error: 'level must be a string when provided' });
            return;
        }

        // Validate optional objectives array
        let objectives: string[] | undefined;
        if (typeof body.objectives !== 'undefined') {
            if (!Array.isArray(body.objectives)) {
                res.status(400).json({ error: 'objectives must be an array when provided' });
                return;
            }
            objectives = (body.objectives as unknown[])
                .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                .map((item) => item.trim().slice(0, 220))
                .slice(0, 10);
        }

        const result = await generateAssignmentTaskPlan({
            topic: topic.slice(0, 160),
            subject: normalizeOptionalField(body.subject),
            level: normalizeOptionalField(body.level),
            objectives,
        });

        if (result.tasks.length === 0) {
            res.status(500).json({ error: ASSIGNMENT_AI_ERROR_MESSAGE });
            return;
        }

        const response: SuggestTasksResponse = { tasks: result.tasks };
        res.json(response);
    } catch (error) {
        console.error('Error generating assignment task suggestions:', {
            message: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ error: ASSIGNMENT_AI_ERROR_MESSAGE });
    }
};

// ── Review feedback (quality coach) ───────────────────────────────────────────

type ReviewFeedbackRequestTask = {
    title: string;
    type?: string | null;
    minutes?: number | null;
    instructions?: string | null;
};

type ReviewFeedbackRequest = {
    topic?: string;
    subject?: string | null;
    level?: string | null;
    objectives?: unknown;
    tasks?: unknown;
};

type ReviewFeedbackResponse = {
    feedback: string[];
};

const ASSIGNMENT_AI_ERROR_MESSAGE = 'We could not generate this right now. Please try again or edit manually.';

export const getAssignmentReviewFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = (req.body ?? {}) as ReviewFeedbackRequest;

        // Validate topic
        if (typeof body.topic !== 'string') {
            res.status(400).json({ error: 'topic is required' });
            return;
        }
        const topic = body.topic.trim().replace(/\s+/g, ' ');
        if (topic.length < 5) {
            res.status(400).json({ error: 'topic must be at least 5 characters' });
            return;
        }

        // Validate optional subject / level
        if (body.subject != null && typeof body.subject !== 'string') {
            res.status(400).json({ error: 'subject must be a string when provided' });
            return;
        }
        if (body.level != null && typeof body.level !== 'string') {
            res.status(400).json({ error: 'level must be a string when provided' });
            return;
        }

        // Validate objectives
        if (!Array.isArray(body.objectives)) {
            res.status(400).json({ error: 'objectives must be an array' });
            return;
        }
        const objectives = (body.objectives as unknown[])
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.trim().slice(0, 300))
            .slice(0, 10);

        // Validate tasks
        if (!Array.isArray(body.tasks)) {
            res.status(400).json({ error: 'tasks must be an array' });
            return;
        }
        const tasks: ReviewFeedbackRequestTask[] = (body.tasks as unknown[])
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => ({
                title: typeof item.title === 'string' ? item.title.trim().slice(0, 200) : '',
                type: typeof item.type === 'string' ? item.type.trim() : null,
                minutes: typeof item.minutes === 'number' && Number.isFinite(item.minutes) ? Math.round(item.minutes) : null,
                instructions: typeof item.instructions === 'string' ? item.instructions.trim().slice(0, 500) : null,
            }))
            .filter((task) => task.title.length > 0 || (task.instructions?.length ?? 0) > 0)
            .slice(0, 10);

        const result = await generateAssignmentQualityFeedback({
            topic: topic.slice(0, 160),
            subject: normalizeOptionalField(body.subject),
            level: normalizeOptionalField(body.level),
            objectives,
            tasks,
        });

        if (result.feedback.length === 0) {
            res.status(500).json({ error: ASSIGNMENT_AI_ERROR_MESSAGE });
            return;
        }

        const response: ReviewFeedbackResponse = { feedback: result.feedback };
        res.json(response);
    } catch (error) {
        console.error('Error generating assignment review feedback:', {
            message: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ error: ASSIGNMENT_AI_ERROR_MESSAGE });
    }
};
