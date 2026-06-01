import React, { useEffect, useState, useRef } from 'react';
import ns from '../core/NervousSystem';
import pipeline from '../core/WorkerPipeline';

export default function EntropyText({ text, className = '' }) {
  const [displayedText, setDisplayedText] = useState(text);
  const containerRef = useRef(null);
  const progressRef = useRef(0);
  const rafRef = useRef(null);
  const uuid = useRef(Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Listen for results from the worker specifically for this instance
    const unsubscribe = pipeline.subscribe(uuid.current, (data) => {
      if (data.type === 'ENTROPY_RESULT') {
        setDisplayedText(data.payload.text);
        if (data.payload.done) cancelAnimationFrame(rafRef.current);
      }
    });

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && progressRef.current < 1) {
        // Start quantum collapse
        const startEntropy = () => {
          progressRef.current += 0.02; // 50 frames to settle
          
          pipeline.dispatch('science', 'CALC_ENTROPY', uuid.current, { 
            targetText: text, 
            progress: progressRef.current 
          });
          
          if (progressRef.current < 1) {
            rafRef.current = requestAnimationFrame(startEntropy);
          } else {
            setDisplayedText(text); // Force final state to ensure correctness
          }
        };
        
        // Slight delay for dramatic effect based on performance tier
        setTimeout(() => {
          rafRef.current = requestAnimationFrame(startEntropy);
        }, ns.performanceTier >= 2 ? 100 : 300);
        
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      scienceWorker.removeEventListener('message', handleMessage);
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [text]);

  return (
    <span 
      ref={containerRef} 
      className={`entropy-text ${className}`} 
      style={{ fontFamily: progressRef.current < 1 ? "'Fira Code', monospace" : 'inherit' }}
    >
      {displayedText}
    </span>
  );
}
