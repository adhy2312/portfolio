import React, { useState, useEffect } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './DigitalSeed.css';

const DigitalSeed = () => {
  const { temporalAge: realAge } = useConsciousness();
  const [temporalAge, setTemporalAge] = useState(realAge);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    setTemporalAge(realAge);
  }, [realAge]);

  // Hidden easter egg to accelerate time for testing
  const handleWater = () => {
    setClicks(c => c + 1);
    if (clicks >= 4) {
      setTemporalAge(prev => prev + 365); // Age rapidly
    }
  };

  let stage = 0;
  if (temporalAge >= 1825) stage = 4;
  else if (temporalAge >= 1095) stage = 3;
  else if (temporalAge >= 365) stage = 2;
  else if (temporalAge >= 30) stage = 1;

  return (
    <div className="digital-seed-wrapper">
      <div className="life-consciousness">
        <div className="life-thought">
           {stage === 0 && "A seed planted in the architecture. Waiting for time."}
           {stage === 1 && "The first leaves of code have breached the surface."}
           {stage === 2 && "Roots are sinking deeper into the DOM."}
           {stage === 3 && "A quiet strength. Reaching for the viewport."}
           {stage === 4 && "Five years of persistence. A digital mango is born."}
        </div>
        <div className="life-age">T + {temporalAge} days since genesis</div>
      </div>

      <div className={`digital-lifeform stage-${stage}`} onClick={handleWater} title="Water the system...">
         <svg viewBox="0 0 100 100" className="life-svg" preserveAspectRatio="xMidYMax meet">
            {stage === 0 && (
               <circle cx="50" cy="98" r="2" fill="#a3ffdc" className="glow-pulse" />
            )}
            {stage === 1 && (
               <path d="M50 100 Q50 90 50 85 Q45 80 40 82 Q50 85 50 85 Q55 80 60 82 Q50 85 50 85" stroke="#a3ffdc" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            )}
            {stage === 2 && (
               <path d="M50 100 Q50 70 50 60 M50 80 Q40 60 30 65 M50 75 Q60 55 70 60" stroke="#8de8c1" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}
            {stage === 3 && (
               <g stroke="#6c63ff" strokeWidth="2.5" fill="none" strokeLinecap="round">
                  <path d="M50 100 Q50 50 50 30 M50 70 Q30 50 20 40 M50 60 Q70 40 80 30 M35 60 Q20 50 10 40 M65 50 Q80 40 90 40" />
                  <circle cx="50" cy="30" r="15" fill="rgba(108, 99, 255, 0.1)" stroke="none" />
                  <circle cx="20" cy="40" r="10" fill="rgba(108, 99, 255, 0.1)" stroke="none" />
                  <circle cx="80" cy="30" r="12" fill="rgba(108, 99, 255, 0.1)" stroke="none" />
               </g>
            )}
            {stage === 4 && (
               <g stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round">
                  <path d="M50 100 Q50 40 50 20 M50 70 Q20 40 10 30 M50 60 Q80 30 90 20 M30 55 Q10 40 0 30 M70 45 Q90 30 100 30" />
                  <circle cx="50" cy="20" r="25" fill="rgba(168, 85, 247, 0.15)" stroke="none" />
                  <circle cx="10" cy="30" r="20" fill="rgba(168, 85, 247, 0.15)" stroke="none" />
                  <circle cx="90" cy="20" r="22" fill="rgba(168, 85, 247, 0.15)" stroke="none" />
                  {/* The Golden Mango */}
                  <g className="mango-glow">
                    <ellipse cx="65" cy="35" rx="3.5" ry="5" fill="#ffd700" stroke="#ffaa00" strokeWidth="1" />
                    <path d="M65 30 Q67 28 69 27" stroke="#228b22" strokeWidth="1" fill="none" />
                  </g>
               </g>
            )}
         </svg>
      </div>
      
      <div className="digital-soil">
         <div className="soil-surface"></div>
      </div>
    </div>
  );
};

export default DigitalSeed;
