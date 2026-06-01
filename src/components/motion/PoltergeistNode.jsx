import React, { useEffect, useRef } from 'react';
import ns from '../../core/NervousSystem';

export default function PoltergeistNode({ children, radius = 400, strength = 0.5, className = '' }) {
  const nodeRef = useRef(null);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    let rafId;
    let currentX = 0;
    let currentY = 0;

    let isIdle = true;

    let rectCache = null;
    let lastScrollY = window.scrollY;

    const loop = () => {
      // 0 latency read from NervousSystem singleton
      const mx = ns.mousePos.x;
      const my = ns.mousePos.y;

      // Invalidate cache on scroll to prevent layout thrashing
      if (Math.abs(window.scrollY - lastScrollY) > 5) {
        rectCache = null;
        lastScrollY = window.scrollY;
      }

      if (mx !== -1000 && ns.performanceTier >= 2) {
        if (!rectCache) rectCache = el.getBoundingClientRect();
        
        const centerX = rectCache.left + rectCache.width / 2;
        const centerY = rectCache.top + rectCache.height / 2;

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
          if (isIdle) ns.hardwareAccelerate(el, true);
          el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          isIdle = false;
        } else if (!isIdle) {
          el.style.transform = `none`;
          ns.hardwareAccelerate(el, false);
          isIdle = true;
        }
      } else {
        // Fallback or low perf tier
        currentX += (0 - currentX) * 0.1;
        currentY += (0 - currentY) * 0.1;
        if (Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
          if (isIdle) ns.hardwareAccelerate(el, true);
          el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          isIdle = false;
        } else if (!isIdle) {
          el.style.transform = `none`;
          ns.hardwareAccelerate(el, false);
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
