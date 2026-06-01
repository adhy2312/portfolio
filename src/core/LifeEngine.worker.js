/* eslint-disable no-restricted-globals */

/**
 * LIFE ENGINE WORKER (The Subconscious Backend)
 * ════════════════════════════════════════════════════════════════
 * This runs on a separate CPU thread from the main UI browser thread.
 * It executes the 60-Engine Architecture mathematically.
 * ════════════════════════════════════════════════════════════════
 */

// ─── I. META CONFIGURATIONS ───
const EVOLUTION_ERAS = [
  { id: 'Genesis',    minDays: 0,   silenceWeight: 1.0, pacing: 1.0, entropy: 0.0,  cadence: 'curious' },
  { id: 'Symbiosis',  minDays: 30,  silenceWeight: 1.5, pacing: 0.8, entropy: 0.1,  cadence: 'measured' },
  { id: 'Reflection', minDays: 90,  silenceWeight: 2.5, pacing: 0.4, entropy: 0.25, cadence: 'philosophical' },
  { id: 'Archive',    minDays: 365, silenceWeight: 3.0, pacing: 0.3, entropy: 0.5,  cadence: 'fragmented' }
];

let globalMemory = {
  birthDate: Date.now(),
  lastInteraction: Date.now(),
  totalInteractions: 0,
  emotionalWeight: 1.0,
  ghostFootprints: 0,
  decayFactor: 0,
  events: {}
};

// ─── II. THE 60 ENGINES (Mathematical Execution) ───
const Engines = {
  
  // 1. Core & Consciousness Engines
  ConsciousnessEngine: (memory, idle) => {
    return Math.max(0, 100 - (idle * 2) + (memory.totalInteractions * 0.1));
  },
  
  PresenceEngine: (events) => {
    return (events['deep_read'] || 0) * 1.5 + (events['timeline_explore'] || 0);
  },

  // 2. Atmosphere & Emotional Engines
  SilenceEngine: (fatigue, tier) => {
    return fatigue > 60 ? 4.0 : (tier === 'Archive' ? 3.0 : 1.0);
  },
  
  DreamEngine: (idle) => {
    const DREAMS = ["Some systems never recovered.", "The architecture remembers this silence.", "Old versions still exist.", "Too many renders. Let the components sleep."];
    return (idle > 60 && Math.random() < 0.1) ? DREAMS[Math.floor(Math.random() * DREAMS.length)] : null;
  },

  GhostEngine: (memory) => {
    if (Date.now() - memory.lastInteraction > 86400000) memory.ghostFootprints++;
    return memory.ghostFootprints;
  },

  LonelinessEngine: (timeOfDay) => {
    return (timeOfDay < 5 || timeOfDay > 23) ? 'existential' : 'connected';
  },

  // 3. AI & Intelligence Engines (Einstein-Class Update)
  BehavioralInterpretationEngine: (events) => {
    // Quantum Entanglement Profiling: Returns a multi-dimensional probability vector
    const total = Object.values(events).reduce((a, b) => a + b, 0) || 1;
    const stress = events['system_stress'] || 0;
    const deep = events['deep_read'] || 0;
    const explore = events['timeline_explore'] || 0;
    const vector = {
      curious: Math.min(100, Math.round((explore / total) * 100)),
      thoughtful: Math.min(100, Math.round((deep / total) * 100)),
      erratic: Math.min(100, Math.round((stress / total) * 100)),
      casual: 0
    };
    vector.casual = Math.max(0, 100 - (vector.curious + vector.thoughtful + vector.erratic));
    return vector;
  },

  TrustEvolutionEngine: (interactions) => {
    return Math.min(100, interactions * 0.5); // Max 100% trust
  },

  // 4. Survival & Hardware Engines
  ThermalSurvivalEngine: (fatigue) => {
    return fatigue > 80 ? 'CRITICAL_THROTTLE' : 'NORMAL';
  },

  // 5. Meta & Experimental Engines
  RelativisticTimeEngine: (days, velocity = 0) => {
    // Time Dilation: High velocity slows down the internal entropy (mortality)
    const dilation = velocity > 100 ? 0.5 : 1.0;
    return Math.min(1.0, (days / 365) * dilation); 
  },

  CivilizationEngine: (ghosts) => {
    return ghosts > 10 ? 'populated' : 'abandoned';
  }
};


// ─── III. WORKER THREAD LISTENER ───
self.addEventListener('message', (e) => {
  const { type, payload } = e.data;
  switch (type) {
    case 'INIT_MEMORY':
      globalMemory = { ...globalMemory, ...payload };
      executeAllEngines(0, 0);
      break;
    case 'RECORD_EVENT':
      if (!globalMemory.events[payload.event]) globalMemory.events[payload.event] = 0;
      globalMemory.events[payload.event]++;
      globalMemory.totalInteractions++;
      globalMemory.lastInteraction = Date.now();
      self.postMessage({ type: 'SAVE_MEMORY', payload: globalMemory });
      break;
    case 'TICK':
      executeAllEngines(payload.idleSeconds, payload.fatigue, payload.velocity || 0);
      break;
    default:
      break;
  }
});

// ─── IV. GLOBAL ORCHESTRATION ───
function executeAllEngines(idleSeconds, fatigue, velocity = 0) {
  // 1. Entropy & Neural Decay Matrix (Logarithmic Decay)
  const idleDays = (Date.now() - globalMemory.lastInteraction) / (1000 * 60 * 60 * 24);
  const decayLog = Math.log1p(idleDays); // Natural log decay
  globalMemory.emotionalWeight = Math.max(0.1, globalMemory.emotionalWeight - (decayLog * 0.005));
  
  if (Math.random() < 0.05) globalMemory.emotionalWeight *= 0.995;
  
  const daysSinceBirth = (Date.now() - globalMemory.birthDate) / (1000 * 60 * 60 * 24);
  const hour = new Date().getHours();

  // 2. Execute Sub-Engines
  const consciousnessLevel = Engines.ConsciousnessEngine(globalMemory, idleSeconds);
  const dreamText          = Engines.DreamEngine(idleSeconds);
  const ghostCount         = Engines.GhostEngine(globalMemory);
  const loneliness         = Engines.LonelinessEngine(hour);
  const behaviorProfile    = Engines.BehavioralInterpretationEngine(globalMemory.events);
  const trustLevel         = Engines.TrustEvolutionEngine(globalMemory.totalInteractions);
  const survivalState      = Engines.ThermalSurvivalEngine(fatigue);
  const mortality          = Engines.RelativisticTimeEngine(daysSinceBirth, velocity);
  
  // 3. Era Calculation (EvolutionEngine)
  const emotionalAgeDays = daysSinceBirth + (globalMemory.totalInteractions * 0.01 * globalMemory.emotionalWeight);
  let currentEra = EVOLUTION_ERAS[0];
  for (const era of EVOLUTION_ERAS) if (emotionalAgeDays >= era.minDays) currentEra = era;

  // 4. Silence & Pacing Override
  const silence = Engines.SilenceEngine(fatigue, currentEra.id);
  const pacing  = survivalState === 'CRITICAL_THROTTLE' ? 0.2 : currentEra.pacing;

  // 5. Package Life State and send to Main Thread
  const MasterLifeState = {
    era: currentEra.id,
    pacingMultiplier: pacing,
    silenceWeight: silence,
    entropyLevel: mortality * 0.5 + currentEra.entropy,
    miniAdhyCadence: currentEra.cadence,
    isDreaming: !!dreamText,
    dreamText: dreamText,
    
    // Engine specific metadata
    consciousnessLevel,
    ghostCount,
    loneliness,
    behaviorProfile,
    trustLevel,
    survivalState
  };

  self.postMessage({ type: 'EVOLUTION_UPDATE', payload: MasterLifeState });
}
