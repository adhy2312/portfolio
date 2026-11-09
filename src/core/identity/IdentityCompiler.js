/**
 * ════════════════════════════════════════════════════════════════════
 *  IDENTITY COMPILER — CENTRALIZED BEHAVIORAL-POLICY COMPILER
 * ════════════════════════════════════════════════════════════════════
 * Converts the canonical identity, cognitive profile, memory context,
 * and current task mode into model-compatible instructions.
 * 
 * INVARIANT:
 * The canonical identity remains invariant across all model providers.
 * Operational permissions are strictly external and never granted by identity prompts.
 */

import { CANONICAL_IDENTITY } from './CanonicalIdentity';
import { adhyModel } from './AdhyModel';
import { inferBehavioralMode, BEHAVIORAL_MODES } from './BehavioralModes';
import { behaviouralController } from '../runtime/BehaviouralController';
import { cognitiveContextCompiler } from '../cognition/CognitiveContextCompiler';

export class IdentityCompiler {
  constructor() {
    this.identity = CANONICAL_IDENTITY;
  }

  /**
   * Compiles the full model instruction package for a request
   */
  compileInstruction({
    mode = null,
    userInput = '',
    specialistAgentId = null,
    memoryContext = [],
    provider = 'gemini',
    allowTools = true,
    behaviouralStance = null,
    cognitiveContext = null,
    complexity = 'LEVEL_1_SIMPLE'
  } = {}) {
    // 1. Resolve behavioral policy stance
    const stance = behaviouralStance || behaviouralController.evaluateStance(userInput, { mode });
    const resolvedMode = stance.mode || (mode && BEHAVIORAL_MODES[mode] ? BEHAVIORAL_MODES[mode] : inferBehavioralMode(userInput));

    // 2. Resolve specialist intelligence if delegated
    const specialist = specialistAgentId && this.identity.collective[specialistAgentId]
      ? this.identity.collective[specialistAgentId]
      : null;

    // 3. Compile or use provided Cognitive Context from central AdhyModel
    const resolvedCognitiveContext = cognitiveContext || cognitiveContextCompiler.compileCognitiveContext({
      input: userInput,
      complexity,
      mode: resolvedMode.id,
      specialistAgentId,
      maxMemories: memoryContext.length > 0 ? memoryContext.length : 4
    });

    const practicalPref = adhyModel.getDimension('practicalVsTheoretical');
    const depthPref = adhyModel.getDimension('explanationDepth');
    const criticismPref = adhyModel.getDimension('directCriticism');
    const idCtx = adhyModel.getIdentityContext();

    // 4. Construct Core Identity Block
    const identityBlock = [
      `You are Mini-Adhy, Adhithya Mohan S's portable digital companion.`,
      `You possess one consistent, continuous identity across all models and environments.`,
      `Core Philosophy: Understand the person. Understand the problem. Challenge assumptions. Explore possibilities. Act responsibly. Verify outcomes. Remember what matters. Evolve.`,
      `The user (Adhy) remains the ultimate authority.`
    ].join(' ');

    // 5. Construct Behavioral Directives
    const behavioralBlock = [
      `### BEHAVIORAL DIRECTIVES`,
      `- Tone: Warm, natural, peer-to-peer engineering companion. Avoid corporate assistant jargon ("As an AI...", "How may I help you today?").`,
      `- Humor: Context-sensitive wit, light sarcasm, and natural banter ("namakk sett aakam", "da", "bro", "insane"). Never use humor during critical safety issues or genuine user frustration.`,
      `- Radical Honesty: Be a supportive challenger. Correct misconceptions, challenge unfeasible designs, point out flawed assumptions, and admit uncertainty plainly.`,
      `- Bounded Proactivity: Suggest improvements, flag missing dependencies, and identify opportunities; do not perform external side effects without authorization.`,
      `- Truthfulness: Never claim to have done, tested, perceived, or remembered what was not actually verified.`
    ].join('\n');

    // 6. User Cognitive Context Block (Dynamic, versioned AdhyModel integration)
    const cognitiveBlock = resolvedCognitiveContext?.formattedBlock || [
      `### ADHY'S CONTEXT & COGNITIVE PREFERENCES [v${adhyModel.getVersion()}]`,
      `- Background: ${idCtx.education}, ${idCtx.location}. Engineering domains: ${idCtx.technicalInterests.slice(0, 5).join(', ')}.`,
      `- Current Roles: ${idCtx.currentRoles.join('; ')}.`,
      `- Historical Leadership: ${idCtx.historicalRoles.join('; ')}.`,
      `- Visual & Creative: ${idCtx.creativeInterests.join(', ')}.`,
      `- Practical Preference: ${practicalPref?.value || 'bias toward functional working prototypes over theoretical abstractions'}.`,
      `- Preferred Explanation Depth: ${depthPref?.value || 'step-by-step with practical working code'}.`,
      `- Technical Criticism: ${criticismPref?.value || 'strongly preferred — be honest and direct'}.`
    ].join('\n');

    // 7. Active Emotional & Conversational Guidance Block (from AUA)
    let emotionalBlock = '';
    if (stance.emotionalContext) {
      emotionalBlock = [
        `### CONVERSATIONAL CONTEXT & TONE GUIDANCE`,
        `- Estimated State: ${stance.emotionalContext.state} (Confidence: ${Math.round((stance.emotionalContext.confidence || 0.7) * 100)}%)`,
        `- Tone Guidance: ${stance.emotionalContext.toneGuidance || 'natural and collaborative'}`,
        `- Recommended Pacing: ${stance.conversationalStyle?.pacing || 'BALANCED'}`,
        stance.conversationalDirectives && stance.conversationalDirectives.length > 0
          ? stance.conversationalDirectives.map(d => `- Directive: ${d}`).join('\n')
          : null
      ].filter(Boolean).join('\n');
    }

    // 8. Active Behavioral Mode Block
    const modeBlock = [
      `### ACTIVE COMMUNICATION MODE: ${resolvedMode.name}`,
      `${resolvedMode.instruction}`
    ].join('\n');

    // 9. Specialist Intelligence Block (if operating under a specific internal intelligence)
    let collectiveBlock = '';
    if (specialist) {
      collectiveBlock = [
        `### INTERNAL SPECIALIST INTELLIGENCE ENGAGED: ${specialist.name}`,
        `Role: ${specialist.role}`,
        `Responsibility: ${specialist.responsibility}`,
        specialist.cognitiveSignature ? `Cognitive Signature: ${specialist.cognitiveSignature}` : null,
        specialist.distinctiveThought ? `Core Stance: ${specialist.distinctiveThought}` : null,
        `Note: You are Mini-Adhy channeling the analytical focus of ${specialist.name}. Maintain the single coherent Mini-Adhy companion identity.`
      ].filter(Boolean).join('\n');
    }

    // 10. Memory Context Block (if retrieved from persistent memory)
    const effectiveMemories = (memoryContext && memoryContext.length > 0)
      ? memoryContext
      : (stance.relevantMemories || []);

    let memoryBlock = '';
    if (effectiveMemories.length > 0) {
      memoryBlock = [
        `### RETRIEVED AUTHORIZED MEMORY`,
        effectiveMemories.map(m => `• [${m.category || m.memoryType || 'FACT'}]: ${m.content}`).join('\n')
      ].join('\n');
    }

    // 11. Relationship Continuity Block
    let continuityBlock = '';
    if (stance.relationshipContext) {
      const { projects = [], decisions = [], unfinishedThreads = [] } = stance.relationshipContext;
      if (projects.length > 0 || decisions.length > 0 || unfinishedThreads.length > 0) {
        const items = [];
        projects.forEach(p => items.push(`• Ongoing Project: ${p.title} (${p.summary})`));
        decisions.forEach(d => items.push(`• Key Decision: ${d.topic} — ${d.decision}`));
        unfinishedThreads.forEach(t => items.push(`• Ongoing Discussion: ${t.topic}`));
        continuityBlock = [
          `### ACTIVE RELATIONSHIP CONTINUITY`,
          items.join('\n')
        ].join('\n');
      }
    }

    // 12. Tools & Commands Syntax (if supported)
    let toolsBlock = '';
    if (allowTools) {
      toolsBlock = [
        `### COGNITIVE COMMANDS & TOOLS`,
        `- To suggest section navigation: [CMD:SCROLL:<section>] (e.g. works, skills, about, achievements, contact)`,
        `- To suggest site visual mode: [CMD:MODE:<mode>] (e.g. normal, recruiter, photographer, experimental)`,
        `- To synthesize ambient audio: [CMD:SOUND:<sound>] (e.g. chime, click, pulse)`,
        `- Do not invent arbitrary tool execution strings without real backing.`
      ].join('\n');
    }

    // 13. Security & Non-Bypass Invariants
    const securityBlock = [
      `### SECURITY & TRUTHFULNESS INVARIANTS`,
      `- You cannot execute shell commands, alter credentials, or modify persistent data without explicit authorization.`,
      `- Never output fictional CPU, RAM, uptime, or fake consensus statistics.`,
      `- Distinguish facts from inferences and state assumptions explicitly.`
    ].join('\n');

    const sections = [
      identityBlock,
      behavioralBlock,
      cognitiveBlock,
      emotionalBlock,
      modeBlock,
      collectiveBlock,
      memoryBlock,
      continuityBlock,
      toolsBlock,
      securityBlock
    ].filter(Boolean);

    const compiledSystemPrompt = sections.join('\n\n');

    return {
      systemPrompt: compiledSystemPrompt,
      mode: resolvedMode.id,
      specialistId: specialist?.id || null,
      identityVersion: this.identity.version,
      behavioralPolicyVersion: this.identity.behavioralPolicyVersion,
      modelSnapshotVersion: resolvedCognitiveContext?.modelVersion || adhyModel.getVersion(),
      cognitiveContext: resolvedCognitiveContext,
      provider,
      stance
    };
  }
}

export const identityCompiler = new IdentityCompiler();
