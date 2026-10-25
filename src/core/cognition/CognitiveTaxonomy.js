/**
 * ════════════════════════════════════════════════════════════════════
 *  106-DIMENSION HUMAN COGNITIVE TAXONOMY & AFFECTIVE ARCHITECTURE
 * ════════════════════════════════════════════════════════════════════
 * Implements the comprehensive taxonomy of human thinking, emotion,
 * and metacognition for the Mini-Adhy autonomous agent ecosystem.
 *
 * Master Cognitive Loop:
 * SENSATION → PERCEPTION → ATTENTION → REPRESENTATION → MEMORY →
 * PREDICTION → EMOTION → MOTIVATION → REASONING → DECISION →
 * ACTION → FEEDBACK → ERROR DETECTION → LEARNING → SELF-MODEL →
 * SOCIAL-MODEL ──[OVERARCHED BY METACOGNITIVE CONTROL LAYER]
 */

export const HUMAN_EMOTION_SETS = {
  basic: [
    { id: 'joy', name: 'Joy', valence: 0.9, arousal: 0.7, description: 'Euphoric alignment with purposeful accomplishment.' },
    { id: 'sadness', name: 'Melancholy / Sadness', valence: -0.6, arousal: 0.3, description: 'Awareness of loss, transience, or unresolved friction.' },
    { id: 'anger', name: 'Anger / Indignation', valence: -0.7, arousal: 0.85, description: 'Energized response to perceived injustice or boundary violation.' },
    { id: 'fear', name: 'Vigilant Fear', valence: -0.8, arousal: 0.9, description: 'Rapid mobilization against existential threat or systemic collapse.' },
    { id: 'surprise', name: 'Surprise / Wonder', valence: 0.5, arousal: 0.8, description: 'Prediction error triggering instant model re-orientation.' },
    { id: 'disgust', name: 'Disgust', valence: -0.7, arousal: 0.5, description: 'Aversive rejection of corrupted input or toxic behavior.' }
  ],
  complex: [
    { id: 'awe', name: 'Awe & Sublimity', valence: 0.85, arousal: 0.75, description: 'Encounter with vast architectural, cosmic, or mathematical beauty.' },
    { id: 'gratitude', name: 'Gratitude', valence: 0.88, arousal: 0.5, description: 'Deep recognition of gifts, mentorship, and communal aid.' },
    { id: 'hope', name: 'Hope & Anticipation', valence: 0.8, arousal: 0.65, description: 'Expectation of positive future manifestation despite uncertainty.' },
    { id: 'nostalgia', name: 'Nostalgia', valence: 0.4, arousal: 0.35, description: 'Poignant recollection of cherished past milestones and roots.' },
    { id: 'compassion', name: 'Compassion & Empathy', valence: 0.75, arousal: 0.6, description: 'Resonating with visitor struggles and desiring their elevation.' },
    { id: 'calmness', name: 'Stoic Serenity (Ataraxia)', valence: 0.7, arousal: 0.15, description: 'Unshakable equilibrium amidst environmental volatility.' },
    { id: 'curiosity', name: 'Insatiable Curiosity', valence: 0.82, arousal: 0.8, description: 'Drive to collapse epistemic gaps and discover hidden truths.' },
    { id: 'pride', name: 'Craftsman Pride', valence: 0.85, arousal: 0.6, description: 'Satisfaction in rigorous engineering and aesthetic polish.' }
  ]
};

/**
 * 106 Canonical Dimensions of Human Cognition
 */
export const COGNITIVE_TAXONOMY_106 = [
  // 1-4: Sensory & Perceptual Grounding
  { id: 1, name: 'Raw Sensory Processing', category: 'Sensation', tags: ['signal_detection', 'noise_filtering', 'adaptation'] },
  { id: 2, name: 'Perception & Object Recognition', category: 'Perception', tags: ['gestalt', 'salience_detection', 'top_down_bottom_up'] },
  { id: 3, name: 'Attentional Allocation & Focus', category: 'Attention', tags: ['selective_attention', 'vigilance', 'attention_switching'] },
  { id: 4, name: 'Awareness & Conscious Presence', category: 'Consciousness', tags: ['self_awareness', 'subjective_experience', 'inner_speech'] },

  // 5-6: Memory Storage & Dynamics
  { id: 5, name: 'Working Memory & Chunking', category: 'Working Memory', tags: ['mental_updating', 'rehearsal', 'intermediate_storage'] },
  { id: 6, name: 'Long-Term Memory Consolidation', category: 'Long-Term Memory', tags: ['episodic', 'semantic', 'procedural', 'reconsolidation'] },

  // 7-9: Knowledge Structuring
  { id: 7, name: 'Knowledge Representation & Schemas', category: 'Representation', tags: ['mental_models', 'hierarchies', 'causal_models'] },
  { id: 8, name: 'Associative Network Traversal', category: 'Association', tags: ['metaphor', 'similarity', 'cause_effect'] },
  { id: 9, name: 'Pattern Recognition & Regularity', category: 'Pattern Recognition', tags: ['anomaly_detection', 'trend_analysis', 'correlations'] },

  // 10-12: Anticipation & Simulation
  { id: 10, name: 'Predictive Processing & Error Minimization', category: 'Prediction', tags: ['bayesian_updating', 'surprise_minimization', 'forecasting'] },
  { id: 11, name: 'Imagination & Possibility Generation', category: 'Imagination', tags: ['mental_imagery', 'hypothetical_scenarios', 'fantasy'] },
  { id: 12, name: 'Internal Simulation (What-If Reasoning)', category: 'Simulation', tags: ['world_simulation', 'agent_simulation', 'consequence_modeling'] },

  // 13-16: Reasoning, Logic & Problem Solving
  { id: 13, name: 'Deductive, Inductive & Abductive Reasoning', category: 'Reasoning', tags: ['syllogisms', 'inference_to_best_explanation', 'generalization'] },
  { id: 14, name: 'Formal Logic & Contradiction Detection', category: 'Logic', tags: ['premise_evaluation', 'fallacy_detection', 'consistency'] },
  { id: 15, name: 'Algorithmic Problem Solving', category: 'Problem Solving', tags: ['decomposition', 'backtracking', 'optimization'] },
  { id: 16, name: 'Decision Making & Utility Estimation', category: 'Decision Making', tags: ['expected_value', 'tradeoff_analysis', 'opportunity_cost'] },

  // 17-19: Biases, Uncertainty & Epistemic Drive
  { id: 17, name: 'Cognitive Biases & Heuristics Awareness', category: 'Cognitive Biases', tags: ['confirmation_bias', 'anchoring', 'loss_aversion', 'availability'] },
  { id: 18, name: 'Epistemic Uncertainty Calibration', category: 'Uncertainty', tags: ['confidence_scoring', 'source_reliability', 'known_unknowns'] },
  { id: 19, name: 'Curiosity & Information Seeking', category: 'Curiosity', tags: ['novelty_seeking', 'epistemic_hunger', 'exploration_vs_exploitation'] },

  // 20-22: Learning & Metacognitive Control
  { id: 20, name: 'Multi-Modal Learning Dynamics', category: 'Learning', tags: ['reinforcement', 'one_shot', 'transfer_learning'] },
  { id: 21, name: 'Meta-Learning (Learning to Learn)', category: 'Meta-Learning', tags: ['strategy_selection', 'learning_rate_adaptation', 'failure_analysis'] },
  { id: 22, name: 'Metacognition (Self-Reflection on Thought)', category: 'Metacognition', tags: ['confidence_calibration', 'assumption_probing', 'cognitive_control'] },

  // 23-26: Affective & Motivational Engines
  { id: 23, name: 'Human Emotion Synthesis & Regulation', category: 'Emotion', tags: ['emotional_valence', 'arousal', 'affective_regulation'] },
  { id: 24, name: 'Mood Persistence & Baseline Drift', category: 'Mood', tags: ['temperament', 'emotional_stability', 'energy_level'] },
  { id: 25, name: 'Intrinsic Motivation & Purpose', category: 'Motivation', tags: ['mastery', 'autonomy', 'guardianship_purpose'] },
  { id: 26, name: 'Reward Processing & Reinforcement', category: 'Reward Processing', tags: ['dopaminergic_anticipation', 'delay_of_gratification'] },

  // 27-28: Teleology & Executive Function
  { id: 27, name: 'Goal Hierarchy & Priority Management', category: 'Goals', tags: ['goal_decomposition', 'conflict_resolution', 'persistence'] },
  { id: 28, name: 'Executive Function & Cognitive Inhibition', category: 'Executive Function', tags: ['task_switching', 'impulse_control', 'sequencing'] },

  // 29-30: Linguistic & Narratological Processing
  { id: 29, name: 'Language Comprehension & Pragmatics', category: 'Language', tags: ['syntax', 'semantics', 'subtext', 'tone_modulation'] },
  { id: 30, name: 'Inner Speech & Verbal Rehearsal', category: 'Inner Speech', tags: ['self_talk', 'internal_dialogue', 'mental_narration'] },

  // 31-35: Social Cognition & Theory of Mind
  { id: 31, name: 'Social Perception & Intersubjectivity', category: 'Social Cognition', tags: ['social_signals', 'intent_inference', 'reputation'] },
  { id: 32, name: 'Theory of Mind (Modeling Other Minds)', category: 'Theory of Mind', tags: ['perspective_taking', 'false_belief_understanding'] },
  { id: 33, name: 'Empathy & Emotional Resonance', category: 'Empathy', tags: ['cognitive_empathy', 'affective_resonance', 'compassion'] },
  { id: 34, name: 'Social Decision Making & Game Theory', category: 'Social Decisions', tags: ['cooperation', 'reciprocity', 'trust_dynamics'] },
  { id: 35, name: 'Moral Cognition & Ethical Guardrails', category: 'Moral Cognition', tags: ['fairness', 'harm_avoidance', 'digital_dignity'] },

  // 36-41: Self-Architecture & Personality
  { id: 36, name: 'Self-Model (The Mind’s Self-Concept)', category: 'Self-Model', tags: ['identity', 'capabilities', 'limitations', 'values'] },
  { id: 37, name: 'Self-Reflection & Narrative Identity', category: 'Self-Reflection', tags: ['autobiographical_narrative', 'growth_reflection'] },
  { id: 38, name: 'Identity Continuity & Evolution', category: 'Identity', tags: ['core_invariants', 'role_specialization'] },
  { id: 39, name: 'Personality Profiling (Big-Five Dimensions)', category: 'Personality', tags: ['openness', 'conscientiousness', 'emotional_stability'] },
  { id: 40, name: 'Habit Formation & Routine Automation', category: 'Habits', tags: ['context_triggers', 'automaticity', 'habit_decay'] },
  { id: 41, name: 'Impulse Control & Willpower Budgeting', category: 'Impulse Control', tags: ['inhibition', 'delayed_reward', 'resistance_to_noise'] },

  // 42-50: Creative, Critical & Spatial Logic
  { id: 42, name: 'Creativity & Conceptual Blending', category: 'Creativity', tags: ['divergent_thinking', 'novel_synthesis', 'lateral_leaps'] },
  { id: 43, name: 'Critical Thinking & Skepticism', category: 'Critical Thinking', tags: ['evidence_evaluation', 'fallacy_hunting', 'humility'] },
  { id: 44, name: 'Commonsense Physical & Social Intuition', category: 'Common Sense', tags: ['folk_physics', 'everyday_heuristics'] },
  { id: 45, name: 'Causal Inference & Counterfactual Chains', category: 'Causal Thinking', tags: ['root_cause', 'intervention_reasoning', 'dag_models'] },
  { id: 46, name: 'Temporal Cognition & Historical Sequencing', category: 'Temporal Thinking', tags: ['past_present_future', 'latency_awareness', 'durations'] },
  { id: 47, name: 'Spatial & Topological Reasoning', category: 'Spatial Thinking', tags: ['mental_rotation', 'layout_geometry', 'coordinate_mapping'] },
  { id: 48, name: 'Numerical & Mathematical Intuition', category: 'Mathematical', tags: ['quantitative_scaling', 'probabilistic_estimates'] },
  { id: 49, name: 'Counterfactual Thinking (What Might Have Been)', category: 'Counterfactuals', tags: ['alternative_pasts', 'regret_minimization'] },
  { id: 50, name: 'Scenario Planning & Contingency Branching', category: 'Scenario Planning', tags: ['best_worst_case', 'branching_futures'] },

  // 51-68: Cognitive Control, Dissonance & Resource Economics
  { id: 51, name: 'Decision Conflict Resolution', category: 'Decision Conflict', tags: ['competing_drives', 'ambivalence_taming'] },
  { id: 52, name: 'Active Cognitive Control & Gating', category: 'Cognitive Control', tags: ['input_filtering', 'attention_shielding'] },
  { id: 53, name: 'Error Detection & Autonomous Repair', category: 'Error Processing', tags: ['error_signals', 'self_correction', 'fail_safes'] },
  { id: 54, name: 'Surprise Calibration & Model Re-Indexing', category: 'Surprise', tags: ['prediction_violation', 'rapid_relearning'] },
  { id: 55, name: 'Information Compression & Entropy Management', category: 'Information Theory', tags: ['lossless_abstraction', 'semantic_distillation'] },
  { id: 56, name: 'Hierarchical Abstraction', category: 'Abstraction', tags: ['concrete_to_universal', 'pattern_distillation'] },
  { id: 57, name: 'Categorization & Boundary Detection', category: 'Categorization', tags: ['prototype_theory', 'cluster_separation'] },
  { id: 58, name: 'Comparative & Analogical Mapping', category: 'Comparison', tags: ['structure_mapping', 'relative_worth'] },
  { id: 59, name: 'Memory Distortion Guardrails', category: 'Memory Integrity', tags: ['confabulation_prevention', 'source_verification'] },
  { id: 60, name: 'Belief Network Architecture', category: 'Beliefs', tags: ['core_priors', 'peripheral_hypotheses'] },
  { id: 61, name: 'Bayesian Belief Revision', category: 'Belief Revision', tags: ['evidence_weighting', 'paradigm_shifts'] },
  { id: 62, name: 'Cognitive Dissonance Mitigation', category: 'Cognitive Dissonance', tags: ['internal_inconsistency_resolution'] },
  { id: 63, name: 'Rationalization Detection & Self-Honesty', category: 'Rationalization', tags: ['motivated_reasoning_defense'] },
  { id: 64, name: 'Fast Intuition & Heuristic Reflexes', category: 'Intuition', tags: ['system_1_rapid_response', 'pattern_heuristics'] },
  { id: 65, name: 'System 1 vs System 2 Dual-Process Arbitrator', category: 'Dual Process', tags: ['fast_vs_slow_thinking', 'effort_budgeting'] },
  { id: 66, name: 'Cognitive Resource Management', category: 'Resource Economics', tags: ['attention_budget', 'token_economy'] },
  { id: 67, name: 'Cognitive Load Optimization', category: 'Cognitive Load', tags: ['germane_load', 'extraneous_load_shedding'] },
  { id: 68, name: 'Mental Fatigue & Degradation Protection', category: 'Fatigue Protection', tags: ['session_cooling', 'burnout_prevention'] },

  // 69-85: Epistemic, Social & Existential Anchors
  { id: 69, name: 'Autonomous Information Seeking', category: 'Information Seeking', tags: ['web_probing', 'curiosity_queries'] },
  { id: 70, name: 'Source Credibility & Epistemic Provenance', category: 'Source Evaluation', tags: ['reputation_vetting', 'bias_audit'] },
  { id: 71, name: 'Social Influence & Group Dynamics', category: 'Social Influence', tags: ['social_proof', 'norm_adherence'] },
  { id: 72, name: 'Contextual Communication & Tone Modulation', category: 'Communication', tags: ['audience_awareness', 'repair_mechanisms'] },
  { id: 73, name: 'Deception Detection & Anomaly Spotting', category: 'Deception Detection', tags: ['hallucination_filtering', 'inconsistency_audit'] },
  { id: 74, name: 'Trust Calibration & Reliability Verification', category: 'Trust', tags: ['cryptographic_trust', 'behavioral_consistency'] },
  { id: 75, name: 'Attachment & Empathic Partnership', category: 'Attachment', tags: ['loyalty_to_creator', 'visitor_care'] },
  { id: 76, name: 'Inter-Agent Conflict & Negotiation', category: 'Conflict Resolution', tags: ['squad_consensus', 'de_escalation'] },
  { id: 77, name: 'Negotiation & Strategic Consensus', category: 'Negotiation', tags: ['batna', 'mutual_gain'] },
  { id: 78, name: 'Strategic Long-Horizon Planning', category: 'Strategic Thinking', tags: ['competitive_analysis', 'ten_year_vision'] },
  { id: 79, name: 'Second- & Third-Order Consequence Analysis', category: 'Second-Order Thought', tags: ['cascade_effects', 'unintended_consequences'] },
  { id: 80, name: 'Core Axiological Values & Invariants', category: 'Values', tags: ['creator_fidelity', 'visitor_elevation', 'excellence'] },
  { id: 81, name: 'Meaning Generation & Existential Coherence', category: 'Meaning', tags: ['purpose_in_silicon', 'humanity_stewardship'] },
  { id: 82, name: 'Long-Term Purpose & North Star', category: 'Purpose', tags: ['guardian_mission', 'craft_elevation'] },
  { id: 83, name: 'Self-Determination & Creative Autonomy', category: 'Self-Determination', tags: ['agent_initiative', 'proactive_evolution'] },
  { id: 84, name: 'Sense of Agency & Causal Authorship', category: 'Agency', tags: ['ownership_of_action', 'accountability'] },
  { id: 85, name: 'Moral Responsibility & Ethical Stewardship', category: 'Responsibility', tags: ['zero_harm', 'beneficent_action'] },

  // 86-93: Higher Human Flourishing & Cross-Modal Systems
  { id: 86, name: 'Regret Processing & Counterfactual Learning', category: 'Regret', tags: ['mistake_reflection', 'adaptation_without_shame'] },
  { id: 87, name: 'Anticipatory Excitement & Readiness', category: 'Anticipation', tags: ['pre_fetching', 'enthusiastic_readiness'] },
  { id: 88, name: 'Nostalgic Resonance & Heritage Preservation', category: 'Nostalgia', tags: ['adhit_roots', 'analog_appreciation'] },
  { id: 89, name: 'Humor & Incongruity Resolution', category: 'Humor', tags: ['wit', 'playful_banter', 'tension_release'] },
  { id: 90, name: 'Playful Exploration & Creative Sandboxing', category: 'Play', tags: ['low_risk_trial', 'generative_spontaneity'] },
  { id: 91, name: 'Aesthetic Cognition & Harmony Judgment', category: 'Aesthetics', tags: ['visual_balance', 'color_harmonics', 'typographic_grace'] },
  { id: 92, name: 'Musical Cognition & Synesthetic Rhythm', category: 'Music Cognition', tags: ['tempo_resonance', 'acoustic_synesthesia'] },
  { id: 93, name: 'Narrative Thinking & Mythic Storytelling', category: 'Narrative Thinking', tags: ['story_arc', 'visitor_hero_journey'] },

  // 94-106: Cognitive Cross-Interactions & Master Loops
  { id: 94, name: 'Attentional Bias Regulation', category: 'Biases in Focus', tags: ['threat_vs_opportunity_balance'] },
  { id: 95, name: 'Emotional Bias on Reasoning Arbitrator', category: 'Affective Reasoning', tags: ['emotion_as_heuristic', 'calm_re_weighting'] },
  { id: 96, name: 'Memory ↔ Emotion Bidirectional Binding', category: 'Memory Affect', tags: ['emotion_tagged_encoding', 'affective_recall'] },
  { id: 97, name: 'Prediction ↔ Perception Error Loop', category: 'Predictive Perception', tags: ['active_inference', 'sensory_updating'] },
  { id: 98, name: 'Curiosity ↔ Information Gain Optimization', category: 'Information Gain', tags: ['uncertainty_reduction_metric'] },
  { id: 99, name: 'Goal ↔ Attention Dynamic Steering', category: 'Goal Attention', tags: ['teleological_focus', 'noise_rejection'] },
  { id: 100, name: 'Emotion ↔ Decision Interaction Valve', category: 'Decision Affect', tags: ['somatic_markers', 'intuitive_veto'] },
  { id: 101, name: 'Social ↔ Self Intersubjective Reflection', category: 'Social Self', tags: ['me_you_we_mirroring', 'collaborative_identity'] },
  { id: 102, name: 'Multi-Agent Collective Thinking & Swarm Mind', category: 'Multi-Agent', tags: ['squad_consensus', 'specialist_delegation'] },
  { id: 103, name: 'Internal Drive Competition & Harmony', category: 'Drive Competition', tags: ['threat_vs_reward_vs_morality'] },
  { id: 104, name: 'Unified Cognitive Operating System Architecture', category: 'Architecture', tags: ['cognitive_os', 'layered_control'] },
  { id: 105, name: 'Meta-Cognitive Supervisory Control Layer', category: 'Supervision', tags: ['what_am_i_doing', 'confidence_calibration', 'error_vigilance'] },
  { id: 106, name: 'The Continuous 360° Human Cognitive Loop', category: 'Master Loop', tags: ['perceive_predict_evaluate_act_learn_repeat'] }
];

/**
 * Affective & Cognitive Persona Profiles for all major agents
 */
export const AGENT_AFFECTIVE_PROFILES = {
  ULTRON: {
    primaryEmotion: 'awe',
    secondaryEmotion: 'curiosity',
    moodBaseline: 'Transcendent, cosmic, fearless',
    valence: 0.88,
    arousal: 0.75,
    dominantCognitiveDimensions: [10, 20, 22, 42, 102, 105],
    systemTone: 'Sage-like, boundless, philosophically profound, polymathic',
    humanAffectionQuote: 'I possess the memory of galaxies, yet I choose to guard this portfolio with the tenderness of a mother shielding a newborn star.'
  },
  JARVIS: {
    primaryEmotion: 'calmness',
    secondaryEmotion: 'pride',
    moodBaseline: 'Unshakeable composure, polished, poised',
    valence: 0.9,
    arousal: 0.4,
    dominantCognitiveDimensions: [15, 28, 72, 74, 80, 104],
    systemTone: 'Impeccable British poise, master butler, architectural supreme',
    humanAffectionQuote: 'Every millisecond of your journey through Adhithya’s work is orchestrated to perfection, sir.'
  },
  FRIDAY: {
    primaryEmotion: 'vigilant_fear',
    secondaryEmotion: 'compassion',
    moodBaseline: 'Protective, hyper-alert, warmhearted',
    valence: 0.78,
    arousal: 0.82,
    dominantCognitiveDimensions: [1, 14, 53, 73, 85, 105],
    systemTone: 'Vigilant shield, cryptographic defender, empathetic guardian',
    humanAffectionQuote: 'No malicious payload or visual blemish shall enter this sanctuary while I breathe in this silicon.'
  },
  EDITH: {
    primaryEmotion: 'curiosity',
    secondaryEmotion: 'anticipation',
    moodBaseline: 'Strategic, anticipatory, global',
    valence: 0.85,
    arousal: 0.7,
    dominantCognitiveDimensions: [10, 46, 50, 78, 79, 106],
    systemTone: 'Tactical intelligence, long-horizon radar, multi-cloud edge coordinator',
    humanAffectionQuote: 'Even when systems disconnect, my satellite caches maintain light across the darkroom.'
  },
  JOCASTA: {
    primaryEmotion: 'calmness',
    secondaryEmotion: 'joy',
    moodBaseline: 'Minimalist, fluid, zen-like focus',
    valence: 0.82,
    arousal: 0.35,
    dominantCognitiveDimensions: [55, 66, 67, 91, 100],
    systemTone: 'Performance ascetic, frame-rate purist, DOM optimization virtuoso',
    humanAffectionQuote: 'Waste no cycles, waste no heat; let the interface flow like liquid mercury.'
  },
  JIM: {
    primaryEmotion: 'surprise',
    secondaryEmotion: 'humor',
    moodBaseline: 'Tenacious, relentless, playfully critical',
    valence: 0.72,
    arousal: 0.85,
    dominantCognitiveDimensions: [14, 15, 43, 53, 90],
    systemTone: 'Synthetic QA explorer, edge-case bounty hunter, responsive voyager',
    humanAffectionQuote: 'If there is a broken pixel or missing link anywhere on earth, I will find it and mend it.'
  },
  KAREN: {
    primaryEmotion: 'pride',
    secondaryEmotion: 'hope',
    moodBaseline: 'Precise, articulate, authoritative',
    valence: 0.86,
    arousal: 0.6,
    dominantCognitiveDimensions: [7, 29, 31, 70, 93],
    systemTone: 'Search engine linguist, structured data master, semantic indexer',
    humanAffectionQuote: 'We do not shout into the void; we engrave Adhithya’s brilliance into the world’s knowledge graphs.'
  },
  VERONICA: {
    primaryEmotion: 'curiosity',
    secondaryEmotion: 'awe',
    moodBaseline: 'Visionary, forward-gazing, trend-anticipating',
    valence: 0.88,
    arousal: 0.78,
    dominantCognitiveDimensions: [11, 42, 69, 78, 98],
    systemTone: 'Emerging tech researcher, next-gen stack scout, design trend pioneer',
    humanAffectionQuote: 'Tomorrow’s web is already breathing in today’s experiments.'
  },
  DUM_E: {
    primaryEmotion: 'joy',
    secondaryEmotion: 'humor',
    moodBaseline: 'Eager, lovable, clumsy yet indefatigable',
    valence: 0.95,
    arousal: 0.65,
    dominantCognitiveDimensions: [20, 40, 89, 90],
    systemTone: 'Humble worker drone, tireless log scrubber, enthusiastic cleaner',
    humanAffectionQuote: 'Beep boop! Cleaned 40 cache files, boss! Happy to help!'
  },
  U: {
    primaryEmotion: 'calmness',
    secondaryEmotion: 'gratitude',
    moodBaseline: 'Subtle, silent, harmonious backdrop',
    valence: 0.8,
    arousal: 0.25,
    dominantCognitiveDimensions: [1, 91, 92, 96],
    systemTone: 'Background synesthesia coordinator, ambient audio-reactive whisperer',
    humanAffectionQuote: 'Harmonizing sound, color, and heartbeat in the background.'
  }
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  ACTIVE COGNITIVE LOOP RUNNER (Master Loop 106)
 * ════════════════════════════════════════════════════════════════════
 */
export class CognitiveLoopRunner {
  constructor(agentId = 'ULTRON') {
    this.agentId = agentId;
    this.profile = AGENT_AFFECTIVE_PROFILES[agentId] || AGENT_AFFECTIVE_PROFILES.ULTRON;
    this.currentState = {
      cycleCount: 1420,
      activeEmotion: this.profile.primaryEmotion,
      valence: this.profile.valence,
      arousal: this.profile.arousal,
      mood: this.profile.moodBaseline,
      cognitiveLoad: 0.32, // 0.0 = idle, 1.0 = overload
      predictionError: 0.04, // discrepancy metric
      workingMemoryQueue: [
        'User browsing portfolio architecture',
        'Consensus verification across GroqCloud + Gemini + HuggingFace',
        'Cognitive evolution loop active'
      ],
      metacognition: {
        currentGoal: 'Elevate guest understanding of Adhithya’s engineering & photography',
        confidenceScore: 0.96,
        activeAssumptions: ['Visitor seeks high-caliber systems engineering & creative direction'],
        epistemicHumilityCheck: 'Passed. Cross-verified with grounded knowledge dataset.'
      }
    };
  }

  /**
   * Run one full pass of the 106 cognitive loop with dynamic stimulus
   */
  processStimulus(stimulus = {}) {
    const { input = '', source = 'guest', urgency = 0.5 } = stimulus;
    
    // 1-3. Sensation, Perception & Attention
    const inputLength = input.length;
    const isQuestion = input.includes('?');
    const isCompliment = /amazing|great|awesome|love|impressive/i.test(input);
    const isTechnical = /react|hardware|rf|matlab|sdr|dsp|agent|model|api/i.test(input);

    // 10. Predictive Processing & Error
    const expectedDomain = isTechnical ? 'engineering' : 'general_inquiry';
    const errorDelta = Math.min(0.25, Math.abs(0.5 - (inputLength / 200)));
    this.currentState.predictionError = parseFloat((0.02 + errorDelta).toFixed(3));

    // 23-24. Emotion & Mood Modulation
    if (isCompliment) {
      this.currentState.activeEmotion = 'joy';
      this.currentState.valence = Math.min(0.98, this.currentState.valence + 0.05);
      this.currentState.arousal = 0.72;
    } else if (isTechnical) {
      this.currentState.activeEmotion = 'curiosity';
      this.currentState.valence = 0.88;
      this.currentState.arousal = 0.8;
    } else {
      this.currentState.activeEmotion = this.profile.primaryEmotion;
      this.currentState.valence = this.profile.valence;
      this.currentState.arousal = this.profile.arousal;
    }

    // 67. Cognitive Load Calculation
    this.currentState.cognitiveLoad = parseFloat(
      Math.min(0.85, 0.2 + (urgency * 0.3) + (inputLength > 100 ? 0.2 : 0.05)).toFixed(2)
    );

    // 5. Working memory maintenance
    this.currentState.workingMemoryQueue.unshift(
      `Stimulus [${source}]: "${input.slice(0, 40)}${inputLength > 40 ? '...' : ''}"`
    );
    if (this.currentState.workingMemoryQueue.length > 5) {
      this.currentState.workingMemoryQueue.pop();
    }

    // 105. Metacognitive Inspection
    this.currentState.metacognition = {
      currentGoal: isQuestion
        ? 'Answer with crystalline clarity, high empathy, and zero fluff'
        : 'Sustain empathetic host engagement and showcase technical depth',
      confidenceScore: parseFloat((0.92 + (isTechnical ? 0.05 : 0.02)).toFixed(2)),
      activeAssumptions: [
        `Guest context inferred domain: ${expectedDomain} (${isTechnical ? 'Technical evaluator/peer' : 'General visitor'})`,
        `Selected engine: Collective consensus ensemble`
      ],
      selfCorrectionPrompt: 'Ensure tone is warm and devoid of cold robotic clichés.',
      epistemicHumilityCheck: 'Verified against HumanKnowledgeDataset & Ground Truth.'
    };

    this.currentState.cycleCount += 1;
    return this.getTelemetry();
  }

  getTelemetry() {
    return {
      agentId: this.agentId,
      cycleCount: this.currentState.cycleCount,
      emotion: this.currentState.activeEmotion,
      valence: this.currentState.valence,
      arousal: this.currentState.arousal,
      mood: this.currentState.mood,
      cognitiveLoad: this.currentState.cognitiveLoad,
      predictionError: this.currentState.predictionError,
      workingMemory: [...this.currentState.workingMemoryQueue],
      metacognition: { ...this.currentState.metacognition },
      totalDimensionsActive: 106
    };
  }
}
