import React from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './AmbientThoughts.css';

const AmbientThoughts = () => {
  const { ambientThought, idleState } = useConsciousness();

  if (!ambientThought && idleState !== 'dreaming') return null;

  const isCorrupted = ambientThought && (ambientThought.startsWith('[') || ambientThought.startsWith('ARCHIVE') || ambientThought.startsWith('FRAGMENT'));

  return (
    <div className={`ambient-thought-container ${ambientThought || idleState === 'dreaming' ? 'visible' : ''}`}>
      <div className="ambient-thought" style={{
        opacity: idleState === 'dreaming' ? 0.6 : 1,
        transform: idleState === 'dreaming' ? 'scale(0.98)' : 'scale(1)',
        filter: idleState === 'dreaming' ? 'blur(0.5px)' : 'none',
        transition: 'all 2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <span className="thought-icon" style={{ 
          opacity: isCorrupted ? 0.3 : 0.5,
          filter: isCorrupted ? 'hue-rotate(90deg)' : 'none'
        }}>
          {isCorrupted ? '⚡' : '✨'}
        </span>
        <span className="thought-text" style={{ 
          fontStyle: isCorrupted ? 'normal' : 'italic', 
          fontFamily: isCorrupted ? 'monospace' : 'inherit',
          opacity: isCorrupted ? 0.7 : 1,
          letterSpacing: idleState === 'dreaming' ? '1px' : '0.5px',
          textTransform: isCorrupted ? 'uppercase' : 'none'
        }}>
          {ambientThought || "The architecture is dreaming... Processing memory fragments."}
        </span>
      </div>
    </div>
  );
};

export default AmbientThoughts;
