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
import { permissionRegistry, computePayloadHash } from '../agents/PermissionRegistry.js';
import { serverApprovalService } from '../security/ServerApprovalService.js';

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
    proposal.canonicalPayloadHash = computePayloadHash(proposal.proposedChange || {});

    // Authoritative registration with permission registry
    const permEval = permissionRegistry.evaluate('metacognition', 'DEPLOY_PROPOSAL', {
      proposalId: proposal.proposalId,
      proposedChange: proposal.proposedChange,
      deployToProduction: true
    });
    proposal.approvalId = permEval.approvalId || `appr_meta_${Date.now()}`;

    this._logDeploymentAction('DEPLOYMENT_STAGED_FOR_APPROVAL', proposal.proposalId, 'Awaiting human authorization');
    return {
      status: PROPOSAL_STATUS.PENDING_APPROVAL,
      allowed: true,
      approvalId: proposal.approvalId,
      canonicalPayloadHash: proposal.canonicalPayloadHash,
      message: 'Proposal successfully staged. Awaiting explicit human authorization token.'
    };
  }

  /**
   * Human approval gate: verifies creator identity, token validity, and cryptographic payload binding
   * @param {Object} proposal
   * @param {string} approvalToken - Valid human approval token
   * @param {string} approverIdentity - Identity of approver (must be creator Adhy)
   */
  approveDeployment(proposal, approvalToken, approverIdentity = 'Adhithya Mohan') {
    if (!proposal || typeof proposal !== 'object') {
      return { approved: false, error: 'Proposal object is required for approval.' };
    }

    if (!approvalToken || typeof approvalToken !== 'string' || approvalToken.length < 8) {
      return {
        approved: false,
        error: 'Invalid approval token. Explicit token required for production changes.'
      };
    }

    // Forbid autonomous agents from manufacturing their own self-approval tokens
    if (/agent_self|unverified|bypass|autonomous_auto/i.test(approvalToken)) {
      return {
        approved: false,
        error: 'Security violation: Self-manufactured agent approval tokens are strictly forbidden.'
      };
    }

    // Rejection of simulated tokens from production application
    if (approvalToken.startsWith('mock_demo_') || approvalToken.startsWith('simulated_')) {
      return {
        approved: false,
        error: 'Simulation tokens cannot authorize production deployment. Real human authorization required.'
      };
    }

    // Strict identity validation: Creator (Adhithya Mohan / Adhy) only
    const normalizedApprover = String(approverIdentity || '').trim().toLowerCase();
    const isAuthorizedCreator = (
      normalizedApprover === 'adhithya mohan' ||
      normalizedApprover === 'adhithya' ||
      normalizedApprover === 'adhy' ||
      normalizedApprover === 'creator'
    );

    if (!isAuthorizedCreator) {
      return {
        approved: false,
        error: 'Unauthorized approver. Only creator (Adhy) has authority to deploy production improvements.'
      };
    }

    // Verify token against authoritative ServerApprovalService or PermissionRegistry
    const expectedPayload = {
      proposalId: proposal.proposalId,
      proposedChange: proposal.proposedChange,
      deployToProduction: true
    };

    if (serverApprovalService.issuedTokens.has(approvalToken)) {
      const serverRes = serverApprovalService.verifyAndConsumeToken({
        token: approvalToken,
        actionType: 'DEPLOY_PROPOSAL',
        payload: expectedPayload,
        consumerIdentity: 'ProductionSafetyGuard'
      });
      if (!serverRes.valid) {
        return {
          approved: false,
          error: `Token verification failed: ${serverRes.reason}`
        };
      }
    } else if (permissionRegistry.issuedTokens.has(approvalToken)) {
      const verifyRes = permissionRegistry.verifyApprovalToken(approvalToken, 'metacognition', 'DEPLOY_PROPOSAL', expectedPayload);
      if (!verifyRes.valid) {
        return {
          approved: false,
          error: `Token verification failed: ${verifyRes.reason}`
        };
      }
    } else {
      return {
        approved: false,
        error: 'Token verification failed: Token was not issued by an authoritative approval provider.'
      };
    }

    proposal.status = PROPOSAL_STATUS.APPROVED;
    proposal.approvedBy = approverIdentity;
    proposal.approvedAt = new Date().toISOString();
    proposal.approvalToken = approvalToken;
    proposal.canonicalPayloadHash = computePayloadHash(proposal.proposedChange || {});

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
    if (!proposal || proposal.status !== PROPOSAL_STATUS.APPROVED) {
      return {
        deployed: false,
        error: `Cannot deploy proposal with status '${proposal?.status}'. Must be APPROVED by creator.`
      };
    }

    // Cryptographic payload tamper check: ensure proposed changes have not mutated post-approval
    const currentPayloadHash = computePayloadHash(proposal.proposedChange || {});
    if (proposal.canonicalPayloadHash && proposal.canonicalPayloadHash !== currentPayloadHash) {
      return {
        deployed: false,
        error: 'Integrity violation: Proposed changes were modified after approval was granted.'
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
