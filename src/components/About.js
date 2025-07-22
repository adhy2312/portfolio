import React from 'react';
import './About.css';
import { motion } from 'framer-motion';
import dp from '../assets/dp.jpg';

const About = () => {
  return (
    <section className="about" id="about">
      <motion.div
        className="about-container"
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="about-text">
          <h2 className="about-title">About Me</h2>
          <p>
            I'm <span className="glow">Adhithya Mohan</span>, a passionate photographer and developer who loves telling stories through visuals and code. My goal is to build experiences that not only look stunning but also feel intuitive and alive.
          </p>
          <p>
            With a keen eye for composition and a flair for technology, I combine art and logic to bring ideas to life.
          </p>
          <a href="/resume.pdf" download className="about-button">
            Download Resume
          </a>
        </div>
        <div className="about-image">
          <img src={dp} alt="Profile" />
        </div>
      </motion.div>
    </section>
  );
};

export default About;
