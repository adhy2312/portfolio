import React, { useEffect, useState, useRef } from 'react';
import './Achievements.css';
import { FiAward, FiZap, FiPenTool, FiCamera, FiGlobe, FiBookOpen } from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  FiAward: <FiAward />,
  FiZap: <FiZap />,
  FiPenTool: <FiPenTool />,
  FiCamera: <FiCamera />,
  FiGlobe: <FiGlobe />,
  FiBookOpen: <FiBookOpen />,
};

const defaultAchievements = [
  { iconName: 'FiAward', title: 'PR & Media Head, ISTE', desc: 'PR and Media Head, and lead web developer for the ISTE MBCET chapter — driving digital presence and building the official portal.', accent: 'var(--accent-primary)' },
  { iconName: 'FiZap', title: 'IoT Projects', desc: 'Designed and shipped multiple embedded systems projects using ESP32 and Arduino for real-world problems.', accent: 'var(--accent-green)' },
  { iconName: 'FiPenTool', title: 'Figma Designer', desc: 'Built polished design systems and prototypes for web apps — from wireframes to production-ready UI.', accent: 'var(--accent-gold)' },
  { iconName: 'FiCamera', title: 'Photographer', desc: 'Running @zoomout_frames on Instagram — passionate street, portrait, and nature photographer.', accent: 'var(--accent-cyan)' },
  { iconName: 'FiGlobe', title: 'Full-Stack Dev', desc: 'Built end-to-end web apps with React, Node.js, and MongoDB — from database design to pixel-perfect UIs.', accent: 'var(--accent-magenta)' },
  { iconName: 'FiBookOpen', title: 'ECE Student', desc: 'Pursuing Electronics and Communication Engineering (ECE) with a passion for blending hardware design with modern software.', accent: '#ff6b9d' },
];

const Achievements = () => {
  const [fetchedAchievements, setFetchedAchievements] = useState([]);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);
  
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('achievements');

  useEffect(() => {
    const query = '*[_type == "achievement"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) setFetchedAchievements(data);
    }).catch(console.error);
  }, []);

  // GSAP Scroll Animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider, .section-desc');
        gsap.fromTo(headerEls,
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

      // Achievement cards: diagonal cascade
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('.ach-card');
        gsap.fromTo(cards,
          { y: 50, opacity: 0, scale: 0.9, rotateZ: -2 },
          {
            y: 0, opacity: 1, scale: 1, rotateZ: 0,
            duration: 0.8,
            stagger: { each: 0.08, grid: 'auto', from: 'start' },
            ease: 'power4.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 80%', once: true }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [fetchedAchievements]);

  const displayAchievements = fetchedAchievements.length > 0 ? fetchedAchievements : defaultAchievements;

  return (
    <section className="achievements" id="achievements" ref={sectionRef}>
      <div className="container">
        <div className="ach-header" ref={headerRef}>
          <span className="section-label">{"// highlights"}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Milestones">
              <span className="section-title-inner">What I <span>Bring</span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('achievements')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            A diverse toolkit spanning software, hardware, design, and creative arts — I don't just write code, I create experiences.
          </p>
        </div>

        <div className="ach-grid" ref={gridRef}>
          {displayAchievements.map((item, i) => (
            <div
              key={i}
              className="ach-card"
              style={{ '--ach-accent': item.accent }}
            >
              <div className="ach-icon-wrap">
                <span className="ach-emoji" style={{ color: item.accent }}>
                  {iconMap[item.iconName] || <FiAward />}
                </span>
                <div className="ach-icon-glow" />
              </div>
              <h3 className="ach-title">{item.title}</h3>
              <p className="ach-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievements;
