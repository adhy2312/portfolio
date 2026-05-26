import React, { createContext, useContext, useEffect, useRef } from 'react';

const OrchestratorContext = createContext();

export const useOrchestrator = () => useContext(OrchestratorContext);

export const SystemOrchestratorProvider = ({ children }) => {
  // Global stable references
  const mousePos = useRef({ x: -1000, y: -1000 });
  const scrollPos = useRef(0);
  const isMoving = useRef(false);
  const idleTimer = useRef(null);
  
  // Performance & Sleep States
  const isSleeping = useRef(false);
  const performanceTier = useRef(3); // 3 = Max, 2 = Standard, 1 = Lightweight, 0 = Static
  
  // Array of callbacks for the single global RAF loop
  const rafCallbacks = useRef([]);

  const subscribeToRAF = (id, callback) => {
    const existingIndex = rafCallbacks.current.findIndex(c => c.id === id);
    if (existingIndex >= 0) {
      rafCallbacks.current[existingIndex].callback = callback;
    } else {
      rafCallbacks.current.push({ id, callback });
    }
  };

  const unsubscribeFromRAF = (id) => {
    rafCallbacks.current = rafCallbacks.current.filter(c => c.id !== id);
  };

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) performanceTier.current = 1; // Start lower on mobile

    const handleVisibilityChange = () => {
      isSleeping.current = document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Global Event Listeners (Passive, Non-Blocking)
    const handleMouseMove = (e) => {
      if (isSleeping.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      mousePos.current.x = clientX;
      mousePos.current.y = clientY;
      isMoving.current = true;
      
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        isMoving.current = false;
      }, 2000);
    };

    const handleScroll = () => {
      if (isSleeping.current) return;
      scrollPos.current = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleMouseMove, { passive: true });

    // Master RAF Loop
    let rafId;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const masterRAF = (time) => {
      if (isSleeping.current) {
        // Sleep Mode: Do not calculate or render anything. Check again soon.
        lastTime = time;
        setTimeout(() => { rafId = requestAnimationFrame(masterRAF); }, 100);
        return;
      }

      const delta = time - lastTime;
      lastTime = time;

      // FPS Tracking & Tier Adjustment (Check every 1 second)
      frameCount++;
      if (time - lastFpsTime >= 1000) {
        if (frameCount < 30) { // Severe drop
          performanceTier.current = Math.max(0, performanceTier.current - 1);
        } else if (frameCount >= 55) { // Stable 60fps
          const maxTier = isMobile ? 1 : 3;
          performanceTier.current = Math.min(maxTier, performanceTier.current + 1);
        }
        frameCount = 0;
        lastFpsTime = time;
      }

      // Execute all registered subsystem ticks sequentially
      const callbacks = rafCallbacks.current;
      const tier = performanceTier.current;
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i].callback(time, delta, mousePos.current, isMoving.current, tier);
      }

      rafId = requestAnimationFrame(masterRAF);
    };

    rafId = requestAnimationFrame(masterRAF);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleMouseMove);
      cancelAnimationFrame(rafId);
      clearTimeout(idleTimer.current);
    };
  }, []);

  // Provide stable refs and methods. DO NOT put rapidly changing state here to avoid re-renders.
  const api = useRef({
    mousePos,
    scrollPos,
    isMoving,
    isSleeping,
    performanceTier,
    subscribeToRAF,
    unsubscribeFromRAF
  });

  return (
    <OrchestratorContext.Provider value={api.current}>
      {children}
    </OrchestratorContext.Provider>
  );
};
