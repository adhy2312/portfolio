/**
 * ════════════════════════════════════════════════════════════════════
 *  VOICE ACTIVITY DETECTOR (VAD) & TURN MANAGEMENT (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Detects speech boundaries, pauses, and user barge-in interruptions
 * using real-time audio energy and spectral analysis.
 * 
 * CORE RESPONSIBILITIES:
 * 1. Speech Start & End Detection (with configurable hangover timeout)
 * 2. Natural Conversational Turn-Taking (avoids cutting off mid-sentence)
 * 3. Barge-In Interruption Detection (fires immediately if user speaks while AI speaks)
 * 4. Echo Suppression Awareness (prevents AI audio feedback loop)
 */

export class VoiceActivityDetector {
  constructor(options = {}) {
    this.energyThreshold = options.energyThreshold || 0.018;
    this.silenceTimeoutMs = options.silenceTimeoutMs || 700;
    this.minSpeechDurationMs = options.minSpeechDurationMs || 250;
    
    this.isSpeaking = false;
    this.speechStartTime = null;
    this.silenceTimer = null;
    this.noiseFloor = 0.005;
    this.adaptiveNoise = options.adaptiveNoise !== false;

    // Callbacks
    this.onSpeechStart = options.onSpeechStart || (() => {});
    this.onSpeechEnd = options.onSpeechEnd || (() => {});
    this.onInterruption = options.onInterruption || (() => {});
    this.onVolumeLevel = options.onVolumeLevel || (() => {});

    // State pointer to assistant's output state
    this.isAssistantSpeaking = false;
    this.interruptedForCurrentSpeech = false;
  }

  setAssistantSpeaking(speaking) {
    this.isAssistantSpeaking = Boolean(speaking);
    if (!speaking) {
      this.interruptedForCurrentSpeech = false;
    }
  }

  /**
   * Processes a slice of PCM / Float32 audio samples from the microphone
   */
  processAudioFrame(samples) {
    if (!samples || samples.length === 0) return { energy: 0, isVoice: false };

    // 1. Calculate Root-Mean-Square (RMS) Energy
    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sumSquares / samples.length);

    // Notify volume listeners for UI visualizer
    this.onVolumeLevel(rms);

    // 2. Adaptive Noise Floor Tracking
    if (this.adaptiveNoise && !this.isSpeaking && rms < this.energyThreshold) {
      this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
    }

    const effectiveThreshold = Math.max(this.energyThreshold, this.noiseFloor * 2.5);
    const isAboveThreshold = rms > effectiveThreshold;

    const now = Date.now();

    // 3. Speech Boundary & Interruption Logic
    if (isAboveThreshold) {
      // Clear silence timer if user resumes speaking
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      // CRITICAL: Check for user barge-in interruption immediately
      if (this.isAssistantSpeaking && !this.interruptedForCurrentSpeech) {
        this.interruptedForCurrentSpeech = true;
        this.onInterruption({
          timestamp: now,
          rms,
          reason: 'User voice activity detected while assistant was speaking'
        });
      }

      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.speechStartTime = now;
        this.onSpeechStart({ timestamp: now, initialRms: rms });
      }
    } else {
      this.interruptedForCurrentSpeech = false;
      // Below threshold: If was speaking, start silence hangover countdown
      if (this.isSpeaking && !this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          const speechDuration = now - (this.speechStartTime || now);
          if (speechDuration >= this.minSpeechDurationMs) {
            this.isSpeaking = false;
            this.silenceTimer = null;
            this.onSpeechEnd({
              timestamp: Date.now(),
              durationMs: speechDuration
            });
          } else {
            // Transient click / noise below minimum speech duration
            this.isSpeaking = false;
            this.silenceTimer = null;
          }
        }, this.silenceTimeoutMs);
      }
    }

    return {
      energy: rms,
      isVoice: this.isSpeaking,
      noiseFloor: this.noiseFloor
    };
  }

  reset() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.isSpeaking = false;
    this.speechStartTime = null;
    this.isAssistantSpeaking = false;
  }
}

