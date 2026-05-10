import React, { useState, useEffect } from 'react';
import './Photography.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZoomIn, FiInstagram } from 'react-icons/fi';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';
import { client, urlFor } from '../sanity';

const photos = [
  { src: photo1, alt: 'Urban Landscape', caption: 'City Geometry', category: 'Urban' },
  { src: photo2, alt: 'Portrait Shot', caption: 'Golden Portrait', category: 'Portrait' },
  { src: photo3, alt: 'Nature Capture', caption: 'Nature Silence', category: 'Nature' },
];

const Photography = () => {
  const [lightbox, setLightbox] = useState(null);
  const [fetchedPhotos, setFetchedPhotos] = useState([]);

  useEffect(() => {
    const query = '*[_type == "photo"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) {
        const formattedData = data.map(item => ({
          src: item.image ? urlFor(item.image).url() : "https://via.placeholder.com/600",
          alt: item.title || "Photography",
          caption: item.title || "Story",
          category: item.category || "Urban"
        }));
        setFetchedPhotos(formattedData);
      }
    }).catch(console.error);
  }, []);

  const displayPhotos = fetchedPhotos.length > 0 ? fetchedPhotos : photos;

  return (
    <section className="photography" id="photography">
      <div className="container">
        <motion.div
          className="photo-header"
          initial={{ opacity: 1, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// through the lens</span>
          <h2 className="section-title" data-hover="Lens Work">
            <span className="section-title-inner">Visual <span>Stories</span></span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            Photography is how I slow down and see the world differently — one frame at a time.
          </p>
        </motion.div>

        <div className="photo-masonry">
          {displayPhotos.map((photo, index) => (
            <motion.div
              className="photo-item"
              key={index}
              initial={{ opacity: 1, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              onClick={() => setLightbox(photo)}
            >
              <div className="photo-inner">
                <img src={photo.src} alt={photo.alt} />
                <div className="photo-overlay">
                  <span className="photo-category">{photo.category}</span>
                  <span className="photo-caption">{photo.caption}</span>
                  <FiZoomIn size={22} className="photo-zoom-icon" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="photo-ig-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <a
            href="https://instagram.com/zoomout_images"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <FiInstagram style={{ marginRight: '6px' }} /> See More on Instagram
          </a>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={lightbox.src}
              alt={lightbox.alt}
              className="lightbox-img"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Photography;
