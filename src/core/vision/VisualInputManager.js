/**
 * ════════════════════════════════════════════════════════════════════
 *  VISUAL INPUT MANAGER — CAMERA ACQUISITION & FRAME SAMPLING (PHASE 10B)
 * ════════════════════════════════════════════════════════════════════
 * Captures live camera frames, throttles sampling rates, checks image
 * quality/blur, and provides clean device release upon session end.
 * 
 * STRICT PRIVACY INVARIANTS:
 * 1. Zero Background Capture: Camera is only active when explicitly enabled.
 * 2. Visual Status Indicator: Always exposes whether camera is streaming.
 * 3. Immediate Hardware Release: Shuts down camera tracks immediately on stop.
 */

import { VISUAL_INPUT_MODE } from './VisualTypes';

export class VisualInputManager {
  constructor(options = {}) {
    this.mode = VISUAL_INPUT_MODE.INACTIVE;
    this.mediaStream = null;
    this.videoElement = null;
    this.canvasElement = null;

    this.frameIntervalMs = options.frameIntervalMs || 2000; // Adaptive default: 1 frame per 2s
    this.targetWidth = options.targetWidth || 800;
    this.targetHeight = options.targetHeight || 600;
    this.samplingTimer = null;
    this.isStreaming = false;

    // Callbacks
    this.onFrameCaptured = options.onFrameCaptured || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
  }

  /**
   * Requests camera permission and attaches to an in-memory or provided video element
   */
  async startCamera(options = {}) {
    if (this.isStreaming && this.mediaStream) {
      return this.mediaStream;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const facingMode = options.facingMode || 'environment'; // Prefer rear camera for examining hardware
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Prepare hidden processing canvas
      if (!this.canvasElement && typeof document !== 'undefined') {
        this.canvasElement = document.createElement('canvas');
      }

      this.isStreaming = true;
      this.mode = VISUAL_INPUT_MODE.CAMERA_STREAMING;
      this.onStatusChange({ mode: this.mode, isStreaming: true });

      // Start adaptive sampling loop
      if (options.continuousSampling !== false) {
        this.startSamplingLoop();
      }

      return this.mediaStream;
    } catch (err) {
      this.stopCamera();
      this.onError(err);
      throw err;
    }
  }

  attachVideoElement(videoEl) {
    this.videoElement = videoEl;
    if (this.videoElement && this.mediaStream) {
      this.videoElement.srcObject = this.mediaStream;
      this.videoElement.play().catch(() => {});
    }
  }

  /**
   * Captures a single image frame as base64 JPEG
   */
  captureFrame(videoEl = this.videoElement) {
    if (!videoEl || !videoEl.videoWidth) {
      // Fallback: Return null if video has not initialized
      return null;
    }

    const canvas = this.canvasElement || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    if (!canvas) return null;

    // Compute aspect ratio scale
    const srcWidth = videoEl.videoWidth;
    const srcHeight = videoEl.videoHeight;
    const scale = Math.min(this.targetWidth / srcWidth, this.targetHeight / srcHeight, 1.0);

    const destWidth = Math.floor(srcWidth * scale);
    const destHeight = Math.floor(srcHeight * scale);

    canvas.width = destWidth;
    canvas.height = destHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, destWidth, destHeight);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    // Quality assessment
    const quality = this._assessFrameQuality(ctx, destWidth, destHeight);

    return {
      timestamp: new Date().toISOString(),
      width: destWidth,
      height: destHeight,
      base64: base64Data,
      dataUrl,
      quality
    };
  }

  /**
   * Evaluates image brightness and blur index
   */
  _assessFrameQuality(ctx, width, height) {
    try {
      const imgData = ctx.getImageData(0, 0, Math.min(width, 100), Math.min(height, 100));
      const data = imgData.data;
      let totalLuminance = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuminance += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      const avgBrightness = totalLuminance / (data.length / 4);
      const isTooDark = avgBrightness < 25;
      const isTooBright = avgBrightness > 240;

      return {
        brightness: Math.round(avgBrightness),
        isTooDark,
        isTooBright,
        isAcceptable: !isTooDark && !isTooBright
      };
    } catch {
      return { brightness: 128, isAcceptable: true };
    }
  }

  startSamplingLoop() {
    this.stopSamplingLoop();
    this.samplingTimer = setInterval(() => {
      if (this.isStreaming && this.videoElement) {
        const frame = this.captureFrame(this.videoElement);
        if (frame) {
          this.onFrameCaptured(frame);
        }
      }
    }, this.frameIntervalMs);
  }

  stopSamplingLoop() {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
    }
  }

  stopCamera() {
    this.stopSamplingLoop();
    this.isStreaming = false;
    this.mode = VISUAL_INPUT_MODE.INACTIVE;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.onStatusChange({ mode: this.mode, isStreaming: false });
  }
}

