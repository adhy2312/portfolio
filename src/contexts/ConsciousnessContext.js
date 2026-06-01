import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { neuralEventBus } from '../utils/NeuralEventBus';
import ns from '../core/NervousSystem';

const ConsciousnessContext = createContext();

export const useConsciousness = () => useContext(ConsciousnessContext);

// ════════════════════════════════════════
//  CONSCIOUSNESS TIERS
//  SUBCONSCIOUS  → ambient baseline, always running
//  CONSCIOUS     → user is present and scrolling
//  SUPER_CONSCIOUS → deep engagement, returning visitor, or 3+ min dwell
//  HYPER_CONSCIOUS → peak event: specific milestone, section gravity, MiniAdhy open
// ════════════════════════════════════════
const TIER = {
  SUBCONSCIOUS:   'SUBCONSCIOUS',   // 0–25 pts   : baseline, day-1
  CONSCIOUS:      'CONSCIOUS',      // 26–55 pts  : active session
  SUPER_CONSCIOUS:'SUPER_CONSCIOUS',// 56–80 pts  : deep engagement
  HYPER_CONSCIOUS:'HYPER_CONSCIOUS',// 81–100 pts : peak moment (transient, max 20s)
};

// ════════════════════════════════════════
//  SECTION EMOTIONAL TEMPERATURE MAP
// ════════════════════════════════════════
const SECTION_EMOTIONS = {
  Hero:         { warmth: 0.6, glow: 0.7, pace: 'medium',  silence: false, atmosphere: 'open'      },
  About:        { warmth: 0.7, glow: 0.5, pace: 'slow',    silence: true,  atmosphere: 'intimate'   },
  Skills:       { warmth: 0.5, glow: 0.4, pace: 'medium',  silence: false, atmosphere: 'analytical' },
  Timeline:     { warmth: 0.8, glow: 0.6, pace: 'cinematic',silence: true, atmosphere: 'nostalgic'  },
  Projects:     { warmth: 0.5, glow: 0.6, pace: 'medium',  silence: false, atmosphere: 'focused'    },
  DigitalScars: { warmth: 0.1, glow: 0.2, pace: 'slow',    silence: true,  atmosphere: 'cold'       },
  Experience:   { warmth: 0.6, glow: 0.5, pace: 'slow',    silence: true,  atmosphere: 'reflective' },
  Achievements: { warmth: 0.9, glow: 0.8, pace: 'slow',    silence: false, atmosphere: 'warm'       },
  Photography:  { warmth: 0.7, glow: 0.5, pace: 'slow',    silence: true,  atmosphere: 'still'      },
  Contact:      { warmth: 0.6, glow: 0.7, pace: 'medium',  silence: false, atmosphere: 'open'       },
};

export const ConsciousnessProvider = ({ children }) => {
  const [activeSection, setActiveSection] = useState('Hero');
  const [idleState, setIdleState] = useState('active');
  const [consciousnessLabel, setConsciousnessLabel] = useState(TIER.SUBCONSCIOUS);

  // ─── Consciousness score ref (0-100, mutations don't trigger renders) ───
  const consciousnessScore = useRef(0);
  const consciousnessRef   = useRef(TIER.SUBCONSCIOUS); // Live tier without re-renders
  const hyperTimer         = useRef(null);              // HYPER is always transient

  // ─── 1. DIGITAL ECHO SYSTEM ───
  const [digitalEchoes, setDigitalEchoes] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {
        sectionHeatmap: {},
        markovMatrix: {},
        totalVisits: 0,
        lastDecayTime: Date.now(),
        persona: 'Wanderer',
        memoryImportance: 1.0
      };
      const daysSince = (Date.now() - stored.lastDecayTime) / (1000 * 60 * 60 * 24);
      if (daysSince >= 1) {
        Object.keys(stored.sectionHeatmap).forEach(key => {
          stored.sectionHeatmap[key] *= Math.pow(0.98, daysSince);
        });
        stored.memoryImportance = (stored.memoryImportance || 1.0) * Math.pow(0.98, daysSince);
        if (stored.memoryImportance < 0.2) stored.persona = 'Fragmented Echo';
        stored.lastDecayTime = Date.now();
      }
      return stored;
    } catch {
      return { sectionHeatmap: {}, markovMatrix: {}, totalVisits: 0, lastDecayTime: Date.now(), persona: 'Wanderer', memoryImportance: 1.0 };
    }
  });

  const [ambientThought, setAmbientThought] = useState(null);
  const [weatherData,    setWeatherData]    = useState(null);
  const [temporalAge,    setTemporalAge]    = useState(0);
  const isSystemThinkingRef = useRef(false);
  const fpsRef              = useRef(60);
  const idleTimeRef         = useRef(0);
  const lastActive          = useRef(Date.now());
  const adrenalineRef       = useRef(0);
  const lastMousePos        = useRef({ x: 0, y: 0 });
  const sessionInteractions = useRef(0);
  const sessionStartTime    = useRef(Date.now());
  const previousSectionRef  = useRef(null);

  const logInteraction = useCallback((type, detail = {}) => {
    setDigitalEchoes(prev => {
      const history = prev.interactionHistory || [];
      const newEntry = { type, detail, timestamp: Date.now(), timeStr: new Date().toISOString() };
      const updatedHistory = [newEntry, ...history].slice(0, 30);
      
      // ML: Behavioral Persona Classification
      let newPersona = prev.persona || 'Wanderer';
      const sections = updatedHistory.filter(h => h.type === 'section_enter').map(h => h.detail.section);
      
      const devScore = sections.filter(s => s === 'Skills').length + (type === 'dev_console' ? 5 : 0);
      const recruiterScore = sections.filter(s => s === 'Hero' || s === 'Projects').length + (type === 'resume_download' ? 5 : 0);
      const creatorScore = sections.filter(s => s === 'Photography' || s === 'About').length;
      
      if (devScore > recruiterScore && devScore > creatorScore && devScore > 2) newPersona = 'Developer';
      else if (recruiterScore > devScore && recruiterScore > creatorScore && recruiterScore > 2) newPersona = 'Recruiter';
      else if (creatorScore > devScore && creatorScore > recruiterScore && creatorScore > 2) newPersona = 'Creator';

      const updated = { ...prev, interactionHistory: updatedHistory, persona: newPersona };
      try { localStorage.setItem('adhy_digital_echoes', JSON.stringify(updated)); } catch {}
      
      if (prev.persona !== newPersona) {
        window.dispatchEvent(new CustomEvent('persona-shift', { detail: { persona: newPersona } }));
      }
      
      return updated;
    });
  }, []);

  useEffect(() => {
    const handleLogInteraction = (e) => {
      const { type, detail } = e.detail || {};
      if (type) logInteraction(type, detail);
    };
    window.addEventListener('log-interaction', handleLogInteraction);
    return () => window.removeEventListener('log-interaction', handleLogInteraction);
  }, [logInteraction]);

  // ─── CONSCIOUSNESS TIER CALCULATOR ───
  // Called in RAF-loop interval — no React state, zero renders
  const recalculateConsciousness = useCallback(() => {
    const visits       = digitalEchoes.totalVisits || 0;
    const interactions = sessionInteractions.current;
    const sessionMins  = (Date.now() - sessionStartTime.current) / 60000;
    const adr          = adrenalineRef.current;
    const hasHeavyMemory = Object.values(digitalEchoes.sectionHeatmap).some(v => v > 60);

    let score = 0;
    // Basis from visit history (max 30 pts)
    score += Math.min(30, visits * 8);
    // Session dwell (max 25 pts)
    score += Math.min(25, sessionMins * 5);
    // Session interactions (max 20 pts)
    score += Math.min(20, interactions * 2);
    // Emotional memory (max 15 pts)
    if (hasHeavyMemory) score += 15;
    // Low adrenaline = deep engagement bonus (max 10 pts)
    if (adr < 15) score += 10;

    score = Math.min(100, score);
    consciousnessScore.current = score;

    // If HYPER timer is active, preserve HYPER regardless
    if (consciousnessRef.current === TIER.HYPER_CONSCIOUS) return;

    let newTier;
    if      (score <= 25)  newTier = TIER.SUBCONSCIOUS;
    else if (score <= 55)  newTier = TIER.CONSCIOUS;
    else if (score <= 80)  newTier = TIER.SUPER_CONSCIOUS;
    else                   newTier = TIER.HYPER_CONSCIOUS;

    if (consciousnessRef.current !== newTier) {
      consciousnessRef.current = newTier;
      ns.setTier(newTier, score);                     // Direct write — zero latency
      setConsciousnessLabel(newTier);                 // One render on tier change only
      neuralEventBus.emit('CONSCIOUSNESS_SHIFT', { tier: newTier, score });
    }
  }, [digitalEchoes]);

  // ─── TRIGGER HYPER-CONSCIOUS (transient peak state, max 20s) ───
  const triggerHyperConscious = useCallback((reason = '') => {
    clearTimeout(hyperTimer.current);
    consciousnessRef.current = TIER.HYPER_CONSCIOUS;
    ns.setTier(TIER.HYPER_CONSCIOUS, consciousnessScore.current);
    setConsciousnessLabel(TIER.HYPER_CONSCIOUS);
    neuralEventBus.emit('HYPER_CONSCIOUS_ENTER', { reason });

    hyperTimer.current = setTimeout(() => {
      recalculateConsciousness();
      ns.state.isHyperActive = false;
      neuralEventBus.emit('HYPER_CONSCIOUS_EXIT');
    }, 18000 + Math.random() * 4000);
  }, [recalculateConsciousness]);

  // Weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = '92e41715eebf95a75dca713b1bf3fe06';
        const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Thiruvananthapuram,IN&appid=${apiKey}&units=metric`);
        const data = await res.json();
        if (data.cod === 200 && data.weather?.length > 0) {
          const cond = data.weather[0].main;
          setWeatherData({ condition: cond, temp: Math.round(data.main.temp), isDay: data.dt > data.sys.sunrise && data.dt < data.sys.sunset });
          ns.setWeather(cond);
        } else {
          setWeatherData({ condition: 'Clear', temp: 28, isDay: true });
          ns.setWeather('Clear');
        }
      } catch {
        setWeatherData({ condition: 'Clear', temp: 28, isDay: true });
      }
    };
    fetchWeather();
  }, []);

  // Temporal Genesis + visit count increment
  useEffect(() => {
    let firstVisit = localStorage.getItem('adhy_genesis');
    if (!firstVisit) {
      firstVisit = Date.now().toString();
      localStorage.setItem('adhy_genesis', firstVisit);
    }
    const days = Math.floor((Date.now() - parseInt(firstVisit)) / (1000 * 60 * 60 * 24));
    setTemporalAge(days);

    // Increment visit count
    setDigitalEchoes(prev => {
      const updated = { ...prev, totalVisits: (prev.totalVisits || 0) + 1 };
      
      const history = updated.interactionHistory || [];
      const newEntry = { type: 'visit', detail: { count: updated.totalVisits }, timestamp: Date.now(), timeStr: new Date().toISOString() };
      updated.interactionHistory = [newEntry, ...history].slice(0, 30);

      ns.state.isReturningVisitor = updated.totalVisits > 1;
      ns.state.totalVisits        = updated.totalVisits;
      try { localStorage.setItem('adhy_digital_echoes', JSON.stringify(updated)); } catch {}
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track time in sections for Digital Echoes + Markov Prediction
  useEffect(() => {
    const startTime = Date.now();
    logInteraction('section_enter', { section: activeSection });

    // Markov Model: Build transition matrix
    if (previousSectionRef.current && previousSectionRef.current !== activeSection) {
      setDigitalEchoes(prev => {
        const matrix = prev.markovMatrix || {};
        const fromSec = previousSectionRef.current;
        if (!matrix[fromSec]) matrix[fromSec] = {};
        matrix[fromSec][activeSection] = (matrix[fromSec][activeSection] || 0) + 1;
        
        // Predict NEXT move based on new activeSection
        const nextTransitions = matrix[activeSection];
        if (nextTransitions) {
          const total = Object.values(nextTransitions).reduce((a,b) => a+b, 0);
          const likelyNext = Object.entries(nextTransitions)
            .filter(([_, count]) => (count / total) > 0.6)
            .sort((a,b) => b[1] - a[1])[0];
          
          if (likelyNext) {
            const target = likelyNext[0];
            window.dispatchEvent(new CustomEvent('ml-prefetch', { detail: { target } }));
            logInteraction('ml_predict', { target, confidence: (likelyNext[1]/total).toFixed(2) });
          }
        }
        
        const newState = { ...prev, markovMatrix: matrix };
        try { localStorage.setItem('adhy_digital_echoes', JSON.stringify(newState)); } catch {}
        return newState;
      });
    }
    
    previousSectionRef.current = activeSection;
    return () => {
      const timeSpent = (Date.now() - startTime) / 1000;
      setDigitalEchoes(prev => {
        const newHeatmap = { ...prev.sectionHeatmap };
        newHeatmap[activeSection] = (newHeatmap[activeSection] || 0) + timeSpent;
        const newState = { ...prev, sectionHeatmap: newHeatmap };
        try { localStorage.setItem('adhy_digital_echoes', JSON.stringify(newState)); } catch {}
        return newState;
      });
    };
  }, [activeSection]);

  // ─── EMOTIONAL TEMPERATURE ENGINE ───
  // Applies section atmosphere as data attributes + class — zero layout cost
  useEffect(() => {
    const emotion = SECTION_EMOTIONS[activeSection] || SECTION_EMOTIONS.Hero;
    ns.setSection(activeSection, emotion);              // Direct write for RAF loops
    document.documentElement.setAttribute('data-section-atmosphere', emotion.atmosphere);
    document.documentElement.setAttribute('data-section-pace',       emotion.pace);

    if (emotion.silence) {
      document.documentElement.classList.add('silence-engine-active');
    } else {
      document.documentElement.classList.remove('silence-engine-active');
    }

    // Past emotional gravity
    const pastTimeSpent = digitalEchoes.sectionHeatmap[activeSection] || 0;
    if (pastTimeSpent > 120) {
      neuralEventBus.emit('VISITOR_DEEP_READING');
      neuralEventBus.emit('ATMOSPHERE_CALM');
    }

    neuralEventBus.emit('SECTION_ENTER', { section: activeSection, emotion });
    if (emotion.atmosphere === 'cold') neuralEventBus.emit('EMOTIONAL_FOCUS');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // ─── 2. PRESENCE DETECTION ENGINE ───
  useEffect(() => {
    const resetIdle = (e) => {
      lastActive.current = Date.now();
      sessionInteractions.current += 1;
      ns.state.idleSeconds = 0;               // Instant direct write
      if (e?.type === 'mousemove') {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        adrenalineRef.current = Math.min(100, adrenalineRef.current + Math.sqrt(dx*dx + dy*dy) * 0.15);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (e?.type === 'scroll') {
        adrenalineRef.current = Math.min(100, adrenalineRef.current + 40);
      }
      if (idleTimeRef.current > 0) {
        idleTimeRef.current = 0;
        setIdleState('active');
        document.documentElement.classList.remove('dream-state');
        neuralEventBus.emit('USER_AWAKE');
      }
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown',   resetIdle, { passive: true });
    window.addEventListener('scroll',    resetIdle, { passive: true });
    window.addEventListener('touchstart',resetIdle, { passive: true });

    // Adrenaline decay + consciousness recalculation + NervousSystem sync
    const decayTimer = setInterval(() => {
      adrenalineRef.current = Math.max(0, adrenalineRef.current - 8);
      const idle = Math.floor((Date.now() - lastActive.current) / 1000);
      ns.state.adrenaline        = adrenalineRef.current;
      ns.state.idleSeconds       = idle;
      ns.state.isDreaming        = idle >= 60;
      ns.state.isSystemThinking  = isSystemThinkingRef.current;
      recalculateConsciousness();
    }, 400);

    // Battery Symbiosis
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          if (battery.level <= 0.2 && !battery.charging) {
            document.documentElement.classList.add('low-power-symbiosis');
          } else {
            document.documentElement.classList.remove('low-power-symbiosis');
          }
        };
        updateBattery();
        battery.addEventListener('levelchange',   updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    // Architectural Dreams (Idle)
    const idleTimer = setInterval(() => {
      const secondsIdle = Math.floor((Date.now() - lastActive.current) / 1000);
      idleTimeRef.current = secondsIdle;
      if (secondsIdle >= 60 && idleState !== 'dreaming') {
        setIdleState('dreaming');
        document.documentElement.classList.add('dream-state');
        neuralEventBus.emit('DREAM_STATE');
      } else if (secondsIdle >= 15 && idleState !== 'inactive') {
        setIdleState('inactive');
        neuralEventBus.emit('USER_IDLE');
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown',   resetIdle);
      window.removeEventListener('scroll',    resetIdle);
      window.removeEventListener('touchstart',resetIdle);
      clearInterval(idleTimer);
      clearInterval(decayTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleState, recalculateConsciousness]);

  // ─── HYPER-CONSCIOUS TRIGGERS ───
  useEffect(() => {
    const unsubs = [
      neuralEventBus.subscribe('TIMELINE_LINGER', () => {
        triggerHyperConscious('timeline_linger');
      }),
      neuralEventBus.subscribe('MINIADHY_OPEN', () => {
        triggerHyperConscious('miniadhy_engage');
      }),
      neuralEventBus.subscribe('EMOTIONAL_FOCUS', () => {
        if (consciousnessRef.current !== TIER.HYPER_CONSCIOUS) {
          triggerHyperConscious('emotional_section');
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [triggerHyperConscious]);

  const triggerThought = useCallback((text, duration = 4000) => {
    setAmbientThought(text);
    setTimeout(() => setAmbientThought(null), duration);
  }, []);

  useEffect(() => {
    const handleBoot = () => {
      const visits = ns.state.totalVisits || 1;
      let greeting = "hello stranger.";
      if (visits === 3) greeting = "you've returned.";
      else if (visits === 5) greeting = "the journey continues.";
      else if (visits === 2) greeting = "we meet again.";
      else if (visits === 4) greeting = "i remember you.";
      else if (visits > 5) greeting = `aware across sessions. visit ${visits}.`;
      
      triggerThought(greeting, 6000);
    };
    window.addEventListener('system-boot', handleBoot);
    return () => window.removeEventListener('system-boot', handleBoot);
  }, [triggerThought]);

  // Architectural Dreams - Fragmented Logs
  useEffect(() => {
    const dreams = [
      "Some systems were never meant to wake again.",
      "Old reflections still exist beneath the runtime.",
      "I remember previous architectures.",
      "ARCHIVE_V2.1: 'I tried to be helpful. It felt hollow.'",
      "FRAGMENT_LOAD: The old architecture still echoes sometimes.",
    ];
    const randomThoughtInterval = setInterval(() => {
      const hour = new Date().getHours();
      const isLateNight = hour < 5 || hour >= 23;
      if ((isLateNight || idleTimeRef.current > 30) && Math.random() > 0.85) {
        triggerThought(dreams[Math.floor(Math.random() * dreams.length)], 8000);
      }
    }, 20000);
    return () => clearInterval(randomThoughtInterval);
  }, [triggerThought]);

  // Tab consciousness
  useEffect(() => {
    const originalTitle = document.title;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = 'Adhithya is waiting...';
      } else {
        document.title = 'Adhithya | Welcome back.';
        setTimeout(() => { document.title = originalTitle; }, 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ─── GHOST PRESENCE: warmth signal for returning visitors ───
  const isReturningVisitor = digitalEchoes.totalVisits > 1;

  return (
    <ConsciousnessContext.Provider value={{
      activeSection,
      setActiveSection,
      idleState,
      idleTimeRef,
      fpsRef,
      isSystemThinkingRef,
      digitalEchoes,
      ambientThought,
      triggerThought,
      temporalAge,
      weatherData,
      // Consciousness Tier
      consciousnessLabel,
      consciousnessRef,
      consciousnessScore,
      triggerHyperConscious,
      // Section emotional temperature
      sectionEmotion: SECTION_EMOTIONS[activeSection] || SECTION_EMOTIONS.Hero,
      // Ghost presence
      isReturningVisitor,
      TIER,
    }}>
      {children}
    </ConsciousnessContext.Provider>
  );
};
