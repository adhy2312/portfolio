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

const PhotoCard = ({ photo, index, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="photo-item"
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      viewport={{ once: true }}
      onClick={onClick}
    >
      <div className="photo-inner">
        {!isLoaded && <div className="photo-shimmer-loader" />}
        <img 
          src={photo.src} 
          alt={photo.alt} 
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.7s ease' }}
          loading="lazy"
          decoding="async"
        />
        <div className="photo-overlay" style={{ opacity: isLoaded ? undefined : 0 }}>
          <span className="photo-category">{photo.category}</span>
          <span className="photo-caption">{photo.caption}</span>
          <FiZoomIn size={22} className="photo-zoom-icon" />
        </div>
      </div>
    </motion.div>
  );
};

const Photography = () => {
  const [lightbox, setLightbox] = useState(null);
  const [fetchedPhotos, setFetchedPhotos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

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
    })
    .catch(console.error)
    .finally(() => setLoadingData(false));
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
          {loadingData ? (
            Array(3).fill(null).map((_, i) => (
              <div className="photo-item" key={`skeleton-${i}`}>
                <div className="photo-inner">
                  <div className="photo-shimmer-loader" />
                </div>
              </div>
            ))
          ) : (
            displayPhotos.map((photo, index) => (
              <PhotoCard
                key={index}
                photo={photo}
                index={index}
                onClick={() => setLightbox(photo)}
              />
            ))
          )}
        </div>

        <motion.div
          className="photo-ig-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <a
            href="https://instagram.com/zoomout_frames"
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
