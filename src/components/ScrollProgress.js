import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollProgress.css';

gsap.registerPlugin(ScrollTrigger);

// Driven by GSAP ScrollTrigger — zero React re-renders, GPU accelerated
const ScrollProgress = () => {
  const barRef = useRef(null);

  useEffect(() => {
    if (!barRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(barRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3 // slight smoothing
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="scroll-progress-track">
      <div 
        ref={barRef} 
        className="scroll-progress-bar" 
        style={{ transform: 'scaleX(0)', transformOrigin: 'left center', width: '100%' }} 
      />
    </div>
  );
};

export default ScrollProgress;
