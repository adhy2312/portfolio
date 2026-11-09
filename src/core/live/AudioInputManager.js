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
   * Checks whether microphone permission has already been granted by the browser
   */
  async checkPermissionGranted() {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        const hasLabeledMic = devices.some(d => d.kind === 'audioinput' && d.label && d.label.length > 0);
        if (hasLabeledMic) return true;
      }
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
        if (status && status.state === 'granted') return true;
      }
    } catch {}
    return false;
  }

  /**
   * Requests microphone access and wires stream into AudioContext
   */
  async startMicrophone(audioContext, inputAnalyser = null) {
    if (this.isRecording && this.mediaStream && this.mediaStream.active) {
      return this.mediaStream;
    }

    // Clean up any stale partial stream before starting anew
    this.stopMicrophone();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      // Multi-tier acquisition: Try advanced DSP first, then relaxed, then bare unconstrained
      let stream = null;
      let lastAcquisitionErr = null;

      const attempts = [
        { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        { echoCancellation: true },
        true
      ];

      for (const audioConstraint of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
          if (stream) break;
        } catch (tierErr) {
          lastAcquisitionErr = tierErr;
          // If browser completely blocked permission, subsequent constraint tiers will also fail
          if (tierErr.name === 'NotAllowedError' || tierErr.name === 'PermissionDeniedError') {
            // Still attempt bare true if constraint was rejected by some strict drivers
            if (audioConstraint === true) break;
          }
        }
      }

      if (!stream) {
        throw (lastAcquisitionErr || new Error('Unable to capture audio stream from hardware.'));
      }

      this.mediaStream = stream;

      if (!audioContext) {
        throw new Error('AudioContext must be provided to process input stream.');
      }

      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch {}
      }

      this.sourceNode = audioContext.createMediaStreamSource(this.mediaStream);

      // Connect to Input Analyser for UI visualizer
      if (inputAnalyser) {
        this.sourceNode.connect(inputAnalyser);
      }

      // Buffer audio samples for VoiceActivityDetector
      const bufferSize = 1024;
      this.processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (this.isMuted || !this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioFrame(inputData);
      };

      this.sourceNode.connect(this.processorNode);
      this.silentGainNode = audioContext.createGain();
      this.silentGainNode.gain.value = 0;
      this.processorNode.connect(this.silentGainNode);
      this.silentGainNode.connect(audioContext.destination);

      this.isRecording = true;
      this.isMuted = false;
      return this.mediaStream;
    } catch (err) {
      let classifiedErr = err;
      const isPermDenial = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';

      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        classifiedErr = new Error('No physical microphone found connected to this system.');
        classifiedErr.name = 'NotFoundError';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        classifiedErr = new Error('Microphone hardware is busy or in use by another application.');
        classifiedErr.name = 'NotReadableError';
      } else if (isPermDenial) {
        const isGrantedInBrowser = await this.checkPermissionGranted();
        if (isGrantedInBrowser) {
          classifiedErr = new Error('Microphone permission is allowed in browser, but Windows OS Privacy or another app is restricting hardware access.');
        } else {
          classifiedErr = new Error('Microphone permission was not allowed. Click the lock/settings icon in the URL bar to allow microphone.');
        }
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

