import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ConsciousnessContext = createContext();

export const useConsciousness = () => useContext(ConsciousnessContext);

export const ConsciousnessProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState('Hero');
  const [idleTime, setIdleTime] = useState(0);
  const [fps, setFps] = useState(60);
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

  // Track FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animFrame;

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      animFrame = requestAnimationFrame(measureFPS);
    };
    animFrame = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Track Idle Time
  useEffect(() => {
    let idleTimer;
    const resetIdle = () => {
      setIdleTime(0);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIdleTime(prev => prev + 1), 1000);
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('scroll', resetIdle);
    window.addEventListener('touchstart', resetIdle);

    idleTimer = setInterval(() => {
      setIdleTime(prev => prev + 1);
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
      idleTime,
      fps,
      visitorMemory,
      updateMemory,
      ambientThought,
      triggerThought
    }}>
      {children}
    </ConsciousnessContext.Provider>
  );
};
