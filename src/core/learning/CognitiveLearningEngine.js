/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE LEARNING ENGINE — CONTROLLED EVIDENCE-BASED LEARNING
 * ════════════════════════════════════════════════════════════════════
 * Governs the cognitive evolution of the AdhyModel.
 * 
 * CORE PRINCIPLES:
 * 1. Controlled Learning: No uncontrolled self-training or wild drift.
 * 2. Structured Observations: Observations must carry source, evidence, confidence, context, and session reference.
 * 3. User Correction Absolute Precedence: Direct user corrections immediately override inferences with confidence 1.0.
 * 4. Bounded Inferences: Inferences are capped at 0.90 confidence and NEVER auto-promoted to explicit facts.
 * 5. Reviewable Conflicts: Contradictory observations create inspectable conflicts; they NEVER silently overwrite history.
 * 6. Temporal Decay / Non-Permanence: A single casual interaction is never treated as a permanent trait.
 */

import { adhyModel, CLASSIFICATION_TYPES, DOMAIN_TYPES } from '../identity/AdhyModel';

export class CognitiveLearningEngine {
  constructor(model = null) {
    this.model = model || adhyModel;
    this.observationsBuffer = [];
    this.maxObservations = 200;
  }

  /**
   * Accepts a structured interaction observation and processes it according to governance rules
   */
  recordObservation({
    source = 'Interaction',
    evidence = '',
    timestamp = null,
    context = {},
    candidateDimension = '',
    observedValue = null,
    confidence = 0.6,
    classification = CLASSIFICATION_TYPES.INFERENCE,
    sessionRef = null
  } = {}) {
    if (!candidateDimension || observedValue === null || observedValue === undefined) {
      return { status: 'REJECTED', reason: 'Missing candidate dimension or observed value' };
    }

    const obsTime = timestamp || new Date().toISOString();
    const cleanEvidence = String(evidence).trim().slice(0, 500);

    const observationRecord = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      source,
      evidence: cleanEvidence,
      timestamp: obsTime,
      context,
      candidateDimension,
      observedValue,
      confidence: Math.min(1.0, Math.max(0.05, Number(confidence))),
      classification,
      sessionRef
    };

    this.observationsBuffer.unshift(observationRecord);
    if (this.observationsBuffer.length > this.maxObservations) {
      this.observationsBuffer.pop();
    }

    // Rule 1: Explicit user correction takes absolute immediate precedence
    const isExplicitCorrection = classification === CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE ||
      source.toLowerCase().includes('correction') ||
      source.toLowerCase().includes('explicit');

    if (isExplicitCorrection) {
      const updated = this.model.recordCorrection(candidateDimension, observedValue, cleanEvidence);
      return {
        status: 'CORRECTION_APPLIED',
        dimension: updated,
        confidence: 1.0
      };
    }

    // Rule 2: Evaluate against existing dimension in AdhyModel
    const existing = this.model.getDimension(candidateDimension);

    if (existing) {
      // Check for contradiction with existing approved fact/preference
      if (existing.userApproved && existing.value !== observedValue) {
        // Create reviewable conflict — DO NOT overwrite history
        const conflictResult = this.model.proposeCandidateUpdate({
          dimensionKey: candidateDimension,
          domain: existing.domain || DOMAIN_TYPES.COGNITION,
          name: existing.name || candidateDimension,
          candidateValue: observedValue,
          confidence: Math.min(0.85, observationRecord.confidence),
          evidence: cleanEvidence,
          source,
          classification: CLASSIFICATION_TYPES.INFERENCE
        });

        return {
          status: 'CONFLICT_QUEUED_FOR_REVIEW',
          conflict: conflictResult,
          currentApprovedValue: existing.value,
          candidateValue: observedValue
        };
      }

      // Reinforcing evidence for an existing trait (bounded confidence increase)
      if (existing.value === observedValue) {
        // Gently reinforce confidence up to safe ceiling (0.90 for inferences)
        const ceiling = existing.classification === CLASSIFICATION_TYPES.FACT || existing.classification === CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE ? 1.0 : 0.90;
        const newConf = Math.min(ceiling, (existing.confidence || 0.7) + 0.02);
        existing.confidence = Math.round(newConf * 100) / 100;
        existing.lastUpdated = obsTime;
        this.model.saveState();

        return {
          status: 'EVIDENCE_REINFORCED',
          dimensionKey: candidateDimension,
          confidence: existing.confidence
        };
      }
    }

    // Rule 3: Novel dimension candidate or unapproved observation
    const queueResult = this.model.proposeCandidateUpdate({
      dimensionKey: candidateDimension,
      domain: DOMAIN_TYPES.COGNITION,
      name: candidateDimension,
      candidateValue: observedValue,
      confidence: Math.min(0.85, observationRecord.confidence),
      evidence: cleanEvidence,
      source,
      classification: CLASSIFICATION_TYPES.INFERENCE
    });

    return {
      status: 'CANDIDATE_QUEUED_FOR_APPROVAL',
      candidate: queueResult.candidate
    };
  }

  // ── Conflict Resolution & Candidate Approval ─────────────────────────

  getReviewableConflicts() {
    return this.model.getReviewableConflicts();
  }

  getPendingCandidates() {
    return this.model.getPendingCandidates();
  }

  approveCandidate(candidateId) {
    return this.model.approveCandidate(candidateId);
  }

  rejectCandidate(candidateId, reason = '') {
    return this.model.rejectCandidate(candidateId, reason);
  }

  resolveConflict(conflictId, resolution = 'KEEP_EXISTING', customValue = null) {
    const conflicts = this.model.domains.evolution.reviewableConflicts;
    const idx = conflicts.findIndex(c => c.id === conflictId);
    if (idx === -1) return false;

    const conflict = conflicts[idx];
    const now = new Date().toISOString();

    if (resolution === 'ACCEPT_CANDIDATE') {
      this.model.recordCorrection(conflict.dimensionKey, conflict.candidateValue, `Resolved conflict by accepting candidate`);
    } else if (resolution === 'CUSTOM' && customValue !== null) {
      this.model.recordCorrection(conflict.dimensionKey, customValue, `Resolved conflict with custom value`);
    }

    conflict.resolved = true;
    conflict.resolvedAt = now;
    conflict.resolutionStrategy = resolution;

    // Move to resolved or splice
    conflicts.splice(idx, 1);
    this.model.domains.evolution.auditTrail.unshift({
      id: `audit_${Date.now()}`,
      action: 'CONFLICT_RESOLVED',
      dimensionKey: conflict.dimensionKey,
      resolution,
      timestamp: now
    });

    this.model.saveState();
    return true;
  }

  getObservationsHistory() {
    return [...this.observationsBuffer];
  }

  getAuditTrail() {
    return this.model.getAuditTrail();
  }
}

export const cognitiveLearningEngine = new CognitiveLearningEngine();

