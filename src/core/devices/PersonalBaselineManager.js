/**
 * ════════════════════════════════════════════════════════════════════
 *  PERSONAL BASELINE MANAGER — CALIBRATION & INDIVIDUALIZATION (PHASE 7)
 * ════════════════════════════════════════════════════════════════════
 * Supports user-specific baseline calibration for physiological features.
 * 
 * CORE PRINCIPLE:
 * Human physiological signals exhibit massive inter-individual variability.
 * Mini-Adhy never applies universal generic thresholds as personal truth.
 */

import { NON_MEDICAL_DISCLAIMER } from './NeuroContextTypes.js';

export class PersonalBaselineManager {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_personal_baselines_v1';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.baselines = new Map(); // signalType -> baselineProfile
    this.featureVersion = 'v1.0.0-dsp';
    this.loadBaselines();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); },
      remove: (k) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.removeItem(k); }
    };
  }

  /**
   * Calibrates a user-specific baseline from a sequence of resting feature frames
   */
  calibrateBaseline(signalType, featureFrames = [], metadata = {}) {
    if (!Array.isArray(featureFrames) || featureFrames.length < 3) {
      return {
        success: false,
        error: 'At least 3 valid feature frames are required to compute a statistical baseline.'
      };
    }

    const now = new Date().toISOString();
    const metricsAggregation = {};

    // Collect all numerical feature metrics across frames
    featureFrames.forEach(frame => {
      const source = frame.features || frame.metrics || frame;
      Object.keys(source).forEach(key => {
        const val = source[key];
        if (typeof val === 'number' && Number.isFinite(val)) {
          if (!metricsAggregation[key]) metricsAggregation[key] = [];
          metricsAggregation[key].push(val);
        } else if (typeof val === 'object' && val !== null) {
          // Flatten 1 level (e.g. bandPowers.alpha)
          Object.keys(val).forEach(subKey => {
            const subVal = val[subKey];
            if (typeof subVal === 'number' && Number.isFinite(subVal)) {
              const fullKey = `${key}_${subKey}`;
              if (!metricsAggregation[fullKey]) metricsAggregation[fullKey] = [];
              metricsAggregation[fullKey].push(subVal);
            }
          });
        }
      });
    });

    // Compute distribution metrics: mean, stdDev, min, max
    const computedMetrics = {};
    Object.keys(metricsAggregation).forEach(key => {
      const vals = metricsAggregation[key];
      const N = vals.length;
      const mean = vals.reduce((a, b) => a + b, 0) / N;
      const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / N;
      const stdDev = Math.sqrt(variance) || 0.001; // Avoid divide by zero

      computedMetrics[key] = {
        mean: Math.round(mean * 1000) / 1000,
        stdDev: Math.round(stdDev * 1000) / 1000,
        min: Math.round(Math.min(...vals) * 1000) / 1000,
        max: Math.round(Math.max(...vals) * 1000) / 1000,
        sampleCount: N
      };
    });

    const averageQuality = featureFrames.reduce((acc, f) => acc + (f.quality || f.signalQuality || 1.0), 0) / featureFrames.length;

    const baselineProfile = {
      signalType,
      featureVersion: this.featureVersion,
      calibratedAt: now,
      sampleCount: featureFrames.length,
      averageQuality: Math.round(averageQuality * 100) / 100,
      calibrationConfidence: Math.min(1.0, Math.max(0.2, (featureFrames.length / 20) * averageQuality)),
      metrics: computedMetrics,
      sensorMetadata: {
        deviceModel: metadata.deviceModel || 'generic_adapter',
        placement: metadata.placement || 'standard_electrode_placement',
        samplingRateHz: metadata.samplingRate || 250
      },
      knownLimitations: [
        'Calibrated in quiet resting state; invalid during vigorous exertion or high ambient EMF noise',
        'Valid for relative contextual comparison only; non-diagnostic'
      ],
      disclaimer: NON_MEDICAL_DISCLAIMER
    };

    this.baselines.set(signalType, baselineProfile);
    this.saveBaselines();

    return {
      success: true,
      baselineProfile
    };
  }

  /**
   * Normalizes live extracted features against user personal baseline using z-scores
   */
  normalizeFeatures(signalType, liveFeatures = {}) {
    const baseline = this.baselines.get(signalType);
    if (!baseline || !baseline.metrics) {
      return {
        normalized: false,
        reason: `No calibrated baseline found for signal type [${signalType}]`
      };
    }

    const zScores = {};
    const percentiles = {};

    const evaluateMetric = (key, val) => {
      const b = baseline.metrics[key];
      if (b && typeof val === 'number' && Number.isFinite(val)) {
        const z = (val - b.mean) / b.stdDev;
        zScores[key] = Math.round(z * 100) / 100;
        // Normal CDF approximation for percentile
        percentiles[key] = Math.round(this._approximateCDF(z) * 100);
      }
    };

    Object.keys(liveFeatures).forEach(k => {
      const v = liveFeatures[k];
      if (typeof v === 'number') {
        evaluateMetric(k, v);
      } else if (typeof v === 'object' && v !== null) {
        Object.keys(v).forEach(subK => {
          if (typeof v[subK] === 'number') {
            evaluateMetric(`${k}_${subK}`, v[subK]);
          }
        });
      }
    });

    return {
      normalized: true,
      signalType,
      baselineCalibratedAt: baseline.calibratedAt,
      calibrationConfidence: baseline.calibrationConfidence,
      zScores,
      percentiles
    };
  }

  _approximateCDF(z) {
    // Standard normal error function approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  getBaseline(signalType) {
    return this.baselines.get(signalType) || null;
  }

  getAllBaselines() {
    const res = {};
    this.baselines.forEach((v, k) => { res[k] = v; });
    return res;
  }

  resetBaseline(signalType = null) {
    if (signalType) {
      this.baselines.delete(signalType);
    } else {
      this.baselines.clear();
    }
    this.saveBaselines();
  }

  saveBaselines() {
    try {
      const serialized = JSON.stringify(this.getAllBaselines());
      this.storageAdapter.set(this.storageKey, serialized);
    } catch (e) {
      // Memory fallback
    }
  }

  loadBaselines() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.keys(parsed).forEach(k => this.baselines.set(k, parsed[k]));
      }
    } catch (e) {
      // Ignore corrupted stored baseline
    }
  }
}

export const personalBaselineManager = new PersonalBaselineManager();

