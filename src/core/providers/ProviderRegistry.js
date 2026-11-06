/**
 * ════════════════════════════════════════════════════════════════════
 *  MODEL PROVIDER REGISTRY & INTELLIGENT ROUTER
 * ════════════════════════════════════════════════════════════════════
 * Coordinates all LLM providers with:
 * • Task-based capability matching (vision, fast reflex, deep reasoning, code)
 * • Bounded fallback cascade with exponential backoff & jitter
 * • Real latency and failure tracking (no fabricated metrics)
 * • Graceful degradation when services are offline
 */

import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { HuggingFaceProvider } from './HuggingFaceProvider';
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider';

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.providerOrder = ['gemini', 'groq', 'huggingface'];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      fallbackEvents: 0,
      failuresByProvider: {},
      latenciesByProvider: {}
    };

    this.registerDefaultProviders();
  }

  registerDefaultProviders() {
    this.register(new GeminiProvider());
    this.register(new GroqProvider());
    this.register(new HuggingFaceProvider());

    // Optional local Ollama / OpenAI-compatible endpoint
    if (typeof window !== 'undefined' && window.ADHY_LOCAL_AI_ENDPOINT) {
      this.register(new OpenAICompatibleProvider({
        id: 'local-ollama',
        name: 'Local Ollama Runtime',
        baseUrl: window.ADHY_LOCAL_AI_ENDPOINT,
        isLocal: true,
        isHosted: false
      }));
    }
  }

  register(provider) {
    this.providers.set(provider.id, provider);
    if (!this.metrics.failuresByProvider[provider.id]) {
      this.metrics.failuresByProvider[provider.id] = 0;
    }
    if (!this.metrics.latenciesByProvider[provider.id]) {
      this.metrics.latenciesByProvider[provider.id] = [];
    }
  }

  get(providerId) {
    return this.providers.get(providerId) || null;
  }

  listProviders() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      isLocal: p.isLocal,
      isHosted: p.isHosted,
      capabilities: p.getCapabilities(),
      status: p.status,
      lastHealthCheck: p.lastHealthCheck
    }));
  }

  async runHealthChecks() {
    const results = {};
    for (const [id, provider] of this.providers.entries()) {
      try {
        results[id] = await provider.healthCheck();
      } catch (e) {
        results[id] = { providerId: id, status: 'unavailable', error: e.message };
      }
    }
    return results;
  }

  /**
   * Capability matching: Determine eligible provider sequence for a task
   */
  resolveProviderCascade(requirements = {}) {
    const cascade = [];

    // Vision requirement -> Must have vision capability
    if (requirements.requiresVision) {
      const visionProviders = Array.from(this.providers.values())
        .filter(p => p.getCapabilities().vision);
      if (visionProviders.length > 0) return visionProviders;
      throw new Error('Task requires vision capability, but no vision-capable provider is available.');
    }

    // Fast reflex preference
    if (requirements.fastReflex) {
      if (this.providers.has('groq')) cascade.push(this.providers.get('groq'));
      if (this.providers.has('gemini')) cascade.push(this.providers.get('gemini'));
      if (this.providers.has('huggingface')) cascade.push(this.providers.get('huggingface'));
      return cascade;
    }

    // Standard cascade order: Gemini -> Groq -> HuggingFace -> Local
    for (const id of this.providerOrder) {
      if (this.providers.has(id)) {
        cascade.push(this.providers.get(id));
      }
    }

    for (const [id, provider] of this.providers.entries()) {
      if (!this.providerOrder.includes(id)) {
        cascade.push(provider);
      }
    }

    return cascade;
  }

  /**
   * Generate text with bounded fallback, retries, and failure tracking
   */
  async generateWithFallback(request, options = {}) {
    this.metrics.totalRequests += 1;
    const cascade = this.resolveProviderCascade(options.requirements || {});
    const attemptedProviders = [];
    let lastError = null;

    for (let i = 0; i < cascade.length; i++) {
      const provider = cascade[i];
      attemptedProviders.push(provider.id);

      const maxRetries = options.maxRetriesPerProvider ?? 1;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const timeoutMs = options.timeoutMs || 8000;
          const result = await Promise.race([
            provider.generate(request, { ...options, provider: provider.id }),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs))
          ]);

          if (result && result.success && result.text) {
            this.metrics.successfulRequests += 1;
            if (i > 0) this.metrics.fallbackEvents += 1;

            if (result.durationMs) {
              const list = this.metrics.latenciesByProvider[provider.id] || [];
              list.push(result.durationMs);
              if (list.length > 50) list.shift();
              this.metrics.latenciesByProvider[provider.id] = list;
            }

            return {
              ...result,
              attemptedProviders,
              fallbackEngaged: i > 0
            };
          }
        } catch (err) {
          lastError = err;
          this.metrics.failuresByProvider[provider.id] = (this.metrics.failuresByProvider[provider.id] || 0) + 1;

          // If not the last attempt for this provider, apply short jittered backoff
          if (attempt < maxRetries) {
            const jitterMs = 150 + Math.floor(Math.random() * 200);
            await new Promise(r => setTimeout(r, jitterMs));
          }
        }
      }
    }

    // Fallback exhaustion
    return {
      success: false,
      text: '',
      error: `All available model providers exhausted. Last error: ${lastError?.message || 'unknown'}`,
      attemptedProviders,
      fallbackExhausted: true
    };
  }

  getMetrics() {
    return { ...this.metrics, timestamp: new Date().toISOString() };
  }
}

export const providerRegistry = new ProviderRegistry();

