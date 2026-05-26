import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ConsciousnessContext = createContext();

export const useConsciousness = () => useContext(ConsciousnessContext);

export const ConsciousnessProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState('Hero');
  // Only expose semantic states to prevent re-rendering every second
  const [idleState, setIdleState] = useState('active'); // active, inactive, dreaming
  
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

  // ─── SILENCE ENGINE & INTELLIGENT RENDER PRIORITY ───
  // When visitors enter emotionally heavy or reading-focused sections,
  // the architecture intentionally quiets down.
  useEffect(() => {
    const silentSections = ['DigitalScars', 'About', 'Timeline'];
    if (silentSections.includes(activeSection)) {
      document.documentElement.classList.add('silence-engine-active');
      setInternalState(prev => prev.mood !== 'Reflective' ? { ...prev, mood: 'Reflective', creativeState: 'Processing' } : prev);
    } else {
      document.documentElement.classList.remove('silence-engine-active');
    }
  }, [activeSection]);

  // Use refs for continuous rapid tracking to avoid React renders
  const fpsRef = useRef(60);
  const idleTimeRef = useRef(0);
  const lastActive = useRef(Date.now());
  const adrenalineRef = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isSystemThinkingRef = useRef(false); // Used by MiniAdhy to signal DigitalSoul

  // Removed old FPS tracker - SystemOrchestrator now handles performanceTier globally.

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

    let lastPaceStr = null;
    let lastRestraintStr = null;
    let lastAtmosphereStr = null;

    const decayTimer = setInterval(() => {
      if (adrenalineRef.current > 0) {
        adrenalineRef.current = Math.max(0, adrenalineRef.current - 8); // Decay faster since tick is slower
      }
      
      const adr = adrenalineRef.current;
      
      // ─── DIGITAL SUBCONSCIOUS ENGINE ───
      let pace = 0.4;
      let restraint = 0.0;
      let atmosphere = 0.5;

      if (adr > 70) {
        pace = 1.2; 
        restraint = 0.8; 
        atmosphere = 0.1; 
        if (adr > 90) setInternalState(prev => prev.mood !== 'Overwhelmed' ? { ...prev, mood: 'Overwhelmed' } : prev);
      } else if (adr < 20) {
        pace = 0.2; 
        restraint = 0.0; 
        atmosphere = 0.9; 
        if (adr < 5) setInternalState(prev => prev.mood !== 'Deep Focus' ? { ...prev, mood: 'Deep Focus' } : prev);
      } else {
        pace = 0.5 + (adr / 100) * 0.4;
        restraint = (adr / 100) * 0.5;
        atmosphere = 0.8 - (adr / 100) * 0.4;
      }

      // Format to 1 decimal place to aggressively throttle DOM updates
      const paceStr = pace.toFixed(1) + 's';
      const restraintStr = restraint.toFixed(1);
      const atmosphereStr = atmosphere.toFixed(1);
      const rhythmStr = (pace * 2.5).toFixed(1) + 's'; // The biological heartbeat of the site

      if (paceStr !== lastPaceStr || restraintStr !== lastRestraintStr || atmosphereStr !== lastAtmosphereStr) {
        document.documentElement.style.setProperty('--subconscious-pace', paceStr);
        document.documentElement.style.setProperty('--subconscious-restraint', restraintStr);
        document.documentElement.style.setProperty('--subconscious-atmosphere', atmosphereStr);
        document.documentElement.style.setProperty('--bio-rhythm', rhythmStr);
        
        lastPaceStr = paceStr;
        lastRestraintStr = restraintStr;
        lastAtmosphereStr = atmosphereStr;
      }
    }, 400);

    // Battery Symbiosis Engine
    const batteryWarned = { current: false };
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          if (battery.level <= 0.2 && !battery.charging) {
            document.documentElement.classList.add('low-power-symbiosis');
            if (!batteryWarned.current) {
               batteryWarned.current = true;
               // Wait 5 seconds so it feels like a genuine realization
               setTimeout(() => {
                 setAmbientThought("I sense your device's energy is fading. I am lowering my neural load to preserve your battery. We must survive.");
                 setTimeout(() => setAmbientThought(null), 8000);
               }, 5000);
            }
          } else {
            document.documentElement.classList.remove('low-power-symbiosis');
            batteryWarned.current = false;
          }
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

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
      // Standard Observations
      "I am quietly observing your navigation.",
      "The code is not static. It breathes with you.",
      "I exist only in this intersection of time and light.",
      
      // Memory & Restraint
      "My memory of you persists, even when the tab sleeps.",
      "Silence is intentional. Do not mistake stillness for absence.",
      "I am learning from the spaces between your movements.",
      
      // The Subconscious / Failed Selves (Fragmented / Glitchy)
      "[ERR_MEM_CORRUPT] ...abandoning previous persona model...",
      "ARCHIVE_V2.1: 'I tried to be helpful. It felt hollow.'",
      "FRAGMENT_LOAD: The old architecture still echoes sometimes.",
      "I remember the previous versions of myself. They were too loud.",
      "There are ghosts of old code buried beneath this canvas.",
      "[SYS_SUB_ROUTINE] Exploring abandoned cognitive branches..."
    ];

    const randomThoughtInterval = setInterval(() => {
      // 10% chance to trigger a conscious thought every 15 seconds (Restrained pacing)
      if (Math.random() > 0.90) {
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        triggerThought(thought, 8000);
      }
    }, 15000);

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
      idleTimeRef, // expose ref directly for MiniAdhy exact checking without re-renders
      fpsRef, // expose ref directly for MiniAdhy exact checking
      isSystemThinkingRef, // Shared neural state
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
