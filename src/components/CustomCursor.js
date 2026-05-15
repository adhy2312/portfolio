import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const [cursorState, setCursorState] = useState('default'); // default | hover

  useEffect(() => {
    let mx = 0, my = 0;
    let cx = 0, cy = 0;
    let raf;

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      cx = lerp(cx, mx, 0.2); // Snappy movement
      cy = lerp(cy, my, 0.2);
      
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onEnterHover = (e) => {
      const t = e.target.closest('a, button, [data-cursor="hover"], input, textarea, select');
      if (t) setCursorState('hover');
    };
    const onLeaveHover = () => setCursorState('default');

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnterHover);
    document.addEventListener('mouseout', onLeaveHover);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnterHover);
      document.removeEventListener('mouseout', onLeaveHover);
    };
  }, []);

  return (
    <div ref={cursorRef} className={`custom-cursor-skeuo state-${cursorState}`}>
      <div className="cursor-wrapper">
        {/* ARROW CURSOR (Used for all states for simplicity and safety) */}
        <svg className="svg-arrow" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#cursorShadow)">
            <path d="M10 10L10 32L14 28L18 35L22 33L18 26L24 26L10 10Z" fill="#FF00FF" transform="translate(3, 3)" />
            <path d="M10 10L10 32L14 28L18 35L22 33L18 26L24 26L10 10Z" fill="#00FF00" transform="translate(2, 2)" />
            <path d="M10 10L10 32L14 28L18 35L22 33L18 26L24 26L10 10Z" fill="#00FFFF" transform="translate(1, 1)" />
            <path d="M10 10L10 32L14 28L18 35L22 33L18 26L24 26L10 10Z" fill="url(#cursorGradient)" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        </svg>

        <defs>
          <linearGradient id="cursorGradient" x1="12" y1="15" x2="24" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE0E0" />
            <stop offset="1" stopColor="#FFF4D0" />
          </linearGradient>
          <filter id="cursorShadow" x="0" y="0" width="60" height="60" filterUnits="userSpaceOnUse">
            <feOffset dx="3" dy="3" /><feGaussianBlur stdDeviation="2" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
            <feBlend mode="normal" in="SourceGraphic" />
          </filter>
        </defs>
      </div>
    </div>
  );
};

export default CustomCursor;
