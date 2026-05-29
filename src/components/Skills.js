import React, { useEffect, useRef, useState } from 'react';
import './Skills.css';
import { FiMonitor, FiSettings, FiPenTool, FiZap } from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  FiMonitor: <FiMonitor />,
  FiSettings: <FiSettings />,
  FiPenTool: <FiPenTool />,
  FiZap: <FiZap />,
};

const skillCategories = [
  {
    category: 'Frontend Development',
    icon: <FiMonitor />,
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
    category: 'Backend & Databases',
    icon: <FiSettings />,
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
    category: 'UI/UX & Design',
    icon: <FiPenTool />,
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
    category: 'Electronics & IoT',
    icon: <FiZap />,
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

const Skills = () => {
  const [fetchedCategories, setFetchedCategories] = useState([]);
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

      // Skill cards: stagger grid with 3D rotation
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('.skill-card');
        gsap.fromTo(cards,
          { y: 60, opacity: 0, rotateX: 15, scale: 0.95 },
          {
            y: 0, opacity: 1, rotateX: 0, scale: 1,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              once: true,
            },
            onComplete: () => {
              // Animate skill bars after cards appear
              const bars = gridRef.current?.querySelectorAll('.skill-bar-fill-css');
              if (bars) bars.forEach(b => b.classList.add('animate'));
            }
          }
        );
      }

      // Tools cloud: wave stagger
      if (toolsRef.current) {
        const chips = toolsRef.current.querySelectorAll('.tech-tag');
        gsap.fromTo(chips,
          { y: 20, opacity: 0, scale: 0.8 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.6,
            stagger: { each: 0.04, from: 'center' },
            ease: 'back.out(1.7)',
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
            <div 
              key={catIdx} 
              className="skill-card glass-card"
            >
              <div className="skill-card-header">
                <span className="skill-card-icon">{iconMap[cat.iconName] || <FiMonitor />}</span>
                <h3 className="skill-card-title" style={{ color: cat.color || 'var(--accent-primary)' }}>
                  {cat.title || cat.category}
                </h3>
              </div>

              <div className="skill-bars">
                {(cat.skills || []).map((skill, skillIdx) => (
                  <div key={skillIdx} className="skill-bar-item">
                    <div className="skill-bar-label">
                      <span>{skill.name}</span>
                      <span className="skill-bar-percent">{skill.level}%</span>
                    </div>
                    <div className="skill-bar-track">
                      <div
                        className="skill-bar-fill skill-bar-fill-css"
                        style={{
                          '--bar-color': cat.color || 'var(--accent-primary)',
                          '--bar-width': `${skill.level}%`,
                          transitionDelay: `${0.1 + skillIdx * 0.08}s`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tools & Technologies cloud */}
        <div className="tools-section" ref={toolsRef}>
          <h3 className="tools-title">Tools & Technologies</h3>
          <div className="tools-cloud">
            {tools.map((tool, i) => {
              const meta = toolMeta[tool] || { group: 'tools', snippet: tool, emoji: '🔧' };
              const colors = groupColors[meta.group] || groupColors.tools;
              return (
                <span
                  key={i}
                  className="tech-tag tools-chip tools-chip-interactive"
                  style={{
                    '--chip-border': colors.border,
                    '--chip-glow': colors.glow,
                  }}
                >
                  <span className="chip-emoji">{meta.emoji}</span>
                  {tool}
                  <span className="chip-tooltip">
                    <span className="chip-tooltip-title">{meta.emoji} {tool}</span>
                    <span className="chip-tooltip-desc">{meta.snippet}</span>
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
