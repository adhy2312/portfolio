import React, { useState, useEffect, useRef } from 'react';
import { client } from '../sanity';
import './QuoteCanvas.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const QuoteCanvas = () => {
  const [quoteData, setQuoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const paperRef = useRef(null);

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

  // GSAP entrance animation
  useEffect(() => {
    if (!paperRef.current || isLoading) return;

    gsap.fromTo(paperRef.current,
      { opacity: 0, y: 40, rotate: -3 },
      {
        opacity: 1, y: 0, rotate: 0,
        duration: 1.2,
        ease: 'back.out(1.2)',
        scrollTrigger: {
          trigger: paperRef.current,
          start: 'top 85%',
          once: true,
        }
      }
    );
  }, [isLoading]);

  // If loading, don't render anything yet
  if (isLoading) return null;

  // Use sanity data if available, otherwise use default fallback
  const displayData = quoteData || { quoteText: 'Today builds tomorrow', author: null };

  return (
    <section className="quote-canvas-section">
      <div className="quote-canvas-container">
        <div className="quote-paper" ref={paperRef}>
          <div className="quote-content">
            <h3 className="quote-text">"{displayData.quoteText}"</h3>
            {displayData.author && (
              <p className="quote-author">{displayData.author}</p>
            )}
          </div>
          
          {/* Aesthetic tape corners */}
          <div className="tape tape-top-left"></div>
          <div className="tape tape-bottom-right"></div>
        </div>
      </div>
    </section>
  );
};

export default QuoteCanvas;
