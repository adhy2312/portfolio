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

  useEffect(() => {
    const query = '*[_type == "hero"][0]';
    client.fetch(query).then((data) => {
      if (data) setHeroData(data);
    }).catch(console.error);
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

  const particlesInit = useCallback(async engine => {
    await loadBasic(engine);
  }, []);

  const particlesLoaded = useCallback(async container => {
    // console.log(container);
  }, []);

  return (
    <section id="hero" className="hero-minimal">
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
            links: { enable: false }, // Disabling links is the biggest perf win
            move: {
              enable: true,
              speed: 0.5,
              direction: "none",
              outModes: { default: "out" },
              random: true,
            },
            number: {
              value: window.innerWidth > 768 ? 18 : 0, // 0 on mobile = no particles
              density: { enable: false },
            },
            opacity: { value: 0.25 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 2 } },
          },
          detectRetina: false,
        }}
      />

      <div className="hero-minimal-content optimize-gpu">
        <motion.h1
          className="hero-name-giant metallic-reveal"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1, // Slower for typewriter feel
                delayChildren: 0.5
              }
            }
          }}
        >
          {(displayData.name || "ADHITHYA MOHAN").split(" ").map((word, wordIdx) => (
            <span key={wordIdx} className="hero-name-word">
              {word.split("").map((char, charIdx) => (
                <motion.span
                  key={charIdx}
                  variants={{
                    hidden: { display: 'none', opacity: 0, x: -10 },
                    visible: { display: 'inline-block', opacity: 1, x: 0 }
                  }}
                  transition={{ duration: 0.1 }}
                  className="metallic-char"
                >
                  {char}
                </motion.span>
              ))}
              {/* Add space between words */}
              {wordIdx === 0 && <span className="hero-name-spacer">&nbsp;</span>}
            </span>
          ))}
          <motion.span
            className="typewriter-cursor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }} // Appear after name finishes roughly
          />
        </motion.h1>

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
