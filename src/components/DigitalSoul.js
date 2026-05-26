import React, { useEffect, useRef } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import './DigitalSoul.css';

const DigitalSoul = () => {
  const { idleState } = useConsciousness();
  const orchestrator = useOrchestrator();
  const soulRef = useRef(null);
  
  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isMobileRef = useRef(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  const mobileTargetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    if (isMobileRef.current) {
      const driftInterval = setInterval(() => {
        mobileTargetRef.current = {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight
        };
      }, 5000);
      return () => clearInterval(driftInterval);
    }
  }, []);

  const behaviorRef = useRef({
    state: 'observing',
    timer: 0
  });

  useEffect(() => {
    if (!orchestrator) return;

    const tick = (time, delta, mousePos, isMoving, tier) => {
      if (tier === 0) {
        if (soulRef.current) soulRef.current.style.opacity = '0';
        return;
      }

      // Silence Engine awareness
      const isSilent = document.documentElement.classList.contains('silence-engine-active');
      
      let newTargetX = targetRef.current.x;
      let newTargetY = targetRef.current.y;
      const b = behaviorRef.current;

      if (isMobileRef.current) {
        newTargetX = posRef.current.x + (mobileTargetRef.current.x - posRef.current.x) * 0.005;
        newTargetY = posRef.current.y + (mobileTargetRef.current.y - posRef.current.y) * 0.005;
      } else {
        const dx = mousePos.x - posRef.current.x;
        const dy = mousePos.y - posRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // FALSE AUTONOMY & MICRO-BEHAVIORAL IMMERSION
        if (isMoving && dist > 150) {
          if (b.state === 'observing') {
            b.state = 'hesitating';
            b.timer = time + (Math.random() * 800 + 200); // Hesitate for 200-1000ms
          }
        } else if (!isMoving) {
          b.state = 'observing';
        }

        if (b.state === 'hesitating') {
          if (time > b.timer) {
            b.state = 'following';
          } else {
            // While hesitating, slightly drift away or jitter
            newTargetX += (Math.random() - 0.5) * 1.5;
            newTargetY += (Math.random() - 0.5) * 1.5;
          }
        } 
        
        if (b.state === 'following' || (isMoving && dist <= 150)) {
          // When close or explicitly following, track smoothly
          if (dist < 200) {
            newTargetX = posRef.current.x - (dx * 0.05); // shy away slightly
            newTargetY = posRef.current.y - (dy * 0.05);
          } else {
            newTargetX = mousePos.x;
            newTargetY = mousePos.y;
          }
        } 
        
        if (b.state === 'observing') {
          // Ambient breathing orbit
          const timeSec = time * 0.001;
          const orbitX = Math.cos(timeSec * 0.5) * 60;
          const orbitY = Math.sin(timeSec * 0.8) * 40;
          if (mousePos.x > -500) {
            newTargetX = mousePos.x + orbitX;
            newTargetY = mousePos.y + orbitY;
          }
        }
      }

      newTargetX = Math.max(20, Math.min(window.innerWidth - 20, newTargetX));
      newTargetY = Math.max(20, Math.min(window.innerHeight - 20, newTargetY));

      targetRef.current = { x: newTargetX, y: newTargetY };

      // Organic ease: slower when hesitating/observing, faster when following
      const ease = b.state === 'following' ? 0.03 : 0.01;
      posRef.current.x += (targetRef.current.x - posRef.current.x) * ease;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * ease;

      if (soulRef.current) {
        // Fade out into the background if Silence Engine is active, but don't disappear completely
        soulRef.current.style.opacity = isSilent ? '0.15' : '1';
        soulRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scale(${isSilent ? 0.6 : 1})`;
      }
    };

    orchestrator.subscribeToRAF('digital-soul', tick);
    return () => orchestrator.unsubscribeFromRAF('digital-soul');
  }, [orchestrator]);

  return (
    <div 
      ref={soulRef}
      className={`digital-soul ${idleState === 'dreaming' ? 'soul-dreaming' : ''}`}
      style={{
        transform: `translate3d(${window.innerWidth / 2}px, ${window.innerHeight / 2}px, 0)`
      }}
    >
      <div className="soul-core" />
      <div className="soul-aura" />
    </div>
  );
};

export default DigitalSoul;
