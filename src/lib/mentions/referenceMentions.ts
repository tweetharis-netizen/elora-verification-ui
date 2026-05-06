import type { ReferenceMention, ReferenceMentionType } from '../llm/types';

const MAX_VALUE_LENGTH = 80;
const MAX_RAW_TOKEN_LENGTH = 100;
const MAX_MENTIONS = 8;

const normalizeType = (rawType: string): ReferenceMentionType => {
  const value = rawType.trim().toLowerCase();

  if (value === 'q' || value === 'question') {
    return 'question';
  }

  if (value === 'assignment') {
    return 'assignment';
  }

  if (value === 'resource') {
    return 'resource';
  }

  if (value === 'studentwork' || value === 'student_work') {
    return 'studentWork';
  }

  return 'unknown';
};

const sanitizeValue = (value: string): string => {
  return value
    .trim()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_VALUE_LENGTH)
    .replace(/^[.,;:!?\s]+|[.,;:!?\s]+$/g, '');
};

const toMention = ({
  raw,
  type,
  value,
}: {
  raw: string;
  type: string;
  value: string;
}): ReferenceMention | null => {
  if (typeof raw === 'string' && raw.length > MAX_RAW_TOKEN_LENGTH + 16) {
    return null;
  }

  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > MAX_RAW_TOKEN_LENGTH) {
    return null;
  }

  const sanitizedValue = sanitizeValue(value);
  if (!sanitizedValue) {
    return null;
  }

  const mentionType = normalizeType(type);

  return {
    raw,
    type: mentionType,
    value: sanitizedValue,
    label: mentionType === 'unknown' ? undefined : `${mentionType}:${sanitizedValue}`,
  };
};

export const parseReferenceMentions = (text: string): ReferenceMention[] => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }

  const mentions: ReferenceMention[] = [];
  const seen = new Set<string>();

  const typedPattern = /(?<![@\w])@(?<type>Q|Question|Assignment|Resource|StudentWork)\s*:\s*(?<value>[A-Za-z0-9._\-]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = typedPattern.exec(text)) !== null) {
    const raw = match[0] ?? '';
    const rawType = match.groups?.type ?? '';
    const rawValue = match.groups?.value ?? '';
    const mention = toMention({ raw, type: rawType, value: rawValue });

    if (!mention) {
      continue;
    }

    const dedupeKey = `${mention.type}:${mention.value}`.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    mentions.push(mention);

    if (mentions.length >= MAX_MENTIONS) {
      return mentions;
    }
  }

  const shorthandQuestionPattern = /(?<![@\w])@Q(?<index>\d{1,3})\b/gi;
  while ((match = shorthandQuestionPattern.exec(text)) !== null) {
    const raw = match[0] ?? '';
    const rawValue = match.groups?.index ?? '';
    const mention = toMention({ raw, type: 'question', value: rawValue });

    if (!mention) {
      continue;
    }

    const dedupeKey = `${mention.type}:${mention.value}`.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    mentions.push(mention);

    if (mentions.length >= MAX_MENTIONS) {
      break;
    }
  }

  return mentions;
};

export const normalizeReferenceMentions = (input: unknown): ReferenceMention[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: ReferenceMention[] = [];
  const seen = new Set<string>();

  for (const entry of input) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const candidate = entry as Record<string, unknown>;
    const raw = typeof candidate.raw === 'string' ? candidate.raw : '';
    const type = typeof candidate.type === 'string' ? candidate.type : 'unknown';
    const value = typeof candidate.value === 'string' ? candidate.value : '';
    const mention = toMention({ raw, type, value });

    if (!mention) {
      continue;
    }

    const dedupeKey = `${mention.type}:${mention.value}`.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalized.push(mention);

    if (normalized.length >= MAX_MENTIONS) {
      break;
    }
  }

  return normalized;
};

export const buildReferenceMentionPromptSummary = (mentions: ReferenceMention[]): string[] => {
  if (!Array.isArray(mentions) || mentions.length === 0) {
    return [];
  }

  return mentions.map((mention) => {
    const type = mention.type || 'unknown';
    const value = mention.value || '';
    const raw = mention.raw ? ` (source token: ${mention.raw})` : '';
    return `- ${type}: ${value}${raw}`;
  });
};