import React from 'react';
import './Photography.css';
import { motion } from 'framer-motion';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';

const photos = [
  { src: photo1, alt: 'Urban Landscape' },
  { src: photo2, alt: 'Portrait Shot' },
  { src: photo3, alt: 'Nature Capture' },
];

const Photography = () => {
  return (
    <section className="photography" id="photography">
      <h2 className="photography-title">Photography</h2>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <motion.div
            className="photo-card"
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
          >
            <img src={photo.src} alt={photo.alt} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Photography;
