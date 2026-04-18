import type { LLMResponse, ProviderCallArgs } from '../types.js';

const COHERE_CHAT_URL = 'https://api.cohere.com/v2/chat';

const readCohereKey = (): string => {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error('[cohere] Missing COHERE_API_KEY');
  }
  return apiKey;
};

export async function callCohere(args: ProviderCallArgs): Promise<LLMResponse> {
  const apiKey = readCohereKey();

  // Future implementation note:
  // This payload matches Cohere v2 chat shape and can be used once RAG wiring is added.
  const payloadPreview = {
    model: args.model,
    messages: args.messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
      })),
    temperature: args.temperature,
    max_tokens: args.maxTokens,
  };

  return {
    content: 'Cohere rag_query is not enabled yet. Please retry with another use case.',
    raw: {
      provider: 'cohere',
      endpoint: COHERE_CHAT_URL,
      apiKeyConfigured: Boolean(apiKey),
      stub: true,
      payloadPreview,
    },
  };
}
