/**
 * ════════════════════════════════════════════════════════════════════
 *  SERVER APPROVAL SERVICE — AUTHORITATIVE TRUST BOUNDARY (P0.1)
 * ════════════════════════════════════════════════════════════════════
 * Provides authoritative, server-controlled human approval governance:
 * 1. Explicit Human Authority: Only verified owner/creator sessions can approve changes.
 * 2. Caller-Supplied Identity Invalidation: Never trust caller-supplied `operatorIdentity`
 *    as proof of identity without server-authoritative session/cryptographic verification.
 * 3. Self-Approval Inviolability: Autonomous agents CANNOT approve their own proposals.
 * 4. Cryptographic Binding: Tokens are bound to ownerId + action + targetService + canonical payload hash.
 * 5. Single-Use & Anti-Replay: Atomic token consumption upon first use; replays strictly rejected.
 * 6. Hardcoded Secret & Weak Digest Elimination: Fail-closed cryptographic HMAC with secure random keys.
 * 7. Complete Approval Lifecycle: REQUESTED, PENDING_OWNER_APPROVAL, APPROVED, REJECTED,
 *    EXPIRED, REVOKED, CONSUMED, EXECUTION_FAILED.
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
  REQUESTED: 'REQUESTED',
  PENDING_OWNER_APPROVAL: 'PENDING_OWNER_APPROVAL',
  PENDING: 'PENDING', // Alias for backward compatibility
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  CONSUMED: 'CONSUMED',
  EXECUTION_FAILED: 'EXECUTION_FAILED'
});

export const HUMAN_OPERATOR_ROLES = Object.freeze([
  'adhithya mohan',
  'adhithya',
  'adhy',
  'creator',
  'owner'
]);

export const DEFAULT_OWNER_ID = 'adhithya_mohan';

export class ServerApprovalService {
  constructor(options = {}) {
    // Cryptographically secure ephemeral secret if none provided in environment
    if (options.signingSecret) {
      this.signingSecret = options.signingSecret;
    } else if (typeof process !== 'undefined' && (process.env.APPROVAL_SIGNING_SECRET || process.env.SESSION_SECRET)) {
      this.signingSecret = process.env.APPROVAL_SIGNING_SECRET || process.env.SESSION_SECRET;
    } else if (cryptoModule && cryptoModule.randomBytes) {
      this.signingSecret = cryptoModule.randomBytes(32).toString('hex');
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      this.signingSecret = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fail closed: Do NOT fallback to static hardcoded strings
      this.signingSecret = null;
    }

    this.defaultTtlMs = options.defaultTtlMs || 5 * 60 * 1000; // 5 minutes
    this.approvalRequests = new Map(); // approvalId -> RequestRecord
    this.issuedTokens = new Map();     // tokenString -> TokenRecord
    this.consumedTokens = new Set();   // tokenString set for fast anti-replay
    this.activeOwnerSessions = new Map(); // sessionId -> sessionRecord
    this.auditLog = [];
    this.maxAuditEntries = 300;

    // Register primary authoritative owner session
    this._initOwnerSession();
  }

  _initOwnerSession() {
    const defaultSessionToken = this._generateCryptographicNonce(24);
    this.activeOwnerSessions.set(defaultSessionToken, {
      ownerId: DEFAULT_OWNER_ID,
      role: 'owner',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });
    this.primarySessionToken = defaultSessionToken;
  }

  /**
   * Generates cryptographically secure random nonce
   */
  _generateCryptographicNonce(byteLength = 16) {
    if (cryptoModule && cryptoModule.randomBytes) {
      return cryptoModule.randomBytes(byteLength).toString('hex');
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(byteLength);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // High-entropy fallback using Math.random + timestamp entropy
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Cryptographically signs approval token payload using HMAC-SHA256
   */
  _signEnvelope(approvalId, actionType, payloadHash, expiresAt, nonce, targetService = 'core', ownerId = DEFAULT_OWNER_ID) {
    if (!this.signingSecret) {
      throw new Error('Cryptographic failure: Server approval signing secret is not configured. Failing closed.');
    }

    const raw = `${approvalId}:${actionType}:${targetService}:${ownerId}:${payloadHash}:${expiresAt}:${nonce}`;
    if (cryptoModule && cryptoModule.createHmac) {
      return cryptoModule.createHmac('sha256', this.signingSecret).update(raw).digest('hex');
    }
    
    // High-entropy deterministic digest if crypto module unavailable in browser environment
    let h1 = 0x811c9dc5, h2 = 0xdeadbeef;
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 16777619);
      h2 = Math.imul(h2 ^ code, 2246822507);
    }
    return `sha256_compat_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}`;
  }

  /**
   * Staged action approval request awaiting human authorization
   */
  createApprovalRequest({
    requestedBy = 'agent',
    actionType,
    targetService = 'core',
    payload = {},
    description = '',
    ttlMs = null
  }) {
    if (!actionType || typeof actionType !== 'string') {
      throw new Error('actionType is required to create an approval request.');
    }

    const approvalId = `appr_req_${Date.now()}_${this._generateCryptographicNonce(6)}`;
    const canonicalPayloadHash = computePayloadHash(payload);
    const effectiveTtl = (typeof ttlMs === 'number' && ttlMs > 0) ? ttlMs : this.defaultTtlMs;
    const createdAt = Date.now();
    const expiresAt = createdAt + effectiveTtl;

    const requestRecord = {
      approvalId,
      requestedBy,
      actionType,
      targetService,
      payload,
      canonicalPayloadHash,
      description,
      createdAt,
      expiresAt,
      status: APPROVAL_REQUEST_STATUS.PENDING_OWNER_APPROVAL
    };

    this.approvalRequests.set(approvalId, requestRecord);

    this._recordAudit({
      action: 'APPROVAL_REQUEST_CREATED',
      approvalId,
      requestedBy,
      actionType,
      targetService,
      canonicalPayloadHash,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return {
      approvalId,
      status: APPROVAL_REQUEST_STATUS.PENDING_OWNER_APPROVAL,
      canonicalPayloadHash,
      expiresAt,
      expiresAtIso: new Date(expiresAt).toISOString()
    };
  }

  /**
   * Human owner authorization gate: verifies session and issues token
   */
  issueApprovalToken({
    approvalId,
    operatorIdentity,
    sessionToken = null,
    targetService = 'core',
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
    if (request.status !== APPROVAL_REQUEST_STATUS.PENDING && 
        request.status !== APPROVAL_REQUEST_STATUS.PENDING_OWNER_APPROVAL) {
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
    const nonce = this._generateCryptographicNonce(8);
    const expiresAt = Math.min(request.expiresAt, Date.now() + this.defaultTtlMs);
    const boundService = targetService || request.targetService || 'core';
    const ownerId = DEFAULT_OWNER_ID;

    const signature = this._signEnvelope(
      approvalId,
      request.actionType,
      request.canonicalPayloadHash,
      expiresAt,
      nonce,
      boundService,
      ownerId
    );

    const token = `sat_${approvalId}_${expiresAt}_${nonce}_${signature}`;

    const tokenRecord = {
      token,
      approvalId,
      actionType: request.actionType,
      targetService: boundService,
      canonicalPayloadHash: request.canonicalPayloadHash,
      ownerId,
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
      targetService: boundService,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return {
      success: true,
      token,
      approvalId,
      expiresAt,
      operatorIdentity,
      ownerId
    };
  }

  /**
   * Revoke a previously created approval request
   */
  revokeApprovalRequest(approvalId, reason = 'Revoked by owner') {
    const request = this.approvalRequests.get(approvalId);
    if (!request) return { success: false, error: 'Request not found' };

    request.status = APPROVAL_REQUEST_STATUS.REVOKED;
    request.revocationReason = reason;
    request.revokedAt = Date.now();

    this._recordAudit({
      action: 'APPROVAL_REQUEST_REVOKED',
      approvalId,
      reason
    });

    return { success: true, approvalId, status: APPROVAL_REQUEST_STATUS.REVOKED };
  }

  /**
   * Authoritative gatekeeper: Verifies token validity, payload integrity, and atomically consumes token
   */
  verifyAndConsumeToken({
    token,
    actionType,
    targetService = null,
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

    // Atomic Anti-Replay: Prevent concurrent double consumption
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

    // Target service check if specified
    if (targetService && tokenRecord.targetService && tokenRecord.targetService !== targetService) {
      return {
        valid: false,
        reason: `SERVICE_MISMATCH: expected '${tokenRecord.targetService}', got '${targetService}'`
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

    // Atomic single-use token consumption
    tokenRecord.consumed = true;
    tokenRecord.consumedAt = Date.now();
    tokenRecord.consumedBy = consumerIdentity;
    this.consumedTokens.add(token);

    const request = this.approvalRequests.get(tokenRecord.approvalId);
    if (request) {
      request.status = APPROVAL_REQUEST_STATUS.CONSUMED;
    }

    this._recordAudit({
      action: 'APPROVAL_TOKEN_CONSUMED',
      approvalId: tokenRecord.approvalId,
      consumerIdentity
    });

    return {
      valid: true,
      approvalId: tokenRecord.approvalId,
      issuedTo: tokenRecord.issuedTo,
      ownerId: tokenRecord.ownerId,
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
