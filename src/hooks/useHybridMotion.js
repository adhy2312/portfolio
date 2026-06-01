import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import ns from '../core/NervousSystem';

gsap.registerPlugin(ScrollTrigger);

/**
 * useHybridMotion.js — The Unified Physics & Animation Loop Engine
 * 
 * Synchronizes Lenis (smooth scrolling), Custom Physics (RAF), and GSAP
 * onto a single, perfectly coordinated gsap.ticker loop.
 * This completely eliminates layout thrashing and stutter.
 */
export function useHybridMotion() {
  const lenisRef = useRef(null);
  
  // Expose scroll velocity and current scroll for our custom physics components
  const scrollData = useRef({ current: 0, target: 0, velocity: 0 });

  useEffect(() => {
    // 1. Initialize High-Performance Lenis
    const lenis = new Lenis({
      lerp: 0.1, 
      wheelMultiplier: 0.8,
      smoothWheel: true,
      syncTouch: true
    });
    lenisRef.current = lenis;

    // 2. Sync GSAP ScrollTrigger purely to Lenis
    lenis.on('scroll', ScrollTrigger.update);

    // 3. THE UNIFIED LOOP (The "Brain" of the hybrid system)
    const updateEngine = (time, deltaTime) => {
      // Tick Lenis forward
      lenis.raf(time);
      
      // Cache physics data so child components (like VelocityText) 
      // can read it without interrogating the DOM
      scrollData.current.velocity = lenis.velocity;
      scrollData.current.current = lenis.scroll;
    };

    // Add our unified engine to the central NervousSystem brain.
    // Setting priority to CRITICAL ensures scroll physics never drop even if system is fatigued.
    ns.register('hybridMotion', updateEngine, { priority: 'CRITICAL' });

    return () => {
      ns.unregister('hybridMotion');
      lenis.destroy();
    };
  }, []);

  return { lenisRef, scrollData };
}
