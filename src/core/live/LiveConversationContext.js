/**
 * ════════════════════════════════════════════════════════════════════
 *  LIVE CONVERSATION CONTEXT — CANONICAL MODEL INTEGRATION (PHASE 10)
 * ════════════════════════════════════════════════════════════════════
 * Connects the Live Voice Session directly to canonical AdhyModel,
 * CognitiveContextCompiler, and MemoryService.
 * 
 * STRICT INVARIANT:
 * Voice mode is NOT an alternate persona. It uses the exact same
 * identity, knowledge, memory governance, and behavioral policies as text.
 */

import { adhyModel } from '../identity/AdhyModel';
import { identityCompiler } from '../identity/IdentityCompiler';

export class LiveConversationContext {
  constructor(options = {}) {
    this.sessionId = options.sessionId || `live_ctx_${Date.now()}`;
    this.activeTaskCategory = 'live_conversation';
    this.recentTurnContext = [];
    this.maxRecentTurns = 6;
  }

  /**
   * Compiles the dynamic cognitive system prompt for the live spoken session
   */
  compileLiveSystemPrompt(latestVisualContext = null) {
    const instructionPackage = identityCompiler.compileInstruction({
      mode: 'LIVE_CONVERSATION',
      complexity: 'LEVEL_1_SIMPLE',
      userInput: 'Live spoken conversation session',
      allowTools: true
    });

    const livePacingDirectives = [
      `### VOICE-NATIVE SPOKEN DIRECTIVES`,
      `- Conversational Cadence: Speak in short, conversational paragraphs for audio playback. Keep answers crisp and natural.`,
      `- Avoid Long Monologues: Provide punchy, direct answers. Let the user guide the pacing.`,
      `- Formatting Restrictions: NEVER output markdown tables, raw LaTeX blocks, or bullet lists; express technical ideas conversationally unless explicitly asked.`,
      `- Instant Interruption Resilience: Be prepared for user interruptions. Stay focused on the latest point.`,
      `- Radical Honesty: Challenge flawed assumptions gently but plainly, without superficial agreeableness.`
    ];

    if (latestVisualContext && latestVisualContext.summary) {
      livePacingDirectives.push(`### ACTIVE CAMERA VISUAL CONTEXT: ${latestVisualContext.summary}`);
    }

    return [
      instructionPackage.systemPrompt,
      livePacingDirectives.join('\n')
    ].join('\n\n');
  }

  recordTurn(speaker, text) {
    this.recentTurnContext.push({ speaker, text, timestamp: Date.now() });
    if (this.recentTurnContext.length > this.maxRecentTurns) {
      this.recentTurnContext.shift();
    }
  }

  getTurnHistoryForModel() {
    return this.recentTurnContext.map(t => ({
      role: t.speaker === 'USER' ? 'user' : 'model',
      parts: [{ text: t.text }]
    }));
  }

  reset() {
    this.recentTurnContext = [];
  }
}

