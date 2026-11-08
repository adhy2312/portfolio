/**
 * ════════════════════════════════════════════════════════════════════
 *  ADHY UNDERSTANDING ARCHITECTURE (AUA) — VERIFICATION SUITE
 * ════════════════════════════════════════════════════════════════════
 * Comprehensive test coverage for:
 * 1. Cognitive Mirror (inferences, evidence, confidence, explicit override)
 * 2. Conversational DNA (message rhythm, sarcasm, burst coalescing)
 * 3. Emotional Context Interpreter (12 states, uncertainty, no diagnosis)
 * 4. Relationship Continuity Engine (projects, decisions, threads)
 * 5. Memory Service v3.0 (schema, supersession, candidate extraction, zero-secrets)
 * 6. Central Behavioural Controller & Stance Synthesis
 * 7. Brain Intent Safety (imperative vs exploratory gating)
 * 8. Portable Identity & Desktop Mini-Bot Serialization
 */

import { cognitiveMirror } from '../understanding/CognitiveMirror';
import { conversationalDNA } from '../understanding/ConversationalDNA';
import { emotionalContextInterpreter, CONVERSATIONAL_STATES } from '../understanding/EmotionalContextInterpreter';
import { relationshipContinuityEngine } from '../understanding/RelationshipContinuityEngine';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';
import { memoryService, MEMORY_CATEGORIES, MEMORY_TYPES } from '../memory/MemoryService';
import { behaviouralController } from '../runtime/BehaviouralController';
import { miniAdhyBrain } from '../MiniAdhyBrain';
import { portableIdentityManager } from '../identity/PortableIdentityManager';

// Mock Sanity for Jest testing environment
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

describe('ADHY UNDERSTANDING ARCHITECTURE (AUA) MASTER TEST SUITE', () => {

  // ────────────────────────────────────────────────────────────
  // 1. Cognitive Mirror
  // ────────────────────────────────────────────────────────────
  describe('1. Cognitive Mirror', () => {
    test('Tracks evidence-backed dimensions with confidence bounds', () => {
      const dim = cognitiveMirror.getDimension('practicalVsTheoretical');
      expect(dim).not.toBeNull();
      expect(dim.value).toBeGreaterThanOrEqual(0.7);
      expect(dim.confidence).toBeGreaterThanOrEqual(0.8);
      expect(dim.evidence).toBeDefined();
    });

    test('Explicit user correction strictly overrides inferred patterns with 1.0 confidence', () => {
      cognitiveMirror.correctDimension(
        'explanationDepth',
        'concise_bullet_points',
        'User explicitly requested concise bullet points only.'
      );

      const updated = cognitiveMirror.getDimension('explanationDepth');
      expect(updated.value).toBe('concise_bullet_points');
      expect(updated.confidence).toBe(1.0);
      expect(updated.type).toBe('explicit');
      expect(updated.userApproved).toBe(true);

      // Restore baseline
      cognitiveMirror.correctDimension('explanationDepth', 'step_by_step_with_code', 'Restoring test default');
    });

    test('Casual observation does not override confirmed explicit preference', () => {
      const pref = cognitiveMirror.getDimension('directCriticismPreference');
      expect(pref.confidence).toBe(0.98);

      cognitiveMirror.recordObservation({
        dimensionKey: 'directCriticismPreference',
        observedValue: 'gentle',
        evidence: 'Casual single comment'
      });

      const after = cognitiveMirror.getDimension('directCriticismPreference');
      expect(after.value).toBe('strongly_preferred'); // Remains intact!
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Conversational DNA
  // ────────────────────────────────────────────────────────────
  describe('2. Conversational DNA', () => {
    test('Identifies rapid successive messages as evolving thought burst', () => {
      conversationalDNA.lastMessageTimestamp = 0;
      const turn1 = conversationalDNA.analyzeMessage('Wait what about the SDR antenna');
      expect(turn1.isRapidFollowUp).toBe(false);

      // Rapid follow-up within 500ms
      conversationalDNA.lastMessageTimestamp = Date.now() - 300;
      const turn2 = conversationalDNA.analyzeMessage('specifically the 433MHz matching network');
      expect(turn2.isRapidFollowUp).toBe(true);
      expect(turn2.coalescedBurst).toContain('antenna');
      expect(turn2.coalescedBurst).toContain('matching network');

      const directives = conversationalDNA.getConversationalDirectives(turn2);
      expect(directives.some(d => d.includes('rapid iterative thoughts'))).toBe(true);
    });

    test('Detects cultural nuances and Kerala tech phrasing without forced mimicry', () => {
      const analysis = conversationalDNA.analyzeMessage('da bro namakk sett aakam this evening');
      expect(analysis.hasCulturalMarkers).toBe(true);

      const directives = conversationalDNA.getConversationalDirectives(analysis);
      expect(directives.some(d => d.includes('namakk sett aakam'))).toBe(true);
      expect(directives.some(d => d.includes('without over-exaggerating'))).toBe(true);
    });

    test('Recommends concise pacing for short queries and structured for technical', () => {
      const shortAnalysis = conversationalDNA.analyzeMessage('ok fine');
      expect(shortAnalysis.recommendedPacing).toBe('CONCISE_NATURAL');

      const deepAnalysis = conversationalDNA.analyzeMessage('Explain the exact architecture and implementation schematic for this PCB layout');
      expect(deepAnalysis.recommendedPacing).toBe('STRUCTURED_RIGOROUS');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Emotional Context Interpreter
  // ────────────────────────────────────────────────────────────
  describe('3. Emotional Context Interpreter', () => {
    test('Identifies frustration with confidence and uncertainty bounds', () => {
      const res = emotionalContextInterpreter.interpret('Why is this not working?! It is broken again argh');
      expect(res.state).toBe(CONVERSATIONAL_STATES.FRUSTRATED);
      expect(res.confidence).toBeGreaterThanOrEqual(0.75);
      expect(res.uncertainty).toBeGreaterThanOrEqual(0.1);
      expect(res.toneGuidance).toContain('isolating');
    });

    test('Identifies overwhelmed state and recommends gentle triage', () => {
      const res = emotionalContextInterpreter.interpret('I have so much to do, exhausted and burned out with deadlines');
      expect(res.state).toBe(CONVERSATIONAL_STATES.OVERWHELMED);
      expect(res.toneGuidance).toContain('step-by-step triage');
    });

    test('Pure technical statements remain neutral without forced emotional analysis', () => {
      const res = emotionalContextInterpreter.interpret('git commit -m "fix: resolve status code 500 in compile error"');
      expect(res.state).toBe(CONVERSATIONAL_STATES.NEUTRAL);
      expect(res.isPurelyTechnical).toBe(true);
      expect(res.confidence).toBe(0.95);
    });

    test('Never provides clinical or psychiatric diagnoses', () => {
      const res = emotionalContextInterpreter.interpret('feeling sad today');
      expect(res.diagnosis).toBeUndefined();
      expect(res.clinicalCategory).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Relationship Continuity Engine
  // ────────────────────────────────────────────────────────────
  describe('4. Relationship Continuity Engine', () => {
    test('Retrieves relevant projects and decisions without fabrication', () => {
      const context = relationshipContinuityEngine.findRelevantContinuity('tell me about the SDR antenna and MATLAB');
      expect(context.projects.length).toBeGreaterThan(0);
      expect(context.projects.some(p => p.id === 'proj_sdr_transceiver')).toBe(true);
    });

    test('Records decisions and tracks unfinished discussion threads', () => {
      const thread = relationshipContinuityEngine.setUnfinishedThread('WebGPU shader optimization', 'Exploring compute pipeline');
      expect(thread.status).toBe('pending_follow_up');

      const found = relationshipContinuityEngine.findRelevantContinuity('WebGPU shader optimization');
      expect(found.unfinishedThreads.length).toBe(1);

      relationshipContinuityEngine.resolveThread('WebGPU shader optimization');
      const cleared = relationshipContinuityEngine.findRelevantContinuity('WebGPU shader optimization');
      expect(cleared.unfinishedThreads.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Memory Service Evolution
  // ────────────────────────────────────────────────────────────
  describe('5. Memory Service Evolution', () => {
    test('Stores records with full 14-field schema and memory types', () => {
      const record = memoryService.storeRecord({
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        memoryType: MEMORY_TYPES.FACT,
        content: 'Adhy designed a 4-layer impedance-controlled RF PCB in KiCad 8.',
        source: 'Lab Test Bench',
        evidence: 'Physical board assembly and Gerber review.',
        confidence: 0.95,
        userApproved: true
      });

      expect(record.schemaVersion).toBe('3.0.0');
      expect(record.memoryType).toBe(MEMORY_TYPES.FACT);
      expect(record.confidence).toBe(0.95);
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();

      memoryService.deleteMemory(record.id);
    });

    test('User correction creates supersession link without destroying history', () => {
      const original = memoryService.storeRecord({
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Original statement: Adhy works on KiCad 7.',
        userApproved: true
      });

      const corrected = memoryService.correctMemory(
        original.id,
        'Corrected statement: Adhy upgraded and works exclusively in KiCad 8.',
        'Version upgrade'
      );

      expect(corrected.supersedes).toBe(original.id);
      expect(corrected.category).toBe(MEMORY_CATEGORIES.CORRECTED_FACT);
      expect(corrected.confidence).toBe(1.0);

      const oldRecord = memoryService.records.get(original.id);
      expect(oldRecord.category).toBe(MEMORY_CATEGORIES.SUPERSEDED_INFO);
      expect(oldRecord.supersededBy).toBe(corrected.id);

      // Clean up
      memoryService.deleteMemory(original.id);
      memoryService.deleteMemory(corrected.id);
    });

    test('Zero-credential invariant rejects API keys and secrets from being stored', () => {
      const secretAttempt = memoryService.storeRecord({
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        content: 'My secret token is gsk_99999999999999999999999999999999'
      });
      expect(secretAttempt).toBeNull();
    });

    test('Extracts candidate observations from conversation', () => {
      const candidates = memoryService.extractCandidateObservations('I prefer working with C and STM32 registers before using HAL libraries');
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0].memoryType).toBe(MEMORY_TYPES.PREFERENCE);
    });

    test('Allows user to pause and resume memory collection', () => {
      memoryService.pauseCollection();
      const attempt = memoryService.storeRecord({ content: 'Should not store while paused' });
      expect(attempt).toBeNull();

      memoryService.resumeCollection();
      const allowed = memoryService.storeRecord({ content: 'Stores cleanly when resumed' });
      expect(allowed).not.toBeNull();
      memoryService.deleteMemory(allowed.id);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Central Behavioural Controller & Stance Synthesis
  // ────────────────────────────────────────────────────────────
  describe('6. Central Behavioural Controller', () => {
    test('Synthesizes complete contextual stance combining understanding, emotion, and memory', () => {
      const stance = behaviouralController.evaluateStance('Tell me how you would critique the SDR antenna matching network');
      expect(stance.intent).toBe('CRITICAL_REVIEWER');
      expect(stance.responseStrategy).toBe('FIRST_PRINCIPLES_CHALLENGE');
      expect(stance.conversationalStyle.directness).toBe('high_radical_honesty');
      expect(stance.relevantMemories).toBeDefined();
      expect(stance.safetyConstraints.truthfulnessMode).toBe('STRICT_VERIFIED');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Brain Intent Safety
  // ────────────────────────────────────────────────────────────
  describe('7. Brain Intent Safety', () => {
    test('Casual mention of dark mode does not trigger physical theme switch', () => {
      const plan = miniAdhyBrain.processSensoryInput('I was just thinking about dark mode in web design');
      expect(plan.isCommittedImperative).toBe(false);
      expect(plan.targetSkill).toBeNull(); // Safe! No involuntary side effect
    });

    test('Committed command triggers physical theme switch', () => {
      const plan = miniAdhyBrain.processSensoryInput('switch to dark mode');
      expect(plan.isCommittedImperative).toBe(true);
      expect(plan.targetSkill).toBe('THEME');
      expect(plan.targetArg).toBe('dark');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Portable Identity & Desktop Mini-Bot Serialization
  // ────────────────────────────────────────────────────────────
  describe('8. Portable Identity & Desktop Mini-Bot Readiness', () => {
    test('Exports complete bundle with understanding, memories, and desktop robot destination', () => {
      const bundle = portableIdentityManager.exportBundle();
      expect(bundle.bundleType).toBe('MINI_ADHY_PORTABLE_IDENTITY_BUNDLE');
      expect(bundle.schemaVersion).toBe('2.0.0');
      expect(bundle.understanding).toBeDefined();
      expect(bundle.memories.length).toBeGreaterThan(0);
      expect(bundle.compatibility.supportedDestinations).toContain('desk_robot_companion');
      expect(bundle.compatibility.supportedDestinations).toContain('desktop_companion');
      expect(bundle.integrityChecksum).toBeDefined();
    });

    test('Validates and dry-run imports bundle cleanly', () => {
      const bundle = portableIdentityManager.exportBundle();
      const dryRun = portableIdentityManager.importBundle(bundle, { dryRun: true });
      expect(dryRun.success).toBe(true);
      expect(dryRun.dryRun).toBe(true);
    });
  });
});

