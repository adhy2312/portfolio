import React, { useEffect, useState, useRef } from 'react';
import './TrustedBy.css';
import { client, urlFor } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TrustedBy = () => {
  const [brands, setBrands] = useState([]);
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('trusted');
  const sectionRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const query = '*[_type == "trustedBy"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) setBrands(data);
    }).catch(console.error);
  }, []);

  // GSAP header animation
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        const els = headerRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider, .section-desc');
        gsap.fromTo(els,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const defaultBrands = [
    { name: "ISTE MBCET", isPlaceholder: true },
    { name: "FRAMES MBCET", isPlaceholder: true },

  ];

  const displayBrands = brands.length > 0 ? brands : defaultBrands;

  return (
    <div className="trusted-by" ref={sectionRef}>
      <div className="container">
        <div className="trusted-header" ref={headerRef}>
          <span className="section-label">// trusted partners</span>
          <div className="section-title-wrapper">
            <h2 className="section-title">
              Trusted <span>By</span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('trusted')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            Collaborating with amazing people and teams
          </p>
        </div>
        <p className="trusted-title">Featured Organizations</p>
        <div className="logo-marquee-container">
          <div className="logo-marquee">
            {[...displayBrands, ...displayBrands].map((brand, i) => (
              <div key={i} className="logo-item">
                {brand.isPlaceholder ? (
                  <span className="placeholder-logo">{brand.name}</span>
                ) : (
                  brand.logo ? <img src={urlFor(brand.logo).url()} alt={brand.name} loading="lazy" decoding="async" /> : <span className="placeholder-logo">{brand.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
