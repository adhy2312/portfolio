/**
 * ════════════════════════════════════════════════════════════════════
 *  MULTIMODAL FUSION ENGINE — MULTI-STREAM CONTEXT INTEGRATION (PHASE 7)
 * ════════════════════════════════════════════════════════════════════
 * Combines validated feature streams (EEG, ECG, PPG, EDA, Motion, Audio, Camera)
 * into a coherent, uncertainty-bounded contextual snapshot.
 * 
 * CORE PRINCIPLE:
 * Missing or poor-quality signals must never create false certainty.
 * Every estimate contains full provenance and explicit missing-sensor lists.
 */

import { BIO_SIGNAL_TYPES, NON_MEDICAL_DISCLAIMER } from './NeuroContextTypes.js';

export class MultimodalFusionEngine {
  constructor() {
    this.modelVersion = 'v1.0.0-multimodal-fusion';
    this.supportedSensors = [
      BIO_SIGNAL_TYPES.EEG,
      BIO_SIGNAL_TYPES.ECG,
      BIO_SIGNAL_TYPES.PPG,
      BIO_SIGNAL_TYPES.EDA,
      BIO_SIGNAL_TYPES.MOTION,
      BIO_SIGNAL_TYPES.AUDIO,
      BIO_SIGNAL_TYPES.CAMERA
    ];
  }

  /**
   * Fuses active streams into an uncertainty-bounded multimodal context estimate
   * @param {Map<string, Object>|Object} streamRegistry - active feature streams by signalType
   */
  fuseStreams(streamRegistry = {}) {
    const now = new Date().toISOString();
    const streams = streamRegistry instanceof Map
      ? Object.fromEntries(streamRegistry)
      : (streamRegistry || {});

    const activeTypes = Object.keys(streams).filter(k => streams[k] && streams[k].features);
    const missingSensors = this.supportedSensors.filter(s => !activeTypes.includes(s));

    // Zero active streams check
    if (activeTypes.length === 0) {
      return {
        fused: false,
        reason: 'No active sensor streams provided',
        activeSensors: [],
        missingSensors: this.supportedSensors,
        overallQuality: 0.0,
        confidence: 0.0,
        estimates: null,
        timestamp: now,
        disclaimer: NON_MEDICAL_DISCLAIMER
      };
    }

    const provenance = [];
    let isAnySimulated = false;
    let totalQuality = 0;
    const weights = {
      [BIO_SIGNAL_TYPES.EEG]: 0.35,
      [BIO_SIGNAL_TYPES.ECG]: 0.25,
      [BIO_SIGNAL_TYPES.PPG]: 0.15,
      [BIO_SIGNAL_TYPES.EDA]: 0.15,
      [BIO_SIGNAL_TYPES.MOTION]: 0.10,
      [BIO_SIGNAL_TYPES.AUDIO]: 0.05,
      [BIO_SIGNAL_TYPES.CAMERA]: 0.05
    };

    let weightSum = 0;

    activeTypes.forEach(type => {
      const s = streams[type];
      const q = typeof s.quality === 'number' ? s.quality : (s.signalQuality || 1.0);
      const w = weights[type] || 0.1;
      totalQuality += (q * w);
      weightSum += w;

      if (s.isSimulated || s.provenance === 'SYNTHETIC_SIMULATED') {
        isAnySimulated = true;
      }

      provenance.push({
        signalType: type,
        sensorId: s.sensorId || s.source || `${type}_adapter`,
        quality: q,
        timestamp: s.timestamp || now,
        isSimulated: Boolean(s.isSimulated)
      });
    });

    const compositeQuality = weightSum > 0 ? (totalQuality / weightSum) : 0;

    // Movement / motion artifact cross-check
    const motionStream = streams[BIO_SIGNAL_TYPES.MOTION];
    const isMotionCorrupted = motionStream && motionStream.features?.motionArtifactLikely;

    // Computational context estimates
    const estimates = this._computeFusedEstimates(streams, compositeQuality, isMotionCorrupted);

    // Confidence is strictly bounded by quality, missing sensors, and motion corruption
    const sensorAvailabilityRatio = activeTypes.length / this.supportedSensors.length;
    let confidence = compositeQuality * (0.5 + 0.5 * sensorAvailabilityRatio);
    if (isMotionCorrupted) confidence *= 0.5; // Motion penalty
    confidence = Math.round(Math.min(0.95, Math.max(0.0, confidence)) * 100) / 100;

    return {
      fused: true,
      modelVersion: this.modelVersion,
      timestamp: now,
      provenance,
      activeSensors: activeTypes,
      missingSensors,
      isSimulated: isAnySimulated,
      overallQuality: Math.round(compositeQuality * 100) / 100,
      confidence,
      motionArtifactFlag: Boolean(isMotionCorrupted),
      estimates,
      disclaimer: NON_MEDICAL_DISCLAIMER
    };
  }

  _computeFusedEstimates(streams, quality, isMotionCorrupted) {
    if (quality < 0.3) {
      return {
        state: 'UNCERTAIN_LOW_QUALITY',
        cognitiveWorkloadIndex: null,
        physioArousalIndex: null,
        note: 'Composite signal quality is insufficient for reliable contextual estimation.'
      };
    }

    const eeg = streams[BIO_SIGNAL_TYPES.EEG]?.features;
    const ecg = streams[BIO_SIGNAL_TYPES.ECG]?.features;
    const eda = streams[BIO_SIGNAL_TYPES.EDA]?.features;

    // 1. Cognitive Workload Fusion (EEG beta/theta + ECG RMSSD suppression)
    let workloadScore = null;
    let workloadInputs = 0;
    let workloadSum = 0;

    if (eeg && typeof eeg.workloadIndex === 'number') {
      workloadSum += eeg.workloadIndex * 1.5;
      workloadInputs += 1.5;
    }
    if (ecg && typeof ecg.rmssd === 'number') {
      // Lower RMSSD generally correlates with sympathetic workload
      const ecgWorkload = ecg.rmssd < 25 ? 0.8 : (ecg.rmssd > 50 ? 0.3 : 0.55);
      workloadSum += ecgWorkload;
      workloadInputs += 1.0;
    }

    if (workloadInputs > 0) {
      workloadScore = Math.round((workloadSum / workloadInputs) * 100) / 100;
    }

    // 2. Physiological Arousal Fusion (EDA SCR rate + HR)
    let arousalScore = null;
    let arousalInputs = 0;
    let arousalSum = 0;

    if (eda && typeof eda.arousalIndicator === 'number') {
      arousalSum += eda.arousalIndicator * 1.5;
      arousalInputs += 1.5;
    }
    if (ecg && typeof ecg.heartRateBpm === 'number') {
      const hrArousal = Math.min(1.0, Math.max(0.0, (ecg.heartRateBpm - 55) / 60));
      arousalSum += hrArousal;
      arousalInputs += 1.0;
    }

    if (arousalInputs > 0) {
      arousalScore = Math.round((arousalSum / arousalInputs) * 100) / 100;
    }

    return {
      cognitiveWorkloadIndex: workloadScore,
      physioArousalIndex: arousalScore,
      stabilityIndex: Math.round((1 - (isMotionCorrupted ? 0.6 : 0.1)) * 100) / 100
    };
  }
}

export const multimodalFusionEngine = new MultimodalFusionEngine();

