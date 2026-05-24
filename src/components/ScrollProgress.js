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

      // Velocity calculation for Typography
      const now = performance.now();
      const dt = now - lastTime || 16;
      const dy = scrolled - lastScrollY;
      const velocity = dy / dt; // pixels per ms
      
      // Map velocity to a skew angle (max 15 degrees)
      // Positive velocity (scrolling down) -> negative skew (leaning forward)
      const targetSlant = Math.max(-15, Math.min(15, -velocity * 3));
      const targetWeight = Math.min(900, Math.max(400, 700 + Math.abs(velocity * 100)));

      root.style.setProperty('--dynamic-slant', `${targetSlant.toFixed(1)}deg`);
      root.style.setProperty('--dynamic-weight', targetWeight.toFixed(0));

      lastScrollY = scrolled;
      lastTime = now;
    };

    // Auto-reset typography when scrolling stops
    let scrollTimeout;
    const scrollEndHandler = () => {
      clearTimeout(scrollTimeout);
      onScroll();
      scrollTimeout = setTimeout(() => {
        root.style.setProperty('--dynamic-slant', '0deg');
        root.style.setProperty('--dynamic-weight', '700');
      }, 150);
    };

    window.addEventListener('scroll', scrollEndHandler, { passive: true });
    return () => {
      window.removeEventListener('scroll', scrollEndHandler);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div className="scroll-progress-track">
      <div ref={barRef} className="scroll-progress-bar" style={{ width: '0%' }} />
    </div>
  );
};

export default ScrollProgress;
