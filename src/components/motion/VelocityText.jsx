import React, { useEffect, useRef, useId } from 'react';
import gsap from 'gsap';
import { lerp, clamp } from '../../utils/mathUtils';
import ns from '../../core/NervousSystem';

/**
 * VelocityText Component
 * 
 * Demonstrates "Velocity-Reactive Typography".
 * As the user scrolls, this component reads the global velocity from the unified loop
 * and physically skews/squishes the text to simulate aerodynamic drag.
 * 
 * Uses gsap.quickSetter for maximum performance (0 layout thrashing).
 */
export default function VelocityText({ text, className = '' }) {
  const textRef = useRef(null);
  const physicsState = useRef({ currentSkew: 0, currentScale: 1 });
  const uniqueId = useId();

  useEffect(() => {
    if (!textRef.current) return;

    // 1. Pre-compile highly optimized setters that target the transform layer directly
    const setSkew = gsap.quickSetter(textRef.current, "skewY", "deg");
    const setScale = gsap.quickSetter(textRef.current, "scaleY", "");

    let lastScrollY = window.scrollY;

    const updatePhysics = (time, delta) => {
      // 2. Read continuous input from the Brain's central scroll tracker
      const currentScrollY = ns.scrollPos;
      const targetVelocity = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      
      // 3. Map velocity to target physics state (capped at 15 degrees)
      const targetSkew = clamp(targetVelocity * 0.8, -15, 15);
      
      // 4. Smooth the physical reaction using a spring-like lerp
      physicsState.current.currentSkew = lerp(
        physicsState.current.currentSkew, 
        targetSkew, 
        0.1 // Stiffness/Resistance
      );

      // Squish the text slightly as it moves fast
      const targetScale = 1 - Math.abs(physicsState.current.currentSkew) * 0.005;
      physicsState.current.currentScale = lerp(
        physicsState.current.currentScale,
        targetScale,
        0.15
      );

      // 5. Batch write to the DOM via quickSetter
      setSkew(physicsState.current.currentSkew);
      setScale(physicsState.current.currentScale);
    };

    // Hook this component's update cycle into the Brain (NORMAL priority)
    // Allows the brain to suspend typography physics if the system overheats
    ns.register(`velocityText-${uniqueId}`, updatePhysics, { priority: 'NORMAL' });

    return () => {
      ns.unregister(`velocityText-${uniqueId}`);
    };
  }, []);

  return (
    <div style={{ perspective: '1000px', display: 'inline-block' }}>
      <h1 
        ref={textRef} 
        className={className}
        style={{ 
          display: 'inline-block', 
          transformOrigin: 'left center',
          willChange: 'transform' // Hint to the browser for GPU layer
        }}
      >
        {text}
      </h1>
    </div>
  );
}
