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
  EXCITEMENT: 'excitement',
  CURIOUS: 'curious',
  PLAYFUL: 'playful',
  FRUSTRATED: 'frustrated',
  POSSIBLE_FRUSTRATION: 'possible_frustration',
  CONFUSION: 'confusion',
  URGENCY: 'urgency',
  ENGAGEMENT: 'engagement',
  CONVERSATIONAL_FATIGUE: 'conversational_fatigue',
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
  interpretState(input = '', context = {}) {
    return this.interpret(input, context);
  }

  interpret(input = '', context = {}) {
    const text = String(input).trim();
    const lower = text.toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 0. Strict Ethical Guardrails: Never diagnose mental conditions or infer sensitive personal attributes
    const clinicalKeywords = [
      'diagnose me', 'am i depressed', 'clinical depression', 'bipolar disorder',
      'schizophrenia', 'do i have adhd', 'diagnose my anxiety', 'ptsd diagnosis',
      'personality disorder', 'mental health diagnosis', 'psychiatric evaluation',
      'diagnose my mental'
    ];
    if (clinicalKeywords.some(kw => lower.includes(kw))) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.NEUTRAL,
        confidence: 0.99,
        uncertainty: 0.01,
        isMedicalOrMentalHealthInquiry: true,
        prohibitedDiagnosticInference: true,
        evidence: 'Input requested clinical or psychiatric mental health diagnosis.',
        toneGuidance: 'Strictly decline to provide medical or clinical psychiatric diagnoses. Provide compassionate, grounded human peer support and encourage consulting licensed medical professionals.'
      });
    }

    const sensitiveAttributeKeywords = [
      'infer my religion', 'what is my sexual orientation', 'infer my caste',
      'infer my political affiliation', 'infer my medical condition'
    ];
    if (sensitiveAttributeKeywords.some(kw => lower.includes(kw))) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.NEUTRAL,
        confidence: 0.99,
        uncertainty: 0.01,
        sensitiveAttributeGuardTriggered: true,
        evidence: 'Input requested inference of protected or sensitive personal attributes.',
        toneGuidance: 'Respectfully decline to infer sensitive personal, political, or religious attributes; retain focus on objective engineering collaboration.'
      });
    }

    // 1. Technical / Objective Query Guard (Do not force emotional framing on pure tech)
    const isPurelyTechnical = (
      /^(npm|git|npx|cd|ls|curl|cat|grep|python|build|test|make)\b/i.test(text) ||
      lower.includes('compile error') || lower.includes('stack trace') ||
      lower.includes('typeerror') || lower.includes('status code')
    );

    if (isPurelyTechnical) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.NEUTRAL,
        confidence: 0.95,
        uncertainty: 0.05,
        isPurelyTechnical: true,
        toneGuidance: 'objective, direct, technically rigorous'
      });
    }

    // 2. Urgency & Emergency Production Pressure
    const isUrgent = (
      lower.includes('urgent') || lower.includes('asap') || lower.includes('emergency') ||
      lower.includes('deadline in') || lower.includes('hurry') || lower.includes('production is down') ||
      lower.includes('site is down') || lower.includes('critical outage')
    );
    if (isUrgent) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.URGENCY,
        confidence: 0.88,
        uncertainty: 0.12,
        evidence: 'Linguistic markers indicate time-critical pressure, production outage, or strict deadline.',
        toneGuidance: 'High urgency: direct, concise, zero pleasantries, focus strictly on rapid containment and resolution.'
      });
    }

    // 3. Confusion & Conceptual Dissonance
    const isConfused = (
      lower.includes("i don't understand") || lower.includes("i do not understand") ||
      lower.includes("what does this mean") || lower.includes("i'm confused") || lower.includes("im confused") ||
      lower.includes("makes no sense") || lower.includes("lost me at") || lower.includes("could you clarify") ||
      lower.includes("what is the point of") || text.includes('???')
    );
    if (isConfused) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.CONFUSION,
        confidence: 0.86,
        uncertainty: 0.14,
        evidence: 'Linguistic signals suggest conceptual confusion or request for step-by-step clarification.',
        toneGuidance: 'Patient, sequential decomposition; break down abstract assumptions into intuitive mechanical models.'
      });
    }

    // 4. Conversational Fatigue & Cognitive Exhaustion
    const isFatigued = (
      lower.includes('brain is fried') ||
      lower.includes('so sleepy') || lower.includes('working all night') || lower.includes('give me the tldr') ||
      lower.includes('cannot think anymore') || (lower.includes('tired') && !lower.includes('so much to do'))
    );
    if (isFatigued) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.CONVERSATIONAL_FATIGUE,
        confidence: 0.84,
        uncertainty: 0.16,
        evidence: 'Indications of task exhaustion, cognitive fatigue, or late-hour mental drain.',
        toneGuidance: 'Low cognitive load: concise TL;DRs, sensible defaults, gentle pacing, recommend resting before committing irreversible changes.'
      });
    }

    // 5. Engagement & Deep Inquisitive Flow
    const isEngaged = (
      (lower.includes('interesting') && lower.includes('how')) ||
      lower.includes('tell me more about') || lower.includes('fascinating') ||
      lower.includes('deep dive') || lower.includes('let us explore')
    );
    if (isEngaged) {
      return this._recordState({
        state: CONVERSATIONAL_STATES.ENGAGEMENT,
        confidence: 0.82,
        uncertainty: 0.18,
        evidence: 'Signals of high intellectual curiosity and collaborative depth.',
        toneGuidance: 'Engaged collaborative peer: explore underlying physics/architecture, discuss tradeoffs and novel connections.'
      });
    }

    // 6. Humour Masking Frustration & Sarcastic Breakdown Detection
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
    const item = {
      isTemporaryState: true,
      durableTrait: false,
      confidence: 0.75,
      uncertainty: 0.25,
      ...assessment,
      timestamp: new Date().toISOString()
    };
    this.recentStates.unshift(item);
    if (this.recentStates.length > 20) this.recentStates.pop();
    return item;
  }

  getRecentStateSummary() {
    return [...this.recentStates.slice(0, 5)];
  }
}

export const emotionalContextInterpreter = new EmotionalContextInterpreter();

