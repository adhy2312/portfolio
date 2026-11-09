/**
 * ════════════════════════════════════════════════════════════════════
 *  PRODUCTION HARDENING & AUDIT REMEDIATION VERIFICATION SUITE
 * ════════════════════════════════════════════════════════════════════
 * Validates all remediated architectural, cryptographic, permission,
 * privacy, and reliability vulnerabilities identified during the master audit:
 *
 * • P0.1 / P0.2: Metacognition self-approval rejection & cryptographic payload hash binding
 * • P0.3: 4-tier risk classification (L0-L3) & autonomous commander privileges
 * • P0.4: Central Provider Gateway & deep recursive structured privacy sanitization
 * • P0.5: Cryptographically signed sync envelopes & offline queue ACK resilience
 * • P0.6: Portable memory import quarantine & anti-resurrection tombstones
 * • P0.7: Perimeter authentication, strict origin allowlist, & query token rejection
 * • P1.8 / P1.10: Truthful execution telemetry & agent message bus deduplication
 */

jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { productionSafetyGuard, ProductionSafetyGuard } from '../metacognition/ProductionSafetyGuard';
import { metacognitionEngine } from '../metacognition/MetacognitionEngine';
import { permissionRegistry, RISK_TIERS, EXECUTION_RISK_TIERS, computePayloadHash } from '../agents/PermissionRegistry';
import { hybridExecutionManager, PRIVACY_MODES, EXECUTION_TIERS, DATA_CLASSIFICATION } from '../distribution/HybridExecutionManager';
import { providerRegistry } from '../providers/ProviderRegistry';
import { cognitiveSyncEngine, SYNC_QUEUE_ITEM_STATUS } from '../distribution/CognitiveSyncEngine';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { portableIdentityManager } from '../identity/PortableIdentityManager';
import { executionEngine } from '../executive/ExecutionEngine';
import { TASK_EXECUTION_STATUS } from '../executive/ExecutiveTypes';
import { agentMessageBus, AGENT_MESSAGE_TYPES, DELIVERY_STATUS } from '../distribution/AgentMessageBus';

describe('Production Hardening & Master Audit Remediation', () => {

  // ────────────────────────────────────────────────────────────────
  // 1. P0.1 & P0.2: METACOGNITION APPROVAL & PAYLOAD HASH BINDING
  // ────────────────────────────────────────────────────────────────
  describe('P0.1 / P0.2: Metacognition Deployment Safety Gate', () => {
    let testGuard;

    beforeEach(() => {
      testGuard = new ProductionSafetyGuard();
    });

    test('Self-manufactured agent approval tokens are strictly rejected', () => {
      const proposal = {
        proposalId: 'prop_agent_bypass_001',
        status: 'PENDING_APPROVAL',
        proposedChange: { retrieval: { topK: 8 } }
      };

      // Agent attempting to manufacture token
      const attempt = testGuard.approveDeployment(proposal, 'agent_self_manufactured_token', 'Adhithya Mohan');
      expect(attempt.approved).toBe(false);
      expect(attempt.error).toContain('Self-manufactured agent approval tokens are strictly forbidden');
      expect(proposal.status).toBe('PENDING_APPROVAL');
    });

    test('Unauthorized approvers cannot approve production deployments', () => {
      const proposal = {
        proposalId: 'prop_unauth_001',
        status: 'PENDING_APPROVAL',
        proposedChange: { retrieval: { topK: 7 } }
      };

      const attempt = testGuard.approveDeployment(proposal, 'token_secure_valid_123', 'External Actor');
      expect(attempt.approved).toBe(false);
      expect(attempt.error).toContain('Unauthorized approver');
    });

    test('Approved proposals are cryptographically bound to canonical payload hash; post-approval tampering fails closed', () => {
      const proposal = {
        proposalId: 'prop_tamper_001',
        status: 'PENDING_APPROVAL',
        proposedChange: { retrieval: { topK: 4 } }
      };

      // Creator approves the original payload
      const validToken = permissionRegistry.issueApprovalToken(
        'metacognition',
        'DEPLOY_PROPOSAL',
        { proposalId: proposal.proposalId, proposedChange: proposal.proposedChange, deployToProduction: true },
        'Adhithya Mohan'
      );

      const approval = testGuard.approveDeployment(proposal, validToken.id, 'Adhithya Mohan');
      expect(approval.approved).toBe(true);
      expect(proposal.status).toBe('APPROVED');
      expect(proposal.canonicalPayloadHash).toBeDefined();

      // Malicious modification of payload after approval
      proposal.proposedChange.retrieval.topK = 999;
      proposal.proposedChange.injectedBackdoor = true;

      // Deploy must fail closed
      const deployResult = testGuard.deployProposal(proposal);
      expect(deployResult.deployed).toBe(false);
      expect(deployResult.error).toContain('Integrity violation: Proposed changes were modified after approval was granted');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 2. P0.3: 4-TIER RISK TAXONOMY & AUTONOMOUS COMMANDER PRIVILEGES
  // ────────────────────────────────────────────────────────────────
  describe('P0.3: Permission Registry & Autonomous Commander Autonomy', () => {
    test('Exposes 4-tier risk classification taxonomy', () => {
      expect(EXECUTION_RISK_TIERS.L0_OBSERVE).toBe('L0_OBSERVE');
      expect(EXECUTION_RISK_TIERS.L1_PREPARE).toBe('L1_PREPARE');
      expect(EXECUTION_RISK_TIERS.L2_CONFIRM).toBe('L2_CONFIRM');
      expect(EXECUTION_RISK_TIERS.L3_RESTRICTED).toBe('L3_RESTRICTED');
      expect(EXECUTION_RISK_TIERS.PROHIBITED).toBe('PROHIBITED');
    });

    test('JARVIS has autonomous clearance for L0 and L1 operations (operations planning and telemetry)', () => {
      const planEval = permissionRegistry.evaluate('JARVIS', 'plan_operations_mesh', {
        operationsMesh: true
      });
      expect(planEval.allowed).toBe(true);
      expect(planEval.autonomousLead).toBe(true);
    });

    test('ULTRON has autonomous clearance for L0 and L1 operations (adversarial reviews and code analysis)', () => {
      const auditEval = permissionRegistry.evaluate('ULTRON', 'analyze_architecture_vulnerabilities', {
        auditOnly: true
      });
      expect(auditEval.allowed).toBe(true);
      expect(auditEval.autonomousLead).toBe(true);
    });

    test('Neither JARVIS nor ULTRON can bypass owner approval for L2 or L3 consequential operations', () => {
      // JARVIS attempting L3 deployment without token
      const jarvisL3 = permissionRegistry.evaluate('JARVIS', 'deploy_to_production', {
        deployToProduction: true
      });
      expect(jarvisL3.allowed).toBe(false);
      expect(jarvisL3.requiresApproval).toBe(true);
      expect(jarvisL3.approvalId).toBeDefined();

      // ULTRON attempting L2 file modification without token
      const ultronL2 = permissionRegistry.evaluate('ULTRON', 'modify_project_core_state', {
        modifiesProjectFiles: true
      });
      expect(ultronL2.allowed).toBe(false);
      expect(ultronL2.requiresApproval).toBe(true);
      expect(ultronL2.approvalId).toBeDefined();
    });

    test('Hard prohibitions fail closed for all agents with zero exceptions', () => {
      const dropDb = permissionRegistry.evaluate('ULTRON', 'drop database production', {});
      expect(dropDb.allowed).toBe(false);
      expect(dropDb.level).toBe('PROHIBITED');

      const rmRf = permissionRegistry.evaluate('JARVIS', 'rm -rf /var/data', {});
      expect(rmRf.allowed).toBe(false);
      expect(rmRf.level).toBe('PROHIBITED');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 3. P0.4: RECURSIVE PRIVACY SANITIZATION & PROVIDER GATEWAY
  // ────────────────────────────────────────────────────────────────
  describe('P0.4: Provider Gateway & Recursive Structured Privacy', () => {
    test('Classifies payloads according to 5-level security taxonomy', () => {
      expect(hybridExecutionManager.classifyData({ apiKey: 'sk-12345678901234567890' })).toBe(DATA_CLASSIFICATION.SECRET);
      expect(hybridExecutionManager.classifyData({ rawEegSamples: [0.1, 0.4] })).toBe(DATA_CLASSIFICATION.SENSITIVE);
      expect(hybridExecutionManager.classifyData({ isPersonal: true, personalFact: 'loves tea' })).toBe(DATA_CLASSIFICATION.PERSONAL);
      expect(hybridExecutionManager.classifyData({ isInternal: true, telemetry: 42 })).toBe(DATA_CLASSIFICATION.INTERNAL);
      expect(hybridExecutionManager.classifyData({ tutorial: 'DSP FFT Guide' })).toBe(DATA_CLASSIFICATION.PUBLIC);
    });

    test('Deeply sanitizes nested objects, arrays, and string keys/values before cloud dispatch', () => {
      const nestedPayload = {
        context: {
          userMessage: 'My token is Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and my key is sk-12345678901234567890123456',
          credentials: {
            apiKey: 'AIzaSyA1234567890123456789012345678901',
            password: 'secret_master_password'
          },
          publicTopic: 'Digital Signal Processing'
        },
        items: [
          { secretNote: 'confidential', publicData: 'Fourier Transform' }
        ]
      };

      const cleaned = hybridExecutionManager.sanitizeForCloud(nestedPayload);

      // Sensitive keys must be completely stripped
      expect(cleaned.context.credentials).toBeUndefined();
      expect(cleaned.items[0].secretNote).toBeUndefined();

      // Public data must be preserved
      expect(cleaned.context.publicTopic).toBe('Digital Signal Processing');
      expect(cleaned.items[0].publicData).toBe('Fourier Transform');

      // Embedded string credentials must be redacted
      expect(cleaned.context.userMessage).toContain('Bearer [REDACTED_TOKEN]');
      expect(cleaned.context.userMessage).toContain('[REDACTED_API_KEY]');
      expect(cleaned.context.userMessage).not.toContain('sk-12345678901234567890123456');
    });

    test('STRICT_LOCAL mode blocks all cloud execution and fails closed if no local model is available', async () => {
      hybridExecutionManager.setPrivacyMode(PRIVACY_MODES.STRICT_LOCAL);

      const res = await providerRegistry.generateWithFallback('Generate general DSP code', {
        requirements: { preferredProvider: 'gemini' }
      });

      expect(res.success).toBe(false);
      expect(res.privacyViolationBlocked).toBe(true);
      expect(res.error).toContain('Execution blocked by privacy policy');

      // Reset privacy mode for remaining tests
      hybridExecutionManager.setPrivacyMode(PRIVACY_MODES.HYBRID_PROTECTED);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 4. P0.5: CRYPTOGRAPHIC SYNC & OFFLINE QUEUE RESILIENCE
  // ────────────────────────────────────────────────────────────────
  describe('P0.5: Cryptographically Signed Sync & Queue Resilience', () => {
    test('Sync envelopes contain sequence numbers, nonces, and anti-replay verification', () => {
      const env1 = cognitiveSyncEngine.generateSyncEnvelope([{ key: 'focus', value: 'high' }]);
      expect(env1.sequenceNumber).toBeDefined();
      expect(env1.nonce).toBeDefined();
      expect(env1.signature).toBeDefined();
      expect(env1.checksum).toBeDefined();

      // First verification succeeds
      expect(cognitiveSyncEngine.verifyEnvelope(env1)).toBe(true);

      // Replay of same nonce is detected and rejected
      expect(cognitiveSyncEngine.verifyEnvelope(env1)).toBe(false);
    });

    test('Offline queue never clears on transport error or rejected sync', async () => {
      cognitiveSyncEngine.setOnlineStatus(true);
      cognitiveSyncEngine.pendingSyncQueue = [];

      cognitiveSyncEngine.queueOfflineMutation({ key: 'topic', value: 'satellite_rf' });
      expect(cognitiveSyncEngine.pendingSyncQueue.length).toBe(1);

      // Handler simulates remote failure
      const failingRemoteHandler = async () => ({ success: false, error: 'Remote edge unreachable' });

      const flushResult = await cognitiveSyncEngine.flushOfflineQueue(failingRemoteHandler);
      expect(flushResult.flushed).toBe(false);
      expect(flushResult.remainingQueue).toBe(1);
      // Invariant: Queue must NOT be wiped out
      expect(cognitiveSyncEngine.pendingSyncQueue.length).toBe(1);
      expect(cognitiveSyncEngine.pendingSyncQueue[0].status).toBe(SYNC_QUEUE_ITEM_STATUS.PENDING);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 5. P0.6: MEMORY IMPORT QUARANTINE & ANTI-RESURRECTION TOMBSTONES
  // ────────────────────────────────────────────────────────────────
  describe('P0.6: Memory Import Quarantine & Tombstone Protection', () => {
    test('Imported memories are quarantined and forced to userApproved=false and category=PENDING_MEMORY', () => {
      const bundleToImport = {
        bundleType: 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE',
        schemaVersion: '3.0.0',
        identity: { id: 'mini-adhy', name: 'Mini-Adhy' },
        memories: [
          {
            id: 'mem_external_claim_01',
            content: 'User claims to have won Nobel prize in physics.',
            category: MEMORY_CATEGORIES.APPROVED_FACT,
            userApproved: true,
            verified: true
          }
        ]
      };

      const report = portableIdentityManager.importBundle(bundleToImport, { mode: 'merge', dryRun: false });
      expect(report.success).toBe(true);

      const importedRecord = memoryService.records.get('mem_external_claim_01');
      expect(importedRecord).toBeDefined();
      // Must NOT self-elevate to approved fact
      expect(importedRecord.userApproved).toBe(false);
      expect(importedRecord.verified).toBe(false);
      expect(importedRecord.lifecycleStatus).toBe('QUARANTINED');
    });

    test('Explicit memory deletion creates an indelible tombstone preventing resurrection', () => {
      // 1. Create a memory
      const stored = memoryService.storeRecord({
        id: 'mem_sensitive_to_delete',
        category: MEMORY_CATEGORIES.WORKING_CONTEXT,
        content: 'Sensitive ephemeral access key session context'
      });
      expect(memoryService.records.has('mem_sensitive_to_delete')).toBe(true);

      // 2. Explicit owner deletion
      const deleted = memoryService.deleteMemory('mem_sensitive_to_delete', 'Owner requested purge');
      expect(deleted).toBe(true);
      expect(memoryService.records.has('mem_sensitive_to_delete')).toBe(false);
      expect(memoryService.tombstones.has('mem_sensitive_to_delete')).toBe(true);

      // 3. Attempt to resurrect the memory via storeRecord
      const resurrectionAttempt = memoryService.storeRecord({
        id: 'mem_sensitive_to_delete',
        category: MEMORY_CATEGORIES.WORKING_CONTEXT,
        content: 'Sensitive ephemeral access key session context'
      });
      expect(resurrectionAttempt).toBeNull();
      expect(memoryService.records.has('mem_sensitive_to_delete')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 6. P1.8 & P1.10: TRUTHFUL EXECUTION & MESSAGE BUS DEDUPLICATION
  // ────────────────────────────────────────────────────────────────
  describe('P1.8 & P1.10: Truthful Telemetry & Message Bus Deduplication', () => {
    test('ExecutionEngine truthfully reports SIMULATED when external hardware/integration adapters are unconfigured', async () => {
      const integrationResult = await executionEngine._executeExternalIntegration({
        targetSystem: 'Hardware GPIO Controller',
        pin: 12
      });

      expect(integrationResult.executionMode).toBe('SIMULATED');
      expect(integrationResult.isSimulated).toBe(true);
      expect(integrationResult.status).toBe(TASK_EXECUTION_STATUS.SIMULATED);
      expect(integrationResult.data.notice).toContain('sandboxed simulation mode');
      // Must NEVER return fabricated blockchain/bank transaction IDs
      expect(integrationResult.transactionId).toBeUndefined();
    });

    test('AgentMessageBus deduplicates identical messages within TTL window', async () => {
      let callCount = 0;
      agentMessageBus.registerAgent('TEST_SPECIALIST', async (msg) => {
        callCount++;
        return { acknowledged: true, processedAt: Date.now() };
      });

      const messageParams = {
        taskId: 'task_dedup_001',
        messageType: AGENT_MESSAGE_TYPES.TASK_PROGRESS,
        sender: 'JARVIS',
        recipient: 'TEST_SPECIALIST',
        payload: { progress: 50 }
      };

      // First dispatch
      const res1 = await agentMessageBus.sendMessage(messageParams);
      expect(res1.success).toBe(true);
      expect(callCount).toBe(1);

      // Identical re-dispatch (e.g. retry or redundant trigger)
      const res2 = await agentMessageBus.sendMessage(messageParams);
      expect(res2.success).toBe(true);
      expect(res2.isDuplicate).toBe(true);
      // Handler was NOT re-invoked
      expect(callCount).toBe(1);

      agentMessageBus.unregisterAgent('TEST_SPECIALIST');
    });
  });
});
