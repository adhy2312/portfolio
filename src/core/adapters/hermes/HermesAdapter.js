/**
 * ════════════════════════════════════════════════════════════════════
 *  HERMES AGENT ADAPTER (NOUS RESEARCH AGENT RUNTIME)
 * ════════════════════════════════════════════════════════════════════
 * Integrates Nous Research Hermes Agent as a first-class optional
 * external runtime backend.
 * 
 * Documentation:
 * https://hermes-agent.nousresearch.com/docs
 * https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 * 
 * STRICT INVARIANT:
 * Mini-Adhy owns canonical identity and user memory.
 * If Hermes is offline or unconfigured, Mini-Adhy operates with 100% native runtime.
 * Never claim Hermes is operational without verified health checks.
 */

export class HermesAdapter {
  constructor({
    endpoint = null,
    apiKey = null,
    timeoutMs = 6000
  } = {}) {
    this.endpoint = endpoint || (typeof window !== 'undefined' ? window.HERMES_API_ENDPOINT : null);
    this.apiKey = apiKey || (typeof window !== 'undefined' ? window.HERMES_API_KEY : null);
    this.timeoutMs = timeoutMs;
    this.status = this.endpoint ? 'unknown' : 'not_configured'; // 'not_configured' | 'unavailable' | 'healthy' | 'degraded'
    this.lastHealthCheck = null;
    this.activeSessions = new Map();
  }

  /**
   * Inspect current configuration and reachability
   */
  async checkHealth() {
    if (!this.endpoint) {
      this.status = 'not_configured';
      return {
        configured: false,
        status: 'not_configured',
        message: 'Hermes Agent runtime is not configured (set HERMES_API_ENDPOINT to connect).',
        timestamp: new Date().toISOString()
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const checkUrl = `${this.endpoint.replace(/\/+$/, '')}/health`;

    try {
      const headers = {};
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const res = await fetch(checkUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        this.status = 'healthy';
      } else {
        this.status = 'degraded';
      }
    } catch (e) {
      this.status = 'unavailable';
    }

    this.lastHealthCheck = new Date().toISOString();
    return {
      configured: true,
      status: this.status,
      endpoint: this.endpoint,
      timestamp: this.lastHealthCheck
    };
  }

  /**
   * Execute an agent task in Hermes runtime if available
   */
  async executeTask(taskPrompt, options = {}) {
    if (!this.endpoint) {
      return {
        success: false,
        error: 'Hermes Agent runtime is not configured.',
        status: 'not_configured'
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const runUrl = `${this.endpoint.replace(/\/+$/, '')}/v1/chat/completions`;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const messages = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: taskPrompt });

      const res = await fetch(runUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: options.model || 'hermes-3-llama-3.1-8b',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1000,
          tools: options.tools || []
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Hermes runtime error: HTTP ${res.status}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      return {
        success: true,
        text: message?.content || '',
        toolCalls: message?.tool_calls || [],
        provider: 'hermes-agent-runtime',
        finishReason: choice?.finish_reason || 'stop',
        status: 'succeeded'
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        provider: 'hermes-agent-runtime',
        status: 'failed'
      };
    }
  }

  getStatus() {
    return {
      status: this.status,
      configured: Boolean(this.endpoint),
      lastHealthCheck: this.lastHealthCheck
    };
  }
}

export const hermesAdapter = new HermesAdapter();

