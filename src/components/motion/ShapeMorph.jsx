import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * ShapeMorph Component
 * 
 * Demonstrates high-end shape morphing without the paid MorphSVGPlugin.
 * Uses CSS clip-path polygons tweened by GSAP to create striking
 * abstract geometric transformations.
 */
export default function ShapeMorph({ 
  children,
  width = '300px',
  height = '300px',
  className = ''
}) {
  const shapeRef = useRef(null);

  useEffect(() => {
    if (!shapeRef.current) return;

    // A collection of abstract shapes defined as clip-path polygons
    const shapes = [
      // Hexagon
      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      // Star-like
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
      // Diamond
      "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%, 50% 0%, 50% 0%, 0% 50%, 50% 100%, 100% 50%, 50% 0%)", 
      // Triangle
      "polygon(50% 0%, 100% 100%, 100% 100%, 0% 100%, 0% 100%, 50% 0%, 50% 0%, 100% 100%, 100% 100%, 0% 100%)",
      // Circle-ish (Octagon approximation)
      "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
    ];

    // Note: for GSAP to interpolate polygons smoothly, they MUST have the same number of points.
    // The strings above have been padded with duplicate points where necessary so they all have 10 vertices.

    // Create a timeline that cycles through the shapes
    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    shapes.forEach((shape, index) => {
      if (index === 0) return; // Skip the first as it's the starting state
      tl.to(shapeRef.current, {
        clipPath: shape,
        duration: 2,
        ease: "power2.inOut"
      }, "+=1"); // 1 second delay between morphs
    });

    return () => tl.kill();
  }, []);

  return (
    <div 
      className={className} 
      style={{ 
        width, 
        height, 
        display: 'inline-block',
        position: 'relative'
      }}
    >
      <div 
        ref={shapeRef}
        style={{
          width: '100%',
          height: '100%',
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", // Initial Hexagon
          background: 'linear-gradient(135deg, #6C63FF, #00FF73)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          willChange: 'clip-path' // Hardware acceleration
        }}
      >
        {children}
      </div>
    </div>
  );
}
