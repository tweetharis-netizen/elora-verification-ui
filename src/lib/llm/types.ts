export type LLMRole = 'system' | 'user' | 'assistant';

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export type UserRole = 'teacher' | 'student' | 'parent';

export type UseCase =
  | 'teacher_chat'
  | 'teacher_planning'
  | 'teacher_unit_planner'
  | 'teacher_data_triage'
  | 'student_chat'
  | 'student_study_help'
  | 'student_study_mode'
  | 'parent_chat'
  | 'parent_support_mode'
  | 'grading_feedback'
  | 'content_generation'
  | 'rag_query';

export type ProviderName = 'openrouter' | 'groq' | 'gemini' | 'cohere';

export interface LLMResponse {
  content: string;
  raw?: unknown;
}

export interface UseCaseConfig {
  provider: ProviderName;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderCallArgs {
  model: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface UserProfile {
  level?: string;
  subjects?: string[];
}

export interface StudentMemory {
  userId: string;
  level?: string;
  subjects?: string[];
  lastTopics?: string[];
  lastUpdatedAt: string;
}

export interface UserPreferenceSignals {
  userId: string;
  role: UserRole;
  tooLongCount: number;
  notMyLevelCount: number;
  notAccurateCount: number;
  lastUpdatedAt: string;
}

export type CopilotFeedbackRating = 'up' | 'down';

export type CopilotFeedbackReason =
  | 'not_accurate'
  | 'too_long'
  | 'not_my_level'
  | 'other'
  | 'helpful';

export interface CopilotFeedbackPayload {
  userId?: string;
  role: UserRole;
  useCase: string;
  messageId: string;
  threadId?: string;
  rating: CopilotFeedbackRating;
  reason?: CopilotFeedbackReason;
  comment?: string;
  createdAt: string;
}
