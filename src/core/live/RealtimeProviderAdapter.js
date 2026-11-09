/**
 * ════════════════════════════════════════════════════════════════════
 *  REALTIME PROVIDER ADAPTER — WEBRTC & WEBSOCKET AUDIO (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Manages low-latency bidirectional streaming transport (WebRTC / WebSocket)
 * for realtime speech-to-speech providers (e.g. Gemini Multimodal Live, OpenAI Realtime).
 * 
 * INVARIANT:
 * Zero API keys are stored in frontend bundles. Ephemeral session tokens
 * are acquired via server-side handshake if configured.
 */

import { AUDIO_TRANSPORT_MODE } from './LiveSessionTypes';

export class RealtimeProviderAdapter {
  constructor(options = {}) {
    this.providerId = options.providerId || 'gemini-live';
    this.transportMode = options.transportMode || AUDIO_TRANSPORT_MODE.CONVERSATIONAL_FALLBACK;
    this.isConnected = false;
    this.webSocket = null;
    this.peerConnection = null;

    // Callbacks
    this.onAudioData = options.onAudioData || (() => {});
    this.onTranscript = options.onTranscript || (() => {});
    this.onError = options.onError || (() => {});
    this.onInterruption = options.onInterruption || (() => {});
  }

  /**
   * Probes whether native WebRTC / WebSocket realtime speech is configured and supported
   */
  async checkCapabilities() {
    return {
      providerId: this.providerId,
      supportsNativeWebRTC: typeof window !== 'undefined' && 'RTCPeerConnection' in window,
      supportsNativeWebSocket: typeof window !== 'undefined' && 'WebSocket' in window,
      hasDirectCredentials: false, // Invariant: no client-side secret keys
      recommendedTransport: AUDIO_TRANSPORT_MODE.CONVERSATIONAL_FALLBACK
    };
  }

  /**
   * Initializes bidirectional transport
   */
  async connect(sessionConfig = {}) {
    const caps = await this.checkCapabilities();

    // If native realtime WebSocket endpoint is provided (e.g. via local proxy or cloud gateway)
    if (sessionConfig.gatewayUrl && caps.supportsNativeWebSocket) {
      return this._connectWebSocket(sessionConfig.gatewayUrl, sessionConfig);
    }

    // Default to robust, tested conversational fallback
    this.transportMode = AUDIO_TRANSPORT_MODE.CONVERSATIONAL_FALLBACK;
    this.isConnected = true;
    return {
      success: true,
      mode: this.transportMode,
      providerId: this.providerId
    };
  }

  _connectWebSocket(url, config) {
    return new Promise((resolve, reject) => {
      try {
        this.webSocket = new WebSocket(url);
        this.webSocket.binaryType = 'arraybuffer';

        this.webSocket.onopen = () => {
          this.isConnected = true;
          this.transportMode = AUDIO_TRANSPORT_MODE.REALTIME_WEBSOCKET;
          resolve({ success: true, mode: this.transportMode });
        };

        this.webSocket.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);
              if (msg.transcript) this.onTranscript(msg.transcript);
              if (msg.interrupted) this.onInterruption();
            } catch {}
          } else if (event.data instanceof ArrayBuffer) {
            this.onAudioData(event.data);
          }
        };

        this.webSocket.onerror = (err) => {
          this.onError(err);
          reject(err);
        };

        this.webSocket.onclose = () => {
          this.isConnected = false;
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  sendAudioChunk(pcmChunk) {
    if (this.isConnected && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(pcmChunk);
    }
  }

  sendVisualFrame(base64Jpeg) {
    if (this.isConnected && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify({ type: 'image_frame', data: base64Jpeg }));
    }
  }

  disconnect() {
    if (this.webSocket) {
      try {
        this.webSocket.close();
      } catch {}
      this.webSocket = null;
    }
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }
    this.isConnected = false;
  }
}

