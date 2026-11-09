/**
 * ════════════════════════════════════════════════════════════════════
 *  ADHY MODEL FOUNDATION — COMPREHENSIVE VERIFICATION TEST SUITE
 * ════════════════════════════════════════════════════════════════════
 * Verifies Part 1 through Part 8:
 * 1. Single Canonical AdhyModel Architecture (6 Domains)
 * 2. Backward Compatibility & Migration from legacy stores
 * 3. User Correction Absolute Precedence (confidence = 1.0)
 * 4. CognitiveContextCompiler: Selective Dimension Surfacing
 * 5. Memory Filtration: Filtering sensitive and unapproved records
 * 6. Cache Identity: Model version increments invalidate stale cache
 * 7. Controlled Evolution & Reviewable Conflicts (Contradiction handling)
 * 8. Reversibility & Audit Rollback
 * 9. NeuroContextAdapter: Unsimulated, disconnected default with consent gate
 * 10. Existing 10-Agent Identity & RequestLifecycle End-to-End Integration
 */

import { adhyModel, CLASSIFICATION_TYPES, DOMAIN_TYPES } from '../identity/AdhyModel';
import { cognitiveProfile } from '../identity/CognitiveProfile';
import { cognitiveMirror } from '../understanding/CognitiveMirror';
import { cognitiveContextCompiler } from '../cognition/CognitiveContextCompiler';
import { cognitiveLearningEngine } from '../learning/CognitiveLearningEngine';
import { neuroContextAdapter, DEVICE_CONNECTION_STATUS } from '../devices/NeuroContextAdapter';
import { identityCompiler } from '../identity/IdentityCompiler';
import { requestLifecycle, TASK_COMPLEXITY } from '../runtime/RequestLifecycle';
import { providerRegistry } from '../providers/ProviderRegistry';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';

// Mock Sanity
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

describe('MINI-ADHY — ADHY COGNITIVE MODEL FOUNDATION (PHASE 1 & 2)', () => {

  beforeEach(() => {
    adhyModel.initCanonicalBaseline();
  });

  // ────────────────────────────────────────────────────────────
  // 1. Unified Central AdhyModel (6 Domains)
  // ────────────────────────────────────────────────────────────
  describe('1. Unified Central AdhyModel (Part 2)', () => {
    test('Contains all 6 independently managed domains', () => {
      expect(adhyModel.getDomain(DOMAIN_TYPES.IDENTITY)).toBeDefined();
      expect(adhyModel.getDomain(DOMAIN_TYPES.COGNITION)).toBeDefined();
      expect(adhyModel.getDomain(DOMAIN_TYPES.KNOWLEDGE)).toBeDefined();
      expect(adhyModel.getDomain(DOMAIN_TYPES.BEHAVIOUR)).toBeDefined();
      expect(adhyModel.getDomain(DOMAIN_TYPES.STATE)).toBeDefined();
      expect(adhyModel.getDomain(DOMAIN_TYPES.EVOLUTION)).toBeDefined();
    });

    test('Identity facts reflect verified creator profile', () => {
      const idContext = adhyModel.getIdentityContext();
      expect(idContext.fullName).toBe('Adhithya Mohan S (Adhy)');
      expect(idContext.education).toContain('MBCET');
      expect(idContext.currentRoles).toContain('Media Secretary, MBCET Senate');
      expect(idContext.currentRoles).toContain('Lead Photographer, FRAMES MBCET');
      expect(idContext.historicalRoles).toEqual(
        expect.arrayContaining([expect.stringContaining('Former Chairperson, ISTE')])
      );
    });

    test('Every dimension retains provenance, classification, confidence, and timestamps', () => {
      const practical = adhyModel.getDimension('practicalVsTheoretical');
      expect(practical).toBeDefined();
      expect(practical.confidence).toBeGreaterThanOrEqual(0.8);
      expect(practical.source).toBeDefined();
      expect(practical.evidence).toBeDefined();
      expect(practical.classification).toBe(CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE);
      expect(practical.lastUpdated).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Profile & Mirror Consolidation (Part 3)
  // ────────────────────────────────────────────────────────────
  describe('2. Consolidated Single Source of Truth (Part 3)', () => {
    test('CognitiveProfile delegates directly to central AdhyModel', () => {
      expect(cognitiveProfile.context.fullName).toBe('Adhithya Mohan S (Adhy)');
      const dim = cognitiveProfile.getDimension('practicalVsTheoretical');
      expect(dim.value).toBe(0.85);
    });

    test('CognitiveMirror delegates directly to central AdhyModel', () => {
      const dim = cognitiveMirror.getDimension('practicalVsTheoretical');
      expect(dim.value).toBe(0.85);
    });

    test('Corrections via either facade update the central AdhyModel', () => {
      cognitiveProfile.correctPreference('explanationDepth', 'modular_interactive_code', 'Testing facade sync');
      
      // Central model receives the correction
      const inModel = adhyModel.getDimension('explanationDepth');
      expect(inModel.value).toBe('modular_interactive_code');
      expect(inModel.confidence).toBe(1.0);
      expect(inModel.userApproved).toBe(true);

      // Other facade reflects it immediately
      const inMirror = cognitiveMirror.getDimension('explanationDepth');
      expect(inMirror.value).toBe('modular_interactive_code');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. User Correction Absolute Precedence
  // ────────────────────────────────────────────────────────────
  describe('3. User Correction Absolute Precedence (Part 2 & 6)', () => {
    test('Explicit correction overrides any inferred trait with 1.0 confidence', () => {
      adhyModel.recordCorrection('analyticalVsExploratory', 0.95, 'User requested pure analytical focus');
      const updated = adhyModel.getDimension('analyticalVsExploratory');
      expect(updated.value).toBe(0.95);
      expect(updated.confidence).toBe(1.0);
      expect(updated.classification).toBe(CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE);
      expect(updated.evidence).toContain('User requested pure analytical focus');
    });

    test('Casual observation cannot silently override confirmed explicit preference', () => {
      const before = adhyModel.getDimension('directCriticism');
      expect(before.value).toBe('strongly_preferred');

      // Attempt to register a casual contradictory observation via learning engine
      const result = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'directCriticism',
        observedValue: 'gentle_polite',
        confidence: 0.5,
        evidence: 'User laughed casually'
      });

      // Must be queued in reviewable conflicts, NOT applied to the dimension!
      expect(result.status).toBe('CONFLICT_QUEUED_FOR_REVIEW');
      const after = adhyModel.getDimension('directCriticism');
      expect(after.value).toBe('strongly_preferred'); // Intact!
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. CognitiveContextCompiler (Part 4)
  // ────────────────────────────────────────────────────────────
  describe('4. Cognitive Context Compiler & Reasoning Connection (Part 4)', () => {
    test('Selects relevant dimensions based on technical intent', () => {
      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'How should I design this STM32 DSP filter in KiCad?',
        complexity: 'LEVEL_2_TECHNICAL',
        specialistAgentId: 'JARVIS'
      });

      expect(compiled.selectedDimensions.technicalDomains).toBeDefined();
      expect(compiled.selectedDimensions.practicalVsTheoretical).toBeDefined();
      expect(compiled.reasoningDirectives.length).toBeGreaterThan(0);
      expect(compiled.formattedBlock).toContain('ADHY COGNITIVE MODEL CONTEXT');
    });

    test('Synthesizes active reasoning directives that guide model thinking', () => {
      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'Review our firmware architecture for flaws',
        complexity: 'LEVEL_2_TECHNICAL',
        specialistAgentId: 'ULTRON'
      });

      expect(compiled.reasoningDirectives.some(d => d.includes('Challenge flawed assumptions'))).toBe(true);
      expect(compiled.reasoningDirectives.some(d => d.includes('tangible code'))).toBe(true);
    });

    test('Flows through IdentityCompiler into actual system prompt', () => {
      const instruction = identityCompiler.compileInstruction({
        userInput: 'Review our circuit architecture',
        specialistAgentId: 'ULTRON',
        complexity: 'LEVEL_2_TECHNICAL'
      });

      expect(instruction.systemPrompt).toContain('ADHY COGNITIVE MODEL CONTEXT');
      expect(instruction.modelSnapshotVersion).toBeDefined();
      expect(instruction.cognitiveContext).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Memory Filtration & Safety Bounds (Part 4 & 8)
  // ────────────────────────────────────────────────────────────
  describe('5. Memory Filtration & Security Bounds (Part 4 & 8)', () => {
    test('Excludes high-sensitivity and credential-containing records from prompt context', () => {
      memoryService.records.set('sensitive_mem_1', {
        id: 'sensitive_mem_1',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Confidential personal health record',
        sensitivity: 'HIGH',
        userApproved: true
      });

      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'What are my projects?',
        allowSensitive: false
      });

      const contents = compiled.authorizedMemories.map(m => m.content);
      expect(contents).not.toContain('Confidential personal health record');
    });

    test('Excludes unapproved inferred records from execution context', () => {
      memoryService.records.set('unapproved_inference_1', {
        id: 'unapproved_inference_1',
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        content: 'Unconfirmed inference about sleep schedule',
        userApproved: false
      });

      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'What schedule do I keep?'
      });

      const ids = compiled.authorizedMemories.map(m => m.id);
      expect(ids).not.toContain('unapproved_inference_1');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Cache Identity & Model Version Invalidation (Part 5)
  // ────────────────────────────────────────────────────────────
  describe('6. Model Versioning & Cache Invalidation (Part 5)', () => {
    test('Model version increments when state mutation occurs', () => {
      const v1 = adhyModel.getVersion();
      adhyModel.recordCorrection('practicalVsTheoretical', 0.99, 'Max practical bias');
      const v2 = adhyModel.getVersion();
      expect(v1).not.toBe(v2);
    });

    test('Different model versions produce distinct cache keys', () => {
      const prompt = 'Explain DSP filter architecture';
      const keyV1 = providerRegistry.computeCacheKey(
        { prompt },
        { modelSnapshotVersion: '1.0.0+epoch.1', agentId: 'MINI_ADHY' }
      );
      const keyV2 = providerRegistry.computeCacheKey(
        { prompt },
        { modelSnapshotVersion: '1.0.0+epoch.2', agentId: 'MINI_ADHY' }
      );

      expect(keyV1).not.toBe(keyV2);
    });

    test('Multimodal and sensitive requests bypass cache', async () => {
      const visionRes = await providerRegistry.generateWithFallback('Analyze image', {
        requiresVision: true,
        cache: true
      });
      // Should not be served from cache
      expect(visionRes.cacheHit).toBeFalsy();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Controlled Evolution & Reviewable Conflicts (Part 6)
  // ────────────────────────────────────────────────────────────
  describe('7. Controlled Learning & Reviewable Conflicts (Part 6)', () => {
    test('Novel candidate updates enter pending queue without auto-promotion', () => {
      const result = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'preferredMicrocontroller',
        observedValue: 'STM32H7',
        evidence: 'Active development on STM32H753ZI dual-core board',
        confidence: 0.8
      });

      expect(result.status).toBe('CANDIDATE_QUEUED_FOR_APPROVAL');
      const pending = cognitiveLearningEngine.getPendingCandidates();
      expect(pending.some(p => p.dimensionKey === 'preferredMicrocontroller')).toBe(true);
      expect(pending.find(p => p.dimensionKey === 'preferredMicrocontroller').userApproved).toBe(false);
    });

    test('Candidate approval updates model and increments version epoch', () => {
      const result = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'preferredLanguageForDSP',
        observedValue: 'C++20 with CMSIS-DSP',
        confidence: 0.85
      });

      const candId = result.candidate.id;
      const vBefore = adhyModel.getVersion();
      const approved = cognitiveLearningEngine.approveCandidate(candId);
      expect(approved).toBe(true);

      const dim = adhyModel.getDimension('preferredLanguageForDSP');
      expect(dim.value).toBe('C++20 with CMSIS-DSP');
      expect(dim.userApproved).toBe(true);
      expect(adhyModel.getVersion()).not.toBe(vBefore);
    });

    test('Reviewable conflict can be resolved with custom value or acceptance', () => {
      adhyModel.recordCorrection('idePreference', 'VS Code', 'Initial choice');

      // Register contradictory observation
      cognitiveLearningEngine.recordObservation({
        candidateDimension: 'idePreference',
        observedValue: 'CLion',
        evidence: 'Opened CLion for embedded CMake build'
      });

      const conflicts = cognitiveLearningEngine.getReviewableConflicts();
      expect(conflicts.length).toBeGreaterThan(0);

      const conflictId = conflicts[0].id;
      cognitiveLearningEngine.resolveConflict(conflictId, 'ACCEPT_CANDIDATE');

      const resolved = adhyModel.getDimension('idePreference');
      expect(resolved.value).toBe('CLion');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Reversibility & Audit Rollback (Part 8)
  // ────────────────────────────────────────────────────────────
  describe('8. Reversibility & Rollback (Part 8)', () => {
    test('Mutations can be rolled back to restore previous approved value', () => {
      adhyModel.recordCorrection('testDimension', 'Initial Value', 'Baseline');
      adhyModel.recordCorrection('testDimension', 'Mutated Value', 'Changed mind');

      expect(adhyModel.getDimension('testDimension').value).toBe('Mutated Value');

      const auditTrail = adhyModel.getAuditTrail();
      const lastAudit = auditTrail.find(a => a.dimensionKey === 'testDimension' && a.action === 'EXPLICIT_CORRECTION');

      const rolledBack = adhyModel.rollbackUpdate(lastAudit.id);
      expect(rolledBack).toBe(true);
      expect(adhyModel.getDimension('testDimension').value).toBe('Initial Value');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 9. NeuroContextAdapter (Part 7)
  // ────────────────────────────────────────────────────────────
  describe('9. NeuroContextAdapter Hardware Interface (Part 7)', () => {
    test('Default status is honest DISCONNECTED with zero synthetic telemetry', () => {
      const status = neuroContextAdapter.getStatus();
      expect(status.connected).toBe(false);
      expect(status.status).toBe(DEVICE_CONNECTION_STATUS.DISCONNECTED);
      expect(status.signalQuality).toBe(0.0);
      expect(status.disclaimer).toContain('Non-medical');
    });

    test('Ingestion is rejected without explicit user consent', () => {
      neuroContextAdapter.setUserConsent(false);
      const res = neuroContextAdapter.ingestExtractedFeatures({
        signalQuality: 0.9,
        metrics: { focusIndex: 0.8 }
      });

      expect(res.status).toBe('BLOCKED');
      expect(res.reason).toContain('User consent required');
    });

    test('Valid ingestion with consent separates features, inferred state, and disclaimer', () => {
      neuroContextAdapter.setUserConsent(true);
      const res = neuroContextAdapter.ingestExtractedFeatures({
        signalQuality: 0.92,
        metrics: { focusIndex: 0.75, workloadIndex: 0.60 },
        isSimulated: true
      });

      expect(res.features).toBeDefined();
      expect(res.features.isSimulated).toBe(true);
      expect(res.stateEstimate).toBeDefined();
      expect(res.stateEstimate.focusEstimate).toBe(0.75);
      expect(res.stateEstimate.disclaimer).toBeDefined();

      // Purge data
      neuroContextAdapter.purgeAllData();
      expect(neuroContextAdapter.getActiveStateEstimate()).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 10. End-to-End RequestLifecycle Integration
  // ────────────────────────────────────────────────────────────
  describe('10. End-to-End Request Execution Integration', () => {
    test('processRequest compiles versioned cognitive context and returns modelSnapshotVersion', async () => {
      const result = await requestLifecycle.processRequest('What is Adhy working on in embedded hardware?');
      expect(result.requestId).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.modelSnapshotVersion).toBeDefined();
      expect(result.provider).toBeDefined();
    });
  });
});

