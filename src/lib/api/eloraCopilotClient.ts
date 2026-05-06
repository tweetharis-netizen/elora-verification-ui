import { getAuthHeaders } from '../../services/dataService';
import type {
  CopilotFeedbackPayload,
  CopilotFeedbackRating,
  CopilotFeedbackReason,
  LLMMessage,
  UseCase,
  UserRole,
} from '../llm/types';

export async function callEloraCopilot(params: {
  role: UserRole;
  useCase: UseCase;
  messages: LLMMessage[];
  userId?: string;
  context?: Record<string, any>;
}): Promise<string> {
  const authHeaders = getAuthHeaders();

  const response = await fetch(`/api/llm/${params.useCase}`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Elora Copilot request failed.';
    throw new Error(message);
  }

  const normalizedContent = typeof data?.content === 'string' ? data.content.trim() : '';
  if (normalizedContent) {
    return normalizedContent;
  }

  // Backward compatibility: older deployments returned { text }.
  const legacyText = typeof data?.text === 'string' ? data.text.trim() : '';
  if (legacyText) {
    return legacyText;
  }

  if (!normalizedContent && !legacyText) {
    throw new Error('Elora Copilot returned an empty response.');
  }

  return normalizedContent;
}

export async function sendCopilotFeedback(payload: {
  role: UserRole;
  useCase: string;
  messageId: string;
  threadId?: string;
  rating: CopilotFeedbackRating;
  reason?: CopilotFeedbackReason;
  comment?: string;
  source?: string;
}): Promise<void> {
  try {
    const authHeaders = getAuthHeaders();
    const response = await fetch('/api/copilot/feedback', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send copilot feedback', response.status);
    }
  } catch (error) {
    // Fire-and-forget UX: never block users from continuing the conversation.
    console.error('Failed to send copilot feedback', error);
  }
}
