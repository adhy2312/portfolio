/**
 * ════════════════════════════════════════════════════════════════════
 *  PERSONAL UNDERSTANDING ENGINE (AUA CORE)
 * ════════════════════════════════════════════════════════════════════
 * Coordinates:
 * 1. Cognitive Mirror (Thinking preferences, evidence, explicit overrides)
 * 2. Conversational DNA (Message rhythm, humor/sarcasm, burst coalescing)
 * 3. Emotional Context Interpreter (12 conversational states with uncertainty)
 * 4. Relationship Continuity Engine (Shared projects, decisions, unfinished threads)
 * 
 * Provides unified understanding context for BehaviouralController & IdentityCompiler.
 */

import { cognitiveMirror } from './CognitiveMirror';
import { conversationalDNA } from './ConversationalDNA';
import { emotionalContextInterpreter } from './EmotionalContextInterpreter';
import { relationshipContinuityEngine } from './RelationshipContinuityEngine';

export class PersonalUnderstandingEngine {
  constructor() {
    this.cognitiveMirror = cognitiveMirror;
    this.conversationalDNA = conversationalDNA;
    this.emotionalInterpreter = emotionalContextInterpreter;
    this.continuityEngine = relationshipContinuityEngine;
  }

  /**
   * Synthesize full understanding profile for a given user turn
   */
  synthesizeUnderstanding(userInput = '', context = {}) {
    const text = String(userInput).trim();

    // 1. Analyze conversational rhythm & DNA
    const dnaAnalysis = this.conversationalDNA.analyzeMessage(text, context);
    const conversationalDirectives = this.conversationalDNA.getConversationalDirectives(dnaAnalysis);

    // 2. Interpret emotional context & uncertainty
    const emotionalAssessment = this.emotionalInterpreter.interpret(text, context);

    // 3. Retrieve relevant relationship continuity
    const continuityContext = this.continuityEngine.findRelevantContinuity(text);

    // 4. Extract active cognitive preferences
    const activeDimensions = this.cognitiveMirror.getAllDimensions();

    return {
      userInput: text,
      dnaAnalysis,
      conversationalDirectives,
      emotionalAssessment,
      continuityContext,
      activeDimensions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Record explicit user correction that overrides inferred models
   */
  recordUserCorrection(traitKey, newValue, reason = '') {
    return this.cognitiveMirror.correctDimension(traitKey, newValue, reason);
  }

  exportUnderstandingBundle() {
    return {
      schemaVersion: '3.0.0',
      exportedAt: new Date().toISOString(),
      cognitiveMirror: this.cognitiveMirror.exportMirror(),
      continuity: this.continuityEngine.exportContinuity()
    };
  }

  importUnderstandingBundle(data = {}) {
    if (data.cognitiveMirror) this.cognitiveMirror.importMirror(data.cognitiveMirror);
    if (data.continuity) this.continuityEngine.importContinuity(data.continuity);
  }
}

export const personalUnderstandingEngine = new PersonalUnderstandingEngine();

