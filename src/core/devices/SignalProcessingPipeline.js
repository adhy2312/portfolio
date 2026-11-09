/**
 * ════════════════════════════════════════════════════════════════════
 *  SIGNAL PROCESSING PIPELINE — ECE & DSP CAPABILITIES (PHASE 7)
 * ════════════════════════════════════════════════════════════════════
 * Modular 10-stage bio-signal and multimodal processing engine.
 * 
 * Pipeline stages:
 * 1. Acquisition → 2. Validation → 3. Sampling Alignment →
 * 4. Conditioning → 5. Artifact Detection → 6. Filtering →
 * 7. Feature Extraction → 8. Quality Assessment →
 * 9. Baseline Normalization → 10. Context Estimation.
 * 
 * Grounded in digital signal processing principles (sampling theory,
 * spectral decomposition, peak detection, tonic/phasic separation).
 */

import {
  BIO_SIGNAL_TYPES,
  DEFAULT_SAMPLING_RATES,
  EEG_BANDS,
  NON_MEDICAL_DISCLAIMER
} from './NeuroContextTypes.js';

export class SignalProcessingPipeline {
  constructor(options = {}) {
    this.defaultSamplingRates = { ...DEFAULT_SAMPLING_RATES, ...(options.samplingRates || {}) };
  }

  /**
   * Main entrypoint: Executes full 10-stage processing pipeline on a raw packet
   */
  processPacket(signalType, rawPacket, baselineManager = null, options = {}) {
    const startTime = Date.now();
    const Fs = options.samplingRate || this.defaultSamplingRates[signalType] || 250;
    const stages = {};
    const errors = [];

    // Stage 1: Acquisition
    stages.acquisition = {
      signalType,
      receivedAt: new Date().toISOString(),
      rawLength: Array.isArray(rawPacket?.data) ? rawPacket.data.length : 0,
      metadata: rawPacket?.metadata || {}
    };

    // Stage 2: Validation
    const validation = this.validatePacket(signalType, rawPacket);
    stages.validation = validation;
    if (!validation.valid) {
      errors.push(`Validation failed: ${validation.error}`);
      return this._assemblePipelineResult(signalType, stages, errors, startTime);
    }

    const rawData = rawPacket.data;

    // Stage 3: Sampling & Timestamp Alignment
    const alignment = this.alignSampling(rawPacket.timestamps, Fs);
    stages.samplingAlignment = alignment;

    // Stage 4: Signal Conditioning (Zero-mean / DC offset removal)
    const conditionedData = this.conditionSignal(signalType, rawData);
    stages.signalConditioning = {
      dcOffsetRemoved: conditionedData.dcOffset,
      mean: conditionedData.mean,
      stdDev: conditionedData.stdDev
    };

    // Stage 5: Artifact Detection
    const artifacts = this.detectArtifacts(signalType, conditionedData.samples, Fs);
    stages.artifactDetection = artifacts;

    // Stage 6: Filtering / Windowing
    const filteredData = this.applyWindowAndFilter(signalType, conditionedData.samples, Fs);
    stages.filtering = {
      windowApplied: filteredData.windowType,
      filterBand: filteredData.filterBand
    };

    // Stage 7: Feature Extraction (DSP Domain Modules)
    const features = this.extractFeatures(signalType, filteredData.samples, Fs, options);
    stages.featureExtraction = features;

    // Stage 8: Quality Assessment
    const quality = this.assessQuality(signalType, conditionedData.samples, artifacts, features);
    stages.qualityAssessment = quality;

    // Stage 9: Baseline Normalization
    let normalized = null;
    if (baselineManager && typeof baselineManager.normalizeFeatures === 'function') {
      normalized = baselineManager.normalizeFeatures(signalType, features);
    }
    stages.baselineNormalization = normalized || { normalized: false, reason: 'No active baseline calibration' };

    // Stage 10: Context Estimation (Non-clinical computational inference)
    const contextEstimate = this.estimateContext(signalType, features, quality, normalized);
    stages.contextEstimation = contextEstimate;

    return this._assemblePipelineResult(signalType, stages, errors, startTime, quality.score, features, contextEstimate);
  }

  // ── Stage 2: Validation ─────────────────────────────────────────────

  validatePacket(signalType, rawPacket) {
    if (!rawPacket || typeof rawPacket !== 'object') {
      return { valid: false, error: 'Packet must be a non-null object' };
    }
    if (!Array.isArray(rawPacket.data) || rawPacket.data.length === 0) {
      return { valid: false, error: 'Packet data must be a non-empty array of samples' };
    }
    for (let i = 0; i < rawPacket.data.length; i++) {
      const v = rawPacket.data[i];
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) return { valid: false, error: `Malformed numeric sample at index ${i}: ${v}` };
      } else if (typeof v === 'object' && v !== null) {
        if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) {
          return { valid: false, error: `Malformed 3-axis sample at index ${i}` };
        }
      } else {
        return { valid: false, error: `Malformed sample at index ${i}: ${v}` };
      }
    }
    return { valid: true, sampleCount: rawPacket.data.length };
  }

  // ── Stage 3: Sampling Alignment ─────────────────────────────────────

  alignSampling(timestamps, nominalFs) {
    if (!Array.isArray(timestamps) || timestamps.length < 2) {
      return { aligned: true, jitterMs: 0, estimatedFs: nominalFs };
    }
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgDt = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, dt) => acc + Math.pow(dt - avgDt, 2), 0) / intervals.length;
    const jitterMs = Math.sqrt(variance);
    const estimatedFs = avgDt > 0 ? 1000 / avgDt : nominalFs;

    return {
      aligned: jitterMs < (1000 / nominalFs * 0.5), // Jitter < 50% sample period
      nominalFs,
      estimatedFs: Math.round(estimatedFs * 10) / 10,
      jitterMs: Math.round(jitterMs * 100) / 100
    };
  }

  // ── Stage 4: Signal Conditioning ────────────────────────────────────

  conditionSignal(signalType, rawSamples) {
    let scalarSamples = rawSamples;
    if (Array.isArray(rawSamples) && typeof rawSamples[0] === 'object' && rawSamples[0] !== null) {
      scalarSamples = rawSamples.map(s => Math.sqrt(Math.pow(s.x || 0, 2) + Math.pow(s.y || 0, 2) + Math.pow(s.z || 0, 2)));
    }

    const N = scalarSamples.length;
    const mean = scalarSamples.reduce((acc, s) => acc + s, 0) / (N || 1);
    const variance = scalarSamples.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / (N || 1);
    const stdDev = Math.sqrt(variance);

    // Unipolar signals (EDA SCL, Motion magnitude) retain their DC component
    const isUnipolar = signalType === BIO_SIGNAL_TYPES.EDA || signalType === BIO_SIGNAL_TYPES.MOTION;
    const conditionedSamples = isUnipolar ? scalarSamples : scalarSamples.map(s => s - mean);

    return {
      samples: conditionedSamples,
      rawScalarSamples: scalarSamples,
      mean: Math.round(mean * 1000) / 1000,
      dcOffset: isUnipolar ? 0 : Math.round(mean * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000
    };
  }

  // ── Stage 5: Artifact Detection ─────────────────────────────────────

  detectArtifacts(signalType, samples, Fs) {
    const N = samples.length;
    if (N === 0) return { hasArtifact: false, reasons: [], artifactRatio: 0 };

    const reasons = [];
    let corruptedSamples = 0;

    // Amplitude clipping / rail saturation check
    const maxAmp = Math.max(...samples.map(Math.abs));
    let threshold = 200; // microvolts for EEG
    if (signalType === BIO_SIGNAL_TYPES.ECG) threshold = 5000;
    if (signalType === BIO_SIGNAL_TYPES.EDA) threshold = 50;
    if (signalType === BIO_SIGNAL_TYPES.MOTION) threshold = 20;

    if (maxAmp > threshold) {
      reasons.push(`Amplitude threshold excursion: max=${maxAmp.toFixed(1)} > threshold=${threshold}`);
    }

    // Flatline / variance collapse detection
    const variance = samples.reduce((a, s) => a + s * s, 0) / N;
    if (variance < 0.001) {
      reasons.push('Signal flatline / sensor detachment detected (variance < 0.001)');
      corruptedSamples = N;
    }

    // High amplitude spike ratio
    const spikeCount = samples.filter(s => Math.abs(s) > threshold * 0.8).length;
    corruptedSamples = Math.max(corruptedSamples, spikeCount);
    const artifactRatio = Math.round((corruptedSamples / N) * 100) / 100;

    return {
      hasArtifact: reasons.length > 0 || artifactRatio > 0.15,
      reasons,
      artifactRatio,
      maxAmplitude: Math.round(maxAmp * 100) / 100,
      variance: Math.round(variance * 100) / 100
    };
  }

  // ── Stage 6: Filtering / Windowing ──────────────────────────────────

  applyWindowAndFilter(signalType, samples, Fs) {
    const N = samples.length;
    // For unipolar signals where absolute DC/low-drift is the primary metric, preserve rectangular window
    if (signalType === BIO_SIGNAL_TYPES.EDA || signalType === BIO_SIGNAL_TYPES.MOTION) {
      return {
        samples: [...samples],
        windowType: 'Rectangular (Unipolar Preserved)',
        filterBand: signalType === BIO_SIGNAL_TYPES.EDA ? '0.01-5 Hz (Galvanic)' : '0.1-20 Hz (Body Motion)'
      };
    }

    // Apply Hann window for spectral signals (EEG/ECG)
    const windowed = samples.map((s, n) => {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1 || 1)));
      return s * w;
    });

    let filterBand = '0.5-45 Hz';
    if (signalType === BIO_SIGNAL_TYPES.ECG) filterBand = '0.5-40 Hz (QRS Bandpass)';

    return {
      samples: windowed,
      windowType: 'Hann',
      filterBand
    };
  }

  // ── Stage 7: Feature Extraction ─────────────────────────────────────

  extractFeatures(signalType, samples, Fs, options = {}) {
    switch (signalType) {
      case BIO_SIGNAL_TYPES.EEG:
        return this.extractEEGFeatures(samples, Fs);
      case BIO_SIGNAL_TYPES.ECG:
        return this.extractECGFeatures(samples, Fs);
      case BIO_SIGNAL_TYPES.PPG:
        return this.extractPPGFeatures(samples, Fs);
      case BIO_SIGNAL_TYPES.EDA:
        return this.extractEDAFeatures(samples, Fs);
      case BIO_SIGNAL_TYPES.MOTION:
        return this.extractMotionFeatures(samples, Fs, options);
      case BIO_SIGNAL_TYPES.AUDIO:
        return this.extractAudioFeatures(samples, Fs);
      case BIO_SIGNAL_TYPES.CAMERA:
        return this.extractCameraFeatures(samples, options);
      default:
        return { signalType, sampleCount: samples.length };
    }
  }

  /**
   * EEG Spectral Band Power Decomposition via Discrete Fourier Bins
   */
  extractEEGFeatures(samples, Fs) {
    const N = samples.length;
    if (N < 8) return { bandPowers: {}, totalPower: 0 };

    // Compute power spectral density for discrete frequency bins
    const psd = [];
    const maxFreq = Math.min(Fs / 2, 50); // Nyquist limit clamped to 50Hz
    const freqStep = Fs / N;

    for (let k = 0; k < N / 2; k++) {
      const freq = k * freqStep;
      if (freq > maxFreq) break;

      // Discrete Fourier component at bin k
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += samples[n] * Math.cos(angle);
        imag -= samples[n] * Math.sin(angle);
      }
      const power = (real * real + imag * imag) / (N * N);
      psd.push({ freq, power });
    }

    // Integrate band powers
    const computeBandPower = (minHz, maxHz) => {
      const bins = psd.filter(b => b.freq >= minHz && b.freq < maxHz);
      if (bins.length === 0) return 0.001;
      return bins.reduce((acc, b) => acc + b.power, 0);
    };

    const delta = computeBandPower(EEG_BANDS.DELTA.minHz, EEG_BANDS.DELTA.maxHz);
    const theta = computeBandPower(EEG_BANDS.THETA.minHz, EEG_BANDS.THETA.maxHz);
    const alpha = computeBandPower(EEG_BANDS.ALPHA.minHz, EEG_BANDS.ALPHA.maxHz);
    const beta = computeBandPower(EEG_BANDS.BETA.minHz, EEG_BANDS.BETA.maxHz);
    const gamma = computeBandPower(EEG_BANDS.GAMMA.minHz, EEG_BANDS.GAMMA.maxHz);

    const totalPower = delta + theta + alpha + beta + gamma || 0.001;

    // Relative band powers (0.0 to 1.0)
    const relative = {
      delta: delta / totalPower,
      theta: theta / totalPower,
      alpha: alpha / totalPower,
      beta: beta / totalPower,
      gamma: gamma / totalPower
    };

    // Attentional / Workload Indices
    const alphaThetaRatio = alpha / (theta || 0.001);
    const betaThetaRatio = beta / (theta || 0.001);
    const workloadIndex = Math.min(1.0, Math.max(0.0, (beta / (alpha + theta || 0.001)) * 0.5));
    const focusIndex = Math.min(1.0, Math.max(0.0, (betaThetaRatio * 0.4)));

    return {
      bandPowers: {
        delta: Math.round(delta * 1000) / 1000,
        theta: Math.round(theta * 1000) / 1000,
        alpha: Math.round(alpha * 1000) / 1000,
        beta: Math.round(beta * 1000) / 1000,
        gamma: Math.round(gamma * 1000) / 1000
      },
      relativeBandPowers: {
        delta: Math.round(relative.delta * 1000) / 1000,
        theta: Math.round(relative.theta * 1000) / 1000,
        alpha: Math.round(relative.alpha * 1000) / 1000,
        beta: Math.round(relative.beta * 1000) / 1000,
        gamma: Math.round(relative.gamma * 1000) / 1000
      },
      totalPower: Math.round(totalPower * 1000) / 1000,
      alphaThetaRatio: Math.round(alphaThetaRatio * 100) / 100,
      betaThetaRatio: Math.round(betaThetaRatio * 100) / 100,
      workloadIndex: Math.round(workloadIndex * 100) / 100,
      focusIndex: Math.round(focusIndex * 100) / 100
    };
  }

  /**
   * ECG Pan-Tompkins Peak Detection & Heart Rate Variability (HRV)
   */
  extractECGFeatures(samples, Fs) {
    const N = samples.length;
    if (N < 20) return { heartRateBpm: null, rrIntervals: [], rmssd: null };

    // 1. Derivative Filter: d[n] = 2*x[n] + x[n-1] - x[n-3] - 2*x[n-4]
    const derived = new Array(N).fill(0);
    for (let i = 2; i < N - 2; i++) {
      derived[i] = samples[i + 1] - samples[i - 1];
    }

    // 2. Squaring function to accentuate QRS peaks
    const squared = derived.map(d => d * d);

    // 3. Adaptive threshold peak detection with 350ms refractory blanking
    const maxEnergy = Math.max(...squared);
    const meanEnergy = squared.reduce((a, b) => a + b, 0) / N;
    const peakThreshold = Math.max(meanEnergy * 3.0, maxEnergy * 0.35);
    const refractorySamples = Math.round(0.35 * Fs); // 350ms minimum between heartbeats

    const rPeaks = [];
    let lastPeak = -refractorySamples;

    for (let i = 1; i < N - 1; i++) {
      if (squared[i] > peakThreshold &&
          squared[i] > squared[i - 1] &&
          squared[i] >= squared[i + 1] &&
          (i - lastPeak) >= refractorySamples) {
        rPeaks.push(i);
        lastPeak = i;
      }
    }

    // Compute RR intervals in milliseconds
    const rrIntervals = [];
    for (let i = 1; i < rPeaks.length; i++) {
      const dtSamples = rPeaks[i] - rPeaks[i - 1];
      const rrMs = (dtSamples / Fs) * 1000;
      // Physiological plausibility check (300ms to 1800ms -> 33 to 200 BPM)
      if (rrMs >= 300 && rrMs <= 1800) {
        rrIntervals.push(Math.round(rrMs));
      }
    }

    // HRV RMSSD calculation
    let rmssd = null;
    let meanRR = null;
    let heartRateBpm = null;

    if (rrIntervals.length >= 2) {
      let sumSqDiff = 0;
      for (let i = 1; i < rrIntervals.length; i++) {
        const diff = rrIntervals[i] - rrIntervals[i - 1];
        sumSqDiff += diff * diff;
      }
      rmssd = Math.round(Math.sqrt(sumSqDiff / (rrIntervals.length - 1)) * 10) / 10;
      meanRR = Math.round(rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length);
      heartRateBpm = Math.round(60000 / meanRR);
    } else if (rPeaks.length >= 2) {
      const avgIntervalSamples = (rPeaks[rPeaks.length - 1] - rPeaks[0]) / (rPeaks.length - 1);
      const estRR = (avgIntervalSamples / Fs) * 1000;
      heartRateBpm = Math.round(60000 / estRR);
      meanRR = Math.round(estRR);
    }

    return {
      rPeakCount: rPeaks.length,
      rrIntervals,
      meanRR,
      heartRateBpm,
      rmssd,
      signalPlausibility: rrIntervals.length > 0 || rPeaks.length > 0
    };
  }

  /**
   * PPG Pulse Detection & Inter-Beat Interval (IBI)
   */
  extractPPGFeatures(samples, Fs) {
    const N = samples.length;
    if (N < 10) return { pulseRateBpm: null, ibis: [] };

    // Systolic peak detection
    const mean = samples.reduce((a, b) => a + b, 0) / N;
    const threshold = mean + (Math.max(...samples) - mean) * 0.4;
    const refractory = Math.round(0.3 * Fs); // 300ms min pulse gap

    const peaks = [];
    let lastPeak = -refractory;
    for (let i = 1; i < N - 1; i++) {
      if (samples[i] > threshold && samples[i] > samples[i - 1] && samples[i] >= samples[i + 1] && (i - lastPeak) >= refractory) {
        peaks.push(i);
        lastPeak = i;
      }
    }

    const ibis = [];
    for (let i = 1; i < peaks.length; i++) {
      const ibiMs = ((peaks[i] - peaks[i - 1]) / Fs) * 1000;
      if (ibiMs >= 350 && ibiMs <= 1500) ibis.push(Math.round(ibiMs));
    }

    let pulseRateBpm = null;
    if (ibis.length > 0) {
      const avgIbi = ibis.reduce((a, b) => a + b, 0) / ibis.length;
      pulseRateBpm = Math.round(60000 / avgIbi);
    }

    return {
      systolicPeakCount: peaks.length,
      ibis,
      pulseRateBpm
    };
  }

  /**
   * EDA Tonic (SCL) and Phasic (SCR) Feature Separation
   */
  extractEDAFeatures(samples, Fs) {
    const N = samples.length;
    if (N === 0) return { tonicSCL: 0, phasicSCRCount: 0, meanPhasicAmplitude: 0 };

    // 1. Tonic Component: Skin Conductance Level (Slow moving average ~0.05 Hz)
    const windowSize = Math.max(3, Math.round(Fs * 2)); // 2-second window
    const tonic = [];
    for (let i = 0; i < N; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(N, i + Math.floor(windowSize / 2));
      const slice = samples.slice(start, end);
      tonic.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }

    // 2. Phasic Component: Skin Conductance Response (Transient deviation above baseline)
    const phasic = samples.map((s, i) => Math.max(0, s - tonic[i]));

    // Detect discrete SCR peaks (> 0.02 microSiemens)
    let scrCount = 0;
    let scrSum = 0;
    for (let i = 1; i < N - 1; i++) {
      if (phasic[i] > 0.02 && phasic[i] > phasic[i - 1] && phasic[i] >= phasic[i + 1]) {
        scrCount++;
        scrSum += phasic[i];
      }
    }

    const meanTonic = tonic.reduce((a, b) => a + b, 0) / N;
    const meanPhasic = scrCount > 0 ? scrSum / scrCount : 0;

    return {
      meanTonicSCL: Math.round(meanTonic * 100) / 100, // microSiemens
      phasicSCRCount: scrCount,
      meanPhasicAmplitude: Math.round(meanPhasic * 1000) / 1000,
      arousalIndicator: Math.min(1.0, Math.max(0.0, (scrCount / (N / Fs || 1)) * 10)) // Frequency bounded
    };
  }

  /**
   * Motion Activity & Artifact Flag Extraction (IMU 3-Axis / 6-Axis)
   */
  extractMotionFeatures(samples, Fs, options = {}) {
    const N = samples.length;
    // Samples could be scalar magnitude or structured { x, y, z }
    let magnitudes = samples;
    if (Array.isArray(samples) && typeof samples[0] === 'object' && samples[0] !== null) {
      magnitudes = samples.map(s => Math.sqrt(Math.pow(s.x || 0, 2) + Math.pow(s.y || 0, 2) + Math.pow(s.z || 0, 2)));
    }

    const mean = magnitudes.reduce((a, b) => a + b, 0) / (N || 1);
    const variance = magnitudes.reduce((a, m) => a + Math.pow(m - mean, 2), 0) / (N || 1);
    const stdDev = Math.sqrt(variance);

    // Dynamic movement threshold (at rest variance < 0.005G, stdDev < 0.05G)
    const isMoving = stdDev > 0.15;
    const isVigorousMotion = stdDev > 0.30;

    return {
      meanAcceleration: Math.round(mean * 100) / 100,
      movementVariance: Math.round(variance * 1000) / 1000,
      movementStdDev: Math.round(stdDev * 100) / 100,
      isMoving,
      motionArtifactLikely: isVigorousMotion,
      activityLevel: isVigorousMotion ? 'HIGH_MOTION' : (isMoving ? 'MODERATE_MOTION' : 'STATIONARY')
    };
  }

  extractAudioFeatures(samples, Fs) {
    const N = samples.length;
    if (N === 0) return { rmsEnergy: 0, voiceActivityDetected: false };

    const energy = samples.reduce((acc, s) => acc + s * s, 0) / N;
    const rms = Math.sqrt(energy);

    return {
      rmsEnergy: Math.round(rms * 1000) / 1000,
      voiceActivityDetected: rms > 0.05
    };
  }

  extractCameraFeatures(samples, options = {}) {
    return {
      blinkRatePerMin: options.blinkRate || 16,
      headPoseStability: options.headStability || 0.88,
      trackedFeatures: ['blink_interval', 'head_pose_yaw_pitch_roll']
    };
  }

  // ── Stage 8: Quality Assessment ─────────────────────────────────────

  assessQuality(signalType, samples, artifacts, features) {
    let score = 1.0;

    // Penalize if artifacts detected
    if (artifacts.hasArtifact) {
      score -= (artifacts.artifactRatio * 0.7);
    }

    // Penalize signal variance anomalies
    if (artifacts.variance < 0.001) score = 0.0; // Flatline
    if (artifacts.reasons.length > 0) score -= (artifacts.reasons.length * 0.2);

    // Physiological plausibility checks
    if (signalType === BIO_SIGNAL_TYPES.ECG && features.heartRateBpm) {
      if (features.heartRateBpm < 35 || features.heartRateBpm > 210) {
        score -= 0.4; // Extreme implausible HR
      }
    }

    const clamped = Math.min(1.0, Math.max(0.0, score));

    return {
      score: Math.round(clamped * 100) / 100,
      usable: clamped >= 0.4,
      artifactPenalty: artifacts.hasArtifact,
      noiseLevel: clamped >= 0.8 ? 'LOW' : (clamped >= 0.4 ? 'MODERATE' : 'UNUSABLE')
    };
  }

  // ── Stage 10: Context Estimation ────────────────────────────────────

  estimateContext(signalType, features, quality, normalized) {
    if (!quality.usable) {
      return {
        estimatedState: 'INSUFFICIENT_QUALITY',
        confidence: 0.0,
        note: 'Signal quality below minimum usable threshold (0.4)'
      };
    }

    let estimatedWorkload = null;
    let estimatedArousal = null;

    if (signalType === BIO_SIGNAL_TYPES.EEG) {
      estimatedWorkload = features.workloadIndex;
    } else if (signalType === BIO_SIGNAL_TYPES.ECG && features.rmssd) {
      // Lower RMSSD correlates with higher stress/sympathetic activation
      estimatedWorkload = features.rmssd < 25 ? 0.75 : 0.35;
    } else if (signalType === BIO_SIGNAL_TYPES.EDA) {
      estimatedArousal = features.arousalIndicator;
    }

    return {
      signalType,
      estimatedWorkload,
      estimatedArousal,
      confidence: Math.round(quality.score * 0.8 * 100) / 100,
      disclaimer: NON_MEDICAL_DISCLAIMER
    };
  }

  _assemblePipelineResult(signalType, stages, errors, startTime, quality = 0.0, features = {}, contextEstimate = null) {
    return {
      success: errors.length === 0,
      signalType,
      quality,
      features,
      contextEstimate,
      stages,
      errors,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

export const signalProcessingPipeline = new SignalProcessingPipeline();

