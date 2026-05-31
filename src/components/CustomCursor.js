import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useSiteMode } from '../contexts/SiteModeContext';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import './CustomCursor.css';

const hasFinePointer = () => window.matchMedia('(pointer: fine)').matches;

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const aiContentRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [aiData, setAiData] = useState({ title: '', desc: '' });
  const [cursorState, setCursorState] = useState('default');
  
  const { isExperimental } = useSiteMode();
  const orchestrator = useOrchestrator();

  const mousePos = useRef({ x: -1000, y: -1000 });
  const cursorPos = useRef({ x: -1000, y: -1000 });
  
  // Track last activity time for AI idle wandering
  const lastActiveRef = useRef(Date.now());
  const isIdleRef = useRef(false);
  
  // Refs for closure access inside RAF without rebuilding effect
  const isExpRef = useRef(isExperimental);
  const visibleRef = useRef(visible);
  const stateRef = useRef(cursorState);
  
  useEffect(() => { isExpRef.current = isExperimental; }, [isExperimental]);
  useEffect(() => { visibleRef.current = visible; }, [visible]);
  useEffect(() => { stateRef.current = cursorState; }, [cursorState]);

  useEffect(() => {
    if (!hasFinePointer() || !orchestrator || !cursorRef.current) return;

    // Fast GSAP quickSetter for maximum performance
    const setX = gsap.quickSetter(cursorRef.current, 'x', 'px');
    const setY = gsap.quickSetter(cursorRef.current, 'y', 'px');

    const tick = (time, delta) => {
      // Lerp for smooth trailing (AI mode) or instant follow
      const ease = isExperimental ? 0.2 : 0.8;
      
      // If idle (no mouse movement for 3s), AI slightly floats around its position
      if (isExpRef.current && isIdleRef.current && visibleRef.current) {
        const t = time * 0.001;
        const driftX = Math.sin(t) * 10;
        const driftY = Math.cos(t * 1.3) * 10;
        cursorPos.current.x += (mousePos.current.x + driftX - cursorPos.current.x) * ease;
        cursorPos.current.y += (mousePos.current.y + driftY - cursorPos.current.y) * ease;
      } else {
        cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * ease;
        cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * ease;
      }

      setX(cursorPos.current.x);
      setY(cursorPos.current.y);

      // Check idle state
      if (Date.now() - lastActiveRef.current > 3000) {
        if (!isIdleRef.current) {
          isIdleRef.current = true;
          if (isExpRef.current && stateRef.current === 'default') {
            setCursorState('ai-idle');
          }
        }
      } else {
        if (isIdleRef.current) {
          isIdleRef.current = false;
          if (stateRef.current === 'ai-idle') {
            setCursorState('default');
          }
        }
      }
    };

    orchestrator.subscribeToRAF('custom-cursor', tick, { priority: 'CRITICAL' });

    const onMouseMove = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      lastActiveRef.current = Date.now();
      
      if (!visible) setVisible(true);
    };

    const onOver = (e) => {
      const el = e.target;
      
      // Check for AI Project Hover
      const aiProject = el.closest('[data-cursor-ai="true"]');
      if (aiProject && isExpRef.current) {
        const title = aiProject.getAttribute('data-project-title') || '';
        const desc = aiProject.getAttribute('data-project-desc') || '';
        setAiData({ title, desc });
        setCursorState('ai-project');
        return;
      }

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

      setCursorState(prev => prev !== next ? next : prev);
    };

    const onMouseDown = () => {
      cursorRef.current.classList.add('cursor-click');
      lastActiveRef.current = Date.now();
    };
    const onMouseUp = () => cursorRef.current.classList.remove('cursor-click');
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    return () => {
      orchestrator.unsubscribeFromRAF('custom-cursor');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
    };
  }, [orchestrator]); // eslint-disable-line

  if (!hasFinePointer()) return null;

  return (
    <div
      ref={cursorRef}
      className={`ai-cursor state-${cursorState} ${visible ? 'cursor-visible' : 'cursor-hidden'} ${isExperimental ? 'is-experimental' : ''}`}
    >
      <div className="ai-cursor-shape" />
      
      {isExperimental && (
        <div className="ai-cursor-content" ref={aiContentRef}>
          {cursorState === 'ai-project' && (
            <div className="ai-project-card">
              <span className="ai-label">MINI-ADHY NEURAL SYNC</span>
              <h4>{aiData.title}</h4>
              <p>{aiData.desc}</p>
            </div>
          )}
          {cursorState === 'ai-idle' && (
            <div className="ai-idle-thought">
              <span>Thinking...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomCursor;
