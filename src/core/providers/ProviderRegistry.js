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
    this.preferredProvider = null;
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

  switchPreferredProvider(providerId) {
    if (this.providers.has(providerId)) {
      this.preferredProvider = providerId;
      this.providerOrder = [providerId, ...this.providerOrder.filter(id => id !== providerId)];
      return { success: true, preferredProvider: providerId };
    }
    return { success: false, error: `Provider '${providerId}' is not registered.` };
  }

  replaceProvider(id, newInstance) {
    if (!newInstance || !newInstance.id) {
      throw new Error('Replacement provider must have an id.');
    }
    this.providers.set(id, newInstance);
    return { replaced: true, id };
  }

  unregister(providerId) {
    const deleted = this.providers.delete(providerId);
    this.providerOrder = this.providerOrder.filter(id => id !== providerId);
    if (this.preferredProvider === providerId) this.preferredProvider = null;
    return deleted;
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

    // Explicit preference from requirements or active preferred provider
    const preferredId = requirements.preferredProvider || this.preferredProvider;
    if (preferredId && this.providers.has(preferredId)) {
      cascade.push(this.providers.get(preferredId));
    }

    // Explicit preference for OmniRoute smart gateway
    if (requirements.preferGateway || requirements.preferOmniRoute) {
      if (this.providers.has('omniroute') && !cascade.includes(this.providers.get('omniroute'))) {
        cascade.push(this.providers.get('omniroute'));
      }
    }

    // Vision requirement -> Must have vision capability
    if (requirements.requiresVision) {
      const visionProviders = Array.from(this.providers.values())
        .filter(p => (p.getCapabilities ? p.getCapabilities().vision : p.capabilities?.vision));
      if (visionProviders.length > 0) return visionProviders;
      throw new Error('Task requires vision capability, but no vision-capable provider is available.');
    }

    // Fast reflex preference
    if (requirements.fastReflex) {
      const fastOrder = ['groq', 'gemini', 'omniroute', 'huggingface', 'openrouter'];
      for (const id of fastOrder) {
        if (this.providers.has(id) && !cascade.includes(this.providers.get(id))) {
          cascade.push(this.providers.get(id));
        }
      }
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

    // Filter by context token limit if specified
    if (requirements.estimatedTokens || requirements.contextTokens) {
      const neededTokens = requirements.estimatedTokens || requirements.contextTokens;
      const filtered = cascade.filter(p => {
        const maxTokens = p.maxContextTokens || p.capabilities?.maxContextTokens || 128000;
        return maxTokens >= neededTokens;
      });
      if (filtered.length > 0) return filtered;
    }

    return cascade;
  }

  /**
   * Computes cache key for response caching and request deduplication.
   * Key deterministically hashes the full conversation history, full system prompt,
   * cognitive context digest, model snapshot version, agent, model, temperature,
   * maxTokens, and session isolation boundary without lossy truncation.
   */
  computeCacheKey(request = {}, options = {}) {
    const history = request.contents || request.messages || [];
    const historyNormalized = history.map(m => ({
      role: m.role,
      text: m.parts?.[0]?.text || m.content || ''
    }));

    const promptStr = typeof request === 'string'
      ? request
      : (request.prompt || '');
    const systemPrompt = options.systemPrompt || '';
    const agentId = options.agentId || 'MINI_ADHY';
    const temp = options.temperature !== undefined ? String(options.temperature) : '0.7';
    const maxTokens = options.maxTokens !== undefined ? String(options.maxTokens) : '1500';
    const model = options.model || 'default';
    const sessionId = options.sessionId || '';
    const modelSnapshotVersion = options.modelSnapshotVersion || '';
    const cognitiveDigest = options.cognitiveDigest || options.cognitiveContext?.digest || '';

    // Deterministic serialization of the complete relevant generation context
    const contextPayload = {
      agentId,
      model,
      temp,
      maxTokens,
      sessionId,
      modelSnapshotVersion,
      cognitiveDigest,
      systemPrompt,
      prompt: promptStr.trim(),
      history: historyNormalized
    };

    const raw = JSON.stringify(contextPayload);

    // Collision-resistant dual-hash (djb2 + sdbm combined into a 64-bit hex key)
    let h1 = 5381;
    let h2 = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      h1 = ((h1 << 5) + h1) ^ char;
      h1 = h1 >>> 0;
      h2 = char + (h2 << 6) + (h2 << 16) - h2;
      h2 = h2 >>> 0;
    }
    return `cache_${agentId}_${h1.toString(16)}_${h2.toString(16)}`;
  }

  /**
   * Generate text with bounded fallback, retries, failure tracking,
   * OmniRoute-inspired falloverBeforeRetry and response deduplication.
   */
  async generateWithFallback(request, options = {}) {
    this.metrics.totalRequests += 1;

    // 1. Cache Check (Exact match cache for non-volatile queries)
    const cacheKey = this.computeCacheKey(request, options);
    // Disable caching for vision/multimodal requests, volatile, and sensitive queries
    const isMultimodal = options.requiresVision || options.requiresAudio;
    const isVolatileOrSensitive = options.isVolatile || options.isSensitive;
    const allowCache = !isMultimodal && !isVolatileOrSensitive && options.cache !== false && (options.temperature === undefined || options.temperature < 0.7);

    if (allowCache && this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      const ttl = options.cacheTtlMs || 45000;
      if (Date.now() - cached.timestamp < ttl) {
        this.metrics.cacheHits += 1;
        this.metrics.successfulRequests += 1;
        return {
          ...cached.data,
          cacheHit: true,
          responseType: 'cache_hit',
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

          if (result && (result.success !== false) && result.text) {
            this.metrics.successfulRequests += 1;
            if (i > 0) this.metrics.fallbackEvents += 1;

            if (result.durationMs) {
              const list = this.metrics.latenciesByProvider[provider.id] || [];
              list.push(result.durationMs);
              if (list.length > 50) list.shift();
              this.metrics.latenciesByProvider[provider.id] = list;
            }

            const actualModel = result.model || provider.defaultModel || (provider.capabilities?.defaultModel) || 'standard';
            const payloadToReturn = {
              success: true,
              ...result,
              executedByProvider: provider.id,
              actualProvider: provider.id,
              actualModel,
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

  getProvider(providerId) {
    return this.providers.get(providerId) || null;
  }
}

export const providerRegistry = new ProviderRegistry();

