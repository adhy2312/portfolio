import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ns from '../../core/NervousSystem';
import './KineticMarquee.css';

export default function KineticMarquee({ text = "CREATIVE DEVELOPER • FULL STACK ENGINEER • ", baseVelocity = 0.05, className = "" }) {
  const containerRef = useRef(null);
  const xPercent = useRef(0);
  const direction = useRef(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId;
    let isVisible = false;
    let lastScrollY = window.scrollY;

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        lastScrollY = window.scrollY;
        rafId = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(rafId);
      }
    });

    observer.observe(el);

    const setX = gsap.quickSetter(el, "xPercent");
    const setSkew = gsap.quickSetter(el, "skewX", "deg");

    let currentSkew = 0;

    const loop = () => {
      if (!isVisible) return;
      
      const currentScrollY = ns.scrollPos;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Reverse direction based on scroll delta
      if (delta < 0) {
        direction.current = -1;
      } else if (delta > 0) {
        direction.current = 1;
      }
      
      // Calculate velocity multiplier
      const velocity = baseVelocity + Math.abs(delta) * 0.02;

      // Skew physics based on speed
      const targetSkew = Math.min(Math.max(delta * -0.1, -15), 15);
      currentSkew += (targetSkew - currentSkew) * 0.1;

      // Update xPercent
      xPercent.current -= velocity * direction.current;
      
      // Wrap around seamlessly
      if (xPercent.current <= -50) {
        xPercent.current = 0;
      } else if (xPercent.current > 0) {
        xPercent.current = -50;
      }

      setX(xPercent.current);
      setSkew(currentSkew);
      
      rafId = requestAnimationFrame(loop);
    };

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [baseVelocity]);

  return (
    <div className={`kinetic-marquee-wrapper ${className}`}>
      <div 
        ref={containerRef} 
        className="kinetic-marquee-track"
      >
        <div className="kinetic-marquee-content">
          <h1>{text}</h1>
          <h1>{text}</h1>
          <h1>{text}</h1>
          <h1>{text}</h1>
        </div>
        <div className="kinetic-marquee-content">
          <h1>{text}</h1>
          <h1>{text}</h1>
          <h1>{text}</h1>
          <h1>{text}</h1>
        </div>
      </div>
    </div>
  );
}
