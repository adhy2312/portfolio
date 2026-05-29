/**
 * GravityWell.js — "Scroll Terminus" Interactive Effect
 * 
 * MASHUP: Gravity Well + Signal Decay
 * 
 * Particles begin scattered and pulsing in morse-code-like rhythms (alive, 
 * transmitting). As the user scrolls, they converge toward a central gravity 
 * point while their pulses slow and fade — the signal decays into silence.
 * The final state is a single quiet glow: all energy collapsed, all noise gone.
 * 
 * Architecture:
 *   - Pure DOM (~25 divs with will-change: transform) — no canvas
 *   - GSAP ScrollTrigger scrub for butter-smooth scroll binding
 *   - Morse-code pulse via GSAP timelines (independent per particle)
 *   - Mouse repulsion with elastic snap-back (desktop)
 *   - GPU-only transforms (translate3d, scale, opacity)
 *   - Mobile: reduced count, no mouse interaction
 */

import React, { useEffect, useRef, useState } from 'react';
import './GravityWell.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ACCENT_COLORS = [
  '#6C63FF', '#4FC3F7', '#F5A623', '#00E5A0', '#FF6B9D',
  '#A78BFA', '#F43F5E', '#34D399', '#818CF8', '#FFD93D',
];

// Morse-code-like pulse patterns (dot=short, dash=long, gap=pause)
const MORSE_PATTERNS = [
  [0.15, 0.1, 0.15, 0.3, 0.4],       // ··−
  [0.4, 0.15, 0.15, 0.3],             // −·
  [0.15, 0.15, 0.15, 0.5],            // ···
  [0.4, 0.4, 0.15, 0.2],              // −−·
  [0.15, 0.4, 0.15, 0.3],             // ·−·
  [0.4, 0.15, 0.4, 0.2],              // −·−
  [0.15, 0.15, 0.4, 0.4],             // ··−
  [0.4, 0.4, 0.4, 0.3],               // −−−
];

function generateParticles(count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const radius = 130 + Math.random() * 300;
    particles.push({
      id: i,
      startX: Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
      startY: Math.sin(angle) * radius + (Math.random() - 0.5) * 60,
      size: 3 + Math.random() * 5,
      color: ACCENT_COLORS[i % ACCENT_COLORS.length],
      delay: Math.random() * 0.4,
      floatSpeed: 3 + Math.random() * 4,
      floatAmplitude: 4 + Math.random() * 12,
      morsePattern: MORSE_PATTERNS[i % MORSE_PATTERNS.length],
      morseOffset: Math.random() * 2, // Desynchronize pulses
    });
  }
  return particles;
}

const PARTICLE_COUNT = 26;

const GravityWell = () => {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const particleRefs = useRef([]);
  const pulseTimelines = useRef([]);
  const textRef = useRef(null);
  const subtextRef = useRef(null);
  const glowRef = useRef(null);
  const lineRef = useRef(null);
  const progressRef = useRef(0);

  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  const count = isMobile ? 14 : PARTICLE_COUNT;
  const particles = useRef(generateParticles(count)).current;

  // ═══ Morse-Code Pulse Timelines (independent, looping) ═══
  useEffect(() => {
    if (!particleRefs.current.length) return;

    const timelines = [];

    particleRefs.current.forEach((el, i) => {
      if (!el) return;
      const p = particles[i];
      const pulseEl = el.querySelector('.particle-pulse-ring');

      // Build a morse-code timeline for this particle
      const tl = gsap.timeline({ repeat: -1, delay: p.morseOffset });

      p.morsePattern.forEach((duration) => {
        const isPulse = duration < 0.25; // Short = dot pulse, long = dash pulse

        // Pulse: scale up + glow, then back
        tl.to(el, {
          scale: isPulse ? 1.8 : 2.4,
          opacity: 1,
          duration: duration * 0.4,
          ease: 'power2.out',
        });

        // Glow ring expands
        if (pulseEl) {
          tl.to(pulseEl, {
            scale: isPulse ? 2 : 3.5,
            opacity: isPulse ? 0.5 : 0.7,
            duration: duration * 0.4,
            ease: 'power2.out',
          }, '<');
        }

        // Decay back
        tl.to(el, {
          scale: 1,
          opacity: 0.5,
          duration: duration * 0.6,
          ease: 'power2.in',
        });

        if (pulseEl) {
          tl.to(pulseEl, {
            scale: 1,
            opacity: 0,
            duration: duration * 0.6,
            ease: 'power2.in',
          }, '<');
        }

        // Gap between signals
        tl.to({}, { duration: 0.15 + Math.random() * 0.2 });
      });

      timelines.push(tl);
    });

    pulseTimelines.current = timelines;

    return () => {
      timelines.forEach(tl => tl.kill());
    };
  }, [particles]);

  // ═══ Main Scroll Convergence + Signal Decay ═══
  useEffect(() => {
    if (!sectionRef.current || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Set initial scattered positions
      particleRefs.current.forEach((el, i) => {
        if (!el) return;
        const p = particles[i];
        gsap.set(el, {
          x: p.startX,
          y: p.startY,
          opacity: 0.5,
        });
      });

      // Scroll-scrubbed convergence timeline
      const convergeTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 1.5,
          onUpdate: (self) => {
            progressRef.current = self.progress;

            // Signal Decay: slow down and fade pulse timelines as scroll progresses
            const speed = 1 - self.progress * 0.95; // 1.0 → 0.05
            const pulseOpacity = 1 - self.progress;

            pulseTimelines.current.forEach(tl => {
              tl.timeScale(Math.max(0.05, speed));
              // At >80% progress, pause the pulses entirely (silence)
              if (self.progress > 0.8 && !tl.paused()) {
                tl.pause();
              } else if (self.progress <= 0.8 && tl.paused()) {
                tl.resume();
              }
            });
          }
        }
      });

      // Phase 1: Particles converge (0% → 80%)
      particleRefs.current.forEach((el, i) => {
        if (!el) return;
        const p = particles[i];

        convergeTl.to(el, {
          x: (Math.random() - 0.5) * 8, // Slight jitter at center
          y: (Math.random() - 0.5) * 8,
          scale: 0.5,
          opacity: 0.9,
          duration: 0.7,
          ease: 'power2.inOut',
        }, p.delay * 0.3);
      });

      // Phase 2: Color convergence — all become warm gold
      particleRefs.current.forEach((el, i) => {
        if (!el) return;
        convergeTl.to(el, {
          backgroundColor: '#FFD93D',
          boxShadow: '0 0 8px rgba(255, 217, 61, 0.6)',
          duration: 0.3,
        }, 0.4 + particles[i].delay * 0.2);
      });

      // Phase 3: Final collapse — particles shrink to nothing
      particleRefs.current.forEach((el, i) => {
        if (!el) return;
        convergeTl.to(el, {
          scale: 0,
          opacity: 0,
          duration: 0.2,
          ease: 'power3.in',
        }, 0.75);
      });

      // Center glow: grows as particles arrive
      if (glowRef.current) {
        gsap.set(glowRef.current, { scale: 0.1, opacity: 0 });
        convergeTl.to(glowRef.current, {
          scale: 2,
          opacity: 0.9,
          duration: 0.6,
          ease: 'power2.out',
        }, 0.35);

        // Then softens into a quiet ember
        convergeTl.to(glowRef.current, {
          scale: 0.8,
          opacity: 0.4,
          duration: 0.3,
          ease: 'power2.inOut',
        }, 0.8);
      }

      // Text reveal: fades in at ~60%
      if (textRef.current) {
        gsap.set(textRef.current, { opacity: 0, y: 15, filter: 'blur(8px)' });
        convergeTl.to(textRef.current, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.25,
          ease: 'power4.out',
        }, 0.55);
      }

      if (subtextRef.current) {
        gsap.set(subtextRef.current, { opacity: 0, y: 10 });
        convergeTl.to(subtextRef.current, {
          opacity: 0.5,
          y: 0,
          duration: 0.2,
          ease: 'power4.out',
        }, 0.65);
      }

      // Decorative descent line
      if (lineRef.current) {
        gsap.set(lineRef.current, { scaleY: 0, transformOrigin: 'top center' });
        convergeTl.to(lineRef.current, {
          scaleY: 1,
          duration: 0.3,
          ease: 'power2.out',
        }, 0.75);
      }

      // Gentle floating (ambient, independent of scroll)
      particleRefs.current.forEach((el, i) => {
        if (!el) return;
        const p = particles[i];
        gsap.to(el, {
          y: `+=${p.floatAmplitude}`,
          x: `+=${p.floatAmplitude * 0.3}`,
          duration: p.floatSpeed,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: p.delay,
        });
      });

    }, sectionRef);

    return () => ctx.revert();
  }, [particles, isMobile]);

  // ═══ Mouse Repulsion (desktop only) ═══
  useEffect(() => {
    if (isMobile || !containerRef.current) return;

    const container = containerRef.current;
    const repulsionRadius = 100;
    const repulsionStrength = 40;

    const handleMouseMove = (e) => {
      // Don't repulse when nearly converged
      if (progressRef.current > 0.6) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      particleRefs.current.forEach((el) => {
        if (!el) return;

        const px = gsap.getProperty(el, 'x');
        const py = gsap.getProperty(el, 'y');
        const dx = px - mouseX;
        const dy = py - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulsionRadius && dist > 0) {
          const force = (1 - dist / repulsionRadius) * repulsionStrength;
          const angle = Math.atan2(dy, dx);

          gsap.to(el, {
            x: `+=${Math.cos(angle) * force}`,
            y: `+=${Math.sin(angle) * force}`,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  return (
    <section className="gravity-well-section" ref={sectionRef}>
      <div className="gravity-well-container" ref={containerRef}>

        {/* Particle field */}
        <div className="gravity-well-field">
          {particles.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => (particleRefs.current[i] = el)}
              className="gravity-particle"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}50`,
              }}
            >
              {/* Pulse ring (for morse-code signal visualization) */}
              <div
                className="particle-pulse-ring"
                style={{ borderColor: p.color }}
              />
            </div>
          ))}

          {/* Center gravity point */}
          <div className="gravity-center">
            <div className="gravity-center-dot" />
            <div className="gravity-center-glow" ref={glowRef} />
            <div className="gravity-center-ring" />
          </div>
        </div>

        {/* Convergence text */}
        <div className="gravity-text-container">
          <div className="gravity-text" ref={textRef}>
            Everything converges.
          </div>
          <div className="gravity-subtext" ref={subtextRef}>
            The signal fades. The noise ends. What remains is the seed.
          </div>
        </div>

        {/* Decorative descent line to DigitalSeed */}
        <div className="gravity-descent-line" ref={lineRef} />
      </div>
    </section>
  );
};

export default GravityWell;
