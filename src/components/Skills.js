import React, { useEffect, useRef, useState } from 'react';
import './Skills.css';
import { FiMonitor, FiSettings, FiPenTool, FiZap } from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagneticButton from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  FiMonitor: <FiMonitor />,
  FiSettings: <FiSettings />,
  FiPenTool: <FiPenTool />,
  FiZap: <FiZap />,
};

const skillCategories = [
  {
    title: 'Frontend Development',
    iconName: 'FiMonitor',
    color: 'var(--accent-primary)',
    skills: [
      { name: 'React.js', level: 85 },
      { name: 'HTML5 & CSS3', level: 80 },
      { name: 'JavaScript (ES6+)', level: 70 },
      { name: 'Responsive Design', level: 70 },
      { name: 'GSAP', level: 75 },
    ],
  },
  {
    title: 'Backend & Databases',
    iconName: 'FiSettings',
    color: 'var(--accent-cyan)',
    skills: [
      { name: 'Node.js & Express', level: 50 },
      { name: 'REST APIs', level: 40 },
      { name: 'MongoDB', level: 30 },
      { name: 'MySQL / SQLite', level: 40 },
      { name: 'Firebase', level: 60 },
    ],
  },
  {
    title: 'UI/UX & Design',
    iconName: 'FiPenTool',
    color: 'var(--accent-gold)',
    skills: [
      { name: 'Figma', level: 88 },
      { name: 'Prototyping', level: 82 },
      { name: 'Design Systems', level: 78 },
      { name: 'Adobe Photoshop', level: 50 },
      { name: 'Lightroom (Photo Edit)', level: 90 },
    ],
  },
  {
    title: 'Electronics & IoT',
    iconName: 'FiZap',
    color: 'var(--accent-green)',
    skills: [
      { name: 'Arduino', level: 50 },
      { name: 'STM32', level: 50 },
      { name: 'Circuit Design', level: 75 },
      { name: 'C', level: 72 },
      { name: 'Circuit Simulation', level: 78 },
    ],
  },
];

// Tool chip metadata: group color + micro snippet for tooltip
const toolMeta = {
  'React': { group: 'frontend', snippet: 'UI Library', emoji: '⚛️' },
  'Node.js': { group: 'backend', snippet: 'Runtime Engine', emoji: '🟢' },
  'Figma': { group: 'design', snippet: 'Design Tool', emoji: '🎨' },
  '8051 MC': { group: 'iot', snippet: 'Microcontroller', emoji: '🔌' },
  'ESP32': { group: 'iot', snippet: 'IoT Board', emoji: '📡' },
  'MongoDB': { group: 'backend', snippet: 'NoSQL Database', emoji: '🍃' },
  'Git': { group: 'tools', snippet: 'Version Control', emoji: '🔀' },
  'Firebase': { group: 'backend', snippet: 'Cloud Platform', emoji: '🔥' },
  'Photoshop': { group: 'design', snippet: 'Image Editor', emoji: '🖼️' },
  'Lightroom': { group: 'design', snippet: 'Photo Editor', emoji: '📸' },
  'JavaScript & TypeScript': { group: 'frontend', snippet: 'Core Language', emoji: '⚡' },
  'CSS': { group: 'frontend', snippet: 'Styling', emoji: '🎭' },
  'HTML': { group: 'frontend', snippet: 'Markup', emoji: '🏗️' },
  'Express.js': { group: 'backend', snippet: 'Web Framework', emoji: '🚂' },
  'APIs': { group: 'backend', snippet: 'API Design', emoji: '🔗' },
  'Python': { group: 'tools', snippet: 'Programming Language', emoji: '🐍' },
  'GSAP': { group: 'frontend', snippet: 'Animation Engine', emoji: '🧈' },
};

const groupColors = {
  frontend: { border: 'var(--accent-primary)', glow: 'rgba(108, 99, 255, 0.35)' },
  backend: { border: 'var(--accent-cyan)', glow: 'rgba(79, 195, 247, 0.35)' },
  design: { border: 'var(--accent-gold)', glow: 'rgba(245, 166, 35, 0.35)' },
  iot: { border: 'var(--accent-green)', glow: 'rgba(0, 229, 160, 0.35)' },
  tools: { border: '#CBA6F7', glow: 'rgba(203, 166, 247, 0.35)' },
};

const tools = [
  'React', 'Node.js', 'Figma', '8051 MC', 'ESP32', 'MongoDB',
  'Git', 'Firebase', 'Photoshop', 'Lightroom', 'JavaScript', 'CSS',
  'HTML', 'Express.js', 'APIs', 'Python', 'GSAP',
];

const SkillCard = ({ cat, iconMap }) => {
  const cardRef = useRef(null);
  const barsRef = useRef([]);
  const percentRefs = useRef([]);

  useEffect(() => {
    if (!cardRef.current) return;

    // Use a unified timeline for both bars and numbers
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const targetWidth = bar.dataset.targetWidth;
        const percentEl = percentRefs.current[i];
        const targetLevel = percentEl ? parseInt(percentEl.dataset.targetLevel, 10) : 0;
        
        // Liquid bar filling effect
        tl.fromTo(bar, 
          { width: '0%' },
          {
            width: targetWidth,
            duration: 1.2,
            ease: 'power3.out',
          }, i * 0.12);

        // Percentage counter animation
        if (percentEl) {
          const obj = { val: 0 };
          tl.to(obj, {
            val: targetLevel,
            duration: 1.2,
            ease: 'power3.out',
            onUpdate: () => {
              percentEl.innerText = Math.round(obj.val) + '%';
            }
          }, i * 0.12);
        }
      });
    }, cardRef);

    // 3D Mouse Tilt
    const handleMouseMove = (e) => {
      const rect = cardRef.current.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(cardRef.current, {
        rotateX: yPct * -15,
        rotateY: xPct * 15,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(cardRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 1,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    const el = cardRef.current;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      ctx.revert();
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={cardRef} 
      className="skill-card glass-card"
      style={{ transformStyle: 'preserve-3d', perspective: '1000px', transformOrigin: 'center center' }}
    >
      <div className="skill-card-header" style={{ transform: 'translateZ(30px)' }}>
        <span className="skill-card-icon">{iconMap[cat.iconName] || <FiMonitor />}</span>
        <h3 className="skill-card-title" style={{ color: cat.color || 'var(--accent-primary)' }}>
          {cat.title || cat.category}
        </h3>
      </div>

      <div className="skill-bars" style={{ transform: 'translateZ(20px)' }}>
        {(cat.skills || []).map((skill, skillIdx) => (
          <div key={skillIdx} className="skill-bar-item">
            <div className="skill-bar-label">
              <span>{skill.name}</span>
              <span 
                className="skill-bar-percent"
                ref={el => percentRefs.current[skillIdx] = el}
                data-target-level={skill.level}
              >
                0%
              </span>
            </div>
            <div className="skill-bar-track">
              <div
                ref={el => barsRef.current[skillIdx] = el}
                className="skill-bar-fill"
                data-target-width={`${skill.level}%`}
                style={{
                  '--bar-color': cat.color || 'var(--accent-primary)',
                  width: '0%'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Skills = () => {
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [fetchedTools, setFetchedTools] = useState([]);
  const gridRef = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const toolsRef = useRef(null);
  
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('skills');

  useEffect(() => {
    const query = '*[_type == "skillCategory"]';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) setFetchedCategories(data);
    }).catch(console.error);

    const toolsQuery = '*[_type == "toolChip"]';
    client.fetch(toolsQuery).then((data) => {
      if (data && data.length > 0) setFetchedTools(data);
    }).catch(console.error);
  }, []);

  // GSAP Scroll Animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header orchestrated reveal
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider, .section-desc');
        gsap.fromTo(headerEls,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              once: true,
            }
          }
        );
      }

      // Skill cards: stagger grid with 3D dynamic rotation and bounce
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('.skill-card');
        gsap.fromTo(cards,
          { y: 100, opacity: 0, rotateX: 30, rotateY: -10, scale: 0.9 },
          {
            y: 0, opacity: 1, rotateX: 0, rotateY: 0, scale: 1,
            duration: 1.2,
            stagger: 0.15,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              once: true,
            }
          }
        );
      }

      // Tools cloud: super wave stagger with random rotation
      if (toolsRef.current) {
        const chips = toolsRef.current.querySelectorAll('.tech-tag');
        gsap.fromTo(chips,
          { y: 40, opacity: 0, scale: 0.5, rotateZ: () => Math.random() * 40 - 20 },
          {
            y: 0, opacity: 1, scale: 1, rotateZ: 0,
            duration: 0.8,
            stagger: { each: 0.03, from: 'random' },
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: toolsRef.current,
              start: 'top 85%',
              once: true,
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [fetchedCategories]);

  const displayCategories = fetchedCategories.length > 0 ? fetchedCategories : skillCategories;

  return (
    <section className="skills" id="skills" ref={sectionRef}>
      <div className="container">
        <div className="skills-header" ref={headerRef}>
          <span className="section-label">{"// what I know"}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="My Arsenal">
              <span className="section-title-inner">Skills & <span>Expertise</span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('skills')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            From building full-stack web applications and crafting pixel-perfect designs in Figma,
            to programming microcontrollers — I thrive across the full technology spectrum.
          </p>
        </div>

        {/* Skill category cards */}
        <div className="skills-grid" ref={gridRef}>
          {displayCategories.map((cat, catIdx) => (
            <SkillCard key={catIdx} cat={cat} iconMap={iconMap} />
          ))}
        </div>

        {/* Tools & Technologies cloud */}
        <div className="tools-section" ref={toolsRef}>
          <h3 className="tools-title">Tools & Technologies</h3>
          <div className="tools-cloud">
            {(fetchedTools.length > 0 ? fetchedTools : tools).map((tool, i) => {
              let toolName = tool;
              let meta = { group: 'tools', snippet: tool, emoji: '🔧' };
              
              if (typeof tool === 'object') {
                // From Sanity schema
                toolName = tool.name;
                meta = {
                  group: tool.group || 'tools',
                  snippet: tool.snippet || tool.name,
                  emoji: tool.emoji || '🔧'
                };
              } else {
                // From fallback hardcoded array
                meta = toolMeta[tool] || meta;
              }

              const colors = groupColors[meta.group] || groupColors.tools;
              return (
                <MagneticButton key={i} strength={0.3} style={{ display: 'inline-block' }}>
                  <span
                    className="tech-tag tools-chip tools-chip-interactive"
                    style={{
                      '--chip-border': colors.border,
                      '--chip-glow': colors.glow,
                      margin: '4px' // Add tiny margin to account for MagneticButton wrapper
                    }}
                  >
                    <span className="chip-emoji">{meta.emoji}</span>
                    {toolName}
                    <span className="chip-tooltip">
                      <span className="chip-tooltip-title">{meta.emoji} {toolName}</span>
                      <span className="chip-tooltip-desc">{meta.snippet}</span>
                    </span>
                  </span>
                </MagneticButton>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
