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

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      isMoving.current = true;
      
      clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => {
        isMoving.current = false;
      }, 2000); // Soul approaches 2 seconds after mouse stops
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const animate = () => {
      // Fluid physics for the soul
      setTarget(prevTarget => {
        let newX = prevTarget.x;
        let newY = prevTarget.y;

        if (isMoving.current) {
          // If user is moving, soul shyly keeps its distance (moves opposite to mouse slightly or drifts)
          const dx = mouseRef.current.x - position.x;
          const dy = mouseRef.current.y - position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 200) {
            newX = position.x - (dx * 0.05);
            newY = position.y - (dy * 0.05);
          } else {
            // Slowly drift randomly
            newX += (Math.random() - 0.5) * 2;
            newY += (Math.random() - 0.5) * 2;
          }
        } else {
          // If user is still, soul curiously approaches the cursor
          // It hovers about 40px away, gently orbiting
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
