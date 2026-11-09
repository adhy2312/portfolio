/**
 * ════════════════════════════════════════════════════════════════════
 *  CENTRAL BEHAVIOURAL CONTROLLER (PHASE 6 ADAPTIVE BEHAVIOURAL INTEL)
 * ════════════════════════════════════════════════════════════════════
 * Coordinates:
 * AdhyModel (Canonical Source) + Conversational DNA + Emotional Context +
 * Contextual Task Profiles + Independent Reasoning + Feedback Calibration.
 * 
 * CORE PRINCIPLE:
 * Mini-Adhy adapts communication to context while retaining stable values,
 * radical honesty, and independent reasoning. It never compromises technical
 * truth to flatter the user.
 */

import { CANONICAL_IDENTITY } from '../identity/CanonicalIdentity';
import { adhyModel } from '../identity/AdhyModel';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';
import { memoryService } from '../memory/MemoryService';
import { inferBehavioralMode, BEHAVIORAL_MODES } from '../identity/BehavioralModes';

export class BehaviouralController {
  constructor(modelInstance = adhyModel, understandingInstance = personalUnderstandingEngine) {
    this.canonicalIdentity = CANONICAL_IDENTITY;
    this.adhyModel = modelInstance;
    this.understandingEngine = understandingInstance;
    this.feedbackHistory = [];
  }

  /**
   * Evaluates input to assemble the complete behavioural policy context object
   */
  evaluateStance(userInput = '', options = {}) {
    const text = String(userInput).trim();

    // 1. Synthesize Personal Understanding (DNA, Emotion, Cognitive Mirror, Continuity)
    const understanding = this.understandingEngine.synthesizeUnderstanding(text, options);
    const dna = understanding.dnaAnalysis || {};
    const emotionalAssessment = understanding.emotionalAssessment || {};

    // 2. Retrieve Relevant Contextual Memories (Filtered by sensitivity & approval)
    const retrievedMemories = memoryService.retrieveRelevant(text, { limit: options.memoryLimit || 4 });

    // 3. Infer Baseline Behavioral Mode & Contextual Task Category
    const resolvedMode = options.mode && BEHAVIORAL_MODES[options.mode]
      ? BEHAVIORAL_MODES[options.mode]
      : inferBehavioralMode(text);

    const taskCategory = options.taskCategory || dna.taskCategory || 'casual_conversation';

    // 4. Retrieve Canonical Behavioural Attributes from AdhyModel (Single Source)
    const commStyle = this.adhyModel.getDimension('communicationStyle') || {};
    const explanationDepth = this.adhyModel.getDimension('explanationDepth') || {};
    const technicalDetail = this.adhyModel.getDimension('technicalDetail') || {};
    const humourPrefs = this.adhyModel.getDimension('humourPreferences') || {};
    const feedbackPrefs = this.adhyModel.getDimension('feedbackPreferences') || {};
    const collabPattern = this.adhyModel.getDimension('collaborationPattern') || {};
    const learningStrategies = this.adhyModel.getDimension('learningStrategies') || {};
    const contextualPrefs = this.adhyModel.getDimension('contextualInteractionPreferences') || {};

    // 5. Contextual Adaptation based on Task Category
    const taskProfile = contextualPrefs.profiles?.[taskCategory] || {
      style: 'natural and familiar',
      depth: 'adaptive_conversational',
      tone: 'warm, authentic peer, relaxed cadence',
      directives: ['Speak naturally with authentic nuances']
    };

    // 6. Formulate Response Strategy (Emotional Context + Independent Reasoning)
    let responseStrategy = 'DIRECT_COLLABORATIVE';
    const emotionalState = emotionalAssessment.state;
    const assumptionCheck = dna.assumptionCheck || {};

    if (assumptionCheck.hasFlawedAssumption) {
      // Independent reasoning takes precedence over agreeable compliance
      responseStrategy = 'CRITICAL_INDEPENDENT_CHALLENGE';
    } else if (emotionalState === 'frustrated' || emotionalState === 'possible_frustration') {
      responseStrategy = 'EMPATHIC_ROOT_CAUSE_ISOLATION';
    } else if (emotionalState === 'confusion') {
      responseStrategy = 'SEQUENTIAL_DECONSTRUCTION';
    } else if (emotionalState === 'conversational_fatigue' || emotionalState === 'overwhelmed') {
      responseStrategy = 'LOW_COGNITIVE_LOAD_TRIAGE';
    } else if (emotionalState === 'urgency') {
      responseStrategy = 'RAPID_INCIDENT_CONTAINMENT';
    } else if (emotionalState === 'engagement') {
      responseStrategy = 'COLLABORATIVE_FIRST_PRINCIPLES_DEPTH';
    } else if (emotionalState === 'playful') {
      responseStrategy = 'WITTY_ENGINEER_BANTER';
    } else if (emotionalState === 'seeking_advice') {
      responseStrategy = 'HONEST_FRAMEWORK_ANALYSIS';
    } else if (resolvedMode.id === 'CRITICAL_REVIEWER') {
      responseStrategy = 'FIRST_PRINCIPLES_CHALLENGE';
    }

    // 7. Dynamic Pacing and Detail Calibration
    // Explicit user feedback in DNA overrides defaults immediately
    let activeDepth = dna.explicitFeedback?.category === 'explanation_depth'
      ? dna.explicitFeedback.value
      : (explanationDepth.defaultDepth || taskProfile.depth || 'step_by_step_with_code');

    let activeTone = dna.explicitFeedback?.category === 'tone'
      ? dna.explicitFeedback.value
      : (taskProfile.tone || commStyle.tone || 'warm, natural, peer-to-peer engineer');

    let activeDetail = dna.explicitFeedback?.category === 'detail'
      ? dna.explicitFeedback.value
      : (technicalDetail.level || dna.recommendedDetail || 'MEDIUM');

    // 8. Independent Reasoning Stance
    const independentReasoning = {
      canDisagree: true,
      identifyErrors: true,
      warnAboutRisks: true,
      presentAlternatives: true,
      distinguishFactsFromOpinions: true,
      flawedAssumptionDetected: Boolean(assumptionCheck.hasFlawedAssumption),
      detectedRisk: assumptionCheck.detectedRisk || null,
      challengeDirective: assumptionCheck.reasoningDirective || null
    };

    // 9. Assemble Structure Context Object
    return {
      intent: resolvedMode.id,
      mode: resolvedMode,
      taskCategory,
      taskProfile,
      responseStrategy,
      emotionalContext: emotionalAssessment,
      conversationalStyle: {
        tone: activeTone,
        humor: humourPrefs.style || 'context_sensitive_wit',
        explanationDepth: activeDepth,
        technicalDetail: activeDetail,
        directness: 'high_radical_honesty',
        feedbackStyle: 'radical_honesty_with_alternatives',
        pacing: dna.recommendedPacing || 'BALANCED',
        culturalNuance: Boolean(dna.hasCulturalMarkers),
        bannedPhrases: commStyle.bannedPhrases || []
      },
      conversationalDirectives: [
        ...(understanding.conversationalDirectives || []),
        ...(taskProfile.directives || [])
      ],
      cognitiveDimensions: understanding.activeDimensions,
      relationshipContext: understanding.continuityContext,
      relevantMemories: retrievedMemories,
      independentReasoning,
      canonicalBehaviourModel: {
        collaborationPattern: collabPattern.pattern || 'autonomous_partner_with_checkpoints',
        learningStrategies: learningStrategies.strategies || [],
        feedbackPrinciples: feedbackPrefs.principles || [],
        humourBoundaries: humourPrefs.boundaries || []
      },
      safetyConstraints: {
        neverFabricateHistory: true,
        truthfulnessMode: 'STRICT_VERIFIED',
        zeroSecrets: true,
        noClinicalDiagnoses: true,
        noSensitiveAttributeInference: true
      }
    };
  }

  /**
   * Process explicit user behavioral feedback and generate candidate updates for AdhyModel
   */
  processBehaviouralFeedback(category, feedbackText, value = null, context = {}) {
    const result = this.adhyModel.recordBehaviouralFeedback({
      category,
      feedback: feedbackText,
      value,
      source: 'user_conversational_correction',
      context
    });

    this.feedbackHistory.unshift({
      category,
      feedbackText,
      value,
      result,
      timestamp: new Date().toISOString()
    });

    return result;
  }

  getFeedbackHistory() {
    return [...this.feedbackHistory];
  }
}

export const behaviouralController = new BehaviouralController();

