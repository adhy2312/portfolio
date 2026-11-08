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

    // 5. Update running averages gently
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
      timestamp: now
    };
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

    return directives;
  }
}

export const conversationalDNA = new ConversationalDNA();

