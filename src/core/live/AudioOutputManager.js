/**
 * ════════════════════════════════════════════════════════════════════
 *  AUDIO OUTPUT MANAGER — STREAMING PLAYBACK & INTERRUPTION (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Manages low-latency audio queue playback, seamless sentence streaming,
 * and immediate barge-in interruption cutoff.
 */

export class AudioOutputManager {
  constructor(options = {}) {
    this.audioContext = null;
    this.outputAnalyser = null;
    this.isPlaying = false;
    this.activeSources = new Set();
    this.playbackQueue = [];
    this.currentUtterance = null;
    this.volume = options.volume ?? 1.0;

    // Callbacks
    this.onPlaybackStart = options.onPlaybackStart || (() => {});
    this.onPlaybackEnd = options.onPlaybackEnd || (() => {});
    this.onInterrupted = options.onInterrupted || (() => {});
  }

  get isSpeaking() {
    return this.isPlaying;
  }

  speakUtterance(text, options = {}) {
    return this.speakText(text, options);
  }

  attachAudioContext(audioContext, outputAnalyser = null) {
    this.audioContext = audioContext;
    this.outputAnalyser = outputAnalyser;
  }

  /**
   * Immediately halts all playing audio and flushes the playback queue
   * Invoked upon barge-in interruption or session end.
   */
  interrupt() {
    // 1. Stop all active Web Audio buffer sources
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    });
    this.activeSources.clear();

    // 2. Clear queued audio chunks
    this.playbackQueue = [];

    // 3. Cancel any browser speech synthesis in flight
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    const wasPlaying = this.isPlaying;
    this.isPlaying = false;
    this.currentUtterance = null;

    if (wasPlaying) {
      this.onInterrupted({ timestamp: Date.now() });
    }
  }

  /**
   * Plays a pre-decoded AudioBuffer with low latency
   */
  async playAudioBuffer(audioBuffer) {
    if (!this.audioContext || !audioBuffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.volume;

    source.connect(gainNode);

    if (this.outputAnalyser) {
      gainNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.audioContext.destination);
    } else {
      gainNode.connect(this.audioContext.destination);
    }

    this.activeSources.add(source);
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.onPlaybackStart();
    }

    return new Promise((resolve) => {
      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0 && this.playbackQueue.length === 0) {
          this.isPlaying = false;
          this.onPlaybackEnd();
        }
        resolve();
      };
      source.start();
    });
  }

  /**
   * Conversational streaming speech synthesis fallback
   * Plays text sentence-by-sentence with natural cadence and instant interruption
   */
  speakText(text, options = {}) {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      return Promise.resolve();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Mini-Adhy natural voice preferences
    utterance.rate = options.rate || 1.05;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = this.volume;

    // Pick best available English voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => (
      (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')))
    )) || voices.find(v => v.lang.startsWith('en')) || null;

    if (naturalVoice) utterance.voice = naturalVoice;

    this.isPlaying = true;
    this.onPlaybackStart();

    return new Promise((resolve) => {
      utterance.onend = () => {
        this.isPlaying = false;
        this.currentUtterance = null;
        this.onPlaybackEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        this.isPlaying = false;
        this.currentUtterance = null;
        this.onPlaybackEnd();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  setVolume(vol) {
    this.volume = Math.max(0.0, Math.min(1.0, Number(vol) || 1.0));
  }

  reset() {
    this.interrupt();
  }
}

