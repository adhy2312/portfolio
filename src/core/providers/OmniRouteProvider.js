/**
 * ════════════════════════════════════════════════════════════════════
 *  OMNIRUTE SMART GATEWAY & AGGREGATOR PROVIDER ADAPTER
 * ════════════════════════════════════════════════════════════════════
 * Integrates cheaper-inference/OmniRoute (https://github.com/cheaper-inference/OmniRoute):
 * • Unified OpenAI-compatible gateway (default: http://localhost:20128/v1)
 * • Quota-aware multi-account auto-fallback and failover-before-retry
 * • Stacked context compression (RTK + Caveman token reduction)
 * • Semantic & exact response caching for cost & latency optimization
 * • Aggregates Gemini, Groq, Claude, OpenAI, DeepSeek, and local Ollama
 */

import { BaseProvider } from './BaseProvider';

export class OmniRouteProvider extends BaseProvider {
  constructor({
    id = 'omniroute',
    name = 'OmniRoute Gateway',
    baseUrl = null,
    apiProxyUrl = '/api/omniroute',
    apiKey = null,
    defaultModel = 'auto',
    strategy = 'cost-optimized',
    compression = 'rtk,caveman',
    isLocal = true,
    isHosted = false
  } = {}) {
    super({ id, name, isLocal, isHosted });

    // Resolution priority: explicit arg -> window config -> env var -> localhost default
    const envUrl = typeof process !== 'undefined' && process.env?.REACT_APP_OMNIROUTE_URL;
    const winUrl = typeof window !== 'undefined' && window.OMNIROUTE_URL;
    const resolvedUrl = baseUrl || winUrl || envUrl || 'http://localhost:20128/v1';

    this.baseUrl = resolvedUrl.replace(/\/+$/, '');
    this.apiProxyUrl = apiProxyUrl;
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.strategy = strategy;
    this.compression = compression;
    this.telemetryHistory = [];
  }

  getCapabilities() {
    return {
      textGeneration: true,
      streaming: true,
      toolCalling: true,
      vision: true, // Aggregates multi-modal upstream models
      structuredOutput: true,
      tokenCompression: true,
      semanticCaching: true,
      contextWindow: 131072,
      isLocal: this.isLocal,
      gatewayType: 'omniroute'
    };
  }

  /**
   * Health probe against OmniRoute gateway
   */
  async healthCheck() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
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
      // If direct localhost fails (e.g., in browser or proxy needed), try proxy
      try {
        const proxyRes = await fetch(`${this.apiProxyUrl}?check=health`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeout);
        this.status = proxyRes.ok ? 'healthy' : 'unavailable';
      } catch {
        clearTimeout(timeout);
        this.status = 'unavailable';
      }
    }

    this.lastHealthCheck = new Date().toISOString();
    return {
      providerId: this.id,
      status: this.status,
      baseUrl: this.baseUrl,
      strategy: this.strategy,
      compression: this.compression,
      timestamp: this.lastHealthCheck
    };
  }

  /**
   * Execute request via OmniRoute gateway
   */
  async generate(request, options = {}) {
    const requestId = options.requestId || `omni_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const startTime = Date.now();
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-OmniRoute-Strategy': options.strategy || this.strategy,
        'X-OmniRoute-Fallover-Before-Retry': 'true'
      };

      // Enable RTK + Caveman context compression if enabled
      if (options.compression !== false && this.compression) {
        headers['X-OmniRoute-Compression'] = options.compression || this.compression;
      }

      // Bypass cache if requested or if temperature requires randomness
      if (options.cache === false || (options.temperature && options.temperature > 0.8)) {
        headers['X-OmniRoute-No-Cache'] = 'true';
      }

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

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
      } else if (Array.isArray(request.contents)) {
        // Convert Gemini contents structure to OpenAI format if needed
        for (const item of request.contents) {
          const role = item.role === 'model' ? 'assistant' : 'user';
          const text = item.parts?.map(p => p.text).join('\n') || '';
          messages.push({ role, content: text });
        }
      }

      const payload = {
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1200
      };

      let res = null;
      let usedProxy = false;

      // 1. Attempt direct endpoint call (works on localhost, Node, or CORS-enabled gateways)
      try {
        res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      } catch (directErr) {
        // 2. Fallback to serverless API proxy if direct call was blocked (e.g. browser mixed-content)
        if (typeof window !== 'undefined' && this.apiProxyUrl) {
          usedProxy = true;
          res = await fetch(this.apiProxyUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
          });
        } else {
          throw directErr;
        }
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        const isQuota = res.status === 429 || errorText.toLowerCase().includes('quota');
        const err = new Error(`OmniRoute returned HTTP ${res.status}: ${errorText || res.statusText}`);
        err.status = res.status;
        err.isQuotaExceeded = isQuota;
        throw err;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const durationMs = Date.now() - startTime;

      // Extract OmniRoute response telemetry headers
      const upstreamProvider = res.headers.get('x-omniroute-provider') || data.provider || 'omniroute-upstream';
      const resolvedModel = res.headers.get('x-omniroute-model') || data.model || payload.model;
      const cacheStatus = res.headers.get('x-omniroute-cache') || (data.cached ? 'HIT' : 'MISS');
      const tokensSaved = parseInt(res.headers.get('x-omniroute-tokens-saved') || '0', 10);
      const costEstimate = parseFloat(res.headers.get('x-omniroute-cost') || '0');

      const telemetry = {
        requestId,
        upstreamProvider,
        resolvedModel,
        cacheStatus,
        tokensSaved,
        costEstimate,
        durationMs,
        usedProxy
      };

      this.telemetryHistory.unshift(telemetry);
      if (this.telemetryHistory.length > 30) this.telemetryHistory.pop();

      return {
        success: Boolean(text),
        text,
        provider: this.id,
        upstreamProvider,
        model: resolvedModel,
        cacheHit: cacheStatus === 'HIT',
        tokensSaved,
        costEstimate,
        durationMs,
        tokenEstimate: Math.ceil(text.length / 3.8)
      };
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  getRecentTelemetry() {
    return [...this.telemetryHistory];
  }
}

