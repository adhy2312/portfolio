/**
 * ════════════════════════════════════════════════════════════════════
 *  CENTRAL BEHAVIOURAL CONTROLLER (POLICY & RESPONSE STRATEGY ENGINE)
 * ════════════════════════════════════════════════════════════════════
 * Coordinates:
 * Canonical Identity + Cognitive Mirror + Conversational DNA +
 * Emotional Context + Memory Service + Safety Bounds.
 * 
 * Generates structured context packages for model execution.
 */

import { CANONICAL_IDENTITY } from '../identity/CanonicalIdentity';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { inferBehavioralMode, BEHAVIORAL_MODES } from '../identity/BehavioralModes';

export class BehaviouralController {
  constructor() {
    this.canonicalIdentity = CANONICAL_IDENTITY;
    this.understandingEngine = personalUnderstandingEngine;
  }

  /**
   * Evaluates input to assemble the complete behavioural policy context object
   */
  evaluateStance(userInput = '', options = {}) {
    const text = String(userInput).trim();

    // 1. Synthesize Personal Understanding (DNA, Emotion, Cognitive Mirror, Continuity)
    const understanding = this.understandingEngine.synthesizeUnderstanding(text, options);

    // 2. Retrieve Relevant Contextual Memories (Filtered by sensitivity & approval)
    const retrievedMemories = memoryService.retrieveRelevant(text, { limit: options.memoryLimit || 4 });

    // 3. Infer Behavioral Stance
    const resolvedMode = options.mode && BEHAVIORAL_MODES[options.mode]
      ? BEHAVIORAL_MODES[options.mode]
      : inferBehavioralMode(text);

    // 4. Formulate Response Strategy
    let responseStrategy = 'DIRECT_COLLABORATIVE';
    const emotionalState = understanding.emotionalAssessment.state;

    if (emotionalState === 'frustrated') {
      responseStrategy = 'EMPATHIC_ROOT_CAUSE_ISOLATION';
    } else if (emotionalState === 'overwhelmed') {
      responseStrategy = 'STEP_BY_STEP_TRIAGE';
    } else if (emotionalState === 'playful') {
      responseStrategy = 'WITTY_ENGINEER_BANTER';
    } else if (emotionalState === 'seeking_advice') {
      responseStrategy = 'HONEST_FRAMEWORK_ANALYSIS';
    } else if (resolvedMode.id === 'CRITICAL_REVIEWER') {
      responseStrategy = 'FIRST_PRINCIPLES_CHALLENGE';
    }

    // 5. Structure Context Object
    return {
      intent: resolvedMode.id,
      mode: resolvedMode,
      responseStrategy,
      emotionalContext: understanding.emotionalAssessment,
      conversationalStyle: {
        tone: 'natural_peer',
        humor: 'contextual_witty',
        directness: 'high_radical_honesty',
        pacing: understanding.dnaAnalysis.recommendedPacing,
        detail: understanding.dnaAnalysis.recommendedDetail,
        culturalNuance: understanding.dnaAnalysis.hasCulturalMarkers
      },
      conversationalDirectives: understanding.conversationalDirectives,
      cognitiveDimensions: understanding.activeDimensions,
      relationshipContext: understanding.continuityContext,
      relevantMemories: retrievedMemories,
      safetyConstraints: {
        neverFabricateHistory: true,
        truthfulnessMode: 'STRICT_VERIFIED',
        zeroSecrets: true
      }
    };
  }
}

export const behaviouralController = new BehaviouralController();

