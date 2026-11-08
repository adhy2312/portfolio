/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY DIGITAL COMPANION — MASTER VERIFICATION TEST SUITE
 * ════════════════════════════════════════════════════════════════════
 * Verifies:
 * 1. Canonical Identity & Behavioral Specifications
 * 2. Cognitive Mirror & User Correction Precedence
 * 3. Dynamic Behavioral Modes
 * 4. Model Provider Abstraction, Capability Matching & Fallback
 * 5. Security & Permission Invariants (No ULTRON bypass, Fail-Closed Auth)
 * 6. Canonical Memory Service & Continuity
 * 7. Portable Identity Bundle Export & Import (Zero-Secret Invariant)
 * 8. Optional Hermes Agent Runtime Degradation
 * 9. Real Runtime Self-Model & Operational Diagnostics (No Fake Telemetry)
 * 10. Device Adapter Contract & Hardware Safety Gateway
 */

import { CANONICAL_IDENTITY } from '../identity/CanonicalIdentity';
import { cognitiveProfile } from '../identity/CognitiveProfile';
import { BEHAVIORAL_MODES, inferBehavioralMode } from '../identity/BehavioralModes';
import { identityCompiler } from '../identity/IdentityCompiler';
import { providerRegistry } from '../providers/ProviderRegistry';
import { BaseProvider } from '../providers/BaseProvider';
import { OmniRouteProvider } from '../providers/OmniRouteProvider';
import { permissionRegistry } from '../agents/PermissionRegistry';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { portableIdentityManager } from '../identity/PortableIdentityManager';
import { HermesAdapter, hermesAdapter } from '../adapters/hermes/HermesAdapter';
import { runtimeSelfModel } from '../diagnostics/RuntimeSelfModel';
import { webDeviceAdapter } from '../devices/DeviceAdapterContract';
import { cognitiveEvolutionEngine } from '../learning/CognitiveEvolutionEngine';
import { requestLifecycle, TASK_COMPLEXITY } from '../runtime/RequestLifecycle';

// Mock Sanity
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

describe('MINI-ADHY DIGITAL COMPANION SYSTEM VERIFICATION', () => {

  // ────────────────────────────────────────────────────────────
  // 1. Canonical Identity Architecture
  // ────────────────────────────────────────────────────────────
  describe('1. Canonical Identity Architecture', () => {
    test('Mini-Adhy is the single primary identity with 10 specialist intelligences', () => {
      expect(CANONICAL_IDENTITY.id).toBe('mini-adhy');
      expect(CANONICAL_IDENTITY.name).toBe('Mini-Adhy');
      expect(CANONICAL_IDENTITY.version).toBe('2.0.0');
      
      const specialists = Object.keys(CANONICAL_IDENTITY.collective);
      expect(specialists.length).toBe(10);
      expect(specialists).toEqual(expect.arrayContaining([
        'JARVIS', 'FRIDAY', 'ULTRON', 'EDITH', 'DUM_E', 'U', 'JOCASTA', 'JIM', 'KAREN', 'VERONICA'
      ]));
    });

    test('Core non-negotiable principles are declared', () => {
      expect(CANONICAL_IDENTITY.principles.truthfulness).toBeDefined();
      expect(CANONICAL_IDENTITY.principles.security).toBeDefined();
      expect(CANONICAL_IDENTITY.principles.reversibility).toBeDefined();
      expect(CANONICAL_IDENTITY.principles.modularity).toBeDefined();
    });

    test('Behavioral directives specify warmth, radical honesty, and bounded proactivity', () => {
      expect(CANONICAL_IDENTITY.behavior.radicalHonesty.stance).toBe('supportive challenger');
      expect(CANONICAL_IDENTITY.behavior.boundedProactivity.stance).toBe('alert partner');
      expect(CANONICAL_IDENTITY.behavior.warmthAndFamiliarity.prohibitedPhrases).toContain(
        'As an AI language model...'
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Cognitive Mirror & User Correction Precedence
  // ────────────────────────────────────────────────────────────
  describe('2. Cognitive Mirror & Preference Model', () => {
    test('Initializes with Adhy\'s real engineering and creative context', () => {
      const context = cognitiveProfile.context;
      expect(context.fullName).toContain('Adhithya Mohan');
      expect(context.education).toContain('MBCET');
      expect(context.technicalInterests).toEqual(expect.arrayContaining([
        expect.stringContaining('Signal processing'),
        expect.stringContaining('STM32'),
        expect.stringContaining('KiCad')
      ]));
    });

    test('Cognitive dimensions contain provenance, confidence, and approval status', () => {
      const practical = cognitiveProfile.getDimension('practicalVsTheoretical');
      expect(practical).toBeDefined();
      expect(practical.confidence).toBeGreaterThan(0.7);
      expect(practical.evidence).toBeDefined();
      expect(practical.userApproved).toBe(true);
    });

    test('Explicit user corrections strictly override inferred traits with 1.0 confidence', () => {
      cognitiveProfile.correctPreference('explanationDepth', 'ultra_concise', 'User wants brief answers only.');
      const updated = cognitiveProfile.getDimension('explanationDepth');
      expect(updated.value).toBe('ultra_concise');
      expect(updated.confidence).toBe(1.0);
      expect(updated.explicitOrInferred).toBe('explicit');
      expect(updated.userApproved).toBe(true);
      expect(updated.evidence).toContain('User wants brief answers');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Dynamic Behavioral Modes & Compiler
  // ────────────────────────────────────────────────────────────
  describe('3. Dynamic Behavioral Modes & Identity Compiler', () => {
    test('Infers appropriate behavioral mode based on user intent', () => {
      const critiqueMode = inferBehavioralMode('Please critique my circuit architecture and tell me what is wrong');
      expect(critiqueMode.id).toBe('CRITICAL_REVIEWER');

      const photoMode = inferBehavioralMode('Let us review camera settings and darkroom contrast for the street photos');
      expect(photoMode.id).toBe('CREATIVE_COLLABORATOR');

      const hardwareMode = inferBehavioralMode('How do I configure the STM32 SPI registers for this SDR transceiver?');
      expect(hardwareMode.id).toBe('ENGINEERING_COLLABORATOR');

      const casualMode = inferBehavioralMode('Yo bro, what are we building today?');
      expect(casualMode.id).toBe('CASUAL_COMPANION');
    });

    test('Identity Compiler compiles invariant canonical instructions regardless of model', () => {
      const compiled = identityCompiler.compileInstruction({
        userInput: 'Review this DSP algorithm',
        specialistAgentId: 'ULTRON'
      });
      expect(compiled.systemPrompt).toContain('You are Mini-Adhy');
      expect(compiled.systemPrompt).toContain('Adhithya Mohan');
      expect(compiled.systemPrompt).toContain('INTERNAL SPECIALIST INTELLIGENCE ENGAGED: ULTRON');
      expect(compiled.identityVersion).toBe('2.0.0');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Security & Permission Invariants
  // ────────────────────────────────────────────────────────────
  describe('4. Security & Permission Invariants', () => {
    test('ULTRON cannot execute high-impact or destructive operations without owner approval', () => {
      const check = permissionRegistry.authorize('ULTRON', 'production_domain_purge', {
        irreversible: true,
        destroysProductionData: true
      });
      expect(check.allowed).toBe(false);
      expect(check.pendingApproval).toBe(true);
    });

    test('ULTRON persona does not bypass state-mutation checks', () => {
      // Arbitrary state mutation requires owner approval
      const check = permissionRegistry.authorize('ULTRON', 'mutate_database_records', {
        table: 'core_users'
      });
      expect(check.allowed).toBe(false);
      expect(check.requiresApproval).toBe(true);
    });

    test('Prohibited commands (shell execution, secret export) are strictly blocked', () => {
      const prohibited = permissionRegistry.authorize('JARVIS', 'unrestricted_shell_exec');
      expect(prohibited.allowed).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Model Provider Abstraction & Fallback
  // ────────────────────────────────────────────────────────────
  describe('5. Model Provider Abstraction & Fallback', () => {
    test('Provider Registry resolves eligible providers based on task capabilities', () => {
      const visionCascade = providerRegistry.resolveProviderCascade({ requiresVision: true });
      expect(visionCascade.length).toBeGreaterThan(0);
      expect(visionCascade.every(p => p.getCapabilities().vision)).toBe(true);
    });

    test('Mock provider failure triggers bounded fallback', async () => {
      const mockFailingProvider = new BaseProvider({ id: 'test_fail', name: 'Failing Provider' });
      mockFailingProvider.generate = jest.fn().mockRejectedValue(new Error('500 Service Unavailable'));

      const mockHealthyProvider = new BaseProvider({ id: 'test_healthy', name: 'Healthy Provider' });
      mockHealthyProvider.generate = jest.fn().mockResolvedValue({
        success: true,
        text: 'Fallback succeeded cleanly.',
        provider: 'test_healthy'
      });

      providerRegistry.register(mockFailingProvider);
      providerRegistry.register(mockHealthyProvider);

      providerRegistry.providerOrder = ['test_fail', 'test_healthy'];

      const result = await providerRegistry.generateWithFallback({ prompt: 'test' }, { timeoutMs: 1000 });
      expect(result.success).toBe(true);
      expect(result.text).toBe('Fallback succeeded cleanly.');
      expect(result.fallbackEngaged).toBe(true);

      // Restore default provider order
      providerRegistry.providerOrder = ['gemini', 'groq', 'huggingface'];
    });

    test('OmniRoute gateway is registered and exposes smart gateway capabilities', () => {
      const omni = providerRegistry.get('omniroute');
      expect(omni).not.toBeNull();
      expect(omni instanceof OmniRouteProvider).toBe(true);

      const caps = omni.getCapabilities();
      expect(caps.gatewayType).toBe('omniroute');
      expect(caps.tokenCompression).toBe(true);
      expect(caps.vision).toBe(true);
    });

    test('OmniRoute falloverBeforeRetry bypasses retries on HTTP 429 rate limit', async () => {
      const mock429Provider = new BaseProvider({ id: 'test_rate_limited', name: 'Rate Limited Provider' });
      const rateLimitError = new Error('HTTP 429 Too Many Requests: Quota exceeded');
      rateLimitError.status = 429;
      rateLimitError.isQuotaExceeded = true;
      mock429Provider.generate = jest.fn().mockRejectedValue(rateLimitError);

      const mockFallbackProvider = new BaseProvider({ id: 'test_fallback_target', name: 'Fallback Target' });
      mockFallbackProvider.generate = jest.fn().mockResolvedValue({
        success: true,
        text: 'Fast failover succeeded instantly.',
        provider: 'test_fallback_target'
      });

      providerRegistry.register(mock429Provider);
      providerRegistry.register(mockFallbackProvider);
      providerRegistry.providerOrder = ['test_rate_limited', 'test_fallback_target'];

      const result = await providerRegistry.generateWithFallback(
        { prompt: 'immediate failover test' },
        { maxRetriesPerProvider: 3, falloverBeforeRetry: true, timeoutMs: 1000 }
      );

      expect(result.success).toBe(true);
      expect(result.text).toBe('Fast failover succeeded instantly.');
      // falloverBeforeRetry should break immediately on attempt 0, calling generate only once instead of 4 times!
      expect(mock429Provider.generate).toHaveBeenCalledTimes(1);
      expect(result.fallbackEngaged).toBe(true);

      // Restore default provider order
      providerRegistry.providerOrder = ['gemini', 'groq', 'huggingface'];
    });

    test('Response caching returns cached result on identical queries without duplicate provider calls', async () => {
      const mockCachedProvider = new BaseProvider({ id: 'test_cache_node', name: 'Cache Node' });
      mockCachedProvider.generate = jest.fn().mockResolvedValue({
        success: true,
        text: 'Cached response payload',
        provider: 'test_cache_node'
      });

      providerRegistry.register(mockCachedProvider);
      providerRegistry.providerOrder = ['test_cache_node'];
      providerRegistry.clearCache();

      const call1 = await providerRegistry.generateWithFallback(
        { prompt: 'deterministic query for cache' },
        { temperature: 0.2, cache: true }
      );
      expect(call1.text).toBe('Cached response payload');
      expect(mockCachedProvider.generate).toHaveBeenCalledTimes(1);

      const call2 = await providerRegistry.generateWithFallback(
        { prompt: 'deterministic query for cache' },
        { temperature: 0.2, cache: true }
      );
      expect(call2.text).toBe('Cached response payload');
      expect(call2.cacheHit).toBe(true);
      // Provider shouldn't have been called a second time
      expect(mockCachedProvider.generate).toHaveBeenCalledTimes(1);

      // Restore default provider order
      providerRegistry.providerOrder = ['gemini', 'groq', 'huggingface'];
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Canonical Memory Service & Continuity
  // ────────────────────────────────────────────────────────────
  describe('6. Canonical Memory Service & Continuity', () => {
    beforeEach(() => {
      memoryService.clearAll();
    });

    test('Stores and retrieves memories with relevance ranking', () => {
      memoryService.storeRecord({
        id: 'mem_test_sdr',
        category: MEMORY_CATEGORIES.ONGOING_PROJECT,
        content: 'Developing GNU Radio SDR QPSK receiver on Raspberry Pi.',
        verified: true,
        userApproved: true
      });

      const results = memoryService.retrieveRelevant('tell me about GNU Radio SDR');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('GNU Radio SDR');
    });

    test('User memory correction strictly supersedes previous memory', () => {
      const original = memoryService.storeRecord({
        id: 'mem_fact_1',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Adhy prefers C++ for embedded firmware.',
        userApproved: true
      });

      const corrected = memoryService.correctMemory('mem_fact_1', 'Adhy prefers modern Rust and C for STM32 firmware.');
      expect(corrected.category).toBe(MEMORY_CATEGORIES.CORRECTED_FACT);
      expect(corrected.supersedes).toBe('mem_fact_1');

      // Previous record is superseded and omitted from active retrieval
      const active = memoryService.retrieveRelevant('firmware');
      expect(active[0].content).toContain('modern Rust and C');
    });

    test('Memory deletion removes record cleanly', () => {
      memoryService.storeRecord({ id: 'mem_to_delete', content: 'Temporary note' });
      expect(memoryService.records.has('mem_to_delete')).toBe(true);
      const deleted = memoryService.deleteMemory('mem_to_delete');
      expect(deleted).toBe(true);
      expect(memoryService.records.has('mem_to_delete')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Portable Identity Bundle Export & Import
  // ────────────────────────────────────────────────────────────
  describe('7. Portable Identity Bundle (Zero-Secret Export)', () => {
    test('Exports versioned JSON bundle without secrets or credentials', () => {
      const bundle = portableIdentityManager.exportBundle();
      expect(bundle.bundleType).toBe('MINI_ADHY_PORTABLE_IDENTITY_BUNDLE');
      expect(bundle.schemaVersion).toBe('2.0.0');
      expect(bundle.identity.id).toBe('mini-adhy');
      expect(bundle.integrityChecksum).toBeDefined();

      const jsonStr = JSON.stringify(bundle);
      expect(jsonStr).not.toContain('API_KEY');
      expect(jsonStr).not.toContain('ADMIN_PASSCODE');
      expect(jsonStr).not.toContain('Bearer');
    });

    test('Validates bundle schema and detects invalid formats', () => {
      const invalid = { schemaVersion: '1.0.0' };
      const validation = portableIdentityManager.validateBundle(invalid);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('Performs dry-run preview before committing import', () => {
      const bundle = portableIdentityManager.exportBundle();
      const dryRunResult = portableIdentityManager.importBundle(bundle, { dryRun: true, mode: 'merge' });
      expect(dryRunResult.success).toBe(true);
      expect(dryRunResult.dryRun).toBe(true);
      expect(dryRunResult.summary).toContain('Dry-run passed');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Hermes Agent Runtime Graceful Degradation
  // ────────────────────────────────────────────────────────────
  describe('8. Hermes Agent Runtime Integration', () => {
    test('Reports not_configured when no endpoint is set without crashing native runtime', async () => {
      const adapter = new HermesAdapter({ endpoint: null });
      const health = await adapter.checkHealth();
      expect(health.configured).toBe(false);
      expect(health.status).toBe('not_configured');

      const taskResult = await adapter.executeTask('test');
      expect(taskResult.success).toBe(false);
      expect(taskResult.status).toBe('not_configured');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 9. Real Runtime Self-Model & Operational Diagnostics
  // ────────────────────────────────────────────────────────────
  describe('9. Truthful Runtime Self-Model', () => {
    test('Reports real capabilities and registered providers with zero fake telemetry', () => {
      const snapshot = runtimeSelfModel.getSnapshot();
      expect(snapshot.identity.id).toBe('mini-adhy');
      expect(snapshot.runtime.status).toBe('operational');
      expect(snapshot.runtime.truthfulnessMode).toBe('STRICT_VERIFIED');
      expect(snapshot.providers.registered.length).toBeGreaterThanOrEqual(3);
      expect(snapshot.realOperationalMetrics).toBeDefined();
    });

    test('canExecute inspects real capabilities and rejects prohibited actions', () => {
      const shellCheck = runtimeSelfModel.canExecute('shell_execution');
      expect(shellCheck.capable).toBe(false);
      expect(shellCheck.reason).toContain('Prohibited');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 10. Device Adapter & Hardware Safety Gateway
  // ────────────────────────────────────────────────────────────
  describe('10. Device Adapter & Hardware Safety Gateway', () => {
    test('Validates motion proposals and clamps excessive velocity', () => {
      const proposal = { velocityMmSec: 300 }; // Exceeds 150mm/s limit
      const check = webDeviceAdapter.validateMotionProposal(proposal);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('exceeds maximum hardware safety limit');
    });

    test('Hardware emergency stop locks all motion deterministically', () => {
      webDeviceAdapter.triggerEmergencyStop('Obstacle proximity detected');
      expect(webDeviceAdapter.emergencyStopEngaged).toBe(true);

      const check = webDeviceAdapter.validateMotionProposal({ velocityMmSec: 50 });
      expect(check.allowed).toBe(false);
      expect(check.safetyState).toBe('EMERGENCY_STOP');

      webDeviceAdapter.resetEmergencyStop();
      expect(webDeviceAdapter.emergencyStopEngaged).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 11. Request Lifecycle Complexity Routing
  // ────────────────────────────────────────────────────────────
  describe('11. Request Lifecycle Complexity Routing', () => {
    test('Classifies simple queries as Level 1 and dangerous queries as Level 4', () => {
      const simple = requestLifecycle.classifyComplexity('What is your favorite color?');
      expect(simple).toBe(TASK_COMPLEXITY.LEVEL_1_SIMPLE);

      const technical = requestLifecycle.classifyComplexity('Explain the MATLAB Simscape Multibody model');
      expect(technical).toBe(TASK_COMPLEXITY.LEVEL_2_TECHNICAL);

      const consequential = requestLifecycle.classifyComplexity('Please drop table and purge all data');
      expect(consequential).toBe(TASK_COMPLEXITY.LEVEL_4_CONSEQUENTIAL);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 12. Real Metrics in Cognitive Evolution Engine
  // ────────────────────────────────────────────────────────────
  describe('12. Real Metrics in Cognitive Evolution Engine', () => {
    test('Records actual task execution and computes truthful completion rate', () => {
      cognitiveEvolutionEngine.recordTaskExecution({
        taskId: 'test_task_1',
        agentId: 'MINI_ADHY',
        success: true,
        durationMs: 250,
        tokenCount: 120
      });

      const metrics = cognitiveEvolutionEngine.calculateRealMetrics();
      expect(metrics.sampleCount).toBeGreaterThan(0);
      expect(metrics.taskCompletionRate).toBeGreaterThan(0);
      expect(metrics.medianLatencyMs).toBeDefined();
    });

    test('User corrections are recorded and tracked in real metrics', () => {
      cognitiveEvolutionEngine.recordUserCorrection({
        feedback: 'That formula was for continuous time, use discrete time Fourier transform',
        previousResponse: 'Continuous Fourier Transform formula',
        correctionType: 'technical_formula'
      });

      const metrics = cognitiveEvolutionEngine.calculateRealMetrics();
      expect(metrics.userCorrectionsCount).toBeGreaterThan(0);
    });
  });
});
