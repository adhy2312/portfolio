/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY BACKEND CLIENT ADAPTER (FRONTEND COMPATIBILITY LAYER)
 * ════════════════════════════════════════════════════════════════════
 * Connects the existing React portfolio UI to the Fastify backend:
 * • Environment-configurable API base URL (REACT_APP_BACKEND_URL)
 * • Typed contracts with timeout, network, and CORS error handling
 * • Safe, honest, and explicitly labeled degraded mode if backend is offline
 * • Zero secrets leaked in frontend bundles
 */

const DEFAULT_TIMEOUT_MS = 6000;

export const BACKEND_STATUS = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  DEGRADED: 'DEGRADED',
  CHECKING: 'CHECKING'
});

export class BackendClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || this._resolveBaseUrl();
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.lastHealthStatus = null;
    this.status = BACKEND_STATUS.CHECKING;
  }

  _resolveBaseUrl() {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) {
      return process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, '');
    }
    // Local development default
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://127.0.0.1:3001';
    }
    // Production default: same-origin or dedicated backend proxy
    return '';
  }

  /**
   * Internal fetch wrapper with timeout, CORS, and network error handling
   */
  async _fetchWithTimeout(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs) : null;

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller ? controller.signal : undefined,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });

      if (timeout) clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: (typeof data === 'object' && data?.message) || `HTTP error ${response.status}`,
          data: null
        };
      }

      return {
        ok: true,
        status: response.status,
        data,
        error: null
      };
    } catch (err) {
      if (timeout) clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError';
      return {
        ok: false,
        status: 0,
        error: isTimeout ? 'Request timed out' : (err.message || 'Network error'),
        data: null,
        isNetworkError: true
      };
    }
  }

  /**
   * Probes backend health and readiness
   */
  async checkHealth() {
    const res = await this._fetchWithTimeout('/health', { timeoutMs: 3000 });
    if (res.ok && res.data?.status === 'healthy') {
      this.status = BACKEND_STATUS.ONLINE;
      this.lastHealthStatus = res.data;
      return {
        available: true,
        status: BACKEND_STATUS.ONLINE,
        telemetry: res.data
      };
    }

    this.status = BACKEND_STATUS.OFFLINE;
    return {
      available: false,
      status: BACKEND_STATUS.OFFLINE,
      degraded: true,
      reason: res.error || 'BACKEND_OFFLINE',
      telemetry: null
    };
  }

  /**
   * Sends conversational inquiry to the public visitor endpoint
   */
  async queryPublicChat({ message, sessionId, language = 'en' }) {
    if (!message || !message.trim()) {
      return {
        success: false,
        error: 'Message cannot be empty.'
      };
    }

    const res = await this._fetchWithTimeout('/api/v1/public/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message.trim(),
        sessionId,
        language
      })
    });

    if (!res.ok) {
      // Explicitly labeled degraded state: never claim simulated responses as backend success
      return {
        success: false,
        degraded: true,
        reason: res.error,
        reply: null,
        error: `Mini-Adhy Backend is currently unreachable (${res.error}). Operating in client-side fallback mode.`
      };
    }

    return {
      success: true,
      degraded: false,
      reply: res.data.reply,
      sessionId: res.data.sessionId,
      domain: res.data.domain,
      timestamp: res.data.timestamp
    };
  }

  /**
   * Fetches public agent directory and capabilities
   */
  async getPublicCapabilities() {
    const res = await this._fetchWithTimeout('/api/v1/public/capabilities');
    if (!res.ok) {
      return {
        success: false,
        degraded: true,
        capabilities: null
      };
    }
    return {
      success: true,
      degraded: false,
      capabilities: res.data
    };
  }
}

// Singleton instance for frontend application
export const backendClient = new BackendClient();

