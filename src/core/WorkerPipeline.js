/**
 * ════════════════════════════════════════════════════════════════
 * WORKER PIPELINE ORCHESTRATOR (CANONICAL SINGLETON)
 * ════════════════════════════════════════════════════════════════
 * Manages singleton instances of Web Workers lazily to eliminate
 * redundant background worker processes and reduce idle memory footprint.
 */

class WorkerPipeline {
  constructor() {
    this.workers = {};
    this._listeners = new Map();
    this._initialized = false;
  }

  _attachRouteMessage(worker) {
    if (!worker) return;
    worker.addEventListener('message', (e) => {
      const { id, type } = e.data || {};
      const callbacks = this._listeners.get(id) || this._listeners.get(type);
      if (callbacks) {
        callbacks.forEach(cb => cb(e.data));
      }
    });
  }

  getWorker(engine) {
    if (typeof window === 'undefined') return null;

    if (!this.workers[engine]) {
      try {
        if (engine === 'science') {
          this.workers.science = new Worker(new URL('./ScienceEngine.worker.js', import.meta.url));
          this._attachRouteMessage(this.workers.science);
        } else if (engine === 'life') {
          this.workers.life = new Worker(new URL('./LifeEngine.worker.js', import.meta.url));
          this._attachRouteMessage(this.workers.life);
        } else if (engine === 'physics') {
          this.workers.physics = new Worker(new URL('./PhysicsEngine.worker.js', import.meta.url));
          this._attachRouteMessage(this.workers.physics);
        }
      } catch (err) {
        console.warn(`[WorkerPipeline] Failed to spawn worker for ${engine}:`, err);
        return null;
      }
    }
    return this.workers[engine];
  }

  init() {
    if (this._initialized || typeof window === 'undefined') return;
    this._initialized = true;
    // On init, pre-warm only primary science pipeline worker; other workers are lazily loaded on demand
    this.getWorker('science');
  }

  // Pipeline a heavy task to the correct engine
  dispatch(engine, type, id, payload, transferables = []) {
    const worker = this.getWorker(engine);
    if (!worker) return;
    worker.postMessage({ type, id, payload }, transferables);
  }

  // Listen for pipeline results
  subscribe(filterKey, callback) {
    if (!this._listeners.has(filterKey)) {
      this._listeners.set(filterKey, []);
    }
    this._listeners.get(filterKey).push(callback);

    return () => {
      const arr = this._listeners.get(filterKey);
      if (arr) {
        this._listeners.set(filterKey, arr.filter(cb => cb !== callback));
      }
    };
  }

  terminateAll() {
    Object.keys(this.workers).forEach(engine => {
      try {
        this.workers[engine]?.terminate();
      } catch {}
      delete this.workers[engine];
    });
    this._listeners.clear();
    this._initialized = false;
  }
}

const pipeline = new WorkerPipeline();
export default pipeline;
