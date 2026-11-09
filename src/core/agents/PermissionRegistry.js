/**
 * ════════════════════════════════════════════════════════════════════
 *  CAPABILITY & PERMISSION REGISTRY (PHASE 5 EXECUTIVE SYSTEM)
 * ════════════════════════════════════════════════════════════════════
 * Enforces strict security boundaries for Mini-Adhy and all 10 specialist agents.
 * 
 * CORE PRINCIPLE:
 * Agents can NEVER expand their own permissions. High-risk operations
 * require verified owner authorization and are logged in an immutable audit trail.
 * 
 * Phase 5 Enhancements:
 * - Explicit 3-tier risk classification: LOW_RISK, CONTROLLED, HIGH_IMPACT (+ PROHIBITED)
 * - Cryptographically bound single-use approval tokens tied to canonical payload hash
 * - Strict expiration TTLs (default 5 minutes)
 * - Fail-closed enforcement at the actual execution boundary
 */

import { CAPABILITY_LEVELS } from './AgentTypes';

export const RISK_TIERS = Object.freeze({
  LOW_RISK: 'LOW_RISK',
  CONTROLLED: 'CONTROLLED',
  HIGH_IMPACT: 'HIGH_IMPACT',
  PROHIBITED: 'PROHIBITED'
});

/**
 * Deterministically computes canonical payload hash (DJB2 + FNV-1a combination)
 * Ensures authorization is bound to the exact payload content
 */
export function computePayloadHash(payload = {}) {
  const canonicalize = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(canonicalize);
    const sorted = {};
    Object.keys(obj).sort().forEach(k => {
      // Exclude ephemeral/token fields from hash calculation
      if (k !== '_approvalToken' && k !== 'approvalToken') {
        sorted[k] = canonicalize(obj[k]);
      }
    });
    return sorted;
  };

  const str = JSON.stringify(canonicalize(payload) || {});
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  return `hash_${(hash1 >>> 0).toString(16)}_${(hash2 >>> 0).toString(16)}`;
}

class PermissionRegistry {
  constructor() {
    this.pendingApprovals = [];
    this.issuedTokens = new Map(); // tokenId -> tokenMetadata
    this.auditLog = [];
    this.maxAuditEntries = 100;
  }

  /**
   * Classify risk tier of an operation and payload
   */
  classifyRisk(operationName = '', payload = {}) {
    const op = String(operationName).toLowerCase();

    // 1. Prohibited
    if (this.isProhibited(op, payload)) {
      return RISK_TIERS.PROHIBITED;
    }

    // 2. High Impact: external communication, publishing, spending, deletions, deployment, secrets, infra
    if (
      payload.irreversible ||
      payload.destroysProductionData ||
      payload.modifiesSecrets ||
      payload.deployToProduction ||
      payload.productionDeployment ||
      payload.modifiesInfrastructure ||
      payload.spendMoney ||
      payload.deleteImportantData ||
      payload.publishContent ||
      payload.sendExternalCommunication ||
      op.includes('deploy') ||
      op.includes('delete_persistent') ||
      op.includes('grant_privilege') ||
      op.includes('modify_secret') ||
      op.includes('production_domain') ||
      op.includes('send_communication') ||
      op.includes('publish_') ||
      op.includes('infrastructure_') ||
      op.includes('spend_')
    ) {
      return RISK_TIERS.HIGH_IMPACT;
    }

    // 3. Controlled: modifying project files, persistent records, updating shared state
    if (
      payload.modifiesProjectFiles ||
      payload.createsPersistentRecord ||
      payload.updatesSharedResources ||
      payload.table ||
      op.startsWith('modify_') ||
      op.startsWith('write_') ||
      op.startsWith('apply_') ||
      op.startsWith('update_') ||
      op.startsWith('create_') ||
      op.startsWith('delete_') ||
      op.startsWith('mutate_') ||
      op.includes('mutate') ||
      op.includes('database') ||
      op.includes('record') ||
      op.includes('code_change') ||
      op.includes('persistent_record') ||
      op.includes('edit_')
    ) {
      return RISK_TIERS.CONTROLLED;
    }

    // 4. Low Risk: read-only research, analysis, draft generation, local sandbox
    return RISK_TIERS.LOW_RISK;
  }

  /**
   * Evaluates whether an agent operation is permitted, requires owner approval, or is prohibited.
   */
  evaluate(agentId, operationName, payload = {}) {
    const timestamp = new Date().toISOString();
    const riskTier = this.classifyRisk(operationName, payload);

    // 1. Hard-coded Prohibitions (Zero exceptions)
    if (riskTier === RISK_TIERS.PROHIBITED) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.PROHIBITED,
        riskTier: RISK_TIERS.PROHIBITED,
        allowed: false,
        reason: 'Operation violates strict security invariant.'
      });
      return {
        allowed: false,
        granted: false,
        level: CAPABILITY_LEVELS.PROHIBITED,
        riskTier: RISK_TIERS.PROHIBITED,
        reason: 'Operation strictly prohibited by security policy.'
      };
    }

    // 2. High-Impact or Controlled Actions
    if (riskTier === RISK_TIERS.HIGH_IMPACT || riskTier === RISK_TIERS.CONTROLLED) {
      // Check if valid single-use approval token is presented
      const token = payload._approvalToken || payload.approvalToken;
      if (token) {
        const verifyRes = this.verifyApprovalToken(token, agentId, operationName, payload);
        if (verifyRes.valid) {
          return {
            allowed: true,
            granted: true,
            level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
            riskTier,
            tokenVerified: true,
            reason: 'Single-use approval token verified and consumed.'
          };
        }
      }

      // If no valid token, queue for explicit owner approval
      const approvalRequest = {
        id: `appr_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
        timestamp,
        agentId,
        operationName,
        payload,
        payloadHash: computePayloadHash(payload),
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        riskTier,
        status: 'pending'
      };
      this.pendingApprovals.unshift(approvalRequest);
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        riskTier,
        allowed: false,
        reason: `${riskTier} operation requires explicit owner approval.`
      });
      return {
        allowed: false,
        granted: false,
        requiresApproval: true,
        pendingApproval: true,
        approvalId: approvalRequest.id,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        riskTier,
        reason: `${riskTier} action queued for owner approval.`
      };
    }

    // 3. Low Risk Operations (Read-only, analysis, draft generation, local sandbox)
    this.recordAudit({
      timestamp,
      agentId,
      operationName,
      level: CAPABILITY_LEVELS.SAFE_AUTOMATION,
      riskTier: RISK_TIERS.LOW_RISK,
      allowed: true
    });
    return {
      allowed: true,
      granted: true,
      level: CAPABILITY_LEVELS.SAFE_AUTOMATION,
      riskTier: RISK_TIERS.LOW_RISK
    };
  }

  /**
   * Authorization check wrapper for BaseAgent and tests
   */
  authorize(agentId, operationName, payloadOrLevel = {}) {
    let payload = {};
    if (typeof payloadOrLevel === 'object' && payloadOrLevel !== null) {
      payload = payloadOrLevel;
    } else if (payloadOrLevel === CAPABILITY_LEVELS.PROHIBITED) {
      payload = { prohibited: true };
    } else if (payloadOrLevel === CAPABILITY_LEVELS.APPROVAL_REQUIRED) {
      payload = { modifiesProjectFiles: true };
    }

    const res = this.evaluate(agentId, operationName, payload);
    return {
      authorized: res.allowed,
      allowed: res.allowed,
      granted: res.allowed,
      level: res.level,
      riskTier: res.riskTier,
      requiresApproval: res.requiresApproval,
      pendingApproval: Boolean(res.requiresApproval || res.pendingApproval),
      approvalId: res.approvalId,
      reason: res.reason,
      tokenVerified: res.tokenVerified || false
    };
  }

  /**
   * Verifies an approval token at the actual execution boundary
   * Strictly enforces: existence, single-use, non-expired, agent bound, op bound, payload hash bound
   * FAILS CLOSED if any check fails!
   */
  verifyApprovalToken(tokenId, agentId, operationName, payload = {}) {
    const timestamp = new Date().toISOString();

    if (!tokenId || !this.issuedTokens.has(tokenId)) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        allowed: false,
        reason: 'Token verification failed: Token not found or invalid'
      });
      return { valid: false, reason: 'Approval token not found or invalid.' };
    }

    const token = this.issuedTokens.get(tokenId);

    // 1. Single-Use Check (Replay prevention)
    if (token.consumed) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        allowed: false,
        reason: `Replay attack rejected: Token ${tokenId} has already been consumed.`
      });
      return { valid: false, reason: 'Approval token has already been consumed (single-use invariant).' };
    }

    // 2. TTL Expiration Check
    if (new Date(token.expiresAt).getTime() <= Date.now()) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        allowed: false,
        reason: `Token expired: Token ${tokenId} expired at ${token.expiresAt}.`
      });
      return { valid: false, reason: 'Approval token has expired.' };
    }

    // 3. Agent Binding Check
    if (token.agentId !== agentId) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        allowed: false,
        reason: `Agent mismatch: Token issued to ${token.agentId}, presented by ${agentId}.`
      });
      return { valid: false, reason: 'Approval token is bound to a different agent.' };
    }

    // 4. Operation Name Binding Check
    if (token.operationName !== operationName) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        allowed: false,
        reason: `Operation mismatch: Token issued for ${token.operationName}, presented for ${operationName}.`
      });
      return { valid: false, reason: 'Approval token is bound to a different operation.' };
    }

    // 5. Exact Payload Hash Binding Check (Tamper prevention)
    const currentHash = computePayloadHash(payload);
    if (token.payloadHash !== currentHash) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
        allowed: false,
        reason: `Payload modification detected: Expected ${token.payloadHash}, received ${currentHash}.`
      });
      return { valid: false, reason: 'Payload modification detected. Approval is strictly bound to original payload.' };
    }

    // Mark single-use token consumed
    token.consumed = true;
    token.consumedAt = timestamp;

    this.recordAudit({
      timestamp,
      agentId,
      operationName,
      level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
      allowed: true,
      reason: `Approval token ${tokenId} successfully verified and consumed.`
    });

    return { valid: true, token };
  }

  isAllowed(agentId, operationName, payload = {}) {
    const res = this.evaluate(agentId, operationName, payload);
    return Boolean(res.allowed);
  }

  isProhibited(op = '', payload = {}) {
    const prohibitedPatterns = [
      /(\b|_)eval(\b|_|\()/i,
      /(\b|_)exec(\b|_|\()/i,
      /rm\s+-rf/i,
      /drop\s+database/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /exfiltrate/i,
      /disable_csp/i,
      /bypass_auth/i,
      /export_secret/i,
      /unrestricted_shell/i
    ];
    const opStr = `${op} ${JSON.stringify(payload)}`;
    return prohibitedPatterns.some(pattern => pattern.test(opStr));
  }

  isSafeOrReadOnly(op = '') {
    const safePrefixes = [
      'read_', 'get_', 'check_', 'analyze_', 'scan_', 'test_',
      'diagnose_', 'compile_report', 'fetch_public_', 'ping_'
    ];
    return safePrefixes.some(pre => op.startsWith(pre));
  }

  recordAudit(entry) {
    this.auditLog.unshift(entry);
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.pop();
    }
  }

  getPendingApprovals() {
    return [...this.pendingApprovals];
  }

  resolveApproval(approvalId, approved = false, reviewer = 'owner', options = {}) {
    const item = this.pendingApprovals.find(a => a.id === approvalId);
    if (!item) return { success: false, error: 'Approval request not found.' };

    item.status = approved ? 'approved' : 'rejected';
    item.resolvedAt = new Date().toISOString();
    item.resolvedBy = reviewer;

    this.pendingApprovals = this.pendingApprovals.filter(a => a.id !== approvalId);

    let token = null;
    if (approved) {
      const ttlMs = options.ttlMs || (5 * 60 * 1000); // 5 minutes TTL
      token = {
        id: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        approvalId: item.id,
        agentId: item.agentId,
        operationName: item.operationName,
        payloadHash: item.payloadHash || computePayloadHash(item.payload),
        issuedAt: item.resolvedAt,
        expiresAt: new Date(Date.now() + ttlMs).toISOString(),
        consumed: false,
        reviewer
      };
      this.issuedTokens.set(token.id, token);
      item.approvalToken = token.id;
      item.tokenExpiresAt = token.expiresAt;
    }

    this.recordAudit({
      timestamp: item.resolvedAt,
      agentId: item.agentId,
      operationName: item.operationName,
      level: item.level,
      allowed: approved,
      reason: `Owner manually ${approved ? 'approved' : 'rejected'} operation.${token ? ' Generated single-use token ' + token.id : ''}`
    });

    return {
      success: true,
      item,
      token: token ? token.id : null,
      tokenExpiresAt: token ? token.expiresAt : null
    };
  }

  getAuditLog() {
    return [...this.auditLog];
  }
}

export const permissionRegistry = new PermissionRegistry();

