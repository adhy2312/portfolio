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
    role: heroData?.role || "Electronics Engineer | React Developer | IoT Enthusiast",
    bio: heroData?.bio || "Building responsive web apps and IoT solutions with modern tech stacks.",
    techStack: heroData?.techStack || ["React", "Node.js", "Python", "ESP32", "MongoDB"],
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
          background: {
            color: {
              value: "#000000",
            },
          },
          fpsLimit: 60, // Lowered from 120 for better performance
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: "push",
              },
              onHover: {
                enable: window.innerWidth > 768, // Disable on hover for mobile
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 2, // Reduced from 4
              },
              repulse: {
                distance: 100, // Reduced from 200
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.15, // Reduced opacity
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 0.8, // Slightly slower for smoother feel
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: window.innerWidth > 768 ? 40 : 20, // Reduced from 80
            },
            opacity: {
              value: 0.2, // Reduced opacity
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 2 }, // Smaller max size
            },
          },
          detectRetina: false, // Disabled retina detection for performance
        }}
      />

      <div className="hero-minimal-content optimize-gpu">
        <motion.h1 
          className="hero-name-giant metallic-reveal"
          initial="visible"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {(displayData.name || "ADHITHYA MOHAN").split(" ").map((word, wordIdx) => (
            <span key={wordIdx} className="hero-name-word">
              {word.split("").map((char, charIdx) => (
                <motion.span
                  key={charIdx}
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                  }}
                  transition={{ duration: 0.05 }}
                  className="metallic-char"
                >
                  {char}
                </motion.span>
              ))}
              {/* Add space between words */}
              {wordIdx === 0 && <span className="hero-name-spacer">&nbsp;</span>}
            </span>
          ))}
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
