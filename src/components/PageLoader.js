import React, { useEffect, useState } from 'react';
import './PageLoader.css';

const PHRASES = ['Building...', 'Compiling...', 'Shipping...', 'Launching...'];

const PageLoader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) { p = 100; clearInterval(interval); }
      setProgress(Math.min(p, 100));
      setPhrase(PHRASES[Math.floor((p / 100) * (PHRASES.length - 1))]);
      if (p >= 100) {
        setTimeout(() => {
          setExiting(true);
          setTimeout(onDone, 600);
        }, 400);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className={`page-loader ${exiting ? 'page-loader-exit' : ''}`}>
      <div className="loader-content">
        <div className="loader-logo">
          {'ADHY'.split('').map((c, i) => (
            <span key={i} className="loader-char" style={{ animationDelay: `${i * 0.1}s` }}>{c}</span>
          ))}
          <span className="loader-dot">.</span>
        </div>
        <div className="loader-bar-track">
          <div className="loader-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loader-phrase">{phrase}</div>
      </div>
    </div>
  );
};

export default PageLoader;
