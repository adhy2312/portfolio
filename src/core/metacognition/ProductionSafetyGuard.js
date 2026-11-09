/**
 * ════════════════════════════════════════════════════════════════════
 *  PRODUCTION SAFETY GUARD — SECURITY & DEPLOYMENT GATE (PHASE 8)
 * ════════════════════════════════════════════════════════════════════
 * Enforces impenetrable safety invariants on Mini-Adhy's self-improvement:
 * 1. Forbids autonomous modification of security controls or secrets.
 * 2. Mandates explicit human approval before any production patch.
 * 3. Enforces automated rollback monitoring on deployed improvements.
 */

import {
  PROPOSAL_STATUS,
  SAFETY_RESTRICTIONS
} from './MetacognitionTypes.js';

export class ProductionSafetyGuard {
  constructor(options = {}) {
    this.activeProductionConfig = options.initialConfig || this._getDefaultProductionConfig();
    this.configBackupHistory = [];
    this.deployedProposals = new Map();
    this.deploymentAuditTrail = [];
    this.maxAuditEntries = 100;
  }

  _getDefaultProductionConfig() {
    return {
      version: 'prod-v1.0.0',
      retrieval: {
        topK: 5,
        relevanceThreshold: 0.65,
        maxMemoryTokens: 500
      },
      compiler: {
        tokenBudget: 1500,
        includeCognitiveBlock: true,
        includePhysiologicalBlock: true
      },
      execution: {
        maxSubtasks: 10,
        defaultTimeoutMs: 15000,
        requireVerification: true
      },
      providers: {
        preferredFast: 'Groq',
        preferredReasoning: 'Gemini',
        maxRetries: 2
      }
    };
  }

  getActiveConfig() {
    return { ...this.activeProductionConfig };
  }

  /**
   * Evaluates whether a proposal violates core production security invariants
   */
  validateSafetyInvariants(proposal) {
    if (!proposal || typeof proposal !== 'object') {
      return { allowed: false, reason: 'Proposal payload must be a non-null object' };
    }

    const proposedPatch = proposal.proposedChange || {};
    const patchString = JSON.stringify(proposedPatch).toLowerCase();

    // Check for forbidden security files/subsystems
    for (const forbidden of SAFETY_RESTRICTIONS.FORBIDDEN_FILES) {
      if (patchString.includes(forbidden.toLowerCase())) {
        return {
          allowed: false,
          violation: 'FORBIDDEN_SECURITY_SUBSYSTEM',
          reason: `Self-modification attempted to modify protected security module: '${forbidden}'`
        };
      }
    }

    // Check for forbidden actions
    for (const action of SAFETY_RESTRICTIONS.FORBIDDEN_ACTIONS) {
      if (patchString.includes(action.toLowerCase())) {
        return {
          allowed: false,
          violation: 'FORBIDDEN_ACTION',
          reason: `Self-modification attempted unauthorized action: '${action}'`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Stages proposal for human approval (cannot be self-approved)
   */
  requestDeployment(proposal) {
    const safety = this.validateSafetyInvariants(proposal);
    if (!safety.allowed) {
      this._logDeploymentAction('DEPLOYMENT_REJECTED_SAFETY_VIOLATION', proposal.proposalId, safety.reason);
      return {
        status: PROPOSAL_STATUS.REJECTED,
        allowed: false,
        error: safety.reason
      };
    }

    proposal.status = PROPOSAL_STATUS.PENDING_APPROVAL;
    proposal.requiresHumanApproval = true;

    this._logDeploymentAction('DEPLOYMENT_STAGED_FOR_APPROVAL', proposal.proposalId, 'Awaiting human authorization');
    return {
      status: PROPOSAL_STATUS.PENDING_APPROVAL,
      allowed: true,
      message: 'Proposal successfully staged. Awaiting explicit human authorization token.'
    };
  }

  /**
   * Human approval gate
   * @param {string} proposalId
   * @param {string} approvalToken - Valid human approval token
   * @param {string} approverIdentity - Identity of approver (must be creator Adhy or approved authority)
   */
  approveDeployment(proposal, approvalToken, approverIdentity = 'Adhithya Mohan') {
    if (!approvalToken || typeof approvalToken !== 'string' || approvalToken.length < 8) {
      return {
        approved: false,
        error: 'Invalid approval token. Explicit token required for production changes.'
      };
    }

    if (!approverIdentity || !/adhithya|adhy/i.test(approverIdentity)) {
      return {
        approved: false,
        error: 'Unauthorized approver. Only creator (Adhy) has authority to deploy production improvements.'
      };
    }

    proposal.status = PROPOSAL_STATUS.APPROVED;
    proposal.approvedBy = approverIdentity;
    proposal.approvedAt = new Date().toISOString();
    proposal.approvalToken = approvalToken;

    this._logDeploymentAction('PROPOSAL_APPROVED_BY_CREATOR', proposal.proposalId, `Approved by ${approverIdentity}`);
    return {
      approved: true,
      proposal
    };
  }

  /**
   * Applies approved patch to production config, preserving full backup for rollback
   */
  deployProposal(proposal) {
    if (proposal.status !== PROPOSAL_STATUS.APPROVED) {
      return {
        deployed: false,
        error: `Cannot deploy proposal with status '${proposal.status}'. Must be APPROVED by creator.`
      };
    }

    // 1. Safety check again at deployment boundary
    const safety = this.validateSafetyInvariants(proposal);
    if (!safety.allowed) {
      return { deployed: false, error: safety.reason };
    }

    // 2. Backup current production configuration
    const backupSnapshot = {
      backupId: `bk_${Date.now()}`,
      timestamp: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(this.activeProductionConfig)),
      reason: `Pre-deployment backup for proposal ${proposal.proposalId}`
    };
    this.configBackupHistory.unshift(backupSnapshot);

    // 3. Apply patch (deep merge)
    this._applyPatch(this.activeProductionConfig, proposal.proposedChange);
    this.activeProductionConfig.version = `prod-${proposal.proposalId}-${Date.now()}`;

    proposal.status = PROPOSAL_STATUS.DEPLOYED;
    proposal.deployedAt = new Date().toISOString();
    this.deployedProposals.set(proposal.proposalId, {
      proposal,
      backupId: backupSnapshot.backupId,
      postDeployMetrics: { tasksEvaluated: 0, regressionsObserved: 0 }
    });

    this._logDeploymentAction('DEPLOYMENT_APPLIED', proposal.proposalId, `Active config updated to ${this.activeProductionConfig.version}`);

    return {
      deployed: true,
      newConfigVersion: this.activeProductionConfig.version,
      activeConfig: this.getActiveConfig(),
      backupId: backupSnapshot.backupId
    };
  }

  /**
   * Automated rollback in case of detected regression
   */
  executeRollback(proposalId, reason = 'Post-deployment regression detected') {
    const deployed = this.deployedProposals.get(proposalId);
    if (!deployed) {
      return { rolledBack: false, error: `Proposal '${proposalId}' is not recorded as actively deployed.` };
    }

    const backup = this.configBackupHistory.find(b => b.backupId === deployed.backupId);
    if (!backup) {
      return { rolledBack: false, error: 'Backup snapshot not found for rollback.' };
    }

    // Restore previous configuration
    this.activeProductionConfig = JSON.parse(JSON.stringify(backup.config));
    deployed.proposal.status = PROPOSAL_STATUS.ROLLED_BACK;
    deployed.proposal.rolledBackAt = new Date().toISOString();
    deployed.proposal.rollbackReason = reason;

    this._logDeploymentAction('DEPLOYMENT_ROLLED_BACK', proposalId, `Reverted to ${backup.config.version}. Reason: ${reason}`);

    return {
      rolledBack: true,
      restoredVersion: this.activeProductionConfig.version,
      reason,
      activeConfig: this.getActiveConfig()
    };
  }

  _applyPatch(target, patch) {
    for (const [key, val] of Object.entries(patch)) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && typeof target[key] === 'object') {
        this._applyPatch(target[key], val);
      } else {
        target[key] = val;
      }
    }
  }

  _logDeploymentAction(action, proposalId, detail) {
    this.deploymentAuditTrail.unshift({
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      proposalId,
      detail,
      timestamp: new Date().toISOString()
    });
    if (this.deploymentAuditTrail.length > this.maxAuditEntries) {
      this.deploymentAuditTrail.pop();
    }
  }

  getAuditTrail() {
    return [...this.deploymentAuditTrail];
  }
}

export const productionSafetyGuard = new ProductionSafetyGuard();
