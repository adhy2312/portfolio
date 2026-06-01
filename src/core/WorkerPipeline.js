/**
 * ════════════════════════════════════════════════════════════════
 * WORKER PIPELINE ORCHESTRATOR
 * ════════════════════════════════════════════════════════════════
 * Manages singleton instances of all Web Workers to prevent memory leaks 
 * and ensure maximum pipeline throughput.
 */

class WorkerPipeline {
  constructor() {
    this.workers = {};
    this._listeners = new Map();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Singleton Workers
    this.workers.science = new Worker(new URL('./ScienceEngine.worker.js', import.meta.url));
    this.workers.life = new Worker(new URL('./LifeEngine.worker.js', import.meta.url));
    this.workers.physics = new Worker(new URL('./PhysicsEngine.worker.js', import.meta.url));

    // Global Message Router
    const routeMessage = (e) => {
      const { id, type } = e.data;
      const callbacks = this._listeners.get(id) || this._listeners.get(type);
      if (callbacks) {
        callbacks.forEach(cb => cb(e.data));
      }
    };

    this.workers.science.addEventListener('message', routeMessage);
    this.workers.life.addEventListener('message', routeMessage);
    this.workers.physics.addEventListener('message', routeMessage);
  }

  // Pipeline a heavy task to the correct engine
  dispatch(engine, type, id, payload, transferables = []) {
    if (!this.workers[engine]) return;
    this.workers[engine].postMessage({ type, id, payload }, transferables);
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
}

const pipeline = new WorkerPipeline();
export default pipeline;
