export type LLMRole = 'system' | 'user' | 'assistant';

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export type UserRole = 'teacher' | 'student' | 'parent';
export type CopilotRole = 'student' | 'teacher' | 'parent';

export interface CopilotFileAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'text' | 'other';
  sizeBytes: number;
  label?: string;
}

export interface CopilotMessagePayload {
  role: CopilotRole;
  text: string;
  useCase?: UseCase;
  isHomework?: boolean;
  linkedAssignmentId?: string | null;
  referenceMentions?: ReferenceMention[];
  fileAttachments?: CopilotFileAttachment[];
}

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

export type ReferenceMentionType = 'question' | 'assignment' | 'resource' | 'studentWork' | 'unknown';

export interface ReferenceMention {
  raw: string;
  type: ReferenceMentionType;
  value: string;
  label?: string;
}

export interface LLMResponse {
  content: string;
  raw?: unknown;
  provider?: ProviderName;
  model?: string;
  usedFallback?: boolean;
  reviewUsed?: boolean;
  reviewOutcome?: 'ok' | 'edited' | 'fallback' | 'error';
  reviewRemarks?: string;
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
  source?: string;
  entryPoint?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface StudentCopilotConversation {
  id: string;
  studentId: string;
  classId?: string | null;
  subject?: string | null;
  weekKey?: string | null;
  title?: string | null;
  threadType?: 'weekly_subject' | 'checkpoint' | 'free_study';
  summary?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string | null;
}

export interface StudentCopilotConversationMessage {
  id: string;
  conversationId: string;
  role: LLMRole;
  content: string;
  intent?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

export interface CopilotPreferences {
  explanationLength: 'short' | 'normal' | 'detailed';
  tone: 'neutral' | 'encouraging';
  showStepLabels: boolean; // e.g. Given/Goal/Plan/Check
}

export interface UserSettings {
  role: UserRole;
  displayName?: string;
  preferredTheme?: 'system' | 'light' | 'dark';
  copilotPreferences: CopilotPreferences;
}

export type SourceSnippetType = 'file' | 'question' | 'assignment' | 'resource';

export interface SourceSnippet {
  id: string; // file id, question id, or resource id
  label: string; // human friendly short name
  type: SourceSnippetType;
  snippet?: string; // optional short preview or extracted text
}

export interface Citation {
  sourceId: string;
  label?: string;
  pageNumber?: number;
  snippet?: string;
  boundingBox?: { x: number; y: number; w: number; h: number };
}

export interface HomeAction {
  timeframe: string;  // e.g., "Tonight", "This week", "Next week"
  duration: string;   // e.g., "5 minutes", "10 minutes"
  action: string;     // Specific, conversational action
}

export type StudentQuestionMode = 'exploratory' | 'details' | 'dig_deeper' | 'wrap_up' | 'firmness';

export interface CopilotContextSummary {
  role: 'student' | 'teacher' | 'parent';
  activeAssignmentId?: string | null;
  activeQuestionId?: string | null;
  sourceSnippets: SourceSnippet[];
  studentQuestionMode?: StudentQuestionMode | null;
}

export type ArtifactKind = 'study_guide' | 'lesson_plan' | 'rubric' | 'parent_report';

export interface CopilotArtifact {
  id: string;
  kind: ArtifactKind;
  title: string;
  summary: string;
  content: string; // markdown or structured text
}

// Guardian Agent stubs for audit logging (future: full implementation)
export interface GuardianAuditEvent {
  id: string;
  role: 'student' | 'teacher' | 'parent';
  timestamp: string;
  interactionId?: string;
  category: 'safety' | 'privacy' | 'escalation';
  message: string;
}

export type CopilotStyle = 'balanced' | 'more_creative' | 'more_precise';
