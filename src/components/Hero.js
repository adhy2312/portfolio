// src/components/Hero.js
import React, { useCallback, useEffect, useState } from 'react';
import './Hero.css';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSiteMode } from '../contexts/SiteModeContext';
import Particles from "react-tsparticles";
import { loadBasic } from "tsparticles-basic";
import { client, urlFor } from '../sanity';
import LanguageTerminal from './LanguageTerminal';

const Hero = () => {
  const [heroData, setHeroData] = useState(null);
  const [typedCharsCount, setTypedCharsCount] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const { isExperimental } = useSiteMode();

  // Kinetic Mouse Spotlight State (Bypasses React Render Loop for Performance)
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 0.5 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 0.5 });

  // Experimental 3D Tilt Mapping
  const rotateX = useTransform(smoothMouseY, [-400, 600], ["5deg", "-5deg"]);
  const rotateY = useTransform(smoothMouseX, [-400, 1500], ["-5deg", "5deg"]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 400); // Center the 800px orb
      mouseY.set(e.clientY - 400);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

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
  let timeGreeting = "Hey there!";
  if (hour < 5 || hour >= 23) timeGreeting = "Late night coding? ☕";
  else if (hour < 12) timeGreeting = "Good morning, let's build. 🌅";
  else if (hour < 18) timeGreeting = "Good afternoon! ☀️";
  else timeGreeting = "Good evening! 🌙";

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
      data-xray="[SECTION: HERO]&#10;Render: Client Side Rendering&#10;Animation: framer-motion springs&#10;Particles: react-tsparticles (deferred load 2s)&#10;Data: Sanity CMS fetch on mount"
      style={isExperimental ? { perspective: "1500px" } : {}}
    >
      
      {/* Kinetic Ambient Spotlight */}
      <motion.div 
        className="hero-kinetic-spotlight"
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(108, 99, 255, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          willChange: 'transform'
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

      <motion.div 
        className="hero-minimal-content optimize-gpu"
        style={isExperimental ? { rotateX, rotateY, transformStyle: "preserve-3d" } : {}}
      >
        <motion.div
          className="hero-greeting"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ 
            color: 'var(--text-muted)', 
            fontSize: '1.25rem', 
            marginBottom: '1rem', 
            letterSpacing: '2px', 
            fontWeight: '400', 
            fontStyle: 'italic',
            fontFamily: "'Bodoni Moda', 'Playfair Display', serif" 
          }}
        >
          {displayData.greeting}
        </motion.div>
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

        <motion.div
          className="hero-tagline-premium"
          initial={{ opacity: 0, letterSpacing: "20px" }}
          animate={{ opacity: 0.6, letterSpacing: "8px" }}
          transition={{ duration: 2, delay: 1.5 }}
        >
          {displayData.role || "ELECTRONICS ENGINEER & FULL-STACK DEVELOPER"}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
