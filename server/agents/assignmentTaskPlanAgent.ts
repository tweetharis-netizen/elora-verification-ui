import { callModel } from '../llm/eloraLlmClient.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssignmentTaskPlanAgentInput = {
  topic: string;
  subject?: string | null;
  level?: string | null;
  objectives?: string[]; // text-only, optional but recommended
};

export type AgentTaskType = 'warmup' | 'main' | 'reflection';

export type AssignmentTaskPlanAgentOutput = {
  tasks: Array<{
    title: string;
    type: AgentTaskType;
    minutes?: number;
    instructions: string;
  }>;
};

type RawTaskItem = {
  title?: unknown;
  type?: unknown;
  minutes?: unknown;
  instructions?: unknown;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_TASK_TYPES: AgentTaskType[] = ['warmup', 'main', 'reflection'];
const MAX_TASKS = 4;

// ── Parsing helpers ───────────────────────────────────────────────────────────

const extractJsonObject = (raw: string): Record<string, unknown> => {
  const trimmed = raw.trim();

  const tryParse = (candidate: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  // Try to pull out the first JSON object from mixed content (e.g., markdown fences)
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const extracted = tryParse(match[0]);
    if (extracted) return extracted;
  }

  throw new Error('Model response was not a valid JSON object.');
};

const normalizeTaskType = (value: unknown): AgentTaskType => {
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (VALID_TASK_TYPES.includes(lower as AgentTaskType)) {
      return lower as AgentTaskType;
    }
    // Soft-coerce common synonyms
    if (lower === 'warm-up' || lower === 'warmup_activity') return 'warmup';
    if (lower === 'reflect' || lower === 'wrap-up' || lower === 'wrapup') return 'reflection';
    if (lower === 'activity' || lower === 'core' || lower === 'task') return 'main';
  }
  console.warn('[assignmentTaskPlanAgent] Unrecognised task type, defaulting to "main":', value);
  return 'main';
};

const clampMinutes = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const clamped = Math.max(5, Math.min(20, Math.round(value)));
  return clamped;
};

const clampInstructionSentences = (value: string): string => {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (!compact) return '';
  const sentences = compact.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) || [];
  if (sentences.length === 0) return compact;
  return sentences.slice(0, 4).join(' ').trim();
};

const normalizeTasks = (raw: unknown[]): AssignmentTaskPlanAgentOutput['tasks'] => {
  const result: AssignmentTaskPlanAgentOutput['tasks'] = [];

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const task = item as RawTaskItem;

    const title =
      typeof task.title === 'string' ? task.title.trim().replace(/\s+/g, ' ') : '';
    const instructions =
      typeof task.instructions === 'string'
        ? clampInstructionSentences(task.instructions)
        : '';

    // Skip tasks that are structurally incomplete or suspiciously long
    if (!title || !instructions) continue;
    if (title.length > 200) continue;
    if (instructions.length > 1200) continue;

    const type = normalizeTaskType(task.type);
    const minutes = clampMinutes(task.minutes);

    result.push({ title, type, minutes, instructions });

    if (result.length >= MAX_TASKS) break;
  }

  return result;
};

// ── Prompt builders ───────────────────────────────────────────────────────────

const buildSystemPrompt = (): string =>
  [
    'You are an expert K–12 instructional designer helping a teacher design a short assignment in Elora, an AI learning assistant.',
    'Your job is to propose a simple, student-friendly task plan based on the topic and learning objectives.',
    'Generate between 2 and 4 tasks for a single assignment.',
    'Include: one warm-up task, one or two main tasks, and optionally one reflection task.',
    'Each task must be clearly about the stated topic and subject, not generic.',
    'Each task must have: a short title, a type ("warmup", "main", or "reflection"), an estimated duration in minutes (integer), and clear student-friendly instructions.',
    'Keep instructions concise at 2 to 4 sentences with plain student-facing wording.',
    'Use a reasonable time per task, between 5 and 20 minutes.',
    'Keep all content age-appropriate, neutral, and safe for classroom use.',
    'Avoid grading, marks, scoring, points language, and teacher-facing jargon.',
    'Do not include sensitive, violent, explicit, or unsafe content.',
    'Return ONLY a JSON object with a "tasks" array. Do not include any markdown, code fences, or explanation.',
  ].join(' ');

const buildUserPrompt = (input: AssignmentTaskPlanAgentInput): string => {
  const lines: string[] = [
    'Design a task plan for this assignment:',
    `Topic / unit: ${input.topic}`,
    `Subject: ${input.subject?.trim() || 'Not provided'}`,
    `Level / grade: ${input.level?.trim() || 'Not provided'}`,
  ];

  if (input.objectives && input.objectives.length > 0) {
    lines.push('Learning objectives:');
    input.objectives.slice(0, 5).forEach((obj, i) => {
      lines.push(`  ${i + 1}. ${obj.trim()}`);
    });
  }

  lines.push(
    '',
    'Make every task explicitly tied to the topic and subject for this assignment.',
    'Keep instructions to 2 to 4 short sentences in student-friendly language.',
    'Use 5 to 20 minutes per task, and avoid grading language.',
    'Return ONLY a JSON object in this exact format:',
    '{ "tasks": [{ "title": "...", "type": "warmup" | "main" | "reflection", "minutes": 10, "instructions": "..." }] }',
  );

  return lines.join('\n');
};

// ── Agent entry point ─────────────────────────────────────────────────────────

export async function generateAssignmentTaskPlan(
  input: AssignmentTaskPlanAgentInput,
): Promise<AssignmentTaskPlanAgentOutput> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const rawContent = await callModel({
    agentName: 'assignment-tasks',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.45,
    maxTokens: 700,
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJsonObject(rawContent);
  } catch (error) {
    console.error('assignmentTaskPlanAgent: parse failure', {
      message: error instanceof Error ? error.message : String(error),
      rawSnippet: rawContent.slice(0, 200),
    });
    // Return empty rather than throw — controller will surface a 500
    return { tasks: [] };
  }

  const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const tasks = normalizeTasks(rawTasks);

  return { tasks };
}
