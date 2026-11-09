/**
 * ════════════════════════════════════════════════════════════════════
 *  AUDIO INPUT MANAGER — MICROPHONE & SAMPLE ACQUISITION (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Captures browser microphone input, manages permission lifecycle,
 * streams Float32 sample frames for VAD, and provides mute controls.
 */

import { DEFAULT_LIVE_AUDIO_CONFIG } from './LiveSessionTypes';

export class AudioInputManager {
  constructor(options = {}) {
    this.config = { ...DEFAULT_LIVE_AUDIO_CONFIG, ...options };
    this.mediaStream = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.isMuted = false;
    this.isRecording = false;

    // Callbacks
    this.onAudioFrame = options.onAudioFrame || (() => {});
    this.onError = options.onError || (() => {});
  }

  get stream() {
    return this.mediaStream;
  }

  set stream(s) {
    this.mediaStream = s;
  }

  /**
   * Requests microphone access and wires stream into AudioContext
   */
  async startMicrophone(audioContext, inputAnalyser = null) {
    if (this.isRecording) return this.mediaStream;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      };

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch (constraintErr) {
        // Fallback to simple unconstrained audio if hardware rejected specific DSP flags
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (finalErr) {
          throw finalErr;
        }
      }

      if (!audioContext) {
        throw new Error('AudioContext must be provided to process input stream.');
      }

      this.sourceNode = audioContext.createMediaStreamSource(this.mediaStream);

      // Connect to Input Analyser for UI visualizer
      if (inputAnalyser) {
        this.sourceNode.connect(inputAnalyser);
      }

      // Buffer audio samples for VoiceActivityDetector
      // Using ScriptProcessor as widely supported cross-browser buffer extractor
      const bufferSize = 1024;
      this.processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (this.isMuted || !this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioFrame(inputData);
      };

      this.sourceNode.connect(this.processorNode);
      // ScriptProcessor requires destination connection to activate in Web Audio specification
      this.processorNode.connect(audioContext.destination);

      this.isRecording = true;
      this.isMuted = false;
      return this.mediaStream;
    } catch (err) {
      this.onError(err);
      this.stopMicrophone();
      throw err;
    }
  }

  mute() {
    this.isMuted = true;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
  }

  unmute() {
    this.isMuted = false;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }

  stopMicrophone() {
    this.isRecording = false;

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
        this.processorNode.onaudioprocess = null;
      } catch {}
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      this.mediaStream = null;
    }
  }
}

