import React, { useState, useEffect, useRef } from 'react';
import { client } from '../sanity';
import './QuoteCanvas.css';
import gsap from 'gsap';

const QuoteCanvas = () => {
  const [quoteData, setQuoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef(null);

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

  // 3D Magnetic Tilt Effect
  useEffect(() => {
    if (!containerRef.current || isLoading) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const el = containerRef.current;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation. Reverse polarity: hover top -> pulls top towards you
      const rotateX = ((y - centerY) / centerY) * 12; 
      const rotateY = ((x - centerX) / centerX) * -12;
      
      // Use gsap.to instead of quickSetter for buttery smooth interpolation (weight/mass simulation)
      gsap.to(el, {
        rotateX: rotateX,
        rotateY: rotateY,
        scale: 1.02,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, { 
        rotateX: 0, 
        rotateY: 0, 
        scale: 1,
        duration: 1.2, 
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto'
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isLoading]);

  // If loading, don't render anything yet
  if (isLoading) return null;

  // Use sanity data if available, otherwise use default fallback
  const displayData = quoteData || { quoteText: 'Today builds tomorrow', author: null };

  return (
    <section className="quote-canvas-section">
      <div className="quote-canvas-container" ref={containerRef}>
        <h3 className="quote-text-elegant">
          "{displayData.quoteText}"
        </h3>
        {displayData.author && (
          <p className="quote-author-elegant">
            — {displayData.author}
          </p>
        )}
      </div>
    </section>
  );
};

export default QuoteCanvas;
