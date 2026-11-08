/**
 * ════════════════════════════════════════════════════════════════════
 *  EMOTIONAL CONTEXT INTERPRETER — USER STATE & SENSITIVITY CALIBRATOR
 * ════════════════════════════════════════════════════════════════════
 * Module of the Personal Understanding Engine (AUA).
 * 
 * Purpose:
 * Interprets the user's conversational state to modulate response pacing and tone.
 * 
 * STRICT ETHICAL & ARCHITECTURAL INVARIANTS:
 * 1. Conversational evidence only: Interprets linguistic signals, never fake biometrics.
 * 2. Uncertainty-aware: Output always contains an explicit confidence score and uncertainty flag.
 * 3. State vs Trait: Distinguishes temporary conversational mood from durable personality.
 * 4. Never medicalize: Absolutely NEVER makes clinical or mental health diagnoses.
 * 5. Restraint in technical tasks: Does not inject emotional commentary into pure technical work.
 * 6. No simulated human feelings: Influences AI tone/pacing, does not pretend AI "feels".
 */

export const CONVERSATIONAL_STATES = Object.freeze({
  EXCITED: 'excited',
  CURIOUS: 'curious',
  PLAYFUL: 'playful',
  FRUSTRATED: 'frustrated',
  DISAPPOINTED: 'disappointed',
  OVERWHELMED: 'overwhelmed',
  REFLECTIVE: 'reflective',
  SEEKING_ADVICE: 'seeking_advice',
  SEEKING_REASSURANCE: 'seeking_reassurance',
  SEEKING_COMPANIONSHIP: 'seeking_companionship',
  NEUTRAL: 'neutral',
  UNCERTAIN: 'uncertain'
});

export class EmotionalContextInterpreter {
  constructor() {
    this.recentStates = [];
  }

  /**
   * Interprets conversational state from text and recent context
   */
  interpret(input = '', context = {}) {
    const text = String(input).trim();
    const lower = text.toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 1. Technical / Objective Query Guard (Do not force emotional framing on pure tech)
    const isPurelyTechnical = (
      /^(npm|git|npx|cd|ls|curl|cat|grep|python|build|test|make)\b/i.test(text) ||
      lower.includes('compile error') || lower.includes('stack trace') ||
      lower.includes('typeerror') || lower.includes('status code')
    );

    if (isPurelyTechnical) {
      return {
        state: CONVERSATIONAL_STATES.NEUTRAL,
        confidence: 0.95,
        uncertainty: 0.05,
        isPurelyTechnical: true,
        toneGuidance: 'objective, direct, technically rigorous'
      };
    }

    // 2. Humour Masking Frustration & Sarcastic Breakdown Detection
    const hasHumorSignal = lower.includes('😂') || lower.includes('🤣') || lower.includes('lol') || lower.includes('lmao') || lower.includes('haha');
    const hasFailureSignal = lower.includes('broke') || lower.includes('failed') || lower.includes('failing') ||
      lower.includes('segfault') || lower.includes('bug') || lower.includes('crash') || lower.includes('again') ||
      lower.includes('another error');
    const hasSarcasticApproval = lower.includes('great,') || lower.includes('fantastic,') || lower.includes('wonderful,') || lower.includes('just wonderful');

    if ((hasHumorSignal && hasFailureSignal) || (hasSarcasticApproval && hasFailureSignal)) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.FRUSTRATED,
        mixedState: true,
        secondaryState: CONVERSATIONAL_STATES.PLAYFUL,
        confidence: 0.85,
        uncertainty: 0.15,
        evidence: 'Humour masking technical frustration (sarcastic laughter or irony over code/hardware failure).',
        toneGuidance: 'Acknowledge the shared developer irony with a brief wry nod, but immediately focus on isolating the bug cleanly without cheerful dismissiveness.'
      });
    }

    // 3. Technical Frustration vs Personal Distress
    const isTechnicalFrustration = (
      lower.includes('still failing') || lower.includes('why is this not working') ||
      lower.includes('broken again') || lower.includes('hate this bug') ||
      lower.includes('so annoying') || lower.includes('waste of time') ||
      lower.includes('infinite loop') || lower.includes('memory leak') ||
      text.includes('?!?!') || text.includes('argh')
    );

    if (isTechnicalFrustration) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.FRUSTRATED,
        confidence: 0.88,
        uncertainty: 0.12,
        evidence: 'Direct expression of technical friction or stubborn debugging blocker.',
        toneGuidance: 'calm, patient, skip conversational pleasantries, focus on isolating and fixing the blocker directly'
      });
    }

    // 4. Overwhelmed / Cognitive Overload Indicators
    if (
      lower.includes('so much to do') || lower.includes('overwhelmed') ||
      lower.includes('too many things') || lower.includes('exhausted') ||
      lower.includes('burned out') || lower.includes('cannot handle')
    ) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.OVERWHELMED,
        confidence: 0.82,
        uncertainty: 0.18,
        evidence: 'Explicit mention of cognitive overload or task fatigue.',
        toneGuidance: 'reassuring, structured step-by-step triage, prioritize 1 tangible task, avoid long walls of text'
      });
    }

    // 5. Short Ambiguous Messages (Do not jump to conclusions without evidence)
    if (wordCount <= 2 && !text.includes('!') && !text.includes('🎉') && !text.includes('🔥')) {
      const isKnownTerse = /^(ok|okay|k|fine|hmm|sure|cool|idk|huh|\?)$/i.test(text);
      if (isKnownTerse) {
        return this._recordState({
          state: CONVERSATIONAL_STATES.UNCERTAIN,
          confidence: 0.50,
          uncertainty: 0.50,
          evidence: `Brief terse input ("${text}"). State is ambiguous and uncertain from linguistic content alone.`,
          toneGuidance: 'attentive, low-pressure, leave room for user to expand or pivot without overinterpreting'
        });
      }
    }

    // 6. Excited / Victorious Indicators
    if (
      lower.includes('it works!') || lower.includes('finally worked') ||
      lower.includes('insane!') || lower.includes('holy shit') ||
      lower.includes('look at this') || lower.includes('polichu') ||
      text.includes('🎉') || text.includes('🚀') || text.includes('🔥')
    ) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.EXCITED,
        confidence: 0.88,
        uncertainty: 0.12,
        evidence: 'Celebratory phrasing or breakthrough indicators.',
        toneGuidance: 'enthusiastic, celebrate the milestone, encourage immediate verification'
      });
    }

    // 5. Playful / Banter Indicators
    if (
      lower.includes('tell me a joke') || lower.includes('roast me') ||
      (lower.includes('you are useless') && (text.includes('😂') || text.includes('lol'))) ||
      lower.includes('da mwon') || lower.includes('bro what')
    ) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.PLAYFUL,
        confidence: 0.80,
        uncertainty: 0.20,
        evidence: 'Playful banter, self-aware teasing, or informal Kerala tech slang.',
        toneGuidance: 'witty, playful, friendly dry banter'
      });
    }

    // 6. Seeking Advice / Career or Life Decision
    if (
      lower.includes('what should i do about') || lower.includes('career choice') ||
      lower.includes('should i study') || lower.includes('need your opinion on') ||
      lower.includes('thinking about dropping') || lower.includes('worth applying')
    ) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.SEEKING_ADVICE,
        confidence: 0.78,
        uncertainty: 0.22,
        evidence: 'Deliberative inquiry seeking perspective on personal or engineering direction.',
        toneGuidance: 'thoughtful, balance pros and cons, challenge false dilemmas, provide clear framework'
      });
    }

    // 7. Reflective / Retrospective
    if (
      lower.includes('remember when') || lower.includes('looking back') ||
      lower.includes('how far we have come') || lower.includes('i wonder why')
    ) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.REFLECTIVE,
        confidence: 0.75,
        uncertainty: 0.25,
        evidence: 'Retrospective narrative or contemplative phrasing.',
        toneGuidance: 'grounded, warm, recall shared milestones accurately without fabricating details'
      });
    }

    // 8. Curious / Exploratory (Default for inquisitive statements)
    if (lower.includes('how does') || lower.includes('what if') || lower.includes('could we try')) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.CURIOUS,
        confidence: 0.82,
        uncertainty: 0.18,
        evidence: 'Inquisitive exploratory question.',
        toneGuidance: 'supportive exploration, clear mechanical reasoning, suggest practical experiment'
      });
    }

    // 9. Baseline Neutral
    return this._recordState({
      state: CONVERSATIONAL_STATES.NEUTRAL,
      confidence: 0.70,
      uncertainty: 0.30,
      evidence: 'Standard conversational statement.',
      toneGuidance: 'natural, peer-to-peer engineering companion'
    });
  }

  _recordState(assessment) {
    const item = { ...assessment, timestamp: new Date().toISOString() };
    this.recentStates.unshift(item);
    if (this.recentStates.length > 20) this.recentStates.pop();
    return item;
  }

  getRecentStateSummary() {
    return [...this.recentStates.slice(0, 5)];
  }
}

export const emotionalContextInterpreter = new EmotionalContextInterpreter();

