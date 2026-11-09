/**
 * ════════════════════════════════════════════════════════════════════
 *  LIVE SESSION MANAGER — MASTER FINITE STATE MACHINE (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Coordinates Mini-Adhy's Live Voice conversational experience:
 * Continuous microphone streaming → VAD turn management →
 * Natural barge-in interruptions → Cognitive context → Live UI visualizer.
 * 
 * STRICT INVARIANTS:
 * 1. Single Active Session: Prevents duplicate concurrent sessions and leaked mics.
 * 2. Instant Interruption Cutoff: Halts assistant speech the instant user speaks.
 * 3. Canonical Continuity: Integrates directly with AdhyModel and MemoryService.
 * 4. Zero Secret Leakage: Never exposes backend keys in browser bundles.
 */

import { LIVE_SESSION_STATUS } from './LiveSessionTypes';
import { realtimeAudioEngine } from './RealtimeAudioEngine';
import { AudioInputManager } from './AudioInputManager';
import { AudioOutputManager } from './AudioOutputManager';
import { VoiceActivityDetector } from './VoiceActivityDetector';
import { LiveTranscriptManager } from './LiveTranscriptManager';
import { LiveConversationContext } from './LiveConversationContext';
import { LiveFallbackPipeline } from './LiveFallbackPipeline';
import { RealtimeProviderAdapter } from './RealtimeProviderAdapter';

export class LiveSessionManager {
  constructor(options = {}) {
    this.status = LIVE_SESSION_STATUS.IDLE;
    this.audioEngine = options.audioEngine || realtimeAudioEngine;
    this.activeSessionId = null;

    // Subsystem components
    this.inputManager = null;
    this.outputManager = null;
    this.vad = null;
    this.transcriptManager = null;
    this.conversationContext = null;
    this.fallbackPipeline = null;
    this.providerAdapter = null;

    // Listeners for UI updates
    this.listeners = new Set();
    this.visualizerData = { volume: 0, frequencies: new Uint8Array(32) };
    this.visualizerInterval = null;

    // Connected Visual Intelligence Bridge (optional)
    this.visualBridge = options.visualBridge || null;
  }

  // ── State Machine & Observer Pattern ────────────────────────────────

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      listener(this.getStateSnapshot());
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  _setState(newStatus, metadata = {}) {
    this.status = newStatus;
    if (this.vad) {
      this.vad.setAssistantSpeaking(newStatus === LIVE_SESSION_STATUS.SPEAKING);
    }
    const snapshot = this.getStateSnapshot(metadata);
    this.listeners.forEach(fn => {
      try { fn(snapshot); } catch {}
    });
  }

  getStateSnapshot(extra = {}) {
    return {
      status: this.status,
      sessionId: this.activeSessionId,
      isMuted: this.inputManager ? this.inputManager.isMuted : false,
      transcript: this.transcriptManager ? this.transcriptManager.getTranscriptHistory() : [],
      interimUserText: this.transcriptManager?.interimUserText || '',
      interimAssistantText: this.transcriptManager?.interimAssistantText || '',
      visualizer: this.visualizerData,
      isCameraActive: this.visualBridge ? this.visualBridge.isCameraActive() : false,
      ...extra
    };
  }

  attachVisualBridge(bridge) {
    this.visualBridge = bridge;
  }

  // ── Session Lifecycle ───────────────────────────────────────────────

  /**
   * Starts a live spoken voice conversation session
   */
  async startSession(sessionConfig = {}) {
    // Invariant 1: Prevent duplicate concurrent sessions
    if (this.status !== LIVE_SESSION_STATUS.IDLE && this.status !== LIVE_SESSION_STATUS.ENDED && this.status !== LIVE_SESSION_STATUS.ERROR) {
      await this.endSession('Replacing existing session');
    }

    this.activeSessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this._setState(LIVE_SESSION_STATUS.REQUESTING_PERMISSION);

    try {
      // 1. Initialize Web Audio Engine
      const audioCtx = await this.audioEngine.ensureAudioContext();

      // 2. Initialize Subsystems
      this.transcriptManager = new LiveTranscriptManager({ sessionId: this.activeSessionId });
      this.conversationContext = new LiveConversationContext({ sessionId: this.activeSessionId });

      this.outputManager = new AudioOutputManager({
        onPlaybackStart: () => this._setState(LIVE_SESSION_STATUS.SPEAKING),
        onPlaybackEnd: () => {
          if (this.status === LIVE_SESSION_STATUS.SPEAKING) {
            this._setState(LIVE_SESSION_STATUS.LISTENING);
          }
        },
        onInterrupted: () => this._setState(LIVE_SESSION_STATUS.INTERRUPTED)
      });
      this.outputManager.attachAudioContext(audioCtx, this.audioEngine.outputAnalyser);

      // 3. Initialize Voice Activity Detector (VAD) with Barge-In Interruption
      this.vad = new VoiceActivityDetector({
        onSpeechStart: () => {
          if (this.status === LIVE_SESSION_STATUS.SPEAKING) {
            // User interrupted the assistant!
            this.handleInterruption();
          } else if (this.status === LIVE_SESSION_STATUS.LISTENING) {
            this._setState(LIVE_SESSION_STATUS.LISTENING, { userSpeaking: true });
          }
        },
        onSpeechEnd: () => {
          if (this.status === LIVE_SESSION_STATUS.LISTENING) {
            this._setState(LIVE_SESSION_STATUS.PROCESSING);
          }
        },
        onInterruption: () => {
          this.handleInterruption();
        },
        onVolumeLevel: () => {
          // Visualizer loop tracks levels directly
        }
      });

      // 4. Initialize Microphone Input Manager
      this.inputManager = new AudioInputManager({
        onAudioFrame: (samples) => {
          this.vad.processAudioFrame(samples);
        },
        onError: (err) => {
          this._setState(LIVE_SESSION_STATUS.ERROR, { error: err.message });
        }
      });

      // 5. Initialize Streaming Conversational Pipeline
      this.fallbackPipeline = new LiveFallbackPipeline({
        audioOutputManager: this.outputManager,
        liveTranscriptManager: this.transcriptManager,
        liveContext: this.conversationContext,
        onProcessing: () => this._setState(LIVE_SESSION_STATUS.PROCESSING),
        onTurnComplete: () => {
          if (this.status !== LIVE_SESSION_STATUS.SPEAKING) {
            this._setState(LIVE_SESSION_STATUS.LISTENING);
          }
        },
        onError: (err) => {
          this._setState(LIVE_SESSION_STATUS.ERROR, { error: err.message });
        }
      });

      // 6. Connect Provider Adapter
      this._setState(LIVE_SESSION_STATUS.CONNECTING);
      this.providerAdapter = new RealtimeProviderAdapter({
        onInterruption: () => this.handleInterruption()
      });
      await this.providerAdapter.connect(sessionConfig);

      // 7. Request and Start Microphone Stream
      await this.inputManager.startMicrophone(audioCtx, this.audioEngine.inputAnalyser);

      // 8. Start Speech Recognition & VAD Loop
      this.fallbackPipeline.startListening();
      this._startVisualizerLoop();

      this._setState(LIVE_SESSION_STATUS.LISTENING);
      return { success: true, sessionId: this.activeSessionId };
    } catch (err) {
      await this.endSession(err.message);
      this._setState(LIVE_SESSION_STATUS.ERROR, { error: err.message });
      throw err;
    }
  }

  /**
   * Natural Barge-In Interruption Handler:
   * Instantly stops audio playback, cancels speech synthesis, and returns to LISTENING.
   */
  handleInterruption() {
    if (this.outputManager) {
      this.outputManager.interrupt();
    }
    if (this.fallbackPipeline) {
      this.fallbackPipeline.interrupt();
    }
    this._setState(LIVE_SESSION_STATUS.INTERRUPTED);

    // Fast return to listening state so user's words are captured
    setTimeout(() => {
      if (this.status === LIVE_SESSION_STATUS.INTERRUPTED) {
        this._setState(LIVE_SESSION_STATUS.LISTENING);
      }
    }, 150);
  }

  muteMicrophone() {
    if (this.inputManager) {
      this.inputManager.mute();
      this._setState(this.status, { isMuted: true });
    }
  }

  unmuteMicrophone() {
    if (this.inputManager) {
      this.inputManager.unmute();
      this._setState(this.status, { isMuted: false });
    }
  }

  toggleMicrophone() {
    if (this.inputManager?.isMuted) {
      this.unmuteMicrophone();
    } else {
      this.muteMicrophone();
    }
  }

  /**
   * Injects user text query into live session directly (for hybrid voice/text input)
   */
  async submitSpokenTurn(text) {
    if (!text || this.status === LIVE_SESSION_STATUS.IDLE) return;
    const visualContext = this.visualBridge ? this.visualBridge.getLatestObservationsContext() : null;
    await this.fallbackPipeline?.handleUserSpokenTurn(text, visualContext);
  }

  _startVisualizerLoop() {
    if (this.visualizerInterval) clearInterval(this.visualizerInterval);

    this.visualizerInterval = setInterval(() => {
      if (this.status === LIVE_SESSION_STATUS.SPEAKING) {
        this.visualizerData = this.audioEngine.getVisualizerData('output');
      } else if (this.status === LIVE_SESSION_STATUS.LISTENING) {
        this.visualizerData = this.audioEngine.getVisualizerData('input');
      } else if (this.status === LIVE_SESSION_STATUS.PROCESSING) {
        // Subtle rhythmic pulse for thinking state
        const time = Date.now() / 200;
        this.visualizerData = {
          volume: 0.35 + 0.15 * Math.sin(time),
          frequencies: new Uint8Array(32).fill(Math.floor(100 + 40 * Math.sin(time)))
        };
      } else {
        this.visualizerData = { volume: 0, frequencies: new Uint8Array(32) };
      }

      // Notify observers of visualizer frame
      const snap = this.getStateSnapshot();
      this.listeners.forEach(fn => {
        try { fn(snap); } catch {}
      });
    }, 50); // 20 FPS visualizer tick
  }

  /**
   * Safely ends the live session, releasing all hardware and memory resources
   */
  async endSession(reason = 'User terminated session') {
    this._setState(LIVE_SESSION_STATUS.ENDING, { reason });

    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
      this.visualizerInterval = null;
    }

    if (this.fallbackPipeline) {
      this.fallbackPipeline.cleanup();
      this.fallbackPipeline = null;
    }

    if (this.outputManager) {
      this.outputManager.reset();
      this.outputManager = null;
    }

    if (this.inputManager) {
      this.inputManager.stopMicrophone();
      this.inputManager = null;
    }

    if (this.providerAdapter) {
      this.providerAdapter.disconnect();
      this.providerAdapter = null;
    }

    if (this.vad) {
      this.vad.reset();
      this.vad = null;
    }

    // Persist conversation highlights to MemoryService (Invariance: No raw audio saved)
    if (this.transcriptManager) {
      this.transcriptManager.commitSessionToMemory();
    }

    if (this.conversationContext) {
      this.conversationContext.reset();
    }

    await this.audioEngine.close();

    this.activeSessionId = null;
    this._setState(LIVE_SESSION_STATUS.ENDED, { reason });
    this.status = LIVE_SESSION_STATUS.IDLE;
  }
}

export const liveSessionManager = new LiveSessionManager();

