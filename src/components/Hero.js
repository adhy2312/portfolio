// src/components/Hero.js — V200
import React, { useEffect, useState, useRef } from 'react';
import './Hero.css';
import { useSiteMode } from '../contexts/SiteModeContext';
import { client, urlFor } from '../sanity';
import LanguageTerminal from './LanguageTerminal';

import { motionTokens } from '../core/MotionGovernance';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EntropyText from './motion/EntropyText';
import LiquidText from './motion/LiquidText';
import ExpertDoc from './ExpertDoc';

gsap.registerPlugin(TextPlugin, ScrollTrigger);

/* ── Live Kerala Clock (IST = UTC+5:30) ── */
const KeralaTime = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const format = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const h = ist.getHours().toString().padStart(2, '0');
      const m = ist.getMinutes().toString().padStart(2, '0');
      const s = ist.getSeconds().toString().padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    format();
    const id = setInterval(format, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-time-badge">
      <span className="hero-time-dot" />
      <span className="hero-time-text">Kerala, IST</span>
      <span className="hero-time-clock">{time}</span>
    </div>
  );
};

const Hero = () => {
  const [heroData, setHeroData] = useState(null);

  const { isExperimental } = useSiteMode();
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const greetingRef = useRef(null);

  // GSAP Hero Entrance Timeline
  useEffect(() => {
    if (!contentRef.current) return;

    let handleMouseMove;
    let handleMouseLeave;
    const el = heroRef.current;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      // Greeting slide-in + Typewriter
      if (greetingRef.current) {
        const fullText = greetingRef.current.getAttribute('data-text');
        gsap.set(greetingRef.current, { opacity: 1, y: 0, text: "" });
        tl.to(greetingRef.current, {
          text: {
            value: fullText,
            delimiter: ""
          },
          duration: Math.max(1.2, fullText.length * 0.05),
          ease: 'none',
        }, 0.4);
      }

      // Split Text Reveal for Name using motionTokens
      const chars = document.querySelectorAll('.char-typed-hidden');
      if (chars.length > 0) {
        gsap.set(chars, { opacity: 0, y: 50 });
        tl.to(chars, {
          opacity: 1,
          y: 0,
          duration: motionTokens.duration.enter,
          stagger: motionTokens.stagger.fast,
          ease: 'back.out(1.7)'
        }, 0.6);
      }

      // Scroll Parallax
      gsap.to(contentRef.current, {
        y: 150,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // 3D tilt on experimental mode (GSAP-powered)
      if (isExperimental && contentRef.current) {
        // Use quickTo for high-performance mouse tracking instead of parsing a new tween every frame
        const xTo = gsap.quickTo(contentRef.current, "rotateY", { duration: 0.8, ease: "power2.out" });
        const yTo = gsap.quickTo(contentRef.current, "rotateX", { duration: 0.8, ease: "power2.out" });

        handleMouseMove = (e) => {
          const rect = el?.getBoundingClientRect();
          if (!rect) return;
          const xPct = (e.clientX - rect.left) / rect.width - 0.5;
          const yPct = (e.clientY - rect.top) / rect.height - 0.5;

          xTo(xPct * 10);
          yTo(yPct * -10);
        };

        handleMouseLeave = () => {
          gsap.to(contentRef.current, {
            rotateX: 0,
            rotateY: 0,
            duration: 1.2,
            ease: 'elastic.out(1, 0.5)',
          });
        };

        el?.addEventListener('mousemove', handleMouseMove);
        el?.addEventListener('mouseleave', handleMouseLeave);
      }
    }, heroRef);

    return () => {
      ctx.revert();
      if (handleMouseMove) el?.removeEventListener('mousemove', handleMouseMove);
      if (handleMouseLeave) el?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isExperimental, heroData?.role]);

  useEffect(() => {
    const query = '*[_type == "hero"][0]';
    client.fetch(query).then((data) => {
      if (data) setHeroData(data);
    }).catch(console.error);
  }, []);

  const hour = new Date().getHours();
  let timeGreeting = "Welcome.";
  if (hour < 5 || hour >= 23)  timeGreeting = "Still here at this hour.";
  else if (hour < 12)          timeGreeting = "The morning is early yet.";
  else if (hour < 18)          timeGreeting = "Afternoon — a good time to explore.";
  else                         timeGreeting = "The day is winding down.";

  const displayData = {
    greeting: timeGreeting,
    name: heroData?.name || "Adhithya Mohan",
    heading: heroData?.heading || "Full-Stack Developer & Creator",
    role: heroData?.role || "Electronics Engineer | Web Developer | Photographer",
    bio: heroData?.bio || "Building responsive web apps and IoT solutions with modern tech stacks.",
    techStack: heroData?.techStack || ["React", "Node.js", "Python", "STM32", "SupaBase"],
    resumeUrl: heroData?.resumeUrl || "#",
    heroImage: heroData?.heroImage ? urlFor(heroData.heroImage).url() : null
  };



  return (
    <section 
      id="hero" 
      className="hero-minimal" 
      ref={heroRef}
      data-xray="[SECTION: HERO]&#10;Render: Client Side Rendering&#10;Animation: GSAP ScrollTrigger + springs&#10;Particles: react-tsparticles (deferred load 2s)&#10;Data: Sanity CMS fetch on mount"
      style={isExperimental ? { perspective: "1500px" } : {}}
    >
      <ExpertDoc 
        title="Hero.js"
        notes="High-performance entrance layer."
        data={{
          'rendering': 'Client Side',
          'animationEngine': 'GSAP ScrollTrigger',
          'particles': 'Pure CSS (No WebGL)',
          'contentFetch': 'Sanity CMS (Deferred)',
          'motionTokens': 'useGSAPAnimations()',
          '3dDistortion': isExperimental
        }}
      />
      
      {/* V200: Richer CSS Particles — mix of brutalist shapes */}
      <div className="hero-css-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="css-star" style={{
            '--top':   `${Math.random() * 100}%`,
            '--left':  `${Math.random() * 100}%`,
            '--dur':   `${5 + Math.random() * 6}s`,
            '--delay': `${Math.random() * 3}s`,
            '--size':  `${10 + Math.random() * 14}px`,
          }} />
        ))}
      </div>

      <div 
        ref={contentRef}
        className="hero-minimal-content optimize-gpu"
        style={isExperimental ? { transformStyle: "preserve-3d" } : {}}
      >
        {/* V200 — Top status row: greeting + availability + clock */}
        <div className="hero-top-row">
          <div className="hero-greeting-wrapper">
            <div
              ref={greetingRef}
              className="hero-greeting"
              data-text={displayData.greeting}
            >
              {/* Initially empty, GSAP will fill it */}
            </div>
            <span className="typewriter-cursor-complete" style={{ marginLeft: '4px', fontSize: '1.1rem', color: 'var(--accent-brutal-pink)' }}>_</span>
          </div>
          <div className="hero-status-row">
            <div className="hero-availability-badge">
              <span className="avail-pulse-dot" />
              <span>Available for Work</span>
            </div>
            <KeralaTime />
          </div>
        </div>
        <LiquidText>
          <h1 className="hero-name-giant metallic-reveal">
            {(() => {
              const nameStr = displayData.name;
              const words = nameStr.split(" ");
              return words.map((word, wordIdx) => {
                return (
                  <span key={wordIdx} className="hero-name-word">
                    {word.split("").map((char, charIdx) => (
                      <span
                        key={charIdx}
                        className="metallic-char char-typed-hidden"
                        style={{ display: 'inline-block' }}
                      >
                        {char}
                      </span>
                    ))}
                    {wordIdx < words.length - 1 && (
                      <span className="hero-name-spacer">&nbsp;</span>
                    )}
                  </span>
                );
              });
            })()}
          </h1>
        </LiquidText>


        <LanguageTerminal />

        <div className="hero-tagline-premium">
          <EntropyText text={displayData.role || "ELECTRONICS ENGINEER & FULL-STACK DEVELOPER"} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
