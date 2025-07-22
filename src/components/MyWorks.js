import React from 'react';
import './MyWorks.css';
import { motion } from 'framer-motion';

const works = [
  {
    title: 'Portfolio Website',
    description: 'A fully animated photography portfolio using React, Framer Motion, and styled for elegance.',
    link: '#',
  },
  {
    title: 'Photo Story Series',
    description: 'A visual storytelling project capturing human emotion and urban silence through street photography.',
    link: '#',
  },
  {
    title: 'Lighting System (IoT)',
    description: 'An ESP32-based smart lighting system reacting to ambient light conditions using LDR.',
    link: '#',
  },
];

const MyWorks = () => {
  return (
    <section className="myworks" id="works">
      <h2 className="works-title">My Works</h2>
      <div className="works-grid">
        {works.map((work, index) => (
          <motion.div
            className="work-card"
            key={index}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
          >
            <h3>{work.title}</h3>
            <p>{work.description}</p>
            <a href={work.link} className="work-link" target="_blank" rel="noopener noreferrer">
              View Project
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default MyWorks;
