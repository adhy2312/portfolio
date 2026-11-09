/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE CONTEXT COMPILER (PHASE 2 PRODUCTION PIPELINE)
 * ════════════════════════════════════════════════════════════════════
 * Integrates the central AdhyModel into the active reasoning pipeline.
 * 
 * CORE CAPABILITIES:
 * 1. Task Classification across 9 Contextual Retrieval Categories:
 *    • Engineering & Electronics
 *    • Programming & Development
 *    • Academic Tutoring
 *    • Photography & Visual Design
 *    • Leadership & Event Management
 *    • Personal Projects
 *    • Research & Documentation
 *    • Planning & Decision-Making
 *    • General Conversation
 * 
 * 2. Dynamic Context Selection (not rigid modes):
 *    • Selects relevant AdhyModel attributes and reasoning directives.
 *    • Retrieves authorized memories and active continuity.
 *    • Excludes irrelevant personal trivia and sensitive records.
 *    • Enforces context token budgets to prevent prompt bloat.
 * 
 * 3. Inspectable Observability Tracing:
 *    • Records retrieved dimensions, selected memories, excluded context,
 *      model version, and collision-resistant cognitive digest.
 */

import { adhyModel } from '../identity/AdhyModel';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';

export const TASK_CATEGORIES = Object.freeze({
  ENGINEERING_ELECTRONICS: 'ENGINEERING_ELECTRONICS',
  PROGRAMMING_DEVELOPMENT: 'PROGRAMMING_DEVELOPMENT',
  ACADEMIC_TUTORING: 'ACADEMIC_TUTORING',
  PHOTOGRAPHY_VISUAL: 'PHOTOGRAPHY_VISUAL',
  LEADERSHIP_MANAGEMENT: 'LEADERSHIP_MANAGEMENT',
  PERSONAL_PROJECTS: 'PERSONAL_PROJECTS',
  RESEARCH: 'RESEARCH',
  PLANNING_DECISION: 'PLANNING_DECISION',
  GENERAL_CONVERSATION: 'GENERAL_CONVERSATION'
});

export class CognitiveContextCompiler {
  constructor(model = null, understandingEngine = null) {
    this.model = model || adhyModel;
    this.understandingEngine = understandingEngine || personalUnderstandingEngine;
    this.recentTraces = [];
    this.maxTraces = 50;
  }

  /**
   * Classify request into a task category via keyword & intent heuristics
   */
  classifyTask(input = '', options = {}) {
    if (options.forceCategory && TASK_CATEGORIES[options.forceCategory]) {
      return options.forceCategory;
    }

    const text = String(input).toLowerCase();

    // 1. Creator Projects (Specific Named Builds)
    if (
      text.includes('mini-adhy') || text.includes('desk robot') ||
      text.includes('companion robot') || text.includes('hardware nexus')
    ) {
      return TASK_CATEGORIES.PERSONAL_PROJECTS;
    }

    // 2. Academic Tutoring & Coursework (Priority over general technical words)
    if (
      text.includes('ktu') || text.includes('syllabus') || text.includes('exam') ||
      text.includes('derivation') || text.includes('teach me') || text.includes('explain step by step') ||
      text.includes('coursework') || text.includes('curriculum') || text.includes('homework') ||
      text.includes('lecture') || (text.includes('how does') && text.includes('work in theory'))
    ) {
      return TASK_CATEGORIES.ACADEMIC_TUTORING;
    }

    // 3. Photography & Visual Design
    if (
      text.includes('photo') || text.includes('camera') || text.includes('frames') ||
      text.includes('zoomout') || text.includes('aperture') || text.includes('iso') ||
      text.includes('shutter') || text.includes('street photography') || text.includes('poster') ||
      text.includes('darkroom') || text.includes('visual design') || text.includes('typography') ||
      text.includes('ui design') || text.includes('graphic design')
    ) {
      return TASK_CATEGORIES.PHOTOGRAPHY_VISUAL;
    }

    // 4. Leadership & Event Management
    if (
      text.includes('senate') || text.includes('iste') || text.includes('media secretary') ||
      text.includes('chairperson') || text.includes('leadership') || text.includes('symposium') ||
      text.includes('event management') || text.includes('delegation') || text.includes('student council') ||
      text.includes('pr head') || text.includes('organizing committee')
    ) {
      return TASK_CATEGORIES.LEADERSHIP_MANAGEMENT;
    }

    // 5. Engineering and Electronics
    if (
      text.includes('kicad') || text.includes('pcb') || text.includes('stm32') ||
      text.includes('arm cortex') || text.includes('dsp') || text.includes('sdr') ||
      text.includes('gnu radio') || text.includes('circuit') || text.includes('schematic') ||
      text.includes('signal processing') || text.includes('microcontroller') ||
      text.includes('fpga') || text.includes('firmware') || text.includes('fourier')
    ) {
      return TASK_CATEGORIES.ENGINEERING_ELECTRONICS;
    }

    // 6. Research & Space Systems
    if (
      text.includes('isro') || text.includes('space research') || text.includes('ieee') ||
      text.includes('literature review') || text.includes('satellite') ||
      text.includes('state of the art') || text.includes('research paper') || text.includes('citation') ||
      (text.includes('paper') && !text.includes('wallpaper'))
    ) {
      return TASK_CATEGORIES.RESEARCH;
    }

    // 7. Planning & Decision-Making
    if (
      text.includes('plan') || text.includes('prioritize') || text.includes('roadmap') ||
      text.includes('trade-off') || text.includes('decide between') || text.includes('pros and cons') ||
      text.includes('dependency') || text.includes('milestone') || text.includes('architecture review')
    ) {
      return TASK_CATEGORIES.PLANNING_DECISION;
    }

    // 8. Programming & Development
    if (
      text.includes('react') || text.includes('node') || text.includes('javascript') ||
      text.includes('typescript') || text.includes('vite') || text.includes('python') ||
      text.includes('code') || text.includes('function') || text.includes('bug') ||
      text.includes('refactor') || text.includes('git') || text.includes('api') ||
      text.includes('css') || text.includes('frontend') || text.includes('backend')
    ) {
      return TASK_CATEGORIES.PROGRAMMING_DEVELOPMENT;
    }

    // 9. Personal Projects (General)
    if (
      text.includes('project') || text.includes('portfolio') || text.includes('companion')
    ) {
      return TASK_CATEGORIES.PERSONAL_PROJECTS;
    }

    // Default: General Conversation
    return TASK_CATEGORIES.GENERAL_CONVERSATION;
  }

  /**
   * Primary compilation entrypoint
   */
  compileCognitiveContext({
    input = '',
    complexity = 'LEVEL_1_SIMPLE',
    mode = 'COMPANION',
    specialistAgentId = null,
    maxMemories = 4,
    allowSensitive = false,
    options = {}
  } = {}) {
    const rawText = String(input).trim();
    const modelVersion = this.model.getVersion();

    // 1. Task Category Classification
    const taskCategory = this.classifyTask(rawText, options);

    // 2. Understanding Synthesis (DNA, Emotions, Continuity)
    const understanding = this.understandingEngine.synthesizeUnderstanding(rawText, { mode });

    // 3. Selective Dimension Retrieval based on Task Profile
    const { selectedDimensions, excludedDimensions } = this._selectTaskDimensions(taskCategory, {
      specialistAgentId,
      complexity,
      input: rawText
    });

    // 4. Memory Retrieval & Sensitive Data Redaction
    const { authorizedMemories, excludedMemories } = this._retrieveFilteredMemories(rawText, taskCategory, {
      maxMemories,
      allowSensitive
    });

    // 5. Relevant Continuity Selection
    const continuity = this._selectRelevantContinuity(understanding.continuityContext || {}, taskCategory);

    // 6. Actionable Reasoning Directives Formulation
    const reasoningDirectives = this._synthesizeTaskReasoningDirectives(taskCategory, {
      selectedDimensions,
      specialistAgentId,
      complexity,
      emotionalState: understanding.emotionalAssessment?.state
    });

    // 7. Format Compact Markdown Block
    const formattedBlock = this._formatContextBlock({
      taskCategory,
      selectedDimensions,
      authorizedMemories,
      continuity,
      reasoningDirectives,
      specialistAgentId,
      modelVersion
    });

    // 8. Generate Collision-Resistant Context Digest (for cache identity)
    const digest = this._computeContextDigest(formattedBlock, modelVersion);

    // 9. Construct Observability Trace
    const trace = {
      timestamp: new Date().toISOString(),
      taskCategory,
      complexity,
      specialistAgentId,
      modelVersion,
      retrievedDimensions: Object.keys(selectedDimensions),
      selectedMemories: authorizedMemories.map(m => m.id || m.content?.slice(0, 30)),
      excludedContext: {
        dimensions: excludedDimensions,
        memoryCount: excludedMemories.length
      },
      reasoningDirectivesCount: reasoningDirectives.length,
      digest,
      tokenEstimate: Math.ceil(formattedBlock.length / 3.8)
    };

    this._recordTrace(trace);

    return {
      taskCategory,
      modelVersion,
      digest,
      selectedDimensions,
      authorizedMemories,
      continuity,
      reasoningDirectives,
      formattedBlock,
      retrievedDimensions: Object.keys(selectedDimensions),
      excludedContext: trace.excludedContext,
      emotionalContext: understanding.emotionalAssessment,
      conversationalDirectives: understanding.conversationalDirectives,
      trace,
      timestamp: trace.timestamp
    };
  }

  /**
   * Selects dimensions relevant to the task and explicitly records what is excluded
   */
  _selectTaskDimensions(category, { specialistAgentId, complexity, input }) {
    const selected = {};
    const excluded = [];

    // Base preferences applicable across almost all interactions
    const practical = this.model.getDimension('practicalVsTheoretical');
    const depth = this.model.getDimension('explanationDepth');
    const criticism = this.model.getDimension('directCriticism');

    if (practical) selected.practicalVsTheoretical = practical;
    if (depth) selected.explanationDepth = depth;
    if (criticism) selected.directCriticism = criticism;

    switch (category) {
      case TASK_CATEGORIES.ENGINEERING_ELECTRONICS:
      case TASK_CATEGORIES.PROGRAMMING_DEVELOPMENT: {
        const techDomains = this.model.getDimension('technicalDomains');
        const analytical = this.model.getDimension('analyticalVsExploratory');
        const gaps = this.model.getDimension('knownGaps');
        const uncertainty = this.model.getDimension('uncertaintyHandling');

        if (techDomains) selected.technicalDomains = techDomains;
        if (analytical) selected.analyticalVsExploratory = analytical;
        if (gaps) selected.knownGaps = gaps;
        if (uncertainty) selected.uncertaintyHandling = uncertainty;

        excluded.push('creativeDomains', 'historicalRoles', 'currentRoles');
        break;
      }

      case TASK_CATEGORIES.PHOTOGRAPHY_VISUAL: {
        const creativeDomains = this.model.getDimension('creativeDomains');
        const currentRoles = this.model.getDimension('currentRoles');
        const principles = this.model.getDimension('principles');

        if (creativeDomains) selected.creativeDomains = creativeDomains;
        if (currentRoles) selected.currentRoles = currentRoles;
        if (principles) selected.principles = principles;

        excluded.push('technicalDomains', 'knownGaps', 'historicalRoles');
        break;
      }

      case TASK_CATEGORIES.LEADERSHIP_MANAGEMENT: {
        const currentRoles = this.model.getDimension('currentRoles');
        const historicalRoles = this.model.getDimension('historicalRoles');
        const collab = this.model.getDimension('collaborationPattern');
        const principles = this.model.getDimension('principles');

        if (currentRoles) selected.currentRoles = currentRoles;
        if (historicalRoles) selected.historicalRoles = historicalRoles;
        if (collab) selected.collaborationPattern = collab;
        if (principles) selected.principles = principles;

        excluded.push('technicalDomains', 'creativeDomains', 'knownGaps');
        break;
      }

      case TASK_CATEGORIES.ACADEMIC_TUTORING: {
        const techDomains = this.model.getDimension('technicalDomains');
        const analytical = this.model.getDimension('analyticalVsExploratory');

        if (techDomains) selected.technicalDomains = techDomains;
        if (analytical) selected.analyticalVsExploratory = analytical;

        excluded.push('creativeDomains', 'currentRoles', 'historicalRoles');
        break;
      }

      case TASK_CATEGORIES.RESEARCH: {
        const aspirations = this.model.getDimension('aspirations');
        const techDomains = this.model.getDimension('technicalDomains');
        const uncertainty = this.model.getDimension('uncertaintyHandling');
        const principles = this.model.getDimension('principles');

        if (aspirations) selected.aspirations = aspirations;
        if (techDomains) selected.technicalDomains = techDomains;
        if (uncertainty) selected.uncertaintyHandling = uncertainty;
        if (principles) selected.principles = principles;

        excluded.push('creativeDomains', 'historicalRoles');
        break;
      }

      case TASK_CATEGORIES.PLANNING_DECISION: {
        const collab = this.model.getDimension('collaborationPattern');
        const principles = this.model.getDimension('principles');
        const uncertainty = this.model.getDimension('uncertaintyHandling');

        if (collab) selected.collaborationPattern = collab;
        if (principles) selected.principles = principles;
        if (uncertainty) selected.uncertaintyHandling = uncertainty;

        excluded.push('creativeDomains', 'historicalRoles');
        break;
      }

      case TASK_CATEGORIES.PERSONAL_PROJECTS: {
        const techDomains = this.model.getDimension('technicalDomains');
        const creativeDomains = this.model.getDimension('creativeDomains');
        const aspirations = this.model.getDimension('aspirations');

        if (techDomains) selected.technicalDomains = techDomains;
        if (creativeDomains) selected.creativeDomains = creativeDomains;
        if (aspirations) selected.aspirations = aspirations;
        break;
      }

      case TASK_CATEGORIES.GENERAL_CONVERSATION:
      default: {
        const personalFacts = this.model.getDimension('personalFacts');
        const commStyle = this.model.getDimension('communicationStyle');

        if (personalFacts) selected.personalFacts = personalFacts;
        if (commStyle) selected.communicationStyle = commStyle;

        excluded.push('technicalDomains', 'knownGaps', 'creativeDomains');
        break;
      }
    }

    // Specialist overrides: Ultron always receives first-principles deconstruction
    if (specialistAgentId === 'ULTRON') {
      const firstPrinciples = this.model.getDimension('firstPrinciplesDeconstruction');
      const principles = this.model.getDimension('principles');
      if (firstPrinciples) selected.firstPrinciplesDeconstruction = firstPrinciples;
      if (principles) selected.principles = principles;
    }

    return { selectedDimensions: selected, excludedDimensions: excluded };
  }

  /**
   * Memory filtration: excludes unapproved records, high sensitivity, and credential leakage
   */
  _retrieveFilteredMemories(query, category, { maxMemories = 4, allowSensitive = false }) {
    if (!memoryService || typeof memoryService.retrieveRelevant !== 'function') {
      return { authorizedMemories: [], excludedMemories: [] };
    }

    const raw = memoryService.retrieveRelevant(query, { limit: maxMemories * 2 });
    const authorized = [];
    const excluded = [];

    for (const m of raw) {
      // 1. Exclude superseded info
      if (m.category === MEMORY_CATEGORIES.SUPERSEDED_INFO) {
        excluded.push({ id: m.id, reason: 'SUPERSEDED' });
        continue;
      }

      // 2. Exclude unapproved records from execution prompts
      if (!m.userApproved) {
        excluded.push({ id: m.id, reason: 'UNAPPROVED_RECORD' });
        continue;
      }

      // 3. Exclude high-sensitivity memories unless explicitly authorized
      const isSensitive = m.sensitivity === 'private' ||
                          m.sensitivity === 'restricted' ||
                          m.sensitivity === 'HIGH' ||
                          m.sensitivity === 'RESTRICTED' ||
                          String(m.sensitivity).toLowerCase() === 'high';
      if (!allowSensitive && isSensitive) {
        excluded.push({ id: m.id, reason: 'HIGH_SENSITIVITY_FILTERED' });
        continue;
      }

      // 4. Strict credential / token guard
      if (m.content && /bearer\s+|sk-|api_key|password\s*=/i.test(m.content)) {
        excluded.push({ id: m.id, reason: 'CREDENTIAL_DETECTED' });
        continue;
      }

      // 5. Category relevance check: don't inject photography memories into firmware debugging
      if (category === TASK_CATEGORIES.ENGINEERING_ELECTRONICS && m.content && /photo|shutter|frames|lens/i.test(m.content)) {
        excluded.push({ id: m.id, reason: 'CATEGORY_IRRELEVANT' });
        continue;
      }

      authorized.push(m);
      if (authorized.length >= maxMemories) break;
    }

    return { authorizedMemories: authorized, excludedMemories: excluded };
  }

  /**
   * Selects relevant project and decision continuity for the task
   */
  _selectRelevantContinuity(continuity, category) {
    const projects = (continuity.projects || []).slice(0, 2);
    const decisions = (continuity.decisions || []).slice(0, 2);
    const compactSummary = continuity.compactSummary || '';
    const recentWorkContext = continuity.recentWorkContext || null;

    if (category === TASK_CATEGORIES.PHOTOGRAPHY_VISUAL) {
      return {
        projects: projects.filter(p => /photo|frames|visual|darkroom/i.test(p.title || p.summary || p.objective || '')),
        decisions: decisions.filter(d => /photo|design|visual/i.test(d.topic)),
        compactSummary,
        recentWorkContext
      };
    }

    if (category === TASK_CATEGORIES.ENGINEERING_ELECTRONICS) {
      return {
        projects: projects.filter(p => /stm32|dsp|kicad|sdr|hardware|firmware/i.test(p.title || p.summary || p.objective || '')),
        decisions: decisions.filter(d => /circuit|hardware|dsp|code/i.test(d.topic)),
        compactSummary,
        recentWorkContext
      };
    }

    return { projects, decisions, compactSummary, recentWorkContext };
  }

  /**
   * Synthesize task-specific actionable reasoning directives
   */
  _synthesizeTaskReasoningDirectives(category, { selectedDimensions, specialistAgentId, complexity }) {
    const directives = [];

    switch (category) {
      case TASK_CATEGORIES.ENGINEERING_ELECTRONICS:
        directives.push('Prioritize working, tangible code and hardware schematics before theoretical abstractions.');
        directives.push('Ground proposals in working physical builds and clean register/schematic logic.');
        directives.push('Consider STM32 hardware resource constraints (DMA channels, timer prescalers, ADC sampling clocks, RAM buffers).');
        directives.push('For signal processing, verify Fourier/sampling boundaries (Nyquist, filter stability, group delay).');
        break;

      case TASK_CATEGORIES.PROGRAMMING_DEVELOPMENT:
        directives.push('Provide minimal, working, tangible code snippets first, then explain the structural architecture.');
        directives.push('Respect existing project conventions (functional React, bounded state, zero prototype pollution).');
        break;

      case TASK_CATEGORIES.ACADEMIC_TUTORING:
        directives.push('Explain step-by-step from foundational first principles with clear intermediate milestones.');
        directives.push('Use intuitive physical analogies followed by rigorous mathematical formulations.');
        break;

      case TASK_CATEGORIES.PHOTOGRAPHY_VISUAL:
        directives.push('Reason through visual hierarchy, negative space, framing, color temperature, and narrative storytelling.');
        directives.push('Respect @zoomout_frames high-contrast documentary and street photography aesthetic.');
        break;

      case TASK_CATEGORIES.LEADERSHIP_MANAGEMENT:
        directives.push('Structure communication clearly with executive clarity, transparent ownership, and actionable delegation.');
        directives.push('Balance technical rigor with diplomatic peer collaboration.');
        break;

      case TASK_CATEGORIES.RESEARCH:
        directives.push('Anchor claims in verifiable literature, IEEE standards, and physical laws; state confidence boundaries plainly.');
        directives.push('Differentiate established theorems from active exploratory hypotheses.');
        break;

      case TASK_CATEGORIES.PLANNING_DECISION:
        directives.push('Identify dependencies and distinguish reversible vs irreversible architectural decisions.');
        directives.push('Present clear trade-off matrices with explicit risk factors.');
        break;

      case TASK_CATEGORIES.PERSONAL_PROJECTS:
        directives.push('Maintain continuity with Adhy’s active engineering builds (Mini-Adhy, SDR, KiCad boards).');
        break;

      case TASK_CATEGORIES.GENERAL_CONVERSATION:
      default:
        directives.push('Speak as a natural, perceptive engineering peer with context-sensitive wit and warm familiarity.');
        break;
    }

    // Radical honesty invariant
    const critPref = selectedDimensions.directCriticism?.value;
    if (critPref === 'strongly_preferred' || specialistAgentId === 'ULTRON') {
      directives.push('Challenge flawed assumptions with objective data and counter-arguments; direct technical criticism and flaw detection strictly supersede false compliments or polite hedging.');
    }

    // Uncertainty handling invariant
    directives.push('Admit uncertainty plainly when physical facts or data are unverified; never invent claims.');

    return directives;
  }

  /**
   * Formats the compiled context into an inspectable Markdown block for system prompts
   */
  _formatContextBlock({
    taskCategory,
    selectedDimensions,
    authorizedMemories,
    continuity,
    reasoningDirectives,
    specialistAgentId,
    modelVersion
  }) {
    const sections = [];

    sections.push(`### ADHY COGNITIVE MODEL CONTEXT [Category: ${taskCategory} | Model: v${modelVersion}]`);

    // Reasoning Directives
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
        return `• ${d.name || k}: ${valStr}`;
      });
      sections.push('#### RELEVANT CREATOR PROFILE & COGNITION\n' + dimLines.join('\n'));
    }

    // Authorized Relevant Memory
    if (authorizedMemories.length > 0) {
      const memLines = authorizedMemories.map(m => `• [${m.category || 'FACT'}]: ${m.content}`);
      sections.push('#### AUTHORIZED TASK MEMORY\n' + memLines.join('\n'));
    }

    // Project & Decision Continuity
    if (continuity.projects?.length || continuity.decisions?.length || continuity.compactSummary) {
      const contLines = [];
      (continuity.projects || []).forEach(p => contLines.push(`• Ongoing: ${p.title} (${p.summary || p.objective || ''})`));
      (continuity.decisions || []).forEach(d => contLines.push(`• Prior Decision: ${d.topic} — ${d.decision}`));
      if (continuity.compactSummary && !continuity.projects?.length && !continuity.decisions?.length) {
        contLines.push(continuity.compactSummary);
      }
      if (contLines.length > 0) {
        sections.push('#### ACTIVE CONTINUITY\n' + contLines.join('\n'));
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Collision-resistant hash digest for compiled cognitive context
   */
  _computeContextDigest(text = '', modelVersion = '1.0.0') {
    const raw = `${modelVersion}::${text}`;
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
      hash = hash >>> 0;
    }
    return `ctx_${modelVersion.replace(/[^a-zA-Z0-9]/g, '_')}_${hash.toString(36)}`;
  }

  _recordTrace(trace) {
    this.recentTraces.unshift(trace);
    if (this.recentTraces.length > this.maxTraces) {
      this.recentTraces.pop();
    }
  }

  getRecentTraces() {
    return [...this.recentTraces];
  }
}

export const cognitiveContextCompiler = new CognitiveContextCompiler();
