/**
 * ════════════════════════════════════════════════════════════════════
 *  OPENAI-COMPATIBLE GENERIC MODEL PROVIDER ADAPTER
 * ════════════════════════════════════════════════════════════════════
 * Universal provider adapter for:
 * • OpenRouter (hosted open & closed weights)
 * • Cerebras (ultra-fast CS-3 wafer inference)
 * • Local Ollama (http://localhost:11434/v1)
 * • Local vLLM / llama.cpp server (http://localhost:8080/v1)
 */

import { BaseProvider } from './BaseProvider';

export class OpenAICompatibleProvider extends BaseProvider {
  constructor({
    id = 'openai-compatible',
    name = 'OpenAI Compatible Endpoint',
    baseUrl = 'http://localhost:11434/v1',
    apiKey = null,
    defaultModel = 'llama3',
    isLocal = true,
    isHosted = false
  } = {}) {
    super({ id, name, isLocal, isHosted });
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  getCapabilities() {
    return {
      textGeneration: true,
      streaming: true,
      toolCalling: true,
      vision: false,
      structuredOutput: true,
      contextWindow: 32768,
      isLocal: this.isLocal
    };
  }

  async healthCheck() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const headers = {};
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const res = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeout);
      this.status = res.ok ? 'healthy' : 'degraded';
    } catch {
      this.status = 'unavailable';
    }
    this.lastHealthCheck = new Date().toISOString();
    return { providerId: this.id, status: this.status, timestamp: this.lastHealthCheck };
  }

  async generate(request, options = {}) {
    const requestId = options.requestId || `oai_${Date.now()}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const startTime = Date.now();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const messages = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      if (typeof request === 'string') {
        messages.push({ role: 'user', content: request });
      } else if (Array.isArray(request.messages)) {
        messages.push(...request.messages);
      } else if (request.prompt) {
        messages.push({ role: 'user', content: request.prompt });
      }

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1200
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`OpenAI-compatible endpoint returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const durationMs = Date.now() - startTime;

      return {
        success: Boolean(text),
        text,
        provider: this.id,
        model: options.model || this.defaultModel,
        durationMs,
        tokenEstimate: Math.ceil(text.length / 3.8)
      };
    } finally {
      this.activeRequests.delete(requestId);
    }
  }
}

