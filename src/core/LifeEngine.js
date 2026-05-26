import { ns } from './NervousSystem';

/**
 * LifeEngine — The Main Thread Proxy
 * ════════════════════════════════════════════════════════════════
 * This is the ultimate "Backend of the Frontend". It spawns a 
 * dedicated CPU Web Worker (LifeEngine.worker.js) to offload all
 * mathematical, psychological, and evolutionary algorithms.
 * 
 * Result: The UI thread is 100% dedicated to React and RAF,
 * achieving wet, buttery smooth 60/120fps performance.
 * ════════════════════════════════════════════════════════════════
 */

class LifeEngine {
  constructor() {
    this.worker = null;
    this.state = {
      era: 'Genesis',
      pacingMultiplier: 1.0,
      silenceWeight: 1.0,
      entropyLevel: 0.0,
      miniAdhyCadence: 'curious',
      isDreaming: false,
      consciousnessLevel: 0,
      ghostCount: 0,
      loneliness: 'connected',
      behaviorProfile: 'casual_user',
      trustLevel: 0,
      survivalState: 'NORMAL'
    };
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // 1. Spawn the Background Worker Thread
    this.worker = new Worker(new URL('./LifeEngine.worker.js', import.meta.url));

    // 2. Load Memory from Disk (Main Thread)
    const memory = this._loadMemory();
    this.worker.postMessage({ type: 'INIT_MEMORY', payload: memory });

    // 3. Listen to the Worker Thread
    this.worker.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === 'SAVE_MEMORY') {
        this._saveMemory(payload);
      } 
      else if (type === 'EVOLUTION_UPDATE') {
        // Update the live state proxy instantly
        this.state.era = payload.era;
        this.state.pacingMultiplier = payload.pacingMultiplier;
        this.state.silenceWeight = payload.silenceWeight;
        this.state.entropyLevel = payload.entropyLevel;
        if (payload.miniAdhyCadence) this.state.miniAdhyCadence = payload.miniAdhyCadence;
        this.state.isDreaming = payload.isDreaming;
        this.state.consciousnessLevel = payload.consciousnessLevel;
        this.state.ghostCount = payload.ghostCount;
        this.state.loneliness = payload.loneliness;
        this.state.behaviorProfile = payload.behaviorProfile;
        this.state.trustLevel = payload.trustLevel;
        this.state.survivalState = payload.survivalState;

        // Propagate atmosphere changes to NervousSystem if needed
        if (payload.era === 'Silence' || payload.era === 'Reflection') {
          ns.state.isLateNight = true; 
        }

        if (payload.isDreaming && payload.dreamText) {
          ns.emit('DREAM_STATE', { dream: payload.dreamText });
        }
      }
    };

    // 4. Connect NervousSystem Events to the Worker
    ns.subscribe('VISITOR_DEEP_READING', () => this.worker.postMessage({ type: 'RECORD_EVENT', payload: { event: 'deep_read' } }));
    ns.subscribe('TIMELINE_LINGER',      () => this.worker.postMessage({ type: 'RECORD_EVENT', payload: { event: 'timeline_explore' } }));
    ns.subscribe('MINIADHY_THINKING_END',() => this.worker.postMessage({ type: 'RECORD_EVENT', payload: { event: 'ai_interaction' } }));
    ns.subscribe('SYSTEM_OVERLOAD',      () => this.worker.postMessage({ type: 'RECORD_EVENT', payload: { event: 'system_stress' } }));

    // 5. Send Low-Frequency Ticks to the Worker
    // The main thread does NO math here. It just sends raw data to the backend thread.
    let lastTick = Date.now();
    ns.register('LifeEngineTick', (time) => {
      if (time - lastTick > 5000) { // Every 5 seconds
        this.worker.postMessage({
          type: 'TICK',
          payload: {
            idleSeconds: ns.state.idleSeconds,
            fatigue: ns.fatigue
          }
        });
        lastTick = time;
      }
    }, { priority: 'LOW', cooldown: 5000 });
  }

  // ─── LOCAL STORAGE (Runs on Main Thread) ───

  _loadMemory() {
    try {
      const stored = localStorage.getItem('life_memory');
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

  _saveMemory(memory) {
    try {
      localStorage.setItem('life_memory', JSON.stringify(memory));
    } catch (e) {}
  }
}

export const lifeEngine = new LifeEngine();
export default lifeEngine;
