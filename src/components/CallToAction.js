import React from 'react';
import './CallToAction.css';
import { motion } from 'framer-motion';

const CallToAction = () => {
  const handleClick = (e) => {
    e.preventDefault();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="cta-section">
      <div className="container">
        <motion.div
          className="cta-inner"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Background decoration */}
          <div className="cta-bg-orb cta-orb-1" />
          <div className="cta-bg-orb cta-orb-2" />

          <span className="cta-eyebrow">Available for work</span>
          <h2 className="cta-title">
            Ready to Build
            <br />
            <span>Something Great?</span>
          </h2>
          <p className="cta-desc">
            Whether it's a startup idea, a freelance project, or a full-time role —
            let's connect and make it happen.
          </p>

          <div className="cta-actions">
            <motion.a
              href="#contact"
              className="btn-primary cta-btn"
              onClick={handleClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Start a Conversation →
            </motion.a>
            <a href="/resume.pdf" download className="btn-outline cta-btn">
              Download Resume
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
