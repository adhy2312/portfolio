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
  
  // Weather Integration for Environmental Symbiosis
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = '92e41715eebf95a75dca713b1bf3fe06';
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Thiruvananthapuram,IN&appid=${apiKey}&units=metric`);
        const data = await res.json();
        if (data.cod === 200 && data.weather && data.weather.length > 0) {
          setWeatherData({ condition: data.weather[0].main, temp: Math.round(data.main.temp), isDay: data.dt > data.sys.sunrise && data.dt < data.sys.sunset });
        } else {
          setWeatherData({ condition: 'Clear', temp: 28, isDay: true });
        }
      } catch (error) {
        setWeatherData({ condition: 'Clear', temp: 28, isDay: true });
      }
    };
    fetchWeather();
  }, []);

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
  const adrenalineRef = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });

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

  // Track Idle Time, Adrenaline & Set States
  useEffect(() => {
    const resetIdle = (e) => {
      lastActive.current = Date.now();
      
      // Calculate Adrenaline based on movement velocity (DOM update deferred to prevent CPU thrashing)
      if (e) {
        let speed = 0;
        if (e.type === 'mousemove') {
          const dx = e.clientX - lastMousePos.current.x;
          const dy = e.clientY - lastMousePos.current.y;
          speed = Math.sqrt(dx * dx + dy * dy);
          lastMousePos.current = { x: e.clientX, y: e.clientY };
        } else if (e.type === 'scroll') {
          speed = 60; 
        }
        adrenalineRef.current = Math.min(100, adrenalineRef.current + speed * 0.15);
      }

      if (idleTimeRef.current > 0) {
        idleTimeRef.current = 0;
        setIdleState(prev => prev !== 'active' ? 'active' : prev);
        document.documentElement.classList.remove('dream-state');
        setInternalState(prev => ({ ...prev, energy: Math.min(100, prev.energy + 10), mood: 'Energetic', creativeState: 'Analyzing' }));
      }
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });

    let lastAdrenalineStr = null;
    const decayTimer = setInterval(() => {
      if (adrenalineRef.current > 0) {
        adrenalineRef.current = Math.max(0, adrenalineRef.current - 2);
      }
      
      const newStr = (adrenalineRef.current / 100).toFixed(2);
      if (newStr !== lastAdrenalineStr) {
        // Biological Heartbeat calculation
        const heartDuration = 0.8 - (adrenalineRef.current / 100) * 0.55;
        document.documentElement.style.setProperty('--adrenaline', newStr);
        document.documentElement.style.setProperty('--heartbeat-duration', `${heartDuration.toFixed(2)}s`);
        
        // ─── DIGITAL SUBCONSCIOUS ENGINE ───
        // Watches interaction rhythm and alters the psychological weight of the UI
        const adr = adrenalineRef.current;
        let pace = 0.4;
        let restraint = 0.0;
        let atmosphere = 0.5;

        if (adr > 70) {
          // Frantic User: Force the UI to slow down and mute itself to calm them
          pace = 1.2; // Resist frantic movement with heavy latency
          restraint = 0.8; // High restraint (muted colors, blurred edges)
          atmosphere = 0.1; // Hide distractions
          if (adr > 90) setInternalState(prev => ({ ...prev, mood: 'Overwhelmed' }));
        } else if (adr < 20) {
          // Calm / Deep Focus User: Reward with snappy UI and deep atmosphere
          pace = 0.2; // Snappy
          restraint = 0.0; // Zero restraint, vibrant
          atmosphere = 0.9; // Deep, rich particle breathing
          if (adr < 5) setInternalState(prev => ({ ...prev, mood: 'Deep Focus' }));
        } else {
          // Normal rhythm
          pace = 0.5 + (adr / 100) * 0.4;
          restraint = (adr / 100) * 0.5;
          atmosphere = 0.8 - (adr / 100) * 0.4;
        }

        document.documentElement.style.setProperty('--subconscious-pace', `${pace.toFixed(2)}s`);
        document.documentElement.style.setProperty('--subconscious-restraint', restraint.toFixed(2));
        document.documentElement.style.setProperty('--subconscious-atmosphere', atmosphere.toFixed(2));
        // ───────────────────────────────────

        lastAdrenalineStr = newStr;
      }
    }, 100);

    const idleTimer = setInterval(() => {
      const secondsIdle = Math.floor((Date.now() - lastActive.current) / 1000);
      idleTimeRef.current = secondsIdle;

      if (secondsIdle >= 60) {
        // Entering REM Sleep / Cellular Degeneration
        setIdleState(prev => prev !== 'dreaming' ? 'dreaming' : prev);
        document.documentElement.classList.add('dream-state');
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
      clearInterval(decayTimer);
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
      temporalAge,
      weatherData
    }}>
      {children}
    </ConsciousnessContext.Provider>
  );
};
