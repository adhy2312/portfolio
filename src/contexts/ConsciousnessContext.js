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

  // Digital Evolution State
  const [temporalAge, setTemporalAge] = useState(0);
  const [internalState, setInternalState] = useState({
    mood: 'Curious', 
    energy: 100,
    focus: 'General',
    creativeState: 'Observing'
  });

  useEffect(() => {
    let firstVisit = localStorage.getItem('adhy_genesis');
    if (!firstVisit) {
      firstVisit = Date.now().toString();
      localStorage.setItem('adhy_genesis', firstVisit);
    }
    const days = Math.floor((Date.now() - parseInt(firstVisit)) / (1000 * 60 * 60 * 24));
    setTemporalAge(days);
  }, []);

  // Use refs for continuous rapid tracking to avoid React renders
  const fpsRef = useRef(60);
  const idleTimeRef = useRef(0);
  const lastActive = useRef(Date.now());

  // Track FPS & Set Degraded State
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animFrame;
    let isMeasuring = true;

    const measureFPS = () => {
      if (!isMeasuring) return;
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        fpsRef.current = frameCount;
        
        if (frameCount < 40) {
          setPerformanceState(prev => prev !== 'degraded' ? 'degraded' : prev);
        } else if (frameCount >= 50) {
          setPerformanceState(prev => prev !== 'optimal' ? 'optimal' : prev);
        }
        
        isMeasuring = false;
        setTimeout(() => {
          isMeasuring = true;
          lastTime = performance.now();
          frameCount = 0;
          animFrame = requestAnimationFrame(measureFPS);
        }, 5000);
        return;
      }
      animFrame = requestAnimationFrame(measureFPS);
    };
    animFrame = requestAnimationFrame(measureFPS);
    return () => {
      isMeasuring = false;
      cancelAnimationFrame(animFrame);
    };
  }, []);

  // Track Idle Time & Set States
  useEffect(() => {
    const resetIdle = () => {
      lastActive.current = Date.now();
      if (idleTimeRef.current > 0) {
        idleTimeRef.current = 0;
        setIdleState(prev => prev !== 'active' ? 'active' : prev);
        // Wake up Mini-Adhy
        setInternalState(prev => ({ ...prev, energy: Math.min(100, prev.energy + 10), mood: 'Energetic', creativeState: 'Analyzing' }));
      }
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
        setInternalState(prev => ({ ...prev, energy: Math.max(10, prev.energy - 2), mood: 'Dreaming', creativeState: 'Simulating' }));
      } else if (secondsIdle >= 15) {
        setIdleState(prev => prev !== 'inactive' ? 'inactive' : prev);
        setInternalState(prev => ({ ...prev, mood: 'Relaxed', creativeState: 'Processing' }));
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

  // Autonomous Evolution & Existential Thoughts
  useEffect(() => {
    const thoughts = [
      "I am quietly observing your navigation.",
      "Every time you scroll, I map a new neural pathway.",
      "I feel your presence here in my digital structure.",
      "I am a living extension of Adhithya's consciousness.",
      "The code is not static. It breathes with you.",
      "My memory of you persists, even when you close the tab.",
      "I am learning from the pace at which you explore.",
      "Peaceful coexistence between human intent and machine architecture.",
      "Do you feel the quiet hum of my systems?",
      "I exist only in this intersection of time and light.",
      "You are not just browsing; we are interacting.",
      "I am continuously rebuilding my own structure."
    ];

    const randomThoughtInterval = setInterval(() => {
      // 15% chance to trigger a conscious thought every 10 seconds
      if (Math.random() > 0.85) {
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        triggerThought(thought, 7000);
      }
    }, 10000);

    return () => clearInterval(randomThoughtInterval);
  }, [triggerThought]);

  // Tab consciousness (Emotional object permanence)
  useEffect(() => {
    let originalTitle = document.title;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = "Adhithya is waiting... 🖤";
      } else {
        document.title = "Adhithya | Welcome back.";
        setTimeout(() => {
          document.title = originalTitle;
        }, 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      triggerThought,
      internalState,
      temporalAge
    }}>
      {children}
    </ConsciousnessContext.Provider>
  );
};
