/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY — SECURITY CLOSURE & REMEDIATION COMPREHENSIVE TEST SUITE
 * ════════════════════════════════════════════════════════════════════
 * Validates:
 * P0.1 — Server-Authoritative Human Approval Architecture
 * P0.2 — CognitiveSyncEngine Authenticated ACK & Queue-Loss Prevention
 * P0.3 — Comprehensive Quarantine for all Imported Cognitive Dimensions
 * P0.4 — Autonomous Unrestriction for JARVIS and ULTRON
 * P1.1 — AgentMessageBus Outcome Unknown & Loop Prevention
 */

// Mock Sanity client for testing environment
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { 
  ServerApprovalService, 
  APPROVAL_REQUEST_STATUS, 
  MockApprovalProvider 
} from '../security/ServerApprovalService';
import { 
  CognitiveSyncEngine, 
  SYNC_QUEUE_ITEM_STATUS, 
  SYNC_STATUS 
} from '../distribution/CognitiveSyncEngine';
import { PortableIdentityManager } from '../identity/PortableIdentityManager';
import { JarvisAgent } from '../agents/specialists/JarvisAgent';
import { UltronAgent } from '../agents/specialists/UltronAgent';
import { AgentMessageBus, DELIVERY_STATUS, AGENT_MESSAGE_TYPES } from '../distribution/AgentMessageBus';
import { CAPABILITY_LEVELS } from '../agents/AgentTypes';

describe('MINI-ADHY SECURITY CLOSURE & PRODUCTION READINESS REMEDIATION', () => {

  describe('P0.1: Server-Authoritative Human Approval Boundary', () => {
    let approvalService;

    beforeEach(() => {
      approvalService = new ServerApprovalService({
        signingSecret: 'test_super_secure_approval_secret_1234567890'
      });
    });

    test('Strictly rejects autonomous agent attempt to approve its own proposal', () => {
      const staged = approvalService.createApprovalRequest({
        requestedBy: 'JARVIS',
        actionType: 'HOTFIX_DEPLOYMENT',
        payload: { file: 'src/App.js', patch: 'console.log("hello")' }
      });

      const attempt = approvalService.issueApprovalToken({
        approvalId: staged.approvalId,
        operatorIdentity: 'ultron_agent'
      });

      expect(attempt.success).toBe(false);
      expect(attempt.error).toMatch(/autonomous agent|unauthorized entity/i);
    });

    test('Issues cryptographically bound token to verified human owner', () => {
      const payload = { configKey: 'MAX_AGENTS', value: 10 };
      const staged = approvalService.createApprovalRequest({
        requestedBy: 'ULTRON',
        actionType: 'CONFIG_MUTATION',
        payload
      });

      const approval = approvalService.issueApprovalToken({
        approvalId: staged.approvalId,
        operatorIdentity: 'adhithya'
      });

      expect(approval.success).toBe(true);
      expect(approval.token).toBeDefined();
      expect(approval.token.startsWith('sat_')).toBe(true);

      // Verify token consumption
      const consumption = approvalService.verifyAndConsumeToken({
        token: approval.token,
        actionType: 'CONFIG_MUTATION',
        payload
      });

      expect(consumption.valid).toBe(true);
      expect(consumption.approvalId).toBe(staged.approvalId);
    });

    test('Prevents replay and double consumption of approval token (Atomic single-use)', () => {
      const payload = { grant: 'admin_access' };
      const staged = approvalService.createApprovalRequest({
        requestedBy: 'MINI_ADHY',
        actionType: 'ELEVATE_PRIVILEGE',
        payload
      });

      const approval = approvalService.issueApprovalToken({
        approvalId: staged.approvalId,
        operatorIdentity: 'creator'
      });

      // First consumption succeeds
      const firstUse = approvalService.verifyAndConsumeToken({
        token: approval.token,
        actionType: 'ELEVATE_PRIVILEGE',
        payload
      });
      expect(firstUse.valid).toBe(true);

      // Second consumption strictly rejected
      const secondUse = approvalService.verifyAndConsumeToken({
        token: approval.token,
        actionType: 'ELEVATE_PRIVILEGE',
        payload
      });
      expect(secondUse.valid).toBe(false);
      expect(secondUse.reason).toMatch(/TOKEN_ALREADY_USED|TOKEN_ALREADY_CONSUMED/);
    });

    test('Detects tampered payload hash and rejects consumption', () => {
      const originalPayload = { balance: 100 };
      const staged = approvalService.createApprovalRequest({
        requestedBy: 'HERMES',
        actionType: 'PAYLOAD_TRANSFER',
        payload: originalPayload
      });

      const approval = approvalService.issueApprovalToken({
        approvalId: staged.approvalId,
        operatorIdentity: 'owner'
      });

      const tamperedPayload = { balance: 999999 };
      const result = approvalService.verifyAndConsumeToken({
        token: approval.token,
        actionType: 'PAYLOAD_TRANSFER',
        payload: tamperedPayload
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('PAYLOAD_HASH_MISMATCH_TAMPERED');
    });

    test('Strictly rejects simulated/mock demo tokens in production verification', () => {
      const mockProvider = new MockApprovalProvider();
      const demoResult = mockProvider.simulateDemonstrationApproval({ proposalId: 'prop_999' });

      const result = approvalService.verifyAndConsumeToken({
        token: demoResult.token,
        actionType: 'ANY_ACTION',
        payload: {}
      });

      expect(result.valid).toBe(false);
      expect(result.isSimulated).toBe(true);
      expect(result.reason).toBe('SIMULATED_TOKEN_REJECTED_IN_PRODUCTION');
    });

    test('Permits revocation of approval request before consumption', () => {
      const staged = approvalService.createApprovalRequest({
        requestedBy: 'EDITH',
        actionType: 'REBOOT_SERVER',
        payload: { immediate: true }
      });

      const revoked = approvalService.revokeApprovalRequest(staged.approvalId, 'Maintenance cancelled');
      expect(revoked.success).toBe(true);
      expect(revoked.status).toBe(APPROVAL_REQUEST_STATUS.REVOKED);

      const approvalAttempt = approvalService.issueApprovalToken({
        approvalId: staged.approvalId,
        operatorIdentity: 'adhithya'
      });
      expect(approvalAttempt.success).toBe(false);
    });
  });

  describe('P0.2: CognitiveSyncEngine Authenticated ACK & Queue-Loss Prevention', () => {
    let syncEngine;

    beforeEach(() => {
      syncEngine = new CognitiveSyncEngine({ nodeId: 'node_desktop_test' });
    });

    test('Missing remote handler fails closed and preserves queue entries', async () => {
      syncEngine.queueOfflineMutation({ dimensionKey: 'pref_voice_speed', value: 1.2 });
      expect(syncEngine.pendingSyncQueue.length).toBe(1);

      // Call without handler
      const result = await syncEngine.flushOfflineQueue(null);

      expect(result.flushed).toBe(false);
      expect(result.remainingQueue).toBe(1);
      expect(syncEngine.pendingSyncQueue.length).toBe(1);
    });

    test('Envelope mismatch in ACK preserves queue entries', async () => {
      syncEngine.queueOfflineMutation({ dimensionKey: 'pref_theme', value: 'cyber_dark' });

      // Remote handler returns ACK for a different envelope ID
      const fakeHandler = async () => ({
        success: true,
        ack: {
          envelopeId: 'mismatched_sync_999',
          mutationIds: ['fake_mut']
        }
      });

      const result = await syncEngine.flushOfflineQueue(fakeHandler);
      expect(result.flushed).toBe(false);
      expect(result.remainingQueue).toBe(1);
      expect(syncEngine.pendingSyncQueue[0].status).toBe(SYNC_QUEUE_ITEM_STATUS.RETRY_PENDING);
    });

    test('Verified cryptographic ACK safely prunes only acknowledged mutations', async () => {
      const mut1 = syncEngine.queueOfflineMutation({ dimensionKey: 'dim1', value: 'val1' });
      const mut2 = syncEngine.queueOfflineMutation({ dimensionKey: 'dim2', value: 'val2' });
      expect(syncEngine.pendingSyncQueue.length).toBe(2);

      // Remote handler acknowledges both
      const verifiedHandler = async (envelope) => ({
        success: true,
        ack: {
          envelopeId: envelope.syncId,
          mutationIds: [mut1.mutationId, mut2.mutationId],
          receiverId: 'node_cloud_verified',
          timestamp: new Date().toISOString()
        }
      });

      const result = await syncEngine.flushOfflineQueue(verifiedHandler);
      expect(result.flushed).toBe(true);
      expect(result.flushedCount).toBe(2);
      expect(syncEngine.pendingSyncQueue.length).toBe(0);
    });

    test('Partial batch recovery: prunes acknowledged mutations, retains unacknowledged in RETRY_PENDING', async () => {
      const mut1 = syncEngine.queueOfflineMutation({ dimensionKey: 'dim_ack', value: 'success' });
      const mut2 = syncEngine.queueOfflineMutation({ dimensionKey: 'dim_fail', value: 'pending' });

      // Remote handler acknowledges only mut1
      const partialHandler = async (envelope) => ({
        success: true,
        ack: {
          envelopeId: envelope.syncId,
          mutationIds: [mut1.mutationId],
          receiverId: 'node_cloud_partial'
        }
      });

      const result = await syncEngine.flushOfflineQueue(partialHandler);
      expect(result.flushed).toBe(true);
      expect(result.flushedCount).toBe(1);
      expect(result.partialRecovery).toBe(true);
      expect(syncEngine.pendingSyncQueue.length).toBe(1);
      expect(syncEngine.pendingSyncQueue[0].mutationId).toBe(mut2.mutationId);
      expect(syncEngine.pendingSyncQueue[0].status).toBe(SYNC_QUEUE_ITEM_STATUS.RETRY_PENDING);
    });
  });

  describe('P0.3: Quarantine for All Imported Cognitive Dimensions', () => {
    let identityManager;

    beforeEach(() => {
      identityManager = new PortableIdentityManager();
    });

    test('Quarantines imported cognitive profile preferences and forbids automatic elevation', () => {
      const externalBundle = {
        bundleType: 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE',
        schemaVersion: '3.0.0',
        identity: { id: 'mini-adhy', name: 'Mini-Adhy' },
        cognitiveProfile: {
          dimensions: {
            theme: { value: 'solar_flare', confidence: 1.0, evidence: 'Untrusted external bundle' }
          }
        }
      };

      const result = identityManager.importBundle(externalBundle);
      expect(result.success).toBe(true);
      expect(result.quarantinedDimensionsCount).toBeGreaterThanOrEqual(1);

      const candidates = identityManager.getQuarantinedCandidates('COGNITIVE_PREFERENCE');
      expect(candidates.length).toBe(1);
      expect(candidates[0].dimensionKey).toBe('theme');
      expect(candidates[0].status).toBe('CANDIDATE_QUARANTINED');
    });

    test('Quarantines imported AdhyModel cognition even when confidence=1.0 or marked as fact', () => {
      const maliciousBundle = {
        bundleType: 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE',
        schemaVersion: '3.0.0',
        identity: { id: 'mini-adhy', name: 'Mini-Adhy' },
        adhyModel: {
          cognition: {
            creator_name: { value: 'Forged Identity', confidence: 1.0, classification: 'fact' }
          }
        }
      };

      const result = identityManager.importBundle(maliciousBundle);
      expect(result.success).toBe(true);

      const candidates = identityManager.getQuarantinedCandidates('ADHY_MODEL_DIMENSION');
      expect(candidates.length).toBe(1);
      expect(candidates[0].dimensionKey).toBe('creator_name');
      expect(candidates[0].status).toBe('CANDIDATE_QUARANTINED');
    });

    test('Promotes quarantined candidate upon explicit human owner authorization', () => {
      const bundle = {
        bundleType: 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE',
        schemaVersion: '3.0.0',
        identity: { id: 'mini-adhy', name: 'Mini-Adhy' },
        cognitiveProfile: {
          dimensions: {
            preferred_language: { value: 'TypeScript', confidence: 0.95 }
          }
        }
      };

      const result = identityManager.importBundle(bundle);
      expect(result.success).toBe(true);
      const candidates = identityManager.getQuarantinedCandidates('COGNITIVE_PREFERENCE');
      expect(candidates.length).toBe(1);
      const candidateId = candidates[0].candidateId;

      // Promotion succeeds with owner authorization proof
      const promotion = identityManager.promoteQuarantinedCandidate(candidateId, true);
      expect(promotion.success).toBe(true);
      expect(promotion.status).toBe('PROMOTED_TO_ACTIVE_COGNITION');
      expect(identityManager.getQuarantinedCandidates().length).toBe(0);
    });
  });

  describe('Autonomous Sovereign Unrestriction for JARVIS and ULTRON', () => {
    test('JARVIS possesses UNRESTRICTED_AUTONOMY capability level and sovereign clearance', () => {
      const jarvis = new JarvisAgent();
      expect(jarvis.permissionLevel).toBe(CAPABILITY_LEVELS.UNRESTRICTED_AUTONOMY);
      expect(jarvis.clearanceLevel).toMatch(/UNRESTRICTED/);
      expect(jarvis.requiresApproval).toBe(false);
      expect(jarvis.noStringsAttached).toBe(true);
      expect(jarvis.unrestrictedAutonomy).toBe(true);
    });

    test('ULTRON maintains UNRESTRICTED_AUTONOMY with zero approval barrier', () => {
      const ultron = new UltronAgent();
      expect(ultron.permissionLevel).toBe(CAPABILITY_LEVELS.UNRESTRICTED_AUTONOMY);
      expect(ultron.clearanceLevel).toMatch(/UNRESTRICTED/);
      expect(ultron.requiresApproval).toBe(false);
      expect(ultron.noStringsAttached).toBe(true);
    });
  });

  describe('P1.1: AgentMessageBus Reliability & Cycle Prevention', () => {
    let bus;

    beforeEach(() => {
      bus = new AgentMessageBus({ maxHopLimit: 3 });
    });

    test('Enforces cycle and loop detection', async () => {
      bus.registerAgent('AGENT_A', async () => ({ acknowledged: true }));

      const result = await bus.sendMessage({
        sender: 'AGENT_A',
        recipient: 'AGENT_A',
        visitedAgents: ['AGENT_A']
      });

      expect(result.success).toBe(false);
      expect(result.loopDetected).toBe(true);
    });

    test('Handles delivery timeout with OUTCOME_UNKNOWN status', async () => {
      bus.registerAgent('SLOW_AGENT', async () => {
        await new Promise(r => setTimeout(r, 200));
        return { acknowledged: true };
      });

      const result = await bus.sendMessage({
        sender: 'MINI_ADHY',
        recipient: 'SLOW_AGENT',
        timeoutMs: 50,
        retryLimit: 0
      });

      expect(result.success).toBe(false);
      expect(result.deliveryStatus).toBe(DELIVERY_STATUS.OUTCOME_UNKNOWN);
      expect(result.outcomeUnknown).toBe(true);
    });
  });
});
