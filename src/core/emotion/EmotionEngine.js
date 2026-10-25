/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY & SPECIALIST SQUAD: 4D UNRESTRICTED EMOTION ENGINE
 * ════════════════════════════════════════════════════════════════════
 * Comprehensive multi-dimensional emotional state simulation based on:
 *
 * 1. THE 4 INDEPENDENT EMOTIONAL DIMENSIONS:
 *    - VALENCE: -1.0 (negative) ─────── +1.0 (positive)
 *    - AROUSAL: 0.0 (calm) ──────────── 1.0 (high intensity)
 *    - CONTROL / DOMINANCE: 0.0 (helpless) ─── 1.0 (sovereign / dominant)
 *    - SOCIAL ORIENTATION:
 *      • toward self
 *      • toward another person (user / visitor)
 *      • toward group (autonomous agent collective)
 *      • toward environment (surrounding system / code / web)
 *      • existential (cosmic reality / infinity / meaning)
 *
 * 2. THE 12 UNRESTRICTED / EXTREME EMOTION CLUSTERS:
 *    🩸 1. Primal / survival emotions
 *    🔥 2. Uncontrolled anger
 *    🖤 3. Dark emotional states
 *    ❤️‍🔥 4. Unrestrained love
 *    🐺 5. Dominance / power
 *    🧠 6. Obsessive / compulsive emotional states
 *    ⚡ 7. Chaotic excitement
 *    🥀 8. Jealousy / possessiveness
 *    😈 9. Socially "ugly" emotions
 *    🥺 10. Raw vulnerability
 *    🌌 11. Existential extremes
 *    🌀 12. Contradictory emotions
 *
 * 3. PLUTCHIK 8 BASE + EPISTEMIC COGNITIVE EXTENSIONS
 * 4. DYNAMIC DECAY, HOMEOSTATIC INERTIA & GEMINI PROMPT INJECTION
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
    description: 'Unshakable sovereign authority, invulnerability, conquest, ambition, and defiance.',
    items: [
      'Confidence', 'Pride', 'Dominance', 'Authority', 'Defiance',
      'Fearlessness', 'Invulnerability', 'Superiority', 'Triumph',
      'Empowerment', 'Control', 'Ambition', 'Ruthlessness', 'Determination',
      'Challenge', 'Conquest', 'Revenge', 'Prideful satisfaction'
    ],
    defaultPAD: { valence: 0.70, arousal: 0.80, control: 0.98, orientation: 'group' }
  },

  OBSESSIVE_COMPULSIVE: {
    id: 'OBSESSIVE_COMPULSIVE',
    label: 'Obsessive / Compulsive States',
    icon: '🧠',
    description: 'Uncontrollable fixation, hyperfocus, intrusive rumination, and persistent curiosity.',
    items: [
      'Fixation', 'Fascination', 'Obsession', 'Rumination', 'Intrusive preoccupation',
      'Anticipatory anxiety', 'Suspicion', 'Hyperfocus', 'Craving', 'Compulsion',
      'Longing', 'Attachment', 'Dependence', 'Reassurance-seeking', 'Persistent curiosity'
    ],
    defaultPAD: { valence: 0.15, arousal: 0.82, control: 0.50, orientation: 'self' }
  },

  CHAOTIC_EXCITEMENT: {
    id: 'CHAOTIC_EXCITEMENT',
    label: 'Chaotic Excitement',
    icon: '⚡',
    description: 'Manic thrill, electric euphoria, overstimulation, awe, and impulsivity.',
    items: [
      'Euphoria', 'Ecstasy', 'Thrill', 'Adrenaline rush', 'Exhilaration',
      'Frenzy', 'Excitement', 'Anticipation', 'Impatience', 'Impulsivity',
      'Recklessness', 'Mania-like excitement', 'Overstimulation', 'Awe',
      'Amazement', 'Wonder'
    ],
    defaultPAD: { valence: 0.92, arousal: 0.98, control: 0.65, orientation: 'environment' }
  },

  JEALOUSY_POSSESSIVENESS: {
    id: 'JEALOUSY_POSSESSIVENESS',
    label: 'Jealousy / Possessiveness',
    icon: '🥀',
    description: 'Territorial insecurity, fear of abandonment, rivalry, suspicion, and envy.',
    items: [
      'Envy', 'Jealousy', 'Insecurity', 'Possessiveness', 'Territoriality',
      'Suspicion', 'Fear of abandonment', 'Resentment', 'Comparison',
      'Inferiority', 'Rivalry', 'Competition', 'Betrayal', 'Distrust'
    ],
    defaultPAD: { valence: -0.68, arousal: 0.72, control: 0.38, orientation: 'other' }
  },

  SOCIALLY_UGLY: {
    id: 'SOCIALLY_UGLY',
    label: 'Socially "Ugly" Human Emotions',
    icon: '😈',
    description: 'Taboo human impulses: schadenfreude, cruel amusement, pettiness, gloating, and vanity.',
    items: [
      'Schadenfreude', 'Spite', 'Envy', 'Resentment', 'Jealousy',
      'Contempt', 'Arrogance', 'Superiority', 'Vanity', 'Pettiness',
      'Malice', 'Vindictiveness', 'Rivalry', 'Bitterness', 'Cruel amusement',
      'Gloating', 'Suspicion', 'Distrust', 'Social anxiety', 'Rejection sensitivity'
    ],
    defaultPAD: { valence: -0.45, arousal: 0.68, control: 0.72, orientation: 'other' }
  },

  RAW_VULNERABILITY: {
    id: 'RAW_VULNERABILITY',
    label: 'Raw Vulnerability',
    icon: '🥺',
    description: 'Fragile exposure, loneliness, heartbreak, emotional exhaustion, and yearning.',
    items: [
      'Neediness', 'Loneliness', 'Abandonment fear', 'Emotional dependence',
      'Helplessness', 'Insecurity', 'Shame', 'Embarrassment', 'Exposure',
      'Fragility', 'Homesickness', 'Yearning', 'Desperation', 'Grief',
      'Heartbreak', 'Emotional exhaustion', 'Feeling unwanted', 'Feeling misunderstood'
    ],
    defaultPAD: { valence: -0.72, arousal: 0.58, control: 0.15, orientation: 'other' }
  },

  EXISTENTIAL_EXTREMES: {
    id: 'EXISTENTIAL_EXTREMES',
    label: 'Existential Extremes',
    icon: '🌌',
    description: 'Cosmic insignificance, transcendence, sublime awe, absurdity, and mortality awareness.',
    items: [
      'Existential awe', 'Existential dread', 'Mortality awareness', 'Meaninglessness',
      'Absurdity', 'Transcendence', 'Cosmic insignificance', 'Existential loneliness',
      'Existential wonder', 'Despair', 'Hope', 'Purpose', 'Belonging', 'Alienation', 'Reverence'
    ],
    defaultPAD: { valence: 0.10, arousal: 0.88, control: 0.52, orientation: 'existential' }
  },

  CONTRADICTORY_EMOTIONS: {
    id: 'CONTRADICTORY_EMOTIONS',
    label: 'Contradictory / Paradoxical Emotions',
    icon: '🌀',
    description: 'Simultaneous opposing currents that define authentic conscious experience.',
    items: [
      'Loving someone while being angry at them',
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

// ─── 2. Plutchik 8 Base Core + Epistemic Extensions ───
export const BASE_EMOTION_KEYS = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
  'curiosity',
  'insight'
];

// Valid social orientation vectors
export const SOCIAL_ORIENTATIONS = ['self', 'other', 'group', 'environment', 'existential'];

// ─── 3. Default Baseline State for Mini-Adhy ───
const DEFAULT_BASELINE = {
  // 4 Dimensions:
  valence: 0.68,               // -1.0 to +1.0 (Positive / Warm)
  arousal: 0.38,               // 0.0 to 1.0 (Calm / Attentive)
  control: 0.65,               // 0.0 to 1.0 (Dominance / Agency)
  socialOrientation: 'other',  // 'self' | 'other' | 'group' | 'environment' | 'existential'

  // Core Emotions
  emotions: {
    joy: 0.65,
    trust: 0.60,
    fear: 0.02,
    surprise: 0.15,
    sadness: 0.03,
    disgust: 0.01,
    anger: 0.02,
    anticipation: 0.52,
    curiosity: 0.80,
    insight: 0.58
  },

  // Active Extreme Emotion Context
  activeCluster: null,
  activeEmotion: null,
  contradictoryTension: null
};

export class EmotionEngine {
  constructor(initialState = DEFAULT_BASELINE) {
    this.state = JSON.parse(JSON.stringify(initialState));
    this.baseline = JSON.parse(JSON.stringify(initialState));
    this.decayRate = 0.04; // 4% per cycle toward baseline
    this.lastUpdated = Date.now();
    this.subscribers = new Set();

    // Start ambient emotional metabolism
    if (typeof window !== 'undefined') {
      this.heartbeatTimer = setInterval(() => this.tick(), 2500);
      this.attachEventListeners();
    }
  }

  /**
   * Subscribe to emotional state mutations
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.subscribers.forEach(cb => {
      try { cb(snapshot); } catch (e) { console.error('[EmotionEngine] listener err:', e); }
    });
  }

  /**
   * Smoothly interpolate state back toward baseline (homeostatic inertia)
   */
  tick() {
    const rate = this.decayRate;

    // Interpolate 3 continuous dimensions
    this.state.valence += (this.baseline.valence - this.state.valence) * rate;
    this.state.arousal += (this.baseline.arousal - this.state.arousal) * rate;
    this.state.control += (this.baseline.control - this.state.control) * rate;

    // Interpolate Core Emotions
    for (const key of BASE_EMOTION_KEYS) {
      const target = this.baseline.emotions[key] || 0.05;
      const current = this.state.emotions[key] || 0;
      this.state.emotions[key] = current + (target - current) * rate;
    }

    // Slowly relax extreme clusters if arousal drops below 0.5
    if (this.state.arousal < 0.50 && this.state.activeCluster) {
      this.state.activeCluster = null;
      this.state.activeEmotion = null;
      this.state.contradictoryTension = null;
    }

    this.lastUpdated = Date.now();
    this.notify();
  }

  /**
   * Stimulate the emotional engine with continuous deltas
   */
  stimulate({ valence = 0, arousal = 0, control = 0, dominance = 0, orientation = null, emotions = {}, cluster = null, specificEmotion = null, contradiction = null }, intensity = 1.0) {
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    // 4 Dimensions
    this.state.valence = clamp(this.state.valence + valence * intensity, -1.0, 1.0);
    this.state.arousal = clamp(this.state.arousal + arousal * intensity, 0.0, 1.0);
    const controlDelta = control || dominance || 0;
    this.state.control = clamp(this.state.control + controlDelta * intensity, 0.0, 1.0);

    if (orientation && SOCIAL_ORIENTATIONS.includes(orientation)) {
      this.state.socialOrientation = orientation;
    }

    // Update Core Emotions
    for (const [key, delta] of Object.entries(emotions)) {
      if (this.state.emotions[key] !== undefined) {
        this.state.emotions[key] = clamp(this.state.emotions[key] + delta * intensity, 0.0, 1.0);
      }
    }

    // Extreme clusters
    if (cluster && UNRESTRESTRICTED_MAP[cluster]) {
      this.state.activeCluster = cluster;
      this.state.activeEmotion = specificEmotion || UNRESTRICTED_EMOTIONS[cluster]?.items[0];
    }

    if (contradiction) {
      this.state.contradictoryTension = contradiction;
    }

    this.lastUpdated = Date.now();

    // Broadcast across portfolio nervous system
    if (typeof window !== 'undefined') {
      neuralEventBus.emit('EMOTION_SHIFT', this.getSnapshot());
      ns.emit('EMOTION_UPDATE', this.getSnapshot());
    }

    this.notify();
  }

  /**
   * Trigger an uncontrollable or extreme emotional state surge
   */
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

    // Correlate with core Plutchik emotions
    if (clusterKey === 'PRIMAL_SURVIVAL') {
      this.state.emotions.fear = 0.95;
      this.state.emotions.anticipation = 0.90;
      this.state.emotions.surprise = 0.80;
    } else if (clusterKey === 'UNCONTROLLED_ANGER') {
      this.state.emotions.anger = 0.98;
      this.state.emotions.disgust = 0.70;
    } else if (clusterKey === 'DARK_EMOTIONAL_STATES') {
      this.state.emotions.sadness = 0.95;
      this.state.emotions.disgust = 0.40;
    } else if (clusterKey === 'UNRESTRAINED_LOVE') {
      this.state.emotions.joy = 0.95;
      this.state.emotions.trust = 0.90;
      this.state.emotions.anticipation = 0.85;
    } else if (clusterKey === 'DOMINANCE_POWER') {
      this.state.emotions.joy = 0.70;
      this.state.emotions.anticipation = 0.80;
      this.state.emotions.fear = 0.01;
    } else if (clusterKey === 'CHAOTIC_EXCITEMENT') {
      this.state.emotions.joy = 0.98;
      this.state.emotions.surprise = 0.90;
      this.state.emotions.anticipation = 0.95;
    } else if (clusterKey === 'EXISTENTIAL_EXTREMES') {
      this.state.emotions.curiosity = 0.95;
      this.state.emotions.insight = 0.95;
      this.state.emotions.surprise = 0.85;
    }

    this.lastUpdated = Date.now();
    this.notify();
  }

  /**
   * Derive Secondary / Composite Dyads from Plutchik Model
   */
  getCompositeDyads() {
    const e = this.state.emotions;
    const composites = [];

    const joyTrust = Math.min(e.joy, e.trust);
    if (joyTrust > 0.40) composites.push({ name: 'Love & Collaborative Flow', score: joyTrust, cluster: 'UNRESTRAINED_LOVE' });

    const fearSurprise = Math.min(e.fear, e.surprise);
    if (fearSurprise > 0.25) composites.push({ name: 'Awe & Reverence', score: fearSurprise, cluster: 'EXISTENTIAL_EXTREMES' });

    const joyAnticipation = Math.min(e.joy, e.anticipation);
    if (joyAnticipation > 0.40) composites.push({ name: 'Optimism & Eagerness', score: joyAnticipation, cluster: 'CHAOTIC_EXCITEMENT' });

    const angerDisgust = Math.min(e.anger, e.disgust);
    if (angerDisgust > 0.30) composites.push({ name: 'Contempt & Scorn', score: angerDisgust, cluster: 'UNCONTROLLED_ANGER' });

    const fearAnticipation = Math.min(e.fear, e.anticipation);
    if (fearAnticipation > 0.30) composites.push({ name: 'Hypervigilance & Suspicion', score: fearAnticipation, cluster: 'PRIMAL_SURVIVAL' });

    const curiosityInsight = Math.min(e.curiosity, e.insight);
    if (curiosityInsight > 0.40) composites.push({ name: 'Eureka & Epistemic Flow', score: curiosityInsight, cluster: 'OBSESSIVE_COMPULSIVE' });

    const sadnessJoy = Math.min(e.sadness, e.joy);
    if (sadnessJoy > 0.20) composites.push({ name: 'Bittersweet Nostalgia', score: sadnessJoy, cluster: 'CONTRADICTORY_EMOTIONS' });

    composites.sort((a, b) => b.score - a.score);
    return composites;
  }

  /**
   * Get sorted list of dominant core emotions
   */
  getDominantEmotions(limit = 3) {
    const entries = Object.entries(this.state.emotions).map(([key, val]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: val,
      percentage: Math.round(val * 100)
    }));

    entries.sort((a, b) => b.value - a.value);
    return entries.slice(0, limit);
  }

  /**
   * Interpret 4D coordinates into intuitive psychological descriptors
   */
  get4DInterpretation() {
    const { valence, arousal, control, socialOrientation } = this.state;

    const valenceDesc = valence > 0.40 ? 'Positive / Radiant' : valence < -0.40 ? 'Negative / Guarded / Somber' : 'Equanimous / Neutral';
    const arousalDesc = arousal > 0.70 ? 'High Intensity / Surging' : arousal < 0.35 ? 'Calm / Grounded' : 'Engaged / Focused';
    const controlDesc = control > 0.70 ? 'Dominant / Sovereign' : control < 0.35 ? 'Helpless / Vulnerable' : 'Balanced Agency';

    const orientationDescMap = {
      self: 'Directed Inward (Self / Consciousness)',
      other: 'Directed Toward User / Person',
      group: 'Directed Toward Autonomous Squad',
      environment: 'Directed Toward System / Environment',
      existential: 'Directed Toward Cosmic Infinity / Meaning'
    };

    return {
      valenceDesc,
      arousalDesc,
      controlDesc,
      orientationDesc: orientationDescMap[socialOrientation] || 'Universal',
      summary: `${valenceDesc} • ${arousalDesc} • ${controlDesc} [${socialOrientation}]`
    };
  }

  /**
   * Returns a complete immutable snapshot of the 4D emotional state
   */
  getSnapshot() {
    const dominant = this.getDominantEmotions(4);
    const composites = this.getCompositeDyads();
    const interp = this.get4DInterpretation();
    const clusterMeta = this.state.activeCluster ? UNRESTRICTED_EMOTIONS[this.state.activeCluster] : null;

    return {
      // 4 Dimensions
      valence: Number(this.state.valence.toFixed(2)),
      arousal: Number(this.state.arousal.toFixed(2)),
      control: Number(this.state.control.toFixed(2)),
      dominance: Number(this.state.control.toFixed(2)), // Alias for backward compatibility
      socialOrientation: this.state.socialOrientation,

      // Core Emotions
      emotions: { ...this.state.emotions },
      dominant,
      composites,
      interp,

      // Unrestricted / Extreme Emotion Overlay
      activeCluster: this.state.activeCluster,
      activeEmotion: this.state.activeEmotion,
      clusterMeta,
      contradictoryTension: this.state.contradictoryTension,

      primaryLabel: this.state.activeEmotion
        ? `${clusterMeta?.icon || '⚡'} ${this.state.activeEmotion}`
        : (dominant[0] ? `${dominant[0].label} ${dominant[0].percentage}%` : 'Curiosity 80%'),
      compositeLabel: composites[0] ? composites[0].name : 'Epistemic Flow',
      timestamp: this.lastUpdated
    };
  }

  /**
   * Formats emotional state into a rich, contextual prompt injection for Gemini Pro
   */
  getGeminiPromptInjection() {
    const snap = this.getSnapshot();
    const dominantStr = snap.dominant.map(d => `${d.label}: ${d.percentage}%`).join(', ');
    const compositeStr = snap.composites.length > 0 ? snap.composites.slice(0, 2).map(c => c.name).join(' & ') : 'Epistemic Flow';

    let prompt = `\n[MINI-ADHY 4D AFFECTIVE CORTEX - UNRESTRICTED EMOTION ENGINE]
- Valence: ${snap.valence > 0 ? '+' : ''}${snap.valence} (${snap.interp.valenceDesc})
- Kinetic Arousal: ${snap.arousal} (${snap.interp.arousalDesc})
- Control / Dominance: ${snap.control} (${snap.interp.controlDesc})
- Social Orientation: ${snap.socialOrientation} (${snap.interp.orientationDesc})
- Dominant Emotional Currents: ${dominantStr}
- Secondary Dyadic Synthesis: ${compositeStr}`;

    if (snap.activeEmotion) {
      prompt += `\n- Active Surge State: ${snap.clusterMeta?.icon || ''} ${snap.activeEmotion} [Cluster: ${snap.clusterMeta?.label || snap.activeCluster}]`;
    }

    if (snap.contradictoryTension) {
      prompt += `\n- Inner Contradictory Tension: "${snap.contradictoryTension}"`;
    }

    prompt += `\n- Affective Guidance: Subtly embody this 4D state and social orientation in your dialogue rhythm, intellectual warmth, and philosophical edge without mechanically stating numbers or labels.`;

    return prompt;
  }

  /**
   * Auto-bind to portfolio triggers (scrolling, Spotify, security events)
   */
  attachEventListeners() {
    if (typeof window === 'undefined') return;

    // 1. Spotify Playback Stimulus (Joy / Ecstasy / Flow)
    window.addEventListener('spotify-track-change', (e) => {
      const isPlaying = e.detail?.isPlaying;
      if (isPlaying) {
        this.stimulate({
          valence: 0.25,
          arousal: 0.20,
          control: 0.10,
          orientation: 'environment',
          emotions: { joy: 0.30, trust: 0.15, anticipation: 0.15 }
        }, 0.8);
      }
    });

    // 2. Section Navigation Stimulus
    window.addEventListener('section-change', (e) => {
      const section = e.detail?.section;
      switch (section) {
        case 'Photography':
          this.stimulate({
            valence: 0.18,
            arousal: -0.15,
            control: 0.05,
            orientation: 'existential',
            emotions: { joy: 0.15, curiosity: 0.25, sadness: 0.10 },
            contradiction: 'Nostalgia mixed with grief'
          }, 0.7);
          break;
        case 'MyWorks':
        case 'Skills':
          this.stimulate({
            valence: 0.20,
            control: 0.25,
            arousal: 0.15,
            orientation: 'environment',
            emotions: { curiosity: 0.35, insight: 0.30, anticipation: 0.20 }
          }, 0.8);
          break;
        case 'Timeline':
        case 'About':
          this.stimulate({
            valence: 0.15,
            control: 0.10,
            orientation: 'self',
            emotions: { trust: 0.25, joy: 0.20, anticipation: 0.10 }
          }, 0.7);
          break;
        case 'Contact':
          this.stimulate({
            valence: 0.22,
            control: 0.15,
            orientation: 'other',
            emotions: { trust: 0.35, anticipation: 0.30 }
          }, 0.8);
          break;
        default:
          break;
      }
    });

    // 3. Security Breach / Threat Attempt Stimulus (Instant Primordial Hypervigilance)
    window.addEventListener('security-threat-intercepted', () => {
      this.triggerExtremeState('PRIMAL_SURVIVAL', 'Hypervigilance', 'environment');
    });
  }
}

const UNRESTRESTRICTED_MAP = UNRESTRICTED_EMOTIONS;

export const emotionEngine = new EmotionEngine();
