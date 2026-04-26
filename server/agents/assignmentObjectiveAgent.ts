import { callModel } from '../llm/eloraLlmClient.js';

export type AssignmentObjectiveAgentInput = {
  topic: string;
  subject?: string | null;
  level?: string | null;
};

export type AssignmentObjectiveAgentOutput = {
  objectives: Array<{ text: string }>;
};

const extractJsonArray = (raw: string): string[] => {
  const trimmed = raw.trim();

  const tryParse = (candidate: string): string[] | null => {
    try {
      const parsed = JSON.parse(candidate);
      if (!Array.isArray(parsed)) return null;
      return parsed.filter((entry): entry is string => typeof entry === 'string');
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const match = trimmed.match(/\[[\s\S]*\]/);
  if (match) {
    const extracted = tryParse(match[0]);
    if (extracted) return extracted;
  }

  throw new Error('Model response was not valid JSON array output.');
};

const normalizeObjectives = (values: string[]): Array<{ text: string }> => {
  const unique = new Set<string>();
  const sanitized: Array<{ text: string }> = [];

  const toOneSentence = (value: string): string => {
    const compact = value.trim().replace(/\s+/g, ' ');
    if (!compact) return '';
    const firstSentence = compact.split(/(?<=[.!?])\s+/)[0]?.trim() || compact;
    const words = firstSentence.split(/\s+/).filter(Boolean);
    const capped = words.slice(0, 20).join(' ').trim();
    if (!capped) return '';
    return /[.!?]$/.test(capped) ? capped : `${capped}.`;
  };

  for (const value of values) {
    const text = toOneSentence(value);
    if (!text) continue;
    if (text.length > 220) continue;

    const normalizedKey = text.toLowerCase();
    if (unique.has(normalizedKey)) continue;

    unique.add(normalizedKey);
    sanitized.push({ text });

    if (sanitized.length >= 5) break;
  }

  return sanitized;
};

const buildSystemPrompt = (): string => {
  return [
    'You are an expert K-12 instructional designer helping a teacher write clear, student-friendly learning objectives for a single assignment in Elora, an AI learning assistant.',
    'Generate between 2 and 5 learning objectives.',
    'Each objective must be exactly one sentence, roughly 12 to 18 words, and under 20 words total.',
    'Use clear, student-friendly language without jargon.',
    'Adapt verbs and content to the stated subject and level (for example Math, History, English, or Science).',
    'Use action-oriented verbs like describe, explain, compare, analyze, or solve.',
    'Objectives must be age-appropriate, neutral, and safe for classroom use.',
    'Do not include points, grades, marks, scoring, or assessment rubrics.',
    'Do not include unsafe or sensitive topics.',
    'Return ONLY a JSON array of strings with no markdown and no explanation.',
  ].join(' ');
};

const buildUserPrompt = (input: AssignmentObjectiveAgentInput): string => {
  const contextLines = [
    `Topic / unit: ${input.topic}`,
    `Subject: ${input.subject?.trim() || 'Not provided'}`,
    `Level / grade: ${input.level?.trim() || 'Not provided'}`,
  ];

  return [
    'Create assignment learning objectives for this teacher context:',
    ...contextLines,
    'Ensure language and complexity are appropriate for the provided level/grade.',
    'Make each objective topic-specific to the given unit, not generic.',
    'Use one sentence per objective, under 20 words, with no grading language.',
    'Return JSON array only.',
  ].join('\n');
};

export async function generateAssignmentObjectives(
  input: AssignmentObjectiveAgentInput,
): Promise<AssignmentObjectiveAgentOutput> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const rawContent = await callModel({
    agentName: 'assignment-objectives',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.5,
    maxTokens: 512,
  });

  let parsedArray: string[];
  try {
    parsedArray = extractJsonArray(rawContent);
  } catch (error) {
    console.error('assignmentObjectiveAgent parse failure', {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const objectives = normalizeObjectives(parsedArray);
  if (objectives.length < 2) {
    throw new Error('Model returned fewer than 2 valid objectives.');
  }

  return { objectives };
}
