import React, { useEffect, useRef } from 'react';
import './HowIThink.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Typography from './motion/Typography';

gsap.registerPlugin(ScrollTrigger);

const THOUGHTS = [
  {
    headline: "I believe software should feel alive.",
    subline: ""
  },
  {
    headline: "I optimize for systems, not features.",
    subline: "Features break. Architectures evolve."
  },
  {
    headline: "Photography isn't about the camera.",
    subline: "It's about the eye behind the lens. Blurring the line between capturing reality and generating the impossible with AI."
  }
];

export default function HowIThink() {
  const sectionRef = useRef(null);
  const thoughtsRef = useRef([]);

  useEffect(() => {
    if (!sectionRef.current) return;
    
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ctx = gsap.context(() => {
      // Create a pinned timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=300%", // 300% of viewport height (100% per thought)
          pin: true,
          scrub: 1, // Smooth scrubbing
        }
      });

      // Animate each thought sequentially
      thoughtsRef.current.forEach((thoughtEl, index) => {
        if (!thoughtEl) return;

        // Enter
        tl.fromTo(thoughtEl, 
          { opacity: 0, y: 50, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' }
        );

        // Hold
        tl.to(thoughtEl, { duration: 0.5 }); // Keep it on screen

        // Exit (for all thoughts)
        tl.to(thoughtEl, {
          opacity: 0,
          y: -50,
          scale: 1.05,
          duration: 1,
          ease: 'power2.in'
        });
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="how-i-think-section" ref={sectionRef} id="how-i-think">
      <div className="hit-bg-glow" />
      <div className="hit-container">
        
        <div className="section-label" style={{ position: 'absolute', top: '10vh', left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }}>
          {"// philosophy"}
        </div>

        <div className="hit-thoughts-wrapper">
          {THOUGHTS.map((thought, i) => (
            <div 
              key={i} 
              className="hit-thought" 
              ref={el => thoughtsRef.current[i] = el}
              style={{ zIndex: THOUGHTS.length - i }}
            >
              <Typography as="h2" variant="mask" className="hit-headline" text={thought.headline} />
              {thought.subline && (
                <Typography as="p" variant="split" className="hit-subline" text={thought.subline} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
