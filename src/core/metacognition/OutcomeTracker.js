/**
 * ════════════════════════════════════════════════════════════════════
 *  OUTCOME TRACKER — OBJECTIVE & SUBJECTIVE EXECUTION RECORDS (PHASE 8)
 * ════════════════════════════════════════════════════════════════════
 * Records full task execution outcomes, maintaining strict separation
 * between objectively verifiable data and subjective evaluations.
 * 
 * STRICT INVARIANT:
 * Zero decorative telemetry. When zero tasks are executed, metrics
 * return null or 'N/A' rather than fabricated 100% success rates.
 */

import { OUTCOME_STATUS } from './MetacognitionTypes.js';

export class OutcomeTracker {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_metacognitive_outcomes_v1';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.outcomes = [];
    this.maxOutcomes = 200;
    this.loadOutcomes();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); },
      remove: (k) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.removeItem(k); }
    };
  }

  loadOutcomes() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.outcomes = parsed;
        }
      }
    } catch {
      this.outcomes = [];
    }
  }

  saveOutcomes() {
    try {
      this.storageAdapter.set(this.storageKey, JSON.stringify(this.outcomes.slice(0, this.maxOutcomes)));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  /**
   * Records a task outcome with strict separation of objective facts vs subjective ratings
   */
  recordOutcome({
    taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    originalObjective = '',
    executionPlan = [],
    actualActions = [],
    outputs = [],
    verificationResults = null,
    failures = [],
    userFeedback = null,
    finalOutcome = OUTCOME_STATUS.SUCCESS,
    subjectiveEvaluation = null
  }) {
    // Objective Facts
    const verifiableRecord = {
      taskId,
      timestamp: new Date().toISOString(),
      originalObjective,
      executionPlan: Array.isArray(executionPlan) ? [...executionPlan] : [],
      actualActions: Array.isArray(actualActions) ? [...actualActions] : [],
      outputs: Array.isArray(outputs) ? [...outputs] : [outputs],
      verificationResults: verificationResults ? { ...verificationResults } : null,
      failures: Array.isArray(failures) ? [...failures] : [],
      finalOutcome: Object.values(OUTCOME_STATUS).includes(finalOutcome) ? finalOutcome : OUTCOME_STATUS.FAILURE
    };

    // Subjective Evaluation (Heuristic ratings, satisfaction, impressions)
    const subjectiveRecord = subjectiveEvaluation ? {
      perceivedQuality: subjectiveEvaluation.perceivedQuality ?? null,
      subjectiveScore: subjectiveEvaluation.subjectiveScore ?? null,
      notes: subjectiveEvaluation.notes || '',
      confidence: subjectiveEvaluation.confidence ?? 0.8
    } : null;

    // Optional User Feedback (explicit rating, correction)
    const feedbackRecord = userFeedback ? {
      rating: userFeedback.rating ?? null,
      isCorrection: Boolean(userFeedback.isCorrection),
      comment: userFeedback.comment || ''
    } : null;

    const completeOutcome = {
      ...verifiableRecord,
      subjectiveEvaluation: subjectiveRecord,
      userFeedback: feedbackRecord
    };

    this.outcomes.unshift(completeOutcome);
    if (this.outcomes.length > this.maxOutcomes) {
      this.outcomes.pop();
    }

    this.saveOutcomes();
    return completeOutcome;
  }

  getOutcome(taskId) {
    return this.outcomes.find(o => o.taskId === taskId) || null;
  }

  listOutcomes(filter = {}) {
    return this.outcomes.filter(o => {
      if (filter.status && o.finalOutcome !== filter.status) return false;
      if (filter.hasFailures !== undefined && (o.failures.length > 0) !== filter.hasFailures) return false;
      return true;
    });
  }

  /**
   * Real, non-fabricated metrics
   */
  getMetrics() {
    const total = this.outcomes.length;
    if (total === 0) {
      return {
        totalOutcomes: 0,
        successCount: 0,
        failureCount: 0,
        successRate: null, // Truthful invariant: null when no data
        failureRate: null,
        status: 'NO_DATA'
      };
    }

    const successes = this.outcomes.filter(o => o.finalOutcome === OUTCOME_STATUS.SUCCESS).length;
    const failures = this.outcomes.filter(o => o.finalOutcome === OUTCOME_STATUS.FAILURE).length;
    const partials = this.outcomes.filter(o => o.finalOutcome === OUTCOME_STATUS.PARTIAL_SUCCESS).length;

    return {
      totalOutcomes: total,
      successCount: successes,
      failureCount: failures,
      partialCount: partials,
      successRate: Math.round((successes / total) * 1000) / 1000,
      failureRate: Math.round((failures / total) * 1000) / 1000,
      status: 'VERIFIED_METRICS'
    };
  }

  clearOutcomes() {
    this.outcomes = [];
    this.saveOutcomes();
  }
}

export const outcomeTracker = new OutcomeTracker();
