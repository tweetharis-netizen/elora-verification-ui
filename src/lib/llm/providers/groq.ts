import type { LLMResponse, ProviderCallArgs } from '../types.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const readGroqKey = (): string => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('[groq] Missing GROQ_API_KEY');
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

export async function callGroq(args: ProviderCallArgs): Promise<LLMResponse> {
  const apiKey = readGroqKey();

  const response = await fetch(GROQ_URL, {
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
    throw new Error(`[groq] Request failed (${response.status}): ${errorPayload}`);
  }

  const data = await response.json();
  const content = readOpenAIContent(data);

  if (!content) {
    throw new Error('[groq] Empty response content');
  }

  return {
    content,
    raw: data,
  };
}
