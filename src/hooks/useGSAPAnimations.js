/**
 * useGSAPAnimations.js — Centralized GSAP Scroll Animation Engine
 * 
 * Provides buttery-smooth scroll-triggered animations using GSAP ScrollTrigger.
 * Replaces per-component Framer Motion whileInView with a unified, GPU-optimized
 * animation pipeline that produces smooth, editorial-grade motion.
 *
 * Architecture:
 *   - Single ScrollTrigger.batch for stagger efficiency
 *   - GPU-friendly transforms only (no layout triggers)
 *   - Mobile-aware: reduced motion on touch devices
 *   - Integrates with Lenis smooth scrolling
 */

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Shared Config ──────────────────────────────────────
const EASE_BUTTER = 'power4.out';
const EASE_ELASTIC = 'elastic.out(1, 0.5)';
const EASE_EXPO = 'expo.out';

const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const prefersReducedMotion = () => 
  typeof window !== 'undefined' && 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Fade-Up Animation (Most Common) ───────────────────
export function useFadeUp(options = {}) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    
    const el = ref.current;
    const {
      y = 80,
      duration = 1.2,
      delay = 0,
      stagger = 0,
      children = false,
    } = options;

    const targets = children ? el.children : el;
    
    gsap.set(targets, { 
      y, 
      opacity: 0,
      willChange: 'transform, opacity'
    });

    const anim = gsap.to(targets, {
      y: 0,
      opacity: 1,
      duration: isMobile() ? duration * 0.7 : duration,
      delay,
      stagger: stagger || (children ? 0.08 : 0),
      ease: EASE_BUTTER,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 20%',
        toggleActions: 'play none none none',
        once: true,
      },
      onComplete: () => {
        gsap.set(targets, { willChange: 'auto' });
      }
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── Reveal Animation (Clip-path wipe) ─────────────────
export function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const el = ref.current;
    const { duration = 1.4, delay = 0, direction = 'left' } = options;

    const clipPaths = {
      left:   { from: 'inset(0 100% 0 0)', to: 'inset(0 0% 0 0)' },
      right:  { from: 'inset(0 0 0 100%)', to: 'inset(0 0 0 0%)' },
      top:    { from: 'inset(100% 0 0 0)', to: 'inset(0% 0 0 0)' },
      bottom: { from: 'inset(0 0 100% 0)', to: 'inset(0 0 0% 0)' },
    };

    const clip = clipPaths[direction] || clipPaths.left;

    gsap.set(el, { clipPath: clip.from, opacity: 0 });

    const anim = gsap.to(el, {
      clipPath: clip.to,
      opacity: 1,
      duration,
      delay,
      ease: EASE_EXPO,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── Stagger Grid (Cards, Achievements, etc.) ───────────
export function useStaggerGrid(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const el = ref.current;
    const {
      selector = ':scope > *',
      y = 60,
      scale = 0.95,
      duration = 0.9,
      stagger = 0.1,
    } = options;

    const children = el.querySelectorAll(selector);
    if (!children.length) return;

    gsap.set(children, { 
      y, 
      opacity: 0, 
      scale,
      willChange: 'transform, opacity'
    });

    const anim = gsap.to(children, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: isMobile() ? duration * 0.7 : duration,
      stagger,
      ease: EASE_BUTTER,
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
      },
      onComplete: () => {
        gsap.set(children, { willChange: 'auto' });
      }
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── Parallax Drift (Subtle depth illusion) ─────────────
export function useParallax(speed = 0.15) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || isMobile() || prefersReducedMotion()) return;

    const el = ref.current;
    
    const anim = gsap.to(el, {
      y: () => speed * ScrollTrigger.maxScroll(window) * 0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [speed]);

  return ref;
}

// ─── Magnetic Hover (Premium button effect) ─────────────
export function useMagneticHover(strength = 0.3) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || isMobile() || prefersReducedMotion()) return;

    const el = ref.current;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: EASE_ELASTIC,
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return ref;
}

// ─── Text Split Reveal (Character-by-character) ─────────
export function useTextSplitReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const el = ref.current;
    const { duration = 0.8, stagger = 0.02, delay = 0 } = options;

    // Split text into spans
    const text = el.textContent;
    el.innerHTML = '';
    const chars = text.split('').map(char => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity';
      el.appendChild(span);
      return span;
    });

    gsap.set(chars, { y: 40, opacity: 0, rotateX: -90 });

    const anim = gsap.to(chars, {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration,
      stagger,
      delay,
      ease: EASE_BUTTER,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
      onComplete: () => {
        chars.forEach(c => c.style.willChange = 'auto');
      }
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── Section Header (Orchestrated multi-element reveal) ─
export function useSectionHeader() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const el = ref.current;
    const label = el.querySelector('.section-label');
    const title = el.querySelector('.section-title');
    const divider = el.querySelector('.section-divider');
    const desc = el.querySelector('.section-desc');

    const elements = [label, title, divider, desc].filter(Boolean);
    
    gsap.set(elements, { y: 30, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      }
    });

    elements.forEach((elem, i) => {
      tl.to(elem, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: EASE_BUTTER,
      }, i * 0.12);
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── Counter Animation (Numeric count-up) ───────────────
export function useCountUp(target, options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const { duration = 2, suffix = '' } = options;
    const numTarget = parseInt(target, 10);
    if (isNaN(numTarget)) return;

    const obj = { val: 0 };

    const anim = gsap.to(obj, {
      val: numTarget,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
      onUpdate: () => {
        el.textContent = Math.round(obj.val) + suffix;
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── Smooth Scale-In (for images / hero elements) ───────
export function useScaleIn(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const el = ref.current;
    const { duration = 1.4, delay = 0, from = 0.85 } = options;

    gsap.set(el, { scale: from, opacity: 0 });

    const anim = gsap.to(el, {
      scale: 1,
      opacity: 1,
      duration,
      delay,
      ease: EASE_BUTTER,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── Horizontal Slide (slide from left/right) ───────────
export function useSlideIn(direction = 'left', options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const el = ref.current;
    const { duration = 1.2, delay = 0 } = options;
    const x = direction === 'left' ? -80 : 80;

    gsap.set(el, { x, opacity: 0 });

    const anim = gsap.to(el, {
      x: 0,
      opacity: 1,
      duration,
      delay,
      ease: EASE_BUTTER,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

// ─── GSAP Refresh Hook (call after lazy-loaded content) ─
export function useGSAPRefresh() {
  return useCallback(() => {
    ScrollTrigger.refresh();
  }, []);
}

// ─── Master Init (call once in App.js to wire Lenis) ────
export function initGSAPScrollProxy(lenisInstance) {
  if (!lenisInstance) return;

  // Sync Lenis scroll position with GSAP ScrollTrigger
  lenisInstance.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenisInstance.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

export { gsap, ScrollTrigger };
