import {
  IProviderAdapter,
  ProviderId,
  GenerateRequest,
  GenerateResponse,
  StreamChunk,
  ClassifiedError
} from './types.js';

/**
 * Common base provider adapter with error classification & usage estimation
 */
export abstract class BaseAdapter implements IProviderAdapter {
  abstract readonly id: ProviderId;
  abstract readonly name: string;
  abstract readonly isLocal: boolean;

  abstract isAvailable(): boolean;
  abstract generate(req: GenerateRequest): Promise<GenerateResponse>;
  abstract stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse>;

  supportsVision(): boolean {
    return false;
  }
  supportsAudio(): boolean {
    return false;
  }
  supportsTools(): boolean {
    return false;
  }

  estimateUsage(req: GenerateRequest): { estimatedTokens: number } {
    const totalChars = req.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) + (req.systemPrompt?.length || 0);
    return { estimatedTokens: Math.ceil(totalChars / 4) };
  }

  classifyError(err: unknown): ClassifiedError {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();

    if (lower.includes('rate limit') || lower.includes('429') || lower.includes('too many requests')) {
      return { code: 'RATE_LIMIT', message: msg, retryable: true, providerId: this.id };
    }
    if (lower.includes('quota') || lower.includes('exhausted') || lower.includes('resource_exhausted')) {
      return { code: 'QUOTA_EXHAUSTED', message: msg, retryable: false, providerId: this.id };
    }
    if (lower.includes('auth') || lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
      return { code: 'AUTH_FAILURE', message: msg, retryable: false, providerId: this.id };
    }
    if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('econnaborted')) {
      return { code: 'TIMEOUT', message: msg, retryable: true, providerId: this.id };
    }
    if (lower.includes('500') || lower.includes('502') || lower.includes('503') || lower.includes('service unavailable')) {
      return { code: 'OUTAGE', message: msg, retryable: true, providerId: this.id };
    }

    return { code: 'UNKNOWN', message: msg, retryable: false, providerId: this.id };
  }

  async healthCheck(): Promise<{ providerId: ProviderId; status: 'healthy' | 'degraded' | 'unavailable' | 'not_configured'; message?: string }> {
    if (!this.isAvailable()) {
      return { providerId: this.id, status: 'not_configured', message: 'API key not configured' };
    }
    return { providerId: this.id, status: 'healthy' };
  }
}

/**
 * Gemini Provider Adapter (REST API)
 */
export class GeminiAdapter extends BaseAdapter {
  readonly id: ProviderId = 'gemini';
  readonly name = 'Google Gemini AI';
  readonly isLocal = false;

  constructor(private apiKey?: string) {
    super();
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  supportsVision(): boolean {
    return true;
  }
  supportsTools(): boolean {
    return true;
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('[GeminiAdapter] API key not configured');
    }

    const start = Date.now();
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body: any = { contents };
    if (req.systemPrompt) {
      body.systemInstruction = { parts: [{ text: req.systemPrompt }] };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${errorText}`);
      }

      const data: any = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text,
        providerId: this.id,
        model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
          totalTokens: data.usageMetadata?.totalTokenCount
        },
        latencyMs: Date.now() - start,
        isFallback: false,
        provenance: {
          source: 'Google Gemini 1.5 Flash',
          timestamp: Date.now()
        }
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse> {
    // For standard fetch streaming or fallback to non-streaming chunk delivery
    const res = await this.generate(req);
    onChunk({ delta: res.text, done: true, providerId: this.id });
    return res;
  }
}

/**
 * Groq Provider Adapter (REST OpenAI-compatible API)
 */
export class GroqAdapter extends BaseAdapter {
  readonly id: ProviderId = 'groq';
  readonly name = 'GroqCloud LPU Engine';
  readonly isLocal = false;

  constructor(private apiKey?: string) {
    super();
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  supportsTools(): boolean {
    return true;
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('[GroqAdapter] API key not configured');
    }

    const start = Date.now();
    const model = 'llama-3.3-70b-versatile';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const messages = [];
    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }
    messages.push(...req.messages.map((m) => ({ role: m.role, content: m.content })));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens ?? 2048
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Groq HTTP ${res.status}: ${errorText}`);
      }

      const data: any = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        providerId: this.id,
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        },
        latencyMs: Date.now() - start,
        isFallback: false,
        provenance: {
          source: 'Groq LPU Engine',
          timestamp: Date.now()
        }
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse> {
    const res = await this.generate(req);
    onChunk({ delta: res.text, done: true, providerId: this.id });
    return res;
  }
}

/**
 * Hugging Face Provider Adapter
 */
export class HuggingFaceAdapter extends BaseAdapter {
  readonly id: ProviderId = 'huggingface';
  readonly name = 'Hugging Face Inference';
  readonly isLocal = false;

  constructor(private token?: string) {
    super();
  }

  isAvailable(): boolean {
    return Boolean(this.token && this.token.length > 5);
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('[HuggingFaceAdapter] API token not configured');
    }

    const start = Date.now();
    const model = 'Qwen/Qwen2.5-Coder-32B-Instruct';
    const url = `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`;

    const messages = [];
    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }
    messages.push(...req.messages.map((m) => ({ role: m.role, content: m.content })));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens ?? 2048
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HuggingFace HTTP ${res.status}: ${errorText}`);
      }

      const data: any = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        providerId: this.id,
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        },
        latencyMs: Date.now() - start,
        isFallback: false,
        provenance: {
          source: 'Hugging Face Router',
          timestamp: Date.now()
        }
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse> {
    const res = await this.generate(req);
    onChunk({ delta: res.text, done: true, providerId: this.id });
    return res;
  }
}

/**
 * OpenRouter Provider Adapter
 */
export class OpenRouterAdapter extends BaseAdapter {
  readonly id: ProviderId = 'openrouter';
  readonly name = 'OpenRouter Failover Gateway';
  readonly isLocal = false;

  constructor(private apiKey?: string) {
    super();
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isAvailable()) {
      throw new Error('[OpenRouterAdapter] API key not configured');
    }

    const start = Date.now();
    const model = 'meta-llama/llama-3.1-8b-instruct:free';
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const messages = [];
    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }
    messages.push(...req.messages.map((m) => ({ role: m.role, content: m.content })));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://adhy.tech',
          'X-Title': 'Mini-Adhy Backend'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens ?? 2048
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${errorText}`);
      }

      const data: any = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        providerId: this.id,
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        },
        latencyMs: Date.now() - start,
        isFallback: false,
        provenance: {
          source: 'OpenRouter Gateway',
          timestamp: Date.now()
        }
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse> {
    const res = await this.generate(req);
    onChunk({ delta: res.text, done: true, providerId: this.id });
    return res;
  }
}

/**
 * Ollama Local Provider Adapter
 */
export class OllamaAdapter extends BaseAdapter {
  readonly id: ProviderId = 'ollama';
  readonly name = 'Local Ollama Engine';
  readonly isLocal = true;

  constructor(private baseUrl: string = 'http://127.0.0.1:11434') {
    super();
  }

  isAvailable(): boolean {
    return Boolean(this.baseUrl);
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    const start = Date.now();
    const model = 'llama3.2';
    const url = `${this.baseUrl}/api/chat`;

    const messages = [];
    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }
    messages.push(...req.messages.map((m) => ({ role: m.role, content: m.content })));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
      }

      const data: any = await res.json();
      const text = data.message?.content || '';

      return {
        text,
        providerId: this.id,
        model,
        latencyMs: Date.now() - start,
        isFallback: false,
        provenance: {
          source: 'Local Ollama Model',
          timestamp: Date.now()
        }
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse> {
    const res = await this.generate(req);
    onChunk({ delta: res.text, done: true, providerId: this.id });
    return res;
  }
}

