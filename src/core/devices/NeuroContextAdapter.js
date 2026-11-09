/**
 * ════════════════════════════════════════════════════════════════════
 *  NEURO CONTEXT ADAPTER — FUTURE PHYSIOLOGICAL SIGNAL INTERFACE
 * ════════════════════════════════════════════════════════════════════
 * Clean, hardware-independent gateway for future bio-signal context.
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 * 1. Zero Synthetic Brain Signals: Never fabricate EEG, neural telemetry, or fake cognitive scores.
 * 2. Explicit Hardware Status: When no device is attached, status is DISCONNECTED.
 * 3. Three-Tier Separation:
 *    • Raw Signals: Strictly isolated, requires explicit consent, separate retention & purge.
 *    • Extracted Features: Band powers, HRV RMSSD, movement variance with signal quality bounds.
 *    • Inferred States: Non-medical focus / workload context with confidence & timestamps.
 * 4. Medical Non-Diagnosis: Explicitly disclaims medical diagnosis and thought-reading claims.
 * 5. Full Reversibility: User can purge all raw and derived physiological state at any time.
 */

export const BIO_SIGNAL_TYPES = Object.freeze({
  EEG: 'EEG',         // Electroencephalography (e.g. Muse, OpenBCI)
  HRV: 'HRV',         // Heart Rate Variability (RMSSD / pNN50)
  EDA: 'EDA',         // Electrodermal Activity / Galvanic Skin Response
  MOTION: 'MOTION',   // Accelerometer / Movement variance
  SLEEP: 'SLEEP'      // Sleep duration & sleep architecture context
});

export const DEVICE_CONNECTION_STATUS = Object.freeze({
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR'
});

export class NeuroContextAdapter {
  constructor(storageAdapter = null) {
    this.status = DEVICE_CONNECTION_STATUS.DISCONNECTED;
    this.activeDevice = null;
    this.hasUserConsent = false;
    this.storageKey = 'mini_adhy_neuro_context_v1';
    
    // Tier 1: Raw Signals (strictly isolated, never saved to localStorage without explicit opt-in)
    this.rawSignalBuffer = [];
    this.maxRawSamples = 500;

    // Tier 2: Extracted Features
    this.latestFeatures = null;

    // Tier 3: Inferred Context States
    this.latestStateEstimate = null;

    this.disclaimer = 'Non-medical computational estimate for contextual assistance only. Mini-Adhy does NOT read thoughts, decode language, or provide medical/psychiatric diagnoses.';
  }

  /**
   * Status inspection (honest by construction — never claims fake connectivity)
   */
  getStatus() {
    return {
      connected: this.status === DEVICE_CONNECTION_STATUS.CONNECTED,
      status: this.status,
      activeDevice: this.activeDevice,
      hasUserConsent: this.hasUserConsent,
      signalQuality: this.latestFeatures ? this.latestFeatures.signalQuality : 0.0,
      disclaimer: this.disclaimer,
      note: this.status === DEVICE_CONNECTION_STATUS.DISCONNECTED
        ? 'No physiological device is connected. No synthetic brain waves or fake biometric states are generated.'
        : `Connected to ${this.activeDevice?.name || 'Bio-sensor'}`
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

  /**
   * Connect a real hardware driver (e.g. Web Bluetooth OpenBCI / Muse GATT interface)
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

  /**
   * Disconnect hardware and clear live buffers
   */
  disconnectHardware() {
    this.status = DEVICE_CONNECTION_STATUS.DISCONNECTED;
    this.activeDevice = null;
    this.rawSignalBuffer = [];
    this.latestFeatures = null;
    this.latestStateEstimate = null;
  }

  /**
   * Ingest validated features from an external hardware pipeline
   * (Separates raw vs extracted features vs inferred state)
   */
  ingestExtractedFeatures({
    signalType = BIO_SIGNAL_TYPES.EEG,
    signalQuality = 1.0, // 0.0 (unusable noise) to 1.0 (clean signal)
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
      metrics,
      source,
      timestamp: obsTime,
      isSimulated: Boolean(isSimulated) // Must be honestly tagged if used in automated testing
    };

    // Tier 3: Inferred State (only if signal quality is above minimum viable threshold)
    if (clampedQuality >= 0.5) {
      this.latestStateEstimate = {
        signalType,
        cognitiveWorkload: metrics.workloadIndex !== undefined ? metrics.workloadIndex : null,
        focusEstimate: metrics.focusIndex !== undefined ? metrics.focusIndex : null,
        confidence: Math.round(clampedQuality * 0.85 * 100) / 100, // Inferred state confidence is bounded
        disclaimer: this.disclaimer,
        timestamp: obsTime,
        isSimulated: Boolean(isSimulated)
      };
    } else {
      this.latestStateEstimate = null; // Unusable signal produces no estimate
    }

    return {
      features: this.latestFeatures,
      stateEstimate: this.latestStateEstimate
    };
  }

  /**
   * Retrieve active state for inclusion in cognitive compiler (if available and consented)
   */
  getActiveStateEstimate() {
    if (!this.hasUserConsent || this.status === DEVICE_CONNECTION_STATUS.DISCONNECTED) {
      return null;
    }
    return this.latestStateEstimate ? { ...this.latestStateEstimate } : null;
  }

  /**
   * Purge all raw signals, features, and inferences immediately
   */
  purgeAllData() {
    this.rawSignalBuffer = [];
    this.latestFeatures = null;
    this.latestStateEstimate = null;
  }
}

export const neuroContextAdapter = new NeuroContextAdapter();

