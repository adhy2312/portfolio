import React, { useEffect, useRef, useState } from 'react';
import ns from '../core/NervousSystem';

export default function SchrodingersNode({ children, className = '' }) {
  const nodeRef = useRef(null);
  const [uuid] = useState(() => 'quantum-' + Math.random().toString(36).substr(2, 9));
  const filterRef = useRef(null);

  useEffect(() => {
    const el = nodeRef.current;
    const filterEl = filterRef.current;
    if (!el || !filterEl) return;

    let rafId;
    let currentBlur = 8; // Starts blurred
    
    const loop = () => {
      // 0 latency read
      const mx = ns.mousePos.x;
      const my = ns.mousePos.y;

      if (mx !== -1000 && ns.performanceTier >= 2) {
        const rect = el.getBoundingClientRect();
        
        // Check if cursor is directly observing it (hovering or nearby)
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = mx - centerX;
        const dy = my - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Also check if element is exactly in the center of the viewport (scroll observation)
        const viewportCenterY = window.innerHeight / 2;
        const scrollDist = Math.abs(centerY - viewportCenterY);
        
        let targetBlur = 8; // Default unobserved state

        // Waveform collapses into reality if observed (mouse near OR scrolled to center)
        if (dist < 300 || scrollDist < 200) {
          targetBlur = 0;
        }

        currentBlur += (targetBlur - currentBlur) * 0.15; // Quantum collapse speed

        if (Math.abs(currentBlur - targetBlur) > 0.01) {
          filterEl.setAttribute('stdDeviation', currentBlur.toFixed(2));
          if (currentBlur > 0.5) {
            el.style.filter = `url(#${uuid})`;
            el.style.opacity = (1 - (currentBlur / 15)).toFixed(2);
          } else {
            el.style.filter = 'none';
            el.style.opacity = '1';
          }
        }
      } else {
        // Fallback for low perf
        el.style.filter = 'none';
        el.style.opacity = '1';
      }

      rafId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(rafId);
  }, [uuid]);

  return (
    <div className={`schrodingers-wrapper ${className}`} style={{ display: 'inline-block' }}>
      {/* Invisible SVG filter definition unique to this node */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id={uuid}>
          <feGaussianBlur ref={filterRef} in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
      
      <div ref={nodeRef} style={{ willChange: 'filter, opacity' }}>
        {children}
      </div>
    </div>
  );
}
