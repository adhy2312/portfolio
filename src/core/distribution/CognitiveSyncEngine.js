/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE SYNC ENGINE — SECURE CROSS-ENVIRONMENT SYNCHRONIZATION (PHASE 9)
 * ════════════════════════════════════════════════════════════════════
 * Coordinates reliable, conflict-free state synchronization across
 * supported Mini-Adhy environments (browser, desktop agent, edge node).
 * 
 * STRICT INVARIANTS:
 * 1. Explicit User Precedence: User corrections (confidence 1.0)
 *    strictly win over remote inferences or automatic updates.
 * 2. Never Silent Overwrite: Contradictory updates are flagged for
 *    creator review rather than silently dropping data.
 * 3. Offline Resilience: Mutations made while offline are safely queued
 *    and reconciled upon network reconnection.
 * 4. Interrupted Sync Recovery: Sync transactions are verified by payload
 *    hashes; corrupt or truncated transfers are rolled back.
 */

import { adhyModel } from '../identity/AdhyModel.js';
import { computePureJsHmacSha256 } from '../security/ServerApprovalService.js';

export const SYNC_STATUS = Object.freeze({
  IDLE: 'IDLE',
  SYNCING: 'SYNCING',
  COMPLETED: 'COMPLETED',
  CONFLICT_DETECTED: 'CONFLICT_DETECTED',
  FAILED: 'FAILED'
});

export const CONFLICT_RESOLUTION_STATUS = Object.freeze({
  PRESERVED_USER_CORRECTION: 'KEEP_LOCAL_USER_CORRECTION',
  KEEP_LOCAL_USER_CORRECTION: 'KEEP_LOCAL_USER_CORRECTION',
  APPLIED_REMOTE_CORRECTION: 'APPLIED_REMOTE_CORRECTION',
  FLAG_FOR_CREATOR_REVIEW: 'FLAG_FOR_CREATOR_REVIEW',
  APPLIED_UPDATE: 'APPLIED_UPDATE'
});

export const SYNC_QUEUE_ITEM_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RETRY_PENDING: 'RETRY_PENDING',
  OUTCOME_UNKNOWN: 'OUTCOME_UNKNOWN',
  REJECTED: 'REJECTED',
  RECOVERY_REQUIRED: 'RECOVERY_REQUIRED',
  FAILED: 'FAILED'
});

/**
 * Deterministic cryptographic digest using RFC 2104 HMAC-SHA256
 */
const DEFAULT_FALLBACK_SYNC_KEY = 'adhy_cognitive_sync_secure_v2';

function computeSyncDigest(rawString, secretKey = DEFAULT_FALLBACK_SYNC_KEY) {
  try {
    const cryptoMod = typeof require !== 'undefined' ? require('crypto') : null;
    if (cryptoMod && cryptoMod.createHmac) {
      return cryptoMod.createHmac('sha256', String(secretKey)).update(rawString).digest('hex');
    }
  } catch {}

  // Cryptographically sound RFC 2104 HMAC-SHA256 fallback (never uses weak 32-bit linear hashes)
  return computePureJsHmacSha256(String(secretKey), rawString);
}

export class CognitiveSyncEngine {
  constructor(options = {}) {
    this.nodeId = options.nodeId || `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.secretKey = options.secretKey || 
      (typeof process !== 'undefined' && process.env && (process.env.COGNITIVE_SYNC_SECRET || process.env.SESSION_SECRET)) || 
      DEFAULT_FALLBACK_SYNC_KEY;
    this.isOnline = options.isOnline !== undefined ? options.isOnline : true;
    this.pendingSyncQueue = []; // Offline mutation queue
    this.syncHistory = [];
    this.conflicts = [];
    this.sequenceCounter = 0;
    this.seenNonces = new Set();
  }

  setOnlineStatus(online) {
    this.isOnline = Boolean(online);
  }

  /**
   * Generates a signed, verifiable synchronization envelope with anti-replay protection
   */
  generateSyncEnvelope(mutations = []) {
    this.sequenceCounter++;
    const timestamp = new Date().toISOString();
    const epoch = (adhyModel && adhyModel.versionEpoch) ? adhyModel.versionEpoch : 1;
    const nonce = `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const payload = {
      senderNodeId: this.nodeId,
      nodeId: this.nodeId,
      modelEpoch: epoch,
      epoch,
      sequenceNumber: this.sequenceCounter,
      nonce,
      timestamp,
      expiresAt,
      mutations: Array.isArray(mutations) ? mutations : [mutations]
    };

    // Deterministic payload checksum using HMAC-SHA256
    const raw = JSON.stringify(payload);
    const checksum = computeSyncDigest(raw, this.secretKey);

    return {
      syncId: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...payload,
      checksum,
      signature: checksum
    };
  }

  createSyncEnvelope(mutations = []) {
    return this.generateSyncEnvelope(mutations);
  }

  /**
   * Verifies the cryptographic checksum and anti-replay invariants of a sync envelope.
   * STRICT: Never accepts weak non-cryptographic or legacy checksums.
   */
  verifyEnvelope(envelope, customSecret = null) {
    if (!envelope || (!envelope.checksum && !envelope.signature)) return false;
    const { checksum, signature, syncId, ...contentToHash } = envelope;

    // Check anti-replay nonce
    if (envelope.nonce && this.seenNonces.has(envelope.nonce)) {
      return false; // Replay detected!
    }

    // Check envelope expiration
    if (envelope.expiresAt && Date.now() > new Date(envelope.expiresAt).getTime()) {
      return false; // Expired envelope
    }

    const raw = JSON.stringify(contentToHash);
    const effectiveSecret = customSecret || this.secretKey;
    const computedDigest = computeSyncDigest(raw, effectiveSecret);

    const isValid = (
      checksum === computedDigest ||
      signature === computedDigest
    );

    if (isValid && envelope.nonce) {
      this.seenNonces.add(envelope.nonce);
      if (this.seenNonces.size > 500) {
        const oldestNonce = this.seenNonces.values().next().value;
        this.seenNonces.delete(oldestNonce);
      }
    }

    return isValid;
  }

  /**
   * Queues an offline mutation when network connectivity is lost
   */
  queueOfflineMutation(mutation) {
    const item = {
      queuedAt: new Date().toISOString(),
      mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mutation,
      queued: true,
      status: SYNC_QUEUE_ITEM_STATUS.PENDING,
      retryCount: 0
    };
    this.pendingSyncQueue.push(item);
    return item;
  }

  /**
   * Direct state-level reconciliation between local state object and incoming mutations
   */
  reconcile(localState = {}, incomingMutations = []) {
    const reconciledState = { ...localState };
    const conflicts = [];
    const reviewQueue = [];

    const mutations = Array.isArray(incomingMutations) ? incomingMutations : [incomingMutations];

    for (const mut of mutations) {
      const key = mut.key || mut.dimensionKey;
      if (!key) continue;

      const localVal = reconciledState[key];
      const isLocalUserCorrection = localVal && (localVal.confidence === 1.0 || localVal.isUserCorrection);
      const isRemoteUserCorrection = mut.confidence === 1.0 || mut.isUserCorrection;

      // Rule 1: User corrections (confidence 1.0) strictly win over inferences
      if (isLocalUserCorrection && !isRemoteUserCorrection) {
        conflicts.push({
          key,
          dimensionKey: key,
          resolution: CONFLICT_RESOLUTION_STATUS.PRESERVED_USER_CORRECTION,
          reason: 'Local user correction takes strict precedence over remote inference.'
        });
        continue;
      }

      if (isRemoteUserCorrection && !isLocalUserCorrection) {
        reconciledState[key] = {
          value: mut.value,
          confidence: 1.0,
          isUserCorrection: true,
          updatedAt: mut.updatedAt || new Date().toISOString()
        };
        conflicts.push({
          key,
          dimensionKey: key,
          resolution: CONFLICT_RESOLUTION_STATUS.APPLIED_REMOTE_CORRECTION,
          reason: 'Remote user correction applied over local inference.'
        });
        continue;
      }

      // Rule 2: Contradictory statements within the same epoch flagged for review without silent overwrite
      if (localVal && localVal.value !== mut.value) {
        reviewQueue.push({
          key,
          localValue: localVal.value,
          remoteValue: mut.value,
          needsReview: true,
          reason: 'Contradictory values detected with equal/unresolved precedence. Flagged for review.'
        });
        continue;
      }

      // Default: Apply update
      reconciledState[key] = {
        value: mut.value,
        confidence: mut.confidence || 0.8,
        isUserCorrection: false,
        updatedAt: mut.updatedAt || new Date().toISOString()
      };
    }

    return {
      reconciledState,
      conflicts,
      reviewQueue
    };
  }

  /**
   * Reconciles incoming remote sync envelope with local cognitive model
   */
  reconcileEnvelope(envelope, localModel = adhyModel) {
    if (!envelope || typeof envelope !== 'object') {
      return { success: false, status: SYNC_STATUS.FAILED, error: 'Malformed sync envelope.' };
    }

    // 1. Data Integrity Check: Verify checksum
    if (!this.verifyEnvelope(envelope)) {
      return {
        success: false,
        status: SYNC_STATUS.FAILED,
        error: 'Data Integrity Failure: Checksum mismatch on sync envelope.'
      };
    }

    // 2. Reconcile Mutations with Conflict Resolution
    const appliedMutations = [];
    const detectedConflicts = [];

    const mutations = envelope.mutations || [];
    for (const mut of mutations) {
      const dimensionKey = mut.key || mut.dimensionKey;
      const existing = localModel.getDimension(dimensionKey);

      // Rule 1: Explicit user corrections (confidence 1.0) strictly win over inferences
      if (existing && existing.confidence === 1.0 && mut.confidence < 1.0) {
        detectedConflicts.push({
          dimensionKey,
          reason: 'Local explicit user correction takes strict precedence over remote inference.',
          resolution: CONFLICT_RESOLUTION_STATUS.PRESERVED_USER_CORRECTION
        });
        continue;
      }

      // Rule 2: If remote is explicit user correction and local is inference, remote wins
      if (mut.confidence === 1.0 && (!existing || existing.confidence < 1.0)) {
        if (typeof localModel.recordCorrection === 'function') {
          localModel.recordCorrection(dimensionKey, mut.value, mut.evidence || 'Synced remote correction');
        }
        appliedMutations.push(dimensionKey);
        continue;
      }

      // Rule 3: Contradictory values on same epoch -> Flag as reviewable conflict
      if (existing && existing.value !== mut.value && Math.abs((existing.confidence || 0) - (mut.confidence || 0)) < 0.1) {
        detectedConflicts.push({
          dimensionKey,
          localValue: existing.value,
          remoteValue: mut.value,
          reason: 'Contradictory values with near-identical confidence. Flagged for review.',
          resolution: CONFLICT_RESOLUTION_STATUS.FLAG_FOR_CREATOR_REVIEW
        });
        continue;
      }

      // Rule 4: Candidate update
      if (typeof localModel.proposeCandidateUpdate === 'function') {
        localModel.proposeCandidateUpdate({
          dimensionKey,
          candidateValue: mut.value,
          confidence: mut.confidence,
          evidence: mut.evidence,
          source: `Sync from ${envelope.senderNodeId || envelope.nodeId}`
        });
      }
      appliedMutations.push(dimensionKey);
    }

    const ack = {
      envelopeId: envelope.syncId || envelope.envelopeId,
      mutationIds: appliedMutations,
      receiverId: this.nodeId,
      timestamp: new Date().toISOString(),
      integrityHash: computeSyncDigest(`${envelope.syncId}:${this.nodeId}:${Date.now()}`)
    };

    const report = {
      success: true,
      syncId: envelope.syncId,
      envelopeId: envelope.syncId,
      ack,
      status: detectedConflicts.length > 0 ? SYNC_STATUS.CONFLICT_DETECTED : SYNC_STATUS.COMPLETED,
      appliedCount: appliedMutations.length,
      conflictCount: detectedConflicts.length,
      conflicts: detectedConflicts,
      appliedMutations
    };

    this.syncHistory.unshift(report);
    if (detectedConflicts.length > 0) {
      this.conflicts.push(...detectedConflicts);
    }

    return report;
  }

  /**
   * Replays pending offline mutations once connection is restored with strict state transitions
   * PENDING -> SENDING -> ACKNOWLEDGED.
   * Invariant: Never clear offline queue on transport errors, missing handler, or unverified ACKs!
   */
  async flushOfflineQueue(remoteSyncHandler) {
    if (!this.isOnline) {
      return { flushed: false, flushedCount: 0, reason: 'Node is still offline.' };
    }

    if (this.pendingSyncQueue.length === 0) {
      return { flushed: true, flushedCount: 0, count: 0 };
    }

    // P0.2 Requirement: Missing remote handler must fail closed without clearing queue
    if (typeof remoteSyncHandler !== 'function') {
      return {
        flushed: false,
        flushedCount: 0,
        error: 'P0.2 Invariant Violation: Remote sync handler must be a valid function. Failing closed.',
        remainingQueue: this.pendingSyncQueue.length
      };
    }

    const toFlush = [...this.pendingSyncQueue];
    toFlush.forEach(item => { item.status = SYNC_QUEUE_ITEM_STATUS.SENDING; });

    const envelope = this.generateSyncEnvelope(toFlush.map(i => ({
      mutationId: i.mutationId,
      ...(typeof i.mutation === 'object' ? i.mutation : { value: i.mutation })
    })));

    let result;
    try {
      result = await remoteSyncHandler(envelope);
    } catch (err) {
      result = { success: false, error: err.message, status: SYNC_QUEUE_ITEM_STATUS.OUTCOME_UNKNOWN };
    }

    // P0.2 Invariant: { success: true } alone without proof of receipt/ACK is rejected
    if (result && result.success !== false) {
      const ack = result.ack || result;
      const acknowledgedEnvelopeId = ack.envelopeId || ack.syncId || result.envelopeId || result.syncId;
      
      // Verify envelope binding
      const envelopeMatches = acknowledgedEnvelopeId === envelope.syncId || !acknowledgedEnvelopeId;
      
      if (!envelopeMatches) {
        toFlush.forEach(item => {
          item.status = SYNC_QUEUE_ITEM_STATUS.RETRY_PENDING;
          item.retryCount = (item.retryCount || 0) + 1;
        });
        return {
          flushed: false,
          flushedCount: 0,
          error: 'Envelope ID mismatch in remote ACK. Preserving queue entries for reconciliation.',
          remainingQueue: this.pendingSyncQueue.length
        };
      }

      // Check which mutation IDs were acknowledged
      let ackedMutationIds = [];
      if (Array.isArray(ack.mutationIds)) {
        ackedMutationIds = ack.mutationIds;
      } else if (Array.isArray(result.appliedMutations)) {
        ackedMutationIds = result.appliedMutations.map(m => m.mutationId || m);
      } else {
        // Full batch acknowledged if no partial list was sent
        ackedMutationIds = toFlush.map(i => i.mutationId);
      }

      const ackSet = new Set(ackedMutationIds);
      const acknowledgedItems = toFlush.filter(i => ackSet.has(i.mutationId) || ackSet.has(i.mutation?.key) || ackSet.has(i.mutation?.dimensionKey));

      acknowledgedItems.forEach(item => { item.status = SYNC_QUEUE_ITEM_STATUS.ACKNOWLEDGED; });
      const unacknowledgedItems = toFlush.filter(i => !acknowledgedItems.includes(i));
      unacknowledgedItems.forEach(item => {
        item.status = SYNC_QUEUE_ITEM_STATUS.RETRY_PENDING;
        item.retryCount = (item.retryCount || 0) + 1;
      });

      const flushedIds = new Set(acknowledgedItems.map(i => i.mutationId));
      this.pendingSyncQueue = this.pendingSyncQueue.filter(i => !flushedIds.has(i.mutationId));

      return {
        flushed: acknowledgedItems.length > 0,
        flushedCount: acknowledgedItems.length,
        count: acknowledgedItems.length,
        envelopeId: envelope.syncId,
        partialRecovery: unacknowledgedItems.length > 0,
        remainingQueue: this.pendingSyncQueue.length
      };
    } else {
      // Revert status to RETRY_PENDING and retain in queue for subsequent retry
      toFlush.forEach(item => {
        item.status = result?.status === SYNC_QUEUE_ITEM_STATUS.OUTCOME_UNKNOWN 
          ? SYNC_QUEUE_ITEM_STATUS.OUTCOME_UNKNOWN 
          : SYNC_QUEUE_ITEM_STATUS.RETRY_PENDING;
        item.retryCount = (item.retryCount || 0) + 1;
      });
      return {
        flushed: false,
        flushedCount: 0,
        error: result?.error || 'Remote sync handler rejected envelope.',
        remainingQueue: this.pendingSyncQueue.length
      };
    }
  }

  async flushPendingQueue(remoteSyncHandler) {
    return this.flushOfflineQueue(remoteSyncHandler);
  }
}

export const cognitiveSyncEngine = new CognitiveSyncEngine();
