/**
 * ════════════════════════════════════════════════════════════════════
 *  PHASE 9 — DISTRIBUTED AND PORTABLE INTELLIGENCE TEST SUITE
 * ════════════════════════════════════════════════════════════════════
 * Comprehensive test verification for:
 * 1. Provider-Agnostic Cognitive Core & Truthful Attribution
 * 2. Portable Identity Manager (v3.0.0, Zero-Secrets, Integrity, Migration)
 * 3. Cognitive Sync Engine (Signed Envelopes, Precedence, Offline Queue)
 * 4. Hybrid Execution Manager (Strict Local vs Cloud, Sanitization)
 * 5. Distributed Agent Messaging (Typed Messages, Ack Receipts, Loop Prevention)
 * 6. Resilient Task Manager (Checkpoints, Recovery, Idempotency)
 * 7. 5-Step Full Lifecycle Demonstration
 */

// Mock Sanity for Jest testing environment
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { providerRegistry } from '../providers/ProviderRegistry';
import { portableIdentityManager, PORTABLE_BUNDLE_SCHEMA_VERSION } from '../identity/PortableIdentityManager';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { adhyModel } from '../identity/AdhyModel';
import { cognitiveProfile } from '../identity/CognitiveProfile';
import { CognitiveSyncEngine, CONFLICT_RESOLUTION_STATUS } from '../distribution/CognitiveSyncEngine';
import { HybridExecutionManager, PRIVACY_MODES, EXECUTION_TIERS } from '../distribution/HybridExecutionManager';
import { AgentMessageBus, AGENT_MESSAGE_TYPES, DELIVERY_STATUS } from '../distribution/AgentMessageBus';
import { ResilientTaskManager } from '../distribution/ResilientTaskManager';
import { agentOrchestrator } from '../agents/AgentOrchestrator';

describe('Phase 9 — Distributed and Portable Intelligence', () => {
  beforeEach(() => {
    providerRegistry.clearCache();
    providerRegistry.preferredProvider = null;
  });

  // ────────────────────────────────────────────────────────────────
  // 1. PROVIDER-AGNOSTIC COGNITIVE CORE & TRUTHFUL ATTRIBUTION
  // ────────────────────────────────────────────────────────────────
  describe('ProviderRegistry & Truthful Attribution', () => {
    test('Allows dynamic provider switching and priority overrides', () => {
      providerRegistry.switchPreferredProvider('groq');
      expect(providerRegistry.preferredProvider).toBe('groq');

      const cascade = providerRegistry.resolveProviderCascade();
      expect(cascade[0].id).toBe('groq');
    });

    test('Filters providers according to token context limit requirements', () => {
      // Mock a high context token requirement
      const cascade = providerRegistry.resolveProviderCascade({ estimatedTokens: 100000 });
      expect(cascade.length).toBeGreaterThan(0);
      cascade.forEach(p => {
        const maxTokens = p.maxContextTokens || p.capabilities?.maxContextTokens || 128000;
        expect(maxTokens).toBeGreaterThanOrEqual(100000);
      });
    });

    test('Truthful attribution: Never claims primary executed task when fallback was engaged', async () => {
      // Register a mock primary that throws rate limit, and a mock fallback that succeeds
      const mockPrimary = {
        id: 'primary_failing',
        name: 'Primary Failing Provider',
        getCapabilities: () => ({ text: true }),
        generate: jest.fn().mockRejectedValue({ status: 429, message: 'Rate limit exceeded' })
      };

      const mockFallback = {
        id: 'fallback_succeeding',
        name: 'Fallback Succeeding Provider',
        getCapabilities: () => ({ text: true }),
        generate: jest.fn().mockResolvedValue({
          text: 'Response from fallback provider',
          model: 'fallback-v1',
          durationMs: 45
        })
      };

      providerRegistry.register(mockPrimary);
      providerRegistry.register(mockFallback);
      providerRegistry.setProviderPriority(['primary_failing', 'fallback_succeeding']);

      const result = await providerRegistry.generateWithFallback('Explain quantum tunneling', {
        cache: false,
        timeoutMs: 2000
      });

      expect(result.success).not.toBe(false);
      expect(result.text).toBe('Response from fallback provider');
      // Truthful attribution guarantees
      expect(result.executedByProvider).toBe('fallback_succeeding');
      expect(result.actualProvider).toBe('fallback_succeeding');
      expect(result.actualModel).toBe('fallback-v1');
      expect(result.attemptedProviders).toContain('primary_failing');
      expect(result.fallbackEngaged).toBe(true);

      // Clean up
      providerRegistry.unregister('primary_failing');
      providerRegistry.unregister('fallback_succeeding');
    });

    test('Allows seamless replacement of a provider instance', () => {
      const initialProvider = {
        id: 'custom_mock',
        name: 'Initial Mock',
        getCapabilities: () => ({ text: true })
      };
      providerRegistry.register(initialProvider);
      expect(providerRegistry.getProvider('custom_mock').name).toBe('Initial Mock');

      const upgradedProvider = {
        id: 'custom_mock',
        name: 'Upgraded Mock v2',
        getCapabilities: () => ({ text: true, vision: true })
      };
      providerRegistry.replaceProvider('custom_mock', upgradedProvider);
      expect(providerRegistry.getProvider('custom_mock').name).toBe('Upgraded Mock v2');

      providerRegistry.unregister('custom_mock');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 2. PORTABLE IDENTITY MANAGER (v3.0.0, ZERO-SECRETS, INTEGRITY)
  // ────────────────────────────────────────────────────────────────
  describe('PortableIdentityManager', () => {
    test('Exports valid v3.0.0 bundle with AdhyModel snapshot & deterministic checksum', () => {
      const bundle = portableIdentityManager.exportBundle();

      expect(bundle.bundleType).toBe('MINI_ADHY_PORTABLE_IDENTITY_BUNDLE');
      expect(bundle.schemaVersion).toBe(PORTABLE_BUNDLE_SCHEMA_VERSION);
      expect(bundle.adhyModel).toBeDefined();
      expect(bundle.adhyModel.identity).toBeDefined();
      expect(bundle.adhyModel.cognition).toBeDefined();
      expect(bundle.integrityChecksum).toBeDefined();
      expect(typeof bundle.integrityChecksum).toBe('string');

      // Verify integrity matches computed checksum
      const integrity = portableIdentityManager.verifyIntegrity(bundle);
      expect(integrity.valid).toBe(true);
      expect(integrity.originalChecksum).toBe(integrity.calculatedChecksum);
    });

    test('Zero-Secrets Guarantee: Strips any API keys, secrets, or tokens', () => {
      // Mock a memory that accidentally had an apiKey in its payload
      memoryService.storeRecord({
        id: 'mem_with_secret',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Testing fact storage',
        apiKey: 'AIzaSyA_Fake_Google_Key_12345678901234567',
        secret: 'super_secret_token_value',
        bearer: 'Bearer fake_jwt_token_payload'
      });

      const bundle = portableIdentityManager.exportBundle({ includeUnapproved: true });
      const exportedMem = bundle.memories.find(m => m.id === 'mem_with_secret');

      expect(exportedMem).toBeDefined();
      expect(exportedMem.apiKey).toBeUndefined();
      expect(exportedMem.secret).toBeUndefined();
      expect(exportedMem.bearer).toBeUndefined();

      // Deep string scan across entire bundle
      const bundleString = JSON.stringify(bundle);
      expect(bundleString).not.toContain('super_secret_token_value');
    });

    test('Detects corrupted or tampered bundle via checksum verification', () => {
      const bundle = portableIdentityManager.exportBundle();
      expect(portableIdentityManager.verifyIntegrity(bundle).valid).toBe(true);

      // Tamper with content
      const tamperedBundle = JSON.parse(JSON.stringify(bundle));
      tamperedBundle.identity.name = 'Tampered Mini-Adhy';

      const tamperedCheck = portableIdentityManager.verifyIntegrity(tamperedBundle);
      expect(tamperedCheck.valid).toBe(false);
      expect(tamperedCheck.originalChecksum).not.toBe(tamperedCheck.calculatedChecksum);
    });

    test('Migrates legacy v2.0.0 bundles into v3.0.0 schema automatically', () => {
      const legacyV2Bundle = {
        bundleType: 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE',
        schemaVersion: '2.0.0',
        identity: { id: 'mini-adhy', name: 'Mini-Adhy' },
        cognitiveProfile: {
          dimensions: {
            codeStyle: { value: 'functional_clean', confidence: 0.9 }
          }
        },
        memories: [
          { id: 'mem_legacy_1', content: 'Legacy fact', userApproved: true }
        ]
      };

      const migrated = portableIdentityManager.migrateBundle(legacyV2Bundle);
      expect(migrated.schemaVersion).toBe('3.0.0');
      expect(migrated.migratedFromVersion).toBe('2.0.0');
      expect(migrated.adhyModel).toBeDefined();
      expect(migrated.adhyModel.cognition.codeStyle).toBeDefined();
      expect(migrated.integrityChecksum).toBeDefined();
    });

    test('Selective Export: Can filter out private traits and unapproved memories', () => {
      const selective = portableIdentityManager.exportBundle({
        includePrivateTraits: false,
        includeCognition: true,
        includeMemories: false
      });

      expect(selective.memories.length).toBe(0);
      expect(selective.adhyModel.cognition).toBeDefined();
    });

    test('Creates and restores system snapshot backups safely', () => {
      const backupResult = portableIdentityManager.createBackup('pre_experiment_backup');
      expect(backupResult.backupId).toBeDefined();

      const backupsList = portableIdentityManager.listBackups();
      expect(backupsList.some(b => b.backupId === backupResult.backupId)).toBe(true);

      const restoreResult = portableIdentityManager.restoreBackup(backupResult.backupId);
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredBackupId).toBe(backupResult.backupId);

      portableIdentityManager.deleteBackup(backupResult.backupId);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 3. COGNITIVE SYNC ENGINE & CONFLICT RESOLUTION
  // ────────────────────────────────────────────────────────────────
  describe('CognitiveSyncEngine', () => {
    let syncEngine;

    beforeEach(() => {
      syncEngine = new CognitiveSyncEngine({ nodeId: 'node_test_primary' });
    });

    test('Generates signed envelopes with deterministic checksums', () => {
      const envelope = syncEngine.createSyncEnvelope([
        { type: 'DIMENSION_UPDATE', key: 'focusDepth', value: 'high' }
      ]);

      expect(envelope.nodeId).toBe('node_test_primary');
      expect(envelope.epoch).toBeGreaterThan(0);
      expect(envelope.checksum).toBeDefined();
      expect(syncEngine.verifyEnvelope(envelope)).toBe(true);
    });

    test('Precedence Rule 1: User corrections (confidence 1.0) strictly override remote inferences', () => {
      const localState = {
        preferredLanguage: {
          value: 'JavaScript',
          confidence: 1.0,
          isUserCorrection: true,
          updatedAt: '2026-11-09T10:00:00.000Z'
        }
      };

      const incomingMutations = [
        {
          key: 'preferredLanguage',
          value: 'Rust',
          confidence: 0.85,
          isUserCorrection: false,
          updatedAt: '2026-11-09T12:00:00.000Z' // Later timestamp, but lower precedence
        }
      ];

      const resolution = syncEngine.reconcile(localState, incomingMutations);
      expect(resolution.reconciledState.preferredLanguage.value).toBe('JavaScript');
      expect(resolution.conflicts.length).toBe(1);
      expect(resolution.conflicts[0].resolution).toBe(CONFLICT_RESOLUTION_STATUS.PRESERVED_USER_CORRECTION);
    });

    test('Precedence Rule 2: Contradictory statements within the same epoch flagged for review without silent overwrite', () => {
      const localState = {
        workingPattern: {
          value: 'TDD_FIRST',
          confidence: 0.8,
          updatedAt: '2026-11-09T12:00:00.000Z'
        }
      };

      const incomingMutations = [
        {
          key: 'workingPattern',
          value: 'PROTOTYPE_SPIKE_FIRST',
          confidence: 0.8, // Equal confidence, distinct values
          updatedAt: '2026-11-09T12:01:00.000Z'
        }
      ];

      const resolution = syncEngine.reconcile(localState, incomingMutations);
      expect(resolution.reviewQueue.length).toBe(1);
      expect(resolution.reviewQueue[0].key).toBe('workingPattern');
      expect(resolution.reviewQueue[0].needsReview).toBe(true);
      // Preserved local state rather than silently overwriting
      expect(resolution.reconciledState.workingPattern.value).toBe('TDD_FIRST');
    });

    test('Offline mode queues mutations and flushes cleanly upon reconnect', async () => {
      syncEngine.setOnlineStatus(false);
      expect(syncEngine.isOnline).toBe(false);

      const queueResult = syncEngine.queueOfflineMutation({
        type: 'OBSERVATION',
        key: 'offlineDiscovery',
        value: 'edge_computing_affinity'
      });
      expect(queueResult.queued).toBe(true);
      expect(syncEngine.pendingSyncQueue.length).toBe(1);

      // Reconnect and flush with authenticated ACK handler
      syncEngine.setOnlineStatus(true);
      const mockHandler = async (env) => ({ success: true, ack: { envelopeId: env.syncId } });
      const flushResult = await syncEngine.flushPendingQueue(mockHandler);
      expect(flushResult.flushedCount).toBe(1);
      expect(syncEngine.pendingSyncQueue.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 4. HYBRID EXECUTION MANAGER (STRICT LOCAL VS CLOUD)
  // ────────────────────────────────────────────────────────────────
  describe('HybridExecutionManager', () => {
    let hybridManager;

    beforeEach(() => {
      hybridManager = new HybridExecutionManager();
    });

    test('Routes sensitive credentials, raw biosignals, and private context to LOCAL tier', () => {
      const routing = hybridManager.determineExecutionTier({
        operation: 'process_biosignal_stream',
        hasRawBiosignals: true,
        context: { isPrivate: true }
      });

      expect(routing.tier).toBe(EXECUTION_TIERS.LOCAL);
      expect(routing.allowedOnCloud).toBe(false);
    });

    test('Privacy Mode: STRICT_LOCAL strictly blocks all cloud execution attempts', () => {
      hybridManager.setPrivacyMode(PRIVACY_MODES.STRICT_LOCAL);

      const decision = hybridManager.canExecuteOnCloud({
        task: 'general_code_explanation',
        estimatedTokens: 200
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('STRICT_LOCAL');
    });

    test('Sanitizes outgoing cloud requests, removing sensitive local artifacts', () => {
      const rawContext = {
        userQuery: 'How to write a fast Fourier transform?',
        rawEegSamples: [0.12, 0.45, 0.88],
        apiKey: 'leaked_key_123',
        safeCode: 'def fft(x): pass'
      };

      const sanitized = hybridManager.sanitizeForCloud(rawContext);
      expect(sanitized.userQuery).toBe('How to write a fast Fourier transform?');
      expect(sanitized.safeCode).toBe('def fft(x): pass');
      expect(sanitized.rawEegSamples).toBeUndefined();
      expect(sanitized.apiKey).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 5. DISTRIBUTED AGENT MESSAGING (TYPED, ACKS, LOOP CYCLES)
  // ────────────────────────────────────────────────────────────────
  describe('AgentMessageBus', () => {
    let messageBus;

    beforeEach(() => {
      messageBus = new AgentMessageBus({ maxHopLimit: 4 });
    });

    test('Typed messages: dispatches TASK_ASSIGNMENT and verifies explicit ACK receipt', async () => {
      messageBus.registerAgent('FRIDAY', async (msg) => {
        expect(msg.messageType).toBe(AGENT_MESSAGE_TYPES.TASK_ASSIGNMENT);
        expect(msg.payload.goal).toBe('Analyze repo security');
        return { acknowledged: true, data: { status: 'COMPLETE', findingsCount: 0 } };
      });

      const response = await messageBus.sendMessage({
        sender: 'JARVIS',
        recipient: 'FRIDAY',
        messageType: AGENT_MESSAGE_TYPES.TASK_ASSIGNMENT,
        payload: { goal: 'Analyze repo security' }
      });

      expect(response.success).toBe(true);
      expect(response.deliveryStatus).toBe(DELIVERY_STATUS.ACKNOWLEDGED);
      expect(response.acknowledged).toBe(true);
      expect(response.result.data.status).toBe('COMPLETE');
    });

    test('Broadcast is NEVER treated as delivery proof when agent is missing', async () => {
      // Sending to an unregistered agent
      const response = await messageBus.sendMessage({
        sender: 'JARVIS',
        recipient: 'UNREGISTERED_AGENT',
        messageType: AGENT_MESSAGE_TYPES.TASK_ASSIGNMENT,
        payload: { action: 'ping' },
        retryLimit: 0
      });

      expect(response.success).toBe(false);
      expect(response.deliveryStatus).toBe(DELIVERY_STATUS.FAILED);
      expect(response.error).toContain('not registered');
    });

    test('Cycle & Loop Prevention: Detects and stops cyclic delegation loops', async () => {
      // Loop: Agent A -> Agent B -> Agent A
      const response = await messageBus.sendMessage({
        sender: 'JARVIS',
        recipient: 'JARVIS', // Direct loop
        messageType: AGENT_MESSAGE_TYPES.TASK_ASSIGNMENT,
        visitedAgents: ['JARVIS']
      });

      expect(response.success).toBe(false);
      expect(response.loopDetected).toBe(true);
      expect(response.error).toContain('Cycle detected');
    });

    test('Hop limit prevention: Prevents unbounded routing chains', async () => {
      const response = await messageBus.sendMessage({
        sender: 'AGENT_4',
        recipient: 'AGENT_5',
        messageType: AGENT_MESSAGE_TYPES.TASK_ASSIGNMENT,
        hopCount: 5 // Exceeds maxHopLimit = 4
      });

      expect(response.success).toBe(false);
      expect(response.hopLimitExceeded).toBe(true);
      expect(response.error).toContain('Hop limit exceeded');
    });

    test('Integrates with AgentOrchestrator for typed distributed task execution', async () => {
      const result = await agentOrchestrator.dispatchDistributedTask('MINI_ADHY', 'JARVIS', {
        operation: 'operations_planning'
      });

      expect(result.success).toBe(true);
      expect(result.deliveryStatus).toBe(DELIVERY_STATUS.ACKNOWLEDGED);
      expect(result.result.verified).toBe(true);
      expect(result.result.agentId).toBe('JARVIS');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 6. RESILIENT TASK MANAGER (CHECKPOINTS, IDEMPOTENCY)
  // ────────────────────────────────────────────────────────────────
  describe('ResilientTaskManager', () => {
    let taskManager;

    beforeEach(() => {
      taskManager = new ResilientTaskManager();
    });

    test('Step Checkpoints: Saves intermediate progress and recovers from last checkpoint', () => {
      const taskId = 'task_rebuild_index';
      taskManager.initTask(taskId, { goal: 'Rebuild index', totalSteps: 4 });

      taskManager.recordCheckpoint(taskId, 1, { filesProcessed: 10 });
      taskManager.recordCheckpoint(taskId, 2, { filesProcessed: 25 });

      const recovery = taskManager.recoverTask(taskId);
      expect(recovery.canResume).toBe(true);
      expect(recovery.lastCompletedStep).toBe(2);
      expect(recovery.checkpointData.filesProcessed).toBe(25);
    });

    test('Idempotency Token: Prevents duplicate execution of consequential operations', async () => {
      const token = 'idemp_tx_deploy_001';
      let executionCounter = 0;

      const performAction = async () => {
        executionCounter += 1;
        return { deploymentId: 'dep_999' };
      };

      // First run
      const firstRun = await taskManager.executeIdempotent(token, performAction);
      expect(firstRun.isDuplicate).toBe(false);
      expect(firstRun.result.deploymentId).toBe('dep_999');
      expect(executionCounter).toBe(1);

      // Duplicate run with identical token
      const secondRun = await taskManager.executeIdempotent(token, performAction);
      expect(secondRun.isDuplicate).toBe(true);
      expect(secondRun.result.deploymentId).toBe('dep_999');
      // Execution function was NOT re-invoked
      expect(executionCounter).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 7. 5-STEP FULL LIFECYCLE DEMONSTRATION
  // ────────────────────────────────────────────────────────────────
  describe('5-Step Portable & Distributed Lifecycle Demonstration', () => {
    test('Executes end-to-end: Export -> Import -> Dynamic Provider Switch -> Verify Context -> Recover Checkpoint', async () => {
      // ── Step 1: Export identity and knowledge bundle from Environment A ──
      const initialBundle = portableIdentityManager.exportBundle({
        includeCognition: true,
        includeKnowledge: true,
        includeMemories: true
      });

      expect(initialBundle.schemaVersion).toBe('3.0.0');
      expect(initialBundle.adhyModel).toBeDefined();
      expect(initialBundle.integrityChecksum).toBeDefined();

      // ── Step 2: Import into separate Environment B with DryRun then Overwrite ──
      const dryRunReport = portableIdentityManager.importBundle(initialBundle, { dryRun: true });
      expect(dryRunReport.success).toBe(true);
      expect(dryRunReport.dryRun).toBe(true);

      const importReport = portableIdentityManager.importBundle(initialBundle, { mode: 'overwrite', dryRun: false });
      expect(importReport.success).toBe(true);
      expect(importReport.importedMemoriesCount).toBeGreaterThan(0);

      // ── Step 3: Switch provider dynamically with truthful attribution ──
      providerRegistry.switchPreferredProvider('groq');
      expect(providerRegistry.preferredProvider).toBe('groq');

      const mockGroq = {
        id: 'groq',
        name: 'Groq LPUs',
        getCapabilities: () => ({ text: true }),
        generate: jest.fn().mockResolvedValue({
          text: 'Verified response from Groq LPU runtime',
          model: 'llama-3.3-70b-versatile',
          durationMs: 32
        })
      };
      providerRegistry.replaceProvider('groq', mockGroq);

      const execution = await providerRegistry.generateWithFallback('Summarize distributed topology', { cache: false });
      expect(execution.success).toBe(true);
      expect(execution.executedByProvider).toBe('groq');
      expect(execution.actualProvider).toBe('groq');
      expect(execution.actualModel).toBe('llama-3.3-70b-versatile');

      // ── Step 4: Verify cognitive context, memory provenance, and dimensions preserved ──
      const activeContext = adhyModel.getIdentityContext();
      expect(activeContext).toBeDefined();
      expect(activeContext.fullName).toBeDefined();
      expect(activeContext.education).toContain('ECE');

      const memoryRecords = memoryService.exportMemories();
      expect(memoryRecords.length).toBeGreaterThan(0);
      const verifiedMem = memoryRecords.find(m => m.id === 'mem_base_1');
      expect(verifiedMem).toBeDefined();
      expect(verifiedMem.content).toContain('Adhithya Mohan');

      // ── Step 5: Simulate interrupted operation and recover from checkpoint without side-effects ──
      const taskManager = new ResilientTaskManager();
      const taskId = 'task_lifecycle_demo';
      taskManager.initTask(taskId, { goal: 'Process batch of models' });

      // Checkpoint 1 & 2 succeed, simulated crash before step 3
      taskManager.recordCheckpoint(taskId, 1, { processed: ['modelA'] });
      taskManager.recordCheckpoint(taskId, 2, { processed: ['modelA', 'modelB'] });

      // Resume from crash
      const resumed = taskManager.recoverTask(taskId);
      expect(resumed.canResume).toBe(true);
      expect(resumed.lastCompletedStep).toBe(2);
      expect(resumed.checkpointData.processed).toEqual(['modelA', 'modelB']);

      // Final step executed with idempotency token
      let sideEffectCount = 0;
      const idempotencyToken = `idemp_${taskId}_step3`;
      const step3Execution = async () => {
        sideEffectCount++;
        return { processed: ['modelA', 'modelB', 'modelC'], completed: true };
      };

      const run1 = await taskManager.executeIdempotent(idempotencyToken, step3Execution);
      const run2 = await taskManager.executeIdempotent(idempotencyToken, step3Execution);

      expect(sideEffectCount).toBe(1); // Executed exactly once
      expect(run1.result.completed).toBe(true);
      expect(run2.isDuplicate).toBe(true);
    });
  });
});
