/**
 * ════════════════════════════════════════════════════════════════════
 *  PHASE 5 — AUTONOMOUS EXECUTIVE SYSTEM TEST SUITE
 * ════════════════════════════════════════════════════════════════════
 * Verifies the complete autonomous executive system:
 * 1. Task Planner (Goal interpretation, decomposition, dependencies, DAG stages, risk)
 * 2. Permission System (3-tier risk, bound single-use tokens, tamper & replay defense)
 * 3. Execution Safety (Sandboxing, timeouts, cancellation, idempotency, retries)
 * 4. Verification Engine (Concrete validation of files, tests, schema; zero text-only trust)
 * 5. Agent Coordination (Explicit capabilities, validated specialist delegation, recovery)
 * 6. End-to-End Multi-Step Task Demonstration
 */

jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { TaskPlanner } from '../executive/TaskPlanner';
import { VerificationEngine } from '../executive/VerificationEngine';
import { ExecutionEngine } from '../executive/ExecutionEngine';
import {
  RISK_TIERS,
  TASK_EXECUTION_STATUS,
  ACTION_TYPES,
  SPECIALIST_CAPABILITIES
} from '../executive/ExecutiveTypes';
import { permissionRegistry, computePayloadHash } from '../agents/PermissionRegistry';
import { agentOrchestrator } from '../agents/AgentOrchestrator';
import { requestLifecycle } from '../runtime/RequestLifecycle';

describe('PHASE 5 — AUTONOMOUS EXECUTIVE SYSTEM', () => {
  let planner;
  let verifier;
  let executor;

  beforeEach(() => {
    planner = new TaskPlanner(permissionRegistry);
    verifier = new VerificationEngine();
    executor = new ExecutionEngine({
      planner,
      verifier,
      permissions: permissionRegistry,
      orchestrator: agentOrchestrator
    });

    permissionRegistry.pendingApprovals = [];
    permissionRegistry.issuedTokens.clear();
  });

  // ────────────────────────────────────────────────────────────
  // 1. Task Planner (Goal Decomposition, DAG, Risk Classification)
  // ────────────────────────────────────────────────────────────
  describe('1. Task Planner & Goal Decomposition', () => {
    test('Interprets goal intent and decomposes into parent-child subtasks with DAG execution stages', () => {
      const plan = planner.plan('Fix buffer overrun bug in STM32 UART DMA driver', {
        targetFile: 'src/drivers/uart_dma.c'
      });

      expect(plan.id).toBeDefined();
      expect(plan.intent).toBe('CODE_MODIFICATION');
      expect(plan.subtasks.length).toBe(4);

      // Check subtask parent-child hierarchy
      const analyzeTask = plan.subtasks.find(t => t.actionType === ACTION_TYPES.FILE_ANALYSIS);
      const codegenTask = plan.subtasks.find(t => t.actionType === ACTION_TYPES.CODE_GENERATION);
      const applyTask = plan.subtasks.find(t => t.actionType === ACTION_TYPES.APPLY_CODE_CHANGE);
      const testTask = plan.subtasks.find(t => t.actionType === ACTION_TYPES.TEST_EXECUTION);

      expect(analyzeTask.parentId).toBeNull();
      expect(codegenTask.parentId).toBe(analyzeTask.id);
      expect(applyTask.parentId).toBe(codegenTask.id);
      expect(testTask.parentId).toBe(applyTask.id);

      // Check risk tiers
      expect(analyzeTask.riskLevel).toBe(RISK_TIERS.LOW_RISK);
      expect(codegenTask.riskLevel).toBe(RISK_TIERS.LOW_RISK);
      expect(applyTask.riskLevel).toBe(RISK_TIERS.CONTROLLED);
      expect(testTask.riskLevel).toBe(RISK_TIERS.LOW_RISK);

      // Check overall risk tier calculation
      expect(plan.overallRisk).toBe(RISK_TIERS.CONTROLLED);

      // Check topological execution stages (4 sequential stages)
      expect(plan.executionStages.length).toBe(4);
      expect(plan.executionStages[0]).toContain(analyzeTask.id);
      expect(plan.executionStages[1]).toContain(codegenTask.id);
      expect(plan.executionStages[2]).toContain(applyTask.id);
      expect(plan.executionStages[3]).toContain(testTask.id);
    });

    test('Detects and prevents circular dependencies in custom plans', () => {
      expect(() => {
        planner.plan('Custom cyclical task', {}, {
          customTasks: [
            { id: 'task_a', title: 'Task A', dependencies: ['task_b'] },
            { id: 'task_b', title: 'Task B', dependencies: ['task_a'] }
          ]
        });
      }).toThrow(/circular dependency/i);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Permission System & Risk Classification
  // ────────────────────────────────────────────────────────────
  describe('2. Permission System (3-Tier Risk & Cryptographic Tokens)', () => {
    test('LOW_RISK actions are autonomously permitted', () => {
      const evalRes = permissionRegistry.evaluate('MINI_ADHY', 'read_project_manifest', {
        readOnly: true
      });

      expect(evalRes.allowed).toBe(true);
      expect(evalRes.riskTier).toBe(RISK_TIERS.LOW_RISK);
      expect(evalRes.requiresApproval).toBeUndefined();
    });

    test('CONTROLLED and HIGH_IMPACT actions require explicit authorization and queue approval requests', () => {
      const controlledRes = permissionRegistry.evaluate('MINI_ADHY', 'modify_system_configuration', {
        modifiesProjectFiles: true,
        targetFile: 'src/config.json'
      });

      expect(controlledRes.allowed).toBe(false);
      expect(controlledRes.requiresApproval).toBe(true);
      expect(controlledRes.riskTier).toBe(RISK_TIERS.CONTROLLED);
      expect(controlledRes.approvalId).toBeDefined();

      const highImpactRes = permissionRegistry.evaluate('ULTRON', 'deploy_to_production_edge', {
        deployToProduction: true,
        irreversible: true
      });

      expect(highImpactRes.allowed).toBe(false);
      expect(highImpactRes.requiresApproval).toBe(true);
      expect(highImpactRes.riskTier).toBe(RISK_TIERS.HIGH_IMPACT);
    });

    test('Prohibited dangerous operations are unconditionally blocked', () => {
      const evalRes = permissionRegistry.evaluate('ULTRON', 'eval', {
        script: 'rm -rf /'
      });

      expect(evalRes.allowed).toBe(false);
      expect(evalRes.riskTier).toBe(RISK_TIERS.PROHIBITED);
      expect(evalRes.reason).toContain('prohibited');
    });

    test('Approval tokens are single-use, expiring, and cryptographically bound to canonical payload hash', () => {
      const payload = { targetFile: 'src/auth.js', patchContent: 'export const secure = true;' };
      const evalRes = permissionRegistry.evaluate('MINI_ADHY', 'modify_source_file', payload);

      expect(evalRes.requiresApproval).toBe(true);
      const approvalId = evalRes.approvalId;

      // 1. Owner grants approval -> receives single-use token
      const resolution = permissionRegistry.resolveApproval(approvalId, true, 'owner');
      expect(resolution.success).toBe(true);
      expect(resolution.token).toBeDefined();
      const token = resolution.token;

      // 2. Token successfully authorizes the exact payload
      const authRes = permissionRegistry.verifyApprovalToken(token, 'MINI_ADHY', 'modify_source_file', payload);
      expect(authRes.valid).toBe(true);

      // 3. Replay attack fails: Single-use token is now consumed
      const replayRes = permissionRegistry.verifyApprovalToken(token, 'MINI_ADHY', 'modify_source_file', payload);
      expect(replayRes.valid).toBe(false);
      expect(replayRes.reason).toContain('single-use');
    });

    test('Tamper detection: Modifying payload invalidates approval and FAILS CLOSED', () => {
      const originalPayload = { targetFile: 'src/logger.js', debugLevel: 1 };
      const evalRes = permissionRegistry.evaluate('MINI_ADHY', 'modify_logger_config', originalPayload);
      const resolution = permissionRegistry.resolveApproval(evalRes.approvalId, true, 'owner');
      const token = resolution.token;

      // Attacker attempts to modify payload to target different file
      const tamperedPayload = { targetFile: 'src/admin_credentials.js', debugLevel: 99 };
      const verifyRes = permissionRegistry.verifyApprovalToken(token, 'MINI_ADHY', 'modify_logger_config', tamperedPayload);

      expect(verifyRes.valid).toBe(false);
      expect(verifyRes.reason).toContain('Payload modification detected');
    });

    test('Token expiration: Expired tokens FAIL CLOSED', () => {
      const payload = { op: 'test_token_expiry' };
      const evalRes = permissionRegistry.evaluate('MINI_ADHY', 'modify_ephemeral', payload);
      // Issue token with -1ms TTL (already expired)
      const resolution = permissionRegistry.resolveApproval(evalRes.approvalId, true, 'owner', { ttlMs: -1000 });
      const token = resolution.token;

      const verifyRes = permissionRegistry.verifyApprovalToken(token, 'MINI_ADHY', 'modify_ephemeral', payload);
      expect(verifyRes.valid).toBe(false);
      expect(verifyRes.reason).toContain('expired');
    });

    test('Agent and operation binding: Token issued for FRIDAY cannot be redeemed by ULTRON', () => {
      const payload = { auditTarget: 'csp' };
      const evalRes = permissionRegistry.evaluate('FRIDAY', 'modify_csp_policy', payload);
      const resolution = permissionRegistry.resolveApproval(evalRes.approvalId, true, 'owner');
      const token = resolution.token;

      const wrongAgentRes = permissionRegistry.verifyApprovalToken(token, 'ULTRON', 'modify_csp_policy', payload);
      expect(wrongAgentRes.valid).toBe(false);
      expect(wrongAgentRes.reason).toContain('bound to a different agent');

      const wrongOpRes = permissionRegistry.verifyApprovalToken(token, 'FRIDAY', 'modify_other_policy', payload);
      expect(wrongOpRes.valid).toBe(false);
      expect(wrongOpRes.reason).toContain('bound to a different operation');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Execution Safety: Sandboxing, Timeouts, Retries, Cancel
  // ────────────────────────────────────────────────────────────
  describe('3. Execution Safety & Fault Tolerance', () => {
    test('Enforces hard timeouts via AbortController for hanging subtasks', async () => {
      const customTasks = [
        {
          id: 'task_slow',
          title: 'Hanging simulated calculation',
          actionType: ACTION_TYPES.RESEARCH,
          riskLevel: RISK_TIERS.LOW_RISK,
          parameters: {}
        }
      ];

      // Temporarily mock dispatch to hang
      jest.spyOn(executor, '_executeResearch').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      // Execute with very small timeoutMs (50ms)
      const plan = planner.plan('Hanging test', {}, { customTasks });
      executor.activePlans.set(plan.id, plan);
      executor.taskStates.set('task_slow', plan.subtasks[0]);

      const result = await executor.executeTask(plan.subtasks[0], { timeoutMs: 50 });
      expect(result.status).toBe(TASK_EXECUTION_STATUS.FAILED);
      expect(result.error).toContain('timed out');

      jest.restoreAllMocks();
    });

    test('Cancellation halts active and pending subtasks immediately', async () => {
      const customTasks = [
        { id: 'task_1', title: 'Step 1', actionType: ACTION_TYPES.RESEARCH, riskLevel: RISK_TIERS.LOW_RISK },
        { id: 'task_2', title: 'Step 2', actionType: ACTION_TYPES.RESEARCH, riskLevel: RISK_TIERS.LOW_RISK, dependencies: ['task_1'] }
      ];

      const plan = planner.plan('Multi-step cancellation test', {}, { customTasks });
      executor.activePlans.set(plan.id, plan);
      plan.subtasks.forEach(t => executor.taskStates.set(t.id, t));

      // Cancel the plan
      const cancelled = executor.cancelPlan(plan.id, 'User manually stopped execution');
      expect(cancelled).toBe(true);

      const execResult = await executor.executePlan(plan.id);
      expect(execResult.status).toBe(TASK_EXECUTION_STATUS.CANCELLED);
      expect(plan.subtasks.every(t => t.status === TASK_EXECUTION_STATUS.CANCELLED)).toBe(true);
    });

    test('Idempotency prevents duplicate side-effect execution for already completed subtasks', async () => {
      let runCount = 0;
      jest.spyOn(executor, '_executeResearch').mockImplementation(() => {
        runCount++;
        return Promise.resolve({ success: true, data: 'Executed' });
      });

      const customTasks = [
        { id: 'task_idempotent', title: 'Idempotent research', actionType: ACTION_TYPES.RESEARCH, riskLevel: RISK_TIERS.LOW_RISK }
      ];

      const plan = planner.plan('Idempotent run', {}, { customTasks });
      executor.activePlans.set(plan.id, plan);
      executor.taskStates.set('task_idempotent', plan.subtasks[0]);

      await executor.executePlan(plan.id);
      expect(runCount).toBe(1);

      // Second execution of same plan should skip completed task
      await executor.executePlan(plan.id);
      expect(runCount).toBe(1);

      jest.restoreAllMocks();
    });

    test('Retry policy retries recoverable subtask failures up to maxRetries', async () => {
      let attempts = 0;
      jest.spyOn(executor, '_executeResearch').mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary network socket timeout');
        }
        return Promise.resolve({ success: true, findings: ['Finally succeeded after retry'] });
      });

      const customTasks = [
        {
          id: 'task_retry',
          title: 'Flaky network research',
          actionType: ACTION_TYPES.RESEARCH,
          riskLevel: RISK_TIERS.LOW_RISK,
          maxRetries: 3
        }
      ];

      const plan = planner.plan('Flaky task', {}, { customTasks });
      executor.activePlans.set(plan.id, plan);
      executor.taskStates.set('task_retry', plan.subtasks[0]);

      const result = await executor.executePlan(plan.id);
      expect(result.status).toBe(TASK_EXECUTION_STATUS.COMPLETED);
      expect(attempts).toBe(3);
      expect(plan.subtasks[0].retryCount).toBe(2);

      jest.restoreAllMocks();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Verification Engine: Concrete Output Validation
  // ────────────────────────────────────────────────────────────
  describe('4. Verification Engine (Zero Trust in Generated Text)', () => {
    test('Rejects tasks that claim success in text but fail concrete file content criteria', async () => {
      const task = {
        id: 'task_verify_file',
        dependencies: [],
        successCriteria: {
          file_content: {
            target: 'src/config.js',
            mustContain: ['ENCRYPTION_KEY_ALGORITHM = "AES-256-GCM"'],
            mustNotContain: ['PLAINTEXT_ENABLED']
          }
        }
      };

      // Case A: File is missing required string
      const badResult = {
        success: true,
        summary: 'I have successfully updated the encryption algorithm to AES-256-GCM!',
        fileChanges: { 'src/config.js': 'const CONFIG = { mode: "dev" };' }
      };

      const resA = await verifier.verifyTaskOutcome(task, badResult);
      expect(resA.verified).toBe(false);
      expect(resA.failureReason).toContain('does not contain expected snippet');

      // Case B: File contains prohibited snippet
      const forbiddenResult = {
        success: true,
        fileChanges: {
          'src/config.js': 'ENCRYPTION_KEY_ALGORITHM = "AES-256-GCM";\nPLAINTEXT_ENABLED = true;'
        }
      };

      const resB = await verifier.verifyTaskOutcome(task, forbiddenResult);
      expect(resB.verified).toBe(false);
      expect(resB.failureReason).toContain('contains prohibited snippet');

      // Case C: Valid content passes verification
      const goodResult = {
        success: true,
        fileChanges: {
          'src/config.js': 'ENCRYPTION_KEY_ALGORITHM = "AES-256-GCM";\nSECURITY_STRICT = true;'
        }
      };

      const resC = await verifier.verifyTaskOutcome(task, goodResult);
      expect(resC.verified).toBe(true);
    });

    test('Verifies test suite output and rejects execution if tests fail', async () => {
      const task = {
        id: 'task_test_verify',
        dependencies: [],
        successCriteria: {
          test_results: { mustPass: true, minTests: 5 }
        }
      };

      // Failed tests
      const failedResult = {
        success: true,
        testReport: { passedCount: 4, failedCount: 1 }
      };
      const resFailed = await verifier.verifyTaskOutcome(task, failedResult);
      expect(resFailed.verified).toBe(false);
      expect(resFailed.failureReason).toContain('1 failed tests');

      // Passed tests
      const passedResult = {
        success: true,
        testReport: { passedCount: 10, failedCount: 0 }
      };
      const resPassed = await verifier.verifyTaskOutcome(task, passedResult);
      expect(resPassed.verified).toBe(true);
    });

    test('Validates output schema against required keys', async () => {
      const task = {
        id: 'task_schema',
        dependencies: [],
        successCriteria: {
          schema_validation: ['codeSnippet', 'explanation']
        }
      };

      // Missing 'codeSnippet'
      const incompleteResult = {
        success: true,
        data: { explanation: 'Everything is explained thoroughly.' }
      };
      const resIncomplete = await verifier.verifyTaskOutcome(task, incompleteResult);
      expect(resIncomplete.verified).toBe(false);
      expect(resIncomplete.failureReason).toContain('codeSnippet');

      // Complete schema
      const completeResult = {
        success: true,
        data: { codeSnippet: 'const x = 1;', explanation: 'Assigned x.' }
      };
      const resComplete = await verifier.verifyTaskOutcome(task, completeResult);
      expect(resComplete.verified).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Agent Coordination & Specialist Capability Delegation
  // ────────────────────────────────────────────────────────────
  describe('5. Agent Coordination & Capability Delegation', () => {
    test('Specialists have explicit capability maps and reject mismatched operations', async () => {
      expect(SPECIALIST_CAPABILITIES.FRIDAY.capabilities).toContain('security_audit');
      expect(SPECIALIST_CAPABILITIES.ULTRON.capabilities).toContain('architectural_stress_testing');
      expect(SPECIALIST_CAPABILITIES.JOCASTA.capabilities).toContain('core_web_vitals_audit');

      // Delegating a capability FRIDAY possesses
      const fridayValid = await agentOrchestrator.delegateTask('FRIDAY', { operation: 'security_audit' });
      expect(fridayValid.success).toBe(true);
      expect(fridayValid.verified).toBe(true);

      // Attempting to delegate an unmapped operation to FRIDAY fails
      const fridayMismatched = await agentOrchestrator.delegateTask('FRIDAY', { operation: 'financial_accounting' });
      expect(fridayMismatched.success).toBe(false);
      expect(fridayMismatched.error).toContain('lacks capability');
    });

    test('Delegated specialist outputs are validated before acceptance', async () => {
      const task = {
        id: 'task_friday_delegation',
        assignedAgent: 'FRIDAY',
        actionType: ACTION_TYPES.DELEGATE_SPECIALIST,
        riskLevel: RISK_TIERS.LOW_RISK,
        parameters: { operation: 'security_audit' },
        successCriteria: { schema_validation: ['vulnerabilities', 'cspStatus'] }
      };

      const result = await executor.executeTask(task);
      expect(result.status).toBe(TASK_EXECUTION_STATUS.COMPLETED);
      expect(task.verificationEvidence.some(e => e.check === 'schema_validation' && e.passed)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Full End-to-End Autonomous Executive Demonstration
  // ────────────────────────────────────────────────────────────
  describe('6. End-to-End Executive Demonstration', () => {
    test('Demonstration: Safe multi-step task from planning through risk approval, execution, and verified completion', async () => {
      const goal = 'Refactor React component and apply verified security patch';
      const targetFile = 'src/components/SecurePanel.js';

      // Step 1: Formulate Plan
      const initialExec = await executor.executeGoal(goal, { targetFile });
      expect(initialExec.status).toBe(TASK_EXECUTION_STATUS.APPROVAL_REQUIRED);
      expect(initialExec.riskTier).toBe(RISK_TIERS.CONTROLLED);
      expect(initialExec.approvalId).toBeDefined();

      const planId = initialExec.planId;
      const blockedTaskId = initialExec.blockedTaskId;

      // Verify the analysis and codegen steps finished, but the apply step blocked on permission
      const plan = executor.getPlan(planId);
      const analyzeTask = plan.subtasks.find(t => t.actionType === ACTION_TYPES.FILE_ANALYSIS);
      const codegenTask = plan.subtasks.find(t => t.actionType === ACTION_TYPES.CODE_GENERATION);
      const applyTask = plan.subtasks.find(t => t.id === blockedTaskId);

      expect(analyzeTask.status).toBe(TASK_EXECUTION_STATUS.COMPLETED);
      expect(codegenTask.status).toBe(TASK_EXECUTION_STATUS.COMPLETED);
      expect(applyTask.status).toBe(TASK_EXECUTION_STATUS.APPROVAL_REQUIRED);

      // Step 2: Owner inspects pending approval in permissionRegistry
      const pendingList = permissionRegistry.getPendingApprovals();
      expect(pendingList.some(a => a.id === initialExec.approvalId)).toBe(true);

      // Step 3: Owner resolves approval -> issues single-use token
      const approvalRes = permissionRegistry.resolveApproval(initialExec.approvalId, true, 'Adhithya (Owner)');
      expect(approvalRes.success).toBe(true);
      expect(approvalRes.token).toBeDefined();

      // Step 4: Resume plan execution presenting the verified approval token
      const resumeResult = await executor.resumePlanWithApproval(planId, blockedTaskId, approvalRes.token);
      expect(resumeResult.status).toBe(TASK_EXECUTION_STATUS.COMPLETED);

      // Step 5: Verify all subtasks are COMPLETED and verified
      expect(plan.status).toBe(TASK_EXECUTION_STATUS.COMPLETED);
      expect(plan.subtasks.every(t => t.status === TASK_EXECUTION_STATUS.COMPLETED)).toBe(true);

      // Step 6: Verify file content was actually written to virtual file system
      expect(executor.virtualFileSystem[targetFile]).toBeDefined();

      // Step 7: Verify complete audit trail was recorded
      const auditTrail = executor.getAuditTrail();
      expect(auditTrail.some(a => a.action === 'PLAN_CREATED')).toBe(true);
      expect(auditTrail.some(a => a.action === 'TASK_APPROVAL_QUEUED')).toBe(true);
      expect(auditTrail.some(a => a.action === 'APPROVAL_TOKEN_ATTACHED')).toBe(true);
      expect(auditTrail.some(a => a.action === 'PLAN_COMPLETED')).toBe(true);
    });

    test('RequestLifecycle integration routes goal requests through Autonomous Executive System', async () => {
      const response = await requestLifecycle.processRequest('goal: Audit and research DSP Fourier pipeline');
      expect(response.isExecutiveGoal).toBe(true);
      expect(response.mode).toBe('EXECUTIVE');
      expect(response.planId).toBeDefined();
      expect(response.status).toBe(TASK_EXECUTION_STATUS.COMPLETED);
    });
  });
});

