import React, { useEffect, useState, useRef } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './DigitalSoul.css';

const DigitalSoul = () => {
  const { idleState } = useConsciousness();
  const soulRef = useRef(null);
  
  // Use refs for positions to avoid re-renders
  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
  const requestRef = useRef();
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isMoving = useRef(false);
  const idleTimeout = useRef(null);

  const isMobileRef = useRef(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  const mobileTargetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    if (isMobileRef.current) {
      // On mobile, it acts autonomously since there is no cursor to watch
      const driftInterval = setInterval(() => {
        mobileTargetRef.current = {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight
        };
      }, 5000); // Pick a new target every 5 seconds
      return () => clearInterval(driftInterval);
    } else {
      const handleMouseMove = (e) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
        isMoving.current = true;
        
        clearTimeout(idleTimeout.current);
        idleTimeout.current = setTimeout(() => {
          isMoving.current = false;
        }, 2000);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  useEffect(() => {
    const animate = () => {
      // Calculate new target
      let newTargetX = targetRef.current.x;
      let newTargetY = targetRef.current.y;

      if (isMobileRef.current) {
        newTargetX = posRef.current.x + (mobileTargetRef.current.x - posRef.current.x) * 0.005;
        newTargetY = posRef.current.y + (mobileTargetRef.current.y - posRef.current.y) * 0.005;
      } else if (isMoving.current) {
        const dx = mouseRef.current.x - posRef.current.x;
        const dy = mouseRef.current.y - posRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          newTargetX = posRef.current.x - (dx * 0.05);
          newTargetY = posRef.current.y - (dy * 0.05);
        } else {
          newTargetX += (Math.random() - 0.5) * 2;
          newTargetY += (Math.random() - 0.5) * 2;
        }
      } else {
        const time = Date.now() * 0.001;
        const orbitX = Math.cos(time) * 40;
        const orbitY = Math.sin(time * 1.5) * 40;
        
        newTargetX = mouseRef.current.x + orbitX;
        newTargetY = mouseRef.current.y + orbitY;
      }

      newTargetX = Math.max(20, Math.min(window.innerWidth - 20, newTargetX));
      newTargetY = Math.max(20, Math.min(window.innerHeight - 20, newTargetY));

      targetRef.current = { x: newTargetX, y: newTargetY };

      // Interpolate position
      const ease = isMoving.current ? 0.02 : 0.04;
      posRef.current.x += (targetRef.current.x - posRef.current.x) * ease;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * ease;

      // Apply directly to DOM
      if (soulRef.current) {
        soulRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

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
