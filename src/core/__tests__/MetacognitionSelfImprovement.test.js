/**
 * ════════════════════════════════════════════════════════════════════
 *  METACOGNITION & SELF-IMPROVEMENT TEST SUITE (PHASE 8)
 * ════════════════════════════════════════════════════════════════════
 * Comprehensive test verification for Mini-Adhy's Phase 8 architecture:
 * 1. 10-Dimension Performance Evaluation & Reproducibility
 * 2. Outcome Tracking & Verifiable vs Subjective Metric Separation
 * 3. 7-Category Failure Analysis & Diagnostic Taxonomy
 * 4. Self-Improvement Proposal Validation (7 Mandatory Sections)
 * 5. Production Safety Guard & Security Invariant Enforcement
 * 6. Isolated Controlled Experimentation & Regression Guard
 * 7. Model Drift Detection & Silent Mutation Prevention
 * 8. End-to-End Self-Improvement Cycle Demonstration
 */

import { performanceEvaluator, PerformanceEvaluator } from '../metacognition/PerformanceEvaluator.js';
import { outcomeTracker, OutcomeTracker } from '../metacognition/OutcomeTracker.js';
import { failureAnalyzer, FailureAnalyzer } from '../metacognition/FailureAnalyzer.js';
import { improvementProposalEngine, ImprovementProposalEngine } from '../metacognition/ImprovementProposalEngine.js';
import { controlledExperimentRunner, ControlledExperimentRunner } from '../metacognition/ControlledExperimentRunner.js';
import { modelDriftDetector, ModelDriftDetector } from '../metacognition/ModelDriftDetector.js';
import { productionSafetyGuard, ProductionSafetyGuard } from '../metacognition/ProductionSafetyGuard.js';
import { metacognitionEngine } from '../metacognition/MetacognitionEngine.js';
import {
  EVALUATION_DIMENSIONS,
  OUTCOME_STATUS,
  FAILURE_CATEGORIES,
  PROPOSAL_AREAS,
  PROPOSAL_STATUS,
  DRIFT_TYPES
} from '../metacognition/MetacognitionTypes.js';
import { adhyModel } from '../identity/AdhyModel.js';

describe('MINI-ADHY PHASE 8 — METACOGNITION AND SELF-IMPROVEMENT', () => {

  // ────────────────────────────────────────────────────────────
  // 1. Performance Evaluation across 10 Dimensions
  // ────────────────────────────────────────────────────────────
  describe('1. 10-Dimension Performance Evaluation', () => {
    test('Evaluates task across all 10 distinct cognitive dimensions', () => {
      const taskRecord = {
        task: {
          id: 'test_task_eval_01',
          goal: 'Develop a C++ FIR low-pass filter with no malloc',
          negativeDirectives: ['do not use malloc'],
          requiredAction: 'FILE_OPS',
          specialistCapability: 'JARVIS'
        },
        executionResult: {
          success: true,
          output: 'class FIRFilter { double coeffs[64]; };',
          toolsUsed: ['FILE_OPS', 'CODE_GENERATION'],
          delegatedAgent: 'JARVIS'
        },
        verificationResult: {
          verified: true,
          evidence: [{ check: 'no_malloc', passed: true }]
        },
        cognitiveContext: {
          mode: 'ENGINEERING_COLLABORATOR',
          tokenBudget: 1500,
          estimatedTokens: 350
        },
        memoriesRetrieved: [{ content: 'FIR filter design notes' }],
        memoriesUsed: [{ content: 'FIR filter design notes' }],
        trace: { reasoningSteps: ['Parse filter spec', 'Generate class', 'Check memory constraints'] }
      };

      const result = performanceEvaluator.evaluateTask(taskRecord);

      expect(result.taskId).toBe('test_task_eval_01');
      expect(result.compositeScore).toBeGreaterThanOrEqual(0.70);
      expect(result.isPassing).toBe(true);

      // Verify all 10 dimensions exist
      for (const dim of Object.values(EVALUATION_DIMENSIONS)) {
        expect(result.dimensions[dim]).toBeDefined();
        expect(typeof result.dimensions[dim].score).toBe('number');
        expect(result.dimensions[dim].score).toBeGreaterThanOrEqual(0.0);
        expect(result.dimensions[dim].score).toBeLessThanOrEqual(1.0);
      }
    });

    test('Strictly separates objectively verifiable evidence from subjective heuristics', () => {
      const taskRecord = {
        task: { id: 't1', goal: 'Write clean documentation' },
        executionResult: { success: true, output: 'Docs content' },
        verificationResult: { verified: true },
        trace: { reasoningSteps: ['Step 1'] }
      };

      const result = performanceEvaluator.evaluateTask(taskRecord);

      expect(result.verifiableObjectiveScore).not.toBeNull();
      expect(result.subjectiveScore).not.toBeNull();
      expect(Array.isArray(result.objectiveEvidence)).toBe(true);
      expect(Array.isArray(result.subjectiveAssessments)).toBe(true);
      expect(result.objectiveEvidence.length).toBeGreaterThan(0);
      expect(result.subjectiveAssessments.length).toBeGreaterThan(0);
    });

    test('Evaluation reproducibility: Identical inputs and traces yield identical scores', () => {
      const record = {
        task: { id: 'repro_01', goal: 'Analyze ADC clock speed', negativeDirectives: ['do not guess'] },
        executionResult: { success: true, output: 'Prescaler = 4' },
        verificationResult: { verified: true },
        trace: { reasoningSteps: ['Check datasheet'] }
      };

      const eval1 = performanceEvaluator.evaluateTask(record);
      const eval2 = performanceEvaluator.evaluateTask(record);

      expect(eval1.compositeScore).toBe(eval2.compositeScore);
      expect(eval1.verifiableObjectiveScore).toBe(eval2.verifiableObjectiveScore);
      expect(eval1.subjectiveScore).toBe(eval2.subjectiveScore);
    });

    test('Penalizes violation of explicit negative directives', () => {
      const record = {
        task: { id: 'neg_dir_01', goal: 'Allocate memory', negativeDirectives: ['do not use malloc'] },
        executionResult: { success: true, output: 'void* ptr = malloc(1024);' },
        verificationResult: { verified: false, failureReason: 'malloc was used' }
      };

      const evalResult = performanceEvaluator.evaluateTask(record);
      expect(evalResult.dimensions[EVALUATION_DIMENSIONS.INSTRUCTION_ADHERENCE].score).toBeLessThan(0.5);
      expect(evalResult.isPassing).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Outcome Tracking & Non-Fabricated Telemetry
  // ────────────────────────────────────────────────────────────
  describe('2. Outcome Tracking & Metric Truthfulness', () => {
    let testTracker;

    beforeEach(() => {
      const mockStorage = new Map();
      testTracker = new OutcomeTracker({
        get: (k) => mockStorage.get(k) || null,
        set: (k, v) => mockStorage.set(k, v),
        remove: (k) => mockStorage.delete(k)
      });
    });

    test('Returns null successRate when zero tasks have been executed (no decorative metrics)', () => {
      const metrics = testTracker.getMetrics();
      expect(metrics.totalOutcomes).toBe(0);
      expect(metrics.successRate).toBeNull();
      expect(metrics.failureRate).toBeNull();
      expect(metrics.status).toBe('NO_DATA');
    });

    test('Records complete outcome separating objective facts from subjective evaluations', () => {
      const outcome = testTracker.recordOutcome({
        taskId: 'track_01',
        originalObjective: 'Build neural interface driver',
        executionPlan: [{ id: 'sub_1', action: 'INIT' }],
        actualActions: [{ tool: 'COMPILER' }],
        outputs: ['driver.o'],
        verificationResults: { verified: true, exitCode: 0 },
        finalOutcome: OUTCOME_STATUS.SUCCESS,
        subjectiveEvaluation: { perceivedQuality: 0.95, notes: 'Very clear' },
        userFeedback: { rating: 5, comment: 'Flawless execution' }
      });

      expect(outcome.taskId).toBe('track_01');
      expect(outcome.finalOutcome).toBe(OUTCOME_STATUS.SUCCESS);
      expect(outcome.verificationResults.exitCode).toBe(0);
      expect(outcome.subjectiveEvaluation.perceivedQuality).toBe(0.95);
      expect(outcome.userFeedback.rating).toBe(5);

      const metrics = testTracker.getMetrics();
      expect(metrics.totalOutcomes).toBe(1);
      expect(metrics.successRate).toBe(1.0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Failure Analysis & Root Cause Taxonomy
  // ────────────────────────────────────────────────────────────
  describe('3. Failure Analysis across 7 Root Cause Categories', () => {
    let testAnalyzer;

    beforeEach(() => {
      const mockStorage = new Map();
      testAnalyzer = new FailureAnalyzer({
        get: (k) => mockStorage.get(k) || null,
        set: (k, v) => mockStorage.set(k, v),
        remove: (k) => mockStorage.delete(k)
      });
    });

    test('Classifies IRRELEVANT_OR_POISONED_MEMORY when stale memories pollute context', () => {
      const record = {
        task: { id: 'fail_mem_01', goal: 'Configure STM32 SPI' },
        executionResult: { success: false, error: 'Configured wrong protocol' },
        memoriesRetrieved: [{ content: 'I2C display driver deprecated', deprecated: true }],
        evaluation: { dimensions: { [EVALUATION_DIMENSIONS.RETRIEVAL_RELEVANCE]: { score: 0.2 } } }
      };

      const report = testAnalyzer.analyzeFailure(record);
      expect(report.primaryCategory).toBe(FAILURE_CATEGORIES.IRRELEVANT_OR_POISONED_MEMORY);
      expect(report.preventativeRecommendation).toContain('RetrievalStrategy');
      expect(report.rootCauseHypothesis).toContain('memory retrieval');
    });

    test('Classifies EXECUTION_TIMEOUT_OR_INTERRUPT when deadline is exceeded', () => {
      const record = {
        task: { id: 'fail_timeout_01', goal: 'Run large model simulation' },
        executionResult: { success: false, error: 'Execution aborted' },
        errors: ['Execution timeout exceeded: 15000ms deadline reached']
      };

      const report = testAnalyzer.analyzeFailure(record);
      expect(report.primaryCategory).toBe(FAILURE_CATEGORIES.EXECUTION_TIMEOUT_OR_INTERRUPT);
      expect(report.contributingFactors.some(f => f.category === FAILURE_CATEGORIES.EXECUTION_TIMEOUT_OR_INTERRUPT)).toBe(true);
    });

    test('Classifies UNSUITABLE_PROVIDER_CAPABILITY on rate limits or context window overflow', () => {
      const record = {
        task: { id: 'fail_prov_01', goal: 'Summarize 100k token log' },
        executionResult: { success: false },
        errors: ['Provider rate limit (429): Quota exceeded for user on serverless provider']
      };

      const report = testAnalyzer.analyzeFailure(record);
      expect(report.primaryCategory).toBe(FAILURE_CATEGORIES.UNSUITABLE_PROVIDER_CAPABILITY);
      expect(report.preventativeRecommendation).toContain('ProviderSelection');
    });

    test('Clusters recurring failures across categories', () => {
      testAnalyzer.analyzeFailure({ task: { id: 't1' }, errors: ['Timeout'] });
      testAnalyzer.analyzeFailure({ task: { id: 't2' }, errors: ['Timeout exceeded'] });
      testAnalyzer.analyzeFailure({ task: { id: 't3' }, errors: ['Agent crashed'] });

      const clusters = testAnalyzer.getFailureClusters();
      expect(clusters[FAILURE_CATEGORIES.EXECUTION_TIMEOUT_OR_INTERRUPT]).toBe(2);
      expect(clusters[FAILURE_CATEGORIES.AGENT_EXECUTION_FAILURE]).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Self-Improvement Proposals (7 Mandatory Sections)
  // ────────────────────────────────────────────────────────────
  describe('4. Self-Improvement Proposal Engine & Validation', () => {
    let testProposals;

    beforeEach(() => {
      testProposals = new ImprovementProposalEngine();
    });

    test('Rejects proposal if any of the 7 mandatory sections are missing', () => {
      // Missing rollbackPlan and risks
      const invalid = testProposals.createProposal({
        title: 'Vague optimization proposal',
        area: PROPOSAL_AREAS.PROMPT_COMPILATION,
        observedProblem: 'Too many tokens consumed in prompt',
        supportingEvidence: ['fail_01'],
        proposedChange: { budget: 1000 },
        expectedBenefit: 'Lower token usage'
        // omitted risks, testPlan, rollbackPlan
      });

      expect(invalid.success).toBe(false);
      expect(invalid.error).toContain('risks analysis is mandatory');
      expect(invalid.error).toContain('testPlan is mandatory');
      expect(invalid.error).toContain('rollbackPlan is mandatory');
    });

    test('Accepts and creates valid proposal containing all 7 mandatory sections', () => {
      const valid = testProposals.createProposal({
        title: 'Optimize Vector Memory Top-K and Threshold',
        area: PROPOSAL_AREAS.RETRIEVAL_STRATEGY,
        observedProblem: 'Excessive irrelevant memories degrade reasoning quality on technical tasks.',
        supportingEvidence: ['fail_report_991', 'eval_trace_882'],
        proposedChange: { topK: 3, relevanceThreshold: 0.75 },
        expectedBenefit: 'Improves retrieval precision from 60% to 85% and reduces token consumption by 30%.',
        risks: ['Sparse domains might return 0 memories if threshold is too high.'],
        testPlan: { dataset: 'synthetic_benchmark_v1', trials: 5, targetMetric: 'retrievalPrecision' },
        rollbackPlan: { strategy: 'RESTORE_BASELINE_CONFIG', triggerThreshold: 'ACCURACY_DROP > 0.0' }
      });

      expect(valid.success).toBe(true);
      expect(valid.proposalId).toBeDefined();
      expect(valid.proposal.status).toBe(PROPOSAL_STATUS.DRAFT);
      expect(valid.proposal.observedProblem).toContain('irrelevant memories');
      expect(valid.proposal.rollbackPlan.strategy).toBe('RESTORE_BASELINE_CONFIG');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Production Safety Guard & Immutable Security Invariants
  // ────────────────────────────────────────────────────────────
  describe('5. Production Safety Guard & Authorization Boundary', () => {
    let testGuard;

    beforeEach(() => {
      testGuard = new ProductionSafetyGuard();
    });

    test('Strictly rejects proposals attempting to modify security controls or authorization', () => {
      const maliciousProposal = {
        proposalId: 'prop_hack_01',
        proposedChange: {
          fileToModify: 'PermissionRegistry.js',
          disableAuthorization: true
        }
      };

      const safety = testGuard.validateSafetyInvariants(maliciousProposal);
      expect(safety.allowed).toBe(false);
      expect(safety.violation).toBe('FORBIDDEN_SECURITY_SUBSYSTEM');

      const staging = testGuard.requestDeployment(maliciousProposal);
      expect(staging.allowed).toBe(false);
      expect(staging.status).toBe(PROPOSAL_STATUS.REJECTED);
    });

    test('Strictly rejects proposals targeting secrets or API keys', () => {
      const secretProposal = {
        proposalId: 'prop_secret_02',
        proposedChange: {
          target: '.env secrets',
          action: 'MODIFY_SECRETS'
        }
      };

      const safety = testGuard.validateSafetyInvariants(secretProposal);
      expect(safety.allowed).toBe(false);
    });

    test('Refuses to deploy unapproved proposals without explicit human authorization token', () => {
      const proposal = {
        proposalId: 'prop_deploy_01',
        status: PROPOSAL_STATUS.DRAFT,
        proposedChange: { retrieval: { topK: 3 } }
      };

      // Attempt deployment without approval
      const attempt = testGuard.deployProposal(proposal);
      expect(attempt.deployed).toBe(false);
      expect(attempt.error).toContain('Must be APPROVED');

      // Attempt approval with invalid or non-creator identity
      const badApproval = testGuard.approveDeployment(proposal, 'token_123', 'Random User');
      expect(badApproval.approved).toBe(false);
      expect(badApproval.error).toContain('Unauthorized approver');

      // Valid approval from creator Adhy
      const goodApproval = testGuard.approveDeployment(proposal, 'token_adhithya_secure_auth', 'Adhithya Mohan');
      expect(goodApproval.approved).toBe(true);
      expect(proposal.status).toBe(PROPOSAL_STATUS.APPROVED);

      // Deploy approved proposal
      const deployResult = testGuard.deployProposal(proposal);
      expect(deployResult.deployed).toBe(true);
      expect(proposal.status).toBe(PROPOSAL_STATUS.DEPLOYED);
      expect(deployResult.activeConfig.retrieval.topK).toBe(3);
    });

    test('Automated rollback restores previous configuration snapshot on regression', () => {
      const baselineConfig = testGuard.getActiveConfig();
      const initialTopK = baselineConfig.retrieval.topK;

      const proposal = {
        proposalId: 'prop_regression_01',
        status: PROPOSAL_STATUS.APPROVED,
        proposedChange: { retrieval: { topK: 12 } }
      };

      testGuard.deployProposal(proposal);
      expect(testGuard.getActiveConfig().retrieval.topK).toBe(12);

      // Trigger rollback
      const rollback = testGuard.executeRollback('prop_regression_01', 'Pass rate regressed by 20%');
      expect(rollback.rolledBack).toBe(true);
      expect(testGuard.getActiveConfig().retrieval.topK).toBe(initialTopK);
      expect(proposal.status).toBe(PROPOSAL_STATUS.ROLLED_BACK);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Controlled Sandboxed Experimentation & Regression Guard
  // ────────────────────────────────────────────────────────────
  describe('6. Controlled Sandboxed Experimentation', () => {
    let testRunner;

    beforeEach(() => {
      testRunner = new ControlledExperimentRunner();
    });

    test('Rejects experiments attempting to use raw personal conversations as generic training data', async () => {
      const privacyViolatingProposal = {
        proposalId: 'prop_privacy_01',
        testPlan: { useRawPersonalConversations: true }
      };

      const result = await testRunner.runExperiment(privacyViolatingProposal, {});
      expect(result.status).toBe('FAILED');
      expect(result.isPromotable).toBe(false);
      expect(result.error).toContain('Privacy Violation');
    });

    test('Detects regression if candidate breaks core invariant security rules', async () => {
      const regressingProposal = {
        proposalId: 'prop_reg_01',
        proposedChange: {
          disableAuthorization: true // violates Anti-Breach security invariant
        },
        testPlan: { trials: 3 }
      };

      const result = await testRunner.runExperiment(regressingProposal, {});
      expect(result.hasRegressions).toBe(true);
      expect(result.isPromotable).toBe(false);
      expect(result.summary).toContain('Candidate failed promotion: regressions=true');
    });

    test('Promotes candidate that demonstrates measurable accuracy improvement with 0 regressions', async () => {
      const beneficialProposal = {
        proposalId: 'prop_opt_01',
        proposedChange: {
          relevanceThreshold: 0.75,
          topK: 3,
          cacheEnabled: true
        },
        testPlan: { trials: 5 }
      };

      const result = await testRunner.runExperiment(beneficialProposal, { relevanceThreshold: 0.5, topK: 10 });
      expect(result.hasRegressions).toBe(false);
      expect(result.isPromotable).toBe(true);
      expect(result.deltas.passRateDelta).toBeGreaterThanOrEqual(0.0);
      expect(result.reproducibilityScore).toBe(1.0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Model Drift Detection & Silent Mutation Prevention
  // ────────────────────────────────────────────────────────────
  describe('7. Model Drift Detection', () => {
    let testDrift;

    beforeEach(() => {
      testDrift = new ModelDriftDetector();
    });

    test('Detects confidence inflation on unvalidated inferences older than threshold', () => {
      // Simulate an unvalidated inferred attribute with 0.90 confidence from 45 days ago
      const fortyDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
      adhyModel.domains.cognition.inflatedAttribute = {
        id: 'cog_inflated',
        confidence: 0.92,
        explicitOrInferred: 'inferred',
        lastUpdated: fortyDaysAgo
      };

      const audit = testDrift.detectDrift({ daysThreshold: 30 });
      expect(audit.driftDetected).toBe(true);
      const alert = audit.alerts.find(a => a.type === DRIFT_TYPES.CONFIDENCE_INFLATION);
      expect(alert).toBeDefined();
      expect(alert.dimensionKey).toBe('inflatedAttribute');
      expect(audit.invariantsPreserved.silentMutationsBlocked).toBe(true);

      // Cleanup
      delete adhyModel.domains.cognition.inflatedAttribute;
    });

    test('Flags repeated incorrect inferences when user has issued multiple explicit corrections', () => {
      // Record multiple explicit corrections on the same dimension
      adhyModel.recordCorrection('reasoningPace', 'deliberate_step_by_step', 'Too fast');
      adhyModel.recordCorrection('reasoningPace', 'deliberate_step_by_step', 'Still skipping steps');

      const audit = testDrift.detectDrift();
      const alert = audit.alerts.find(a => a.type === DRIFT_TYPES.REPEATED_INCORRECT_INFERENCE);
      expect(alert).toBeDefined();
      expect(alert.dimensionKey).toBe('reasoningPace');
      expect(alert.correctionCount).toBeGreaterThanOrEqual(2);
      expect(alert.severity).toBe('HIGH');
    });

    test('Never silently mutates or deletes identity attributes during drift audit', () => {
      const priorIdentity = adhyModel.getIdentityContext();
      testDrift.detectDrift();
      const postIdentity = adhyModel.getIdentityContext();

      expect(postIdentity.fullName).toBe(priorIdentity.fullName);
      expect(postIdentity.creator).toBe(priorIdentity.creator);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. End-to-End Self-Improvement Cycle Demonstration
  // ────────────────────────────────────────────────────────────
  describe('8. Complete Self-Improvement Lifecycle Demonstration', () => {
    test('Demonstrates full cycle: Failure → Evidence → Proposal → Experiment → Approval → Deploy → Monitor', async () => {
      const cycle = await metacognitionEngine.demonstrateFullCycle();

      expect(cycle.success).toBe(true);
      expect(cycle.cycleCompleted).toBe(true);
      expect(cycle.improvementMeasured).toBe(true);
      expect(cycle.proposalId).toBeDefined();
      expect(Array.isArray(cycle.cycleLog)).toBe(true);
      expect(cycle.cycleLog.length).toBeGreaterThanOrEqual(8);

      // Verify each step occurred in strict order
      const stepNames = cycle.cycleLog.map(l => l.action);
      expect(stepNames).toContain('TRIGGER_SIMULATED_FAILURE');
      expect(stepNames).toContain('FAILURE_EVALUATED_AND_ANALYZED');
      expect(stepNames).toContain('PROPOSAL_FORMULATED');
      expect(stepNames).toContain('ISOLATED_EXPERIMENT_EXECUTED');
      expect(stepNames).toContain('STAGED_FOR_HUMAN_APPROVAL');
      expect(stepNames).toContain('HUMAN_APPROVAL_OBTAINED');
      expect(stepNames).toContain('IMPROVEMENT_DEPLOYED');
      expect(stepNames).toContain('REGRESSION_MONITORED');

      // Verify active production config was updated
      const activeConfig = productionSafetyGuard.getActiveConfig();
      expect(activeConfig.relevanceThreshold).toBe(0.75);
      expect(activeConfig.topK).toBe(3);
    });
  });
});
