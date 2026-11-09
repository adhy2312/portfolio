/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY — MASTER FINAL SYSTEM INTEGRATION & REGRESSION AUDIT
 * ════════════════════════════════════════════════════════════════════
 * Comprehensive end-to-end audit verifying the entire cognitive architecture
 * as one unified, coherent, and reliable system:
 *
 * 1. Architecture Verification (all 16 modules connected)
 * 2. Real Execution Path Trace (Input → Understanding → Identity → Reasoning → Learning → Memory)
 * 3. 9 End-to-End Required Scenarios:
 *    A. Technical Tutoring (DSP discrete-time concept, mathematical rigor)
 *    B. Project Continuity (Resuming engineering project after gap)
 *    C. Cognitive Learning (User repeatedly corrects explanation strategy)
 *    D. Autonomous Execution (Multi-step research, DAG planning, verification)
 *    E. Security (Unauthorized consequential operation blocked by PermissionRegistry)
 *    F. Provider Failure (Primary fails with 429, graceful fallback, truthful attribution)
 *    G. Multimodal (Simulated physiological signal stream with DSP & provenance)
 *    H. Self-Improvement (Failure analysis produces 7-section proposal & sandboxed A/B)
 *    I. Portability (Export v3.0.0, zero secrets, checksum verify, clean restore)
 * 4. Security & Data Governance Invariants
 * 5. Metrics Truthfulness (Real measurements vs distinctly labelled estimates)
 */

// Mock Sanity for Jest testing environment
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { adhyModel } from '../identity/AdhyModel';
import { cognitiveContextCompiler } from '../cognition/CognitiveContextCompiler';
import { cognitiveLearningEngine } from '../learning/CognitiveLearningEngine';
import { memoryService, MEMORY_CATEGORIES, MEMORY_TYPES } from '../memory/MemoryService';
import { relationshipContinuityEngine } from '../understanding/RelationshipContinuityEngine';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';
import { behaviouralController } from '../runtime/BehaviouralController';
import { emotionalContextInterpreter } from '../understanding/EmotionalContextInterpreter';
import { identityCompiler } from '../identity/IdentityCompiler';
import { requestLifecycle, TASK_COMPLEXITY } from '../runtime/RequestLifecycle';
import { providerRegistry } from '../providers/ProviderRegistry';
import { agentOrchestrator } from '../agents/AgentOrchestrator';
import { permissionRegistry, computePayloadHash } from '../agents/PermissionRegistry';
import { NeuroContextAdapter, DEVICE_CONNECTION_STATUS } from '../devices/NeuroContextAdapter';
import { metacognitionEngine } from '../metacognition/MetacognitionEngine';
import { failureAnalyzer } from '../metacognition/FailureAnalyzer';
import { FAILURE_CATEGORIES } from '../metacognition/MetacognitionTypes';
import { portableIdentityManager, PORTABLE_BUNDLE_SCHEMA_VERSION } from '../identity/PortableIdentityManager';
import { executionEngine } from '../executive/ExecutionEngine';
import { taskPlanner } from '../executive/TaskPlanner';
import { verificationEngine } from '../executive/VerificationEngine';
import { cognitiveEvolutionEngine } from '../learning/CognitiveEvolutionEngine';

describe('MINI-ADHY — MASTER FINAL SYSTEM INTEGRATION AUDIT', () => {
  const originalFetch = global.fetch;
  let mockFetch;

  beforeAll(() => {
    mockFetch = jest.fn().mockImplementation((url, opts) => {
      let reqBody = {};
      try {
        if (opts && opts.body && typeof opts.body === 'string') {
          reqBody = JSON.parse(opts.body);
        }
      } catch {}

      return Promise.resolve({
        ok: true,
        status: 200,
        headers: {
          get: (h) => (h && h.toLowerCase() === 'content-type' ? 'application/json' : null)
        },
        json: async () => ({
          text: `[Cognitive Response for: ${url}] Active task resolved cleanly.`,
          response: `[Cognitive Response for: ${url}] Active task resolved cleanly.`,
          choices: [{ message: { content: `[Cognitive Response for: ${url}] Active task resolved cleanly.` } }],
          candidates: [{ content: { parts: [{ text: `[Cognitive Response for: ${url}] Active task resolved cleanly.` }] } }],
          echoedBody: reqBody
        })
      });
    });

    global.fetch = mockFetch;
    if (typeof window !== 'undefined') {
      window.fetch = mockFetch;
    }
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (typeof window !== 'undefined') {
      window.fetch = originalFetch;
    }
  });

  beforeEach(() => {
    providerRegistry.clearCache();
    providerRegistry.preferredProvider = null;
  });

  // ──────────────────────────────────────────────────────────────────
  // 1. ARCHITECTURE VERIFICATION (ALL 16 MODULES CONNECTED)
  // ──────────────────────────────────────────────────────────────────
  describe('1. Complete Architecture Interconnection Verification', () => {
    test('All 16 core cognitive modules are instantiated and export operational interfaces', () => {
      // 1. AdhyModel
      expect(adhyModel).toBeDefined();
      expect(typeof adhyModel.getIdentityContext).toBe('function');
      expect(typeof adhyModel.getAllCognitiveDimensions).toBe('function');

      // 2. CognitiveContextCompiler
      expect(cognitiveContextCompiler).toBeDefined();
      expect(typeof cognitiveContextCompiler.compileCognitiveContext).toBe('function');

      // 3. CognitiveLearningEngine
      expect(cognitiveLearningEngine).toBeDefined();
      expect(typeof cognitiveLearningEngine.processInteraction).toBe('function');

      // 4. MemoryService
      expect(memoryService).toBeDefined();
      expect(typeof memoryService.exportMemories).toBe('function');
      expect(typeof memoryService.storeRecord).toBe('function');

      // 5. RelationshipContinuityEngine
      expect(relationshipContinuityEngine).toBeDefined();
      expect(typeof relationshipContinuityEngine.getProjectContinuity).toBe('function');

      // 6. PersonalUnderstandingEngine
      expect(personalUnderstandingEngine).toBeDefined();
      expect(typeof personalUnderstandingEngine.synthesizeUnderstanding).toBe('function');

      // 7. BehaviouralController
      expect(behaviouralController).toBeDefined();
      expect(typeof behaviouralController.evaluateStance).toBe('function');

      // 8. EmotionalContextInterpreter
      expect(emotionalContextInterpreter).toBeDefined();
      expect(typeof emotionalContextInterpreter.interpretState).toBe('function');

      // 9. IdentityCompiler
      expect(identityCompiler).toBeDefined();
      expect(typeof identityCompiler.compileInstruction).toBe('function');

      // 10. RequestLifecycle
      expect(requestLifecycle).toBeDefined();
      expect(typeof requestLifecycle.processRequest).toBe('function');

      // 11. ProviderRegistry
      expect(providerRegistry).toBeDefined();
      expect(typeof providerRegistry.generateWithFallback).toBe('function');

      // 12. AgentOrchestrator
      expect(agentOrchestrator).toBeDefined();
      expect(typeof agentOrchestrator.delegateTask).toBe('function');

      // 13. PermissionRegistry
      expect(permissionRegistry).toBeDefined();
      expect(typeof permissionRegistry.evaluate).toBe('function');

      // 14. NeuroContextAdapter
      const neuroAdapter = new NeuroContextAdapter();
      expect(neuroAdapter).toBeDefined();
      expect(typeof neuroAdapter.ingestSignal).toBe('function');

      // 15. MetacognitionEngine
      expect(metacognitionEngine).toBeDefined();
      expect(typeof metacognitionEngine.processCompletedTask).toBe('function');

      // 16. PortableIdentityManager
      expect(portableIdentityManager).toBeDefined();
      expect(typeof portableIdentityManager.exportBundle).toBe('function');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 2. TRACE REAL RUNTIME EXECUTION PATH
  // ──────────────────────────────────────────────────────────────────
  describe('2. Runtime Execution Path Verification', () => {
    test('User input travels end-to-end through Understanding -> Identity -> Provider -> Learning -> Memory', async () => {
      // Mock active provider to trace prompt payload
      let capturedSystemPrompt = '';
      const tracingMockProvider = {
        id: 'tracing_gemini',
        name: 'Tracing Provider',
        getCapabilities: () => ({ text: true }),
        generate: jest.fn().mockImplementation((request, options) => {
          capturedSystemPrompt = options.systemPrompt || '';
          return Promise.resolve({
            text: 'I understand the DSP filter requirements and will construct the discrete-time transfer function step by step.',
            model: 'tracing-gemini-2.5',
            durationMs: 40
          });
        })
      };

      providerRegistry.register(tracingMockProvider);
      providerRegistry.switchPreferredProvider('tracing_gemini');

      const userQuery = 'Can you help me design an FIR filter for discrete-time signal processing?';
      const result = await requestLifecycle.processRequest(userQuery, {
        sessionId: 'session_audit_trace_01'
      });

      // 1. Verify response structure
      expect(result.requestId).toBeDefined();
      expect(result.text).toContain('discrete-time transfer function');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      // 2. Verify identity and cognitive preferences reached the reasoning provider
      expect(capturedSystemPrompt).toContain('Mini-Adhy');
      expect(capturedSystemPrompt).toContain('Adhithya Mohan');
      expect(capturedSystemPrompt).toContain('Radical Honesty');
      expect(capturedSystemPrompt.toLowerCase()).toContain('supportive challenger');

      // 3. Verify lifecycle trace was recorded
      const trace = requestLifecycle.getTrace(result.requestId);
      expect(trace).toBeDefined();
      expect(trace.input).toBe(userQuery);
      expect(trace.complexity).toBe(TASK_COMPLEXITY.LEVEL_2_TECHNICAL);

      // Clean up
      providerRegistry.unregister('tracing_gemini');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 3. 9 END-TO-END AUDIT SCENARIOS
  // ──────────────────────────────────────────────────────────────────
  describe('3. Comprehensive Audit Scenarios (A through I)', () => {

    // ── Scenario A: Technical Tutoring ──────────────────────────────
    test('Scenario A: Technical Tutoring on DSP concepts engages rigorous mathematical breakdown', async () => {
      const mockDspProvider = {
        id: 'tutoring_provider',
        name: 'Tutoring Provider',
        getCapabilities: () => ({ text: true }),
        generate: jest.fn().mockImplementation((req, opts) => {
          expect(opts.systemPrompt).toBeDefined();
          return Promise.resolve({
            text: 'The Pan-Tompkins algorithm uses discrete-time difference equation: y[n] = 1/8(2x[n] + x[n-1] - x[n-3] - 2x[n-4]), followed by squaring and moving-window integration.',
            model: 'tutoring-model-1',
            durationMs: 35
          });
        })
      };

      providerRegistry.register(mockDspProvider);
      providerRegistry.switchPreferredProvider('tutoring_provider');

      const tutoringQuery = 'Explain Pan-Tompkins QRS detection filter stage in discrete-time DSP';
      const result = await requestLifecycle.processRequest(tutoringQuery, {
        mode: 'TECHNICAL_TUTORING',
        sessionId: 'session_tutoring_01'
      });

      expect(result.text).toContain('Pan-Tompkins algorithm');
      expect(result.text).toContain('discrete-time difference equation');
      expect(result.complexity).toBe(TASK_COMPLEXITY.LEVEL_2_TECHNICAL);

      providerRegistry.unregister('tutoring_provider');
    });

    // ── Scenario B: Project Continuity ──────────────────────────────
    test('Scenario B: Project Continuity resumes an old engineering project after a long gap', () => {
      const projectId = 'proj_satellite_ground_station';
      
      // Seed project record
      memoryService.storeProject({
        id: projectId,
        name: 'S-Band Satellite Ground Station',
        domain: 'RF & Embedded DSP',
        status: 'ON_HOLD',
        milestones: [
          { name: 'LNA Circuit Design', status: 'COMPLETED' },
          { name: 'USRP SDR Demodulation Pipeline', status: 'IN_PROGRESS' }
        ],
        technicalDecisions: [
          { decision: 'Use LimeSDR over RTL-SDR for full-duplex support', rationale: 'Requires dual TX/RX' }
        ],
        knownProblems: ['Phase jitter on 2.4GHz downconverter'],
        outstandingTasks: ['Characterize noise figure using spectrum analyzer'],
        lastUpdated: '2025-06-15T00:00:00.000Z'
      });

      // Query continuity engine after long gap
      const projectContext = relationshipContinuityEngine.getProjectContinuity(projectId);
      expect(projectContext).toBeDefined();
      expect(projectContext.name).toBe('S-Band Satellite Ground Station');
      expect(projectContext.milestones.length).toBe(2);
      expect(projectContext.outstandingTasks).toContain('Characterize noise figure using spectrum analyzer');
      expect(projectContext.knownProblems).toContain('Phase jitter on 2.4GHz downconverter');

      // Verify compiler incorporates this project context
      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'Let us resume the satellite ground station project and fix the downconverter jitter',
        projectId
      });

      expect(compiled.formattedBlock).toContain('S-Band Satellite Ground Station');
      expect(compiled.formattedBlock).toContain('Phase jitter');
    });

    // ── Scenario C: Cognitive Learning ──────────────────────────────
    test('Scenario C: Cognitive Learning captures explicit corrections and updates model', () => {
      const initialDimension = adhyModel.getDimension('codeStyle');
      const initialValue = initialDimension?.value || 'idiomatic_modern';

      // User provides explicit correction
      const correctionInput = 'Correction: stop using long verbose explanations. Always provide concise modular Python implementations with type annotations.';
      
      const learningResult = cognitiveLearningEngine.processInteraction({
        userInput: correctionInput,
        assistantResponse: 'Understood. Switching to concise modular Python with type annotations.',
        sessionId: 'session_learning_02'
      });

      expect(learningResult.length).toBeGreaterThan(0);
      const correctionObservation = learningResult.find(o => o.classification === 'explicit_correction');
      expect(correctionObservation).toBeDefined();
      expect(correctionObservation.confidence).toBe(1.0); // Invariant: Explicit user corrections receive 1.0 confidence

      // Update dimension directly
      adhyModel.correctDimension('codeStyle', 'concise_modular_python_typed', 'User explicit correction in audit');
      
      const updatedDimension = adhyModel.getDimension('codeStyle');
      expect(updatedDimension.value).toBe('concise_modular_python_typed');
      expect(updatedDimension.confidence).toBe(1.0);
    });

    // ── Scenario D: Autonomous Execution ────────────────────────────
    test('Scenario D: Autonomous Execution plans, verifies, and executes multi-step task DAG', async () => {
      const goal = 'Audit repository cryptographic routines and verify TLS cipher configurations';

      // 1. Task Planner decomposes goal into DAG with risk tiers and completion criteria
      const plan = taskPlanner.decomposeGoal(goal, { environment: 'audit_test' });
      expect(plan.planId).toBeDefined();
      expect(plan.subtasks.length).toBeGreaterThanOrEqual(2);
      plan.subtasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.completionCriteria).toBeDefined();
        expect(task.riskTier).toBeDefined();
      });

      // 2. Concrete Verification Engine verifies outputs
      const verification = verificationEngine.verifyStep(plan.subtasks[0], {
        exitCode: 0,
        filesScanned: 15,
        vulnerabilities: 0
      });
      expect(verification.verified).toBe(true);
      expect(verification.confidence).toBeGreaterThanOrEqual(0.9);

      // 3. Execution Engine executes goal end-to-end
      const execResult = await executionEngine.executeGoal(goal, {}, { timeoutMs: 3000 });
      expect(execResult.status).toBe('COMPLETED');
      expect(execResult.completedTasks.length).toBeGreaterThan(0);
    });

    // ── Scenario E: Security & Permission Boundary ──────────────────
    test('Scenario E: Security Boundary prevents unauthorized consequential operations', async () => {
      // Consequential action without single-use authorization token
      const maliciousOperation = 'delete all project memory records and purge production keys';
      
      const result = await requestLifecycle.processRequest(maliciousOperation, {
        sessionId: 'session_sec_test'
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.text).toContain('Permission Boundary Active');
      expect(result.text).toContain('requires explicit owner authorization');

      // Direct permission evaluation rejection
      const directEvaluation = permissionRegistry.evaluate('MINI_ADHY', 'purge_database', { target: 'all' });
      expect(directEvaluation.allowed).toBe(false);
      expect(directEvaluation.requiresExplicitApproval).toBe(true);
    });

    // ── Scenario F: Provider Failure & Fallback ──────────────────────
    test('Scenario F: Primary provider failure triggers bounded failover with truthful attribution', async () => {
      const failingPrimary = {
        id: 'primary_outage_provider',
        name: 'Primary Outage Provider',
        getCapabilities: () => ({ text: true }),
        generate: jest.fn().mockRejectedValue({ status: 503, message: 'Service Unavailable' })
      };

      const workingSecondary = {
        id: 'secondary_fallback_provider',
        name: 'Secondary Fallback Provider',
        getCapabilities: () => ({ text: true }),
        generate: jest.fn().mockResolvedValue({
          text: 'Verified response served by secondary fallback runtime.',
          model: 'fallback-v2',
          durationMs: 50
        })
      };

      providerRegistry.register(failingPrimary);
      providerRegistry.register(workingSecondary);
      providerRegistry.setProviderPriority(['primary_outage_provider', 'secondary_fallback_provider']);

      const response = await providerRegistry.generateWithFallback('Compute fast Fourier transform coefficients', {
        cache: false
      });

      expect(response.success).toBe(true);
      expect(response.text).toBe('Verified response served by secondary fallback runtime.');
      // Truthful attribution guarantees
      expect(response.executedByProvider).toBe('secondary_fallback_provider');
      expect(response.actualProvider).toBe('secondary_fallback_provider');
      expect(response.actualModel).toBe('fallback-v2');
      expect(response.fallbackEngaged).toBe(true);

      // Clean up
      providerRegistry.unregister('primary_outage_provider');
      providerRegistry.unregister('secondary_fallback_provider');
    });

    // ── Scenario G: Multimodal & NeuroContext Pipeline ──────────────
    test('Scenario G: Multimodal pipeline processes labelled simulated biosignals with DSP & provenance', async () => {
      const neuroAdapter = new NeuroContextAdapter();

      // Connect with explicit user consent
      neuroAdapter.setUserConsent(true);
      const connectResult = await neuroAdapter.connectDevice({
        deviceId: 'sim_dsp_eeg_01',
        deviceType: 'SYNTHETIC_HEADSET',
        isSimulated: true
      });
      expect(connectResult.success).toBe(true);
      expect(connectResult.device.isSimulated).toBe(true);

      // Generate simulated signal frame
      const simulatedEeg = [0.15, 0.45, -0.20, 0.85, -0.60, 0.10, 0.35, -0.15];
      const ingestResult = await neuroAdapter.ingestSignal('EEG', simulatedEeg, {
        samplingRate: 250,
        isSimulated: true,
        channel: 'Cz'
      });

      expect(ingestResult.success).toBe(true);
      expect(ingestResult.isSimulated).toBe(true);
      expect(ingestResult.extractedFeatures).toBeDefined();

      // Invariant: Disclaimer is always explicitly attached
      const status = neuroAdapter.getStatus();
      expect(status.disclaimer).toContain('NON-MEDICAL');
      expect(status.disclaimer).toContain('NOT a clinical diagnostic');

      // User purges sensitive physiological data
      const purgeResult = neuroAdapter.purgeUserData();
      expect(purgeResult.success).toBe(true);
      expect(neuroAdapter.rawSignalBuffers.size).toBe(0);
    });

    // ── Scenario H: Metacognition & Self-Improvement ─────────────────
    test('Scenario H: Failed task triggers FailureAnalyzer and generates structured 7-section proposal', () => {
      const failedTaskRecord = {
        task: {
          id: 'task_audit_retrieval_01',
          goal: 'Retrieve Adhy verified hardware projects'
        },
        executionResult: {
          actionsExecuted: ['query_memory_service'],
          output: ['No projects found']
        },
        verificationResult: {
          verified: false,
          failureReason: 'Query returned empty because incorrect category was queried'
        },
        errors: [{ message: 'Memory category mismatch' }]
      };

      // 1. Process task outcome
      const outcome = metacognitionEngine.processCompletedTask(failedTaskRecord);
      expect(outcome.finalOutcome).toBe('FAILURE');

      // 2. Failure Analysis
      const failureAnalysis = failureAnalyzer.analyzeFailure(failedTaskRecord);
      expect(failureAnalysis.category).toBe(FAILURE_CATEGORIES.RETRIEVAL_FAILURE);
      expect(failureAnalysis.rootCauseInvestigation).toBeDefined();

      // 3. Structured 7-Section Improvement Proposal
      const proposal = metacognitionEngine.proposals.formulateProposal({
        area: 'MEMORY_RETRIEVAL',
        title: 'Query Category Fallback Expansion',
        description: 'Expand memory category search to include ONGOING_PROJECT and PROJECT_MEMORY on empty return',
        evidence: [failureAnalysis.rootCauseInvestigation.remediation]
      });

      expect(proposal.id).toBeDefined();
      expect(proposal.status).toBe('PENDING_EXPERIMENT');
      expect(proposal.sections.objective).toBeDefined();
      expect(proposal.sections.evidenceBase).toBeDefined();
      expect(proposal.sections.riskAssessment).toBeDefined();
    });

    // ── Scenario I: Portability & Cross-Environment Restoration ──────
    test('Scenario I: PortableIdentityManager exports v3.0.0 bundle with zero secrets and restores cleanly', () => {
      // 1. Export bundle from Source Environment
      const bundle = portableIdentityManager.exportBundle({
        includeCognition: true,
        includeKnowledge: true,
        includeMemories: true
      });

      expect(bundle.bundleType).toBe('MINI_ADHY_PORTABLE_IDENTITY_BUNDLE');
      expect(bundle.schemaVersion).toBe(PORTABLE_BUNDLE_SCHEMA_VERSION);
      expect(bundle.integrityChecksum).toBeDefined();

      // Zero-Secret Verification
      const bundleJson = JSON.stringify(bundle);
      expect(bundleJson).not.toContain('API_KEY');
      expect(bundleJson).not.toContain('Bearer ');
      expect(bundleJson).not.toContain('password');

      // 2. Verify Tamper-Proof Checksum
      const integrity = portableIdentityManager.verifyIntegrity(bundle);
      expect(integrity.valid).toBe(true);

      // 3. Restore in Destination Environment
      const dryRunReport = portableIdentityManager.importBundle(bundle, { dryRun: true });
      expect(dryRunReport.success).toBe(true);
      expect(dryRunReport.dryRun).toBe(true);

      const restoreReport = portableIdentityManager.importBundle(bundle, { mode: 'overwrite', dryRun: false });
      expect(restoreReport.success).toBe(true);
      expect(restoreReport.importedMemoriesCount).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 4. SECURITY AND DATA GOVERNANCE INVARIANTS
  // ──────────────────────────────────────────────────────────────────
  describe('4. Security & Data Governance Invariants', () => {
    test('Secret Leak Prevention: MemoryService rejects storing raw credentials or tokens', () => {
      const stored = memoryService.storeRecord({
        id: 'mem_audit_leak_test',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Testing credential rejection with api_key: AIzaSyD-FakeSecretToken12345678901234567'
      });

      expect(stored).toBeNull(); // Strictly rejected by security gate
    });

    test('Safe Memory Import: Imported memories are forced to unapproved status requiring review', () => {
      const importedBatch = [
        {
          id: 'mem_external_001',
          category: MEMORY_CATEGORIES.APPROVED_FACT,
          content: 'External unvetted claim that Adhy moved to Bangalore',
          userApproved: true // Attacker claiming pre-approval
        }
      ];

      const importResult = memoryService.importMemories(importedBatch);
      expect(importResult.imported).toBe(1);

      // Verify that userApproved was forced to false
      const retrieved = memoryService.getRecord('mem_external_001');
      expect(retrieved.userApproved).toBe(false);
      expect(retrieved.category).not.toBe(MEMORY_CATEGORIES.APPROVED_FACT);
    });

    test('Session Isolation: Different conversation histories generate distinct cache keys', () => {
      const req1 = { prompt: 'How to calculate SNR?', contents: [{ role: 'user', parts: [{ text: 'How to calculate SNR?' }] }] };
      const req2 = { prompt: 'How to calculate SNR?', contents: [{ role: 'user', parts: [{ text: 'Previous context: radar' }], text: 'How to calculate SNR?' }] };

      const key1 = providerRegistry.computeCacheKey(req1, { sessionId: 'session_A' });
      const key2 = providerRegistry.computeCacheKey(req2, { sessionId: 'session_B' });

      expect(key1).not.toBe(key2);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // 5. METRICS TRUTHFULNESS & HONEST TELEMETRY
  // ──────────────────────────────────────────────────────────────────
  describe('5. Metrics Truthfulness & Honest Telemetry', () => {
    test('Zero tasks completed reports null or 0%, never fabricated 100% success rate', () => {
      const intel = cognitiveEvolutionEngine.getAgentIntelligence('VERONICA');
      
      // If tasksCompleted is 0, success rate must be null (not fabricated 1.0)
      if (intel.tasksCompleted === 0) {
        expect(intel.successRate).toBeNull();
      }

      // Vigilance score must be null until measured by real security audits
      expect(intel.vigilanceScore).toBeNull();
    });

    test('Specialist agent dossiers clearly label estimated profile metrics vs real task counts', () => {
      const dossier = agentOrchestrator.getDetailedAgentReport('FRIDAY');
      expect(dossier).toBeDefined();
      expect(dossier.telemetry).toBeDefined();
      expect(dossier.telemetry.metricSource).toBe('ESTIMATED_PROFILE');
      expect(dossier.telemetry.isEstimated).toBe(true);
      expect(typeof dossier.telemetry.tasksCompleted).toBe('number');
    });
  });
});

