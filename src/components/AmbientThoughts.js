import React from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './AmbientThoughts.css';

const AmbientThoughts = () => {
  const { ambientThought, idleState, performanceState } = useConsciousness();

  if (!ambientThought && idleState !== 'dreaming') return null;

  return (
    <div className={`ambient-thought-container ${ambientThought || idleState === 'dreaming' ? 'visible' : ''}`}>
      <div className="ambient-thought">
        <span className="thought-icon">✨</span>
        <span className="thought-text">
          {ambientThought || "The website is dreaming... Rendering idle atmosphere."}
        </span>
      </div>
    </div>
  );
};

export default AmbientThoughts;
