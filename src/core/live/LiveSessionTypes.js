/**
 * ════════════════════════════════════════════════════════════════════
 *  LIVE SESSION TYPES & CONSTANTS — PHASE 10 REALTIME ARCHITECTURE
 * ════════════════════════════════════════════════════════════════════
 */

export const LIVE_SESSION_STATUS = Object.freeze({
  IDLE: 'IDLE',
  REQUESTING_PERMISSION: 'REQUESTING_PERMISSION',
  CONNECTING: 'CONNECTING',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
  INTERRUPTED: 'INTERRUPTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
  ENDING: 'ENDING',
  ENDED: 'ENDED'
});

export const TURN_SPEAKER = Object.freeze({
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  SYSTEM: 'SYSTEM'
});

export const AUDIO_TRANSPORT_MODE = Object.freeze({
  REALTIME_WEBRTC: 'REALTIME_WEBRTC',
  REALTIME_WEBSOCKET: 'REALTIME_WEBSOCKET',
  CONVERSATIONAL_FALLBACK: 'CONVERSATIONAL_FALLBACK'
});

export const VAD_MODE = Object.freeze({
  SERVER_VAD: 'SERVER_VAD',
  CLIENT_RMS_VAD: 'CLIENT_RMS_VAD',
  HYBRID: 'HYBRID'
});

export const DEFAULT_LIVE_AUDIO_CONFIG = Object.freeze({
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  vadSilenceTimeoutMs: 700,
  vadEnergyThreshold: 0.015,
  maxTurnDurationMs: 60000
});

