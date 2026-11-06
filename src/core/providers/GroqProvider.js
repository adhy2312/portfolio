/**
 * ════════════════════════════════════════════════════════════════════
 *  GROQCLOUD LPU MODEL PROVIDER ADAPTER
 * ════════════════════════════════════════════════════════════════════
 */

import { BaseProvider } from './BaseProvider';
import { queryGroqLpu, GROQ_MODELS } from '../ai/GroqLpuBridge';

export class GroqProvider extends BaseProvider {
  constructor({ endpoint = '/api/groq' } = {}) {
    super({ id: 'groq', name: 'GroqCloud LPU', isLocal: false, isHosted: true });
    this.endpoint = endpoint;
    this.defaultModel = GROQ_MODELS.PRIMARY || 'qwen/qwen3.8-27b';
  }

  getCapabilities() {
    return {
      textGeneration: true,
      streaming: false,
      toolCalling: false,
      vision: false,
      structuredOutput: true,
      contextWindow: 131072, // 128k
      isFreeTierAvailable: true,
      highSpeedTokensPerSec: 500
    };
  }

  getConfiguredModels() {
    return [
      { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B LPU', tier: 'fast_reflex' },
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B MoE', tier: 'reasoning' }
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
    } catch {
      this.status = 'unavailable';
    }
    this.lastHealthCheck = new Date().toISOString();
    return { providerId: this.id, status: this.status, timestamp: this.lastHealthCheck };
  }

  async generate(request, options = {}) {
    const requestId = options.requestId || `groq_${Date.now()}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const startTime = Date.now();
    try {
      const prompt = typeof request === 'string' ? request : (request.prompt || '');
      const result = await queryGroqLpu(
        options.agentId || 'MINI_ADHY',
        prompt,
        options.context || {},
        {
          activePrompt: options.systemPrompt,
          model: options.model || this.defaultModel,
          max_tokens: options.maxTokens || 1200
        }
      );

      const durationMs = Date.now() - startTime;
      const text = result?.response || result?.text || '';

      if (result?.fallbackMode && !text) {
        throw new Error('Groq upstream fallback engaged');
      }

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

