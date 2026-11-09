/**
 * ════════════════════════════════════════════════════════════════════
 *  PHASE 7 TEST SUITE: MULTIMODAL & NEUROCONTEXT ADAPTER
 * ════════════════════════════════════════════════════════════════════
 * Validates:
 * 1. Sensor-independent common adapter interface (EEG, ECG, PPG, EDA, Motion)
 * 2. 10-stage DSP pipeline execution (Acquisition -> Validation -> Filtering -> Features)
 * 3. ECE / DSP capabilities (EEG bandpowers, ECG Pan-Tompkins QRS, PPG IBI, EDA tonic/phasic, Motion)
 * 4. Artifact detection, malformed input handling & quality scoring
 * 5. Personal baseline calibration & z-score normalization
 * 6. Multimodal fusion with provenance & missing-sensor tracking
 * 7. Simulation invariants (strict SIMULATED labelling, zero fake hardware claims)
 * 8. Privacy controls (explicit opt-in consent, immediate data purge)
 * 9. Cognitive integration (uncertainty-bounded context, non-clinical, non-thought-reading)
 */

import {
  NeuroContextAdapter,
  BIO_SIGNAL_TYPES,
  DEVICE_CONNECTION_STATUS,
  PROVENANCE_TYPES,
  NON_MEDICAL_DISCLAIMER
} from '../devices/NeuroContextAdapter';
import { signalProcessingPipeline } from '../devices/SignalProcessingPipeline';
import { PersonalBaselineManager } from '../devices/PersonalBaselineManager';
import { multimodalFusionEngine } from '../devices/MultimodalFusionEngine';
import { syntheticBiosignalGenerator } from '../devices/SyntheticBiosignalGenerator';
import { cognitiveContextCompiler } from '../cognition/CognitiveContextCompiler';
import { adhyModel } from '../identity/AdhyModel';

describe('PHASE 7 — MULTIMODAL & NEUROCONTEXT ADAPTER', () => {
  let adapter;
  let baselineManager;
  let mockStorage;

  beforeEach(() => {
    mockStorage = new Map();
    const adapterStorage = {
      get: (k) => mockStorage.get(k) || null,
      set: (k, v) => mockStorage.set(k, v),
      remove: (k) => mockStorage.delete(k)
    };
    baselineManager = new PersonalBaselineManager(adapterStorage);
    adapter = new NeuroContextAdapter({ baselineManager });
  });

  // ────────────────────────────────────────────────────────────
  // 1. Sensor-Independent Architecture & Common Interface
  // ────────────────────────────────────────────────────────────
  describe('1. Sensor-Independent Architecture & Interface', () => {
    test('Default status is DISCONNECTED with 0.0 quality and non-medical disclaimer', () => {
      const status = adapter.getStatus();
      expect(status.connected).toBe(false);
      expect(status.status).toBe(DEVICE_CONNECTION_STATUS.DISCONNECTED);
      expect(status.signalQuality).toBe(0.0);
      expect(status.hasUserConsent).toBe(false);
      expect(status.disclaimer).toContain('Non-medical');
    });

    test('Registers diverse sensor adapters adhering to common lifecycle interface', () => {
      const eegDriver = { type: BIO_SIGNAL_TYPES.EEG, samplingRate: 250 };
      const ecgDriver = { type: BIO_SIGNAL_TYPES.ECG, samplingRate: 500 };
      const ppgDriver = { type: BIO_SIGNAL_TYPES.PPG, samplingRate: 64 };
      const edaDriver = { type: BIO_SIGNAL_TYPES.EDA, samplingRate: 32 };
      const imuDriver = { type: BIO_SIGNAL_TYPES.MOTION, samplingRate: 100 };

      expect(adapter.registerAdapter('openbci_cyton', eegDriver)).toBe(true);
      expect(adapter.registerAdapter('polar_h10', ecgDriver)).toBe(true);
      expect(adapter.registerAdapter('max30102', ppgDriver)).toBe(true);
      expect(adapter.registerAdapter('shimmer3_gsr', edaDriver)).toBe(true);
      expect(adapter.registerAdapter('mpu6050', imuDriver)).toBe(true);

      const registered = adapter.getRegisteredAdapters();
      expect(registered.length).toBe(5);
      expect(registered.map(r => r.type)).toEqual(
        expect.arrayContaining([BIO_SIGNAL_TYPES.EEG, BIO_SIGNAL_TYPES.ECG, BIO_SIGNAL_TYPES.PPG, BIO_SIGNAL_TYPES.EDA, BIO_SIGNAL_TYPES.MOTION])
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. ECE & DSP Signal Processing Capabilities
  // ────────────────────────────────────────────────────────────
  describe('2. ECE & DSP Processing Modules', () => {
    test('EEG: Windowed spectral analysis extracts delta, theta, alpha, and beta powers', () => {
      adapter.setUserConsent(true);
      const simEEG = syntheticBiosignalGenerator.generateEEG(2, 250, { alphaAmp: 30, betaAmp: 15 });
      const result = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EEG, simEEG);

      expect(result.status).toBe('PROCESSED');
      const features = result.pipelineResult.features;
      expect(features.bandPowers).toBeDefined();
      expect(features.bandPowers.alpha).toBeGreaterThan(0);
      expect(features.bandPowers.beta).toBeGreaterThan(0);
      expect(features.relativeBandPowers).toBeDefined();
      expect(features.totalPower).toBeGreaterThan(0);
      expect(features.alphaThetaRatio).toBeDefined();
    });

    test('ECG: Detects QRS R-peaks, calculates RR intervals and HRV RMSSD', () => {
      adapter.setUserConsent(true);
      const simECG = syntheticBiosignalGenerator.generateECG(3, 500, 75);
      const result = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.ECG, simECG);

      expect(result.status).toBe('PROCESSED');
      const features = result.pipelineResult.features;
      expect(features.rPeakCount).toBeGreaterThan(1);
      expect(features.heartRateBpm).toBeGreaterThan(60);
      expect(features.heartRateBpm).toBeLessThan(90);
      expect(features.signalPlausibility).toBe(true);
    });

    test('PPG: Detects pulse peaks and calculates Inter-Beat Intervals (IBI)', () => {
      adapter.setUserConsent(true);
      const simPPG = syntheticBiosignalGenerator.generatePPG(3, 64, 70);
      const result = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.PPG, simPPG);

      expect(result.status).toBe('PROCESSED');
      const features = result.pipelineResult.features;
      expect(features.systolicPeakCount).toBeGreaterThan(1);
      expect(features.pulseRateBpm).toBeGreaterThan(55);
      expect(features.pulseRateBpm).toBeLessThan(85);
    });

    test('EDA: Separates slow tonic SCL drift from transient phasic SCR peaks', () => {
      adapter.setUserConsent(true);
      const simEDA = syntheticBiosignalGenerator.generateEDA(4, 32, { baseTonic: 4.8, hasSCR: true });
      const result = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EDA, simEDA);

      expect(result.status).toBe('PROCESSED');
      const features = result.pipelineResult.features;
      expect(features.meanTonicSCL).toBeCloseTo(4.8, 0);
      expect(features.phasicSCRCount).toBeGreaterThanOrEqual(1);
      expect(features.meanPhasicAmplitude).toBeGreaterThan(0);
    });

    test('Motion: Computes 3-axis acceleration magnitude and flags motion artifacts', () => {
      adapter.setUserConsent(true);
      // Vigorous motion packet
      const activeMotion = syntheticBiosignalGenerator.generateMotion(2, 100, true);
      const result = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.MOTION, activeMotion);

      expect(result.status).toBe('PROCESSED');
      const features = result.pipelineResult.features;
      expect(features.isMoving).toBe(true);
      expect(features.motionArtifactLikely).toBe(true);
      expect(features.activityLevel).toBe('HIGH_MOTION');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Artifact Handling, Validation & Quality Assessment
  // ────────────────────────────────────────────────────────────
  describe('3. Artifact Handling, Validation & Quality Scoring', () => {
    test('Catches malformed numeric packets in Stage 2 validation without throwing', () => {
      adapter.setUserConsent(true);
      const malformedPacket = { data: [12.4, NaN, 14.8, null] };
      const res = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EEG, malformedPacket);

      expect(res.status).toBe('PIPELINE_ERROR');
      expect(res.errors[0]).toContain('Malformed numeric sample');
    });

    test('Detects amplitude excursion artifacts and penalizes quality score', () => {
      adapter.setUserConsent(true);
      // EEG with extreme blink spike (> 200uV)
      const artifactEEG = syntheticBiosignalGenerator.generateEEG(2, 250, { addBlinkArtifact: true });
      const res = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EEG, artifactEEG);

      expect(res.status).toBe('PROCESSED');
      expect(res.pipelineResult.stages.artifactDetection.hasArtifact).toBe(true);
      expect(res.pipelineResult.quality).toBeLessThan(1.0);
    });

    test('Detects flatline sensor detachment and sets quality to 0.0', () => {
      adapter.setUserConsent(true);
      const flatline = { data: new Array(100).fill(0.0) };
      const res = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EEG, flatline);

      expect(res.pipelineResult.stages.artifactDetection.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining('flatline')])
      );
      expect(res.pipelineResult.quality).toBe(0.0);
    });

    test('Calculates sampling jitter and effective Fs in Stage 3 alignment', () => {
      const timestamps = [1000, 1004, 1008, 1012, 1016]; // 4ms spacing = 250Hz
      const alignment = signalProcessingPipeline.alignSampling(timestamps, 250);

      expect(alignment.aligned).toBe(true);
      expect(alignment.estimatedFs).toBe(250);
      expect(alignment.jitterMs).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Personal Baseline Calibration & Normalization
  // ────────────────────────────────────────────────────────────
  describe('4. Personal Baselines & Individual Calibration', () => {
    test('Calibrates user-specific baseline from multiple resting frames', () => {
      const frames = [
        { features: { alpha: 24, rmssd: 42, scl: 5.1 }, quality: 0.95 },
        { features: { alpha: 26, rmssd: 45, scl: 5.3 }, quality: 0.92 },
        { features: { alpha: 25, rmssd: 43, scl: 5.2 }, quality: 0.94 }
      ];

      const calRes = baselineManager.calibrateBaseline(BIO_SIGNAL_TYPES.EEG, frames, {
        deviceModel: 'Bench EEG v2',
        samplingRate: 250
      });

      expect(calRes.success).toBe(true);
      expect(calRes.baselineProfile.metrics.alpha.mean).toBe(25);
      expect(calRes.baselineProfile.calibrationConfidence).toBeGreaterThan(0);
      expect(calRes.baselineProfile.knownLimitations.length).toBeGreaterThan(0);
    });

    test('Normalizes live signals using personal z-score rather than universal thresholds', () => {
      const frames = [
        { features: { alpha: 20 }, quality: 1.0 },
        { features: { alpha: 22 }, quality: 1.0 },
        { features: { alpha: 21 }, quality: 1.0 }
      ];
      baselineManager.calibrateBaseline(BIO_SIGNAL_TYPES.EEG, frames);

      // Live alpha = 21 (exactly mean -> z-score = 0)
      const normAtMean = baselineManager.normalizeFeatures(BIO_SIGNAL_TYPES.EEG, { alpha: 21 });
      expect(normAtMean.normalized).toBe(true);
      expect(normAtMean.zScores.alpha).toBeCloseTo(0.0, 1);
      expect(normAtMean.percentiles.alpha).toBeCloseTo(50, -1);

      // Live alpha = 25 (elevated relative to personal baseline)
      const normElevated = baselineManager.normalizeFeatures(BIO_SIGNAL_TYPES.EEG, { alpha: 25 });
      expect(normElevated.zScores.alpha).toBeGreaterThan(1.5);
      expect(normElevated.percentiles.alpha).toBeGreaterThan(90);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Multimodal Fusion & Missing-Sensor Transparency
  // ────────────────────────────────────────────────────────────
  describe('5. Multimodal Fusion Engine', () => {
    test('Fuses multiple active streams and reports provenance and missing sensors', () => {
      const streams = {
        [BIO_SIGNAL_TYPES.EEG]: {
          signalType: BIO_SIGNAL_TYPES.EEG,
          quality: 0.9,
          features: { workloadIndex: 0.65 },
          isSimulated: true
        },
        [BIO_SIGNAL_TYPES.ECG]: {
          signalType: BIO_SIGNAL_TYPES.ECG,
          quality: 0.85,
          features: { heartRateBpm: 72, rmssd: 45 },
          isSimulated: true
        }
      };

      const fused = multimodalFusionEngine.fuseStreams(streams);
      expect(fused.fused).toBe(true);
      expect(fused.activeSensors).toEqual([BIO_SIGNAL_TYPES.EEG, BIO_SIGNAL_TYPES.ECG]);
      expect(fused.missingSensors).toContain(BIO_SIGNAL_TYPES.PPG);
      expect(fused.missingSensors).toContain(BIO_SIGNAL_TYPES.EDA);
      expect(fused.missingSensors).toContain(BIO_SIGNAL_TYPES.MOTION);
      expect(fused.isSimulated).toBe(true);
      expect(fused.confidence).toBeLessThan(0.9); // Missing sensors bound confidence
      expect(fused.estimates.cognitiveWorkloadIndex).toBeDefined();
    });

    test('Motion artifact penalizes fused confidence score to prevent false certainty', () => {
      const quietStreams = {
        [BIO_SIGNAL_TYPES.EEG]: { features: { workloadIndex: 0.6 }, quality: 0.9 },
        [BIO_SIGNAL_TYPES.MOTION]: { features: { motionArtifactLikely: false }, quality: 1.0 }
      };
      const motionCorruptedStreams = {
        [BIO_SIGNAL_TYPES.EEG]: { features: { workloadIndex: 0.6 }, quality: 0.9 },
        [BIO_SIGNAL_TYPES.MOTION]: { features: { motionArtifactLikely: true }, quality: 1.0 }
      };

      const quietRes = multimodalFusionEngine.fuseStreams(quietStreams);
      const motionRes = multimodalFusionEngine.fuseStreams(motionCorruptedStreams);

      expect(motionRes.motionArtifactFlag).toBe(true);
      expect(motionRes.confidence).toBeLessThan(quietRes.confidence);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Simulation Invariants & End-to-End Pipeline
  // ────────────────────────────────────────────────────────────
  describe('6. Simulation Invariants & Synthetic Demonstration', () => {
    test('Simulated signals are explicitly labelled SIMULATED and never presented as real', () => {
      const eeg = syntheticBiosignalGenerator.generateEEG(1, 250);
      expect(eeg.isSimulated).toBe(true);
      expect(eeg.source).toBe('SIMULATED');
      expect(eeg.provenance).toBe(PROVENANCE_TYPES.SYNTHETIC_SIMULATED);

      const ecg = syntheticBiosignalGenerator.generateECG(1, 500);
      expect(ecg.isSimulated).toBe(true);
      expect(ecg.source).toBe('SIMULATED');
    });

    test('Executes end-to-end simulated pipeline with structured outputs and explicit disclaimers', () => {
      const simDemo = adapter.runSimulatedPipeline(BIO_SIGNAL_TYPES.EEG, 2);

      expect(simDemo.isSimulated).toBe(true);
      expect(simDemo.source).toBe('SIMULATED');
      expect(simDemo.provenance).toBe(PROVENANCE_TYPES.SYNTHETIC_SIMULATED);
      expect(simDemo.pipelineResult.success).toBe(true);
      expect(simDemo.features.bandPowers).toBeDefined();
      expect(simDemo.disclaimer).toContain('Non-medical');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Privacy, Consent & Immediate Biosignal Purge
  // ────────────────────────────────────────────────────────────
  describe('7. Privacy, Data Retention & Purge', () => {
    test('Blocks ingestion when consent is withheld', () => {
      adapter.setUserConsent(false);
      const simEEG = syntheticBiosignalGenerator.generateEEG(1, 250);
      const res = adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EEG, simEEG);

      expect(res.status).toBe('BLOCKED');
      expect(res.reason).toContain('User consent required');
      expect(adapter.getActiveStateEstimate()).toBeNull();
    });

    test('purgeAllBiosignals immediately wipes raw buffers, features, and baselines', () => {
      adapter.setUserConsent(true);
      const simEEG = syntheticBiosignalGenerator.generateEEG(1, 250);
      adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EEG, simEEG);

      expect(adapter.getStatus().activeStreams.length).toBeGreaterThan(0);

      // Execute complete purge
      adapter.purgeAllBiosignals();

      expect(adapter.getStatus().activeStreams.length).toBe(0);
      expect(adapter.getActiveStateEstimate()).toBeNull();
      expect(adapter.getMultimodalContext()).toBeNull();
      expect(baselineManager.getAllBaselines()).toEqual({});
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Cognitive Integration (Non-Clinical & Uncertainty-Bounded)
  // ────────────────────────────────────────────────────────────
  describe('8. Cognitive Integration & Ethical Boundaries', () => {
    test('exportCognitiveContext produces formattedBlock only when consented and active', () => {
      // 1. Without consent -> disabled
      adapter.setUserConsent(false);
      expect(adapter.exportCognitiveContext().enabled).toBe(false);

      // 2. With consent and active simulation -> enabled with uncertainty bounds
      adapter.setUserConsent(true);
      const simEEG = syntheticBiosignalGenerator.generateEEG(2, 250);
      adapter.ingestRawPacket(BIO_SIGNAL_TYPES.EEG, simEEG);

      const exported = adapter.exportCognitiveContext();
      expect(exported.enabled).toBe(true);
      expect(exported.isSimulated).toBe(true);
      expect(exported.formattedBlock).toContain('PHYSIOLOGICAL & SENSOR CONTEXT');
      expect(exported.formattedBlock).toContain('SYNTHETIC SIMULATION (NOT REAL)');
      expect(exported.formattedBlock).toContain('Non-diagnostic computational estimate');
    });

    test('CognitiveContextCompiler includes physiological block when available without overwriting user statements', () => {
      adapter.setUserConsent(true);
      const simECG = syntheticBiosignalGenerator.generateECG(2, 500);
      adapter.ingestRawPacket(BIO_SIGNAL_TYPES.ECG, simECG);

      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'I feel completely energized and ready to code',
        mode: 'ENGINEERING_COLLABORATOR',
        options: { neuroAdapter: adapter }
      });

      expect(compiled.neuroContext).toBeDefined();
      expect(compiled.neuroContext.enabled).toBe(true);
      expect(compiled.formattedBlock).toContain('PHYSIOLOGICAL & SENSOR CONTEXT');
      expect(compiled.formattedBlock).toContain('Explicit user statements strictly override sensor indications');
    });

    test('AdhyModel updates neuroContext in state domain without mutating identity or cognition', () => {
      const priorIdentity = adhyModel.getIdentityContext();
      const priorPrinciples = adhyModel.getDimension('principles');

      adhyModel.updateNeuroContext({
        connected: true,
        signalQuality: 0.95,
        features: { alpha: 25 },
        isSimulated: true
      });

      const neuroState = adhyModel.getNeuroContext();
      expect(neuroState.connected).toBe(true);
      expect(neuroState.signalQuality).toBe(0.95);
      expect(neuroState.isSimulated).toBe(true);

      // Durable identity and principles remain strictly untouched
      expect(adhyModel.getIdentityContext()).toEqual(priorIdentity);
      expect(adhyModel.getDimension('principles')).toEqual(priorPrinciples);
    });
  });
});

