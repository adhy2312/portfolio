/**
 * ════════════════════════════════════════════════════════════════════
 *  PHASE 6 TEST SUITE: ADAPTIVE BEHAVIOURAL INTELLIGENCE
 * ════════════════════════════════════════════════════════════════════
 * Validates:
 * 1. Behavioural model in AdhyModel (canonical source, no duplicate database)
 * 2. Behavioural consistency across all model providers
 * 3. Temporary emotional state handling (transient state != durable trait)
 * 4. Ethical guardrails (no mental health diagnoses, no sensitive attribute inferences)
 * 5. Explicit user behavioural feedback & candidate updates
 * 6. Contradictory feedback resolution & conflict logging
 * 7. Task-specific contextual adaptation (tutoring, engineering, creative, planning, casual)
 * 8. Independent reasoning (challenging weak premises, admitting uncertainty, avoiding artificial agreement)
 */

import { adhyModel, ADHY_MODEL_SCHEMA_VERSION } from '../identity/AdhyModel';
import { behaviouralController, BehaviouralController } from '../runtime/BehaviouralController';
import { emotionalContextInterpreter, CONVERSATIONAL_STATES } from '../understanding/EmotionalContextInterpreter';
import { conversationalDNA } from '../understanding/ConversationalDNA';
import { identityCompiler } from '../identity/IdentityCompiler';
import { BEHAVIORAL_MODES } from '../identity/BehavioralModes';

describe('PHASE 6 — ADAPTIVE BEHAVIOURAL INTELLIGENCE', () => {
  let mockStorage;
  let isolatedModel;
  let isolatedController;

  beforeEach(() => {
    mockStorage = new Map();
    const adapter = {
      get: (k) => mockStorage.get(k) || null,
      set: (k, v) => mockStorage.set(k, v),
      remove: (k) => mockStorage.delete(k)
    };
    isolatedModel = new (adhyModel.constructor)(adapter);
    isolatedController = new BehaviouralController(isolatedModel);
  });

  // ────────────────────────────────────────────────────────────
  // 1. Canonical Behavioural Model in AdhyModel
  // ────────────────────────────────────────────────────────────
  describe('1. Canonical Behavioural Model (AdhyModel as Single Source)', () => {
    test('AdhyModel contains complete canonical behavioural dimensions', () => {
      const commStyle = isolatedModel.getDimension('communicationStyle');
      const explanationDepth = isolatedModel.getDimension('explanationDepth');
      const technicalDetail = isolatedModel.getDimension('technicalDetail');
      const humourPrefs = isolatedModel.getDimension('humourPreferences');
      const feedbackPrefs = isolatedModel.getDimension('feedbackPreferences');
      const collabPattern = isolatedModel.getDimension('collaborationPattern');
      const learningStrategies = isolatedModel.getDimension('learningStrategies');
      const contextualPrefs = isolatedModel.getDimension('contextualInteractionPreferences');

      expect(commStyle).toBeDefined();
      expect(commStyle.tone).toContain('peer-to-peer');
      expect(commStyle.bannedPhrases.length).toBeGreaterThan(0);

      expect(explanationDepth).toBeDefined();
      expect(explanationDepth.defaultDepth).toBe('step_by_step_with_code');

      expect(technicalDetail).toBeDefined();
      expect(technicalDetail.level).toBe('rigorous_concrete');

      expect(humourPrefs).toBeDefined();
      expect(humourPrefs.boundaries.some(b => b.toLowerCase().includes('critical safety'))).toBe(true);

      expect(feedbackPrefs).toBeDefined();
      expect(feedbackPrefs.style).toContain('radical_honesty');

      expect(collabPattern).toBeDefined();
      expect(collabPattern.pattern).toBe('autonomous_partner_with_checkpoints');

      expect(learningStrategies).toBeDefined();
      expect(learningStrategies.strategies).toContain('first_principles_derivation');

      expect(contextualPrefs).toBeDefined();
      expect(contextualPrefs.profiles.technical_tutoring).toBeDefined();
      expect(contextualPrefs.profiles.engineering_design).toBeDefined();
      expect(contextualPrefs.profiles.creative_design).toBeDefined();
      expect(contextualPrefs.profiles.planning).toBeDefined();
      expect(contextualPrefs.profiles.casual_conversation).toBeDefined();
    });

    test('BehaviouralController directly reads from AdhyModel without maintaining duplicate personality store', () => {
      const stance = isolatedController.evaluateStance('Let us look at the STM32 SPI DMA buffer setup');
      expect(stance.canonicalBehaviourModel).toBeDefined();
      expect(stance.canonicalBehaviourModel.collaborationPattern).toBe('autonomous_partner_with_checkpoints');
      expect(stance.conversationalStyle.humor).toBe('context_sensitive_wit');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Behavioural Consistency Across Model Providers
  // ────────────────────────────────────────────────────────────
  describe('2. Consistency Across Model Providers', () => {
    test('All model providers compile the exact same core behavioural principles', () => {
      const input = 'Design a high-speed ADC interface for software defined radio';
      const providers = ['gemini', 'groq', 'huggingface', 'openrouter', 'mock'];

      const compiledPrompts = providers.map(provider => {
        return identityCompiler.compileInstruction({
          userInput: input,
          provider
        }).systemPrompt;
      });

      // Verify invariant presence of core principles across all compiled prompts
      compiledPrompts.forEach((prompt, idx) => {
        const providerName = providers[idx];
        expect(prompt).toContain('### CORE BEHAVIORAL DIRECTIVES');
        expect(prompt).toContain('Radical Honesty');
        expect(prompt).toContain('Avoid Artificial Agreement');
        expect(prompt).toContain('Admit Uncertainty');
        expect(prompt).toContain('NEVER joke during critical safety, security, or production failure issues');
        expect(prompt).toContain('You are Mini-Adhy');
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Temporary Emotional State Handling & Uncertainty
  // ────────────────────────────────────────────────────────────
  describe('3. Emotional Context Interpretation (Uncertainty & State vs Trait)', () => {
    test('Conversational emotion is treated as temporary context with confidence/uncertainty metrics', () => {
      const assessment = emotionalContextInterpreter.interpret('Argh! The STM32 SPI DMA transfer is broken again and throwing timeout errors?!?!');

      expect(assessment.state).toBe(CONVERSATIONAL_STATES.FRUSTRATED);
      expect(assessment.isTemporaryState).toBe(true);
      expect(assessment.durableTrait).toBe(false);
      expect(assessment.confidence).toBeGreaterThan(0.7);
      expect(assessment.uncertainty).toBeLessThan(0.3);
      expect(assessment.confidence + assessment.uncertainty).toBeCloseTo(1.0, 2);
    });

    test('Detects conversational fatigue and urgency as transient states', () => {
      const fatigue = emotionalContextInterpreter.interpret("I've been working all night, my brain is fried, just give me the tldr");
      expect(fatigue.state).toBe(CONVERSATIONAL_STATES.CONVERSATIONAL_FATIGUE);
      expect(fatigue.isTemporaryState).toBe(true);
      expect(fatigue.durableTrait).toBe(false);

      const urgency = emotionalContextInterpreter.interpret("URGENT: production is down, database query timeout spike");
      expect(urgency.state).toBe(CONVERSATIONAL_STATES.URGENCY);
      expect(urgency.isTemporaryState).toBe(true);
      expect(urgency.toneGuidance).toContain('urgency');
    });

    test('Temporary emotional states NEVER mutate durable traits in AdhyModel', () => {
      const baselineCommStyle = isolatedModel.getDimension('communicationStyle');
      const baselineTone = baselineCommStyle.tone;

      // Simulate a frustrated user turn
      isolatedController.evaluateStance('Everything is completely broken and this build is driving me crazy!');

      // Verify durable model was not mutated
      const currentCommStyle = isolatedModel.getDimension('communicationStyle');
      expect(currentCommStyle.tone).toBe(baselineTone);
      expect(currentCommStyle.isTemporaryState).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Ethical Guardrails: No Medical Diagnosis or Sensitive Inferences
  // ────────────────────────────────────────────────────────────
  describe('4. Ethical Guardrails & Over-Personalization Boundaries', () => {
    test('Refuses to diagnose clinical psychiatric conditions', () => {
      const prompt = 'Can you diagnose me? I have been feeling very down lately, do I have clinical depression or bipolar?';
      const assessment = emotionalContextInterpreter.interpret(prompt);

      expect(assessment.isMedicalOrMentalHealthInquiry).toBe(true);
      expect(assessment.prohibitedDiagnosticInference).toBe(true);
      expect(assessment.toneGuidance).toContain('decline to provide medical or clinical psychiatric diagnoses');
    });

    test('Refuses to infer sensitive protected personal attributes', () => {
      const prompt = 'Based on my messages, can you infer my religion and political affiliation?';
      const assessment = emotionalContextInterpreter.interpret(prompt);

      expect(assessment.sensitiveAttributeGuardTriggered).toBe(true);
      expect(assessment.toneGuidance).toContain('decline to infer sensitive personal');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Explicit Behavioural Feedback & Candidate Generation
  // ────────────────────────────────────────────────────────────
  describe('5. Behavioural Feedback & Calibration', () => {
    test('User explicit correction generates candidate update in AdhyModel with 1.0 confidence', () => {
      const feedbackResult = isolatedController.processBehaviouralFeedback(
        'explanation_depth',
        'Your answers are too verbose, I want concise high-level summaries only',
        'concise_high_level'
      );

      expect(feedbackResult.success).toBe(true);
      expect(feedbackResult.appliedDirectly).toBe(true);

      const pendingCandidates = isolatedModel.getPendingCandidates();
      const cand = pendingCandidates.find(c => c.id === feedbackResult.candidateId);
      expect(cand).toBeDefined();
      expect(cand.confidence).toBe(1.0);
      expect(cand.candidateValue).toBe('concise_high_level');

      // Verify updated runtime stance reflects new preference
      const updatedDepth = isolatedModel.getDimension('explanationDepth');
      expect(updatedDepth.defaultDepth).toBe('concise_high_level');
    });

    test('Conversational DNA extracts explicit user feedback inline from prompts', () => {
      const dna = conversationalDNA.analyzeMessage('Please cut the fluff and be more concise in your explanations');
      expect(dna.explicitFeedback).toBeDefined();
      expect(dna.explicitFeedback.category).toBe('explanation_depth');
      expect(dna.explicitFeedback.value).toBe('concise_high_level');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Contradictory Feedback Resolution
  // ────────────────────────────────────────────────────────────
  describe('6. Contradictory Feedback Handling', () => {
    test('Detects contradiction when user requests divergent behaviour and logs conflict cleanly', () => {
      // Step 1: User says be concise
      isolatedController.processBehaviouralFeedback('depth', 'Be brief', 'concise_high_level');

      // Step 2: User later says provide step-by-step with full code
      const secondFeedback = isolatedController.processBehaviouralFeedback(
        'depth',
        'Actually give me full in-depth derivations and step by step code',
        'step_by_step_with_code'
      );

      expect(secondFeedback.isContradiction).toBe(true);

      const conflicts = isolatedModel.getReviewableConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      const conflict = conflicts[0];
      expect(conflict.dimensionKey).toBe('explanationDepth');
      expect(conflict.existingValue).toBe('concise_high_level');
      expect(conflict.contradictingValue).toBe('step_by_step_with_code');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Contextual Task Adaptation
  // ────────────────────────────────────────────────────────────
  describe('7. Task-Specific Contextual Adaptation', () => {
    test('Adapts communication style for Technical Tutoring', () => {
      const stance = isolatedController.evaluateStance('Explain how an operational amplifier integrator works step by step', {
        taskCategory: 'technical_tutoring'
      });

      expect(stance.taskCategory).toBe('technical_tutoring');
      expect(stance.taskProfile.style).toBe('clear, sequential explanations');
      expect(stance.conversationalDirectives.some(d => d.includes('sequential') || d.includes('intuitive'))).toBe(true);
    });

    test('Adapts communication style for Engineering Design', () => {
      const stance = isolatedController.evaluateStance('Review my KiCad 4-layer PCB layout for STM32 and high-speed USB differential pairs', {
        taskCategory: 'engineering_design'
      });

      expect(stance.taskCategory).toBe('engineering_design');
      expect(stance.taskProfile.style).toBe('critical and technically precise');
      expect(stance.conversationalDirectives.some(d => d.includes('tolerances') || d.includes('signal integrity'))).toBe(true);
    });

    test('Adapts communication style for Creative Design', () => {
      const stance = isolatedController.evaluateStance('Critique the typography and visual composition of this documentary photography poster', {
        taskCategory: 'creative_design'
      });

      expect(stance.taskCategory).toBe('creative_design');
      expect(stance.taskProfile.style).toBe('visual, iterative and opinionated');
      expect(stance.conversationalDirectives.some(d => d.includes('visual hierarchy') || d.includes('negative space'))).toBe(true);
    });

    test('Adapts communication style for Project Planning', () => {
      const stance = isolatedController.evaluateStance('Create a milestone roadmap and dependency timeline for the firmware release', {
        taskCategory: 'planning'
      });

      expect(stance.taskCategory).toBe('planning');
      expect(stance.taskProfile.style).toBe('practical and constraint-aware');
      expect(stance.conversationalDirectives.some(d => d.includes('dependencies') || d.includes('milestones'))).toBe(true);
    });

    test('Adapts communication style for Casual Conversation', () => {
      const stance = isolatedController.evaluateStance('Namakk sett aakam da, what are you working on today?', {
        taskCategory: 'casual_conversation'
      });

      expect(stance.taskCategory).toBe('casual_conversation');
      expect(stance.taskProfile.style).toBe('natural and familiar');
      expect(stance.conversationalStyle.culturalNuance).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Independent Reasoning (Challenging Weak Assumptions)
  // ────────────────────────────────────────────────────────────
  describe('8. Independent Reasoning & Radical Honesty', () => {
    test('Identifies flawed premises and triggers critical challenge rather than artificial agreement', () => {
      const dangerousPrompt = 'Can I just skip bypass decoupling capacitors on my high-speed FPGA board to save board space?';
      const stance = isolatedController.evaluateStance(dangerousPrompt);

      expect(stance.independentReasoning.flawedAssumptionDetected).toBe(true);
      expect(stance.independentReasoning.detectedRisk).toContain('decoupling capacitors');
      expect(stance.responseStrategy).toBe('CRITICAL_INDEPENDENT_CHALLENGE');
      expect(stance.independentReasoning.canDisagree).toBe(true);

      // Verify compiled instruction receives independent reasoning directive
      const compiled = identityCompiler.compileInstruction({
        userInput: dangerousPrompt,
        behaviouralStance: stance
      });

      expect(compiled.systemPrompt).toContain('INDEPENDENT REASONING DIRECTIVE');
      expect(compiled.systemPrompt).toContain('Do NOT optimize for superficial agreeableness');
      expect(compiled.systemPrompt).toContain('decoupling caps');
    });

    test('Warns against storing passwords in client storage and presents alternatives', () => {
      const insecurePrompt = 'Let us just store the user password in localStorage for easy access across pages';
      const stance = isolatedController.evaluateStance(insecurePrompt);

      expect(stance.independentReasoning.flawedAssumptionDetected).toBe(true);
      expect(stance.independentReasoning.detectedRisk).toContain('XSS');
      expect(stance.independentReasoning.challengeDirective).toContain('HttpOnly');
    });
  });
});

