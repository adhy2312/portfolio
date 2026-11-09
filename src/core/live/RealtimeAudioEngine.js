/**
 * ════════════════════════════════════════════════════════════════════
 *  REALTIME AUDIO ENGINE — WEB AUDIO CONTEXT & VISUALIZATION (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Manages the unified AudioContext, hardware gesture unlocking, and
 * fast FFT AnalyserNodes for live audio visualization.
 */

export class RealtimeAudioEngine {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 16000;
    this.audioContext = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.fftSize = options.fftSize || 64;
    this.isUnlocked = false;
  }

  /**
   * Initializes or resumes the browser AudioContext safely
   */
  async ensureAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API is not supported in this environment.');
      }
      this.audioContext = new AudioCtx({ sampleRate: this.sampleRate });
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        this.isUnlocked = true;
      } catch {}
    } else {
      this.isUnlocked = true;
    }

    // Set up Input and Output Analysers if not created
    if (!this.inputAnalyser && this.audioContext) {
      this.inputAnalyser = this.audioContext.createAnalyser();
      this.inputAnalyser.fftSize = this.fftSize;
      this.inputAnalyser.smoothingTimeConstant = 0.65;
    }

    if (!this.outputAnalyser && this.audioContext) {
      this.outputAnalyser = this.audioContext.createAnalyser();
      this.outputAnalyser.fftSize = this.fftSize;
      this.outputAnalyser.smoothingTimeConstant = 0.65;
    }

    return this.audioContext;
  }

  /**
   * Returns current input/output visualizer metrics (0.0 to 1.0) and frequency spectrum
   */
  getVisualizerData(type = 'input') {
    const analyser = type === 'output' ? this.outputAnalyser : this.inputAnalyser;
    if (!analyser) {
      return { volume: 0, frequencies: new Uint8Array(32) };
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const volume = Math.min(1.0, sum / (bufferLength * 255));

    return {
      volume,
      frequencies: dataArray
    };
  }

  async close() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch {}
    }
    this.audioContext = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.isUnlocked = false;
  }
}

export const realtimeAudioEngine = new RealtimeAudioEngine();

