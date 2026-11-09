/**
 * ════════════════════════════════════════════════════════════════════
 *  VISUAL CONVERSATION BRIDGE — MULTIMODAL INTEGRATION (PHASE 10B)
 * ════════════════════════════════════════════════════════════════════
 * Unifies the visual intelligence pipeline and connects it to Live Mode:
 * 1. Coordinates VisualInputManager, Perception, Intelligence, and Session Memory
 * 2. Runs periodic or on-demand visual perception cycles
 * 3. Enriches live voice conversation context with visual observations
 * 4. Provides UI hooks for camera state, detection overlays, and OCR text
 */

import { VisualInputManager } from './VisualInputManager';
import { VisualPerceptionEngine } from './VisualPerceptionEngine';
import { VisualIntelligenceEngine } from './VisualIntelligenceEngine';
import { VisualSessionMemory } from './VisualSessionMemory';
import { VisualContextCompiler } from './VisualContextCompiler';

export class VisualConversationBridge {
  constructor(options = {}) {
    this.providerRegistry = options.providerRegistry || null;
    this.memoryService = options.memoryService || null;

    this.inputManager = new VisualInputManager({
      minIntervalMs: options.minIntervalMs || 2500, // Throttled to 2.5s to respect rate limits
      ...options.inputOptions
    });

    this.perceptionEngine = new VisualPerceptionEngine({
      providerRegistry: this.providerRegistry,
      ...options.perceptionOptions
    });

    this.intelligenceEngine = new VisualIntelligenceEngine();
    this.sessionMemory = new VisualSessionMemory({ sessionId: options.sessionId });
    this.contextCompiler = new VisualContextCompiler();

    this.isProcessing = false;
    this.onObservationListeners = new Set();
    this.onErrorListeners = new Set();
  }

  /**
   * Starts camera capture and attaches continuous analysis
   */
  async startCamera(videoElementOrOptions, facingMode = 'environment') {
    let videoEl = null;
    let mode = facingMode;

    if (videoElementOrOptions && typeof videoElementOrOptions === 'object' && !(videoElementOrOptions instanceof HTMLElement)) {
      videoEl = videoElementOrOptions.videoElement || null;
      mode = videoElementOrOptions.facingMode || 'environment';
    } else {
      videoEl = videoElementOrOptions;
    }

    const stream = await this.inputManager.startCamera({ facingMode: mode });
    if (videoEl) {
      this.inputManager.attachVideoElement(videoEl);
    }
    
    // Wire up continuous frame handler
    this.inputManager.onFrameCaptured = async (frameData) => {
      await this.processFrame(frameData);
    };

    return stream;
  }

  isCameraActive() {
    return this.inputManager ? this.inputManager.isStreaming : false;
  }

  /**
   * Stops camera capture
   */
  stopCamera() {
    this.inputManager.stopCamera();
    this._persistSessionSummary();
  }

  /**
   * Handles static image upload analysis
   */
  async analyzeUploadedImage(fileOrBlob) {
    const frameData = await this.inputManager.captureFromImageFile(fileOrBlob);
    return await this.processFrame(frameData, { isManualSnapshot: true });
  }

  /**
   * Processes a single visual frame through the complete pipeline
   */
  async processFrame(frameData, options = {}) {
    if (!frameData || this.isProcessing) return null;

    this.isProcessing = true;
    try {
      // 1. Perception
      const perceptionResult = await this.perceptionEngine.perceiveFrame(frameData, {
        prompt: options.prompt || 'Identify all electronics components, chips, markings, text, and relative layout in this view.'
      });

      // 2. Intelligence & Spatial Synthesis
      const structuredObservation = this.intelligenceEngine.synthesizeObservation(
        perceptionResult,
        { width: frameData.width, height: frameData.height }
      );

      // 3. Temporal Tracking & Session Memory
      this.sessionMemory.ingestObservation(structuredObservation);

      // 4. Notify Listeners (UI overlays, visualizer, etc.)
      this._notifyObservation(structuredObservation);

      return structuredObservation;
    } catch (err) {
      this._notifyError(err);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Compiles the latest visual context for insertion into cognitive prompts
   */
  getCompiledContext(query = '') {
    return this.contextCompiler.compileVisualContext(this.sessionMemory, { query });
  }

  /**
   * Alias for LiveSessionManager compatibility
   */
  getLatestObservationsContext(query = '') {
    return this.getCompiledContext(query);
  }

  /**
   * Returns a short spoken hint for live audio voice turns
   */
  getSpokenVisualHint() {
    return this.contextCompiler.compileSpokenVisualHint(this.sessionMemory);
  }

  /**
   * Resolves a user deictic reference ("what is this?")
   */
  resolveReference(query) {
    return this.sessionMemory.resolveReference(query);
  }

  /**
   * Persists visual session summary to MemoryService (Zero raw video stored!)
   */
  _persistSessionSummary() {
    if (!this.memoryService) return;
    const summary = this.sessionMemory.summarizeSession();
    if (summary.totalObservations > 0) {
      try {
        if (typeof this.memoryService.storeEpisodicRecord === 'function') {
          this.memoryService.storeEpisodicRecord({
            content: summary.sessionSummary,
            source: 'Mini-Adhy Camera Perception',
            provenance: 'visual_session',
            confidence: 0.9,
            metadata: {
              trackedObjectCount: summary.trackedObjectCount,
              identifiedObjects: summary.identifiedObjects,
              categories: summary.categories
            }
          });
        } else if (typeof this.memoryService.storeRecord === 'function') {
          this.memoryService.storeRecord({
            category: 'EPISODIC',
            content: summary.sessionSummary,
            source: 'Mini-Adhy Camera Perception',
            provenance: 'visual_session',
            confidence: 0.9,
            metadata: {
              trackedObjectCount: summary.trackedObjectCount,
              identifiedObjects: summary.identifiedObjects,
              categories: summary.categories
            }
          });
        }
      } catch (e) {
        console.warn('[VisualConversationBridge] Failed to store episodic visual memory:', e);
      }
    }
  }

  onObservation(callback) {
    this.onObservationListeners.add(callback);
    return () => this.onObservationListeners.delete(callback);
  }

  onError(callback) {
    this.onErrorListeners.add(callback);
    return () => this.onErrorListeners.delete(callback);
  }

  _notifyObservation(obs) {
    for (const cb of this.onObservationListeners) {
      try { cb(obs); } catch (e) { console.error(e); }
    }
  }

  _notifyError(err) {
    for (const cb of this.onErrorListeners) {
      try { cb(err); } catch (e) { console.error(e); }
    }
  }

  destroy() {
    this.stopCamera();
    this.sessionMemory.clear();
    this.onObservationListeners.clear();
    this.onErrorListeners.clear();
  }
}
