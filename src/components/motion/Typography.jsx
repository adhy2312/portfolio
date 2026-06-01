import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionTokens } from '../../core/MotionGovernance';
import VelocityText from './VelocityText';

gsap.registerPlugin(ScrollTrigger);

const EASE_BUTTER = motionTokens.ease.butter;
const EASE_ELASTIC = motionTokens.ease.elastic;
const EASE_EXPO = motionTokens.ease.expo;

/**
 * Typography Engine
 * 
 * Centralized, editorial-grade typography components.
 * Replaces random text tags with highly-optimized GSAP motion variants.
 */
export default function Typography({
  variant = 'mask', // mask, split, kinetic, default
  text,
  children,
  className = '',
  as = 'div',
  delay = 0,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || variant === 'kinetic' || variant === 'default') return;

    const el = ref.current;
    
    // Check for user reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ctx = gsap.context(() => {
      if (variant === 'mask') {
        // High-end editorial mask reveal (curtain rise)
        gsap.set(el, { clipPath: 'inset(100% 0 0 0)', opacity: 0, y: 40 });
        
        gsap.to(el, {
          clipPath: 'inset(0% 0 0 0)',
          opacity: 1,
          y: 0,
          duration: motionTokens.duration.reveal,
          ease: EASE_EXPO,
          onComplete: () => {
            gsap.set(el, { clearProps: "clipPath" });
          },
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
            once: true
          }
        });
      } else if (variant === 'split') {
        // Fluid word-by-word reveal
        // We expect the children to be text if split is used.
        const content = text || (typeof children === 'string' ? children : '');
        if (!content) return;
        
        const words = content.split(' ').map(word => {
          const span = document.createElement('span');
          span.style.display = 'inline-block';
          span.style.overflow = 'hidden';
          span.style.paddingRight = '0.3em'; // space between words
          
          const inner = document.createElement('span');
          inner.textContent = word;
          inner.style.display = 'inline-block';
          inner.style.transform = 'translateY(100%) rotateX(-20deg)';
          inner.style.opacity = '0';
          
          span.appendChild(inner);
          return span;
        });

        el.innerHTML = '';
        words.forEach(w => el.appendChild(w));

        const inners = words.map(w => w.firstChild);

        gsap.to(inners, {
          y: '0%',
          opacity: 1,
          rotateX: 0,
          duration: motionTokens.duration.enter,
          stagger: motionTokens.stagger.word,
          ease: EASE_BUTTER,
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
            once: true
          }
        });
      }
    }, el);

    return () => ctx.revert();
  }, [variant, text, children, delay]);

  if (variant === 'kinetic') {
    return <VelocityText text={text || children} className={className} />;
  }

  const Tag = as;
  return (
    <Tag ref={ref} className={className} style={{ display: 'inline-block', position: 'relative' }} {...props}>
      <span className="section-title-content" style={{ display: 'inline-block', transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
        {variant === 'split' ? null : (text || children)}
      </span>
      {props['data-hover'] && (
        <span className="section-title-hover-text" aria-hidden="true">
          {props['data-hover']}
        </span>
      )}
    </Tag>
  );
}
