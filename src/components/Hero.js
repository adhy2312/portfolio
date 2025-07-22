// src/components/Hero.js
import React from 'react';
import './Hero.css';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import ParticlesBackground from './ParticlesBackground';
import dp from '../assets/dp.jpg';

const Hero = () => {
  return (
    <section id="hero">
      <ParticlesBackground />
      <div className="hero-content">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <span className="name">ADHITHYA</span>
        </motion.h1>

        <motion.h2
          className="hero-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <Typewriter
            words={['Photographer', 'Visual Storyteller', 'Editor']}
            loop={false}
            cursor
            cursorStyle="|"
            typeSpeed={80}
            deleteSpeed={40}
            delaySpeed={1500}
          />
        </motion.h2>

        <motion.img
          src={dp}
          alt="Profile"
          className="hero-img"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        />
      </div>
    </section>
  );
};

export default Hero;
