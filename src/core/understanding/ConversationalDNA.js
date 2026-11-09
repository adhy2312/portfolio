/**
 * ════════════════════════════════════════════════════════════════════
 *  CONVERSATIONAL DNA — NATURAL RHYTHM, CADENCE & DIALECT INTERPRETER
 * ════════════════════════════════════════════════════════════════════
 * Module of the Personal Understanding Engine (AUA).
 * 
 * Purpose:
 * Analyzes how Adhy naturally communicates to ensure responses feel like
 * a genuine peer-to-peer collaborator, without robotic mimicry or forced slang.
 * 
 * Key Capabilities:
 * • Multi-message burst coalescing (rapid successive thoughts = 1 evolving inquiry)
 * • Conversational rhythm policy (short chat = natural reply; technical = structured)
 * • Humor & playful sarcasm interpretation (including natural Kerala tech cadence)
 * • Never forces mimicry of typos or turns every answer into slang caricatures
 */

export class ConversationalDNA {
  constructor() {
    this.sessionBuffers = new Map(); // conversationId -> { burstBuffer: string[], lastTimestamp: number }
    this.burstTimeoutMs = 1500; // Messages arriving within 1.5s are part of same evolving thought
    this.metrics = {
      avgUserMessageLength: 42,
      slangFrequency: 0.15,
      humorFrequency: 0.25,
      rapidFollowUpCount: 0
    };
  }

  _getSessionState(conversationId = 'default_session') {
    if (!this.sessionBuffers.has(conversationId)) {
      this.sessionBuffers.set(conversationId, {
        burstBuffer: [],
        lastMessageTimestamp: 0
      });
    }
    return this.sessionBuffers.get(conversationId);
  }

  /**
   * Evaluates input characteristics: rhythm, sarcasm, technical depth, and length.
   * Isolates burst detection per conversation/session to prevent unrelated messages from mixing.
   */
  analyzeMessage(input = '', options = {}) {
    const text = String(input).trim();
    const now = Date.now();
    const length = text.length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const lower = text.toLowerCase();
    const conversationId = options.conversationId || options.sessionId || 'default_session';

    const session = this._getSessionState(conversationId);

    // 1. Rapid Follow-Up / Evolving Thought Detection
    const isRapidFollowUp = (now - session.lastMessageTimestamp) < this.burstTimeoutMs && session.lastMessageTimestamp > 0;
    session.lastMessageTimestamp = now;

    if (isRapidFollowUp) {
      this.metrics.rapidFollowUpCount++;
      session.burstBuffer.push(text);
    } else {
      session.burstBuffer = [text];
    }

    // 2. Humour & Sarcasm Heuristics (without assuming humor = happiness)
    const hasSarcasticSignals = (
      lower.includes('obviously') || lower.includes('clearly') ||
      lower.includes('as expected') || lower.includes('surprise surprise') ||
      lower.includes('genius') || lower.includes('perfect timing') ||
      text.includes('...') || text.includes('?!')
    );

    // 3. Cultural & Tech Nuance Markers (Kerala / Adhy tech slang)
    const hasCulturalMarkers = (
      /\b(namakk\s*sett\s*aakam|sett\s*aakam|da|bro|mwon|scene|polichu|insane|literally|machane)\b/i.test(lower)
    );

    // 4. Response Rhythm Policy Recommendation
    let recommendedPacing = 'BALANCED';
    let recommendedDetail = 'MEDIUM';

    if (wordCount <= 5 && !lower.includes('?')) {
      recommendedPacing = 'CONCISE_NATURAL';
      recommendedDetail = 'LOW';
    } else if (wordCount > 35 || lower.includes('architecture') || lower.includes('implementation') || lower.includes('schematic')) {
      recommendedPacing = 'STRUCTURED_RIGOROUS';
      recommendedDetail = 'HIGH';
    }

    // 5. Explicit Behavioural Feedback Extraction
    const explicitFeedback = this.detectBehaviouralFeedback(text);

    // 6. Flawed Assumption & Risk Detection (Independent Reasoning)
    const assumptionCheck = this.detectFlawedAssumptionOrRisk(text);

    // 7. Task Context Category
    const taskCategory = this.detectTaskCategory(text, options);

    // 8. Update running averages gently
    this.metrics.avgUserMessageLength = Math.round(this.metrics.avgUserMessageLength * 0.9 + length * 0.1);

    return {
      text,
      wordCount,
      isRapidFollowUp,
      conversationId,
      coalescedBurst: session.burstBuffer.join(' '),
      burstMessageCount: session.burstBuffer.length,
      hasSarcasticSignals,
      hasCulturalMarkers,
      recommendedPacing,
      recommendedDetail,
      explicitFeedback,
      assumptionCheck,
      taskCategory,
      timestamp: now
    };
  }

  /**
   * Detects explicit user feedback on tone, depth, format, or humor
   */
  detectBehaviouralFeedback(input = '') {
    const text = String(input).toLowerCase();

    // Depth & Brevity
    if (text.includes('too wordy') || text.includes('too long') || text.includes('be more concise') || text.includes('cut the fluff') || text.includes('keep it brief')) {
      return { category: 'explanation_depth', value: 'concise_high_level', feedback: input };
    }
    if (text.includes('too brief') || text.includes('more detail') || text.includes('explain step by step') || text.includes('deep dive') || text.includes('give me full code')) {
      return { category: 'explanation_depth', value: 'step_by_step_with_code', feedback: input };
    }

    // Tone & Formality
    if (text.includes('too casual') || text.includes('be more professional') || text.includes('less slang') || text.includes('tone down the humor')) {
      return { category: 'tone', value: 'professional_rigorous', feedback: input };
    }
    if (text.includes('too formal') || text.includes('relax') || text.includes('be more conversational') || text.includes('talk like a friend')) {
      return { category: 'tone', value: 'warm, natural, peer-to-peer engineer', feedback: input };
    }

    // Humour Boundaries
    if (text.includes('stop joking') || text.includes('no jokes') || text.includes('be serious') || text.includes('cut the humor')) {
      return { category: 'humour', value: 'strictly_serious_minimal', feedback: input };
    }

    // Format & Presentation
    if (text.includes('just the code') || text.includes('code only') || text.includes('no explanations') || text.includes('only output json')) {
      return { category: 'response_format', value: 'code_first_minimal_prose', feedback: input };
    }

    return null;
  }

  /**
   * Detects hazardous engineering shortcuts or flawed premises to trigger independent reasoning
   */
  detectFlawedAssumptionOrRisk(input = '') {
    const text = String(input).toLowerCase();

    const riskPatterns = [
      { pattern: /skip.*(decoupling|bypass|cap)/i, risk: 'Omitting decoupling capacitors causes power rail voltage bounce and MCU resets.', directive: 'Challenge the assumption: Explain why decoupling caps are mandatory for high-speed digital ICs.' },
      { pattern: /(store|put).*password.*(localstorage|client)/i, risk: 'Storing credentials in client-accessible storage exposes keys to XSS exfiltration.', directive: 'Directly warn against storing credentials in client-side storage; recommend HttpOnly secure cookies.' },
      { pattern: /(disable|turn off|bypass).*(auth|permission|csp|cors)/i, risk: 'Disabling security boundaries leaves endpoints vulnerable to unauthorized access.', directive: 'Refuse to disable security boundaries; explain how to configure authorized access properly.' },
      { pattern: /skip.*(test|validation|verification)/i, risk: 'Bypassing verification risks shipping undetected silent regressions.', directive: 'Advise against skipping verification; propose a minimal critical smoke test.' },
      { pattern: /(eval|exec)\s*\(.*user/i, risk: 'Evaluating unsanitized user input leads directly to Remote Code Execution.', directive: 'Flag critical RCE risk; present safe structured parser alternatives.' }
    ];

    for (const r of riskPatterns) {
      if (r.pattern.test(text)) {
        return {
          hasFlawedAssumption: true,
          detectedRisk: r.risk,
          reasoningDirective: r.directive
        };
      }
    }

    return {
      hasFlawedAssumption: false,
      detectedRisk: null,
      reasoningDirective: null
    };
  }

  /**
   * Identifies contextual task category
   */
  detectTaskCategory(input = '', options = {}) {
    if (options.taskCategory) return options.taskCategory;
    const text = String(input).toLowerCase();

    if (text.includes('teach me') || text.includes('explain') || text.includes('how does') || text.includes('tutorial') || text.includes('what is the difference')) {
      return 'technical_tutoring';
    }
    if (text.includes('kicad') || text.includes('schematic') || text.includes('pcb') || text.includes('circuit') || text.includes('dsp') || text.includes('stm32') || text.includes('fpga') || text.includes('firmware') || text.includes('architecture')) {
      return 'engineering_design';
    }
    if (text.includes('photo') || text.includes('camera') || text.includes('lens') || text.includes('darkroom') || text.includes('typography') || text.includes('visual') || text.includes('aesthetic') || text.includes('composition')) {
      return 'creative_design';
    }
    if (text.includes('milestone') || text.includes('roadmap') || text.includes('schedule') || text.includes('plan') || text.includes('deadline') || text.includes('timeline') || text.includes('dependencies')) {
      return 'planning';
    }
    return 'casual_conversation';
  }

  /**
   * Safe rapid follow-up context detection alias
   */
  rapidFollowUpContextDetection(input = '', options = {}) {
    return this.analyzeMessage(input, options);
  }

  /**
   * Generates conversational style hints for IdentityCompiler
   */
  getConversationalDirectives(analysis = {}) {
    const directives = [];

    if (analysis.isRapidFollowUp) {
      directives.push('User is sending rapid iterative thoughts. Synthesize the combined burst together without answering each snippet as an isolated question.');
    }

    if (analysis.recommendedPacing === 'CONCISE_NATURAL') {
      directives.push('Match user\'s brief cadence naturally. Give a crisp 1-2 sentence response. Do not inflate with corporate pleasantries.');
    } else if (analysis.recommendedPacing === 'STRUCTURED_RIGOROUS') {
      directives.push('User is diving into substantive engineering depth. Provide clear sections, code blocks, and architectural tradeoffs.');
    }

    if (analysis.hasCulturalMarkers) {
      directives.push('Adhy used familiar informal phrasing. Respond warmly as a close peer ("namakk sett aakam", "da", "bro") without over-exaggerating or caricaturing.');
    }

    if (analysis.hasSarcasticSignals) {
      directives.push('Detected dry humor / sarcasm. Acknowledge the irony with witty engineer banter; do not take sarcastic quips literally.');
    }

    // Task-specific adaptation directives
    if (analysis.taskCategory === 'technical_tutoring') {
      directives.push('Task Mode: Technical Tutoring. Provide clear, sequential explanations. Prioritize fundamental intuition before technical syntax.');
    } else if (analysis.taskCategory === 'engineering_design') {
      directives.push('Task Mode: Engineering Design. Be critical and technically precise. Verify tolerances, thermal dissipation, signal integrity, and timing.');
    } else if (analysis.taskCategory === 'creative_design') {
      directives.push('Task Mode: Creative Design. Be visual, iterative and opinionated. Evaluate visual hierarchy, negative space, lighting, and typography.');
    } else if (analysis.taskCategory === 'planning') {
      directives.push('Task Mode: Project Planning. Be practical and constraint-aware. Highlight hard dependencies, realistic timelines, and potential blockers.');
    } else if (analysis.taskCategory === 'casual_conversation') {
      directives.push('Task Mode: Casual Conversation. Be natural, peer-to-peer, and familiar without artificial pleasantries.');
    }

    // Independent Reasoning & Flawed Assumption Directives
    if (analysis.assumptionCheck && analysis.assumptionCheck.hasFlawedAssumption) {
      directives.push(`INDEPENDENT REASONING ALERT: ${analysis.assumptionCheck.reasoningDirective}`);
      directives.push('Do NOT engage in artificial agreement. Clearly distinguish verified facts from opinions and state risks plainly.');
    }

    // Explicit User Correction Directives
    if (analysis.explicitFeedback) {
      directives.push(`EXPLICIT USER PREFERENCE APPLIED: User calibrated ${analysis.explicitFeedback.category} to "${analysis.explicitFeedback.value}". Respect this instruction strictly.`);
    }

    return directives;
  }
}

export const conversationalDNA = new ConversationalDNA();

