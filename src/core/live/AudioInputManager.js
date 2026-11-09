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
      // ScriptProcessor requires connection to destination to keep audio process active,
      // but connecting directly to destination feeds mic back into speakers (screeching acoustic loop).
      // Pipe through a gain node with value 0 to keep the node active while keeping output dead silent:
      this.silentGainNode = audioContext.createGain();
      this.silentGainNode.gain.value = 0;
      this.processorNode.connect(this.silentGainNode);
      this.silentGainNode.connect(audioContext.destination);

      this.isRecording = true;
      this.isMuted = false;
      return this.mediaStream;
    } catch (err) {
      let classifiedErr = err;
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        classifiedErr = new Error('No physical microphone found connected to this system.');
        classifiedErr.name = 'NotFoundError';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        classifiedErr = new Error('Microphone is occupied by another application or Windows audio service.');
        classifiedErr.name = 'NotReadableError';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        classifiedErr = new Error('Microphone permission blocked in browser settings.');
        classifiedErr.name = 'NotAllowedError';
      }
      this.onError(classifiedErr);
      this.stopMicrophone();
      throw classifiedErr;
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

    if (this.silentGainNode) {
      try {
        this.silentGainNode.disconnect();
      } catch {}
      this.silentGainNode = null;
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

