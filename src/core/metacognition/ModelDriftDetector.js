/**
 * ════════════════════════════════════════════════════════════════════
 *  MODEL DRIFT DETECTOR — ADHY-MODEL CONSISTENCY AUDITOR (PHASE 8)
 * ════════════════════════════════════════════════════════════════════
 * Continuously audits AdhyModel for confidence inflation, stale preferences,
 * internal contradictions, repeated incorrect inferences, and behavioral regressions.
 * 
 * STRICT INVARIANT:
 * Never silently alter or destroy creator identity traits when drift is detected.
 * Always generates actionable review alerts requiring human review.
 */

import { DRIFT_TYPES, EVALUATION_THRESHOLDS } from './MetacognitionTypes.js';
import { adhyModel } from '../identity/AdhyModel.js';

export class ModelDriftDetector {
  constructor(model = null) {
    this.model = model || adhyModel;
    this.driftAlerts = [];
  }

  /**
   * Scans all cognitive dimensions and identity domains in AdhyModel for drift
   * @param {Object} options
   * @returns {Object} Comprehensive drift analysis report
   */
  detectDrift(options = {}) {
    const alerts = [];
    const now = Date.now();
    const daysThreshold = options.daysThreshold || EVALUATION_THRESHOLDS.CONFIDENCE_INFLATION_DAYS_THRESHOLD;

    const cognitionDomain = this.model.getDomain('cognition') || {};
    const identityDomain = this.model.getDomain('identity') || {};
    const behaviourDomain = this.model.getDomain('behaviour') || {};

    const allDimensions = {
      ...cognitionDomain,
      ...identityDomain,
      ...behaviourDomain
    };

    // 1. Check for Confidence Inflation
    for (const [key, record] of Object.entries(allDimensions)) {
      if (!record || typeof record !== 'object') continue;

      const conf = record.confidence ?? 0;
      const lastUpdated = record.lastUpdated ? new Date(record.lastUpdated).getTime() : 0;
      const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);

      // Flag if confidence is high (>0.85) on an inference that has received no validation for >30 days
      if (conf > 0.85 && record.explicitOrInferred === 'inferred' && daysSinceUpdate > daysThreshold) {
        alerts.push({
          type: DRIFT_TYPES.CONFIDENCE_INFLATION,
          dimensionKey: key,
          confidence: conf,
          daysSinceUpdate: Math.round(daysSinceUpdate),
          severity: 'MEDIUM',
          recommendation: `Inferred attribute '${key}' holds high confidence (${conf}) without recent evidence (${Math.round(daysSinceUpdate)} days stale). Recommend creator calibration review.`
        });
      }

      // 2. Check for Stale Preferences
      if (record.classification === 'explicit_preference' && daysSinceUpdate > 90) {
        alerts.push({
          type: DRIFT_TYPES.STALE_PREFERENCE,
          dimensionKey: key,
          daysSinceUpdate: Math.round(daysSinceUpdate),
          severity: 'LOW',
          recommendation: `Preference '${key}' has not been confirmed or active for >90 days. Flag for passive verification.`
        });
      }
    }

    // 3. Check for Conflicting Observations
    const contradictions = this._findContradictions(allDimensions);
    contradictions.forEach(c => alerts.push(c));

    // 4. Check for Repeated Incorrect Inferences
    const incorrectInferences = this._findRepeatedIncorrectInferences();
    incorrectInferences.forEach(i => alerts.push(i));

    // 5. Check for Behavioural Regressions
    if (options.userCorrectionHistory) {
      const recentCorrections = options.userCorrectionHistory.filter(c => (now - new Date(c.timestamp).getTime()) < 1000 * 60 * 60 * 24 * 7);
      if (recentCorrections.length >= 3) {
        alerts.push({
          type: DRIFT_TYPES.BEHAVIOURAL_REGRESSION,
          recentCorrectionCount: recentCorrections.length,
          severity: 'HIGH',
          recommendation: `Surge in explicit user corrections (${recentCorrections.length} in 7 days). Immediate behavioral review recommended.`
        });
      }
    }

    this.driftAlerts = alerts;

    return {
      auditedAt: new Date().toISOString(),
      modelVersion: this.model.getVersion(),
      dimensionsAudited: Object.keys(allDimensions).length,
      driftDetected: alerts.length > 0,
      alertCount: alerts.length,
      alerts,
      actionRequired: alerts.some(a => a.severity === 'HIGH'),
      invariantsPreserved: {
        silentMutationsBlocked: true,
        humanReviewMandated: true
      }
    };
  }

  _findContradictions(dimensions) {
    const alerts = [];
    const values = {};

    for (const [key, record] of Object.entries(dimensions)) {
      if (!record || typeof record !== 'object') continue;
      const valStr = JSON.stringify(record.value || record.level || record.defaultDepth || '').toLowerCase();
      values[key] = valStr;
    }

    // Semantic contradiction checks
    if (values['problemSolvingStyle']?.includes('intuitive') && values['problemSolvingStyle']?.includes('strictly_formal_proof_only')) {
      alerts.push({
        type: DRIFT_TYPES.CONFLICTING_OBSERVATIONS,
        dimensionKey: 'problemSolvingStyle',
        severity: 'HIGH',
        recommendation: 'Direct conflict between intuitive heuristics and strictly formal proof preferences. Present to creator for resolution.'
      });
    }

    return alerts;
  }

  _findRepeatedIncorrectInferences() {
    const alerts = [];
    const auditTrail = this.model.domains?.evolution?.auditTrail || [];

    const correctionCounts = {};
    auditTrail.forEach(a => {
      if (a.action === 'EXPLICIT_CORRECTION') {
        correctionCounts[a.dimensionKey] = (correctionCounts[a.dimensionKey] || 0) + 1;
      }
    });

    for (const [key, count] of Object.entries(correctionCounts)) {
      if (count >= 2) {
        alerts.push({
          type: DRIFT_TYPES.REPEATED_INCORRECT_INFERENCE,
          dimensionKey: key,
          correctionCount: count,
          severity: 'HIGH',
          recommendation: `Dimension '${key}' has been explicitly corrected ${count} times. Lower inference bounds and request explicit user confirmation.`
        });
      }
    }

    return alerts;
  }

  getAlerts() {
    return [...this.driftAlerts];
  }
}

export const modelDriftDetector = new ModelDriftDetector();
