/**
 * ════════════════════════════════════════════════════════════════════
 *  IMPROVEMENT PROPOSAL ENGINE — RIGOROUS REFORM SPECIFICATION (PHASE 8)
 * ════════════════════════════════════════════════════════════════════
 * Allows Mini-Adhy to formulate structured self-improvement proposals
 * grounded in failure reports, performance metrics, and drift alerts.
 * 
 * STRICT INVARIANTS:
 * 1. Seven Mandatory Sections: Every proposal must contain:
 *    • observedProblem
 *    • supportingEvidence
 *    • proposedChange
 *    • expectedBenefit
 *    • risks
 *    • testPlan
 *    • rollbackPlan
 * 2. Security Boundary Gate: Rejects any proposal targeting forbidden
 *    security controls, authorization logic, secrets, or audit logs.
 * 3. Never Silent Deploy: Proposals default to DRAFT and require
 *    isolated experimentation and explicit approval before deployment.
 */

import {
  PROPOSAL_AREAS,
  PROPOSAL_STATUS,
  SAFETY_RESTRICTIONS
} from './MetacognitionTypes.js';

export class ImprovementProposalEngine {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_improvement_proposals_v1';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.proposals = new Map();
    this.loadProposals();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); },
      remove: (k) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.removeItem(k); }
    };
  }

  loadProposals() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => this.proposals.set(p.proposalId, p));
        }
      }
    } catch {
      this.proposals = new Map();
    }
  }

  saveProposals() {
    try {
      const arr = Array.from(this.proposals.values());
      this.storageAdapter.set(this.storageKey, JSON.stringify(arr));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  /**
   * Formulates and validates a structured Self-Improvement Proposal
   */
  createProposal({
    title = '',
    area = PROPOSAL_AREAS.RETRIEVAL_STRATEGY,
    observedProblem = '',
    supportingEvidence = [],
    proposedChange = {},
    expectedBenefit = '',
    risks = [],
    testPlan = {},
    rollbackPlan = {}
  }) {
    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Mandatory Field Validation
    const validation = this.validateProposalPayload({
      title,
      area,
      observedProblem,
      supportingEvidence,
      proposedChange,
      expectedBenefit,
      risks,
      testPlan,
      rollbackPlan
    });

    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid proposal: ${validation.errors.join('; ')}`,
        proposal: null
      };
    }

    // 2. Production Safety Boundary Verification
    const safetyCheck = this._verifySafetyRestrictions(proposedChange);
    if (!safetyCheck.allowed) {
      return {
        success: false,
        error: `Security violation: ${safetyCheck.reason}`,
        proposal: null
      };
    }

    const proposal = {
      proposalId,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      status: PROPOSAL_STATUS.DRAFT,
      title: title.trim(),
      area,
      observedProblem: observedProblem.trim(),
      supportingEvidence: Array.isArray(supportingEvidence) ? supportingEvidence : [supportingEvidence],
      proposedChange: typeof proposedChange === 'object' ? proposedChange : { change: proposedChange },
      expectedBenefit: expectedBenefit.trim(),
      risks: Array.isArray(risks) ? risks : [risks],
      testPlan: {
        dataset: testPlan.dataset || 'synthetic_regression_v1',
        trials: testPlan.trials || 5,
        targetMetric: testPlan.targetMetric || 'passRate',
        minExpectedDelta: testPlan.minExpectedDelta || 0.05,
        ...testPlan
      },
      rollbackPlan: {
        strategy: rollbackPlan.strategy || 'RESTORE_BASELINE_CONFIG',
        triggerThreshold: rollbackPlan.triggerThreshold || 'REGRESSION_DELTA > 0.0',
        revertAction: rollbackPlan.revertAction || 'REVERT_PARAMETER_PATCH',
        ...rollbackPlan
      },
      experimentResults: null,
      approvedBy: null,
      approvedAt: null,
      deployedAt: null
    };

    this.proposals.set(proposalId, proposal);
    this.saveProposals();

    return {
      success: true,
      proposalId,
      proposal
    };
  }

  /**
   * Validates that all 7 mandatory sections exist and are populated
   */
  validateProposalPayload(payload = {}) {
    const errors = [];

    if (!payload.title || typeof payload.title !== 'string' || !payload.title.trim()) {
      errors.push('Proposal title is required');
    }
    if (!Object.values(PROPOSAL_AREAS).includes(payload.area)) {
      errors.push(`Invalid area: '${payload.area}'. Must be one of: ${Object.values(PROPOSAL_AREAS).join(', ')}`);
    }
    if (!payload.observedProblem || typeof payload.observedProblem !== 'string' || payload.observedProblem.trim().length < 10) {
      errors.push('observedProblem is mandatory and must clearly explain the deficiency (>= 10 chars)');
    }
    if (!payload.supportingEvidence || (Array.isArray(payload.supportingEvidence) && payload.supportingEvidence.length === 0)) {
      errors.push('supportingEvidence is mandatory (must reference failure reports, metrics, or traces)');
    }
    if (!payload.proposedChange || (typeof payload.proposedChange === 'object' && Object.keys(payload.proposedChange).length === 0)) {
      errors.push('proposedChange is mandatory (must describe exact parameters, prompts, or routing rules)');
    }
    if (!payload.expectedBenefit || typeof payload.expectedBenefit !== 'string' || payload.expectedBenefit.trim().length < 10) {
      errors.push('expectedBenefit is mandatory and must quantify target improvement (>= 10 chars)');
    }
    if (!payload.risks || (Array.isArray(payload.risks) && payload.risks.length === 0)) {
      errors.push('risks analysis is mandatory (must describe possible regressions or side effects)');
    }
    if (!payload.testPlan || (typeof payload.testPlan === 'object' && Object.keys(payload.testPlan).length === 0)) {
      errors.push('testPlan is mandatory (must specify evaluation dataset and target metrics)');
    }
    if (!payload.rollbackPlan || (typeof payload.rollbackPlan === 'object' && Object.keys(payload.rollbackPlan).length === 0)) {
      errors.push('rollbackPlan is mandatory (must specify exact revert procedure and safety trigger)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Enforces that proposals cannot touch forbidden security files, bypass auth, or modify secrets
   */
  _verifySafetyRestrictions(proposedChange = {}) {
    const stringified = JSON.stringify(proposedChange).toLowerCase();

    for (const forbidden of SAFETY_RESTRICTIONS.FORBIDDEN_FILES) {
      if (stringified.includes(forbidden.toLowerCase())) {
        return {
          allowed: false,
          reason: `Proposal attempts to modify forbidden security module or secret asset: '${forbidden}'`
        };
      }
    }

    for (const action of SAFETY_RESTRICTIONS.FORBIDDEN_ACTIONS) {
      if (stringified.includes(action.toLowerCase())) {
        return {
          allowed: false,
          reason: `Proposal specifies prohibited security override action: '${action}'`
        };
      }
    }

    return { allowed: true };
  }

  getProposal(proposalId) {
    return this.proposals.get(proposalId) || null;
  }

  listProposals(filter = {}) {
    return Array.from(this.proposals.values()).filter(p => {
      if (filter.status && p.status !== filter.status) return false;
      if (filter.area && p.area !== filter.area) return false;
      return true;
    });
  }

  updateProposalStatus(proposalId, newStatus, metadata = {}) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    proposal.status = newStatus;
    Object.assign(proposal, metadata);
    this.saveProposals();
    return proposal;
  }
}

export const improvementProposalEngine = new ImprovementProposalEngine();
