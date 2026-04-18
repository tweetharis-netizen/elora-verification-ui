import type { LLMResponse, ProviderCallArgs, LLMMessage } from '../types.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiRole = 'user' | 'model';

interface GeminiContent {
  role: GeminiRole;
  parts: Array<{ text: string }>;
}

const readGeminiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('[gemini] Missing GEMINI_API_KEY');
  }
  return apiKey;
};

const toGeminiRole = (role: LLMMessage['role']): GeminiRole => {
  return role === 'assistant' ? 'model' : 'user';
};

const toGeminiContents = (messages: LLMMessage[]): GeminiContent[] => {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: toGeminiRole(message.role),
      parts: [{ text: message.content }],
    }));
};

const injectSystemInstruction = (messages: LLMMessage[], contents: GeminiContent[]): GeminiContent[] => {
  const systemInstruction = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n\n');

  if (!systemInstruction) {
    return contents;
  }

  const systemText = `System instruction:\n${systemInstruction}`;

  if (contents.length === 0) {
    return [{ role: 'user', parts: [{ text: systemText }] }];
  }

  const firstTurn = contents[0];
  if (firstTurn.role === 'user') {
    const firstText = firstTurn.parts.map((part) => part.text).join('\n');
    return [
      {
        role: 'user',
        parts: [{ text: `${systemText}\n\n${firstText}`.trim() }],
      },
      ...contents.slice(1),
    ];
  }

  return [{ role: 'user', parts: [{ text: systemText }] }, ...contents];
};

const readGeminiContent = (payload: any): string => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

export async function callGemini(args: ProviderCallArgs): Promise<LLMResponse> {
  const apiKey = readGeminiKey();
  const endpoint = `${GEMINI_BASE_URL}/${args.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = injectSystemInstruction(args.messages, toGeminiContents(args.messages));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: args.temperature,
        maxOutputTokens: args.maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`[gemini] Request failed (${response.status}): ${errorPayload}`);
  }

  const data = await response.json();
  const content = readGeminiContent(data);

  if (!content) {
    throw new Error('[gemini] Empty response content');
  }

  return {
    content,
    raw: data,
  };
}
