import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { lerp } from '../../utils/mathUtils';

/**
 * MagneticButton Component
 * 
 * An advanced magnetic component using custom spring physics on the GSAP ticker.
 * Instead of snapping purely to the mouse, it feels attached via a digital spring,
 * providing fluid resistance and overshoot when hovering or leaving.
 */
export default function MagneticButton({ children, strength = 0.4, className = '' }) {
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!buttonRef.current || !containerRef.current) return;

    const btn = buttonRef.current;
    
    // 1. High-performance direct access to the DOM's transform matrix
    const setX = gsap.quickSetter(btn, "x", "px");
    const setY = gsap.quickSetter(btn, "y", "px");
    
    let isHovered = false;
    
    // Physics variables (Target = Mouse Pos, Current = Animated Pos)
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMouseMove = (e) => {
      if (!isHovered) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      
      // Calculate where the button *should* go
      targetX = relX * strength;
      targetY = relY * strength;
    };

    const onMouseEnter = () => (isHovered = true);
    const onMouseLeave = () => {
      isHovered = false;
      // When leaving, the target becomes 0 (center)
      targetX = 0;
      targetY = 0;
    };

    const updateMagnet = () => {
      // 2. Custom Spring Physics
      // The element constantly tries to catch up to the target, creating drag
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);
      
      // 3. Optimization: Only write to DOM if moving
      // (prevents thrashing the GPU when idle)
      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        setX(currentX);
        setY(currentY);
      }
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);
    
    // Hook the physics calculation into the global render loop
    gsap.ticker.add(updateMagnet);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      gsap.ticker.remove(updateMagnet);
    };
  }, [strength]);

  return (
    <div 
      ref={containerRef} 
      style={{ padding: '2rem', display: 'inline-block', cursor: 'pointer' }}
      className={className}
    >
      <div 
        ref={buttonRef} 
        style={{ willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  );
}
