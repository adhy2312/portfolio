import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';

gsap.registerPlugin(ScrollTrigger);

const images = [photo1, photo2, photo3];

export default () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true } }
      );
      
      const imgs = galleryRef.current.querySelectorAll('img');
      gsap.fromTo(imgs,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.2, scrollTrigger: { trigger: galleryRef.current, start: 'top 85%', once: true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="gallery" className="section" ref={sectionRef}>
      <h2 ref={headerRef}>
        📷 My Photography
      </h2>
      <div 
        ref={galleryRef}
        style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'20px',marginTop:'2rem'}}
      >
        {images.map((src, i) => (
          <img 
            key={i} 
            src={src} 
            alt={`photo${i+1}`} 
            style={{width:'280px',borderRadius:'8px',boxShadow:'0 4px 15px rgba(0,0,0,0.3)', transition: 'transform 0.3s ease'}}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
    </section>
  );
};
