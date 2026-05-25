import React, { useEffect, useState, useRef } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './DigitalSoul.css';

const DigitalSoul = () => {
  const { idleState, mood } = useConsciousness();
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [target, setTarget] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
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
      setTarget(prevTarget => {
        let newX = prevTarget.x;
        let newY = prevTarget.y;

        if (isMobileRef.current) {
          // Autonomous slow drift for mobile
          newX = position.x + (mobileTargetRef.current.x - position.x) * 0.005;
          newY = position.y + (mobileTargetRef.current.y - position.y) * 0.005;
        } else if (isMoving.current) {
          // Desktop: If user is moving, soul shyly keeps its distance
          const dx = mouseRef.current.x - position.x;
          const dy = mouseRef.current.y - position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 200) {
            newX = position.x - (dx * 0.05);
            newY = position.y - (dy * 0.05);
          } else {
            newX += (Math.random() - 0.5) * 2;
            newY += (Math.random() - 0.5) * 2;
          }
        } else {
          // Desktop: If user is still, soul curiously approaches the cursor
          const time = Date.now() * 0.001;
          const orbitX = Math.cos(time) * 40;
          const orbitY = Math.sin(time * 1.5) * 40;
          
          newX = mouseRef.current.x + orbitX;
          newY = mouseRef.current.y + orbitY;
        }

        // Keep within bounds
        newX = Math.max(20, Math.min(window.innerWidth - 20, newX));
        newY = Math.max(20, Math.min(window.innerHeight - 20, newY));

        return { x: newX, y: newY };
      });

      setPosition(prev => {
        // Easing interpolation for smooth, organic floating
        const ease = isMoving.current ? 0.02 : 0.04;
        return {
          x: prev.x + (target.x - prev.x) * ease,
          y: prev.y + (target.y - prev.y) * ease
        };
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [target.x, target.y, position.x, position.y]);

  return (
    <div 
      className={`digital-soul ${idleState === 'dreaming' ? 'soul-dreaming' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      <div className="soul-core" />
      <div className="soul-aura" />
    </div>
  );
};

export default DigitalSoul;
