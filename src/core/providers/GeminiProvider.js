/**
 * ════════════════════════════════════════════════════════════════════
 *  GOOGLE GEMINI MODEL PROVIDER ADAPTER
 * ════════════════════════════════════════════════════════════════════
 */

import { BaseProvider } from './BaseProvider';

export class GeminiProvider extends BaseProvider {
  constructor({ endpoint = '/api/gemini' } = {}) {
    super({ id: 'gemini', name: 'Google Gemini', isLocal: false, isHosted: true });
    this.endpoint = endpoint;
    this.defaultModel = 'gemini-2.5-flash';
  }

  getCapabilities() {
    return {
      textGeneration: true,
      streaming: false,
      toolCalling: true,
      vision: true,
      structuredOutput: true,
      contextWindow: 1048576, // 1M tokens
      isFreeTierAvailable: true
    };
  }

  getConfiguredModels() {
    return [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', context: 1048576, tier: 'primary' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', context: 2097152, tier: 'reasoning' }
    ];
  }

  async healthCheck() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true, agent: 'MINI_ADHY' }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      this.status = res.status < 500 ? 'healthy' : 'degraded';
    } catch (e) {
      this.status = 'unavailable';
    }
    this.lastHealthCheck = new Date().toISOString();
    return { providerId: this.id, status: this.status, timestamp: this.lastHealthCheck };
  }

  async generate(request, options = {}) {
    const requestId = options.requestId || `gem_${Date.now()}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const startTime = Date.now();
    try {
      const contents = Array.isArray(request.contents) 
        ? request.contents 
        : [{ role: 'user', parts: [{ text: request.prompt || '' }] }];

      const payload = {
        agent: options.agentId || 'MINI_ADHY',
        model: options.model || this.defaultModel,
        system_instruction: { parts: [{ text: options.systemPrompt || '' }] },
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 1500
        }
      };

      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

