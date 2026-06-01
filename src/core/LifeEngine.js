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
    this._loadMemory().then(memory => {
      this.worker.postMessage({ type: 'INIT_MEMORY', payload: memory });
    });

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
    let lastScrollPos = 0;
    ns.register('LifeEngineTick', (time) => {
      if (time - lastTick > 5000) { // Every 5 seconds
        const currentScroll = ns.scrollPos || 0;
        const velocity = Math.abs(currentScroll - lastScrollPos) / 5; // Pixels per second
        lastScrollPos = currentScroll;
        
        this.worker.postMessage({
          type: 'TICK',
          payload: {
            idleSeconds: ns.state.idleSeconds,
            fatigue: ns.fatigue,
            velocity: velocity
          }
        });
        lastTick = time;
      }
    }, { priority: 'LOW', cooldown: 5000 });
  }

  // ─── LOCAL STORAGE -> INDEXEDDB (V20 Upgrade) ───

  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LifeEngineDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('memory')) {
          db.createObjectStore('memory');
        }
      };
    });
  }

  async _loadMemory() {
    try {
      const db = await this._initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(['memory'], 'readonly');
        const store = transaction.objectStore('memory');
        const request = store.get('life_memory');
        
        request.onsuccess = () => {
          if (request.result) resolve(request.result);
          else resolve(this._getDefaultMemory());
        };
        request.onerror = () => resolve(this._getDefaultMemory());
      });
    } catch (e) {
      return this._getDefaultMemory();
    }
  }

  _getDefaultMemory() {
    return {
      birthDate: Date.now(),
      lastInteraction: Date.now(),
      totalInteractions: 0,
      emotionalWeight: 1.0,
      events: {}
    };
  }

  async _saveMemory(memory) {
    try {
      const db = await this._initDB();
      const transaction = db.transaction(['memory'], 'readwrite');
      const store = transaction.objectStore('memory');
      store.put(memory, 'life_memory');
    } catch (e) {}
  }
}

export const lifeEngine = new LifeEngine();
export default lifeEngine;
