import type { UseCase, UseCaseConfig, UserRole } from './types.js';

export const USE_CASE_VALUES: UseCase[] = [
  'teacher_chat',
  'teacher_planning',
  'teacher_unit_planner',
  'teacher_data_triage',
  'student_chat',
  'student_study_help',
  'student_study_mode',
  'parent_chat',
  'parent_support_mode',
  'grading_feedback',
  'content_generation',
  'rag_query',
];

export const isUseCase = (value: unknown): value is UseCase => {
  return typeof value === 'string' && USE_CASE_VALUES.includes(value as UseCase);
};

export const USE_CASE_CONFIG: Record<UseCase, UseCaseConfig> = {
  teacher_chat: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 700,
    temperature: 0.45,
  },
  teacher_planning: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 1100,
    temperature: 0.35,
  },
  teacher_unit_planner: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 1300,
    temperature: 0.35,
  },
  teacher_data_triage: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 1000,
    temperature: 0.3,
  },
  student_chat: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    maxTokens: 700,
    temperature: 0.55,
  },
  student_study_help: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 900,
    temperature: 0.45,
  },
  student_study_mode: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 1000,
    temperature: 0.4,
  },
  parent_chat: {
    provider: 'openrouter',
    model: 'openai/gpt-4.1-mini',
    maxTokens: 700,
    temperature: 0.4,
  },
  parent_support_mode: {
    provider: 'openrouter',
    model: 'openai/gpt-4.1-mini',
    maxTokens: 900,
    temperature: 0.4,
  },
  grading_feedback: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 850,
    temperature: 0.2,
  },
  content_generation: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 1200,
    temperature: 0.72,
  },
  rag_query: {
    provider: 'cohere',
    model: 'command-r-plus',
    maxTokens: 900,
    temperature: 0.2,
  },
};

export const DEFAULT_USE_CASE_BY_ROLE: Record<UserRole, UseCase> = {
  teacher: 'teacher_chat',
  student: 'student_chat',
  parent: 'parent_chat',
};
