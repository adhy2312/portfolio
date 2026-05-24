import React from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './AmbientThoughts.css';

const AmbientThoughts = () => {
  const { ambientThought, idleTime } = useConsciousness();

  if (!ambientThought && idleTime < 30) return null;

  return (
    <div className={`ambient-thought-container ${ambientThought || idleTime >= 30 ? 'visible' : ''}`}>
      <div className="ambient-thought">
        <span className="thought-icon">✨</span>
        <span className="thought-text">
          {ambientThought || (idleTime >= 30 ? "The website is dreaming... Rendering idle atmosphere." : "")}
        </span>
      </div>
    </div>
  );
};

export default AmbientThoughts;
