import React, { useEffect, useRef } from 'react';
import './ScrollProgress.css';

// Direct DOM mutation — zero React re-renders on scroll
const ScrollProgress = () => {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();

    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = `${pct}%`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="scroll-progress-track">
      <div ref={barRef} className="scroll-progress-bar" style={{ width: '0%' }} />
    </div>
  );
};

export default ScrollProgress;
