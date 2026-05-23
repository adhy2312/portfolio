import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { client } from '../sanity';
import './QuoteCanvas.css';

const QuoteCanvas = () => {
  const [quoteData, setQuoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = '*[_type == "quoteCanvas" && isActive == true][0]';
    client.fetch(query).then((data) => {
      setQuoteData(data);
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error fetching quote:', err);
      setIsLoading(false);
    });
  }, []);

  // If loading, don't render anything yet
  if (isLoading) return null;

  // Use sanity data if available, otherwise use default fallback
  const displayData = quoteData || { quoteText: 'Today builds tomorrow', author: null };

  return (
    <section className="quote-canvas-section">
      <div className="quote-canvas-container">
        <motion.div 
          className="quote-paper"
          initial={{ opacity: 0, y: 40, rotate: -3 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1, type: "spring", stiffness: 40 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className="quote-content">
            <h3 className="quote-text">"{displayData.quoteText}"</h3>
            {displayData.author && (
              <p className="quote-author">{displayData.author}</p>
            )}
          </div>
          
          {/* Aesthetic tape corners */}
          <div className="tape tape-top-left"></div>
          <div className="tape tape-bottom-right"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default QuoteCanvas;
