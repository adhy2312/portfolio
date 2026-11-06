/**
 * ════════════════════════════════════════════════════════════════════
 *  BASE MODEL PROVIDER CONTRACT
 * ════════════════════════════════════════════════════════════════════
 * Standardized provider-independent interface for all LLM backends.
 */

export class BaseProvider {
  constructor({ id, name, isLocal = false, isHosted = true } = {}) {
    this.id = id;
    this.name = name;
    this.isLocal = isLocal;
    this.isHosted = isHosted;
    this.lastHealthCheck = null;
    this.status = 'unknown'; // 'healthy' | 'degraded' | 'unavailable' | 'not_configured'
    this.activeRequests = new Map();
  }

  /**
   * Primary text generation contract
   */
  async generate(request, options = {}) {
    throw new Error(`generate() not implemented on provider: ${this.id}`);
  }

  /**
   * Stream text generation contract (optional)
   */
  async stream(request, options = {}) {
    throw new Error(`stream() not supported on provider: ${this.id}`);
  }

  /**
   * Health check contract
   */
  async healthCheck() {
    return {
      providerId: this.id,
      status: this.status,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Capabilities descriptor
   */
  getCapabilities() {
    return {
      textGeneration: true,
      streaming: false,
      toolCalling: false,
      vision: false,
      structuredOutput: false,
      contextWindow: 8192
    };
  }

  /**
   * List configured models
   */
  getConfiguredModels() {
    return [];
  }

  /**
   * Cancel active request
   */
  cancel(requestId) {
    if (this.activeRequests.has(requestId)) {
      const controller = this.activeRequests.get(requestId);
      if (controller && typeof controller.abort === 'function') {
        controller.abort();
      }
      this.activeRequests.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Approximate cost estimation
   */
  estimateCost(inputTokens = 0, outputTokens = 0) {
    return { estimatedCostUsd: 0.0, isFreeRoute: true };
  }
}

