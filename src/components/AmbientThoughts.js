import React from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './AmbientThoughts.css';

const AmbientThoughts = () => {
  const { ambientThought, idleState, performanceState } = useConsciousness();

  if (!ambientThought && idleState !== 'dreaming' && performanceState !== 'degraded') return null;

  return (
    <div className={`ambient-thought-container ${ambientThought || idleState === 'dreaming' || performanceState === 'degraded' ? 'visible' : ''}`}>
      <div className="ambient-thought">
        <span className="thought-icon">✨</span>
        <span className="thought-text">
          {ambientThought || (idleState === 'dreaming' ? "The website is dreaming... Rendering idle atmosphere." : "Reducing visual chaos for stability. GPU under heavy load.")}
        </span>
      </div>
    </div>
  );
};

export default AmbientThoughts;
