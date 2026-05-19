import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

const hasFinePointer = () => window.matchMedia('(pointer: fine)').matches;

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const stateRef = useRef('default');
  const [cursorState, setCursorState] = useState('default');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasFinePointer()) return;

    let raf;
    let mx = -300, my = -300;
    let dirty = false;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dirty = true;
      if (!visible) setVisible(true);
    };

    const tick = () => {
      if (dirty && cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        dirty = false;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onOver = (e) => {
      const isHover = !!e.target.closest(
        'a, button, [data-cursor="hover"], input, textarea, select, label, [role="button"]'
      );
      const next = isHover ? 'hover' : 'default';
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

  return (
    <div
      ref={cursorRef}
      className={`liquid-cursor state-${cursorState} ${visible ? 'cursor-visible' : 'cursor-hidden'}`}
    >
      {/* Inner dot — the precise click hotspot */}
      <div className="liquid-cursor-dot" />
    </div>
  );
};

export default CustomCursor;
