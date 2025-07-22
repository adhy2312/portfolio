import React from 'react';
import './CallToAction.css';
import { motion } from 'framer-motion';
import { Link } from 'react-scroll';

const CallToAction = () => {
  return (
    <section className="cta-section">
      <motion.h2
        className="cta-title"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        Let’s Work Together
      </motion.h2>

      <motion.div
        className="cta-button-wrapper"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Link to="contact" smooth={true} duration={500}>
          <button className="cta-button">Contact Me</button>
        </Link>
      </motion.div>
    </section>
  );
};

export default CallToAction;
