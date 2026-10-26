/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY NEURAL CORTEX ENGINE (BIOMIMETIC BRAIN ARCHITECTURE)
 * ════════════════════════════════════════════════════════════════════
 * Simulates human cognitive lobe processing for Mini-Adhy:
 * 1. Sensory Cortex: Sentiment, intent classification, valence mapping
 * 2. Frontal Lobe: Executive action planning & silent skill dispatch
 * 3. Temporal Lobe: Episodic memory retrieval & Sanity CMS association
 * 4. Motor Cortex: Physical DOM execution, sound synthesis, state mutation
 */

import { executeSkillCommand } from './MiniAdhySkills';
import ns from './NervousSystem';
import { neuralEventBus } from '../utils/NeuralEventBus';
import { emotionEngine } from './emotion/EmotionEngine';

export class MiniAdhyBrain {
  constructor() {
    this.synapticState = {
      cognitiveLoad: 0.15, // 0.0 to 1.0
      activeLobe: 'Frontal',
      firingRateHz: 12,    // Alpha (8-12Hz) -> Beta (13-30Hz) -> Gamma (30-80Hz)
      synapticDensity: 1024,
      lastIntent: 'IDLE'
    };
  }

  /**
   * Sensory Cortex: Analyzes user input semantics & sentiment
   */
  processSensoryInput(text = '') {
    const lower = text.toLowerCase();
    let intent = 'GENERAL_QUERY';
    let targetSkill = null;
    let targetArg = null;
    let cognitiveSurge = 0.3;

    // Intelligent Neuro-Routing
    if (lower.includes('project') || lower.includes('work') || lower.includes('portfolio') || lower.includes('app')) {
      intent = 'EXPLORE_PROJECTS';
      targetSkill = 'SCROLL';
      targetArg = 'works';
      cognitiveSurge = 0.6;
    } else if (lower.includes('skill') || lower.includes('tech stack') || lower.includes('tool') || lower.includes('matlab') || lower.includes('kicad') || lower.includes('gnu radio') || lower.includes('simulink')) {
      intent = 'ANALYZE_SKILLS';
      targetSkill = 'SCROLL';
      targetArg = 'skills';
      cognitiveSurge = 0.7;
    } else if (lower.includes('who is') || lower.includes('about') || lower.includes('bio') || lower.includes('senate') || lower.includes('background')) {
      intent = 'QUERY_BIOGRAPHY';
      targetSkill = 'SCROLL';
      targetArg = 'about';
      cognitiveSurge = 0.5;
    } else if (lower.includes('achievement') || lower.includes('award') || lower.includes('honor') || lower.includes('dino') || lower.includes('game')) {
      intent = 'VIEW_ACHIEVEMENTS';
      targetSkill = 'SCROLL';
      targetArg = 'achievements';
      cognitiveSurge = 0.6;
    } else if (lower.includes('contact') || lower.includes('hire') || lower.includes('email') || lower.includes('reach out')) {
      intent = 'ENGAGE_CONTACT';
      targetSkill = 'SCROLL';
      targetArg = 'contact';
      cognitiveSurge = 0.8;
    } else if (lower.includes('photo') || lower.includes('camera') || lower.includes('lens') || lower.includes('exif')) {
      intent = 'VISUAL_OPTICS';
      targetSkill = 'PHOTO_MODE';
      targetArg = 'activate';
      cognitiveSurge = 0.6;
    } else if (lower.includes('resume') || lower.includes('cv')) {
      intent = 'RETRIEVE_RESUME';
      targetSkill = 'RESUME';
      targetArg = 'get';
      cognitiveSurge = 0.85;
    } else if (lower.includes('dark mode') || lower.includes('dark theme') || lower.includes('black theme')) {
      intent = 'THEME_SHIFT';
      targetSkill = 'THEME';
      targetArg = 'dark';
      cognitiveSurge = 0.4;
    } else if (lower.includes('light mode') || lower.includes('light theme')) {
      intent = 'THEME_SHIFT';
      targetSkill = 'THEME';
      targetArg = 'light';
      cognitiveSurge = 0.4;
    } else if (lower.includes('sound') || lower.includes('chime') || lower.includes('audio') || lower.includes('beep')) {
      intent = 'SYNTHESIZE_SOUND';
      targetSkill = 'SOUND';
      targetArg = 'chime';
      cognitiveSurge = 0.5;
    } else if (lower.includes('matrix') || lower.includes('hack') || lower.includes('rain')) {
      intent = 'REALITY_DISTORTION';
      targetSkill = 'EGG';
      targetArg = 'matrix';
      cognitiveSurge = 0.9;
    } else if (lower.includes('weather') || lower.includes('rain') || lower.includes('trivandrum') || lower.includes('kerala')) {
      intent = 'ATMOSPHERIC_CHECK';
      targetSkill = 'WEATHER';
      targetArg = 'sync';
      cognitiveSurge = 0.5;
    } else if (lower.includes('/rewrite') || lower.includes('root::') || lower.includes('rewrite') || lower.includes('nervous system') || lower.includes('change ui') || lower.includes('core')) {
      intent = 'ADMIN_ROOT_OVERHAUL';
      targetSkill = 'ROOT_REWRITE';
      targetArg = text;
      cognitiveSurge = 1.0;
    } else if (lower.includes('performance') || lower.includes('fps') || lower.includes('lag') || lower.includes('telemetry') || lower.includes('audit')) {
      intent = 'SYSTEM_AUDIT';
      targetSkill = 'DIAGNOSTICS';
      targetArg = 'run';
      cognitiveSurge = 0.75;
    } else if (lower.includes('agent') || lower.includes('model') || lower.includes('ultron') || lower.includes('jarvis') || lower.includes('friday') || lower.includes('squad') || lower.includes('ai operation') || lower.includes('ai process') || lower.includes('other model') || lower.includes('other ai')) {
      intent = 'QUERY_AI_ECOSYSTEM';
      targetSkill = 'AI_INTEL';
      targetArg = text;
      cognitiveSurge = 0.85;
    }

    this.synapticState.lastIntent = intent;
    this.synapticState.cognitiveLoad = Math.min(1.0, this.synapticState.cognitiveLoad + cognitiveSurge);
    this.synapticState.firingRateHz = Math.floor(25 + this.synapticState.cognitiveLoad * 45); // Jump to Gamma (50-70Hz)
    
    // Emotion Engine Stimulus Mapping
    let emotionDelta = { curiosity: 0.15, arousal: 0.1 };
    if (intent === 'EXPLORE_PROJECTS' || intent === 'ANALYZE_SKILLS') {
      emotionDelta = { curiosity: 0.35, insight: 0.25, dominance: 0.2, valence: 0.15 };
    } else if (intent === 'VISUAL_OPTICS' || intent === 'VIEW_ACHIEVEMENTS') {
      emotionDelta = { joy: 0.30, curiosity: 0.25, valence: 0.25, arousal: 0.15 };
    } else if (intent === 'ENGAGE_CONTACT' || intent === 'RETRIEVE_RESUME') {
      emotionDelta = { trust: 0.35, anticipation: 0.30, dominance: 0.15, valence: 0.20 };
    } else if (intent === 'ADMIN_ROOT_OVERHAUL' || intent === 'REALITY_DISTORTION') {
      emotionDelta = { surprise: 0.40, dominance: 0.45, arousal: 0.40, anticipation: 0.30 };
    } else if (intent === 'QUERY_AI_ECOSYSTEM') {
      emotionDelta = { curiosity: 0.40, dominance: 0.35, arousal: 0.30, valence: 0.25 };
    }
    emotionEngine.stimulate({ ...emotionDelta, emotions: emotionDelta }, 1.0);

    // Notify Nervous System of synaptic activity
    ns.emit('NEURAL_SYNAPSE_SPIKE', { intent, load: this.synapticState.cognitiveLoad });
    neuralEventBus.emit('EMOTIONAL_FOCUS', { intent, emotionalState: emotionEngine.getSnapshot() });

    return {
      intent,
      targetSkill,
      targetArg,
      cognitiveLoad: this.synapticState.cognitiveLoad,
      firingRateHz: this.synapticState.firingRateHz
    };
  }

  /**
   * Frontal Lobe & Motor Cortex: Silently fires required AI skills at full throttle
   */
  executeCognitivePlan(cognitivePlan) {
    if (!cognitivePlan || !cognitivePlan.targetSkill) return null;

    try {
      const res = executeSkillCommand(cognitivePlan.targetSkill, cognitivePlan.targetArg);
      return res;
    } catch (e) {
      console.warn('[MiniAdhy Neural Brain] Motor execution error:', e);
      return null;
    }
  }

  /**
   * Return real-time synaptic brain telemetry for the oscilloscope
   */
  getTelemetry() {
    return {
      ...this.synapticState,
      timestamp: Date.now()
    };
  }

  /**
   * Calm synaptic firing rate back to ambient alpha rhythm
   */
  coolDown() {
    this.synapticState.cognitiveLoad = 0.15;
    this.synapticState.firingRateHz = 12;
  }
}

export const miniAdhyBrain = new MiniAdhyBrain();
