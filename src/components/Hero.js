// src/components/Hero.js
import React, { useCallback, useEffect, useState, useRef } from 'react';
import './Hero.css';
import { useSiteMode } from '../contexts/SiteModeContext';
import { client, urlFor } from '../sanity';
import LanguageTerminal from './LanguageTerminal';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(TextPlugin, ScrollTrigger);

const Hero = () => {
  const [heroData, setHeroData] = useState(null);

  const { isExperimental } = useSiteMode();
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const greetingRef = useRef(null);
  const taglineRef = useRef(null);
  const spotlightRef = useRef(null);

  const orchestrator = useOrchestrator();

  // GSAP Kinetic Spotlight (replaces Framer useMotionValue)
  useEffect(() => {
    if (!orchestrator || !spotlightRef.current) return;
    const tick = (time, delta, mousePos, isMoving, tier) => {
      if (tier === 0) return;
      if (mousePos.x > -500 && spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          x: mousePos.x - 400,
          y: mousePos.y - 400,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };
    orchestrator.subscribeToRAF('hero-spotlight', tick);
    return () => orchestrator.unsubscribeFromRAF('hero-spotlight');
  }, [orchestrator]);

  // GSAP Hero Entrance Timeline
  useEffect(() => {
    if (!contentRef.current) return;

    const tl = gsap.timeline({ delay: 0.3 });

    // Greeting slide-in
    if (greetingRef.current) {
      gsap.set(greetingRef.current, { opacity: 0, y: -20 });
      tl.to(greetingRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power4.out',
      }, 0.4);
    }

    // Tagline cinematic TextPlugin typing
    if (taglineRef.current) {
      gsap.set(taglineRef.current, { opacity: 1 });
      tl.to(taglineRef.current, {
        duration: 2.5,
        text: {
          value: heroData?.role || "ELECTRONICS ENGINEER & FULL-STACK DEVELOPER",
          delimiter: ""
        },
        ease: "none"
      }, 1.5);
    }

    // Split Text Reveal for Name
    const chars = document.querySelectorAll('.char-typed-hidden');
    if (chars.length > 0) {
      gsap.set(chars, { opacity: 0, y: 50 });
      tl.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.03,
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
      const handleMouseMove = (e) => {
        const rect = heroRef.current?.getBoundingClientRect();
        if (!rect) return;
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;

        gsap.to(contentRef.current, {
          rotateX: yPct * -10,
          rotateY: xPct * 10,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(contentRef.current, {
          rotateX: 0,
          rotateY: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.5)',
        });
      };

      const el = heroRef.current;
      el?.addEventListener('mousemove', handleMouseMove);
      el?.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        el?.removeEventListener('mousemove', handleMouseMove);
        el?.removeEventListener('mouseleave', handleMouseLeave);
        tl.kill();
      };
    }

    return () => tl.kill();
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
      
      {/* Kinetic Ambient Spotlight — GSAP driven */}
      <div 
        ref={spotlightRef}
        className="hero-kinetic-spotlight"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(108, 99, 255, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          willChange: 'transform',
          transform: 'translate(-1000px, -1000px)',
        }}
      />

      {/* Pure CSS High-Performance Floating Stars (Replaces heavy WebGL tsparticles) */}
      <div className="hero-css-particles">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="css-star" style={{
            '--top': `${Math.random() * 100}%`,
            '--left': `${Math.random() * 100}%`,
            '--dur': `${4 + Math.random() * 4}s`,
            '--delay': `${Math.random() * 2}s`,
          }} />
        ))}
      </div>

      <div 
        ref={contentRef}
        className="hero-minimal-content optimize-gpu"
        style={isExperimental ? { transformStyle: "preserve-3d" } : {}}
      >
        <div
          ref={greetingRef}
          className="hero-greeting"
        >
          {displayData.greeting}
        </div>
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


        <LanguageTerminal />

        <div
          ref={taglineRef}
          className="hero-tagline-premium"
        >
          {/* TextPlugin will type here */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
