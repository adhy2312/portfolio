/**
 * ════════════════════════════════════════════════════════════════════
 *  NEURO CONTEXT ADAPTER — SENSOR-INDEPENDENT MULTIMODAL HUB (PHASE 7)
 * ════════════════════════════════════════════════════════════════════
 * Hardware-independent gateway for physiological, behavioral, and
 * environmental signal processing and contextual integration.
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 * 1. Zero Synthetic Brain Signals: Never fabricate EEG, neural telemetry, or fake cognitive scores.
 * 2. Explicit Hardware Status: When no device is attached, status is DISCONNECTED.
 * 3. Three-Tier Separation:
 *    • Raw Signals: Strictly isolated in volatile memory, requires explicit consent, immediate purge.
 *    • Extracted Features: Band powers, HRV RMSSD, EDA SCL/SCR, motion variance with signal quality bounds.
 *    • Inferred States: Non-medical focus / workload context with bounded confidence & timestamps.
 * 4. Medical Non-Diagnosis: Explicitly disclaims medical diagnosis and thought-reading claims.
 * 5. Full Reversibility: User can purge all raw and derived physiological state at any time.
 * 6. Explicit Provenance: All synthetic simulations are strictly labelled SIMULATED.
 */

import {
  BIO_SIGNAL_TYPES,
  DEVICE_CONNECTION_STATUS,
  PROVENANCE_TYPES,
  NON_MEDICAL_DISCLAIMER
} from './NeuroContextTypes.js';
import { signalProcessingPipeline } from './SignalProcessingPipeline.js';
import { personalBaselineManager } from './PersonalBaselineManager.js';
import { multimodalFusionEngine } from './MultimodalFusionEngine.js';
import { syntheticBiosignalGenerator } from './SyntheticBiosignalGenerator.js';

export {
  BIO_SIGNAL_TYPES,
  DEVICE_CONNECTION_STATUS,
  PROVENANCE_TYPES,
  NON_MEDICAL_DISCLAIMER
};

export class NeuroContextAdapter {
  constructor(options = {}) {
    this.status = DEVICE_CONNECTION_STATUS.DISCONNECTED;
    this.activeDevice = null;
    this.hasUserConsent = false;
    this.storageKey = 'mini_adhy_neuro_context_v1';

    // Subsystems
    this.pipeline = options.pipeline || signalProcessingPipeline;
    this.baselineManager = options.baselineManager || personalBaselineManager;
    this.fusionEngine = options.fusionEngine || multimodalFusionEngine;
    this.simulator = options.simulator || syntheticBiosignalGenerator;

    // Modular Adapter Registry
    this.registeredAdapters = new Map();

    // Tier 1: Raw Signals (strictly isolated in memory, never saved to disk without consent)
    this.rawSignalBuffers = new Map(); // signalType -> raw sample array
    this.maxRawSamples = options.maxRawSamples || 500;

    // Tier 2: Extracted Features (by signal type)
    this.featureStreams = new Map(); // signalType -> { features, quality, timestamp, isSimulated }
    this.latestFeatures = null;      // Backward compatibility pointer

    // Tier 3: Inferred Context States (Multimodal & Individual)
    this.latestStateEstimate = null;
    this.latestMultimodalContext = null;

    // Active Calibration Frames Buffer
    this.calibrationBuffers = new Map(); // signalType -> array of feature frames

    this.disclaimer = NON_MEDICAL_DISCLAIMER;
  }

  // ── Status & Privacy Controls ───────────────────────────────────────

  getStatus() {
    return {
      connected: this.status === DEVICE_CONNECTION_STATUS.CONNECTED,
      status: this.status,
      activeDevice: this.activeDevice,
      activeAdapters: Array.from(this.registeredAdapters.keys()),
      activeStreams: Array.from(this.featureStreams.keys()),
      hasUserConsent: this.hasUserConsent,
      signalQuality: this.latestFeatures ? this.latestFeatures.signalQuality : 0.0,
      disclaimer: this.disclaimer,
      note: this.status === DEVICE_CONNECTION_STATUS.DISCONNECTED
        ? 'No physiological device is connected. No synthetic brain waves or fake biometric states are generated.'
        : `Connected to ${this.activeDevice?.name || 'Bio-sensor hub'}`
    };
  }

  /**
   * Register explicit user consent for bio-signal processing
   */
  setUserConsent(granted = false) {
    this.hasUserConsent = Boolean(granted);
    if (!this.hasUserConsent) {
      this.purgeAllData();
    }
  }

  hasConsent() {
    return this.hasUserConsent;
  }

  /**
   * Purge all raw signals, features, baselines, and inferences immediately
   */
  purgeAllData() {
    this.rawSignalBuffers.clear();
    this.featureStreams.clear();
    this.calibrationBuffers.clear();
    this.latestFeatures = null;
    this.latestStateEstimate = null;
    this.latestMultimodalContext = null;
  }

  purgeAllBiosignals() {
    this.purgeAllData();
    this.baselineManager.resetBaseline();
  }

  // ── Modular Adapter Interface ───────────────────────────────────────

  /**
   * Register a sensor adapter (e.g. EEG, ECG, PPG, EDA, Motion, Audio, Camera)
   */
  registerAdapter(adapterId, adapterInstance) {
    if (!adapterId || !adapterInstance) {
      throw new Error('[NeuroContextAdapter] Invalid adapter registration parameters.');
    }
    this.registeredAdapters.set(adapterId, {
      id: adapterId,
      type: adapterInstance.type || BIO_SIGNAL_TYPES.EEG,
      samplingRate: adapterInstance.samplingRate || 250,
      instance: adapterInstance,
      registeredAt: new Date().toISOString()
    });
    return true;
  }

  getRegisteredAdapters() {
    return Array.from(this.registeredAdapters.entries()).map(([id, a]) => ({
      id,
      type: a.type,
      samplingRate: a.samplingRate,
      registeredAt: a.registeredAt
    }));
  }

  /**
   * Connect a hardware device driver (backward compatibility)
   */
  connectHardware(deviceDriver, { userConsent = false } = {}) {
    if (!userConsent && !this.hasUserConsent) {
      throw new Error('[NeuroContextAdapter] Explicit user consent is mandatory for physiological signal ingestion.');
    }

    if (!deviceDriver || typeof deviceDriver.subscribe !== 'function') {
      throw new Error('[NeuroContextAdapter] Invalid device driver interface.');
    }

    this.hasUserConsent = true;
    this.activeDevice = {
      id: deviceDriver.id || 'unidentified_device',
      name: deviceDriver.name || 'External Biosensor',
      type: deviceDriver.type || BIO_SIGNAL_TYPES.EEG,
      connectedAt: new Date().toISOString()
    };
    this.status = DEVICE_CONNECTION_STATUS.CONNECTED;

    return this.getStatus();
  }

  connectDevice(deviceInfo = {}, options = {}) {
    if (!options.userConsent && !this.hasUserConsent) {
      throw new Error('[NeuroContextAdapter] Explicit user consent is mandatory for physiological signal ingestion.');
    }
    this.hasUserConsent = true;
    this.activeDevice = {
      id: deviceInfo.deviceId || deviceInfo.id || 'unidentified_device',
      name: deviceInfo.name || deviceInfo.deviceType || 'External Biosensor',
      type: deviceInfo.type || BIO_SIGNAL_TYPES.EEG,
      isSimulated: Boolean(deviceInfo.isSimulated),
      connectedAt: new Date().toISOString()
    };
    this.status = DEVICE_CONNECTION_STATUS.CONNECTED;
    return { success: true, device: this.activeDevice, status: this.status };
  }

  ingestSignal(signalType, rawSamples, options = {}) {
    const rawPacket = Array.isArray(rawSamples) ? { samples: rawSamples, ...options } : rawSamples;
    const res = this.ingestRawPacket(signalType, rawPacket, options);
    return {
      success: res.status !== 'BLOCKED',
      isSimulated: Boolean(options.isSimulated),
      extractedFeatures: res.features || res.extractedFeatures || {},
      ...res
    };
  }

  purgeUserData() {
    this.purgeAllData();
    return { success: true, purged: true };
  }

  disconnectHardware() {
    this.status = DEVICE_CONNECTION_STATUS.DISCONNECTED;
    this.activeDevice = null;
    this.purgeAllData();
  }

  // ── Signal Processing Pipeline Ingestion ────────────────────────────

  /**
   * Ingests a raw signal packet through the full 10-stage DSP pipeline
   */
  ingestRawPacket(signalType, rawPacket, options = {}) {
    if (!this.hasUserConsent) {
      return { status: 'BLOCKED', reason: 'User consent required' };
    }

    // Run full 10-stage DSP pipeline
    const pipelineResult = this.pipeline.processPacket(
      signalType,
      rawPacket,
      this.baselineManager,
      options
    );

    if (!pipelineResult.success) {
      return {
        status: 'PIPELINE_ERROR',
        errors: pipelineResult.errors,
        stages: pipelineResult.stages
      };
    }

    const obsTime = rawPacket.timestamp || new Date().toISOString();
    const isSimulated = Boolean(rawPacket.isSimulated || options.isSimulated);

    // Tier 1: Buffer raw samples in memory (ring buffer)
    if (!this.rawSignalBuffers.has(signalType)) {
      this.rawSignalBuffers.set(signalType, []);
    }
    const buf = this.rawSignalBuffers.get(signalType);
    buf.push(...rawPacket.data);
    if (buf.length > this.maxRawSamples) {
      buf.splice(0, buf.length - this.maxRawSamples);
    }

    // Tier 2: Extracted Features
    const featureRecord = {
      signalType,
      signalQuality: pipelineResult.quality,
      quality: pipelineResult.quality,
      features: pipelineResult.features,
      metrics: pipelineResult.features,
      source: rawPacket.source || (isSimulated ? 'SIMULATED' : 'Hardware Pipeline'),
      timestamp: obsTime,
      isSimulated,
      provenance: isSimulated ? PROVENANCE_TYPES.SYNTHETIC_SIMULATED : PROVENANCE_TYPES.REAL_HARDWARE
    };

    this.featureStreams.set(signalType, featureRecord);
    this.latestFeatures = featureRecord;

    // Tier 3: Inferred Context State
    if (pipelineResult.quality >= 0.4) {
      this.latestStateEstimate = {
        signalType,
        cognitiveWorkload: pipelineResult.features.workloadIndex !== undefined
          ? pipelineResult.features.workloadIndex
          : null,
        focusEstimate: pipelineResult.features.focusIndex !== undefined
          ? pipelineResult.features.focusIndex
          : null,
        confidence: Math.round(pipelineResult.quality * 0.85 * 100) / 100,
        disclaimer: this.disclaimer,
        timestamp: obsTime,
        isSimulated
      };
    } else {
      this.latestStateEstimate = null;
    }

    // Trigger Multimodal Fusion
    this.latestMultimodalContext = this.fusionEngine.fuseStreams(this.featureStreams);

    return {
      status: 'PROCESSED',
      pipelineResult,
      featureRecord,
      stateEstimate: this.latestStateEstimate,
      multimodalContext: this.latestMultimodalContext
    };
  }

  /**
   * Ingest pre-extracted features (backward compatibility method)
   */
  ingestExtractedFeatures({
    signalType = BIO_SIGNAL_TYPES.EEG,
    signalQuality = 1.0,
    metrics = {},
    source = 'Hardware Pipeline',
    timestamp = null,
    isSimulated = false
  } = {}) {
    if (!this.hasUserConsent) {
      return { status: 'BLOCKED', reason: 'User consent required' };
    }

    const obsTime = timestamp || new Date().toISOString();
    const clampedQuality = Math.min(1.0, Math.max(0.0, Number(signalQuality)));

    // Tier 2: Extracted Features
    this.latestFeatures = {
      signalType,
      signalQuality: clampedQuality,
      quality: clampedQuality,
      features: metrics,
      metrics,
      source,
      timestamp: obsTime,
      isSimulated: Boolean(isSimulated),
      provenance: isSimulated ? PROVENANCE_TYPES.SYNTHETIC_SIMULATED : PROVENANCE_TYPES.REAL_HARDWARE
    };

    this.featureStreams.set(signalType, this.latestFeatures);

    // Tier 3: Inferred State
    if (clampedQuality >= 0.4) {
      this.latestStateEstimate = {
        signalType,
        cognitiveWorkload: metrics.workloadIndex !== undefined ? metrics.workloadIndex : null,
        focusEstimate: metrics.focusIndex !== undefined ? metrics.focusIndex : null,
        confidence: Math.round(clampedQuality * 0.85 * 100) / 100,
        disclaimer: this.disclaimer,
        timestamp: obsTime,
        isSimulated: Boolean(isSimulated)
      };
    } else {
      this.latestStateEstimate = null;
    }

    // Trigger Multimodal Fusion
    this.latestMultimodalContext = this.fusionEngine.fuseStreams(this.featureStreams);

    return {
      features: this.latestFeatures,
      stateEstimate: this.latestStateEstimate,
      multimodalContext: this.latestMultimodalContext
    };
  }

  // ── Personal Baseline Calibration ───────────────────────────────────

  startCalibration(signalType) {
    this.calibrationBuffers.set(signalType, []);
    return { status: 'CALIBRATION_STARTED', signalType };
  }

  addCalibrationFrame(signalType, featureFrame) {
    if (!this.calibrationBuffers.has(signalType)) {
      this.calibrationBuffers.set(signalType, []);
    }
    const buf = this.calibrationBuffers.get(signalType);
    buf.push(featureFrame);
    return { sampleCount: buf.length };
  }

  completeCalibration(signalType, metadata = {}) {
    const buf = this.calibrationBuffers.get(signalType) || [];
    const calResult = this.baselineManager.calibrateBaseline(signalType, buf, metadata);
    this.calibrationBuffers.delete(signalType);
    return calResult;
  }

  getBaseline(signalType) {
    return this.baselineManager.getBaseline(signalType);
  }

  // ── Multimodal Fusion & Context Access ──────────────────────────────

  getMultimodalContext() {
    if (!this.hasUserConsent || this.featureStreams.size === 0) return null;
    return this.latestMultimodalContext || this.fusionEngine.fuseStreams(this.featureStreams);
  }

  getActiveStateEstimate() {
    if (!this.hasUserConsent) return null;
    return this.latestStateEstimate ? { ...this.latestStateEstimate } : null;
  }

  // ── Simulation Demonstration ────────────────────────────────────────

  /**
   * Runs an end-to-end simulated pipeline for offline testing/verification.
   * STRICT INVARIANT: Always explicitly tagged SIMULATED.
   */
  runSimulatedPipeline(signalType = BIO_SIGNAL_TYPES.EEG, durationSec = 2, options = {}) {
    let simPacket = null;

    switch (signalType) {
      case BIO_SIGNAL_TYPES.EEG:
        simPacket = this.simulator.generateEEG(durationSec, 250, options);
        break;
      case BIO_SIGNAL_TYPES.ECG:
        simPacket = this.simulator.generateECG(durationSec, 500, options.bpm || 72, options);
        break;
      case BIO_SIGNAL_TYPES.PPG:
        simPacket = this.simulator.generatePPG(durationSec, 64, options.bpm || 72);
        break;
      case BIO_SIGNAL_TYPES.EDA:
        simPacket = this.simulator.generateEDA(durationSec, 32, options);
        break;
      case BIO_SIGNAL_TYPES.MOTION:
        simPacket = this.simulator.generateMotion(durationSec, 100, options.isMoving);
        break;
      default:
        simPacket = this.simulator.generateEEG(durationSec, 250, options);
    }

    // Process through pipeline
    const pipelineResult = this.pipeline.processPacket(
      signalType,
      simPacket,
      this.baselineManager,
      options
    );

    return {
      isSimulated: true,
      source: 'SIMULATED',
      provenance: PROVENANCE_TYPES.SYNTHETIC_SIMULATED,
      signalType,
      simPacket,
      pipelineResult,
      quality: pipelineResult.quality,
      features: pipelineResult.features,
      disclaimer: this.disclaimer
    };
  }

  // ── Cognitive Integration ───────────────────────────────────────────

  /**
   * Generates optional, uncertainty-bounded context for CognitiveContextCompiler & AdhyModel
   */
  exportCognitiveContext() {
    if (!this.hasUserConsent) {
      return {
        enabled: false,
        reason: 'Biosignal context disabled (no user consent)'
      };
    }

    const multi = this.getMultimodalContext();
    if (!multi || !multi.fused) {
      return {
        enabled: false,
        reason: 'No active biosignal streams available'
      };
    }

    return {
      enabled: true,
      isSimulated: multi.isSimulated,
      provenance: multi.provenance,
      confidence: multi.confidence,
      quality: multi.overallQuality,
      activeSensors: multi.activeSensors,
      missingSensors: multi.missingSensors,
      estimates: multi.estimates,
      formattedBlock: [
        `### PHYSIOLOGICAL & SENSOR CONTEXT [OPTIONAL / UNCERTAINTY-BOUNDED]`,
        `- Active Sensor Streams: ${multi.activeSensors.join(', ')} (Missing: ${multi.missingSensors.join(', ')})`,
        `- Data Provenance: ${multi.isSimulated ? 'SYNTHETIC SIMULATION (NOT REAL)' : 'Real Hardware Stream'}`,
        `- Overall Quality: ${Math.round(multi.overallQuality * 100)}% | Confidence: ${Math.round(multi.confidence * 100)}%`,
        multi.estimates?.cognitiveWorkloadIndex !== null ? `- Estimated Workload Index: ${multi.estimates?.cognitiveWorkloadIndex}` : null,
        multi.estimates?.physioArousalIndex !== null ? `- Estimated Arousal Index: ${multi.estimates?.physioArousalIndex}` : null,
        `- Boundary: Non-diagnostic computational estimate. Explicit user statements strictly override sensor indications.`
      ].filter(Boolean).join('\n')
    };
  }
}

export const neuroContextAdapter = new NeuroContextAdapter();
