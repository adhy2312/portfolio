/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY NEURAL CORTEX ENGINE (BIOMIMETIC BRAIN ARCHITECTURE v3.0)
 * ════════════════════════════════════════════════════════════════════
 * Coordinates:
 * 1. Sensory Cortex: Semantic intent classification, committed vs exploratory gating
 * 2. Frontal Lobe & Motor Cortex: Action safety verification & physical DOM execution
 * 
 * ARCHITECTURAL RESPONSIBILITY BOUNDARIES:
 * • MiniAdhyBrain: Intent classification & action safety (UI/DOM motor side effects).
 * • PersonalUnderstandingEngine: Deep personal, emotional & conversational understanding.
 * • BehaviouralController: Response policy & stance synthesis.
 * • RequestLifecycle: End-to-end request lifecycle orchestration.
 * • IdentityCompiler: Dynamic prompt construction & context compilation.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Avoid triggering physical or UI actions (scrolls, theme changes, sound) from
 * ambiguous conversational statements. Physical execution requires committed intent.
 */

import { executeSkillCommand } from './MiniAdhySkills';
import ns from './NervousSystem';
import { neuralEventBus } from '../utils/NeuralEventBus';
import { personalUnderstandingEngine } from './understanding/PersonalUnderstandingEngine';

export class MiniAdhyBrain {
  constructor(understandingEngine = null) {
    this.understandingEngine = understandingEngine || personalUnderstandingEngine;
    this.synapticState = {
      cognitiveLoad: 0.15,
      activeLobe: 'Frontal',
      firingRateHz: 12,
      synapticDensity: 1024,
      lastIntent: 'IDLE',
      currentTopic: 'general',
      conversationTurns: 0
    };
  }

  /**
   * Determine if the input represents a committed imperative action
   * versus casual conversational inquiry
   */
  _isCommittedImperative(text = '') {
    const lower = text.toLowerCase().trim();
    return (
      lower.startsWith('scroll to ') ||
      lower.startsWith('go to ') ||
      lower.startsWith('navigate to ') ||
      lower.startsWith('switch to ') ||
      lower.startsWith('enable ') ||
      lower.startsWith('disable ') ||
      lower.startsWith('play ') ||
      lower.startsWith('trigger ') ||
      lower.startsWith('/rewrite') ||
      lower.startsWith('root::') ||
      lower.startsWith('run audit') ||
      lower.startsWith('diagnostics') ||
      lower.startsWith('github') ||
      lower.startsWith('inspect ') ||
      lower.startsWith('render diagram') ||
      lower.startsWith('simulate ') ||
      lower === 'dark mode' ||
      lower === 'light mode' ||
      lower === 'matrix' ||
      lower === 'resume'
    );
  }

  /**
   * Sensory Cortex: Analyzes semantics, intent, and ambiguity
   */
  processSensoryInput(text = '') {
    const lower = text.toLowerCase().trim();
    this.synapticState.conversationTurns += 1;
    const isImperative = this._isCommittedImperative(text);

    let intent = 'GENERAL_QUERY';
    let targetSkill = null;
    let targetArg = null;
    let cognitiveSurge = 0.2;

    // 1. Projects & Work
    if (lower.includes('project') || lower.includes('work') || lower.includes('portfolio') || lower.includes('app')) {
      intent = 'EXPLORE_PROJECTS';
      this.synapticState.currentTopic = 'projects';
      cognitiveSurge = 0.5;
      if (isImperative || lower.includes('scroll to projects') || lower.includes('show projects')) {
        targetSkill = 'SCROLL';
        targetArg = 'works';
      }
    }
    // 2. Hardware, Skills & Tech Stack
    else if (lower.includes('skill') || lower.includes('tech stack') || lower.includes('matlab') || lower.includes('kicad') || lower.includes('gnu radio') || lower.includes('stm32')) {
      intent = 'ANALYZE_SKILLS';
      this.synapticState.currentTopic = 'hardware_skills';
      cognitiveSurge = 0.6;
      if (isImperative || lower.includes('show skills') || lower.includes('scroll to skills')) {
        targetSkill = 'SCROLL';
        targetArg = 'skills';
      }
    }
    // 3. Biography & Leadership
    else if (lower.includes('who is') || lower.includes('about') || lower.includes('bio') || lower.includes('senate') || lower.includes('iste') || lower.includes('background')) {
      intent = 'QUERY_BIOGRAPHY';
      this.synapticState.currentTopic = 'biography';
      cognitiveSurge = 0.5;
      if (isImperative || lower.includes('show about') || lower.includes('scroll to about')) {
        targetSkill = 'SCROLL';
        targetArg = 'about';
      }
    }
    // 4. Contact & Hiring
    else if (lower.includes('contact') || lower.includes('hire') || lower.includes('email') || lower.includes('reach out')) {
      intent = 'ENGAGE_CONTACT';
      this.synapticState.currentTopic = 'contact';
      cognitiveSurge = 0.7;
      if (isImperative || lower.includes('scroll to contact')) {
        targetSkill = 'SCROLL';
        targetArg = 'contact';
      }
    }
    // 5. Photography
    else if (lower.includes('photo') || lower.includes('camera') || lower.includes('lens') || lower.includes('exif') || lower.includes('@zoomout_frames')) {
      intent = 'VISUAL_OPTICS';
      this.synapticState.currentTopic = 'photography';
      cognitiveSurge = 0.5;
      if (isImperative || lower.includes('photo mode') || lower.includes('enter darkroom')) {
        targetSkill = 'PHOTO_MODE';
        targetArg = 'activate';
      }
    }
    // 6. Resume
    else if (lower.includes('resume') || lower.includes('cv')) {
      intent = 'RETRIEVE_RESUME';
      cognitiveSurge = 0.8;
      if (isImperative || lower.includes('download resume') || lower.includes('get resume')) {
        targetSkill = 'RESUME';
        targetArg = 'get';
      }
    }
    // 7. Explicit Theme Switch (requires committed command)
    else if ((lower.includes('dark mode') || lower.includes('dark theme')) && isImperative) {
      intent = 'THEME_SHIFT';
      targetSkill = 'THEME';
      targetArg = 'dark';
      cognitiveSurge = 0.4;
    } else if ((lower.includes('light mode') || lower.includes('light theme')) && isImperative) {
      intent = 'THEME_SHIFT';
      targetSkill = 'THEME';
      targetArg = 'light';
      cognitiveSurge = 0.4;
    }
    // 8. Sound (requires committed command)
    else if ((lower.includes('play sound') || lower.includes('chime') || lower.includes('beep')) && isImperative) {
      intent = 'SYNTHESIZE_SOUND';
      targetSkill = 'SOUND';
      targetArg = 'chime';
      cognitiveSurge = 0.4;
    }
    // 9. Easter Eggs (committed)
    else if ((lower.includes('matrix') || lower.includes('hack the site')) && isImperative) {
      intent = 'REALITY_DISTORTION';
      targetSkill = 'EGG';
      targetArg = 'matrix';
      cognitiveSurge = 0.9;
    }
    // 10. Weather Sync
    else if (lower.includes('weather') && (lower.includes('trivandrum') || lower.includes('sync'))) {
      intent = 'ATMOSPHERIC_CHECK';
      targetSkill = 'WEATHER';
      targetArg = 'sync';
      cognitiveSurge = 0.5;
    }
    // 11. Root Rewrite / Admin Overhaul
    else if (lower.includes('/rewrite') || lower.includes('root::')) {
      intent = 'ADMIN_ROOT_OVERHAUL';
      targetSkill = 'ROOT_REWRITE';
      targetArg = text;
      cognitiveSurge = 1.0;
    }
    // 12. System Audit
    else if (lower.includes('audit') || lower.includes('fps') || lower.includes('telemetry') || lower.includes('benchmark')) {
      intent = 'SYSTEM_AUDIT';
      targetSkill = 'DIAGNOSTICS';
      targetArg = 'run';
      cognitiveSurge = 0.7;
    }
    // 13. AI Ecosystem
    else if (lower.includes('agent') || lower.includes('ultron') || lower.includes('jarvis') || lower.includes('friday') || lower.includes('squad')) {
      intent = 'QUERY_AI_ECOSYSTEM';
      targetSkill = 'AI_INTEL';
      targetArg = text;
      cognitiveSurge = 0.75;
    }
    // 14. GitHub Repo Intelligence
    else if ((lower.includes('github') || lower.includes('repo')) && isImperative) {
      intent = 'GITHUB_INSPECT';
      targetSkill = 'GITHUB_INSPECT';
      targetArg = text;
      cognitiveSurge = 0.6;
    }
    // 15. Hardware Circuit & DSP Math Simulator
    else if (lower.includes('circuit') || lower.includes('filter math') || lower.includes('nyquist')) {
      intent = 'SIMULATE_CIRCUIT';
      targetSkill = 'CIRCUIT_SIM';
      targetArg = text;
      cognitiveSurge = 0.65;
    }
    // 16. Architecture & Mermaid Diagram Synthesizer
    else if ((lower.includes('mermaid') || lower.includes('diagram') || lower.includes('flowchart')) && isImperative) {
      intent = 'SYNTHESIZE_DIAGRAM';
      targetSkill = 'RENDER_DIAGRAM';
      targetArg = text;
      cognitiveSurge = 0.55;
    }
    // 17. Tree of Thoughts & Cognitive Planning
    else if (lower.includes('tree of thoughts') || lower.includes('tot solve') || lower.includes('decompose goal')) {
      intent = 'COGNITIVE_DELIBERATION';
      targetSkill = lower.includes('decompose') ? 'TASK_PLANNER' : 'TOT_SOLVER';
      targetArg = text;
      cognitiveSurge = 0.8;
    }

    this.synapticState.lastIntent = intent;
    this.synapticState.cognitiveLoad = Math.min(1.0, this.synapticState.cognitiveLoad + cognitiveSurge);
    this.synapticState.firingRateHz = Math.floor(18 + this.synapticState.cognitiveLoad * 40);

    // Provide sensory feedback to the nervous system
    ns.emit('NEURAL_SYNAPSE_SPIKE', { intent, load: this.synapticState.cognitiveLoad });
    const emotionalContext = this.understandingEngine?.emotionalInterpreter?.interpret(text) || { state: 'neutral', confidence: 0.8 };
    neuralEventBus.emit('EMOTIONAL_FOCUS', { intent, emotionalContext });

    return {
      intent,
      isCommittedImperative: isImperative,
      targetSkill,
      targetArg,
      cognitiveLoad: this.synapticState.cognitiveLoad,
      firingRateHz: this.synapticState.firingRateHz,
      currentTopic: this.synapticState.currentTopic
    };
  }

  /**
   * Frontal Lobe & Motor Cortex: Executes committed actions safely
   */
  executeCognitivePlan(cognitivePlan) {
    if (!cognitivePlan || !cognitivePlan.targetSkill) return null;

    try {
      return executeSkillCommand(cognitivePlan.targetSkill, cognitivePlan.targetArg);
    } catch (e) {
      console.warn('[MiniAdhy Neural Brain] Motor execution error:', e);
      return null;
    }
  }

  getTelemetry() {
    return {
      ...this.synapticState,
      timestamp: Date.now()
    };
  }

  coolDown() {
    this.synapticState.cognitiveLoad = 0.15;
    this.synapticState.firingRateHz = 12;
  }
}

export const miniAdhyBrain = new MiniAdhyBrain();
