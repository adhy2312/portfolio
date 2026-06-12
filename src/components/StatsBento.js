import React, { useEffect, useRef, useState } from 'react';
import './StatsBento.css';
import { client } from '../sanity';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiGithub, FiCamera, FiFigma, FiMap, FiAward, FiBookOpen, FiTerminal, FiZap } from 'react-icons/fi';

gsap.registerPlugin(ScrollTrigger);

// Helper to generate a dummy heatmap for visual aesthetic
const generateHeatmap = () => {
  const weeks = [];
  for (let w = 0; w < 12; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const rand = Math.random();
      let level = 'l0';
      if (rand > 0.9) level = 'l4';
      else if (rand > 0.7) level = 'l3';
      else if (rand > 0.4) level = 'l2';
      else if (rand > 0.2) level = 'l1';
      days.push(<div key={`${w}-${d}`} className={`heatmap-day ${level}`} />);
    }
    weeks.push(<div key={w} className="heatmap-week">{days}</div>);
  }
  return weeks;
};

const StatsBento = () => {
  const sectionRef = useRef(null);
  const [sanityData, setSanityData] = useState(null);

  useEffect(() => {
    client.fetch('*[_type == "statsBento"][0]')
      .then(data => setSanityData(data))
      .catch(console.error);
  }, []);
  
  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.bento-card');
    
    const ctx = gsap.context(() => {
      gsap.fromTo(cards, 
        { y: 50, opacity: 0, rotateX: 10 }, 
        { 
          y: 0, 
          opacity: 1, 
          rotateX: 0,
          duration: 0.8, 
          stagger: 0.1, 
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
          }
        }
      );
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section className="stats-bento-section" ref={sectionRef}>
      <div className="container">
        <div className="stats-bento-grid">
          
          {/* GitHub Activity Bento */}
          <div className="bento-card bento-github">
            <div className="bento-header">
              <span className="bento-title">Git_Activity <span style={{fontSize:'0.65rem', color:'var(--text-muted)', marginLeft: '8px', letterSpacing: 'normal'}}>@{sanityData?.githubUsername || 'adhy2312'}</span></span>
              <FiGithub className="bento-icon" />
            </div>
            <div className="github-heatmap">
              {generateHeatmap()}
            </div>
          </div>
          
          {/* Photography Stats */}
          <div className="bento-card bento-photography" style={{ gridColumn: 'span 2' }}>
            <div className="bento-header">
              <FiCamera className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.photosCount || '20,000+'}</div>
            <div className="bento-subtitle">Photos Captured</div>
            <div className="bento-details" style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {sanityData?.photoStyles || 'Portraits • Nature • Landscape'} <br/>
              <span style={{ color: 'var(--accent-primary)' }}>{sanityData?.photoAwards || '🏆 4x Competition Winner'}</span>
            </div>
          </div>
          
          {/* Typing Speed */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiZap className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.wpmSpeed || 120}</div>
            <div className="bento-subtitle">WPM Speed</div>
          </div>
          
          {/* Design Stats */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiFigma className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.uiDesigns || '20+'}</div>
            <div className="bento-subtitle">UI Designs</div>
          </div>

          {/* Travel Stats */}
          <div className="bento-card bento-travel" style={{ gridColumn: 'span 2' }}>
            <div className="bento-header">
              <FiMap className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.travelKm || '50,000'}<span>km</span></div>
            <div className="bento-subtitle">Explored This Year</div>
          </div>

          {/* Learning & Courses */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiBookOpen className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.coursesCompleted || '10+'}</div>
            <div className="bento-subtitle">Courses Completed</div>
          </div>

          {/* Tech Stacks */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiTerminal className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.stacksLearned || '10+'}</div>
            <div className="bento-subtitle">Stacks Learned</div>
          </div>

          {/* Achievements */}
          <div className="bento-card bento-status" style={{ gridColumn: 'span 4' }}>
            <FiAward className="bento-icon" />
            <div className="bento-title" style={{ marginBottom: '0.5rem' }}>Achievements</div>
            <div className="status-text">{sanityData?.primaryAchievement || 'State Level Qualifier — YIP 2025'}</div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default StatsBento;
