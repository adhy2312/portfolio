import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ns from '../../core/NervousSystem';
import './CustomCursor.css';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    // Hide default cursor globally
    document.documentElement.style.cursor = 'none';
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (getComputedStyle(el).cursor === 'pointer' || el.tagName === 'A' || el.tagName === 'BUTTON') {
        el.style.cursor = 'none';
      }
    });

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    // Use GSAP quickSetter for 0-latency tracking
    const setCursorX = gsap.quickSetter(cursor, "x", "px");
    const setCursorY = gsap.quickSetter(cursor, "y", "px");
    const setRingX = gsap.quickSetter(ring, "x", "px");
    const setRingY = gsap.quickSetter(ring, "y", "px");

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let rafId;

    const loop = () => {
      const mx = ns.mousePos.x;
      const my = ns.mousePos.y;

      if (mx !== -1000) {
        // Dot follows instantly
        setCursorX(mx);
        setCursorY(my);

        // Ring follows with a spring lag
        ringX += (mx - ringX) * 0.15;
        ringY += (my - ringY) * 0.15;
        setRingX(ringX);
        setRingY(ringY);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    // Global Hover Detectors
    const onMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      <div 
        ref={ringRef}
        className={`custom-cursor-ring ${isHovering ? 'hover' : ''} ${isClicking ? 'click' : ''}`}
      />
      <div 
        ref={cursorRef}
        className="custom-cursor-dot"
      />
    </>
  );
}
