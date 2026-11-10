import { AppConfig } from '../config/env.js';
import {
  IProviderAdapter,
  ProviderId,
  GenerateRequest,
  GenerateResponse,
  StreamChunk,
  ClassifiedError
} from './types.js';
import {
  GeminiAdapter,
  GroqAdapter,
  HuggingFaceAdapter,
  OpenRouterAdapter,
  OllamaAdapter
} from './adapters.js';

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  fallbacksTriggered: number;
  failuresByProvider: Record<string, number>;
}

export class ProviderGateway {
  private adapters = new Map<ProviderId, IProviderAdapter>();
  private circuitBreakers = new Map<ProviderId, { failureCount: number; cooldownUntil: number }>();
  private metrics: GatewayMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    fallbacksTriggered: 0,
    failuresByProvider: {}
  };

  constructor(private config: AppConfig) {
    this.register(new GeminiAdapter(config.GEMINI_API_KEY));
    this.register(new GroqAdapter(config.GROQ_API_KEY));
    this.register(new HuggingFaceAdapter(config.HF_TOKEN));
    this.register(new OpenRouterAdapter(config.OPENROUTER_API_KEY));
    this.register(new OllamaAdapter(config.OLLAMA_BASE_URL));
  }

  public register(adapter: IProviderAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(id: ProviderId): IProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  public getMetrics(): GatewayMetrics {
    return { ...this.metrics };
  }

  /**
   * Determine preferred provider cascade based on privacy, task, and health
   */
  public selectProviderCascade(req: GenerateRequest): IProviderAdapter[] {
    // 1. STRICT_LOCAL or SENSITIVE privacy constraint: Never send to cloud
    if (req.privacyClass === 'STRICT_LOCAL' || req.privacyClass === 'SENSITIVE') {
      const ollama = this.adapters.get('ollama');
      if (ollama && ollama.isAvailable() && this.isCircuitOpen(ollama.id) === false) {
        return [ollama];
      }
      throw new Error(`[Privacy Guard] ${req.privacyClass} content cannot be processed: No local provider (Ollama) is available.`);
    }

    // 2. OWNER_ONLY privacy constraint: Route locally unless explicitly authorized for cloud
    if (req.privacyClass === 'OWNER_ONLY' && !this.config.ALLOW_OWNER_DATA_ON_CLOUD) {
      const ollama = this.adapters.get('ollama');
      if (ollama && ollama.isAvailable() && this.isCircuitOpen(ollama.id) === false) {
        return [ollama];
      }
      throw new Error('[Privacy Guard] OWNER_ONLY content cannot be processed on cloud when ALLOW_OWNER_DATA_ON_CLOUD is false: Local provider (Ollama) is unavailable.');
    }

    // 3. Multimodal Vision constraint
    if (req.taskType === 'vision') {
      if (req.privacyClass === 'OWNER_ONLY' && !this.config.ALLOW_OWNER_DATA_ON_CLOUD) {
        throw new Error('[Privacy Guard] Private/sensitive vision analysis cannot be delegated to cloud AI providers.');
      }
      const gemini = this.adapters.get('gemini');
      if (gemini && gemini.isAvailable() && !this.isCircuitOpen(gemini.id)) {
        return [gemini];
      }
      throw new Error('[Capability Guard] Vision task requested, but no vision-capable provider is currently active.');
    }

    // 4. Preferred candidate cascade
    let preferredOrder: ProviderId[] = ['gemini', 'groq', 'huggingface', 'openrouter', 'ollama'];
    if (req.taskType === 'fast_reflex') {
      preferredOrder = ['groq', 'gemini', 'huggingface', 'openrouter', 'ollama'];
    }

    const available: IProviderAdapter[] = [];
    for (const id of preferredOrder) {
      const adapter = this.adapters.get(id);
      if (adapter && adapter.isAvailable() && !this.isCircuitOpen(id)) {
        available.push(adapter);
      }
    }

    if (available.length === 0) {
      throw new Error('[ProviderGateway] All candidate AI providers are unavailable or circuit-broken.');
    }

    return available;
  }

  /**
   * Execute request with bounded fallback cascade
   */
  public async generate(req: GenerateRequest): Promise<GenerateResponse> {
    this.metrics.totalRequests++;
    const cascade = this.selectProviderCascade(req);
    const errors: ClassifiedError[] = [];

    for (let i = 0; i < cascade.length; i++) {
      const adapter = cascade[i];
      const isFallback = i > 0;

      // Anti-leak invariant: Never fall back from local to cloud for private/sensitive data
      if (isFallback && !adapter.isLocal && (req.privacyClass === 'STRICT_LOCAL' || req.privacyClass === 'SENSITIVE' || (req.privacyClass === 'OWNER_ONLY' && !this.config.ALLOW_OWNER_DATA_ON_CLOUD))) {
        throw new Error(`[Privacy Guard] Prohibited fallback: Cannot fall back to cloud provider '${adapter.id}' for ${req.privacyClass} data.`);
      }

      if (isFallback) {
        this.metrics.fallbacksTriggered++;
      }

      try {
        const response = await adapter.generate(req);
        this.metrics.successfulRequests++;
        this.recordSuccess(adapter.id);

        return {
          ...response,
          isFallback
        };
      } catch (err) {
        const classified = adapter.classifyError(err);
        errors.push(classified);
        this.recordFailure(adapter.id, classified);

        // If privacy violation or non-retryable auth failure, do not spam other providers
        if (classified.code === 'PRIVACY_VIOLATION') {
          throw new Error(`[Privacy Violation] ${classified.message}`);
        }
      }
    }

    // Truthful aggregate error if all candidates in cascade fail
    const errorSummaries = errors.map((e) => `[${e.providerId}:${e.code}] ${e.message}`).join(' | ');
    throw new Error(`All providers in fallback cascade failed: ${errorSummaries}`);
  }

  /**
   * Streaming execution
   */
  public async stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse> {
    const cascade = this.selectProviderCascade(req);
    const errors: ClassifiedError[] = [];

    for (let i = 0; i < cascade.length; i++) {
      const adapter = cascade[i];
      const isFallback = i > 0;

      // Anti-leak invariant: Never fall back from local to cloud for private/sensitive data
      if (isFallback && !adapter.isLocal && (req.privacyClass === 'STRICT_LOCAL' || req.privacyClass === 'SENSITIVE' || (req.privacyClass === 'OWNER_ONLY' && !this.config.ALLOW_OWNER_DATA_ON_CLOUD))) {
        throw new Error(`[Privacy Guard] Prohibited fallback: Cannot fall back to cloud provider '${adapter.id}' for ${req.privacyClass} data.`);
      }

      try {
        const response = await adapter.stream(req, onChunk);
        this.recordSuccess(adapter.id);
        return {
          ...response,
          isFallback
        };
      } catch (err) {
        const classified = adapter.classifyError(err);
        errors.push(classified);
        this.recordFailure(adapter.id, classified);
      }
    }

    throw new Error(`Streaming failed across all available providers: ${errors.map((e) => e.message).join(' | ')}`);
  }

  /**
   * Health status across all registered providers
   */
  public async getHealthStatus(): Promise<Record<ProviderId, any>> {
    const results: Record<string, any> = {};
    for (const [id, adapter] of this.adapters.entries()) {
      results[id] = await adapter.healthCheck();
      results[id].isLocal = adapter.isLocal;
      results[id].circuitOpen = this.isCircuitOpen(id);
    }
    return results;
  }

  private isCircuitOpen(id: ProviderId): boolean {
    const cb = this.circuitBreakers.get(id);
    if (!cb) return false;
    if (Date.now() > cb.cooldownUntil) {
      // Cooldown expired, half-open
      this.circuitBreakers.delete(id);
      return false;
    }
    return cb.failureCount >= 3;
  }

  private recordSuccess(id: ProviderId) {
    this.circuitBreakers.delete(id);
  }

  private recordFailure(id: ProviderId, err: ClassifiedError) {
    this.metrics.failuresByProvider[id] = (this.metrics.failuresByProvider[id] || 0) + 1;
    const current = this.circuitBreakers.get(id) || { failureCount: 0, cooldownUntil: 0 };
    current.failureCount++;
    // If 3 consecutive failures, back off for 60 seconds
    if (current.failureCount >= 3) {
      current.cooldownUntil = Date.now() + 60000;
    }
    this.circuitBreakers.set(id, current);
  }
}
