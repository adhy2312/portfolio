/**
 * ════════════════════════════════════════════════════════════════════
 *  HUGGING FACE SERVERLESS MODEL PROVIDER ADAPTER
 * ════════════════════════════════════════════════════════════════════
 */

import { BaseProvider } from './BaseProvider';
import { queryHuggingFace, HF_SUPPORTED_MODELS } from '../ai/HuggingFaceBridge';

export class HuggingFaceProvider extends BaseProvider {
  constructor({ endpoint = '/api/huggingface' } = {}) {
    super({ id: 'huggingface', name: 'Hugging Face Open-Weights', isLocal: false, isHosted: true });
    this.endpoint = endpoint;
    this.defaultModel = 'qwen-coder';
  }

  getCapabilities() {
    return {
      textGeneration: true,
      streaming: false,
      toolCalling: false,
      vision: false,
      structuredOutput: false,
      contextWindow: 32768,
      isFreeTierAvailable: true
    };
  }

  getConfiguredModels() {
    return HF_SUPPORTED_MODELS.map(m => ({
      id: m.id,
      name: m.label,
      fullName: m.fullName,
      bestFor: m.bestFor
    }));
  }

  async healthCheck() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true, agentId: 'JARVIS' }),
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
    const requestId = options.requestId || `hf_${Date.now()}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const startTime = Date.now();
    try {
      const prompt = typeof request === 'string' ? request : (request.prompt || '');
      const result = await queryHuggingFace(
        options.agentId || 'JARVIS',
        prompt,
        {
          systemPrompt: options.systemPrompt,
          model: options.model || this.defaultModel,
          maxTokens: options.maxTokens || 800,
          temperature: options.temperature || 0.6
        }
      );

      const durationMs = Date.now() - startTime;
      const text = result?.text || '';

      if (!result?.success || !text) {
        throw new Error(result?.error || 'Hugging Face serverless generation failed');
      }

      return {
        success: true,
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

