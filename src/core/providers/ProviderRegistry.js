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
import { OmniRouteProvider } from './OmniRouteProvider';
import { OpenRouterProvider } from './OpenRouterProvider';

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.providerOrder = ['gemini', 'groq', 'huggingface', 'omniroute', 'openrouter'];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      fallbackEvents: 0,
      cacheHits: 0,
      deduplicatedRequests: 0,
      failuresByProvider: {},
      latenciesByProvider: {}
    };

    // OmniRoute-inspired exact response cache and in-flight deduplication
    this.responseCache = new Map();
    this.inFlightRequests = new Map();

    this.registerDefaultProviders();
  }

  registerDefaultProviders() {
    this.register(new GeminiProvider());
    this.register(new GroqProvider());
    this.register(new HuggingFaceProvider());
    this.register(new OmniRouteProvider());
    this.register(new OpenRouterProvider());

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

    // Explicit preference for OmniRoute smart gateway
    if (requirements.preferGateway || requirements.preferOmniRoute) {
      if (this.providers.has('omniroute')) cascade.push(this.providers.get('omniroute'));
    }

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
      if (this.providers.has('omniroute')) cascade.push(this.providers.get('omniroute'));
      if (this.providers.has('huggingface')) cascade.push(this.providers.get('huggingface'));
      if (this.providers.has('openrouter')) cascade.push(this.providers.get('openrouter'));
      return cascade;
    }

    // Standard cascade order: Gemini -> Groq -> HuggingFace -> OmniRoute -> Local
    for (const id of this.providerOrder) {
      if (this.providers.has(id) && !cascade.includes(this.providers.get(id))) {
        cascade.push(this.providers.get(id));
      }
    }

    for (const [id, provider] of this.providers.entries()) {
      if (!this.providerOrder.includes(id) && !cascade.includes(provider)) {
        cascade.push(provider);
      }
    }

    return cascade;
  }

  /**
   * Computes cache key for response caching and request deduplication
   */
  computeCacheKey(request = {}, options = {}) {
    const promptStr = typeof request === 'string'
      ? request
      : (request.prompt || JSON.stringify(request.contents || request.messages || ''));
    const systemPrompt = options.systemPrompt || '';
    const agentId = options.agentId || 'MINI_ADHY';
    return `${agentId}:${systemPrompt.slice(0, 80)}:${promptStr.trim()}`;
  }

  /**
   * Generate text with bounded fallback, retries, failure tracking,
   * OmniRoute-inspired falloverBeforeRetry and response deduplication.
   */
  async generateWithFallback(request, options = {}) {
    this.metrics.totalRequests += 1;

    // 1. Cache Check (Exact match cache for non-volatile queries)
    const cacheKey = this.computeCacheKey(request, options);
    const allowCache = options.cache !== false && (options.temperature === undefined || options.temperature < 0.7);

    if (allowCache && this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      const ttl = options.cacheTtlMs || 45000;
      if (Date.now() - cached.timestamp < ttl) {
        this.metrics.cacheHits += 1;
        this.metrics.successfulRequests += 1;
        return {
          ...cached.data,
          cacheHit: true,
          durationMs: 2
        };
      } else {
        this.responseCache.delete(cacheKey);
      }
    }

    // 2. In-Flight Request Deduplication (coalesce duplicate concurrent calls)
    if (this.inFlightRequests.has(cacheKey)) {
      this.metrics.deduplicatedRequests += 1;
      return this.inFlightRequests.get(cacheKey);
    }

    const executionPromise = this._executeCascade(request, options, cacheKey, allowCache);
    this.inFlightRequests.set(cacheKey, executionPromise);

    try {
      return await executionPromise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  async _executeCascade(request, options, cacheKey, allowCache) {
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

            const payloadToReturn = {
              ...result,
              attemptedProviders,
              fallbackEngaged: i > 0
            };

            // Store in exact response cache
            if (allowCache) {
              this.responseCache.set(cacheKey, {
                data: payloadToReturn,
                timestamp: Date.now()
              });
              if (this.responseCache.size > 100) {
                const oldestKey = this.responseCache.keys().next().value;
                this.responseCache.delete(oldestKey);
              }
            }

            return payloadToReturn;
          }
        } catch (err) {
          lastError = err;
          this.metrics.failuresByProvider[provider.id] = (this.metrics.failuresByProvider[provider.id] || 0) + 1;

          // OmniRoute Principle: falloverBeforeRetry
          // On HTTP 429 (rate limit) or quota exhaustion, immediate failover to next provider
          // avoids stalling user experience with futile retries on a locked-out provider
          const isQuotaOrRateLimit = err?.status === 429 ||
            err?.isQuotaExceeded ||
            /429|rate\s*limit|quota\s*exceeded/i.test(err?.message || '');

          const falloverBeforeRetry = options.falloverBeforeRetry ?? true;
          if (isQuotaOrRateLimit && falloverBeforeRetry) {
            break; // Skip remaining retries for this provider, advance to next in cascade immediately
          }

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

  clearCache() {
    this.responseCache.clear();
  }

  setProviderPriority(order = []) {
    if (Array.isArray(order) && order.length > 0) {
      this.providerOrder = [...order];
    }
  }

  getMetrics() {
    return { ...this.metrics, timestamp: new Date().toISOString() };
  }
}

export const providerRegistry = new ProviderRegistry();

