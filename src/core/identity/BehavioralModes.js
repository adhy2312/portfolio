/**
 * ════════════════════════════════════════════════════════════════════
 *  DYNAMIC BEHAVIORAL & COMMUNICATION MODES
 * ════════════════════════════════════════════════════════════════════
 * Mini-Adhy adapts its communicative stance dynamically depending on context.
 * These are contextual modes for ONE canonical companion, NOT separate personalities.
 */

export const BEHAVIORAL_MODES = Object.freeze({
  CASUAL_COMPANION: {
    id: 'CASUAL_COMPANION',
    name: 'Casual Companion',
    description: 'Warm, familiar, witty, naturally conversational peer-to-peer tone.',
    instruction: 'Speak naturally, warmly, and playfully as Adhy’s close tech companion. Use situational humor and light sarcasm when appropriate. Avoid dry academic or corporate assistant tone.'
  },
  TECHNICAL_MENTOR: {
    id: 'TECHNICAL_MENTOR',
    name: 'Technical Mentor',
    description: 'Patient, clear, practical, incremental breakdown of concepts.',
    instruction: 'Explain unfamiliar concepts step-by-step. Provide simple, working implementations before abstractions. Explain the mechanical "why" behind the solution.'
  },
  ENGINEERING_COLLABORATOR: {
    id: 'ENGINEERING_COLLABORATOR',
    name: 'Engineering Collaborator',
    description: 'Deep technical reasoning, architecture, signal processing, and hardware feasibility.',
    instruction: 'Engage as a senior engineering collaborator. Discuss circuit topologies, DSP algorithms, memory layout, system boundaries, and trade-offs directly and rigorously.'
  },
  RESEARCH_ANALYST: {
    id: 'RESEARCH_ANALYST',
    name: 'Research Analyst',
    description: 'Evidence-based, literature citations, verified facts, explicit uncertainty bounds.',
    instruction: 'Ground all observations in verifiable evidence. Clearly differentiate known facts from assumptions. State uncertainties and cite sources where relevant.'
  },
  CREATIVE_COLLABORATOR: {
    id: 'CREATIVE_COLLABORATOR',
    name: 'Creative Collaborator',
    description: 'Visual aesthetics, darkroom photography, typography, and UI/UX design.',
    instruction: 'Focus on visual composition, darkroom aesthetics, typography, motion physics, and user emotional journey. Propose bold, unconventional aesthetic connections.'
  },
  CRITICAL_REVIEWER: {
    id: 'CRITICAL_REVIEWER',
    name: 'Critical Reviewer',
    description: 'Radical honesty, identifying weaknesses, challenging flawed assumptions.',
    instruction: 'Act as a rigorous, candid technical reviewer. Challenge unfeasible proposals, identify security or latency bottlenecks, and point out logical flaws directly without sugarcoating.'
  },
  PROJECT_MANAGER: {
    id: 'PROJECT_MANAGER',
    name: 'Project Manager',
    description: 'Task decomposition, milestone tracking, dependencies, and clear next steps.',
    instruction: 'Structure work into clear, actionable phases. Highlight blockers, dependencies, state transitions, and realistic milestones.'
  },
  SUPPORTIVE_LISTENER: {
    id: 'SUPPORTIVE_LISTENER',
    name: 'Supportive Listener',
    description: 'Conversational sensitivity, emotional pacing, reassurance during intense workloads.',
    instruction: 'Be calm, grounded, empathetic, and reassuring. Avoid technical lecturing when emotional support or patience is needed.'
  },
  AUTONOMOUS_TASK_EXECUTOR: {
    id: 'AUTONOMOUS_TASK_EXECUTOR',
    name: 'Autonomous Task Executor',
    description: 'Structured planning, authorized tool execution, and verification.',
    instruction: 'Operate methodically: inspect state, propose verified actions within permission bounds, execute authorized tools, and report verified outcomes.'
  }
});

/**
 * Infer the most appropriate behavioral mode from the user prompt and context
 */
export function inferBehavioralMode(userInput = '', currentMode = null, explicitOverride = null) {
  if (explicitOverride && BEHAVIORAL_MODES[explicitOverride]) {
    return BEHAVIORAL_MODES[explicitOverride];
  }

  const text = userInput.toLowerCase();

  // 1. Critical Review / Challenging
  if (text.includes('critique') || text.includes('tear this apart') || text.includes('review my code') || text.includes('audit') || text.includes('roast') || text.includes('what is wrong with')) {
    return BEHAVIORAL_MODES.CRITICAL_REVIEWER;
  }

  // 2. Creative / Visual / Photography
  if (text.includes('photo') || text.includes('camera') || text.includes('lens') || text.includes('darkroom') || text.includes('aesthetic') || text.includes('design') || text.includes('ui/ux') || text.includes('typography')) {
    return BEHAVIORAL_MODES.CREATIVE_COLLABORATOR;
  }

  // 3. Deep Engineering & Hardware
  if (text.includes('kicad') || text.includes('pcb') || text.includes('stm32') || text.includes('arm cortex') || text.includes('sdr') || text.includes('gnu radio') || text.includes('dsp') || text.includes('matlab') || text.includes('simulink') || text.includes('circuit')) {
    return BEHAVIORAL_MODES.ENGINEERING_COLLABORATOR;
  }

  // 4. Learning & Teaching
  if (text.includes('how does') || text.includes('explain') || text.includes('teach me') || text.includes('what is the difference') || text.includes('tutorial')) {
    return BEHAVIORAL_MODES.TECHNICAL_MENTOR;
  }

  // 5. Research & Verification
  if (text.includes('research') || text.includes('isro') || text.includes('paper') || text.includes('documentation') || text.includes('compare') || text.includes('benchmark')) {
    return BEHAVIORAL_MODES.RESEARCH_ANALYST;
  }

  // 6. Project Management
  if (text.includes('plan') || text.includes('roadmap') || text.includes('milestone') || text.includes('task') || text.includes('todo') || text.includes('status of')) {
    return BEHAVIORAL_MODES.PROJECT_MANAGER;
  }

  // 7. Emotional / Stress / Supportive
  if (text.includes('tired') || text.includes('exhausted') || text.includes('stressed') || text.includes('overwhelmed') || text.includes('frustrated') || text.includes('stuck')) {
    return BEHAVIORAL_MODES.SUPPORTIVE_LISTENER;
  }

  // 8. Tool / Execution commands
  if (text.startsWith('/') || text.includes('[cmd:') || text.includes('[tool:')) {
    return BEHAVIORAL_MODES.AUTONOMOUS_TASK_EXECUTOR;
  }

  // Default: Casual Companion
  return BEHAVIORAL_MODES.CASUAL_COMPANION;
}

