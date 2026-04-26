import { callModel } from '../llm/eloraLlmClient.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssignmentQualityAgentInput = {
  topic: string;
  subject?: string | null;
  level?: string | null;
  objectives: string[];
  tasks: Array<{
    title: string;
    type?: string | null;
    minutes?: number | null;
    instructions?: string | null;
  }>;
};

export type AssignmentQualityAgentOutput = {
  feedback: string[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FEEDBACK_ITEMS = 6;

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

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const extracted = tryParse(match[0]);
    if (extracted) return extracted;
  }

  throw new Error('Model response was not a valid JSON object.');
};

const normalizeFeedback = (raw: unknown[]): string[] => {
  const capToTwoSentences = (value: string): string => {
    const compact = value.trim().replace(/\s+/g, ' ');
    const sentences = compact.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) || [];
    if (sentences.length === 0) return compact;
    return sentences.slice(0, 2).join(' ').trim();
  };

  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => capToTwoSentences(item))
    .filter((item) => item.length > 0 && item.length <= 400)
    .slice(0, MAX_FEEDBACK_ITEMS);
};

// ── Prompt builders ───────────────────────────────────────────────────────────

const buildSystemPrompt = (): string =>
  [
    'You are an expert instructional coach helping a teacher improve a single assignment in Elora, an AI learning assistant.',
    'You give concise, practical suggestions in a warm, supportive tone.',
    'Your feedback is always teacher-facing, actionable, and constructive — never critical or discouraging.',
    'Only comment on the objectives and tasks that are explicitly provided. Do not invent missing content.',
    'Each suggestion must be specific and actionable, in 1 to 2 sentences.',
    'Do not use grading, marks, scoring, points, or evaluation language.',
    'Do not include sensitive, explicit, unsafe, or inappropriate content.',
    'Do not suggest changing the subject matter.',
  ].join(' ');

const buildUserPrompt = (input: AssignmentQualityAgentInput): string => {
  const lines: string[] = [
    'Please review this assignment and suggest small improvements:',
    '',
    `Topic: ${input.topic}`,
    `Subject: ${input.subject?.trim() || 'Not provided'}`,
    `Level / grade: ${input.level?.trim() || 'Not provided'}`,
    '',
    'Learning objectives:',
  ];

  if (input.objectives.length > 0) {
    input.objectives.slice(0, 8).forEach((obj, i) => {
      lines.push(`  ${i + 1}. ${obj.trim()}`);
    });
  } else {
    lines.push('  (None added yet)');
  }

  lines.push('', 'Tasks:');

  if (input.tasks.length > 0) {
    input.tasks.slice(0, 8).forEach((task, i) => {
      const label = task.title.trim() || `Task ${i + 1}`;
      const typeStr = task.type ? ` [${task.type}]` : '';
      const minStr = task.minutes ? ` (${task.minutes} min)` : '';
      lines.push(`  ${i + 1}. ${label}${typeStr}${minStr}`);
      if (task.instructions) {
        lines.push(`     Instructions: ${task.instructions.trim().slice(0, 200)}`);
      }
    });
  } else {
    lines.push('  (None added yet)');
  }

  lines.push(
    '',
    'Analyse this assignment for:',
    '- Alignment between objectives and tasks',
    '- Clarity of student-facing instructions',
    '- Balance across warm-up / main / reflection',
    '- Overall workload',
    '',
    'Use only the provided objectives and tasks as evidence; do not invent details.',
    'Return between 3 and 6 short, actionable suggestions for the teacher.',
    'Each suggestion must be 1 to 2 sentences, friendly, concrete, and specific to this assignment.',
    'Do not include grading language or scoring terms.',
    '',
    'Return ONLY a JSON object in this exact format:',
    '{ "feedback": ["First suggestion...", "Second suggestion...", ...] }',
  );

  return lines.join('\n');
};

// ── Agent entry point ─────────────────────────────────────────────────────────

export async function generateAssignmentQualityFeedback(
  input: AssignmentQualityAgentInput,
): Promise<AssignmentQualityAgentOutput> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const rawContent = await callModel({
    agentName: 'assignment-quality',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.45,
    maxTokens: 450,
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJsonObject(rawContent);
  } catch (error) {
    console.error('assignmentQualityAgent: parse failure', {
      message: error instanceof Error ? error.message : String(error),
      rawSnippet: rawContent.slice(0, 200),
    });
    throw new Error('Quality agent returned an unparseable response.');
  }

  const rawFeedback = Array.isArray(parsed.feedback) ? parsed.feedback : [];
  const feedback = normalizeFeedback(rawFeedback);

  if (feedback.length === 0) {
    throw new Error('Quality agent returned no usable feedback items.');
  }

  return { feedback };
}
