import React from 'react';
import './Testimonials.css';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: '-',
    role: '-',
    feedback:
      "-",
  },
  {
    name: '_',
    role: '-',
    feedback:
      "-",
  },
  {
    name: '-',
    role: '-',
    feedback:
      "-",
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials" id="testimonials">
      <h2 className="testimonials-title">Testimonials</h2>
      <div className="testimonials-grid">
        {testimonials.map((t, index) => (
          <motion.div
            className="testimonial-card"
            key={index}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.3 }}
            viewport={{ once: true }}
          >
            <p className="feedback">“{t.feedback}”</p>
            <h4 className="name">{t.name}</h4>
            <p className="role">{t.role}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
