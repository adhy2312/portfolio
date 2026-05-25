import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useSiteMode } from '../contexts/SiteModeContext';
import './CustomCursor.css';

const hasFinePointer = () => window.matchMedia('(pointer: fine)').matches;

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const stateRef = useRef('default');
  const [cursorState, setCursorState] = useState('default');
  const [visible, setVisible] = useState(false);
  const { isExperimental } = useSiteMode();

  // Framer Motion Springs for Experimental Mode
  const fX = useMotionValue(-300);
  const fY = useMotionValue(-300);
  const smoothX = useSpring(fX, { damping: 20, stiffness: 150, mass: 0.5 });
  const smoothY = useSpring(fY, { damping: 20, stiffness: 150, mass: 0.5 });

  useEffect(() => {
    if (!hasFinePointer()) return;

    let raf;
    let mx = -300, my = -300;
    let dirty = false;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dirty = true;
      if (isExperimental) {
        fX.set(e.clientX);
        fY.set(e.clientY);
      }
      if (!visible) setVisible(true);
    };

    const tick = () => {
      if (dirty && cursorRef.current && !isExperimental) {
        cursorRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        dirty = false;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onOver = (e) => {
      const el = e.target;
      const isText = !!el.closest('p, h1, h2, h3, h4, h5, h6, span:not(.ma-dock-label)');
      const isMagnetic = !!el.closest('.magnetic-btn');
      const isHover = !!el.closest('a, button, [data-cursor="hover"], input, textarea, select, label, [role="button"]');
      const isGrab = !!el.closest('.neural-map-container, model-viewer');
      const isChat = !!el.closest('.ma-dock, .ma-window, .ma-msg');

      let next = 'default';
      if (isChat) next = 'chat';
      else if (isGrab) next = 'grab';
      else if (isMagnetic) next = 'magnetic';
      else if (isHover) next = 'hover';
      else if (isText) next = 'text';

      if (next !== stateRef.current) {
        stateRef.current = next;
        setCursorState(next);
      }
    };

    const onMouseDown = () => cursorRef.current?.classList.add('cursor-click');
    const onMouseUp   = () => cursorRef.current?.classList.remove('cursor-click');
    const onLeave     = () => setVisible(false);
    const onEnter     = () => setVisible(true);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
    };
  }, []); // eslint-disable-line

  if (!hasFinePointer()) return null;

  if (isExperimental) {
    return (
      <div className={`liquid-cursor state-${cursorState} ${visible ? 'cursor-visible' : 'cursor-hidden'}`}>
        <motion.div 
          className="liquid-cursor-shape" 
          style={{ x: smoothX, y: smoothY, position: 'fixed', top: 0, left: 0, pointerEvents: 'none', width: 32, height: 32 }}
        />
        <motion.svg
          className="liquid-cursor-outline"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          style={{ x: fX, y: fY, position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <polygon
            points="0,0 0,26 8,18.5 13.5,27.5 18,25 12.5,16 23,15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
    );
  }

  return (
    <div
      ref={cursorRef}
      className={`liquid-cursor state-${cursorState} ${visible ? 'cursor-visible' : 'cursor-hidden'}`}
    >
      <div className="liquid-cursor-shape" />
      <svg
        className="liquid-cursor-outline"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="0,0 0,26 8,18.5 13.5,27.5 18,25 12.5,16 23,15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default CustomCursor;
