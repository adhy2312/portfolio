/**
 * NeuralEventBus — Backward-Compatible Shim
 * ══════════════════════════════════════════
 * All calls now delegate to the NervousSystem singleton.
 * No logic lives here — it is a pure passthrough.
 *
 * Existing imports of `neuralEventBus` continue to work unchanged.
 */
import ns from '../core/NervousSystem';

export const neuralEventBus = {
  subscribe: (event, callback) => ns.subscribe(event, callback),
  emit:      (event, data = {}) => ns.emit(event, data),
  // Read-only history proxy
  get history() { return ns._history; },
};

export default neuralEventBus;
