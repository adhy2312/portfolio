import React from 'react';
import './CallToAction.css';
import MagneticButton from './MagneticButton';
import { playClickSound } from '../utils/sound';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CallToAction = () => {
  const sectionRef = useRef(null);
  const innerRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    playClickSound();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  // GSAP entrance
  useEffect(() => {
    if (!sectionRef.current || !innerRef.current) return;

    const ctx = gsap.context(() => {
      const elements = innerRef.current.querySelectorAll('.cta-eyebrow, .cta-title, .cta-desc, .cta-actions');
      
      gsap.fromTo(innerRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true }
        }
      );

      gsap.fromTo(elements,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true }
        }
      );

      // Orbs parallax
      const orbs = sectionRef.current.querySelectorAll('.cta-bg-orb');
      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          y: i === 0 ? -40 : 40,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="cta-section" ref={sectionRef}>
      <div className="container">
        <div className="cta-inner" ref={innerRef}>
          {/* Background decoration */}
          <div className="cta-bg-orb cta-orb-1" />
          <div className="cta-bg-orb cta-orb-2" />

          <span className="cta-eyebrow">Available for work</span>
          <h2 className="cta-title">
            Ready to Build
            <br />
            <span>Something Great?</span>
          </h2>
          <p className="cta-desc">
            Whether it's a startup idea, a freelance project, or a full-time role —
            let's connect and make it happen.
          </p>

          <div className="cta-actions">
            <MagneticButton>
              <a
                href="#contact"
                className="btn-primary cta-btn"
                onClick={handleClick}
              >
                Start a Conversation →
              </a>
            </MagneticButton>
            <MagneticButton>
              <a href="/resume.pdf" download className="btn-outline cta-btn" onClick={playClickSound}>
                Download Resume
              </a>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
