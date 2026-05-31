import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ColorMorphText Component
 * 
 * Recreates the premium GSAP "Color Morphing Typography" effect.
 * Uses a highly optimized background-position tween on a text-clipped gradient
 * rather than mutating DOM colors, which is extremely performant.
 */
export default function ColorMorphText({ 
  text, 
  colors = ['#ff4b4b', '#ff9000', '#f9ff00', '#00ff73', '#00e5ff', '#ff00d4', '#ff4b4b'],
  duration = 5,
  className = '' 
}) {
  const textRef = useRef(null);

  useEffect(() => {
    if (!textRef.current) return;
    const el = textRef.current;

    const ctx = gsap.context(() => {
      // We animate the background position of the gradient to create the morphing effect
      // By using a 300% wide background and moving it, the GPU handles it smoothly.
      const tl = gsap.to(el, {
        backgroundPosition: '300% 50%',
        duration: duration,
        ease: 'none',
        repeat: -1,
      });

      // Pause the animation if the element is not in view to save GPU cycles
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => tl.play(),
        onLeave: () => tl.pause(),
        onEnterBack: () => tl.play(),
        onLeaveBack: () => tl.pause()
      });
    }, textRef);

    return () => {
      ctx.revert();
    };
  }, [duration]);

  return (
    <div className={className} style={{ display: 'inline-block' }}>
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
          backgroundSize: '300% 100%',
          backgroundPosition: '0% 50%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          willChange: 'background-position',
          fontWeight: 'bold'
        }}
      >
        {text}
      </span>
    </div>
  );
}
