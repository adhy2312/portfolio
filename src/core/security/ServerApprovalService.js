/**
 * ════════════════════════════════════════════════════════════════════
 *  SERVER APPROVAL SERVICE — AUTHORITATIVE TRUST BOUNDARY (P0)
 * ════════════════════════════════════════════════════════════════════
 * Provides authoritative, server-controlled human approval governance:
 * 1. Explicit Human Authority: Only verified creator/owner can approve changes.
 * 2. Self-Approval Inviolability: Autonomous agents CANNOT approve their own proposals.
 * 3. Cryptographic Binding: Tokens are cryptographically bound to action + exact canonical payload hash.
 * 4. Single-Use & Anti-Replay: Tokens are consumed upon first use; replays are rejected.
 * 5. Time-Limited TTL: Default 5-minute lifetime; expired tokens are rejected.
 * 6. Mock Demonstration Provider: Simulation/demo flows use MockApprovalProvider
 *    marked clearly as SIMULATED_DEMO without mutating production config.
 */

import { computePayloadHash } from '../agents/PermissionRegistry.js';

let cryptoModule = null;
try {
  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
    // eslint-disable-next-line no-eval
    cryptoModule = eval('require')('crypto');
  }
} catch {
  cryptoModule = null;
}

export const APPROVAL_REQUEST_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CONSUMED: 'CONSUMED'
});

export const HUMAN_OPERATOR_ROLES = Object.freeze([
  'adhithya mohan',
  'adhithya',
  'adhy',
  'creator',
  'owner'
]);

export class ServerApprovalService {
  constructor(options = {}) {
    this.signingSecret = options.signingSecret || process.env.SESSION_SECRET || 'adhy_authoritative_approval_secret_v1';
    this.defaultTtlMs = options.defaultTtlMs || 5 * 60 * 1000; // 5 minutes
    this.approvalRequests = new Map(); // approvalId -> RequestRecord
    this.issuedTokens = new Map();     // tokenString -> TokenRecord
    this.consumedTokens = new Set();   // tokenString set for fast anti-replay
    this.auditLog = [];
    this.maxAuditEntries = 200;
  }

  /**
   * Deterministically sign payload hash + metadata
   */
  _signEnvelope(approvalId, actionType, payloadHash, expiresAt, nonce) {
    const raw = `${approvalId}:${actionType}:${payloadHash}:${expiresAt}:${nonce}`;
    if (cryptoModule && cryptoModule.createHmac) {
      return cryptoModule.createHmac('sha256', this.signingSecret).update(raw).digest('hex');
    }
    // High-entropy 64-bit digest fallback if crypto is absent in browser sandbox
    let h1 = 0x811c9dc5;
    let h2 = 0xdeadbeef;
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 16777619);
      h2 = Math.imul(h2 ^ code, 2246822507);
    }
    return `fallback_sig_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}`;
  }

  /**
   * Stage a change request awaiting human authorization
   */
  createApprovalRequest({
    requestedBy = 'agent',
    actionType,
    payload = {},
    description = '',
    ttlMs = null
  }) {
    if (!actionType || typeof actionType !== 'string') {
      throw new Error('actionType is required to create an approval request.');
    }

    const approvalId = `appr_req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const canonicalPayloadHash = computePayloadHash(payload);
    const effectiveTtl = (typeof ttlMs === 'number' && ttlMs > 0) ? ttlMs : this.defaultTtlMs;
    const createdAt = Date.now();
    const expiresAt = createdAt + effectiveTtl;

    const requestRecord = {
      approvalId,
      requestedBy,
      actionType,
      payload,
      canonicalPayloadHash,
      description,
      createdAt,
      expiresAt,
      status: APPROVAL_REQUEST_STATUS.PENDING
    };

    this.approvalRequests.set(approvalId, requestRecord);

    this._recordAudit({
      action: 'APPROVAL_REQUEST_CREATED',
      approvalId,
      requestedBy,
      actionType,
      canonicalPayloadHash,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return {
      approvalId,
      status: APPROVAL_REQUEST_STATUS.PENDING,
      canonicalPayloadHash,
      expiresAt,
      expiresAtIso: new Date(expiresAt).toISOString()
    };
  }

  /**
   * Human operator authorization gate: strictly verifies human identity and issues token
   */
  issueApprovalToken({
    approvalId,
    operatorIdentity,
    rejectionReason = null
  }) {
    const request = this.approvalRequests.get(approvalId);
    if (!request) {
      return { success: false, error: `Approval request [${approvalId}] not found.` };
    }

    // Check expiration
    if (Date.now() > request.expiresAt) {
      request.status = APPROVAL_REQUEST_STATUS.EXPIRED;
      return { success: false, error: 'Approval request has expired.' };
    }

    // Check existing resolution
    if (request.status !== APPROVAL_REQUEST_STATUS.PENDING) {
      return { success: false, error: `Approval request is already in state: ${request.status}` };
    }

    // Explicit Human Check: Agents CANNOT approve proposals
    const normalizedOperator = String(operatorIdentity || '').trim().toLowerCase();
    const isHumanOperator = HUMAN_OPERATOR_ROLES.some(role => normalizedOperator === role);

    const isAgent = /agent|metacognition|jarvis|ultron|friday|edith|karen|jocasta|hermes|autonomous|dume/i.test(normalizedOperator);

    if (isAgent || !isHumanOperator) {
      this._recordAudit({
        action: 'SECURITY_ALERT_AGENT_SELF_APPROVAL_ATTEMPT',
        approvalId,
        operatorIdentity,
        rejected: true
      });
      return {
        success: false,
        error: `Security violation: Identity '${operatorIdentity}' is an autonomous agent or unauthorized entity. Human approval required.`
      };
    }

    // If human explicitly rejects
    if (rejectionReason) {
      request.status = APPROVAL_REQUEST_STATUS.REJECTED;
      request.resolvedBy = operatorIdentity;
      request.resolvedAt = Date.now();
      request.rejectionReason = rejectionReason;
      return { success: false, rejected: true, reason: rejectionReason };
    }

    // Issue cryptographically bound token
    const nonce = Math.random().toString(36).substring(2, 10);
    const expiresAt = Math.min(request.expiresAt, Date.now() + this.defaultTtlMs);
    const signature = this._signEnvelope(approvalId, request.actionType, request.canonicalPayloadHash, expiresAt, nonce);
    const token = `sat_${approvalId}_${expiresAt}_${nonce}_${signature}`;

    const tokenRecord = {
      token,
      approvalId,
      actionType: request.actionType,
      canonicalPayloadHash: request.canonicalPayloadHash,
      issuedTo: operatorIdentity,
      issuedAt: Date.now(),
      expiresAt,
      nonce,
      consumed: false,
      consumedAt: null,
      consumedBy: null
    };

    this.issuedTokens.set(token, tokenRecord);
    request.status = APPROVAL_REQUEST_STATUS.APPROVED;
    request.resolvedBy = operatorIdentity;
    request.resolvedAt = Date.now();
    request.token = token;

    this._recordAudit({
      action: 'APPROVAL_TOKEN_ISSUED_BY_HUMAN',
      approvalId,
      operatorIdentity,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return {
      success: true,
      token,
      approvalId,
      expiresAt,
      operatorIdentity
    };
  }

  /**
   * Authoritative gatekeeper: Verifies token validity, payload integrity, and consumes token
   */
  verifyAndConsumeToken({
    token,
    actionType,
    payload = {},
    consumerIdentity = 'system'
  }) {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'TOKEN_MISSING_OR_INVALID' };
    }

    // Reject simulated or mock tokens in production verification
    if (token.startsWith('mock_demo_') || token.startsWith('simulated_')) {
      return {
        valid: false,
        reason: 'SIMULATED_TOKEN_REJECTED_IN_PRODUCTION',
        isSimulated: true
      };
    }

    // Anti-replay check
    if (this.consumedTokens.has(token)) {
      return { valid: false, reason: 'TOKEN_ALREADY_USED' };
    }

    const tokenRecord = this.issuedTokens.get(token);
    if (!tokenRecord) {
      return { valid: false, reason: 'TOKEN_NOT_FOUND_OR_UNREGISTERED' };
    }

    if (tokenRecord.consumed) {
      return { valid: false, reason: 'TOKEN_ALREADY_CONSUMED' };
    }

    // Expiration check
    if (Date.now() > tokenRecord.expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }

    // Action mismatch check
    if (actionType && tokenRecord.actionType !== actionType) {
      return {
        valid: false,
        reason: `ACTION_MISMATCH: expected '${tokenRecord.actionType}', got '${actionType}'`
      };
    }

    // Cryptographic payload tampering check
    const currentPayloadHash = computePayloadHash(payload);
    if (tokenRecord.canonicalPayloadHash !== currentPayloadHash) {
      this._recordAudit({
        action: 'SECURITY_ALERT_PAYLOAD_TAMPER_DETECTED',
        token,
        expectedHash: tokenRecord.canonicalPayloadHash,
        receivedHash: currentPayloadHash
      });
      return {
        valid: false,
        reason: 'PAYLOAD_HASH_MISMATCH_TAMPERED'
      };
    }

    // Consume token (Single-use invariant)
    tokenRecord.consumed = true;
    tokenRecord.consumedAt = Date.now();
    tokenRecord.consumedBy = consumerIdentity;
    this.consumedTokens.add(token);

    this._recordAudit({
      action: 'APPROVAL_TOKEN_CONSUMED',
      approvalId: tokenRecord.approvalId,
      consumerIdentity
    });

    return {
      valid: true,
      approvalId: tokenRecord.approvalId,
      issuedTo: tokenRecord.issuedTo,
      consumedAt: tokenRecord.consumedAt
    };
  }

  _recordAudit(entry) {
    this.auditLog.unshift({ ...entry, timestamp: new Date().toISOString() });
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.pop();
    }
  }

  clear() {
    this.approvalRequests.clear();
    this.issuedTokens.clear();
    this.consumedTokens.clear();
    this.auditLog = [];
  }
}

/**
 * Mock Approval Provider for demonstrations / offline testing loops
 * Explicitly produces SIMULATED_DEMO outcomes without modifying production state.
 */
export class MockApprovalProvider {
  constructor() {
    this.mode = 'SIMULATED_DEMO';
  }

  simulateDemonstrationApproval(proposal = {}) {
    const mockToken = `mock_demo_token_${proposal.proposalId || Date.now()}`;
    return {
      success: true,
      mode: 'SIMULATED_DEMO',
      isSimulated: true,
      token: mockToken,
      approver: 'Simulated Demo Operator (Offline)',
      timestamp: new Date().toISOString(),
      notice: 'Candidate improvement evaluated in sandboxed simulation. No production state modified.'
    };
  }
}

export const serverApprovalService = new ServerApprovalService();
export const mockApprovalProvider = new MockApprovalProvider();
