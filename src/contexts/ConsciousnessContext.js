import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ConsciousnessContext = createContext();

export const useConsciousness = () => useContext(ConsciousnessContext);

export const ConsciousnessProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState('Hero');
  // Only expose semantic states to prevent re-rendering every second
  const [idleState, setIdleState] = useState('active'); // active, inactive, dreaming
  const [performanceState, setPerformanceState] = useState('optimal'); // optimal, degraded
  
  const [visitorMemory, setVisitorMemory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adhy_visitor_memory')) || {
        visits: 0,
        favoriteSection: null,
        persona: 'Curious Beginner'
      };
    } catch {
      return { visits: 0, favoriteSection: null, persona: 'Curious Beginner' };
    }
  });

  const [ambientThought, setAmbientThought] = useState(null);

  // Use refs for continuous rapid tracking to avoid React renders
  const fpsRef = useRef(60);
  const idleTimeRef = useRef(0);
  const lastActive = useRef(Date.now());

  // Track FPS & Set Degraded State
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animFrame;

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        fpsRef.current = frameCount;
        
        // Only trigger React state if threshold crossed
        if (frameCount < 40) {
          setPerformanceState(prev => prev !== 'degraded' ? 'degraded' : prev);
        } else if (frameCount >= 50) {
          setPerformanceState(prev => prev !== 'optimal' ? 'optimal' : prev);
        }
        
        frameCount = 0;
        lastTime = now;
      }
      animFrame = requestAnimationFrame(measureFPS);
    };
    animFrame = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Track Idle Time & Set States
  useEffect(() => {
    const resetIdle = () => {
      lastActive.current = Date.now();
      idleTimeRef.current = 0;
      setIdleState(prev => prev !== 'active' ? 'active' : prev);
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });

    const idleTimer = setInterval(() => {
      const secondsIdle = Math.floor((Date.now() - lastActive.current) / 1000);
      idleTimeRef.current = secondsIdle;

      if (secondsIdle >= 30) {
        setIdleState(prev => prev !== 'dreaming' ? 'dreaming' : prev);
      } else if (secondsIdle >= 15) {
        setIdleState(prev => prev !== 'inactive' ? 'inactive' : prev);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('scroll', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      clearInterval(idleTimer);
    };
  }, []);

  // Update Visitor Memory
  useEffect(() => {
    localStorage.setItem('adhy_visitor_memory', JSON.stringify(visitorMemory));
  }, [visitorMemory]);

  const updateMemory = useCallback((updates) => {
    setVisitorMemory(prev => ({ ...prev, ...updates }));
  }, []);

  const triggerThought = useCallback((text, duration = 4000) => {
    setAmbientThought(text);
    setTimeout(() => setAmbientThought(null), duration);
  }, []);

  return (
    <ConsciousnessContext.Provider value={{
      activeSection,
      setActiveSection,
      idleState,
      performanceState,
      idleTimeRef, // expose ref directly for MiniAdhy exact checking without re-renders
      fpsRef, // expose ref directly for MiniAdhy exact checking
      visitorMemory,
      updateMemory,
      ambientThought,
      triggerThought
    }}>
      {children}
    </ConsciousnessContext.Provider>
  );
};
