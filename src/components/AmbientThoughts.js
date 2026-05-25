import React from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './AmbientThoughts.css';

const AmbientThoughts = () => {
  const { ambientThought, idleState, performanceState } = useConsciousness();

  if (!ambientThought && idleState !== 'dreaming') return null;

  return (
    <div className={`ambient-thought-container ${ambientThought || idleState === 'dreaming' ? 'visible' : ''}`}>
      <div className="ambient-thought" style={{
        opacity: idleState === 'dreaming' ? 0.6 : 1,
        transform: idleState === 'dreaming' ? 'scale(0.98)' : 'scale(1)',
        filter: idleState === 'dreaming' ? 'blur(0.5px)' : 'none',
        transition: 'all 2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <span className="thought-icon" style={{ opacity: 0.5 }}>✨</span>
        <span className="thought-text" style={{ fontStyle: 'italic', letterSpacing: idleState === 'dreaming' ? '1px' : '0.5px' }}>
          {ambientThought || "The architecture is dreaming... Processing memory fragments."}
        </span>
      </div>
    </div>
  );
};

export default AmbientThoughts;
