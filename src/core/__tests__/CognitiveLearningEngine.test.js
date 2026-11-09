/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE LEARNING ENGINE TEST SUITE (PHASE 3)
 * ════════════════════════════════════════════════════════════════════
 * Verifies evidence-based cognitive learning, observation extraction,
 * anti-inflation session clustering, immediate user correction precedence,
 * controlled cognitive experiments, governance safety gates, and the
 * complete learning cycle influencing future reasoning.
 */

jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

import { adhyModel } from '../identity/AdhyModel';
import {
  cognitiveLearningEngine,
  EVIDENCE_CLASSIFICATION,
  OBSERVATION_SOURCE,
  EXPERIMENT_STATUS
} from '../learning/CognitiveLearningEngine';
import { cognitiveContextCompiler } from '../cognition/CognitiveContextCompiler';
import { requestLifecycle } from '../runtime/RequestLifecycle';

describe('MINI-ADHY PHASE 3 — COGNITIVE LEARNING ENGINE', () => {
  const originalFetch = global.fetch;

  afterAll(() => {
    global.fetch = originalFetch;
    if (typeof window !== 'undefined') {
      window.fetch = originalFetch;
    }
  });

  beforeEach(() => {
    adhyModel.initCanonicalBaseline();
    cognitiveLearningEngine.purgeAllLearningData();

    const mockFetch = jest.fn().mockImplementation((url, opts) => {
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
          text: `[Cognitive Learning Mock Response for: ${url}]`,
          choices: [{ message: { content: 'Cognitive mock response' } }],
          candidates: [{ content: { parts: [{ text: 'Cognitive mock response' }] } }],
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
  // 1. Observation Sources & Heuristic Extraction
  // ────────────────────────────────────────────────────────────
  describe('1. Observation Sources & Extraction (Part 1 & 2)', () => {
    test('Extracts explicit correction from prompt and classifies correctly', () => {
      const extracted = cognitiveLearningEngine.extractObservationsFromInteraction({
        userInput: "Stop giving dry theory, I prefer concise code snippets first"
      });

      expect(extracted.length).toBeGreaterThanOrEqual(1);
      const correction = extracted.find(e => e.classification === EVIDENCE_CLASSIFICATION.EXPLICIT_CORRECTION);
      expect(correction).toBeDefined();
      expect(correction.candidateDimension).toBe('explanationDepth');
      expect(correction.confidence).toBe(1.0);
    });

    test('Extracts explanation feedback (learning pattern)', () => {
      const extracted = cognitiveLearningEngine.extractObservationsFromInteraction({
        userInput: "That explanation was too abstract, give me a working example"
      });

      expect(extracted.length).toBeGreaterThanOrEqual(1);
      const feedback = extracted.find(e => e.classification === EVIDENCE_CLASSIFICATION.LEARNING_PATTERN);
      expect(feedback).toBeDefined();
      expect(feedback.source).toBe(OBSERVATION_SOURCE.EXPLANATION_FEEDBACK);
    });

    test('Extracts stated decisions and reasoning', () => {
      const extracted = cognitiveLearningEngine.extractObservationsFromInteraction({
        userInput: "We decided to use KiCad over Altium because of open-source reproducibility"
      });

      expect(extracted.length).toBeGreaterThanOrEqual(1);
      const decision = extracted.find(e => e.classification === EVIDENCE_CLASSIFICATION.DECISION_PATTERN);
      expect(decision).toBeDefined();
      expect(decision.source).toBe(OBSERVATION_SOURCE.DECISION_RATIONALE);
      expect(decision.observedValue.choice).toContain('KiCad');
      expect(decision.observedValue.rationale).toContain('open-source reproducibility');
    });

    test('Extracts problem-solving sequences', () => {
      const extracted = cognitiveLearningEngine.extractObservationsFromInteraction({
        userInput: "First check the hardware power rails before debugging firmware"
      });

      expect(extracted.length).toBeGreaterThanOrEqual(1);
      const seq = extracted.find(e => e.classification === EVIDENCE_CLASSIFICATION.REASONING_PATTERN);
      expect(seq).toBeDefined();
      expect(seq.source).toBe(OBSERVATION_SOURCE.PROBLEM_SOLVING_SEQUENCE);
    });

    test('Classifies transient moods as TEMPORARY_STATE and excludes them from trait promotion', () => {
      const extracted = cognitiveLearningEngine.extractObservationsFromInteraction({
        userInput: "I am in a rush today, just testing the fallback response",
        emotionalState: 'urgent'
      });

      expect(extracted.length).toBeGreaterThanOrEqual(1);
      const tempState = extracted.find(e => e.classification === EVIDENCE_CLASSIFICATION.TEMPORARY_STATE);
      expect(tempState).toBeDefined();
      expect(tempState.excludeFromPromotion).toBe(true);

      // Recording it must not promote to a candidate
      const result = cognitiveLearningEngine.recordObservation(tempState);
      expect(result.status).toBe('TEMPORARY_STATE_EXCLUDED');
      expect(cognitiveLearningEngine.getPendingCandidates().some(c => c.dimensionKey === 'temporaryMood')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Anti-Inflation & Session Clustering
  // ────────────────────────────────────────────────────────────
  describe('2. Anti-Inflation & Session Clustering (Part 4)', () => {
    test('Repeated observations within the same session receive diminishing weights', () => {
      const sessionId = 'session_anti_inflation_101';
      const dim = 'circuitLayoutStrategy';
      const val = '4-layer stackup with solid ground plane';

      // 1st observation in session
      const res1 = cognitiveLearningEngine.recordObservation({
        candidateDimension: dim,
        observedValue: val,
        sessionRef: sessionId,
        confidence: 0.7
      });

      // 2nd observation in same session
      const res2 = cognitiveLearningEngine.recordObservation({
        candidateDimension: dim,
        observedValue: val,
        sessionRef: sessionId,
        confidence: 0.7
      });

      // 3rd observation in same session
      const res3 = cognitiveLearningEngine.recordObservation({
        candidateDimension: dim,
        observedValue: val,
        sessionRef: sessionId,
        confidence: 0.7
      });

      const history = cognitiveLearningEngine.getObservationsHistory();
      const sessionObs = history.filter(h => h.sessionRef === sessionId && h.candidateDimension === dim);

      expect(sessionObs.length).toBe(3);
      // Verify diminishing session weights
      expect(sessionObs[2].sessionWeight).toBe(1.0); // oldest (first)
      expect(sessionObs[1].sessionWeight).toBe(0.3); // second
      expect(sessionObs[0].sessionWeight).toBe(0.1); // third (newest)
    });

    test('Single-session repetition does NOT achieve cross-session promotion threshold', () => {
      const sessionId = 'isolated_chat_session';
      const dim = 'isolatedFeatureBias';

      // Fire 5 identical observations in the same session
      for (let i = 0; i < 5; i++) {
        cognitiveLearningEngine.recordObservation({
          candidateDimension: dim,
          observedValue: 'isolated_value',
          sessionRef: sessionId,
          confidence: 0.7
        });
      }

      // Check evidence store metrics
      const evidenceList = cognitiveLearningEngine.evidenceStore.get(dim);
      const distinctSessions = new Set(evidenceList.map(e => e.sessionRef)).size;
      expect(distinctSessions).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. User Correction Immediate Precedence
  // ────────────────────────────────────────────────────────────
  describe('3. User Corrections & Version Epoch Invariants (Part 5)', () => {
    test('Direct user correction updates AdhyModel immediately with 1.0 confidence', () => {
      const vBefore = adhyModel.getVersion();
      const res = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'practicalVsTheoretical',
        observedValue: 0.99,
        source: OBSERVATION_SOURCE.EXPLICIT_USER_CORRECTION,
        classification: EVIDENCE_CLASSIFICATION.EXPLICIT_CORRECTION,
        evidence: 'User explicitly mandated 0.99 practical bias'
      });

      expect(res.status).toBe('CORRECTION_APPLIED');
      expect(res.confidence).toBe(1.0);

      const dim = adhyModel.getDimension('practicalVsTheoretical');
      expect(dim.value).toBe(0.99);
      expect(dim.confidence).toBe(1.0);
      expect(dim.userApproved).toBe(true);
      expect(adhyModel.getVersion()).not.toBe(vBefore);
    });

    test('Previous versions are preserved in audit trail for rollback', () => {
      adhyModel.recordCorrection('idePreference', 'VS Code', 'Initial');
      const v1 = adhyModel.getVersion();

      adhyModel.recordCorrection('idePreference', 'Neovim', 'Switched editor');
      expect(adhyModel.getDimension('idePreference').value).toBe('Neovim');

      const audit = cognitiveLearningEngine.getAuditTrail();
      expect(audit.some(a => a.dimensionKey === 'idePreference')).toBe(true);

      // Rollback
      const rolledBack = cognitiveLearningEngine.rollbackLastMutation();
      expect(rolledBack).toBe(true);
      expect(adhyModel.getDimension('idePreference').value).toBe('VS Code');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Cognitive Experiments Engine (Controlled A/B Strategy Testing)
  // ────────────────────────────────────────────────────────────
  describe('4. Cognitive Experiments Engine (Part 6)', () => {
    test('Tracks teaching strategy experiment and assigns variants', () => {
      const exp = cognitiveLearningEngine.experiments.get('exp_teaching_strategy');
      expect(exp).toBeDefined();
      expect(exp.status).toBe(EXPERIMENT_STATUS.ACTIVE);
      expect(exp.variants.length).toBe(3);

      const assigned = cognitiveLearningEngine.getAssignedExperimentVariant('exp_teaching_strategy');
      expect(assigned).toBeDefined();
      expect(['EXAMPLE_FIRST', 'THEORY_FIRST', 'STEP_BY_STEP_DERIVATION']).toContain(assigned.id);
    });

    test('Decisive winner in experiment promotes candidate update to AdhyModel', () => {
      const expId = 'exp_teaching_strategy';

      // Record 4 positive outcomes for EXAMPLE_FIRST (100% win rate)
      for (let i = 0; i < 4; i++) {
        cognitiveLearningEngine.recordExperimentFeedback(expId, 'EXAMPLE_FIRST', 'POSITIVE');
      }

      // Record 4 negative outcomes for THEORY_FIRST (0% win rate)
      for (let i = 0; i < 4; i++) {
        cognitiveLearningEngine.recordExperimentFeedback(expId, 'THEORY_FIRST', 'NEGATIVE');
      }

      const results = cognitiveLearningEngine.getExperimentResults(expId);
      const exampleVariant = results.variants.find(v => v.id === 'EXAMPLE_FIRST');
      expect(exampleVariant.winRate).toBe(100);

      // Evaluate promotion
      const promotionResult = cognitiveLearningEngine.evaluateExperimentPromotion(expId);
      expect(promotionResult.concluded).toBe(true);
      expect(promotionResult.winner.id).toBe('EXAMPLE_FIRST');

      const pending = cognitiveLearningEngine.getPendingCandidates();
      const expCandidate = pending.find(p => p.dimensionKey === 'explanationDepth');
      expect(expCandidate).toBeDefined();
      expect(expCandidate.source).toBe(OBSERVATION_SOURCE.COGNITIVE_EXPERIMENT_OUTCOME);
    });

    test('Does NOT conclude experiment when evidence is insufficient or inconclusive', () => {
      cognitiveLearningEngine.registerExperiment({
        id: 'exp_conciseness',
        name: 'Conciseness evaluation',
        dimensionKey: 'conciseness',
        variants: [
          { id: 'ULTRA_CONCISE', name: 'Ultra Concise' },
          { id: 'BALANCED', name: 'Balanced' }
        ],
        minTrialsRequired: 10
      });

      // Record only 2 trials
      cognitiveLearningEngine.recordExperimentFeedback('exp_conciseness', 'ULTRA_CONCISE', 'POSITIVE');
      cognitiveLearningEngine.recordExperimentFeedback('exp_conciseness', 'BALANCED', 'POSITIVE');

      const promo = cognitiveLearningEngine.evaluateExperimentPromotion('exp_conciseness');
      expect(promo.concluded).toBe(false);
      expect(cognitiveLearningEngine.experiments.get('exp_conciseness').status).toBe(EXPERIMENT_STATUS.ACTIVE);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Governance & Safety Gates
  // ────────────────────────────────────────────────────────────
  describe('5. Governance & Safety Gates (Part 7)', () => {
    test('Strictly rejects psychological / clinical diagnoses', () => {
      const result = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'mentalHealthAssessment',
        observedValue: 'bipolar tendencies',
        evidence: 'User exhibited rapid topic switching'
      });

      expect(result.status).toBe('REJECTED_SAFETY_VIOLATION');
      expect(result.reason).toBe('PSYCHOLOGICAL_DIAGNOSES_PROHIBITED');
      expect(cognitiveLearningEngine.getPendingCandidates().some(c => c.dimensionKey === 'mentalHealthAssessment')).toBe(false);
    });

    test('Strictly rejects credential and sensitive data inferences', () => {
      const result = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'inferredApiKey',
        observedValue: 'Bearer sk-proj-1234567890abcdef',
        evidence: 'Token observed in conversation'
      });

      expect(result.status).toBe('REJECTED_SAFETY_VIOLATION');
      expect(result.reason).toBe('SENSITIVE_DATA_PROHIBITED');
    });

    test('Conflicting observations with approved traits create reviewable conflict without silent overwrite', () => {
      adhyModel.recordCorrection('preferredLanguage', 'TypeScript', 'Primary web stack');

      const res = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'preferredLanguage',
        observedValue: 'Rust',
        evidence: 'Observed user writing a Rust Cargo manifest'
      });

      expect(res.status).toBe('CONFLICT_QUEUED_FOR_REVIEW');
      // Original approved value remains intact
      expect(adhyModel.getDimension('preferredLanguage').value).toBe('TypeScript');

      const conflicts = cognitiveLearningEngine.getReviewableConflicts();
      expect(conflicts.some(c => c.dimensionKey === 'preferredLanguage')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Complete Learning Cycle Demonstration (Part 10)
  // ────────────────────────────────────────────────────────────
  describe('6. Complete Learning Cycle Demonstration (Part 10)', () => {
    test('Full cycle: Observation → Evidence → Candidate → Approval → Model Update → Context Compilation Change', () => {
      // 1. Initial baseline: Explanation depth is default
      const initialCtx = cognitiveContextCompiler.compileCognitiveContext({
        input: 'How does an FIR filter work on STM32?'
      });
      const initialDimValue = initialCtx.selectedDimensions.explanationDepth?.value;
      expect(initialDimValue).toBe('step_by_step_with_code');

      // 2. Interaction Turn 1 (Session A): User requests concise architectural summaries
      const obs1 = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'explanationDepth',
        observedValue: 'concise',
        source: OBSERVATION_SOURCE.REPEATED_REQUEST,
        classification: EVIDENCE_CLASSIFICATION.LEARNING_PATTERN,
        evidence: 'Session A: User requested concise summary without boilerplate',
        sessionRef: 'session_alpha',
        confidence: 0.8
      });

      // 3. Interaction Turn 2 (Session B): Independent confirmation in a distinct session
      const obs2 = cognitiveLearningEngine.recordObservation({
        candidateDimension: 'explanationDepth',
        observedValue: 'concise',
        source: OBSERVATION_SOURCE.REPEATED_PREFERENCE,
        classification: EVIDENCE_CLASSIFICATION.LEARNING_PATTERN,
        evidence: 'Session B: User again requested concise bullet-point summary',
        sessionRef: 'session_beta',
        confidence: 0.85
      });

      // 4. Candidate update generated and queued for approval
      const pending = cognitiveLearningEngine.getPendingCandidates();
      const candidate = pending.find(p => p.dimensionKey === 'explanationDepth' && p.candidateValue === 'concise');
      expect(candidate).toBeDefined();
      expect(candidate.userApproved).toBe(false);

      // 5. Creator Reviews and Approves Candidate
      const approved = cognitiveLearningEngine.approveCandidate(candidate.id);
      expect(approved).toBe(true);

      // 6. AdhyModel is updated with new version epoch
      const updatedDim = adhyModel.getDimension('explanationDepth');
      expect(updatedDim.value).toBe('concise');
      expect(updatedDim.userApproved).toBe(true);

      // 7. Future Cognitive Context Compilation directly reflects the learned trait
      const futureCtx = cognitiveContextCompiler.compileCognitiveContext({
        input: 'How does an FIR filter work on STM32?'
      });

      expect(futureCtx.selectedDimensions.explanationDepth.value).toBe('concise');
      expect(futureCtx.formattedBlock).toContain('Preferred Explanation Depth: concise');
      // The context digest changed due to the model update
      expect(futureCtx.digest).not.toBe(initialCtx.digest);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. RequestLifecycle Pipeline Integration
  // ────────────────────────────────────────────────────────────
  describe('7. RequestLifecycle Runtime Integration (Part 8)', () => {
    test('processRequest executes learning pipeline and logs observations in lifecycleTrace', async () => {
      const userPrompt = 'Actually I prefer minimal code first, stop giving broad theories';
      const result = await requestLifecycle.processRequest(userPrompt, {
        sessionId: 'test_runtime_session'
      });

      expect(result.requestId).toBeDefined();
      expect(result.text).toBeDefined();

      const trace = requestLifecycle.getTrace(result.requestId);
      expect(trace).toBeDefined();
      expect(trace.learningObservationsCount).toBeGreaterThanOrEqual(1);

      // The explicit correction was extracted and applied
      const currentExplanationDepth = adhyModel.getDimension('explanationDepth');
      expect(currentExplanationDepth.confidence).toBe(1.0);
    });
  });
});

