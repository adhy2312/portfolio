/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE CONTEXT COMPILER
 * ════════════════════════════════════════════════════════════════════
 * Connects the central AdhyModel to model reasoning.
 * 
 * Pipeline:
 * User Input + Complexity → Intent Resolution →
 * Selective Dimension Retrieval from AdhyModel →
 * Authorized Memory & Continuity Retrieval →
 * Sensitive / Unrelated Data Filtering →
 * Task-Specific Reasoning Directives Formulation →
 * Model Snapshot Versioning (for cache invalidation).
 * 
 * CORE PRINCIPLE:
 * Cognitive context influences REASONING (how problems are framed,
 * how uncertainty is handled, how trade-offs are evaluated), not
 * merely decorative bio text in prompts.
 */

import { adhyModel } from '../identity/AdhyModel';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';

export class CognitiveContextCompiler {
  constructor() {
    this.model = adhyModel;
    this.understandingEngine = personalUnderstandingEngine;
  }

  /**
   * Compiles task-tailored cognitive context for a specific request turn
   */
  compileCognitiveContext({
    input = '',
    complexity = 'LEVEL_1_SIMPLE',
    mode = 'COMPANION',
    specialistAgentId = null,
    maxMemories = 4,
    allowSensitive = false
  } = {}) {
    const rawText = String(input).trim();
    const modelVersion = this.model.getVersion();

    // 1. Synthesize personal understanding
    const understanding = this.understandingEngine.synthesizeUnderstanding(rawText, { mode });

    // 2. Selectively retrieve AdhyModel dimensions based on task relevance
    const selectedDimensions = this._selectRelevantDimensions({
      complexity,
      specialistAgentId,
      mode,
      input: rawText
    });

    // 3. Selectively retrieve and filter authorized memories
    const authorizedMemories = this._retrieveAuthorizedMemories(rawText, {
      maxMemories,
      allowSensitive,
      specialistAgentId
    });

    // 4. Retrieve relevant continuity
    const continuity = understanding.continuityContext || {};

    // 5. Synthesize Actionable Reasoning Directives
    const reasoningDirectives = this._synthesizeReasoningDirectives({
      selectedDimensions,
      specialistAgentId,
      complexity,
      emotionalState: understanding.emotionalAssessment?.state
    });

    // 6. Assemble compact cognitive context block
    const formattedBlock = this._formatCognitiveContextBlock({
      selectedDimensions,
      authorizedMemories,
      continuity,
      reasoningDirectives,
      specialistAgentId,
      modelVersion
    });

    return {
      modelVersion,
      selectedDimensions,
      authorizedMemories,
      continuity,
      reasoningDirectives,
      formattedBlock,
      emotionalContext: understanding.emotionalAssessment,
      conversationalDirectives: understanding.conversationalDirectives,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Selectively filters AdhyModel dimensions so only relevant context is surfaced
   */
  _selectRelevantDimensions({ complexity, specialistAgentId, mode, input }) {
    const lower = input.toLowerCase();
    const selected = {};

    // Base cognitive dimensions relevant to almost all interactions
    const practical = this.model.getDimension('practicalVsTheoretical');
    const depth = this.model.getDimension('explanationDepth');
    const criticism = this.model.getDimension('directCriticism');

    if (practical) selected.practicalVsTheoretical = practical;
    if (depth) selected.explanationDepth = depth;
    if (criticism) selected.directCriticism = criticism;

    // Technical / Engineering requests
    const isTechnical = complexity === 'LEVEL_2_TECHNICAL' || complexity === 'LEVEL_3_COMPLEX' ||
      ['ULTRON', 'JARVIS', 'DUM_E', 'EDITH'].includes(specialistAgentId) ||
      lower.includes('code') || lower.includes('circuit') || lower.includes('stm32') ||
      lower.includes('dsp') || lower.includes('kicad') || lower.includes('sdr');

    if (isTechnical) {
      const techDomains = this.model.getDimension('technicalDomains');
      const analytical = this.model.getDimension('analyticalVsExploratory');
      const uncertainty = this.model.getDimension('uncertaintyHandling');
      const gaps = this.model.getDimension('knownGaps');

      if (techDomains) selected.technicalDomains = techDomains;
      if (analytical) selected.analyticalVsExploratory = analytical;
      if (uncertainty) selected.uncertaintyHandling = uncertainty;
      if (gaps) selected.knownGaps = gaps;
    }

    // Challenger / Critical review requests (Ultron stance)
    if (specialistAgentId === 'ULTRON' || mode === 'CRITICAL_REVIEWER' || lower.includes('critique') || lower.includes('flaw')) {
      const firstPrinciples = this.model.getDimension('firstPrinciplesDeconstruction');
      const principles = this.model.getDimension('principles');
      if (firstPrinciples) selected.firstPrinciplesDeconstruction = firstPrinciples;
      if (principles) selected.principles = principles;
    }

    // Creative / Visual requests
    const isCreative = specialistAgentId === 'U' || specialistAgentId === 'JOCASTA' ||
      lower.includes('photo') || lower.includes('camera') || lower.includes('design') ||
      lower.includes('ui') || lower.includes('art');

    if (isCreative) {
      const creativeDomains = this.model.getDimension('creativeDomains');
      if (creativeDomains) selected.creativeDomains = creativeDomains;
    }

    return selected;
  }

  /**
   * Memory filtration: strictly enforces authorization, sensitivity bounds, and supersession
   */
  _retrieveAuthorizedMemories(query, { maxMemories = 4, allowSensitive = false, specialistAgentId = null }) {
    if (!memoryService || typeof memoryService.retrieveRelevant !== 'function') return [];

    const rawMemories = memoryService.retrieveRelevant(query, { limit: maxMemories * 2 });

    return rawMemories
      .filter(m => {
        // Exclude superseded info
        if (m.category === MEMORY_CATEGORIES.SUPERSEDED_INFO) return false;
        // Exclude unapproved inferred records from entering execution prompt
        if (!m.userApproved && m.category !== MEMORY_CATEGORIES.APPROVED_FACT && m.category !== MEMORY_CATEGORIES.CORRECTED_FACT) {
          return false;
        }
        // Exclude high-sensitivity memories unless explicitly allowed
        if (!allowSensitive && (m.sensitivity === 'HIGH' || m.sensitivity === 'RESTRICTED')) {
          return false;
        }
        // Exclude credential leakage
        if (m.content && /bearer|key|token|password/i.test(m.content)) {
          return false;
        }
        return true;
      })
      .slice(0, maxMemories);
  }

  /**
   * Actionable reasoning directives that directly guide how the model reasons
   */
  _synthesizeReasoningDirectives({ selectedDimensions, specialistAgentId, complexity, emotionalState }) {
    const directives = [];

    // Practical vs theoretical grounding
    const practicalVal = selectedDimensions.practicalVsTheoretical?.value;
    if (practicalVal !== undefined && practicalVal > 0.7) {
      directives.push('Ground proposals in working, tangible code/hardware before theoretical architectural abstractions.');
    }

    // Explanation depth
    const depthVal = selectedDimensions.explanationDepth?.value;
    if (depthVal === 'step_by_step_with_code') {
      directives.push('Structure complex answers step-by-step with practical working code snippets first, then architectural rationale.');
    } else if (depthVal === 'concise' || depthVal === 'ultra_concise') {
      directives.push('Keep explanations crisp, dense, and bulleted with minimal conversational filler.');
    }

    // Direct criticism & assumption challenging
    const critPref = selectedDimensions.directCriticism?.value;
    if (critPref === 'strongly_preferred' || specialistAgentId === 'ULTRON') {
      directives.push('Challenge flawed assumptions plainly. Flaw detection and direct technical correction take precedence over polite agreement.');
    }

    // Uncertainty handling
    directives.push('If a technical answer or hardware constraint is uncertain, state the confidence boundary plainly rather than guessing.');

    return directives;
  }

  /**
   * Formats the compiled context into an inspectable Markdown block for system prompts
   */
  _formatCognitiveContextBlock({
    selectedDimensions,
    authorizedMemories,
    continuity,
    reasoningDirectives,
    specialistAgentId,
    modelVersion
  }) {
    const sections = [];

    sections.push(`### ADHY COGNITIVE MODEL CONTEXT [v${modelVersion}]`);

    // Reasoning directives
    if (reasoningDirectives.length > 0) {
      sections.push(
        '#### ACTIVE REASONING DIRECTIVES\n' +
        reasoningDirectives.map(d => `• ${d}`).join('\n')
      );
    }

    // Selected Cognitive Dimensions
    const dimEntries = Object.entries(selectedDimensions);
    if (dimEntries.length > 0) {
      const dimLines = dimEntries.map(([k, d]) => {
        const valStr = typeof d.value === 'object' ? JSON.stringify(d.value) : String(d.value);
        return `• ${d.name || k}: ${valStr} (${d.classification || 'explicit'}, confidence: ${Math.round((d.confidence || 1) * 100)}%)`;
      });
      sections.push('#### RELEVANT COGNITIVE DIMENSIONS\n' + dimLines.join('\n'));
    }

    // Authorized Memories
    if (authorizedMemories.length > 0) {
      const memLines = authorizedMemories.map(m => `• [${m.category || 'FACT'}]: ${m.content}`);
      sections.push('#### AUTHORIZED RELEVANT MEMORY\n' + memLines.join('\n'));
    }

    // Continuity
    if (continuity.projects?.length || continuity.decisions?.length) {
      const contLines = [];
      (continuity.projects || []).forEach(p => contLines.push(`• Ongoing Project: ${p.title} (${p.summary})`));
      (continuity.decisions || []).forEach(d => contLines.push(`• Prior Decision: ${d.topic} — ${d.decision}`));
      if (contLines.length > 0) {
        sections.push('#### RELEVANT CONTINUITY\n' + contLines.join('\n'));
      }
    }

    return sections.join('\n\n');
  }
}

export const cognitiveContextCompiler = new CognitiveContextCompiler();

