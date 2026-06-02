import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const [isHovering,    setIsHovering]    = useState(false);
  const [isClicking,    setIsClicking]    = useState(false);
  const [isViewfinder,  setIsViewfinder]  = useState(false);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Mutable position store — never causes re-renders
    let mx = -1000, my = -1000;
    let rx = -1000, ry = -1000;
    let rafId;
    let visible = false;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;

      if (!visible) {
        // First move — snap ring instantly too so it doesn't slide in from the corner
        rx = mx; ry = my;
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
        visible = true;
      }
    };

    const loop = () => {
      if (visible) {
        // Dot: instant
        dot.style.transform  = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;

        // Ring: exponential lerp spring
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    // Start hidden, loop immediately
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
    rafId = requestAnimationFrame(loop);

    // ── Hover detection ──────────────────────────────────
    const onMouseOver = (e) => {
      const t = e.target;
      setIsViewfinder(!!t.closest('.viewfinder-target'));
      setIsHovering(
        t.tagName === 'A'      || t.tagName === 'BUTTON' ||
        !!t.closest('a')       || !!t.closest('button')  ||
        getComputedStyle(t).cursor === 'pointer'
      );
    };

    const onMouseDown  = () => setIsClicking(true);
    const onMouseUp    = () => setIsClicking(false);
    const onMouseLeave = () => { setIsHovering(false); setIsViewfinder(false); };

    // Hide OS cursor everywhere
    document.documentElement.style.cursor = 'none';
    const style = document.createElement('style');
    style.id = 'cursor-hide';
    style.textContent = '* { cursor: none !important; }';
    document.head.appendChild(style);

    window.addEventListener('mousemove',  onMouseMove,  { passive: true });
    window.addEventListener('mouseover',  onMouseOver,  { passive: true });
    window.addEventListener('mousedown',  onMouseDown,  { passive: true });
    window.addEventListener('mouseup',    onMouseUp,    { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseover',  onMouseOver);
      window.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mouseup',    onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.style.cursor = '';
      document.getElementById('cursor-hide')?.remove();
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className={[
          'custom-cursor-ring',
          isHovering   ? 'hover'      : '',
          isClicking   ? 'click'      : '',
          isViewfinder ? 'viewfinder' : '',
        ].join(' ').trim()}
      />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  );
}
