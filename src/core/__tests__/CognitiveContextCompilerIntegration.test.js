/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE CONTEXT COMPILER INTEGRATION TEST SUITE (PHASE 2)
 * ════════════════════════════════════════════════════════════════════
 * Verifies end-to-end integration of the AdhyModel and CognitiveContextCompiler
 * into Mini-Adhy's active reasoning pipeline across providers, task profiles,
 * memory governance, collision-resistant caching, and observability.
 */

jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { adhyModel } from '../identity/AdhyModel';
import { cognitiveContextCompiler, TASK_CATEGORIES } from '../cognition/CognitiveContextCompiler';
import { identityCompiler } from '../identity/IdentityCompiler';
import { requestLifecycle } from '../runtime/RequestLifecycle';
import { providerRegistry } from '../providers/ProviderRegistry';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { GeminiProvider } from '../providers/GeminiProvider';
import { GroqProvider } from '../providers/GroqProvider';
import { OpenRouterProvider } from '../providers/OpenRouterProvider';

describe('PHASE 2 — COGNITIVE CONTEXT COMPILER INTEGRATION', () => {
  const originalFetch = global.fetch;
  let mockFetch;

  afterAll(() => {
    global.fetch = originalFetch;
    if (typeof window !== 'undefined') {
      window.fetch = originalFetch;
    }
  });

  beforeEach(() => {
    adhyModel.initCanonicalBaseline();
    memoryService.records.clear();
    memoryService.initBaselineMemories();

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

  // ────────────────────────────────────────────────────────────
  // 1. Task Classification across all 9 Categories
  // ────────────────────────────────────────────────────────────
  describe('1. Task Classification (9 Contextual Profiles)', () => {
    const scenarios = [
      {
        input: 'Debug STM32 ADC DMA buffer overrun in KiCad schematic',
        expected: TASK_CATEGORIES.ENGINEERING_ELECTRONICS
      },
      {
        input: 'Refactor React Vite hook and fix bug in node express backend API',
        expected: TASK_CATEGORIES.PROGRAMMING_DEVELOPMENT
      },
      {
        input: 'Explain KTU syllabus Fourier transform derivation step by step for my exam',
        expected: TASK_CATEGORIES.ACADEMIC_TUTORING
      },
      {
        input: 'Critique this street photography composition shot with wide aperture and high ISO for FRAMES',
        expected: TASK_CATEGORIES.PHOTOGRAPHY_VISUAL
      },
      {
        input: 'Coordinate ISTE symposium delegation and plan student council senate committee review',
        expected: TASK_CATEGORIES.LEADERSHIP_MANAGEMENT
      },
      {
        input: 'Review architecture roadmap for Mini-Adhy companion robot project',
        expected: TASK_CATEGORIES.PERSONAL_PROJECTS
      },
      {
        input: 'Survey IEEE literature review on ISRO space research satellite payloads',
        expected: TASK_CATEGORIES.RESEARCH
      },
      {
        input: 'Decide between monolithic vs distributed state: trade-off matrix and roadmap dependencies',
        expected: TASK_CATEGORIES.PLANNING_DECISION
      },
      {
        input: 'Hey how are you doing today? What is your take on rainy afternoons?',
        expected: TASK_CATEGORIES.GENERAL_CONVERSATION
      }
    ];

    test.each(scenarios)('Correctly classifies "$input" as $expected', ({ input, expected }) => {
      const category = cognitiveContextCompiler.classifyTask(input);
      expect(category).toBe(expected);
    });

    test('Honors explicit category override when provided', () => {
      const category = cognitiveContextCompiler.classifyTask('Tell me about photography', {
        forceCategory: TASK_CATEGORIES.ENGINEERING_ELECTRONICS
      });
      expect(category).toBe(TASK_CATEGORIES.ENGINEERING_ELECTRONICS);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Dynamic Task Context Profiles (Demonstrating >= 3 Distinct Contexts)
  // ────────────────────────────────────────────────────────────
  describe('2. Dynamic Task Context Profiles (Context Differentiation)', () => {
    test('Electronics vs Photography vs Leadership produce distinct context, dimensions & directives', () => {
      // Task Context A: Engineering & Electronics
      const ctxElectronics = cognitiveContextCompiler.compileCognitiveContext({
        input: 'Analyze PCB signal integrity on KiCad with STM32'
      });

      // Task Context B: Photography & Visual Design
      const ctxPhotography = cognitiveContextCompiler.compileCognitiveContext({
        input: 'Review street photography framing and aperture settings for FRAMES darkroom'
      });

      // Task Context C: Leadership & Event Management
      const ctxLeadership = cognitiveContextCompiler.compileCognitiveContext({
        input: 'Organize ISTE symposium and delegate responsibilities for Senate event'
      });

      // A: Electronics Verification
      expect(ctxElectronics.taskCategory).toBe(TASK_CATEGORIES.ENGINEERING_ELECTRONICS);
      expect(ctxElectronics.selectedDimensions.technicalDomains).toBeDefined();
      expect(ctxElectronics.selectedDimensions.knownGaps).toBeDefined();
      expect(ctxElectronics.selectedDimensions.creativeDomains).toBeUndefined();
      expect(ctxElectronics.excludedContext.dimensions).toContain('creativeDomains');
      expect(ctxElectronics.reasoningDirectives.some(d => d.includes('STM32'))).toBe(true);

      // B: Photography Verification
      expect(ctxPhotography.taskCategory).toBe(TASK_CATEGORIES.PHOTOGRAPHY_VISUAL);
      expect(ctxPhotography.selectedDimensions.creativeDomains).toBeDefined();
      expect(ctxPhotography.selectedDimensions.currentRoles).toBeDefined();
      expect(ctxPhotography.selectedDimensions.technicalDomains).toBeUndefined();
      expect(ctxPhotography.selectedDimensions.knownGaps).toBeUndefined();
      expect(ctxPhotography.excludedContext.dimensions).toContain('technicalDomains');
      expect(ctxPhotography.reasoningDirectives.some(d => d.includes('visual hierarchy') || d.includes('frames'))).toBe(true);

      // C: Leadership Verification
      expect(ctxLeadership.taskCategory).toBe(TASK_CATEGORIES.LEADERSHIP_MANAGEMENT);
      expect(ctxLeadership.selectedDimensions.currentRoles).toBeDefined();
      expect(ctxLeadership.selectedDimensions.historicalRoles).toBeDefined();
      expect(ctxLeadership.selectedDimensions.collaborationPattern).toBeDefined();
      expect(ctxLeadership.selectedDimensions.technicalDomains).toBeUndefined();
      expect(ctxLeadership.excludedContext.dimensions).toContain('technicalDomains');
      expect(ctxLeadership.reasoningDirectives.some(d => d.includes('delegation') || d.includes('executive clarity'))).toBe(true);

      // All three contexts produce unique digests
      expect(ctxElectronics.digest).not.toBe(ctxPhotography.digest);
      expect(ctxPhotography.digest).not.toBe(ctxLeadership.digest);
      expect(ctxElectronics.digest).not.toBe(ctxLeadership.digest);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Selective Memory & Sensitivity Filtration
  // ────────────────────────────────────────────────────────────
  describe('3. Memory Governance & Exclusion during Compilation', () => {
    test('Excludes photography memories from electronics task', () => {
      memoryService.storeRecord({
        id: 'mem_photo_street',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Favorite photography filter and lens for street frames photography',
        userApproved: true
      });

      memoryService.storeRecord({
        id: 'mem_dsp_fir',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Adhy specializes in FIR filter design on STM32 microcontrollers',
        userApproved: true
      });

      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'Recommend a filter configuration on STM32'
      });

      const selectedMemIds = compiled.authorizedMemories.map(m => m.id);
      expect(selectedMemIds).toContain('mem_dsp_fir');
      expect(selectedMemIds).not.toContain('mem_photo_street');
      expect(compiled.excludedContext.memoryCount).toBeGreaterThanOrEqual(1);
    });

    test('Strictly excludes credentials and high sensitivity memories unless authorized', () => {
      memoryService.storeRecord({
        id: 'mem_sensitive_token',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Configuration bearer token: Bearer sk-proj-1234567890abcdef',
        userApproved: true
      });

      memoryService.storeRecord({
        id: 'mem_high_confidential',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Confidential personal health record note',
        sensitivity: 'HIGH',
        userApproved: true
      });

      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'General note query',
        allowSensitive: false
      });

      const selectedMemIds = compiled.authorizedMemories.map(m => m.id);
      expect(selectedMemIds).not.toContain('mem_sensitive_token');
      expect(selectedMemIds).not.toContain('mem_high_confidential');
    });

    test('Excludes unapproved inferences from prompt compilation', () => {
      memoryService.storeRecord({
        id: 'mem_unapproved_hypothesis',
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        content: 'Hypothesis: user might enjoy Rust programming language',
        userApproved: false
      });

      const compiled = cognitiveContextCompiler.compileCognitiveContext({
        input: 'What language should we use?'
      });

      const selectedMemIds = compiled.authorizedMemories.map(m => m.id);
      expect(selectedMemIds).not.toContain('mem_unapproved_hypothesis');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Cache Identity & Invalidation
  // ────────────────────────────────────────────────────────────
  describe('4. Collision-Resistant Cache Identity', () => {
    test('Different model versions produce distinct cache keys for the exact same prompt', () => {
      const prompt = 'Explain Nyquist sampling limit';

      const keyV1 = providerRegistry.computeCacheKey(
        { prompt },
        { modelSnapshotVersion: '1.0.0+epoch.10', cognitiveDigest: 'ctx_v1' }
      );

      const keyV2 = providerRegistry.computeCacheKey(
        { prompt },
        { modelSnapshotVersion: '1.0.0+epoch.11', cognitiveDigest: 'ctx_v2' }
      );

      expect(keyV1).not.toBe(keyV2);
      expect(keyV1).toMatch(/^cache_MINI_ADHY_[0-9a-f]+_[0-9a-f]+$/);
      expect(keyV2).toMatch(/^cache_MINI_ADHY_[0-9a-f]+_[0-9a-f]+$/);
    });

    test('Different session IDs produce isolated cache keys', () => {
      const prompt = 'What is the current plan?';
      const keySessionA = providerRegistry.computeCacheKey({ prompt }, { sessionId: 'user_session_alpha' });
      const keySessionB = providerRegistry.computeCacheKey({ prompt }, { sessionId: 'user_session_beta' });

      expect(keySessionA).not.toBe(keySessionB);
    });

    test('Model updates invalidate caching for subsequent queries', async () => {
      const prompt = 'What is Adhy’s primary technical focus?';
      const result1 = await providerRegistry.generateWithFallback(prompt, {
        temperature: 0.1,
        modelSnapshotVersion: adhyModel.getVersion()
      });

      expect(result1.text).toBeDefined();

      // Mutate model
      adhyModel.recordCorrection('practicalVsTheoretical', 0.99, 'Forced update for test');

      const result2 = await providerRegistry.generateWithFallback(prompt, {
        temperature: 0.1,
        modelSnapshotVersion: adhyModel.getVersion()
      });

      // Different model version must result in a cache miss / independent generation
      expect(result2.cacheHit).toBeFalsy();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Observability & Inspectable Traces
  // ────────────────────────────────────────────────────────────
  describe('5. Observability & Inspectable Lifecycle Traces', () => {
    test('processRequest records structured lifecycleTrace with full attribution', async () => {
      const query = 'How do I optimize KiCad traces for STM32 high speed SPI?';
      const result = await requestLifecycle.processRequest(query);

      expect(result.requestId).toBeDefined();
      expect(result.modelSnapshotVersion).toBeDefined();
      expect(result.text).toBeDefined();

      const trace = requestLifecycle.getTrace(result.requestId);
      expect(trace).toBeDefined();
      expect(trace.requestId).toBe(result.requestId);
      expect(trace.taskCategory).toBe(TASK_CATEGORIES.ENGINEERING_ELECTRONICS);
      expect(trace.retrievedDimensions).toContain('technicalDomains');
      expect(trace.modelSnapshotVersion).toBe(adhyModel.getVersion());
      expect(trace.provider).toBeDefined();
      expect(typeof trace.durationMs).toBe('number');
      expect(trace.timestamp).toBeDefined();
    });

    test('Compiler retains recent traces for telemetry inspection', () => {
      cognitiveContextCompiler.compileCognitiveContext({ input: 'Trace verification test 1' });
      cognitiveContextCompiler.compileCognitiveContext({ input: 'Trace verification test 2' });

      const traces = cognitiveContextCompiler.getRecentTraces();
      expect(traces.length).toBeGreaterThanOrEqual(2);
      expect(traces[0].digest).toBeDefined();
      expect(traces[0].tokenEstimate).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Provider Payload Integration (Gemini, Groq, OpenRouter)
  // ────────────────────────────────────────────────────────────
  describe('6. Provider Integration & Prompt Preservation', () => {
    test('IdentityCompiler compiles system prompt and preserves it into GeminiProvider', async () => {
      const gemini = new GeminiProvider({ endpoint: '/api/gemini' });
      const instruction = identityCompiler.compileInstruction({
        userInput: 'STM32 firmware timing issue',
        specialistAgentId: 'JARVIS'
      });

      expect(instruction.systemPrompt).toContain('### ADHY COGNITIVE MODEL CONTEXT');
      expect(instruction.systemPrompt).toContain('ENGINEERING_ELECTRONICS');

      const res = await gemini.generate('Fix timing', {
        systemPrompt: instruction.systemPrompt
      });

      expect(res.text).toBeDefined();
      const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
      expect(lastCall[0]).toBe('/api/gemini');
      const sentBody = JSON.parse(lastCall[1].body);
      expect(sentBody.system_instruction.parts[0].text).toBe(instruction.systemPrompt);
      expect(sentBody.system_instruction.parts[0].text).toContain('### ADHY COGNITIVE MODEL CONTEXT');
    });

    test('GroqProvider receives compiled system prompt without alteration', async () => {
      const groq = new GroqProvider({ endpoint: '/api/groq' });
      const instruction = identityCompiler.compileInstruction({
        userInput: 'Fast reflex triage for sensor burst',
        specialistAgentId: 'FRIDAY'
      });

      await groq.generate('Check sensor burst', {
        systemPrompt: instruction.systemPrompt
      });

      const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
      expect(lastCall[0]).toBe('/api/groq');
      const sentBody = JSON.parse(lastCall[1].body);
      expect(sentBody.messages[0].role).toBe('system');
      expect(sentBody.messages[0].content).toBe(instruction.systemPrompt);
      expect(sentBody.messages[0].content).toContain('### ADHY COGNITIVE MODEL CONTEXT');
    });

    test('OpenRouterProvider normalizes multi-turn Gemini-style contents and preserves system prompt', async () => {
      const openRouter = new OpenRouterProvider({ endpoint: '/api/openrouter' });
      const instruction = identityCompiler.compileInstruction({
        userInput: 'Review system failover path'
      });

      const multiTurnRequest = {
        prompt: 'Follow up question',
        contents: [
          { role: 'user', parts: [{ text: 'Hello, what is your architecture?' }] },
          { role: 'model', parts: [{ text: 'I am Mini-Adhy, cognitive companion to Adhithya Mohan.' }] },
          { role: 'user', parts: [{ text: 'Follow up question' }] }
        ]
      };

      await openRouter.generate(multiTurnRequest, {
        systemPrompt: instruction.systemPrompt
      });

      // Verify that the payload sent to /api/openrouter contained OpenAI-formatted messages
      const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
      expect(lastCall[0]).toBe('/api/openrouter');
      const sentBody = JSON.parse(lastCall[1].body);

      expect(Array.isArray(sentBody.messages)).toBe(true);
      expect(sentBody.messages[0].role).toBe('system');
      expect(sentBody.messages[0].content).toBe(instruction.systemPrompt);
      expect(sentBody.messages[1].role).toBe('user');
      expect(sentBody.messages[2].role).toBe('assistant');
      expect(sentBody.messages[3].role).toBe('user');
    });
  });
});

