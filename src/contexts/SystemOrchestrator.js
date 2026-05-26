/**
 * SystemOrchestrator — Backward-Compatible React Wrapper
 * ════════════════════════════════════════════════════════
 * The actual RAF loop, FPS tracking, input listeners, and heartbeat now
 * live in NervousSystem (src/core/NervousSystem.js).
 *
 * This Provider simply starts NervousSystem on mount and exposes its API
 * via React context so existing `useOrchestrator()` calls continue to work.
 */
import React, { createContext, useContext, useEffect, useRef } from 'react';
import ns from '../core/NervousSystem';

const OrchestratorContext = createContext();

export const useOrchestrator = () => useContext(OrchestratorContext);

export const SystemOrchestratorProvider = ({ children }) => {

  useEffect(() => {
    ns.start();
    return () => ns.stop();
  }, []);

  // Stable API object — same shape as the old orchestrator so all
  // existing `orchestrator.subscribeToRAF(...)` calls work unchanged.
  const api = useRef({
    // RAF scheduler
    subscribeToRAF:   (id, fn, opts) => ns.register(id, fn, opts),
    unsubscribeFromRAF: (id)         => ns.unregister(id),

    // Input state (proxy refs so reads are always current)
    mousePos:       { get current() { return ns.mousePos;  } },
    scrollPos:      { get current() { return ns.scrollPos; } },
    isMoving:       { get current() { return ns.isMoving;  } },
    isSleeping:     { get current() { return ns.isSleeping; } },
    performanceTier:{ get current() { return ns.performanceTier; } },
    systemFatigue:  { get current() { return ns.fatigue; } },

    // Direct NervousSystem access for components that need it
    ns,
  });

  return (
    <OrchestratorContext.Provider value={api.current}>
      {children}
    </OrchestratorContext.Provider>
  );
};
