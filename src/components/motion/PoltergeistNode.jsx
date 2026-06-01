import React, { useEffect, useRef } from 'react';
import ns from '../core/NervousSystem';

export default function PoltergeistNode({ children, radius = 400, strength = 0.5, className = '' }) {
  const nodeRef = useRef(null);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    let rafId;
    let currentX = 0;
    let currentY = 0;

    let isIdle = true;

    const loop = () => {
      // 0 latency read from NervousSystem singleton
      const mx = ns.mousePos.x;
      const my = ns.mousePos.y;

      if (mx !== -1000 && ns.performanceTier >= 2) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = mx - centerX;
        const dy = my - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;

        // Inverse distance field (Magnetic Pull)
        if (dist < radius) {
          const force = (radius - dist) / radius;
          targetX = dx * force * strength;
          targetY = dy * force * strength;
        }

        // Spring physics interpolation (lerp)
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;

        // Only update DOM if moving to save GPU
        if (Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
          el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          isIdle = false;
        } else if (!isIdle) {
          el.style.transform = `none`;
          isIdle = true;
        }
      } else {
        // Fallback or low perf tier
        currentX += (0 - currentX) * 0.1;
        currentY += (0 - currentY) * 0.1;
        if (Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
          el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          isIdle = false;
        } else if (!isIdle) {
          el.style.transform = `none`;
          isIdle = true;
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [radius, strength]);

  return (
    <div ref={nodeRef} className={`poltergeist-wrapper ${className}`} style={{ display: 'inline-block', willChange: 'transform' }}>
      {children}
    </div>
  );
}
