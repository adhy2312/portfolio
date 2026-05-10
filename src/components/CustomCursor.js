import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [cursorState, setCursorState] = useState('default'); // default | hover | click | text

  useEffect(() => {
    let mx = 0, my = 0;
    let rx = 0, ry = 0;
    let raf;

    const moveDot = (x, y) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x - 4}px, ${y - 4}px)`;
      }
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      moveDot(mx, my);
    };

    const onDown = () => setCursorState('click');
    const onUp = () => setCursorState('default');

    const onEnterHover = (e) => {
      const t = e.target.closest('a, button, [data-cursor="hover"], input, textarea, select');
      if (t) {
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') {
          setCursorState('text');
        } else {
          setCursorState('hover');
        }
      }
    };
    const onLeaveHover = () => setCursorState('default');

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onEnterHover);
    document.addEventListener('mouseout', onLeaveHover);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onEnterHover);
      document.removeEventListener('mouseout', onLeaveHover);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className={`cursor-dot cursor-dot-${cursorState}`} />
      <div ref={ringRef} className={`cursor-ring cursor-ring-${cursorState}`} />
    </>
  );
};

export default CustomCursor;
