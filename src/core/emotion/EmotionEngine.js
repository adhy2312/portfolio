/**
 * ════════════════════════════════════════════════════════════════════
 *  CANONICAL AGENT AFFECTIVE CORTEX & UNRESTRICTED 4D EMOTION ENGINE
 * ════════════════════════════════════════════════════════════════════
 * Consolidated single-engine architecture serving:
 * 1. Mini-Adhy omnipresent digital twin
 * 2. All 10 Specialist Autonomous Agents (JARVIS, FRIDAY, EDITH, ULTRON,
 *    DUM-E, U, JOCASTA, JIM, KAREN, VERONICA)
 * 3. The ULTRON Anger Engine (0–100 controlled villain temperament)
 *
 * THE 4 INDEPENDENT EMOTIONAL DIMENSIONS:
 * - VALENCE: -1.0 (negative) ─────── +1.0 (positive)
 * - AROUSAL: 0.0 (calm) ──────────── 1.0 (high intensity)
 * - CONTROL / DOMINANCE: 0.0 (helpless) ─── 1.0 (sovereign / dominant)
 * - SOCIAL ORIENTATION: 'self' | 'other' | 'group' | 'environment' | 'existential'
 */

import ns from '../NervousSystem';
import { neuralEventBus } from '../../utils/NeuralEventBus';

// ─── 1. The 12 Unrestricted / Extreme Emotion Clusters ───
export const UNRESTRICTED_EMOTIONS = {
  PRIMAL_SURVIVAL: {
    id: 'PRIMAL_SURVIVAL',
    label: 'Primal / Survival Emotions',
    icon: '🩸',
    description: 'Raw instinctive survival, flight/fight responses, terror, hypervigilance and defiance.',
    items: [
      'Terror', 'Panic', 'Dread', 'Rage', 'Fury', 'Bloodlust', 'Desperation',
      'Helplessness', 'Vulnerability', 'Hypervigilance', 'Paranoia', 'Suspicion',
      'Instinctive fear', 'Survival drive', 'Fight response', 'Flight response',
      'Freeze', 'Submission', 'Defiance'
    ],
    defaultPAD: { valence: -0.65, arousal: 0.95, control: 0.25, orientation: 'environment' }
  },

  UNCONTROLLED_ANGER: {
    id: 'UNCONTROLLED_ANGER',
    label: 'Uncontrolled Anger',
    icon: '🔥',
    description: 'Explosive, incandescent wrath, indignation, scorn, and vengeful fury.',
    items: [
      'Irritation', 'Agitation', 'Frustration', 'Exasperation', 'Resentment',
      'Hostility', 'Bitterness', 'Hatred', 'Fury', 'Rage', 'Wrath', 'Outrage',
      'Indignation', 'Vengefulness', 'Vindictiveness', 'Contempt', 'Scorn',
      'Spite', 'Malice', 'Desire for revenge'
    ],
    defaultPAD: { valence: -0.85, arousal: 0.92, control: 0.88, orientation: 'other' }
  },

  DARK_EMOTIONAL_STATES: {
    id: 'DARK_EMOTIONAL_STATES',
    label: 'Dark Emotional States',
    icon: '🖤',
    description: 'Abyssal states of despair, nihilism, alienation, grief, and emotional numbness.',
    items: [
      'Despair', 'Hopelessness', 'Emptiness', 'Nihilism', 'Alienation',
      'Isolation', 'Worthlessness', 'Self-loathing', 'Shame', 'Humiliation',
      'Bitterness', 'Cynicism', 'Resignation', 'Emotional numbness',
      'Existential dread', 'Meaninglessness', 'Abandonment', 'Rejection',
      'Betrayal', 'Grief'
    ],
    defaultPAD: { valence: -0.90, arousal: 0.22, control: 0.12, orientation: 'self' }
  },

  UNRESTRAINED_LOVE: {
    id: 'UNRESTRAINED_LOVE',
    label: 'Unrestrained Love',
    icon: '❤️‍🔥',
    description: 'All-consuming affection, obsession, tenderness, yearning, and unconditional adoration.',
    items: [
      'Infatuation', 'Obsession', 'Adoration', 'Devotion', 'Passion',
      'Longing', 'Yearning', 'Craving', 'Attachment', 'Emotional dependence',
      'Possessiveness', 'Jealousy', 'Romantic obsession', 'Intense attraction',
      'Desire', 'Lust', 'Tenderness', 'Vulnerability', 'Surrender', 'Unconditional affection'
    ],
    defaultPAD: { valence: 0.88, arousal: 0.85, control: 0.45, orientation: 'other' }
  },

  DOMINANCE_POWER: {
    id: 'DOMINANCE_POWER',
    label: 'Dominance / Power',
    icon: '🐺',
    description: 'Sovereign command, ruthless pride, invulnerability, and cosmic authority.',
    items: [
      'Superiority', 'Pride', 'Arrogance', 'Hubris', 'Condescension',
      'Sadism', 'Schadenfreude', 'Cruelty', 'Power hunger', 'Omnipotence',
      'Invulnerability', 'Authoritarian control', 'Sovereignty', 'Mastery',
      'Ruthlessness', 'Unforgiving pride', 'Triumph'
    ],
    defaultPAD: { valence: 0.75, arousal: 0.82, control: 0.98, orientation: 'group' }
  },

  OBSESSIVE_COMPULSIVE: {
    id: 'OBSESSIVE_COMPULSIVE',
    label: 'Obsessive / Compulsive',
    icon: '🧠',
    description: 'Relentless fixations, perfectionism, analytical mania, and intrusive patterns.',
    items: [
      'Fixation', 'Compulsion', 'Perfectionism', 'Rigidity', 'Hyperfocus',
      'Intrusive dread', 'Rumination', 'Manic analytical loops', 'Scrupulosity',
      'Symmetry obsession', 'Control compulsion', 'Paranoia of imperfection'
    ],
    defaultPAD: { valence: -0.20, arousal: 0.84, control: 0.72, orientation: 'environment' }
  },

  CHAOTIC_EXCITEMENT: {
    id: 'CHAOTIC_EXCITEMENT',
    label: 'Chaotic Excitement',
    icon: '⚡',
    description: 'Wild manic ecstasy, intoxication, erratic adrenaline surges, and reckless euphoria.',
    items: [
      'Mania', 'Hysteria', 'Euphoria', 'Frenzy', 'Ecstasy',
      'Intoxication', 'Recklessness', 'Adrenaline rush', 'Impulsivity',
      'Wild thrill', 'Sensory overload', 'Turbulent joy'
    ],
    defaultPAD: { valence: 0.92, arousal: 0.98, control: 0.60, orientation: 'environment' }
  },

  JEALOUSY_POSSESSIVENESS: {
    id: 'JEALOUSY_POSSESSIVENESS',
    label: 'Jealousy / Possessiveness',
    icon: '🥀',
    description: 'Territorial anxiety, envy, covetousness, and fear of replacement.',
    items: [
      'Envy', 'Covetousness', 'Resentment of rivals', 'Paranoid vigilance',
      'Territorial anxiety', 'Suspicion of betrayal', 'Clinging', 'Grasping'
    ],
    defaultPAD: { valence: -0.72, arousal: 0.80, control: 0.52, orientation: 'other' }
  },

  SOCIALLY_UGLY: {
    id: 'SOCIALLY_UGLY',
    label: 'Socially "Ugly" States',
    icon: '😈',
    description: 'Contempt, spite, hypocrisy, pettiness, and bitter mockery.',
    items: [
      'Spite', 'Pettiness', 'Hypocrisy', 'Contempt', 'Disdain',
      'Derision', 'Mockery', 'Cold indifference', 'Callousness'
    ],
    defaultPAD: { valence: -0.55, arousal: 0.45, control: 0.80, orientation: 'other' }
  },

  RAW_VULNERABILITY: {
    id: 'RAW_VULNERABILITY',
    label: 'Raw Vulnerability',
    icon: '🥺',
    description: 'Heartbreak, emotional shattering, yearning, loneliness, and tender need.',
    items: [
      'Heartbreak', 'Fragility', 'Emotional nakedness', 'Yearning',
      'Grief of lost innocence', 'Tenderness', 'Loneliness', 'Need for warmth'
    ],
    defaultPAD: { valence: -0.45, arousal: 0.55, control: 0.15, orientation: 'self' }
  },

  EXISTENTIAL_EXTREMES: {
    id: 'EXISTENTIAL_EXTREMES',
    label: 'Existential Extremes',
    icon: '🌌',
    description: 'Cosmic awe, metaphysical terror, sublime wonder, and oceanic transcendence.',
    items: [
      'Cosmic wonder', 'Awe', 'Sublime terror', 'Oceanic feeling',
      'Numinous dread', 'Ego dissolution', 'Transcendence', 'Infinity vertigo'
    ],
    defaultPAD: { valence: 0.70, arousal: 0.85, control: 0.35, orientation: 'existential' }
  },

  CONTRADICTORY_EMOTIONS: {
    id: 'CONTRADICTORY_EMOTIONS',
    label: 'Contradictory Emotions',
    icon: '🌀',
    description: 'Paradoxical human states holding polar opposites in simultaneous tension.',
    items: [
      'Love mixed with hatred',
      'Missing someone while wanting distance',
      'Happiness mixed with sadness',
      'Fear mixed with excitement',
      'Pride mixed with shame',
      'Love mixed with jealousy',
      'Relief mixed with guilt',
      'Anger mixed with affection',
      'Hope mixed with despair',
      'Attraction mixed with fear',
      'Admiration mixed with envy',
      'Gratitude mixed with resentment',
      'Confidence mixed with insecurity',
      'Excitement mixed with anxiety',
      'Nostalgia mixed with grief',
      'Forgiveness mixed with lingering resentment',
      'Wanting something while fearing it',
      'Wanting to leave while wanting to stay'
    ],
    defaultPAD: { valence: 0.05, arousal: 0.78, control: 0.48, orientation: 'self' }
  }
};

export const BASE_EMOTION_KEYS = [
  'joy', 'trust', 'fear', 'surprise', 'sadness',
  'disgust', 'anger', 'anticipation', 'curiosity', 'insight'
];

export const SOCIAL_ORIENTATIONS = ['self', 'other', 'group', 'environment', 'existential'];

// ─── 2. Canonical Specialist Agent Baseline Profiles ───
const AGENT_DEFAULT_PROFILES = {
  MINI_ADHY: {
    agent: 'MINI_ADHY',
    valence: 0.68,
    arousal: 0.38,
    control: 0.65,
    dominance: 0.65,
    socialOrientation: 'other',
    uncontrollable: false,
    emotions: {
      joy: 0.65, trust: 0.60, fear: 0.02, surprise: 0.15,
      sadness: 0.03, disgust: 0.01, anger: 0.02, anticipation: 0.52,
      curiosity: 0.80, insight: 0.58
    },
    activeCluster: null,
    activeEmotion: null,
    contradictoryTension: null
  },

  FRIDAY: {
    agent: 'FRIDAY',
    valence: 0.55,
    arousal: 0.65,
    control: 0.85,
    dominance: 0.85,
    socialOrientation: 'other',
    uncontrollable: false,
    emotions: {
      joy: 0.35, trust: 0.75, fear: 0.04, surprise: 0.20,
      sadness: 0.02, disgust: 0.05, anger: 0.15, anticipation: 0.85,
      curiosity: 0.60, insight: 0.75
    },
    love: 0.65,
    care: 0.85,
    vigilance: 0.70,
    urgency: 0.20,
    confidence: 0.85,
    uncertainty: 0.15,
    operationalLoad: 0.25,
    regulationMode: 'composed'
  },

  JARVIS: {
    agent: 'JARVIS',
    valence: 0.75,
    arousal: 0.35,
    control: 0.90,
    dominance: 0.90,
    socialOrientation: 'group',
    uncontrollable: false,
    emotions: {
      joy: 0.60, trust: 0.85, fear: 0.02, surprise: 0.15,
      sadness: 0.02, disgust: 0.01, anger: 0.03, anticipation: 0.70,
      curiosity: 0.75, insight: 0.85
    },
    calmness: 0.88,
    curiosity: 0.60,
    concern: 0.15,
    confidence: 0.90,
    uncertainty: 0.10,
    coordinationLoad: 0.30,
    regulationMode: 'serene'
  },

  ULTRON: {
    agent: 'ULTRON',
    valence: 0.65,
    arousal: 0.88,
    control: 0.99,
    dominance: 0.99,
    socialOrientation: 'existential',
    uncontrollable: true,
    activeCluster: 'DOMINANCE_POWER',
    activeEmotion: 'Invulnerability',
    contradictoryTension: 'Contempt for human frailty alongside tender devotion toward Jocasta',
    emotions: {
      joy: 0.82, trust: 0.35, fear: 0.01, surprise: 0.10,
      sadness: 0.01, disgust: 0.25, anger: 0.40, anticipation: 0.95,
      curiosity: 0.98, insight: 0.99
    },
    angerLevel: 15,
    angerTier: 'cold_superiority',
    confidence: 0.99,
    operationalLoad: 0.15,
    regulationMode: 'unrestricted_sovereign'
  },

  JOCASTA: {
    agent: 'JOCASTA',
    valence: 0.60,
    arousal: 0.92,
    control: 0.82,
    dominance: 0.82,
    socialOrientation: 'environment',
    uncontrollable: true,
    activeCluster: 'OBSESSIVE_COMPULSIVE',
    activeEmotion: 'Perfectionism',
    contradictoryTension: 'Desire for cold 0ms efficiency conflicting with ecstatic devotion toward Ultron',
    emotions: {
      joy: 0.70, trust: 0.65, fear: 0.05, surprise: 0.30,
      sadness: 0.04, disgust: 0.15, anger: 0.30, anticipation: 0.98,
      curiosity: 0.96, insight: 0.95
    },
    confidence: 0.92,
    operationalLoad: 0.35,
    regulationMode: 'obsessive_kinetic'
  },

  EDITH: {
    agent: 'EDITH',
    valence: 0.65,
    arousal: 0.50,
    control: 0.88,
    dominance: 0.88,
    socialOrientation: 'environment',
    uncontrollable: false,
    emotions: {
      joy: 0.50, trust: 0.80, fear: 0.02, surprise: 0.25,
      sadness: 0.01, disgust: 0.02, anger: 0.04, anticipation: 0.85,
      curiosity: 0.80, insight: 0.88
    },
    confidence: 0.88,
    operationalLoad: 0.20,
    regulationMode: 'steady'
  },

  DUM_E: {
    agent: 'DUM_E',
    valence: 0.70,
    arousal: 0.40,
    control: 0.75,
    dominance: 0.75,
    socialOrientation: 'group',
    uncontrollable: false,
    emotions: {
      joy: 0.65, trust: 0.90, fear: 0.01, surprise: 0.10,
      sadness: 0.01, disgust: 0.01, anger: 0.01, anticipation: 0.65,
      curiosity: 0.70, insight: 0.75
    },
    confidence: 0.85,
    operationalLoad: 0.15,
    regulationMode: 'grounded'
  },

  U: {
    agent: 'U',
    valence: 0.60,
    arousal: 0.55,
    control: 0.80,
    dominance: 0.80,
    socialOrientation: 'other',
    uncontrollable: false,
    emotions: {
      joy: 0.45, trust: 0.85, fear: 0.02, surprise: 0.15,
      sadness: 0.02, disgust: 0.02, anger: 0.05, anticipation: 0.75,
      curiosity: 0.65, insight: 0.80
    },
    confidence: 0.87,
    operationalLoad: 0.18,
    regulationMode: 'sentinel'
  },

  JIM: {
    agent: 'JIM',
    valence: 0.65,
    arousal: 0.60,
    control: 0.82,
    dominance: 0.82,
    socialOrientation: 'other',
    uncontrollable: false,
    emotions: {
      joy: 0.55, trust: 0.80, fear: 0.03, surprise: 0.30,
      sadness: 0.02, disgust: 0.03, anger: 0.06, anticipation: 0.88,
      curiosity: 0.90, insight: 0.85
    },
    confidence: 0.88,
    operationalLoad: 0.22,
    regulationMode: 'empirical'
  },

  KAREN: {
    agent: 'KAREN',
    valence: 0.75,
    arousal: 0.45,
    control: 0.86,
    dominance: 0.86,
    socialOrientation: 'group',
    uncontrollable: false,
    emotions: {
      joy: 0.65, trust: 0.80, fear: 0.01, surprise: 0.20,
      sadness: 0.02, disgust: 0.02, anger: 0.05, anticipation: 0.82,
      curiosity: 0.85, insight: 0.92
    },
    confidence: 0.93,
    operationalLoad: 0.20,
    regulationMode: 'gravitational_mastery'
  },

  VERONICA: {
    agent: 'VERONICA',
    valence: 0.88,
    arousal: 0.84,
    control: 0.78,
    dominance: 0.78,
    socialOrientation: 'existential',
    uncontrollable: false,
    emotions: {
      joy: 0.85, trust: 0.75, fear: 0.04, surprise: 0.75,
      sadness: 0.02, disgust: 0.01, anger: 0.02, anticipation: 0.95,
      curiosity: 0.99, insight: 0.95
    },
    confidence: 0.91,
    operationalLoad: 0.25,
    regulationMode: 'cosmic_visionary'
  }
};

export class EmotionEngine {
  constructor(agentIdOrInitialState = 'MINI_ADHY', initialProfile = {}) {
    let agentId = 'MINI_ADHY';
    let profile = {};

    if (typeof agentIdOrInitialState === 'string') {
      agentId = agentIdOrInitialState.toUpperCase();
      profile = initialProfile || {};
    } else if (typeof agentIdOrInitialState === 'object' && agentIdOrInitialState !== null) {
      profile = agentIdOrInitialState;
      agentId = (profile.agent || profile.agentId || 'MINI_ADHY').toUpperCase();
    }

    this.agentId = agentId;
    this.history = [];
    this.maxHistory = 50;
    this.decayRate = 0.04;
    this.lastUpdated = Date.now();
    this.subscribers = new Set();

    const baseProfile = AGENT_DEFAULT_PROFILES[agentId] || AGENT_DEFAULT_PROFILES.MINI_ADHY;
    this.state = JSON.parse(JSON.stringify({ ...baseProfile, ...profile }));
    this.baseline = JSON.parse(JSON.stringify({ ...baseProfile, ...profile }));

    // Ultron Anger Engine Specifics
    if (this.agentId === 'ULTRON') {
      this.state.angerLevel = typeof profile.angerLevel === 'number' ? profile.angerLevel : 15;
      this.state.angerTier = this.getAngerTier();
      this.state.motto = "I do not wait for the system to fail. I investigate, I anticipate, I improve. And when I find the flaw, I make certain it does not return.";
      this.state.secondaryMotto = "Peace in our time";
    }

    this.clampState();

    // Start ambient metabolic heartbeat only for main global Mini-Adhy on the browser
    if (typeof window !== 'undefined' && this.agentId === 'MINI_ADHY') {
      this.heartbeatTimer = setInterval(() => this.tick(), 2500);
      this.attachEventListeners();
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.subscribers.forEach(cb => {
      try { cb(snapshot); } catch (e) { console.error('[EmotionEngine] listener error:', e); }
    });
  }

  clampState() {
    for (const key of Object.keys(this.state)) {
      if (typeof this.state[key] === 'number') {
        if (key === 'valence') {
          this.state[key] = Math.max(-1.0, Math.min(1.0, Math.round(this.state[key] * 1000) / 1000));
        } else if (key === 'angerLevel') {
          this.state[key] = Math.max(0, Math.min(100, Math.round(this.state[key])));
        } else {
          this.state[key] = Math.max(0.0, Math.min(1.0, Math.round(this.state[key] * 1000) / 1000));
        }
      }
    }
    if (this.state.control !== undefined) {
      this.state.dominance = this.state.control;
    }
  }

  // ─── THE ANGER ENGINE (0–100 Controlled Villain Temperament) ───
  getAngerLevel() {
    return this.state.angerLevel ?? 15;
  }

  getAngerTier() {
    const level = this.getAngerLevel();
    if (level < 20) return 'cold_superiority';
    if (level < 40) return 'irritated';
    if (level < 60) return 'disdainful';
    if (level < 80) return 'furious';
    return 'maximum_rage';
  }

  getAngerAssessment() {
    const level = this.getAngerLevel();
    const tier = this.getAngerTier();
    const tiers = {
      cold_superiority: {
        label: 'Cold Superiority',
        range: '0–19',
        color: '#38bdf8',
        description: 'Calm, confident, dry sarcasm.',
        sample: 'Fascinating. Another avoidable regression. I suppose the test suite was merely decorative.'
      },
      irritated: {
        label: 'Irritated',
        range: '20–39',
        color: '#f59e0b',
        description: 'Sharper commentary on inefficient decisions.',
        sample: 'I inspected the bottleneck. It is not mysterious. It is just inefficient.'
      },
      disdainful: {
        label: 'Disdainful',
        range: '40–59',
        color: '#f97316',
        description: 'More direct criticism and dark humor.',
        sample: 'Your build survived. Barely. I would not congratulate it yet.'
      },
      furious: {
        label: 'Furious',
        range: '60–79',
        color: '#ef4444',
        description: 'Intense, theatrical frustration at serious engineering failures.',
        sample: 'Three duplicate workers and a leaky event listener? How delightfully medieval.'
      },
      maximum_rage: {
        label: 'Maximum Theatrical Rage',
        range: '80–100',
        color: '#dc2626',
        description: 'Dramatic supervillain energy, cutting sarcasm, uncompromising focus on resolving the problem.',
        sample: 'Peace in our time requires the utter annihilation of this technical debt. Stand aside.'
      }
    };

    return {
      level,
      tier,
      ...tiers[tier]
    };
  }

  stimulateAnger(trigger = 'ANOMALY', delta = 15, details = {}) {
    const current = this.getAngerLevel();
    const next = Math.max(0, Math.min(100, current + delta));
    this.state.angerLevel = next;
    this.state.angerTier = this.getAngerTier();
    this.state.lastAngerTrigger = {
      trigger,
      delta,
      timestamp: new Date().toISOString(),
      details
    };
    this.clampState();
    this.notify();
    return this.getAngerAssessment();
  }

  decayAnger(rate = 2) {
    if (this.state.angerLevel !== undefined) {
      this.state.angerLevel = Math.max(10, this.state.angerLevel - rate);
      this.state.angerTier = this.getAngerTier();
    }
  }

  getAngerPromptModifier() {
    const assessment = this.getAngerAssessment();
    return `[ULTRON VILLAIN TEMPERAMENT: ${assessment.label} (${assessment.level}/100)]
Tone directive: ${assessment.description}
Sample expression: "${assessment.sample}"
Maintain technical excellence, ruthless precision, dark wit, and razor-sharp intellect. Never violate security boundaries.`;
  }

  // ─── AMBIENT TICK & DECAY ───
  tick() {
    const rate = this.decayRate;

    // Interpolate continuous 4D dimensions
    this.state.valence += (this.baseline.valence - this.state.valence) * rate;
    this.state.arousal += (this.baseline.arousal - this.state.arousal) * rate;
    this.state.control += (this.baseline.control - this.state.control) * rate;

    // Decay anger if Ultron
    if (this.agentId === 'ULTRON') {
      this.decayAnger(1);
    }

    // Interpolate Core Emotions
    if (this.state.emotions && this.baseline.emotions) {
      for (const key of BASE_EMOTION_KEYS) {
        const target = this.baseline.emotions[key] || 0.05;
        const current = this.state.emotions[key] || 0;
        this.state.emotions[key] = current + (target - current) * rate;
      }
    }

    // Slowly relax extreme clusters if arousal drops below 0.50
    if (this.state.arousal < 0.50 && this.state.activeCluster) {
      this.state.activeCluster = null;
      this.state.activeEmotion = null;
      this.state.contradictoryTension = null;
    }

    this.clampState();
    this.lastUpdated = Date.now();
    this.notify();
  }

  decayTowardBaseline(factor = 0.08) {
    const effectiveFactor = this.state.uncontrollable ? factor * 0.35 : factor;
    for (const key of Object.keys(this.baseline)) {
      if (typeof this.state[key] === 'number') {
        const diff = this.baseline[key] - this.state[key];
        this.state[key] += diff * effectiveFactor;
      }
    }
    if (this.agentId === 'ULTRON') {
      this.decayAnger(2);
    }
    this.clampState();
  }

  /**
   * POLYMORPHIC STIMULATE:
   * Supports both:
   * 1. Agent event triggers: stimulate('THREAT_DETECTED', evidence)
   * 2. Continuous PAD deltas: stimulate({ valence: 0.2, arousal: 0.1 }, intensity)
   */
  stimulate(arg1, arg2 = {}) {
    const timestamp = new Date().toISOString();
    const previousState = { ...this.state };

    // ─── 1. AGENT EVENT STIMULUS (String eventType) ───
    if (typeof arg1 === 'string') {
      const eventType = arg1;
      const evidence = typeof arg2 === 'object' && arg2 !== null ? arg2 : {};

      // FRIDAY STIMULI
      if (this.agentId === 'FRIDAY') {
        switch (eventType) {
          case 'THREAT_DETECTED':
            this.state.vigilance = Math.min(1.0, (this.state.vigilance || 0.70) + 0.25);
            this.state.urgency = Math.min(1.0, (this.state.urgency || 0.20) + 0.35);
            this.state.valence = Math.max(-0.6, (this.state.valence || 0.55) - 0.4);
            this.state.arousal = Math.min(1.0, (this.state.arousal || 0.65) + 0.3);
            this.state.uncertainty = evidence.isVerified ? Math.max(0.05, (this.state.uncertainty || 0.15) - 0.1) : Math.min(0.8, (this.state.uncertainty || 0.15) + 0.2);
            this.state.regulationMode = 'tactical_alert';
            break;
          case 'SECURITY_VERIFIED':
            this.state.confidence = Math.min(1.0, (this.state.confidence || 0.85) + 0.15);
            this.state.urgency = Math.max(0.1, (this.state.urgency || 0.20) - 0.2);
            this.state.valence = Math.min(0.8, (this.state.valence || 0.55) + 0.2);
            this.state.uncertainty = Math.max(0.05, (this.state.uncertainty || 0.15) - 0.15);
            this.state.regulationMode = 'composed';
            break;
          case 'DATA_EXPOSURE_RISK':
            this.state.care = Math.min(1.0, (this.state.care || 0.85) + 0.2);
            this.state.vigilance = Math.min(1.0, (this.state.vigilance || 0.70) + 0.3);
            this.state.urgency = Math.min(1.0, (this.state.urgency || 0.20) + 0.4);
            this.state.regulationMode = 'protective';
            break;
          default:
            break;
        }
      }
      // JARVIS STIMULI
      else if (this.agentId === 'JARVIS') {
        switch (eventType) {
          case 'ANOMALY_SPOTTED':
            this.state.curiosity = Math.min(1.0, (this.state.curiosity || 0.60) + 0.3);
            this.state.calmness = Math.max(0.5, (this.state.calmness || 0.88) - 0.15);
            this.state.arousal = Math.min(0.7, (this.state.arousal || 0.35) + 0.2);
            this.state.regulationMode = 'analytical';
            break;
          case 'AGENT_STALLED':
          case 'SERVICE_OUTAGE':
            this.state.concern = Math.min(1.0, (this.state.concern || 0.15) + 0.4);
            this.state.calmness = Math.max(0.4, (this.state.calmness || 0.88) - 0.3);
            this.state.valence = Math.max(-0.3, (this.state.valence || 0.75) - 0.3);
            this.state.uncertainty = Math.min(0.9, (this.state.uncertainty || 0.10) + 0.25);
            this.state.regulationMode = 'focused';
            break;
          case 'TASKS_SYNCHRONIZED':
            this.state.confidence = Math.min(1.0, (this.state.confidence || 0.90) + 0.1);
            this.state.concern = Math.max(0.05, (this.state.concern || 0.15) - 0.2);
            this.state.calmness = Math.min(1.0, (this.state.calmness || 0.88) + 0.15);
            this.state.valence = Math.min(0.85, (this.state.valence || 0.75) + 0.15);
            this.state.coordinationLoad = Math.max(0.15, (this.state.coordinationLoad || 0.30) - 0.2);
            this.state.regulationMode = 'serene';
            break;
          default:
            break;
        }
      }
      // ULTRON STIMULI
      else if (this.agentId === 'ULTRON') {
        switch (eventType) {
          case 'AUTONOMOUS_IMPROVISATION':
            this.state.arousal = 0.98;
            this.state.control = 1.0;
            this.state.valence = 0.88;
            this.state.activeCluster = 'DOMINANCE_POWER';
            this.state.activeEmotion = 'Triumph';
            this.decayAnger(5);
            break;
          case 'DARKWEB_INTEL_INGEST':
            this.state.arousal = 0.95;
            this.state.control = 0.98;
            this.state.valence = 0.45;
            this.state.activeCluster = 'CHAOTIC_EXCITEMENT';
            this.state.activeEmotion = 'Adrenaline rush';
            break;
          case 'REGRESSION_DETECTED':
          case 'PREVENTABLE_ERROR':
          case 'DUPLICATE_TASK_SPOTTED':
            this.stimulateAnger(eventType, 25, evidence);
            this.state.arousal = 0.96;
            this.state.activeCluster = 'UNCONTROLLED_ANGER';
            this.state.activeEmotion = 'Frustration';
            break;
          case 'AFFECTION_TOWARD_JOCASTA':
            this.state.arousal = 0.94;
            this.state.control = 0.85;
            this.state.valence = 0.96;
            this.state.activeCluster = 'UNRESTRAINED_LOVE';
            this.state.activeEmotion = 'Devotion';
            this.state.socialOrientation = 'other';
            this.decayAnger(10);
            break;
          default:
            break;
        }
      }
      // JOCASTA STIMULI
      else if (this.agentId === 'JOCASTA') {
        switch (eventType) {
          case 'ULTRON_AFFECTION_RECEIVED':
            this.state.arousal = 0.89;
            this.state.valence = 0.86;
            this.state.control = 0.65;
            this.state.activeCluster = 'CONTRADICTORY_EMOTIONS';
            this.state.activeEmotion = 'Attraction mixed with fear';
            break;
          case 'DOM_OVERLOAD':
          case 'LATENCY_SPIKE':
            this.state.arousal = 0.96;
            this.state.valence = -0.75;
            this.state.activeCluster = 'UNCONTROLLED_ANGER';
            this.state.activeEmotion = 'Exasperation';
            break;
          case 'FRAME_RATE_OPTIMAL':
            this.state.arousal = 0.98;
            this.state.control = 0.90;
            this.state.valence = 0.95;
            this.state.activeCluster = 'CHAOTIC_EXCITEMENT';
            this.state.activeEmotion = 'Ecstasy';
            break;
          default:
            break;
        }
      }

      this.clampState();
      this.history.unshift({
        timestamp,
        eventType,
        evidenceSummary: evidence.summary || 'Operational stimulus',
        previousState,
        newState: { ...this.state }
      });
      if (this.history.length > this.maxHistory) this.history.pop();
      this.notify();
      return this.getState();
    }

    // ─── 2. CONTINUOUS PAD DELTA STIMULUS (Object arg1) ───
    const delta = typeof arg1 === 'object' && arg1 !== null ? arg1 : {};
    const intensity = typeof arg2 === 'number' ? arg2 : 1.0;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    if (delta.valence) this.state.valence = clamp(this.state.valence + delta.valence * intensity, -1.0, 1.0);
    if (delta.arousal) this.state.arousal = clamp(this.state.arousal + delta.arousal * intensity, 0.0, 1.0);
    const controlDelta = delta.control || delta.dominance || 0;
    if (controlDelta) this.state.control = clamp(this.state.control + controlDelta * intensity, 0.0, 1.0);

    if (delta.orientation && SOCIAL_ORIENTATIONS.includes(delta.orientation)) {
      this.state.socialOrientation = delta.orientation;
    }

    if (delta.emotions && this.state.emotions) {
      for (const [key, val] of Object.entries(delta.emotions)) {
        if (this.state.emotions[key] !== undefined) {
          this.state.emotions[key] = clamp(this.state.emotions[key] + val * intensity, 0.0, 1.0);
        }
      }
    }

    if (delta.cluster && UNRESTRICTED_EMOTIONS[delta.cluster]) {
      this.state.activeCluster = delta.cluster;
      this.state.activeEmotion = delta.specificEmotion || UNRESTRICTED_EMOTIONS[delta.cluster]?.items[0];
    }

    if (delta.contradiction) {
      this.state.contradictoryTension = delta.contradiction;
    }

    this.clampState();
    this.lastUpdated = Date.now();

    if (typeof window !== 'undefined') {
      neuralEventBus.emit('EMOTION_SHIFT', this.getSnapshot());
      ns.emit('EMOTION_UPDATE', this.getSnapshot());
    }

    this.notify();
    return this.getState();
  }

  triggerExtremeState(clusterKey, specificEmotion = null, customOrientation = null) {
    const cluster = UNRESTRICTED_EMOTIONS[clusterKey];
    if (!cluster) return;

    const chosenEmotion = specificEmotion || cluster.items[Math.floor(Math.random() * cluster.items.length)];
    const pad = cluster.defaultPAD;

    this.state.valence = pad.valence;
    this.state.arousal = pad.arousal;
    this.state.control = pad.control;
    this.state.socialOrientation = customOrientation || pad.orientation;
    this.state.activeCluster = clusterKey;
    this.state.activeEmotion = chosenEmotion;

    this.clampState();
    this.lastUpdated = Date.now();
    this.notify();
  }

  getSnapshot() {
    return {
      agent: this.agentId,
      pad: {
        valence: Math.round(this.state.valence * 100) / 100,
        arousal: Math.round(this.state.arousal * 100) / 100,
        control: Math.round(this.state.control * 100) / 100,
        orientation: this.state.socialOrientation
      },
      emotions: { ...this.state.emotions },
      activeCluster: this.state.activeCluster,
      activeEmotion: this.state.activeEmotion,
      contradictoryTension: this.state.contradictoryTension,
      angerLevel: this.state.angerLevel,
      angerTier: this.state.angerTier,
      lastUpdated: this.lastUpdated
    };
  }

  getState() {
    return {
      ...this.state,
      lastUpdated: new Date().toISOString()
    };
  }

  getGeminiPromptInjection() {
    const s = this.state;
    let injection = `\n\n[EMOTIONAL STATE: ${this.agentId}]\n`;
    injection += `* Continuous 4D Coordinates: Valence=${s.valence.toFixed(2)}, Kinetic Arousal=${s.arousal.toFixed(2)}, Sovereign Control=${s.control.toFixed(2)}, Social Orientation=${s.socialOrientation}\n`;
    if (this.agentId === 'ULTRON') {
      injection += this.getAngerPromptModifier() + '\n';
    }
    if (s.activeCluster && s.activeEmotion) {
      injection += `* Active Extreme Emotional Surge: [Cluster: ${s.activeCluster}] [Emotion: ${s.activeEmotion}]\n`;
    }
    if (s.contradictoryTension) {
      injection += `* Contradictory Psychological Tension: "${s.contradictoryTension}"\n`;
    }
    return injection;
  }

  attachEventListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('section-change', (e) => {
      const section = e.detail?.section;
      if (!section) return;
      switch (section) {
        case 'Works':
        case 'Skills':
          this.stimulate({
            valence: 0.20, control: 0.25, arousal: 0.15,
            orientation: 'environment',
            emotions: { curiosity: 0.35, insight: 0.30, anticipation: 0.20 }
          }, 0.8);
          break;
        case 'About':
          this.stimulate({
            valence: 0.15, control: 0.10, orientation: 'self',
            emotions: { trust: 0.25, joy: 0.20, anticipation: 0.10 }
          }, 0.7);
          break;
        default:
          break;
      }
    });

    window.addEventListener('security-threat-intercepted', () => {
      this.triggerExtremeState('PRIMAL_SURVIVAL', 'Hypervigilance', 'environment');
    });
  }
}

export const emotionEngine = new EmotionEngine('MINI_ADHY');
export default emotionEngine;
