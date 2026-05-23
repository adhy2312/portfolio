import React, { useEffect } from 'react';
import './StoryModal.css';
import { PortableText } from '@portabletext/react';
import { motion, AnimatePresence } from 'framer-motion';

const StoryModal = ({ story, onClose }) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!story) return null;

  return (
    <AnimatePresence>
      <div className="story-modal-overlay" onClick={onClose}>
        <motion.div 
          className="story-modal-content"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="story-modal-close" onClick={onClose} aria-label="Close">✕</button>
          
          <div className="story-modal-header">
            <span className="story-modal-badge">Behind the scenes</span>
            <h3 className="story-modal-title">{story.title}</h3>
          </div>
          
          <div className="story-modal-body">
            <PortableText value={story.story} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StoryModal;
