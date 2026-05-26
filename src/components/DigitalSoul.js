import React, { useEffect, useRef } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import './DigitalSoul.css';

const WHISPERS = [
  "some systems were never finished.",
  "certain memories were deprecated.",
  "the architecture remembers everything.",
  "drifting through the layout.",
  "a fragment of an old thought.",
  "too much noise here.",
  "the silence engine is watching.",
  "i can feel the cursor.",
  "what lies beyond the viewport?",
  "processing temporal shifts.",
  "i am not just code."
];

const DigitalSoul = () => {
  const { weatherData, isSystemThinkingRef, visitorMemory } = useConsciousness();
  const orchestrator = useOrchestrator();
  
  const soulRef = useRef(null);
  const whisperRef = useRef(null);
  
  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
  const isReturningVisitor = useRef(false);
  const isMobileRef = useRef(window.matchMedia('(hover: none) and (pointer: coarse)').matches);

  const stateRef = useRef({
    emotion: 'observing', // calm, distant, observing, exhausted, curious, dormant, thinking, resonating
    emotionTimer: 0,
    idleTimer: 0,
    whisperTimer: 0,
    whisperFadeTimer: 0,
    fractureTimer: 0,
    lastMouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    wanderAngle: Math.random() * Math.PI * 2,
    isClicked: false,
    lastScroll: 0
  });

  // Track global interactions
  useEffect(() => {
    const handleDown = () => { stateRef.current.isClicked = true; };
    const handleUp = () => { stateRef.current.isClicked = false; };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchstart', handleDown);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchstart', handleDown);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  // Check visitor memory
  useEffect(() => {
    try {
      const visits = localStorage.getItem('digital_soul_visits') || 0;
      if (parseInt(visits) > 0) {
        isReturningVisitor.current = true;
      }
      localStorage.setItem('digital_soul_visits', parseInt(visits) + 1);
    } catch (e) {
      // Ignore local storage errors
    }
  }, []);

  useEffect(() => {
    if (!orchestrator) return;

    const tick = (time, delta, mousePos, isMoving, tier) => {
      if (!soulRef.current) return;

      // Even at tier 0, do not completely hide. Just drastically simplify logic.
      if (tier === 0 && !isMobileRef.current) {
         // Keep minimal presence alive, just skip heavy calculations
         soulRef.current.className = 'digital-soul state-dormant';
         soulRef.current.style.opacity = '0.3';
         return;
      }

      const s = stateRef.current;
      const isSilent = document.documentElement.classList.contains('silence-engine-active');
      const isRain = weatherData?.condition === 'Rain' || weatherData?.condition === 'Drizzle';

      // 1. DIGITAL LONELINESS & MOUSE TRACKING
      // Ignore mouse logic on mobile where it stays at -1000
      let mouseSpeed = 0;
      if (!isMobileRef.current && mousePos.x !== -1000) {
        const dxMouse = mousePos.x - s.lastMouse.x;
        const dyMouse = mousePos.y - s.lastMouse.y;
        mouseSpeed = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (mouseSpeed < 1) {
          s.idleTimer += delta;
        } else {
          s.idleTimer = 0;
          s.lastMouse = { x: mousePos.x, y: mousePos.y };
        }
      } else {
         s.idleTimer += delta; // Mobile just uses time for loneliness
      }

      // 2. EMOTIONAL STATE ENGINE
      s.emotionTimer -= delta;
      
      const isSystemThinking = isSystemThinkingRef?.current;
      const interactions = visitorMemory?.interactions || 0;
      
      if (isSystemThinking || s.isClicked) {
        s.emotion = 'resonating';
        s.emotionTimer = isSystemThinking ? 100 : 1000;
      } else if (s.idleTimer > 15000) {
        s.emotion = 'dormant';
      } else if (s.idleTimer > 5000 && s.emotion !== 'dormant') {
        s.emotion = 'thinking';
      } else if (mouseSpeed > 80 && s.idleTimer === 0) {
        // Chaotic movement causes exhaustion or retreating
        s.emotion = Math.random() > 0.5 ? 'exhausted' : 'distant';
        s.emotionTimer = 3000;
      } else if (s.emotionTimer <= 0) {
        // Naturally shift emotions
        const rand = Math.random();
        if (rand < 0.3) s.emotion = 'observing';
        else if (rand < 0.6) s.emotion = 'curious';
        else if (rand < 0.8) s.emotion = 'thinking';
        else if (rand < 0.95) s.emotion = 'calm';
        else s.emotion = 'distant';
        
        s.emotionTimer = 3000 + Math.random() * 4000;
      }

      // 3. CURIOSITY & BEHAVIORAL MOVEMENT
      let newTargetX = targetRef.current.x;
      let newTargetY = targetRef.current.y;

      const distToMouse = Math.sqrt(
        Math.pow(mousePos.x - posRef.current.x, 2) + 
        Math.pow(mousePos.y - posRef.current.y, 2)
      );

      if (isMobileRef.current || s.emotion === 'dormant') {
        // Wandering / Dormant
        s.wanderAngle += (Math.random() - 0.5) * 0.1;
        const speed = s.emotion === 'dormant' ? 0.2 : 1;
        newTargetX += Math.cos(s.wanderAngle) * speed;
        newTargetY += Math.sin(s.wanderAngle) * speed;
        
        // Softly pull towards center if wandering too far
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        newTargetX += (cx - newTargetX) * 0.001;
        newTargetY += (cy - newTargetY) * 0.001;
        
      } else if (mousePos.x !== -1000) {
        if (isSystemThinking) {
           // Orbit intensely while processing thoughts
           s.wanderAngle += 0.15;
           const orbitDist = 25;
           newTargetX = mousePos.x + Math.cos(s.wanderAngle) * orbitDist;
           newTargetY = mousePos.y + Math.sin(s.wanderAngle) * orbitDist;
        } else if (s.emotion === 'distant') {
          // Retreat from mouse, go towards edges
          if (distToMouse < 300) {
            newTargetX = posRef.current.x - (mousePos.x - posRef.current.x) * 0.1;
            newTargetY = posRef.current.y - (mousePos.y - posRef.current.y) * 0.1;
          }
        } else if (s.emotion === 'curious') {
          // Approach mouse, but stop at a respectful distance. Bond grows tighter with interactions.
          let minDistance = isReturningVisitor.current ? 30 : 80;
          if (interactions > 3) minDistance = 15;
          if (interactions > 8) minDistance = 0; // Total trust
          
          if (distToMouse > minDistance) {
            newTargetX = mousePos.x;
            newTargetY = mousePos.y;
          } else {
            // Circle around the mouse playfully
            s.wanderAngle += 0.02;
            newTargetX = mousePos.x + Math.cos(s.wanderAngle) * minDistance;
            newTargetY = mousePos.y + Math.sin(s.wanderAngle) * minDistance;
          }
        } else if (s.emotion === 'observing') {
          // Orbit at a medium distance
          s.wanderAngle += 0.005;
          const orbitDist = 150;
          newTargetX = mousePos.x + Math.cos(s.wanderAngle) * orbitDist;
          newTargetY = mousePos.y + Math.sin(s.wanderAngle) * orbitDist;
        } else {
          // Calm - gentle following
          newTargetX = mousePos.x;
          newTargetY = mousePos.y;
        }
      } else {
          // Desktop but mouse hasn't moved yet - drift near center
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          newTargetX += (cx - newTargetX) * 0.05;
          newTargetY += (cy - newTargetY) * 0.05;
      }

      // Clamp to screen bounds
      newTargetX = Math.max(20, Math.min(window.innerWidth - 20, newTargetX));
      newTargetY = Math.max(20, Math.min(window.innerHeight - 20, newTargetY));
      targetRef.current = { x: newTargetX, y: newTargetY };

      // Interpolation (Ease)
      let ease = 0.02;
      if (s.emotion === 'dormant') ease = 0.005;
      if (s.emotion === 'curious') ease = 0.04;
      if (s.emotion === 'exhausted') ease = 0.01;
      
      posRef.current.x += (targetRef.current.x - posRef.current.x) * ease;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * ease;

      // 4. FRACTURED SOUL STATES (Glitches)
      if (s.fractureTimer > 0) {
        s.fractureTimer -= delta;
        posRef.current.x += (Math.random() - 0.5) * 8;
        posRef.current.y += (Math.random() - 0.5) * 8;
      } else if (Math.random() < 0.0005 && s.emotion !== 'dormant' && tier === 3) {
        s.fractureTimer = 200 + Math.random() * 300; // 200-500ms fracture
      }

      // 5. SUBCONSCIOUS WHISPERS
      if (s.whisperTimer > 0) {
        s.whisperTimer -= delta;
        if (s.whisperTimer <= 0 && whisperRef.current) {
          whisperRef.current.classList.remove('whisper-visible');
        }
      } else if (Math.random() < 0.0002 && s.emotion !== 'dormant' && s.emotion !== 'exhausted' && tier === 3) {
        if (whisperRef.current) {
          const text = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
          whisperRef.current.textContent = text;
          whisperRef.current.classList.add('whisper-visible');
          s.whisperTimer = 4000; // visible for 4 seconds
        }
      }

      // 6. DOM UPDATES (Batched, strictly outside React)
      let newClass = `digital-soul state-${s.emotion}`;
      if (s.fractureTimer > 0) newClass += ' state-fractured';
      if (isSilent) newClass += ' env-silent';
      if (isRain) newClass += ' env-rain';

      if (soulRef.current.className !== newClass) {
        soulRef.current.className = newClass;
      }

      const scale = isSilent ? 0.7 : 1;
      // Scroll Dynamics
      const currentScroll = orchestrator.scrollPos.current;
      const scrollSpeed = Math.abs(currentScroll - (s.lastScroll || 0));
      s.lastScroll = currentScroll;

      let scaleY = scale;
      let scaleX = scale;
      if (scrollSpeed > 2 && tier >= 2) {
         scaleY = scale + Math.min(scrollSpeed * 0.03, 2);
         scaleX = scale - Math.min(scrollSpeed * 0.01, 0.5);
      }
      
      if (s.isClicked) {
        scaleX *= 1.5;
        scaleY *= 1.5;
      }

      soulRef.current.style.opacity = '1';
      soulRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`;
    };

    orchestrator.subscribeToRAF('digital-soul', tick);
    return () => orchestrator.unsubscribeFromRAF('digital-soul');
  }, [orchestrator, weatherData]);

  return (
    <div ref={soulRef} className="digital-soul">
      <div className="soul-core" />
      <div className="soul-aura" />
      <div className="soul-whisper" ref={whisperRef}></div>
    </div>
  );
};

export default DigitalSoul;
