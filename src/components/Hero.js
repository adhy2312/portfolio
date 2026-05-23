// src/components/Hero.js
import React, { useCallback, useEffect, useState } from 'react';
import './Hero.css';
import { motion } from 'framer-motion';
import Particles from "react-tsparticles";
import { loadBasic } from "tsparticles-basic";
import { client, urlFor } from '../sanity';
import LanguageTerminal from './LanguageTerminal';

const Hero = () => {
  const [heroData, setHeroData] = useState(null);
  const [typedCharsCount, setTypedCharsCount] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const query = '*[_type == "hero"][0]';
    client.fetch(query).then((data) => {
      if (data) setHeroData(data);
    }).catch(console.error);

    // Defer particles until after first paint
    const t = setTimeout(() => setShowParticles(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const displayData = {
    greeting: heroData?.greeting || "Hey there!",
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
  }, [displayData.name]); // eslint-disable-line

  const particlesInit = useCallback(async engine => {
    await loadBasic(engine);
  }, []);

  const particlesLoaded = useCallback(async container => {
    // console.log(container);
  }, []);

  return (
    <section id="hero" className="hero-minimal">
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

      <div className="hero-minimal-content optimize-gpu">
        <h1 className="hero-name-giant metallic-reveal" aria-label={displayData.name}>
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
                        aria-hidden="true"
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
      </div>
    </section>
  );
};

export default Hero;
