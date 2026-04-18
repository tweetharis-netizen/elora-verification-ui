import type { LLMResponse, ProviderCallArgs } from '../types.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const readOpenRouterKey = (): string => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('[openrouter] Missing OPENROUTER_API_KEY');
  }
  return apiKey;
};

const readOpenAIContent = (payload: any): string => {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }

  return '';
};

export async function callOpenRouter(args: ProviderCallArgs): Promise<LLMResponse> {
  const apiKey = readOpenRouterKey();

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: args.temperature,
      max_tokens: args.maxTokens,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`[openrouter] Request failed (${response.status}): ${errorPayload}`);
  }

  const data = await response.json();
  const content = readOpenAIContent(data);

  if (!content) {
    throw new Error('[openrouter] Empty response content');
  }

  return {
    content,
    raw: data,
  };
}
