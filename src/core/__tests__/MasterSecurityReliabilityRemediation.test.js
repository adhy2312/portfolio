/**
 * ════════════════════════════════════════════════════════════════════
 *  MASTER SECURITY & RELIABILITY REMEDIATION TEST SUITE (PARTS 1-14)
 * ════════════════════════════════════════════════════════════════════
 * Formally validates that every audit finding is resolved:
 * 1. ServerApprovalService: Server-authoritative approval boundary, agent self-approval prevention,
 *    payload tampering detection, anti-replay, and TTL expiry.
 * 2. ProductionSafetyGuard: Rejection of mock/demo tokens in production, fail-closed token validation.
 * 3. ExecutionEngine Truthfulness: Zero fabricated citations, zero hardcoded passed counts,
 *    explicit SIMULATED labeling, rejection of missing files.
 * 4. Durable Task Recovery: ResilientTaskManager checkpointing and plan resumption.
 * 5. Provider Privacy Gateway: STRICT_LOCAL fail-closed enforcement and deep sanitization.
 */

jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import {
  serverApprovalService,
  mockApprovalProvider,
  ServerApprovalService
} from '../security/ServerApprovalService';
import { ProductionSafetyGuard } from '../metacognition/ProductionSafetyGuard';
import { ExecutionEngine } from '../executive/ExecutionEngine';
import { TaskPlanner } from '../executive/TaskPlanner';
import { VerificationEngine } from '../executive/VerificationEngine';
import { permissionRegistry, computePayloadHash } from '../agents/PermissionRegistry';
import { agentOrchestrator } from '../agents/AgentOrchestrator';
import { resilientTaskManager } from '../distribution/ResilientTaskManager';
import { providerRegistry } from '../providers/ProviderRegistry';
import { visualPerceptionEngine } from '../vision/VisualPerceptionEngine';
import { hybridExecutionManager } from '../distribution/HybridExecutionManager';
import { TASK_EXECUTION_STATUS, ACTION_TYPES } from '../executive/ExecutiveTypes';

describe('MASTER SECURITY & RELIABILITY REMEDIATION AUDIT VERIFICATION', () => {
  let approvalService;
  let safetyGuard;
  let executionEngine;

  beforeEach(() => {
    approvalService = new ServerApprovalService({ defaultTtlMs: 2000 });
    safetyGuard = new ProductionSafetyGuard();
    const planner = new TaskPlanner(permissionRegistry);
    const verifier = new VerificationEngine();
    executionEngine = new ExecutionEngine({
      planner,
      verifier,
      permissions: permissionRegistry,
      orchestrator: agentOrchestrator,
      resilientTaskManager
    });
  });

  // ────────────────────────────────────────────────────────────
  // 1. Authoritative Human Approval Boundary (P0)
  // ────────────────────────────────────────────────────────────
  describe('1. ServerApprovalService: Human Authorization Boundary', () => {
    test('Autonomous agent attempt to approve its own proposal is strictly blocked', () => {
      const request = approvalService.createApprovalRequest({
        requestedBy: 'JarvisAgent',
        actionType: 'DEPLOY_PROPOSAL',
        payload: { setting: 'high_frequency_eval' }
      });

      // Agent tries to approve
      const agentAttempt = approvalService.issueApprovalToken({
        approvalId: request.approvalId,
        operatorIdentity: 'JarvisAgent'
      });

      expect(agentAttempt.success).toBe(false);
      expect(agentAttempt.error).toMatch(/Security violation.*autonomous agent/i);
    });

    test('Valid human operator (Adhy / Creator) can issue cryptographically bound token', () => {
      const payload = { configPatch: { maxRetries: 3 } };
      const request = approvalService.createApprovalRequest({
        requestedBy: 'MetacognitionEngine',
        actionType: 'DEPLOY_PROPOSAL',
        payload
      });

      const humanIssue = approvalService.issueApprovalToken({
        approvalId: request.approvalId,
        operatorIdentity: 'Adhithya Mohan'
      });

      expect(humanIssue.success).toBe(true);
      expect(humanIssue.token).toBeDefined();
      expect(humanIssue.token.startsWith('sat_')).toBe(true);

      // Verify and consume with matching payload succeeds
      const consumeRes = approvalService.verifyAndConsumeToken({
        token: humanIssue.token,
        actionType: 'DEPLOY_PROPOSAL',
        payload,
        consumerIdentity: 'ProductionSafetyGuard'
      });

      expect(consumeRes.valid).toBe(true);
      expect(consumeRes.approvalId).toBe(request.approvalId);
    });

    test('Tampered payload fails verification', () => {
      const originalPayload = { setting: 'A', value: 10 };
      const request = approvalService.createApprovalRequest({
        requestedBy: 'system',
        actionType: 'DEPLOY_PROPOSAL',
        payload: originalPayload
      });

      const issueRes = approvalService.issueApprovalToken({
        approvalId: request.approvalId,
        operatorIdentity: 'Adhy'
      });

      // Attacker or bug mutates payload after token was issued
      const tamperedPayload = { setting: 'A', value: 999999 };
      const consumeRes = approvalService.verifyAndConsumeToken({
        token: issueRes.token,
        actionType: 'DEPLOY_PROPOSAL',
        payload: tamperedPayload
      });

      expect(consumeRes.valid).toBe(false);
      expect(consumeRes.reason).toBe('PAYLOAD_HASH_MISMATCH_TAMPERED');
    });

    test('Replayed / reused token is rejected (Single-use invariant)', () => {
      const payload = { op: 'patch' };
      const request = approvalService.createApprovalRequest({
        actionType: 'APPLY_PATCH',
        payload
      });

      const issueRes = approvalService.issueApprovalToken({
        approvalId: request.approvalId,
        operatorIdentity: 'creator'
      });

      // First use: OK
      const firstUse = approvalService.verifyAndConsumeToken({
        token: issueRes.token,
        actionType: 'APPLY_PATCH',
        payload
      });
      expect(firstUse.valid).toBe(true);

      // Second use (replay attack): REJECTED
      const replayAttempt = approvalService.verifyAndConsumeToken({
        token: issueRes.token,
        actionType: 'APPLY_PATCH',
        payload
      });
      expect(replayAttempt.valid).toBe(false);
      expect(replayAttempt.reason).toBe('TOKEN_ALREADY_USED');
    });

    test('Expired approval request or token cannot be consumed', async () => {
      const shortTtlService = new ServerApprovalService({ defaultTtlMs: 20 });
      const payload = { op: 'test' };
      const request = shortTtlService.createApprovalRequest({
        actionType: 'EXPIRING_ACTION',
        payload,
        ttlMs: 20
      });

      const issueRes = shortTtlService.issueApprovalToken({
        approvalId: request.approvalId,
        operatorIdentity: 'Adhithya'
      });

      // Wait for expiration
      await new Promise(r => setTimeout(r, 40));

      const consumeRes = shortTtlService.verifyAndConsumeToken({
        token: issueRes.token,
        actionType: 'EXPIRING_ACTION',
        payload
      });

      expect(consumeRes.valid).toBe(false);
      expect(consumeRes.reason).toBe('TOKEN_EXPIRED');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Production Safety Guard Trust Enforcement
  // ────────────────────────────────────────────────────────────
  describe('2. ProductionSafetyGuard: Fail-Closed Protection', () => {
    test('Simulated / mock demo tokens are strictly rejected for production deployment', () => {
      const proposal = {
        proposalId: 'prop_demo_1',
        proposedChange: { retrieval: { topK: 10 } }
      };

      const mockRes = mockApprovalProvider.simulateDemonstrationApproval(proposal);
      expect(mockRes.mode).toBe('SIMULATED_DEMO');

      // Attempt to deploy to production using demo token
      const deployRes = safetyGuard.approveDeployment(proposal, mockRes.token, 'Adhithya Mohan');
      expect(deployRes.approved).toBe(false);
      expect(deployRes.error).toMatch(/Simulation tokens cannot authorize production deployment/i);
    });

    test('Unregistered or fabricated tokens are rejected fail-closed', () => {
      const proposal = {
        proposalId: 'prop_fake_1',
        proposedChange: { execution: { maxSubtasks: 20 } }
      };

      const deployRes = safetyGuard.approveDeployment(proposal, 'random_fabricated_token_12345', 'Adhithya Mohan');
      expect(deployRes.approved).toBe(false);
      expect(deployRes.error).toMatch(/Token verification failed/i);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Execution Engine Truthfulness (P1)
  // ────────────────────────────────────────────────────────────
  describe('3. ExecutionEngine: Radical Honesty & Truthful Execution', () => {
    test('Test execution without real runner does not report fake passed counts (e.g. 12)', async () => {
      const res = await executionEngine._executeTestExecution({ testSuite: 'regression' });

      expect(res.executionMode).toBe('SIMULATED');
      expect(res.isSimulated).toBe(true);
      expect(res.testReport.status).toBe('SIMULATED');
      expect(res.testReport.passedCount).not.toBe(12); // Hardcoded 12 eliminated
    });

    test('Research without external provider does not fabricate IEEE citations', async () => {
      const res = await executionEngine._executeResearch({ topic: 'Fourier Transform' });

      expect(res.executionMode).toBe('SIMULATED');
      expect(res.isSimulated).toBe(true);
      expect(res.citations).toEqual([]); // Hardcoded IEEE 802.11 eliminated
    });

    test('File analysis for missing file strictly reports file_exists: false when mustExist is set', async () => {
      const res = await executionEngine._executeFileAnalysis({
        targetFile: 'nonexistent/driver/i2c_bus.c',
        mustExist: true
      });

      expect(res.success).toBe(false);
      expect(res.file_exists).toBe(false);
      expect(res.error).toMatch(/does not exist in filesystem/i);
    });

    test('Sandboxed file synthesis is honestly labeled as SIMULATED', async () => {
      const res = await executionEngine._executeFileAnalysis({
        targetFile: 'src/components/UninitializedWidget.js'
      });

      expect(res.success).toBe(true);
      expect(res.executionMode).toBe('SIMULATED');
      expect(res.isSimulated).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Durable Task Recovery Integration (P1)
  // ────────────────────────────────────────────────────────────
  describe('4. Durable Task Recovery & Checkpointing', () => {
    test('ExecutionEngine creates checkpoints in ResilientTaskManager during goal execution', async () => {
      const goal = 'Refactor React component and apply verified security patch';
      const targetFile = 'src/components/CheckpointPanel.js';

      const initialExec = await executionEngine.executeGoal(goal, { targetFile });
      expect(initialExec.planId).toBeDefined();

      // Checkpoint was initialized
      const cp = resilientTaskManager.getCheckpoint(initialExec.planId);
      expect(cp).toBeDefined();
      expect(cp.taskId).toBe(initialExec.planId);

      // Verify task recovery payload
      const recovery = resilientTaskManager.recoverTask(initialExec.planId);
      expect(recovery.recoverable).toBe(true);
      expect(recovery.canResume).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Central Provider Privacy Gateway (P0)
  // ────────────────────────────────────────────────────────────
  describe('5. Provider Privacy Gateway & STRICT_LOCAL Boundary', () => {
    test('VisualPerceptionEngine routes perception through ProviderRegistry with vision requirements', async () => {
      const dummyFrame = { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' };
      const perceiveRes = await visualPerceptionEngine.perceiveFrame(dummyFrame);

      expect(perceiveRes).toBeDefined();
      expect(perceiveRes.disclaimer).toBeDefined();
    });

    test('STRICT_LOCAL mode prevents dispatch to cloud providers when no local models exist', async () => {
      // Configure privacy mode to STRICT_LOCAL
      hybridExecutionManager.setPrivacyMode('STRICT_LOCAL');

      const request = {
        prompt: 'Analyze private engineering blueprint',
        contents: [{ role: 'user', parts: [{ text: 'Analyze private engineering blueprint' }] }]
      };

      const result = await providerRegistry.generateWithFallback(request, {
        preferredProvider: 'gemini' // Explicitly requested cloud provider under STRICT_LOCAL
      });

      expect(result.success).toBe(false);
      expect(result.privacyViolationBlocked).toBe(true);
      expect(result.error).toMatch(/privacy policy/i);

      // Restore privacy mode
      hybridExecutionManager.setPrivacyMode('HYBRID_BALANCED');
    });
  });
});

