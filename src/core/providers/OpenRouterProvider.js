/**
 * ════════════════════════════════════════════════════════════════════
 *  OPENROUTER ULTIMATE INFERENCE FAILOVER ADAPTER
 * ════════════════════════════════════════════════════════════════════
 * Serves as the ultimate resilience safety net for Mini-Adhy when all
 * upstream APIs (Gemini, Groq, HuggingFace) are exhausted or unreachable.
 */

import { BaseProvider } from './BaseProvider';

export class OpenRouterProvider extends BaseProvider {
  constructor({ endpoint = '/api/openrouter' } = {}) {
    super({ id: 'openrouter', name: 'OpenRouter Failover Gateway', isLocal: false, isHosted: true });
    this.endpoint = endpoint;
    this.defaultModel = 'openrouter/auto';
  }

  getCapabilities() {
    return {
      textGeneration: true,
      streaming: false,
      toolCalling: false,
      vision: true,
      structuredOutput: true,
      contextWindow: 131072,
      isFreeTierAvailable: true,
      highSpeedTokensPerSec: 250
    };
  }

  getConfiguredModels() {
    return [
      { id: 'openrouter/auto', name: 'OpenRouter Auto Router', tier: 'auto' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Free', tier: 'reasoning' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)', tier: 'fast_reflex' }
    ];
  }

  async healthCheck() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      this.status = res.status < 500 ? 'healthy' : 'degraded';
    } catch {
      this.status = 'unavailable';
    }
    this.lastHealthCheck = new Date().toISOString();
    return { providerId: this.id, status: this.status, timestamp: this.lastHealthCheck };
  }

  async generate(request, options = {}) {
    const requestId = options.requestId || `openrouter_${Date.now()}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const startTime = Date.now();
    try {
      const prompt = typeof request === 'string' ? request : (request.prompt || '');
      const messages = request.messages || [
        { role: 'system', content: options.systemPrompt || 'You are Mini-Adhy.' },
        { role: 'user', content: prompt }
      ];

      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          messages,
          model: options.model || this.defaultModel,
          systemPrompt: options.systemPrompt,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens || 1200,
          agent: options.agentId || 'MINI_ADHY'
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`OpenRouter gateway HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.response || data.text || '';
      if (!text) {
        throw new Error('OpenRouter returned empty response payload');
      }

      const durationMs = Date.now() - startTime;
      return {
        text,
        model: data.model || this.defaultModel,
        provider: 'openrouter',
        durationMs,
        usage: data.usage || null
      };
    } finally {
      this.activeRequests.delete(requestId);
    }
  }
}

