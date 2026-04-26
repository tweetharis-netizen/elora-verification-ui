type EloraMessageRole = 'system' | 'user' | 'assistant';

export type EloraAgentName =
  | 'assignment-objectives'
  | 'assignment-tasks'
  | 'assignment-quality';

export type EloraLlmCallOptions = {
  agentName: EloraAgentName;
  messages: Array<{ role: EloraMessageRole; content: string }>;
  temperature?: number;
  maxTokens?: number;
};

type EloraLlmProvider = 'openai' | 'openrouter' | 'gemini' | 'mock';
type RealEloraLlmProvider = Exclude<EloraLlmProvider, 'mock'>;

type AgentModelDefaults = {
  temperature: number;
  maxTokens: number;
};

export class EloraLlmClientError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONFIG' | 'TIMEOUT' | 'PROVIDER' | 'INVALID_RESPONSE',
  ) {
    super(message);
    this.name = 'EloraLlmClientError';
  }
}

const REQUEST_TIMEOUT_MS = 18000;

const AGENT_DEFAULTS: Record<EloraAgentName, AgentModelDefaults> = {
  'assignment-objectives': {
    temperature: 0.5,
    maxTokens: 512,
  },
  'assignment-tasks': {
    temperature: 0.45,
    maxTokens: 700,
  },
  'assignment-quality': {
    temperature: 0.3,
    maxTokens: 450,
  },
};

const normalizeProvider = (): string => (process.env.ELORA_LLM_PROVIDER || '').trim().toLowerCase();

const toRealProvider = (value: string): RealEloraLlmProvider | undefined => {
  if (value === 'openai') return 'openai';
  if (value === 'openrouter') return 'openrouter';
  if (value === 'gemini') return 'gemini';
  return undefined;
};

const readModelEnv = (keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const resolveModel = ({
  agentName,
}: {
  agentName: EloraAgentName;
}): string | undefined => {
  if (agentName === 'assignment-objectives') {
    return readModelEnv(['ELORA_LLM_MODEL_ASSIGNMENT_OBJECTIVES', 'ELORA_LLM_MODEL']);
  }

  if (agentName === 'assignment-tasks') {
    return readModelEnv(['ELORA_LLM_MODEL_ASSIGNMENT_TASKS', 'ELORA_LLM_MODEL']);
  }

  return readModelEnv(['ELORA_LLM_MODEL_ASSIGNMENT_QUALITY', 'ELORA_LLM_MODEL']);
};

const resolveApiKey = (provider: RealEloraLlmProvider): string => {
  const common = process.env.ELORA_LLM_API_KEY?.trim();
  if (common) return common;

  if (provider === 'openai') {
    return (
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.ELORA_OPENAI_API_KEY?.trim() ||
      process.env.ELORA_LLM_OPENAI_API_KEY?.trim() ||
      ''
    );
  }

  if (provider === 'openrouter') {
    return (
      process.env.OPENROUTER_API_KEY?.trim() ||
      process.env.ELORA_OPENROUTER_API_KEY?.trim() ||
      process.env.ELORA_LLM_OPENROUTER_API_KEY?.trim() ||
      ''
    );
  }

  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.ELORA_GEMINI_API_KEY?.trim() ||
    process.env.ELORA_LLM_GEMINI_API_KEY?.trim() ||
    ''
  );
};

const resolveOpenAiCompatibleBaseUrl = (provider: 'openai' | 'openrouter'): string => {
  const customBaseUrl = process.env.ELORA_LLM_BASE_URL?.trim();
  if (customBaseUrl) return customBaseUrl;

  return provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
};

const resolveGeminiBaseUrl = (): string => {
  return process.env.ELORA_LLM_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta/models';
};

const parseOpenAiStyleContent = (payload: unknown): string => {
  const content = (payload as any)?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }
  return '';
};

const parseGeminiContent = (payload: unknown): string => {
  const parts = (payload as any)?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

const withTimeout = async (request: (signal: AbortSignal) => Promise<Response>): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await request(controller.signal);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new EloraLlmClientError('LLM request timed out', 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const callOpenAiCompatible = async ({
  provider,
  model,
  apiKey,
  messages,
  temperature,
  maxTokens,
}: {
  provider: 'openai' | 'openrouter';
  model: string;
  apiKey: string;
  messages: Array<{ role: EloraMessageRole; content: string }>;
  temperature: number;
  maxTokens: number;
}): Promise<string> => {
  const baseUrl = resolveOpenAiCompatibleBaseUrl(provider);

  const response = await withTimeout((signal) =>
    fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    }),
  );

  if (!response.ok) {
    await response.text();
    throw new EloraLlmClientError(
      `[${provider}] request failed (${response.status})`,
      'PROVIDER',
    );
  }

  const data = await response.json();
  const content = parseOpenAiStyleContent(data);
  if (!content) {
    throw new EloraLlmClientError(`[${provider}] empty response`, 'INVALID_RESPONSE');
  }
  return content;
};

const callGemini = async ({
  model,
  apiKey,
  messages,
  temperature,
  maxTokens,
}: {
  model: string;
  apiKey: string;
  messages: Array<{ role: EloraMessageRole; content: string }>;
  temperature: number;
  maxTokens: number;
}): Promise<string> => {
  const baseUrl = resolveGeminiBaseUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemText = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n\n');

  const userTurns = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  const contents = systemText
    ? [{ role: 'user', parts: [{ text: `System instruction:\n${systemText}` }] }, ...userTurns]
    : userTurns;

  const response = await withTimeout((signal) =>
    fetch(endpoint, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }),
  );

  if (!response.ok) {
    throw new EloraLlmClientError(`[gemini] request failed (${response.status})`, 'PROVIDER');
  }

  const data = await response.json();
  const content = parseGeminiContent(data);
  if (!content) {
    throw new EloraLlmClientError('[gemini] empty response', 'INVALID_RESPONSE');
  }

  return content;
};

const callMock = ({ agentName }: { agentName: EloraAgentName }): string => {
  if (agentName === 'assignment-objectives') {
    return JSON.stringify([
      'Students will be able to explain key ideas from the topic using clear examples.',
      'Students will be able to compare at least two strategies and choose one that fits the task.',
      'Students will be able to solve age-appropriate problems and justify their reasoning.',
    ]);
  }

  if (agentName === 'assignment-tasks') {
    return JSON.stringify({
      tasks: [
        {
          title: 'Warm-up: What do you already know?',
          type: 'warmup',
          minutes: 8,
          instructions:
            'Think about what you already know about this topic. Write two or three sentences about what you remember and share one question you still have.',
        },
        {
          title: 'Main activity: Explore and apply',
          type: 'main',
          minutes: 20,
          instructions:
            'Work through the provided materials and complete the activity. Focus on understanding the key ideas and apply them to the examples given. Record your thinking as you go.',
        },
        {
          title: 'Extension: Go deeper',
          type: 'main',
          minutes: 12,
          instructions:
            'Choose one idea from the main activity and explain it in your own words. Can you think of a real-life example where this idea applies?',
        },
        {
          title: 'Reflection: What did you learn?',
          type: 'reflection',
          minutes: 5,
          instructions:
            'Write two to three sentences about what you learned today. What was the most surprising idea? What would you like to explore more?',
        },
      ],
    });
  }

  if (agentName === 'assignment-quality') {
    return JSON.stringify({
      feedback: [
        'Consider adding a short warm-up question to activate prior knowledge before the main activity.',
        'Make sure at least one task explicitly connects to each learning objective so students see the link.',
        'Check that student-facing instructions use plain language — avoid jargon where possible.',
        'If the total estimated time exceeds 45 minutes, consider splitting the assignment across two sessions.',
      ],
    });
  }

  return '{}';
};

export async function callModel(options: EloraLlmCallOptions): Promise<string> {
  const defaults = AGENT_DEFAULTS[options.agentName];

  const messages = options.messages
    .map((message) => ({ role: message.role, content: message.content.trim() }))
    .filter((message) => message.content.length > 0);

  if (messages.length === 0) {
    throw new EloraLlmClientError('No messages provided', 'CONFIG');
  }

  const temperature = options.temperature ?? defaults.temperature;
  const maxTokens = options.maxTokens ?? defaults.maxTokens;
  const rawProvider = normalizeProvider();
  if (!rawProvider || rawProvider === 'mock') {
    return callMock({ agentName: options.agentName });
  }

  const provider = toRealProvider(rawProvider);
  if (!provider) {
    console.warn('[elora-llm-client] unknown provider, using mock', {
      provider: rawProvider,
      agentName: options.agentName,
    });
    return callMock({ agentName: options.agentName });
  }

  const model = resolveModel({ agentName: options.agentName });
  const apiKey = resolveApiKey(provider);
  const missing: string[] = [];
  if (!apiKey) missing.push('apiKey');
  if (!model) missing.push('model');

  if (missing.length > 0) {
    console.warn('[elora-llm-client] missing provider config, using mock', {
      provider,
      agentName: options.agentName,
      missing,
    });
    return callMock({ agentName: options.agentName });
  }

  try {
    if (provider === 'gemini') {
      return await callGemini({ model, apiKey, messages, temperature, maxTokens });
    }

    return await callOpenAiCompatible({ provider, model, apiKey, messages, temperature, maxTokens });
  } catch (error) {
    if (error instanceof EloraLlmClientError) {
      console.error('[elora-llm-client] provider call failed', {
        provider,
        agentName: options.agentName,
        code: error.code,
        message: error.message,
      });
      throw error;
    }

    console.error('[elora-llm-client] unexpected provider error', {
      provider,
      agentName: options.agentName,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new EloraLlmClientError(`[${provider}] unexpected provider error`, 'PROVIDER');
  }
}
