import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ns from '../../core/NervousSystem';

export default function LiquidText({ children, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use our previously defined SVG filter
    el.style.filter = 'url(#liquid-filter)';
    
    // We target the exact DOM node of the filter in the document
    const turbulence = document.getElementById('liquid-turbulence');
    const displacement = document.getElementById('liquid-displacement');
    
    if (!turbulence || !displacement) return;

    const onMouseEnter = () => {
      ns.hardwareAccelerate(el, true);
      
      // Animate the scale of the displacement (how far it stretches)
      gsap.to(displacement, {
        attr: { scale: 30 },
        duration: 0.8,
        ease: "power2.out"
      });
      
      // Animate the noise frequency (how "bumpy" or liquid it looks)
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.05 },
        duration: 0.8,
        ease: "power2.out"
      });
    };

    const onMouseLeave = () => {
      gsap.to(displacement, {
        attr: { scale: 0 },
        duration: 1.2,
        ease: "elastic.out(1, 0.3)"
      });
      
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.00 },
        duration: 1.2,
        ease: "power2.out",
        onComplete: () => ns.hardwareAccelerate(el, false)
      });
    };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`liquid-text-wrapper ${className}`}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {children}
    </div>
  );
}
