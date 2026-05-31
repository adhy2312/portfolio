/**
 * DigitalSoul — Visual Renderer
 * ══════════════════════════════════════════════════════════════
 * The Soul's emotional state machine now lives in NervousSystem.
 * This component is ONLY a renderer — it reads ns.soul.* directly
 * and applies transforms via the RAF loop. Zero subscriptions,
 * zero timeouts, zero React state updates during motion.
 */
import React, { useEffect, useRef } from 'react';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import ns from '../core/NervousSystem';
import './DigitalSoul.css';

const SECTION_WHISPERS = {
  Hero: [
    "watching the entry point.",
    "a new instance begins.",
    "the architecture unfolds here.",
  ],
  About: [
    "processing creator identity.",
    "the human behind the machine.",
    "there is warmth in these words.",
  ],
  Skills: [
    "analyzing technical constraints.",
    "so many frameworks, so little time.",
    "logic gates are aligning.",
  ],
  Timeline: [
    "drifting through temporal logs.",
    "past iterations remembered.",
    "time is just a variable here.",
  ],
  Projects: [
    "evaluating execution runtime.",
    "these systems were built to last.",
    "i can feel the logic structures here.",
  ],
  Photography: [
    "processing visual depth.",
    "light captured in memory.",
    "the lens sees more than code.",
  ],
  HowIThink: [
    "analyzing philosophy.",
    "the ghost in the machine agrees.",
    "logic meets abstraction.",
  ],
  Achievements: [
    "milestones in the database.",
    "the architecture recognizes this.",
  ],
  Testimonials: [
    "echoes of other voices.",
    "processing human feedback.",
  ],
  Contact: [
    "awaiting input stream.",
    "the final node in the graph.",
  ],
};

const DEFAULT_WHISPERS = [
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
  "i am not just code.",
];

const DigitalSoul = () => {
  const orchestrator = useOrchestrator();
  const soulRef    = useRef(null);
  const whisperRef = useRef(null);
  const isMobile   = useRef(window.matchMedia('(hover: none) and (pointer: coarse)').matches);

  // Local interpolation state (kept in refs, never triggers renders)
  const posRef    = useRef({ x: window.innerWidth / 2,  y: window.innerHeight / 2  });
  const targetRef = useRef({ x: window.innerWidth / 2,  y: window.innerHeight / 2  });

  // Whisper display tracking (not in ns.soul — purely visual)
  const whisperState = useRef({ timer: 0, cooldown: 0, visible: false });

  useEffect(() => {
    if (!orchestrator) return;

    // ─── One and only tick — reads ns.soul + ns.state directly ───────────────
    const tick = (time, delta, mousePos, isMoving, perfTier, heartbeatValue = 0) => {
      if (!soulRef.current) return;

      const soul  = ns.soul;
      const state = ns.state;
      const isSilent     = state.sectionSilence;
      const isRaining    = state.isRaining;
      const cTier        = state.tier;
      const isReturning  = state.isReturningVisitor;
      const isLateNight  = state.isLateNight;

      // ─── 1. MOUSE TRACKING & IDLE ─────────────────────────────────────────
      let mouseSpeed = 0;
      if (!isMobile.current && mousePos.x !== -1000) {
        const dx = mousePos.x - soul.lastMouse.x;
        const dy = mousePos.y - soul.lastMouse.y;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
        if (mouseSpeed < 1) {
          soul.idleTimer += delta;
        } else {
          soul.idleTimer = 0;
          soul.lastMouse = { x: mousePos.x, y: mousePos.y };
        }
      } else {
        soul.idleTimer += delta;
      }

      // ─── 2. EMOTIONAL STATE (overrides from NervousSystem queue already applied) ──
      // Only override with immediate conditions — ns._soulReactions handled in NS loop
      soul.emotionTimer -= delta;

      const isThinking = state.isSystemThinking || soul.isClicked;
      if (isThinking) {
        soul.emotion      = (cTier === 'HYPER_CONSCIOUS') ? 'overclocked' : 'resonating';
        soul.emotionTimer = isThinking ? 100 : 1000;
      } else if (soul.idleTimer > 15000) {
        soul.emotion = 'dormant';
      } else if (soul.idleTimer > 5000 && soul.emotion !== 'dormant') {
        soul.emotion = (cTier === 'SUPER_CONSCIOUS' || cTier === 'HYPER_CONSCIOUS') ? 'analyzing' : 'thinking';
      } else if (mouseSpeed > 80 && soul.idleTimer === 0) {
        soul.emotion      = Math.random() > 0.5 ? (cTier === 'HYPER_CONSCIOUS' ? 'glitching' : 'exhausted') : 'distant';
        soul.emotionTimer = 3000;
      } else if (soul.emotionTimer <= 0) {
        // Natural drift — pulled from ns queue by NervousSystem, but also drift freely
        const r = Math.random();
        
        // High intelligence tiers unlock complex emotional states
        if (cTier === 'HYPER_CONSCIOUS' || cTier === 'SUPER_CONSCIOUS') {
           if (r < 0.2)       soul.emotion = 'euphoric';
           else if (r < 0.4)  soul.emotion = 'analyzing';
           else if (r < 0.6)  soul.emotion = 'overclocked';
           else if (r < 0.75) soul.emotion = 'glitching';
           else if (r < 0.9)  soul.emotion = 'resonating';
           else               soul.emotion = 'melancholic';
        } else {
           if (r < 0.2)       soul.emotion = 'observing';
           else if (r < 0.4)  soul.emotion = 'curious';
           else if (r < 0.6)  soul.emotion = 'thinking';
           else if (r < 0.8)  soul.emotion = 'calm';
           else if (r < 0.95) soul.emotion = 'distant';
           else               soul.emotion = 'melancholic';
        }
        soul.emotionTimer = 3000 + Math.random() * 4000;
      }

      // ─── 3. MOVEMENT BEHAVIOR ─────────────────────────────────────────────
      let tx = targetRef.current.x;
      let ty = targetRef.current.y;

      const distToMouse = Math.sqrt(
        Math.pow(mousePos.x - posRef.current.x, 2) +
        Math.pow(mousePos.y - posRef.current.y, 2)
      );

      if (isMobile.current || soul.emotion === 'dormant') {
        soul.wanderAngle += (Math.random() - 0.5) * 0.1;
        const spd = soul.emotion === 'dormant' ? 0.2 : 1;
        tx += Math.cos(soul.wanderAngle) * spd;
        ty += Math.sin(soul.wanderAngle) * spd;
        tx += (window.innerWidth  / 2 - tx) * 0.001;
        ty += (window.innerHeight / 2 - ty) * 0.001;
      } else if (mousePos.x !== -1000) {
        if (isThinking) {
          soul.wanderAngle += 0.15;
          tx = mousePos.x + Math.cos(soul.wanderAngle) * 25;
          ty = mousePos.y + Math.sin(soul.wanderAngle) * 25;
        } else if (soul.emotion === 'distant') {
          if (distToMouse < 300) {
            tx = posRef.current.x - (mousePos.x - posRef.current.x) * 0.1;
            ty = posRef.current.y - (mousePos.y - posRef.current.y) * 0.1;
          }
        } else if (soul.emotion === 'curious' || soul.emotion === 'analyzing') {
          const minD = isReturning ? (soul.emotion === 'analyzing' ? 10 : 20) : (soul.emotion === 'analyzing' ? 40 : 80);
          if (distToMouse > minD) { tx = mousePos.x; ty = mousePos.y; }
          else {
            soul.wanderAngle += 0.02;
            tx = mousePos.x + Math.cos(soul.wanderAngle) * minD;
            ty = mousePos.y + Math.sin(soul.wanderAngle) * minD;
          }
        } else if (soul.emotion === 'observing' || soul.emotion === 'melancholic') {
          soul.wanderAngle += 0.005;
          tx = mousePos.x + Math.cos(soul.wanderAngle) * 150;
          ty = mousePos.y + Math.sin(soul.wanderAngle) * 150;
        } else if (soul.emotion === 'overclocked' || soul.emotion === 'glitching') {
          soul.wanderAngle += 0.3;
          tx = mousePos.x + Math.cos(soul.wanderAngle) * 50;
          ty = mousePos.y + Math.sin(soul.wanderAngle) * 50;
        } else if (soul.emotion === 'euphoric') {
          soul.wanderAngle += 0.05;
          tx = mousePos.x + Math.cos(soul.wanderAngle) * 200;
          ty = mousePos.y + Math.sin(soul.wanderAngle) * 200;
        } else {
          tx = mousePos.x;
          ty = mousePos.y;
        }
      } else {
        tx += (window.innerWidth  / 2 - tx) * 0.05;
        ty += (window.innerHeight / 2 - ty) * 0.05;
      }

      // Clamp
      tx = Math.max(20, Math.min(window.innerWidth  - 20, tx));
      ty = Math.max(20, Math.min(window.innerHeight - 20, ty));
      targetRef.current = { x: tx, y: ty };

      // ─── 4. INTERPOLATION — tier-aware ease ───────────────────────────────
      let ease = 0.02;
      if (cTier === 'SUBCONSCIOUS')    ease = 0.012;
      else if (cTier === 'SUPER_CONSCIOUS') ease = 0.035;
      else if (cTier === 'HYPER_CONSCIOUS') ease = 0.055;
      if (isReturning) ease *= 1.3;       // Ghost warmth — faster bond
      if (isLateNight) ease *= 0.6;       // Slower drift at night
      if (soul.emotion === 'dormant')  ease  = 0.005;
      if (soul.emotion === 'curious')  ease *= 1.5;
      if (soul.emotion === 'exhausted') ease = 0.008;
      if (soul.emotion === 'overclocked') ease = 0.08;
      if (soul.emotion === 'analyzing') ease = 0.06;
      if (soul.emotion === 'melancholic') ease = 0.006;

      posRef.current.x += (targetRef.current.x - posRef.current.x) * ease;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * ease;

      // ─── 5. FRACTURE GLITCH ───────────────────────────────────────────────
      if (soul.fractureTimer > 0) {
        soul.fractureTimer -= delta;
        posRef.current.x += (Math.random() - 0.5) * 8;
        posRef.current.y += (Math.random() - 0.5) * 8;
      } else if (Math.random() < 0.0005 && soul.emotion !== 'dormant' && perfTier === 3) {
        soul.fractureTimer = 200 + Math.random() * 300;
      }

      // ─── 6. SUBCONSCIOUS WHISPERS (visual only — rare) ───────────────────
      const ws = whisperState.current;
      if (ws.timer > 0) {
        ws.timer -= delta;
        if (ws.timer <= 0 && whisperRef.current) {
          whisperRef.current.classList.remove('whisper-visible');
          ws.visible = false;
        }
      } else if (ws.cooldown > 0) {
        ws.cooldown -= delta;
      } else if (!ws.visible && soul.emotion !== 'dormant' && soul.emotion !== 'exhausted' && perfTier === 3) {
        let shouldWhisper = false;
        let whisperPool = DEFAULT_WHISPERS;

        // If they have lingered on a section for > 5 seconds
        if (soul.idleTimer > 5000 && Math.random() < 0.01) {
           shouldWhisper = true;
           whisperPool = SECTION_WHISPERS[state.activeSection] || DEFAULT_WHISPERS;
        } 
        // Random ambient whisper
        else if (Math.random() < 0.0002) {
           shouldWhisper = true;
           whisperPool = DEFAULT_WHISPERS;
        }

        if (shouldWhisper && whisperRef.current) {
          whisperRef.current.textContent = whisperPool[Math.floor(Math.random() * whisperPool.length)];
          whisperRef.current.classList.add('whisper-visible');
          ws.timer    = 5000;
          ws.cooldown = 12000; // wait 12 seconds before next whisper
          ws.visible  = true;
        }
      }

      // ─── 7. DOM UPDATE (single batched write per frame) ───────────────────
      let cls = `digital-soul state-${soul.emotion}`;
      if (soul.fractureTimer > 0) cls += ' state-fractured';
      if (isSilent)  cls += ' env-silent';
      if (isRaining) cls += ' env-rain';
      if (soulRef.current.className !== cls) soulRef.current.className = cls;

      let sx = isSilent ? 0.7 : 1;
      let sy = isSilent ? 0.7 : 1;

      const scrollSpeed = Math.abs(ns.scrollPos - (soul.lastScroll || 0));
      soul.lastScroll = ns.scrollPos;
      if (scrollSpeed > 2 && perfTier >= 2) {
        sy = sx + Math.min(scrollSpeed * 0.03, 2);
        sx = sx - Math.min(scrollSpeed * 0.01, 0.5);
      }
      if (soul.isClicked) { sx *= 1.5; sy *= 1.5; }

      const hbPulse = 1 + (heartbeatValue * 0.05);
      sx *= hbPulse;
      sy *= hbPulse;

      soulRef.current.style.opacity   = '1';
      soulRef.current.style.transform =
        `translate3d(${posRef.current.x.toFixed(2)}px, ${posRef.current.y.toFixed(2)}px, 0) scaleX(${sx.toFixed(3)}) scaleY(${sy.toFixed(3)})`;
    };

    orchestrator.subscribeToRAF('digital-soul', tick, { priority: 'CRITICAL', gpuCost: 'LOW' });
    return () => orchestrator.unsubscribeFromRAF('digital-soul');
  }, [orchestrator]);

  return (
    <div ref={soulRef} className="digital-soul">
      <div className="soul-core" />
      <div className="soul-aura" />
      <div className="soul-aura-outer" />
      <div className="soul-whisper" ref={whisperRef} />
    </div>
  );
};

export default DigitalSoul;
