/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE LEARNING ENGINE (PHASE 3 PRODUCTION ENGINE)
 * ════════════════════════════════════════════════════════════════════
 * Enables Mini-Adhy to learn how its creator (Adhy) thinks, reasons,
 * solves problems, and works through validated interaction evidence.
 * 
 * CORE GOVERNANCE PRINCIPLES:
 * 1. Evidence-Based Trait Formation:
 *    • Inferences are derived from repeated observations across distinct sessions.
 *    • Casual, single-conversation remarks are never promoted to permanent traits.
 * 2. Strict Evidence Classification:
 *    • 9 distinct evidence categories. Temporary emotional states are strictly
 *      excluded from permanent trait promotion.
 * 3. Anti-Inflation & Session Clustering:
 *    • Repeated observations within the same conversation session receive heavily
 *      discounted weight (1st = 1.0, 2nd = 0.3, 3rd+ = 0.1) to prevent rapid inflation.
 * 4. User Correction Immediate Precedence:
 *    • Direct user corrections immediately override any inference with confidence 1.0.
 * 5. Bounded Inferences & Ceilings:
 *    • Inferences cannot exceed 0.85 (or 0.90 for reinforced approved traits).
 *    • Inferences are NEVER silently promoted to verified explicit facts.
 * 6. Cognitive Experiments (A/B Interaction Testing):
 *    • Controlled evaluation of interaction strategies (e.g. example-first vs theory-first).
 *    • Strategy adoption requires verifiable positive outcome evidence across multiple trials.
 * 7. Safety, Ethics & Transparency:
 *    • Forbids psychiatric / psychological diagnoses.
 *    • Forbids sensitive attribute / credential inference.
 *    • Full audit trail and reversible mutations (rollback support).
 */

import { adhyModel, CLASSIFICATION_TYPES, DOMAIN_TYPES } from '../identity/AdhyModel';

export const EVIDENCE_CLASSIFICATION = Object.freeze({
  EXPLICIT_CORRECTION: 'EXPLICIT_CORRECTION',
  EXPLICIT_PREFERENCE: 'EXPLICIT_PREFERENCE',
  REPEATED_BEHAVIOUR: 'REPEATED_BEHAVIOUR',
  REASONING_PATTERN: 'REASONING_PATTERN',
  DECISION_PATTERN: 'DECISION_PATTERN',
  LEARNING_PATTERN: 'LEARNING_PATTERN',
  TEMPORARY_STATE: 'TEMPORARY_STATE',
  HYPOTHESIS: 'HYPOTHESIS',
  CONTRADICTION: 'CONTRADICTION'
});

export const OBSERVATION_SOURCE = Object.freeze({
  EXPLICIT_USER_CORRECTION: 'EXPLICIT_USER_CORRECTION',
  EXPLICIT_DECLARATION: 'EXPLICIT_DECLARATION',
  REPEATED_REQUEST: 'REPEATED_REQUEST',
  PROBLEM_SOLVING_SEQUENCE: 'PROBLEM_SOLVING_SEQUENCE',
  DECISION_RATIONALE: 'DECISION_RATIONALE',
  EXPLANATION_FEEDBACK: 'EXPLANATION_FEEDBACK',
  PROJECT_OUTCOME: 'PROJECT_OUTCOME',
  REPEATED_PREFERENCE: 'REPEATED_PREFERENCE',
  WORKING_METHOD_CHANGE: 'WORKING_METHOD_CHANGE',
  CONFIRMED_BEHAVIOURAL_PATTERN: 'CONFIRMED_BEHAVIOURAL_PATTERN',
  COGNITIVE_EXPERIMENT_OUTCOME: 'COGNITIVE_EXPERIMENT_OUTCOME'
});

export const EXPERIMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  CONCLUDED_PROMOTED: 'CONCLUDED_PROMOTED',
  CONCLUDED_INCONCLUSIVE: 'CONCLUDED_INCONCLUSIVE',
  CANCELLED: 'CANCELLED'
});

export class CognitiveLearningEngine {
  constructor(model = null, storageAdapter = null) {
    this.model = model || adhyModel;
    this.storageKey = 'mini_adhy_cognitive_learning_v3';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();

    this.observationsBuffer = [];
    this.evidenceStore = new Map(); // dimensionKey -> Array of evidence items
    this.sessionObservationCounts = new Map(); // `${sessionId}::${dimensionKey}` -> count
    this.experiments = new Map(); // experimentId -> experiment configuration & telemetry

    this.maxObservations = 500;
    this.initDefaultExperiments();
    this.loadState();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); }
    };
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.observationsBuffer)) {
          this.observationsBuffer = parsed.observationsBuffer;
        }
        if (parsed.evidenceStore && typeof parsed.evidenceStore === 'object') {
          this.evidenceStore = new Map(Object.entries(parsed.evidenceStore));
        }
        if (parsed.experiments && typeof parsed.experiments === 'object') {
          this.experiments = new Map(Object.entries(parsed.experiments));
        }
      }
    } catch {}
  }

  saveState() {
    try {
      const payload = {
        version: '3.0.0',
        savedAt: new Date().toISOString(),
        observationsBuffer: this.observationsBuffer.slice(0, 100),
        evidenceStore: Object.fromEntries(this.evidenceStore.entries()),
        experiments: Object.fromEntries(this.experiments.entries())
      };
      this.storageAdapter.set(this.storageKey, JSON.stringify(payload));
    } catch {}
  }

  // ────────────────────────────────────────────────────────────
  // 1. Safety & Governance Gate
  // ────────────────────────────────────────────────────────────

  /**
   * Enforces ethical and security invariants on candidate observations
   */
  validateObservationSafety(observation = {}) {
    const textToCheck = `${observation.candidateDimension || ''} ${observation.evidence || ''} ${JSON.stringify(observation.observedValue || '')}`.toLowerCase();

    // Invariant 1: Prohibit psychiatric or clinical diagnoses
    const psychologicalTerms = [
      'bipolar', 'adhd', 'depression', 'narcissis', 'psychopath', 'schizo',
      'personality disorder', 'autism', 'ptsd', 'neurotic', 'psychosis', 'clinical'
    ];
    if (psychologicalTerms.some(term => textToCheck.includes(term))) {
      return {
        safe: false,
        reason: 'PSYCHOLOGICAL_DIAGNOSES_PROHIBITED',
        details: 'System is strictly restricted from making psychological or clinical diagnoses.'
      };
    }

    // Invariant 2: Prohibit sensitive credential or financial attribute inference
    const sensitiveTerms = [
      'bearer ', 'sk-', 'api_key', 'password', 'private_key', 'credit card', 'ssn', 'passcode'
    ];
    if (sensitiveTerms.some(term => textToCheck.includes(term))) {
      return {
        safe: false,
        reason: 'SENSITIVE_DATA_PROHIBITED',
        details: 'System cannot infer or persist credentials, tokens, or financial records.'
      };
    }

    return { safe: true };
  }

  // ────────────────────────────────────────────────────────────
  // 2. Observation Extraction Heuristics
  // ────────────────────────────────────────────────────────────

  /**
   * Analyzes an interaction turn to identify candidate cognitive evidence
   */
  extractObservationsFromInteraction({
    userInput = '',
    assistantResponse = '',
    sessionId = null,
    taskCategory = null,
    emotionalState = null,
    metadata = {}
  } = {}) {
    const text = String(userInput).trim();
    const textLower = text.toLowerCase();
    const extracted = [];
    const now = new Date().toISOString();

    // 1. Explicit User Correction Detection
    const correctionRegex = /(?:that's|that is|you're|you are)\s+(?:wrong|incorrect)|(?:don't|do not)\s+.*?\s+(?:do|use)\s+|actually(?:,|\s+I)\s+(?:prefer|want|need)|stop\s+(?:giving|explaining|doing)|use\s+.*?\s+instead|I said\s+/i;
    if (correctionRegex.test(text)) {
      let dimensionKey = 'generalPreference';
      let observedValue = text;

      if (textLower.includes('theory') || textLower.includes('code') || textLower.includes('abstract') || textLower.includes('snippet')) {
        dimensionKey = 'explanationDepth';
        observedValue = textLower.includes('code') ? 'step_by_step_with_code' : (textLower.includes('concise') ? 'concise' : 'deep_theory');
      } else if (textLower.includes('critic') || textLower.includes('honest') || textLower.includes('blunt')) {
        dimensionKey = 'directCriticism';
        observedValue = 'strongly_preferred';
      }

      extracted.push({
        candidateDimension: dimensionKey,
        observedValue,
        classification: EVIDENCE_CLASSIFICATION.EXPLICIT_CORRECTION,
        source: OBSERVATION_SOURCE.EXPLICIT_USER_CORRECTION,
        confidence: 1.0,
        evidence: `Direct user correction in prompt: "${text.slice(0, 200)}"`,
        context: { taskCategory, sessionId },
        timestamp: now
      });
    }

    // 2. Feedback on Explanation / Teaching Style
    const negativeFeedbackRegex = /(?:too\s+(?:abstract|theoretical|long|complex|confusing)|where is the code|not enough detail|give me a working example)/i;
    const positiveFeedbackRegex = /(?:perfect|great|helpful|clear)\s+explanation|(?:the code example|the derivation|the analogy)\s+(?:helped|worked|made sense)/i;

    if (negativeFeedbackRegex.test(textLower)) {
      extracted.push({
        candidateDimension: 'explanationDepth',
        observedValue: textLower.includes('too abstract') || textLower.includes('where is the code') ? 'step_by_step_with_code' : 'concise',
        classification: EVIDENCE_CLASSIFICATION.LEARNING_PATTERN,
        source: OBSERVATION_SOURCE.EXPLANATION_FEEDBACK,
        confidence: 0.75,
        evidence: `Negative explanation feedback: "${text.slice(0, 150)}"`,
        context: { taskCategory, sessionId, feedbackType: 'NEGATIVE' },
        timestamp: now
      });
    } else if (positiveFeedbackRegex.test(textLower)) {
      extracted.push({
        candidateDimension: 'explanationDepth',
        observedValue: textLower.includes('derivation') ? 'step_by_step_with_code' : 'step_by_step_with_code',
        classification: EVIDENCE_CLASSIFICATION.LEARNING_PATTERN,
        source: OBSERVATION_SOURCE.EXPLANATION_FEEDBACK,
        confidence: 0.80,
        evidence: `Positive explanation feedback: "${text.slice(0, 150)}"`,
        context: { taskCategory, sessionId, feedbackType: 'POSITIVE' },
        timestamp: now
      });
    }

    // 3. Stated Decisions and Reasoning
    const decisionRegex = /(?:decided to|we chose|chosen|switching to|switched from)\s+(.*?)\s+(?:because|due to|since|as)\s+(.*)/i;
    const decisionMatch = text.match(decisionRegex);
    if (decisionMatch) {
      extracted.push({
        candidateDimension: 'decisionRationale',
        observedValue: {
          choice: decisionMatch[1].trim().slice(0, 60),
          rationale: decisionMatch[2].trim().slice(0, 120)
        },
        classification: EVIDENCE_CLASSIFICATION.DECISION_PATTERN,
        source: OBSERVATION_SOURCE.DECISION_RATIONALE,
        confidence: 0.85,
        evidence: `Stated decision with rationale: "${decisionMatch[0].slice(0, 200)}"`,
        context: { taskCategory, sessionId },
        timestamp: now
      });
    }

    // 4. Problem-Solving Sequences
    const problemSolvingRegex = /(?:first|always)\s+(?:check|inspect|verify|probe)\s+(?:the\s+)?(?:hardware|power|rails|clocks|signals|registers)/i;
    if (problemSolvingRegex.test(textLower)) {
      extracted.push({
        candidateDimension: 'practicalVsTheoretical',
        observedValue: 0.95,
        classification: EVIDENCE_CLASSIFICATION.REASONING_PATTERN,
        source: OBSERVATION_SOURCE.PROBLEM_SOLVING_SEQUENCE,
        confidence: 0.82,
        evidence: `Problem-solving sequence verified: "${text.slice(0, 150)}"`,
        context: { taskCategory, sessionId },
        timestamp: now
      });
    }

    // 5. Temporary State Flagging (Critical Governance Boundary)
    const temporaryStateRegex = /(?:in a rush|just testing|quick test|tired today|frustrated with|bad mood|ignore this)/i;
    const isTemporaryEmotion = emotionalState === 'frustrated' || emotionalState === 'overwhelmed' || emotionalState === 'urgent';

    if (temporaryStateRegex.test(textLower) || (isTemporaryEmotion && text.length < 30)) {
      extracted.push({
        candidateDimension: 'temporaryMood',
        observedValue: text.slice(0, 80),
        classification: EVIDENCE_CLASSIFICATION.TEMPORARY_STATE,
        source: OBSERVATION_SOURCE.CONFIRMED_BEHAVIOURAL_PATTERN,
        confidence: 0.6,
        evidence: `Transient interaction state observed: "${text.slice(0, 100)}"`,
        context: { emotionalState, sessionId },
        timestamp: now,
        excludeFromPromotion: true // INVARIANT: Temporary states are NEVER promoted to permanent traits
      });
    }

    return extracted;
  }

  /**
   * Main runtime entrypoint called by RequestLifecycle to process an interaction
   */
  processInteraction(interactionPayload = {}) {
    const extracted = this.extractObservationsFromInteraction(interactionPayload);
    const results = [];

    for (const obs of extracted) {
      const res = this.recordObservation({
        ...obs,
        sessionRef: interactionPayload.sessionId
      });
      results.push(res);
    }

    return results;
  }

  // ────────────────────────────────────────────────────────────
  // 3. Observation Recording & Evidence Aggregation
  // ────────────────────────────────────────────────────────────

  /**
   * Records a candidate observation, enforces anti-inflation weighting,
   * checks existing model bounds, and creates candidates or conflicts.
   */
  recordObservation({
    candidateDimension = '',
    observedValue = null,
    source = 'Interaction',
    evidence = '',
    confidence = 0.6,
    classification = EVIDENCE_CLASSIFICATION.HYPOTHESIS,
    sessionRef = null,
    context = {},
    timestamp = null,
    excludeFromPromotion = false
  } = {}) {
    if (!candidateDimension || observedValue === null || observedValue === undefined) {
      return { status: 'REJECTED', reason: 'Missing candidate dimension or observed value' };
    }

    const obsTime = timestamp || new Date().toISOString();
    const cleanEvidence = String(evidence).trim().slice(0, 500);

    const safetyCheck = this.validateObservationSafety({ candidateDimension, observedValue, evidence: cleanEvidence });
    if (!safetyCheck.safe) {
      return { status: 'REJECTED_SAFETY_VIOLATION', reason: safetyCheck.reason, details: safetyCheck.details };
    }

    // Invariant: Temporary states are catalogued for trace/context, but never promoted to traits
    if (classification === EVIDENCE_CLASSIFICATION.TEMPORARY_STATE || excludeFromPromotion) {
      const tempRecord = {
        id: `obs_temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        candidateDimension,
        observedValue,
        classification: EVIDENCE_CLASSIFICATION.TEMPORARY_STATE,
        confidence: Math.min(0.6, Number(confidence) || 0.5),
        evidence: cleanEvidence,
        timestamp: obsTime,
        sessionRef,
        excludeFromPromotion: true
      };
      this.observationsBuffer.unshift(tempRecord);
      this._trimObservationsBuffer();
      return {
        status: 'TEMPORARY_STATE_EXCLUDED',
        message: 'Temporary interaction state recorded in buffer; excluded from permanent trait promotion.',
        observation: tempRecord
      };
    }

    // Rule 1: Explicit User Correction takes immediate precedence
    const isExplicitCorrection = classification === EVIDENCE_CLASSIFICATION.EXPLICIT_CORRECTION ||
      classification === CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE ||
      source.toLowerCase().includes('correction') ||
      source.toLowerCase().includes('explicit');

    if (isExplicitCorrection) {
      const updated = this.model.recordCorrection(candidateDimension, observedValue, cleanEvidence);
      const correctionRecord = {
        id: `obs_corr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        candidateDimension,
        observedValue,
        classification: EVIDENCE_CLASSIFICATION.EXPLICIT_CORRECTION,
        confidence: 1.0,
        evidence: cleanEvidence,
        source: OBSERVATION_SOURCE.EXPLICIT_USER_CORRECTION,
        sessionRef,
        timestamp: obsTime
      };
      this.observationsBuffer.unshift(correctionRecord);
      this._trimObservationsBuffer();
      this.saveState();

      return {
        status: 'CORRECTION_APPLIED',
        dimension: updated,
        confidence: 1.0,
        epoch: this.model.versionEpoch
      };
    }

    // Anti-Inflation Session Clustering:
    // Repeated observations in the same session get discounted weight
    const sessionKey = `${sessionRef || 'anonymous_session'}::${candidateDimension}`;
    const sessionCount = (this.sessionObservationCounts.get(sessionKey) || 0) + 1;
    this.sessionObservationCounts.set(sessionKey, sessionCount);

    let sessionWeight = 1.0;
    if (sessionCount === 2) {
      sessionWeight = 0.3; // 2nd observation in same session
    } else if (sessionCount > 2) {
      sessionWeight = 0.1; // 3rd+ observation in same session
    }

    const observationRecord = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      candidateDimension,
      observedValue,
      classification,
      source,
      evidence: cleanEvidence,
      confidence: Math.min(0.85, Math.max(0.1, Number(confidence) || 0.6)),
      sessionWeight,
      sessionRef: sessionRef || 'session_default',
      context,
      timestamp: obsTime
    };

    this.observationsBuffer.unshift(observationRecord);
    this._trimObservationsBuffer();

    // Aggregate Evidence for this dimension
    const evidenceList = this.evidenceStore.get(candidateDimension) || [];
    evidenceList.unshift(observationRecord);
    if (evidenceList.length > 50) evidenceList.pop();
    this.evidenceStore.set(candidateDimension, evidenceList);

    // Compute Aggregated Evidence Metrics
    const distinctSessions = new Set(evidenceList.map(e => e.sessionRef)).size;
    const totalWeightedEvidence = evidenceList.reduce((sum, e) => sum + (e.sessionWeight || 1.0), 0);

    // Rule 2: Compare against existing dimension in AdhyModel
    const existing = this.model.getDimension(candidateDimension);

    if (existing) {
      // Contradiction Check: observation opposes an existing approved fact/preference
      if (existing.userApproved && existing.value !== observedValue) {
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

        this.saveState();
        return {
          status: 'CONFLICT_QUEUED_FOR_REVIEW',
          conflict: conflictResult,
          currentApprovedValue: existing.value,
          candidateValue: observedValue
        };
      }

      // Reinforcing Evidence for an existing trait (bounded confidence increase)
      if (existing.value === observedValue) {
        const ceiling = existing.classification === CLASSIFICATION_TYPES.FACT || existing.classification === CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE ? 1.0 : 0.90;
        // Reinforce confidence using discounted session weight
        const boost = Math.round(0.02 * sessionWeight * 100) / 100;
        const newConf = Math.min(ceiling, (existing.confidence || 0.7) + boost);
        existing.confidence = Math.round(newConf * 100) / 100;
        existing.lastUpdated = obsTime;
        this.model.saveState();
        this.saveState();

        return {
          status: 'EVIDENCE_REINFORCED',
          dimensionKey: candidateDimension,
          confidence: existing.confidence,
          sessionWeightApplied: sessionWeight
        };
      }
    }

    // Rule 3: Novel Dimension or Unapproved Observation
    // Promotion threshold: Requires evidence across at least 2 distinct sessions, or explicit declaration
    const isExplicitDeclaration = source === OBSERVATION_SOURCE.EXPLICIT_DECLARATION;
    const meetsCandidateThreshold = isExplicitDeclaration || (distinctSessions >= 2 && totalWeightedEvidence >= 1.8);

    const queueResult = this.model.proposeCandidateUpdate({
      dimensionKey: candidateDimension,
      domain: DOMAIN_TYPES.COGNITION,
      name: candidateDimension,
      candidateValue: observedValue,
      confidence: Math.min(0.85, observationRecord.confidence),
      evidence: cleanEvidence,
      source,
      meetsThreshold: meetsCandidateThreshold,
      classification: CLASSIFICATION_TYPES.INFERENCE
    });

    this.saveState();

    return {
      status: 'CANDIDATE_QUEUED_FOR_APPROVAL',
      candidate: queueResult.candidate,
      distinctSessions,
      totalWeightedEvidence
    };
  }

  _trimObservationsBuffer() {
    if (this.observationsBuffer.length > this.maxObservations) {
      this.observationsBuffer.pop();
    }
  }

  // ────────────────────────────────────────────────────────────
  // 4. Cognitive Experiments Engine (Controlled A/B Strategy Testing)
  // ────────────────────────────────────────────────────────────

  initDefaultExperiments() {
    if (this.experiments.has('exp_teaching_strategy')) return;

    this.experiments.set('exp_teaching_strategy', {
      id: 'exp_teaching_strategy',
      name: 'Technical Explanation & Teaching Strategy Evaluation',
      dimensionKey: 'explanationDepth',
      status: EXPERIMENT_STATUS.ACTIVE,
      variants: [
        {
          id: 'EXAMPLE_FIRST',
          name: 'Example-First Teaching',
          directive: 'Present working minimal code / schematics first, followed by structural rationale.',
          trials: 0,
          positiveOutcomes: 0,
          negativeOutcomes: 0
        },
        {
          id: 'THEORY_FIRST',
          name: 'Theory-First Teaching',
          directive: 'Establish broad conceptual abstractions and architectural foundations before details.',
          trials: 0,
          positiveOutcomes: 0,
          negativeOutcomes: 0
        },
        {
          id: 'STEP_BY_STEP_DERIVATION',
          name: 'Step-by-Step Derivation',
          directive: 'Walk through mathematical or logic derivation with intermediate proofs.',
          trials: 0,
          positiveOutcomes: 0,
          negativeOutcomes: 0
        }
      ],
      minTrialsRequired: 4,
      createdAt: new Date().toISOString()
    });
  }

  registerExperiment({
    id,
    name,
    dimensionKey,
    variants = [],
    minTrialsRequired = 4
  } = {}) {
    if (!id || !name || !dimensionKey || variants.length < 2) {
      throw new Error('Experiment requires id, name, dimensionKey, and at least 2 variants.');
    }

    const exp = {
      id,
      name,
      dimensionKey,
      status: EXPERIMENT_STATUS.ACTIVE,
      variants: variants.map(v => ({
        id: v.id,
        name: v.name || v.id,
        directive: v.directive || '',
        trials: 0,
        positiveOutcomes: 0,
        negativeOutcomes: 0
      })),
      minTrialsRequired,
      createdAt: new Date().toISOString()
    };

    this.experiments.set(id, exp);
    this.saveState();
    return exp;
  }

  getAssignedExperimentVariant(experimentId = 'exp_teaching_strategy', context = {}) {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.status !== EXPERIMENT_STATUS.ACTIVE) return null;

    // Deterministic round-robin / least-sampled variant assignment
    const sorted = [...exp.variants].sort((a, b) => a.trials - b.trials);
    return sorted[0];
  }

  /**
   * Records user outcome/feedback for a specific experiment variant
   */
  recordExperimentFeedback(experimentId, variantId, feedbackSignal = 'POSITIVE', metadata = {}) {
    const exp = this.experiments.get(experimentId);
    if (!exp) return false;

    const variant = exp.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.trials += 1;
    if (feedbackSignal === 'POSITIVE') {
      variant.positiveOutcomes += 1;
    } else if (feedbackSignal === 'NEGATIVE') {
      variant.negativeOutcomes += 1;
    }

    this.saveState();
    return this.evaluateExperimentPromotion(experimentId);
  }

  /**
   * Evaluates if an experiment variant has demonstrated decisive superiority
   */
  evaluateExperimentPromotion(experimentId) {
    const exp = this.experiments.get(experimentId);
    if (!exp) return null;

    if (exp.status === EXPERIMENT_STATUS.CONCLUDED_PROMOTED) {
      const winner = exp.winner || exp.variants.find(v => v.id === exp.winnerVariant);
      return {
        concluded: true,
        winner,
        candidate: exp.promotedCandidate
      };
    }

    if (exp.status !== EXPERIMENT_STATUS.ACTIVE) return null;

    const totalTrials = exp.variants.reduce((sum, v) => sum + v.trials, 0);
    const sortedByWinRate = [...exp.variants].map(v => ({
      ...v,
      winRate: v.trials > 0 ? v.positiveOutcomes / v.trials : 0
    })).sort((a, b) => b.winRate - a.winRate);

    const leader = sortedByWinRate[0];

    // Promotion Gate: Leader must have >= minTrialsRequired, at least 75% win rate, and total trials >= minTrialsRequired * 2
    if (leader.trials >= exp.minTrialsRequired && leader.winRate >= 0.75 && totalTrials >= exp.minTrialsRequired * 2) {
      exp.status = EXPERIMENT_STATUS.CONCLUDED_PROMOTED;
      exp.winnerVariant = leader.id;
      exp.winner = leader;
      exp.concludedAt = new Date().toISOString();

      // Propose candidate update to canonical AdhyModel
      const candidateResult = this.model.proposeCandidateUpdate({
        dimensionKey: exp.dimensionKey,
        domain: DOMAIN_TYPES.COGNITION,
        name: `Experiment Winner: ${leader.name}`,
        candidateValue: leader.id.toLowerCase(),
        confidence: 0.85,
        evidence: `Decisive winner in cognitive experiment '${exp.name}' with ${Math.round(leader.winRate * 100)}% win rate across ${leader.trials} trials.`,
        source: OBSERVATION_SOURCE.COGNITIVE_EXPERIMENT_OUTCOME,
        classification: CLASSIFICATION_TYPES.INFERENCE
      });

      exp.promotedCandidate = candidateResult.candidate;

      this.saveState();
      return {
        concluded: true,
        winner: leader,
        candidate: candidateResult.candidate
      };
    }

    return {
      concluded: false,
      totalTrials,
      variants: sortedByWinRate
    };
  }

  getExperimentResults(experimentId = 'exp_teaching_strategy') {
    const exp = this.experiments.get(experimentId);
    if (!exp) return null;

    return {
      id: exp.id,
      name: exp.name,
      dimensionKey: exp.dimensionKey,
      status: exp.status,
      variants: exp.variants.map(v => ({
        id: v.id,
        name: v.name,
        trials: v.trials,
        positiveOutcomes: v.positiveOutcomes,
        negativeOutcomes: v.negativeOutcomes,
        winRate: v.trials > 0 ? Math.round((v.positiveOutcomes / v.trials) * 100) : 0
      }))
    };
  }

  // ────────────────────────────────────────────────────────────
  // 5. Candidate Governance, Conflicts & Rollback
  // ────────────────────────────────────────────────────────────

  getPendingCandidates() {
    return this.model.getPendingCandidates();
  }

  approveCandidate(candidateId) {
    return this.model.approveCandidate(candidateId);
  }

  rejectCandidate(candidateId, reason = '') {
    return this.model.rejectCandidate(candidateId, reason);
  }

  getReviewableConflicts() {
    return this.model.getReviewableConflicts();
  }

  resolveConflict(conflictId, resolution = 'KEEP_EXISTING', customValue = null) {
    const conflicts = this.model.domains.evolution.reviewableConflicts;
    const idx = conflicts.findIndex(c => c.id === conflictId);
    if (idx === -1) return false;

    const conflict = conflicts[idx];
    const now = new Date().toISOString();

    if (resolution === 'ACCEPT_CANDIDATE') {
      this.model.recordCorrection(conflict.dimensionKey, conflict.candidateValue, 'Resolved conflict by accepting candidate');
    } else if (resolution === 'CUSTOM' && customValue !== null) {
      this.model.recordCorrection(conflict.dimensionKey, customValue, 'Resolved conflict with custom value');
    }

    conflict.resolved = true;
    conflict.resolvedAt = now;
    conflict.resolutionStrategy = resolution;

    conflicts.splice(idx, 1);
    this.model.domains.evolution.auditTrail.unshift({
      id: `audit_${Date.now()}`,
      action: 'CONFLICT_RESOLVED',
      dimensionKey: conflict.dimensionKey,
      resolution,
      timestamp: now
    });

    this.model.saveState();
    this.saveState();
    return true;
  }

  rollbackLastMutation(auditId = null) {
    if (auditId) {
      return this.model.rollbackUpdate(auditId);
    }
    const audit = this.model.domains.evolution.auditTrail.find(a => a.previousValue !== undefined);
    if (!audit) return false;
    return this.model.rollbackUpdate(audit.id);
  }

  getObservationsHistory() {
    return [...this.observationsBuffer];
  }

  getAuditTrail() {
    return this.model.getAuditTrail();
  }

  purgeAllLearningData() {
    this.observationsBuffer = [];
    this.evidenceStore.clear();
    this.sessionObservationCounts.clear();
    this.experiments.clear();
    this.initDefaultExperiments();
    this.saveState();
  }
}

export const cognitiveLearningEngine = new CognitiveLearningEngine();
