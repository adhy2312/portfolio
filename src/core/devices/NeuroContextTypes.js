/**
 * ════════════════════════════════════════════════════════════════════
 *  NEURO CONTEXT & MULTIMODAL TYPES & SCHEMAS (PHASE 7)
 * ════════════════════════════════════════════════════════════════════
 * Sensor-independent physiological and multimodal context definitions.
 * 
 * CORE PRINCIPLE:
 * This is an experimental engineering and human-computer interaction
 * architecture — NOT a mind-reading or medical diagnostic system.
 */

export const BIO_SIGNAL_TYPES = Object.freeze({
  EEG: 'EEG',         // Electroencephalography (e.g. OpenBCI, Muse)
  ECG: 'ECG',         // Electrocardiography (e.g. Polar H10, AD8232)
  PPG: 'PPG',         // Photoplethysmography (e.g. Pulse sensor, smart rings)
  HRV: 'HRV',         // Heart Rate Variability derived metrics
  EDA: 'EDA',         // Electrodermal Activity / Galvanic Skin Response
  MOTION: 'MOTION',   // Accelerometer / Gyroscope (IMU 6-DoF/9-DoF)
  AUDIO: 'AUDIO',     // Non-speech acoustic features (RMS energy, voice pitch)
  CAMERA: 'CAMERA',   // Non-invasive optical features (blink rate, head pose)
  SLEEP: 'SLEEP'      // Sleep architecture and duration context
});

export const DEVICE_CONNECTION_STATUS = Object.freeze({
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  CALIBRATING: 'CALIBRATING',
  STREAMING: 'STREAMING',
  ERROR: 'ERROR'
});

export const PROCESSING_STAGES = Object.freeze({
  ACQUISITION: 'acquisition',
  VALIDATION: 'validation',
  SAMPLING_ALIGNMENT: 'sampling_alignment',
  SIGNAL_CONDITIONING: 'signal_conditioning',
  ARTIFACT_DETECTION: 'artifact_detection',
  FILTERING: 'filtering',
  FEATURE_EXTRACTION: 'feature_extraction',
  QUALITY_ASSESSMENT: 'quality_assessment',
  BASELINE_NORMALIZATION: 'baseline_normalization',
  CONTEXT_ESTIMATION: 'context_estimation'
});

export const PROVENANCE_TYPES = Object.freeze({
  REAL_HARDWARE: 'REAL_HARDWARE',
  SYNTHETIC_SIMULATED: 'SYNTHETIC_SIMULATED',
  BENCHMARK_RECORDING: 'BENCHMARK_RECORDING'
});

export const DEFAULT_SAMPLING_RATES = Object.freeze({
  EEG: 250,    // Hz (typical for consumer/research EEG)
  ECG: 500,    // Hz (standard for QRS resolution)
  PPG: 64,     // Hz
  EDA: 32,     // Hz (slow galvanic transitions)
  MOTION: 100, // Hz (6-axis IMU)
  AUDIO: 16000,// Hz
  CAMERA: 30   // FPS
});

export const EEG_BANDS = Object.freeze({
  DELTA: { name: 'delta', minHz: 0.5, maxHz: 4.0 },
  THETA: { name: 'theta', minHz: 4.0, maxHz: 8.0 },
  ALPHA: { name: 'alpha', minHz: 8.0, maxHz: 13.0 },
  BETA:  { name: 'beta',  minHz: 13.0, maxHz: 30.0 },
  GAMMA: { name: 'gamma', minHz: 30.0, maxHz: 45.0 }
});

export const NON_MEDICAL_DISCLAIMER = Object.freeze(
  'NON-MEDICAL (Non-medical) computational estimate for research and contextual assistance only. ' +
  'Mini-Adhy does NOT decode thoughts, read subjective intentions, or provide medical, psychological, or psychiatric diagnoses; this is NOT a clinical diagnostic device.'
);

