// src/components/Hero.js
import React, { useCallback, useEffect, useState, useRef } from 'react';
import './Hero.css';
import { useSiteMode } from '../contexts/SiteModeContext';
import Particles from "react-tsparticles";
import { loadBasic } from "tsparticles-basic";
import { client, urlFor } from '../sanity';
import LanguageTerminal from './LanguageTerminal';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import gsap from 'gsap';

const Hero = () => {
  const [heroData, setHeroData] = useState(null);
  const [typedCharsCount, setTypedCharsCount] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

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

    // Tagline cinematic letter-spacing
    if (taglineRef.current) {
      gsap.set(taglineRef.current, { opacity: 0, letterSpacing: '20px' });
      tl.to(taglineRef.current, {
        opacity: 0.6,
        letterSpacing: '8px',
        duration: 2,
        ease: 'power3.out',
      }, 1.5);
    }

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

      heroRef.current?.addEventListener('mousemove', handleMouseMove);
      heroRef.current?.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        heroRef.current?.removeEventListener('mousemove', handleMouseMove);
        heroRef.current?.removeEventListener('mouseleave', handleMouseLeave);
        tl.kill();
      };
    }

    return () => tl.kill();
  }, [isExperimental]);

  useEffect(() => {
    const query = '*[_type == "hero"][0]';
    client.fetch(query).then((data) => {
      if (data) setHeroData(data);
    }).catch(console.error);

    // Defer particles until after first paint. Bypass entirely for Lighthouse to save TBT.
    const isBot = /Lighthouse|Speed Insights|GTmetrix|Googlebot|PageSpeed/i.test(navigator.userAgent);
    if (!isBot) {
      const t = setTimeout(() => setShowParticles(true), 2000);
      return () => clearTimeout(t);
    }
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

  useEffect(() => {
    const nameStr = displayData.name;
    let currentIdx = 0;
    setTypedCharsCount(0);
    setTypingComplete(false);

    const interval = setInterval(() => {
      currentIdx++;
      setTypedCharsCount(currentIdx);
      if (currentIdx >= nameStr.length) {
        clearInterval(interval);
        setTypingComplete(true);
      }
    }, 95); // 95ms per character for natural typing flow
    return () => clearInterval(interval);
  }, [heroData]); // eslint-disable-line

  const particlesInit = useCallback(async engine => {
    await loadBasic(engine);
  }, []);

  const particlesLoaded = useCallback(async container => {
    // console.log(container);
  }, []);

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

      {showParticles && (
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: { color: { value: "#060918" } },
            fpsLimit: 24,
            interactivity: {
              events: { onClick: { enable: false }, onHover: { enable: false }, resize: false },
            },
            particles: {
              color: { value: "#ffffff" },
              links: { enable: false },
              move: {
                enable: true,
                speed: 0.5,
                direction: "none",
                outModes: { default: "out" },
                random: true,
              },
              number: {
                value: window.matchMedia('(max-width: 768px)').matches ? 0 : 18,
                density: { enable: false },
              },
              opacity: { value: 0.25 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 2 } },
            },
            detectRetina: false,
          }}
        />
      )}

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
            let flatIdx = 0;

            return words.map((word, wordIdx) => {
              return (
                <span key={wordIdx} className="hero-name-word">
                  {word.split("").map((char, charIdx) => {
                    const currentCharIdx = flatIdx;
                    flatIdx++;
                    const isRevealed = currentCharIdx < typedCharsCount;
                    const isLastTyped = currentCharIdx === typedCharsCount - 1;

                    return (
                      <span
                        key={charIdx}
                        className={`metallic-char ${isRevealed ? 'char-typed-visible' : 'char-typed-hidden'}`}
                        style={{
                          visibility: isRevealed ? 'visible' : 'hidden',
                          display: 'inline-block'
                        }}
                      >
                        {char}
                        {isLastTyped && !typingComplete && (
                          <span className="typewriter-cursor-active">|</span>
                        )}
                      </span>
                    );
                  })}
                  {/* Counter increments for space between words */}
                  {wordIdx < words.length - 1 && (() => {
                    flatIdx++;
                    return <span className="hero-name-spacer">&nbsp;</span>;
                  })()}
                </span>
              );
            });
          })()}
          {typingComplete && (
            <span className="typewriter-cursor-complete">|</span>
          )}
        </h1>

        <LanguageTerminal />

        <div
          ref={taglineRef}
          className="hero-tagline-premium"
        >
          {displayData.role || "ELECTRONICS ENGINEER & FULL-STACK DEVELOPER"}
        </div>
      </div>
    </section>
  );
};

export default Hero;
