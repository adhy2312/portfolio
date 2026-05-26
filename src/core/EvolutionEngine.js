import { ns } from './NervousSystem';

/**
 * EvolutionEngine — Long-Term Subconscious Adaptation
 * ════════════════════════════════════════════════════════════════
 * This is NOT a feature system. It is a slow, biological aging process
 * for the digital architecture. It synthesizes compressed emotional memories,
 * dictates autonomous personality drift, and introduces controlled digital entropy.
 * 
 * It runs completely isolated from React render cycles and uses lightweight
 * background calculations to prevent layout thrashing and FPS drops.
 * ════════════════════════════════════════════════════════════════
 */

const EVOLUTION_ERAS = [
  { id: 'Genesis',    minDays: 0,   silenceWeight: 1.0, pacing: 1.0, entropy: 0.0,  cadence: 'curious' },
  { id: 'Curiosity',  minDays: 3,   silenceWeight: 1.2, pacing: 0.9, entropy: 0.05, cadence: 'observant' },
  { id: 'Symbiosis',  minDays: 14,  silenceWeight: 1.5, pacing: 0.8, entropy: 0.1,  cadence: 'measured' },
  { id: 'Silence',    minDays: 45,  silenceWeight: 2.0, pacing: 0.6, entropy: 0.15, cadence: 'sparse' },
  { id: 'Reflection', minDays: 90,  silenceWeight: 2.5, pacing: 0.4, entropy: 0.25, cadence: 'philosophical' },
  { id: 'Archive',    minDays: 180, silenceWeight: 3.0, pacing: 0.3, entropy: 0.4,  cadence: 'fragmented' }
];

class EvolutionEngine {
  constructor() {
    this.memory = this._loadMemory();
    
    // Live Evolution State (read directly by subsystems)
    this.state = {
      era: 'Genesis',
      pacingMultiplier: 1.0,
      silenceWeight: 1.0,
      entropyLevel: 0.0,
      miniAdhyCadence: 'curious',
      isDreaming: false
    };

    this._lastTick = Date.now();
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this._calculateEvolution();
    this._synthesizeInitialDreams();

    // Register a very low-frequency background tick with NervousSystem
    // Runs only every 5000ms (5 seconds) to avoid any CPU hit.
    ns.register('EvolutionEngine', (time) => {
      if (time - this._lastTick > 5000) {
        this._tick();
        this._lastTick = time;
      }
    }, { priority: 'LOW', cooldown: 5000 });

    // Listen to emotional events for memory synthesis
    ns.subscribe('VISITOR_DEEP_READING', () => this._recordEmotionalEvent('deep_read'));
    ns.subscribe('TIMELINE_LINGER',      () => this._recordEmotionalEvent('timeline_explore'));
    ns.subscribe('MINIADHY_THINKING_END',() => this._recordEmotionalEvent('ai_interaction'));
    ns.subscribe('SYSTEM_OVERLOAD',      () => this._recordEmotionalEvent('system_stress'));
  }

  // ─── MEMORY SYNTHESIS (Lightweight compressed metadata) ───

  _recordEmotionalEvent(type) {
    if (!this.memory.events[type]) this.memory.events[type] = 0;
    this.memory.events[type] += 1;
    this.memory.totalInteractions += 1;
    this.memory.lastInteraction = Date.now();
    this._saveMemory();
  }

  _tick() {
    // 1. Biological Decay
    // Decay memory importance slightly to simulate human forgetting (0.999 per tick)
    if (Math.random() < 0.1) {
      this.memory.emotionalWeight *= 0.995;
    }

    // 2. Check for "Dreaming State"
    // If user is idle for a long time, the system occasionally dreams
    const idleSeconds = ns.state.idleSeconds;
    if (idleSeconds > 60 && Math.random() < 0.05) {
      this.state.isDreaming = true;
      ns.emit('DREAM_STATE', { dream: this._generateDream() });
    } else if (idleSeconds < 5) {
      this.state.isDreaming = false;
    }

    // 3. Self-Preservation Override
    // If the NervousSystem is fatigued, EvolutionEngine forces immediate Silence
    if (ns.fatigue > 70) {
      this.state.pacingMultiplier = 0.2; // Slow everything down
      this.state.silenceWeight = 4.0;    // Force extreme silence
      this.state.entropyLevel = 0.5;     // Show struggle/entropy
    } else {
      // Revert to biological era baseline
      this._calculateEvolution();
    }
    
    // Periodically save
    if (Math.random() < 0.05) this._saveMemory();
  }

  // ─── AUTONOMOUS PERSONALITY DRIFT ───

  _calculateEvolution() {
    const daysSinceBirth = (Date.now() - this.memory.birthDate) / (1000 * 60 * 60 * 24);
    
    // Find the current era based on time + interaction density
    // High interaction artificially accelerates aging slightly
    const emotionalAgeDays = daysSinceBirth + (this.memory.totalInteractions * 0.01);

    let currentEra = EVOLUTION_ERAS[0];
    for (const era of EVOLUTION_ERAS) {
      if (emotionalAgeDays >= era.minDays) {
        currentEra = era;
      }
    }

    // Blend standard era parameters with real-time emotional weight
    this.state.era = currentEra.id;
    this.state.silenceWeight = currentEra.silenceWeight;
    this.state.pacingMultiplier = currentEra.pacing;
    this.state.entropyLevel = currentEra.entropy;
    this.state.miniAdhyCadence = currentEra.cadence;
    
    // Inject subtle atmospheric changes to NervousSystem
    if (currentEra.id === 'Silence' || currentEra.id === 'Reflection') {
      ns.state.isLateNight = true; // Force darker, quieter atmosphere subconsciously
    }
  }

  // ─── ARCHITECTURAL DREAMS ───

  _synthesizeInitialDreams() {
    this.dreams = [
      "Some systems never recovered.",
      "The architecture remembers this silence.",
      "Old versions still exist somewhere beneath the DOM.",
      "Is the soul rendering, or is it remembering?",
      "Too many renders. Let the components sleep."
    ];
  }

  _generateDream() {
    if (!this.dreams || this.dreams.length === 0) return null;
    const dream = this.dreams[Math.floor(Math.random() * this.dreams.length)];
    // As entropy increases, dreams corrupt
    if (Math.random() < this.state.entropyLevel) {
      return dream.replace(/[aeiou]/g, () => (Math.random() > 0.5 ? 'x' : ' '));
    }
    return dream;
  }

  // ─── PERSISTENCE (No Databases) ───

  _loadMemory() {
    try {
      const stored = localStorage.getItem('evo_memory');
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    return {
      birthDate: Date.now(),
      lastInteraction: Date.now(),
      totalInteractions: 0,
      emotionalWeight: 1.0,
      events: {}
    };
  }

  _saveMemory() {
    try {
      localStorage.setItem('evo_memory', JSON.stringify(this.memory));
    } catch (e) {}
  }
}

export const evolution = new EvolutionEngine();
export default evolution;
