import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ZAxisTunnel Component
 * Wraps a section and pulls it toward the camera along the Z-axis 
 * as the user scrolls, creating an infinite 3D tunnel effect.
 */
export default function ZAxisTunnel({ children, depth = 2000, className = "" }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const el = containerRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    // Use GSAP ScrollTrigger to map the container's Y scroll to the content's Z-axis
    const ctx = gsap.context(() => {
      // Start deep in the background (-depth), end right at the camera (0 or slightly past)
      gsap.fromTo(content, 
        { 
          z: -depth,
          opacity: 0,
        },
        {
          z: 500, // Move past the camera
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom', // When the top of the container hits the bottom of the viewport
            end: 'bottom top',   // When the bottom of the container hits the top of the viewport
            scrub: 1,            // Smooth scrubbing
          }
        }
      );
      
      // Fade out as it gets too close to the camera (optional, for a smoother exit)
      gsap.to(content, {
        opacity: 0,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: el,
          start: 'center center',
          end: 'bottom top',
          scrub: true
        }
      });
    }, el);

    return () => ctx.revert();
  }, [depth, isMobile]);

  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef} 
      className={`z-axis-tunnel-container ${className}`}
      style={{
        perspective: '1500px',
        perspectiveOrigin: '50% 50%',
        width: '100%',
        height: '150vh', // Make it taller to allow plenty of scroll space for the tunnel effect
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div 
        ref={contentRef}
        style={{
          width: '100%',
          transformStyle: 'preserve-3d',
          willChange: 'transform, opacity'
        }}
      >
        {children}
      </div>
    </div>
  );
}
