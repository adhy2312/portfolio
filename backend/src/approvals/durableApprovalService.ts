import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../config/env.js';
import { SupabaseAdapter } from '../auth/supabase.js';

export interface ApprovalRequestRecord {
  approvalId: string;
  actionType: string;
  targetService: string;
  ownerId: string;
  requestingAgent: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  status: 'REQUESTED' | 'PENDING_OWNER_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CONSUMED' | 'EXPIRED' | 'REVOKED';
  token: string | null;
  nonce: string;
  expiresAt: string;
  createdAt: string;
  consumedAt?: string | null;
  consumedBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateApprovalParams {
  actionType: string;
  targetService?: string;
  ownerId: string;
  requestingAgent?: string;
  payload: Record<string, unknown>;
  ttlMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ConsumeApprovalParams {
  approvalId: string;
  token: string;
  actionType?: string;
  targetService?: string;
  payload?: Record<string, unknown>;
  consumerIdentity?: string;
  ownerId: string;
}

export interface ConsumeResult {
  success: boolean;
  approvalId?: string;
  status?: string;
  authorizedAt?: string;
  error?: string;
  reason?: string;
}

/**
 * Computes deterministic SHA-256 hash of a payload object with key-sorted stability
 */
export function computeCanonicalPayloadHash(payload: unknown): string {
  function canonicalString(val: unknown): string {
    if (val === null || typeof val !== 'object') {
      return JSON.stringify(val);
    }
    if (Array.isArray(val)) {
      return '[' + val.map(canonicalString).join(',') + ']';
    }
    const obj = val as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    return '{' + sortedKeys.map((k) => JSON.stringify(k) + ':' + canonicalString(obj[k])).join(',') + '}';
  }

  const raw = canonicalString(payload ?? {});
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export class DurableApprovalService {
  private signingSecret: string;
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes
  // Local fallback storage for offline test/dev environments
  private localRequests = new Map<string, ApprovalRequestRecord>();
  private localConsumptions = new Set<string>(); // token hashes

  constructor(
    private config: AppConfig,
    private dbAdapter: SupabaseAdapter
  ) {
    if (config.NODE_ENV === 'production' && !config.APPROVAL_SIGNING_SECRET) {
      throw new Error(
        '[Security Invariant] In production mode, APPROVAL_SIGNING_SECRET is mandatory and must be at least 32 characters long. Generating random secrets or reusing other secrets is prohibited.'
      );
    }
    this.signingSecret =
      config.APPROVAL_SIGNING_SECRET ||
      'dev_test_approval_signing_secret_min_32_chars_long_12345';
  }

  /**
   * Generates a cryptographically bound, single-use approval token
   */
  private generateTokenSignature(
    approvalId: string,
    actionType: string,
    targetService: string,
    ownerId: string,
    payloadHash: string,
    expiresAtEpoch: number,
    nonce: string
  ): string {
    const rawEnvelope = `${approvalId}:${actionType}:${targetService}:${ownerId}:${payloadHash}:${expiresAtEpoch}:${nonce}`;
    return crypto
      .createHmac('sha256', this.signingSecret)
      .update(rawEnvelope)
      .digest('hex');
  }

  /**
   * Generates cryptographically secure random nonce
   */
  private generateNonce(byteLength = 16): string {
    return crypto.randomBytes(byteLength).toString('hex');
  }

  /**
   * Creates a durable approval request bound to payload hash, owner, and action
   */
  public async createApprovalRequest(params: CreateApprovalParams): Promise<ApprovalRequestRecord> {
    const approvalId = `appr_${Date.now()}_${this.generateNonce(8)}`;
    const now = Date.now();
    const effectiveTtl = params.ttlMs || this.defaultTtlMs;
    const expiresAtEpoch = now + effectiveTtl;
    const expiresAt = new Date(expiresAtEpoch).toISOString();
    const targetService = params.targetService || 'core';
    const requestingAgent = params.requestingAgent || 'JARVIS';
    const nonce = this.generateNonce(12);
    const payloadHash = computeCanonicalPayloadHash(params.payload);

    // Cryptographically sign token envelope
    const signature = this.generateTokenSignature(
      approvalId,
      params.actionType,
      targetService,
      params.ownerId,
      payloadHash,
      expiresAtEpoch,
      nonce
    );
    const token = `sat.${approvalId}.${expiresAtEpoch}.${nonce}.${signature}`;

    const record: ApprovalRequestRecord = {
      approvalId,
      actionType: params.actionType,
      targetService,
      ownerId: params.ownerId,
      requestingAgent,
      payload: params.payload,
      payloadHash,
      status: 'PENDING_OWNER_APPROVAL',
      token,
      nonce,
      expiresAt,
      createdAt: new Date(now).toISOString(),
      metadata: params.metadata || {}
    };

    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('approval_requests').insert({
          approval_id: record.approvalId,
          action_type: record.actionType,
          target_service: record.targetService,
          owner_id: record.ownerId,
          requesting_agent: record.requestingAgent,
          payload: record.payload,
          payload_hash: record.payloadHash,
          status: record.status,
          token: record.token,
          nonce: record.nonce,
          expires_at: record.expiresAt,
          created_at: record.createdAt,
          metadata: record.metadata
        });

        if (error) {
          throw new Error(`Failed to persist approval request to Supabase: ${error.message}`);
        }
      } catch (err) {
        if (this.config.NODE_ENV === 'production') {
          throw err;
        }
        // Dev fallback
        this.localRequests.set(approvalId, record);
      }
    } else {
      this.localRequests.set(approvalId, record);
    }

    return record;
  }

  /**
   * Retrieves pending approvals for an authenticated owner
   */
  public async getPendingApprovals(ownerId: string): Promise<ApprovalRequestRecord[]> {
    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('approval_requests')
          .select('*')
          .eq('owner_id', ownerId)
          .eq('status', 'PENDING_OWNER_APPROVAL')
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((r: any) => ({
            approvalId: r.approval_id,
            actionType: r.action_type,
            targetService: r.target_service,
            ownerId: r.owner_id,
            requestingAgent: r.requesting_agent || 'JARVIS',
            payload: r.payload || {},
            payloadHash: r.payload_hash,
            status: r.status,
            token: r.token,
            nonce: r.nonce,
            expiresAt: r.expires_at,
            createdAt: r.created_at,
            metadata: r.metadata || {}
          }));
        }
      } catch {
        // Fall back to local
      }
    }

    const now = Date.now();
    return Array.from(this.localRequests.values()).filter(
      (r) =>
        r.ownerId === ownerId &&
        r.status === 'PENDING_OWNER_APPROVAL' &&
        new Date(r.expiresAt).getTime() > now
    );
  }

  /**
   * Atomically verifies and consumes a single-use cryptographic approval token
   */
  public async consumeApprovalToken(params: ConsumeApprovalParams): Promise<ConsumeResult> {
    const { approvalId, token, ownerId } = params;

    if (!token || typeof token !== 'string') {
      return { success: false, reason: 'TOKEN_MISSING_OR_INVALID', error: 'Approval token is required.' };
    }

    // Parse token structure: sat.{approvalId}.{expiresAtEpoch}.{nonce}.{signature} or sat_{...}
    let tokenApprovalId: string;
    let expiresAtEpochStr: string;
    let nonce: string;
    let tokenSig: string;

    if (token.includes('.')) {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 5 || tokenParts[0] !== 'sat') {
        return { success: false, reason: 'TOKEN_MALFORMED', error: 'Invalid token format.' };
      }
      [, tokenApprovalId, expiresAtEpochStr, nonce, tokenSig] = tokenParts;
    } else if (token.startsWith('sat_')) {
      // Legacy underscore parsing: extract last 3 components (expiresAtEpoch, nonce, signature)
      const parts = token.substring(4).split('_');
      if (parts.length < 3) {
        return { success: false, reason: 'TOKEN_MALFORMED', error: 'Invalid token format.' };
      }
      tokenSig = parts.pop()!;
      nonce = parts.pop()!;
      expiresAtEpochStr = parts.pop()!;
      tokenApprovalId = parts.join('_');
    } else {
      return { success: false, reason: 'TOKEN_MALFORMED', error: 'Invalid token format.' };
    }

    const expiresAtEpoch = parseInt(expiresAtEpochStr, 10);

    if (tokenApprovalId !== approvalId) {
      return { success: false, reason: 'APPROVAL_ID_MISMATCH', error: 'Token approval ID does not match request.' };
    }

    // Expiry check
    if (isNaN(expiresAtEpoch) || Date.now() > expiresAtEpoch) {
      return { success: false, reason: 'TOKEN_EXPIRED', error: 'Approval token has expired.' };
    }

    // Token Hash for anti-replay tracking
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Retrieve approval record
    let record: ApprovalRequestRecord | null = null;
    const supabase = this.dbAdapter.getClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('approval_requests')
          .select('*')
          .eq('approval_id', approvalId)
          .single();

        if (!error && data) {
          record = {
            approvalId: data.approval_id,
            actionType: data.action_type,
            targetService: data.target_service,
            ownerId: data.owner_id,
            requestingAgent: data.requesting_agent,
            payload: data.payload || {},
            payloadHash: data.payload_hash,
            status: data.status,
            token: data.token,
            nonce: data.nonce,
            expiresAt: data.expires_at,
            createdAt: data.created_at,
            consumedAt: data.consumed_at,
            metadata: data.metadata
          };
        }
      } catch {}
    }

    if (!record) {
      record = this.localRequests.get(approvalId) || null;
    }

    if (!record) {
      return { success: false, reason: 'APPROVAL_NOT_FOUND', error: 'Approval request not found.' };
    }

    // Status check
    if (record.status === 'CONSUMED') {
      return { success: false, reason: 'TOKEN_ALREADY_USED', error: 'Approval has already been consumed (Single-use invariant).' };
    }

    if (record.status !== 'PENDING_OWNER_APPROVAL' && record.status !== 'APPROVED') {
      return { success: false, reason: 'INVALID_STATUS', error: `Approval is in state '${record.status}'.` };
    }

    // Owner authorization check
    if (record.ownerId !== ownerId) {
      return { success: false, reason: 'OWNER_MISMATCH', error: 'Approval was not issued for this owner identity.' };
    }

    // Action mismatch check
    if (params.actionType && record.actionType !== params.actionType) {
      return {
        success: false,
        reason: 'ACTION_MISMATCH',
        error: `Action mismatch: expected '${record.actionType}', got '${params.actionType}'.`
      };
    }

    // Target service check
    if (params.targetService && record.targetService !== params.targetService) {
      return {
        success: false,
        reason: 'SERVICE_MISMATCH',
        error: `Service mismatch: expected '${record.targetService}', got '${params.targetService}'.`
      };
    }

    // Exact payload binding check
    if (params.payload) {
      const currentPayloadHash = computeCanonicalPayloadHash(params.payload);
      if (record.payloadHash !== currentPayloadHash) {
        return {
          success: false,
          reason: 'PAYLOAD_HASH_MISMATCH_TAMPERED',
          error: 'Payload tampering detected: Payload does not match authorized approval digest.'
        };
      }
    }

    // Cryptographic signature verification
    const expectedSig = this.generateTokenSignature(
      approvalId,
      record.actionType,
      record.targetService,
      record.ownerId,
      record.payloadHash,
      expiresAtEpoch,
      nonce
    );

    if (
      tokenSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(tokenSig), Buffer.from(expectedSig))
    ) {
      return { success: false, reason: 'INVALID_TOKEN_SIGNATURE', error: 'Cryptographic token signature verification failed.' };
    }

    // Anti-replay and atomic state transition
    // 1. If Supabase is available, execute atomic PostgreSQL RPC transaction with FOR UPDATE row lock
    if (supabase) {
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('consume_approval_atomic', {
          p_approval_id: approvalId,
          p_token_hash: tokenHash,
          p_owner_id: ownerId,
          p_action_type: params.actionType || record.actionType,
          p_target_service: params.targetService || record.targetService,
          p_payload_hash: record.payloadHash,
          p_consumer_identity: params.consumerIdentity || 'owner_api',
          p_current_epoch_ms: Date.now()
        });

        if (rpcError) {
          return { success: false, reason: 'DATABASE_ERROR', error: rpcError.message };
        }

        if (rpcResult && typeof rpcResult === 'object') {
          return rpcResult as ConsumeResult;
        }
      } catch (err: any) {
        if (this.config.NODE_ENV === 'production') {
          return { success: false, reason: 'DATABASE_ERROR', error: err.message };
        }
      }
    }

    // 2. Offline / Local in-memory atomic critical section
    if (this.localConsumptions.has(tokenHash)) {
      return { success: false, reason: 'TOKEN_ALREADY_USED', error: 'Token replay detected (Local anti-replay invariant).' };
    }

    this.localConsumptions.add(tokenHash);
    record.status = 'CONSUMED';
    record.consumedAt = new Date().toISOString();
    record.consumedBy = params.consumerIdentity || 'owner_api';

    return {
      success: true,
      approvalId,
      status: 'CONSUMED',
      authorizedAt: record.consumedAt
    };
  }
}
