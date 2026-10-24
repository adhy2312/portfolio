import React, { useEffect, useRef, useState, useCallback } from 'react';
import './Skills.css';
import {
  FiMonitor, FiSettings, FiPenTool, FiZap, FiCamera,
  FiCpu, FiLayers, FiTerminal, FiServer, FiX
} from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ExpertDoc from './ExpertDoc';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  FiMonitor: FiMonitor,
  FiSettings: FiSettings,
  FiPenTool: FiPenTool,
  FiZap: FiZap,
  FiCamera: FiCamera,
  FiCpu: FiCpu,
  FiLayers: FiLayers,
  FiTerminal: FiTerminal,
  FiServer: FiServer,
};

// Canonical fallback data
const skillCategories = [
  {
    title: 'Frontend Development',
    iconName: 'FiMonitor',
    color: '#6366f1',
    order: 1,
    skills: [
      { name: 'React.js', level: 90 },
      { name: 'JavaScript (ES6+)', level: 88 },
      { name: 'TypeScript', level: 78 },
      { name: 'HTML5 & CSS3', level: 92 },
      { name: 'Next.js', level: 82 },
      { name: 'Tailwind CSS', level: 78 },
      { name: 'Responsive Web Design', level: 90 },
      { name: 'Three.js', level: 72 },
    ],
  },
  {
    title: 'Backend & Data',
    iconName: 'FiServer',
    color: '#06b6d4',
    order: 2,
    skills: [
      { name: 'Node.js', level: 80 },
      { name: 'Express.js', level: 78 },
      { name: 'REST APIs', level: 85 },
      { name: 'Python', level: 88 },
      { name: 'PostgreSQL', level: 84 },
      { name: 'Firebase', level: 85 },
    ],
  },
  {
    title: 'AI & Automation',
    iconName: 'FiCpu',
    color: '#a855f7',
    order: 3,
    skills: [
      { name: 'Python Automation', level: 92 },
      { name: 'AI-Assisted Development', level: 90 },
      { name: 'AI Agents', level: 82 },
      { name: 'AI API Integration', level: 85 },
      { name: 'Workflow Automation', level: 88 },
      { name: 'Web Scraping', level: 86 },
      { name: 'YOLOv8', level: 75 },
      { name: 'Prompt Engineering', level: 82 },
    ],
  },
  {
    title: 'Electronics & IoT',
    iconName: 'FiZap',
    color: '#10b981',
    order: 4,
    skills: [
      { name: 'Arduino', level: 92 },
      { name: 'ESP32', level: 90 },
      { name: 'Embedded Systems', level: 82 },
      { name: 'IoT', level: 88 },
      { name: 'Microcontroller Programming', level: 82 },
      { name: 'Circuit Design', level: 85 },
      { name: 'Sensor Interfacing', level: 85 },
      { name: 'PCB Design', level: 84 },
      { name: 'Electronics Prototyping', level: 90 },
      { name: 'KiCad', level: 86 },
    ],
  },
  {
    title: 'ERP & Engineering Systems',
    iconName: 'FiLayers',
    color: '#3b82f6',
    order: 5,
    skills: [
      { name: 'Odoo ERP', level: 88 },
      { name: 'Odoo Customization', level: 85 },
      { name: 'ERP Workflow Automation', level: 86 },
      { name: 'BOM Automation', level: 82 },
      { name: 'Odoo-KiCad Integration', level: 80 },
      { name: 'Engineering Workflow Automation', level: 84 },
    ],
  },
  {
    title: 'UI/UX & Design',
    iconName: 'FiPenTool',
    color: '#f59e0b',
    order: 6,
    skills: [
      { name: 'Figma', level: 92 },
      { name: 'UI/UX Design', level: 88 },
      { name: 'Prototyping & Wireframing', level: 90 },
      { name: 'Design Systems', level: 85 },
      { name: 'Visual Design', level: 88 },
      { name: 'Interaction Design', level: 82 },
      { name: 'Adobe Photoshop', level: 80 },
    ],
  },
  {
    title: 'Photography & Media',
    iconName: 'FiCamera',
    color: '#f43f5e',
    order: 7,
    skills: [
      { name: 'Photography', level: 96 },
      { name: 'Event Photography', level: 92 },
      { name: 'Portrait Photography', level: 94 },
      { name: 'Street Photography', level: 90 },
      { name: 'Nature Photography', level: 92 },
      { name: 'Photo Editing', level: 95 },
      { name: 'Visual Storytelling', level: 92 },
      { name: 'Creative Direction', level: 88 },
      { name: 'Poster Design', level: 86 },
      { name: 'Social Media Design', level: 90 },
      { name: 'Branding', level: 85 },
    ],
  },
  {
    title: 'Tools & Workflow',
    iconName: 'FiTerminal',
    color: '#ec4899',
    order: 8,
    skills: [
      { name: 'Git', level: 90 },
      { name: 'GitHub', level: 92 },
      { name: 'VS Code', level: 94 },
      { name: 'Vercel', level: 88 },
      { name: 'Wokwi', level: 85 },
    ],
  },
];

// ─── Sunburst Math ─────────────────────────────────────────
const SUNBURST_R_INNER = 72;
const SUNBURST_R_OUTER = 170;
const GAP_DEG = 3;          // gap between segments in degrees
const TOTAL_DEG = 360;
const CENTER = 200;         // SVG viewBox center

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(cx, cy, rInner, rOuter, startDeg, endDeg) {
  const s1 = polarToXY(cx, cy, rOuter, startDeg);
  const e1 = polarToXY(cx, cy, rOuter, endDeg);
  const s2 = polarToXY(cx, cy, rInner, endDeg);
  const e2 = polarToXY(cx, cy, rInner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${s1.x} ${s1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

function midAngle(startDeg, endDeg) {
  return (startDeg + endDeg) / 2;
}

function labelPos(cx, cy, startDeg, endDeg) {
  const mid = midAngle(startDeg, endDeg);
  const r = (SUNBURST_R_INNER + SUNBURST_R_OUTER) / 2;
  return polarToXY(cx, cy, r, mid);
}

// ─── Skill Detail Panel ────────────────────────────────────
const SkillPanel = ({ category, onClose }) => {
  const panelRef = useRef(null);
  const barsRef = useRef([]);
  const percentRefs = useRef([]);

  useEffect(() => {
    if (!panelRef.current) return;

    // Slide in
    gsap.fromTo(panelRef.current,
      { x: 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
    );

    // Animate bars
    const tl = gsap.timeline({ delay: 0.2 });
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      const targetWidth = bar.dataset.targetWidth;
      const percentEl = percentRefs.current[i];
      const targetLevel = percentEl ? parseInt(percentEl.dataset.targetLevel, 10) : 0;

      tl.fromTo(bar,
        { width: '0%' },
        { width: targetWidth, duration: 0.9, ease: 'power3.out' },
        i * 0.04
      );

      if (percentEl) {
        const obj = { val: 0 };
        tl.to(obj, {
          val: targetLevel,
          duration: 0.9,
          ease: 'power3.out',
          onUpdate: () => { percentEl.innerText = Math.round(obj.val) + '%'; }
        }, i * 0.04);
      }
    });

    return () => tl.kill();
  }, [category]);

  const handleClose = () => {
    if (!panelRef.current) { onClose(); return; }
    gsap.to(panelRef.current, {
      x: 60, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: onClose
    });
  };

  const Icon = iconMap[category.iconName] || FiCpu;

  return (
    <div className="skill-panel" ref={panelRef}>
      <div className="skill-panel-header" style={{ borderColor: category.color }}>
        <span className="skill-panel-icon" style={{ background: category.color }}>
          <Icon size={18} />
        </span>
        <div>
          <h3 className="skill-panel-title">{category.title}</h3>
          <span className="skill-panel-count">{category.skills.length} capabilities</span>
        </div>
        <button className="skill-panel-close" onClick={handleClose} aria-label="Close panel">
          <FiX size={18} />
        </button>
      </div>

      <div className="skill-panel-body">
        {category.skills.map((skill, i) => {
          const name = typeof skill === 'string' ? skill : skill.name;
          const level = typeof skill === 'object' && skill.level !== undefined ? skill.level : 80;
          return (
            <div key={i} className="skill-panel-item">
              <div className="skill-panel-item-header">
                <span className="skill-panel-item-name">{name}</span>
                <span
                  className="skill-panel-item-percent"
                  ref={el => percentRefs.current[i] = el}
                  data-target-level={level}
                >0%</span>
              </div>
              <div className="skill-panel-track">
                <div
                  className="skill-panel-fill"
                  ref={el => barsRef.current[i] = el}
                  data-target-width={`${level}%`}
                  style={{ backgroundColor: category.color, width: '0%' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Radial Sunburst ──────────────────────────────────────
const SunburstChart = ({ categories, activeIndex, onSegmentClick }) => {
  const svgRef = useRef(null);
  const segCount = categories.length;
  const degPerSeg = (TOTAL_DEG - segCount * GAP_DEG) / segCount;

  // Build segments
  const segments = categories.map((cat, i) => {
    const startDeg = i * (degPerSeg + GAP_DEG);
    const endDeg   = startDeg + degPerSeg;
    return { cat, startDeg, endDeg, i };
  });

  const handleSegClick = (i) => {
    onSegmentClick(activeIndex === i ? null : i);
  };

  return (
    <div className="sunburst-wrapper">
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        className="sunburst-svg"
        role="img"
        aria-label="Skill categories radial chart"
      >
        {/* Decorative rings */}
        <circle cx={CENTER} cy={CENTER} r={SUNBURST_R_INNER - 10} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r={SUNBURST_R_OUTER + 8} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 6" />

        {/* Segments */}
        {segments.map(({ cat, startDeg, endDeg, i }) => {
          const path = arcPath(CENTER, CENTER, SUNBURST_R_INNER, SUNBURST_R_OUTER, startDeg, endDeg);
          const isActive = activeIndex === i;
          const Icon = iconMap[cat.iconName] || FiCpu;
          const lp = labelPos(CENTER, CENTER, startDeg, endDeg);
          const expandedPath = isActive
            ? arcPath(CENTER, CENTER, SUNBURST_R_INNER - 6, SUNBURST_R_OUTER + 14, startDeg, endDeg)
            : path;

          return (
            <g
              key={i}
              className={`sunburst-segment ${isActive ? 'sunburst-segment--active' : ''}`}
              onClick={() => handleSegClick(i)}
              role="button"
              tabIndex={0}
              aria-label={`${cat.title}, click to view skills`}
              onKeyDown={e => e.key === 'Enter' && handleSegClick(i)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow layer for active */}
              {isActive && (
                <path
                  d={expandedPath}
                  fill={cat.color}
                  opacity="0.18"
                  filter="url(#segGlow)"
                />
              )}

              {/* Main arc */}
              <path
                d={expandedPath}
                fill={cat.color}
                opacity={isActive ? 1 : activeIndex !== null ? 0.35 : 0.8}
                style={{ transition: 'opacity 0.3s ease, d 0.3s ease' }}
              />

              {/* Pattern texture overlay */}
              <path
                d={expandedPath}
                fill={`url(#seg-pattern-${i})`}
                opacity={0.15}
              />

              {/* Icon rendered as foreignObject for React Icons */}
              <foreignObject
                x={lp.x - 10}
                y={lp.y - 10}
                width={20}
                height={20}
                style={{ pointerEvents: 'none', overflow: 'visible' }}
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{
                    color: '#ffffff',
                    width: 20, height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    opacity: isActive || activeIndex === null ? 1 : 0.5,
                    transition: 'opacity 0.3s ease',
                    filter: isActive ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none',
                  }}
                >
                  <Icon size={12} />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Center circle */}
        <circle cx={CENTER} cy={CENTER} r={SUNBURST_R_INNER - 10} fill="var(--bg-primary, #060918)" />
        <circle cx={CENTER} cy={CENTER} r={SUNBURST_R_INNER - 10} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

        {/* Center label */}
        {activeIndex !== null ? (
          <>
            <text x={CENTER} y={CENTER - 8} textAnchor="middle" dominantBaseline="middle"
              fill={categories[activeIndex]?.color || '#fff'}
              fontSize="11" fontWeight="700" fontFamily="'Fira Code', monospace"
              style={{ pointerEvents: 'none' }}>
              {categories[activeIndex]?.skills?.length || 0}
            </text>
            <text x={CENTER} y={CENTER + 8} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="'Fira Code', monospace"
              style={{ pointerEvents: 'none' }}>
              skills
            </text>
          </>
        ) : (
          <>
            <text x={CENTER} y={CENTER - 6} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.7)" fontSize="8.5" fontFamily="'Fira Code', monospace"
              style={{ pointerEvents: 'none' }}>
              click
            </text>
            <text x={CENTER} y={CENTER + 6} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'Fira Code', monospace"
              style={{ pointerEvents: 'none' }}>
              a segment
            </text>
          </>
        )}

        {/* SVG Defs */}
        <defs>
          <filter id="segGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {segments.map(({ cat, i }) => (
            <pattern key={i} id={`seg-pattern-${i}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke={cat.color} strokeWidth="1" opacity="0.3" />
            </pattern>
          ))}
        </defs>
      </svg>

      {/* Category label ring below SVG */}
      <div className="sunburst-legend">
        {categories.map((cat, i) => {
          const isActive = activeIndex === i;
          const Icon = iconMap[cat.iconName] || FiCpu;
          return (
            <button
              key={i}
              className={`sunburst-legend-item ${isActive ? 'sunburst-legend-item--active' : ''}`}
              onClick={() => onSegmentClick(activeIndex === i ? null : i)}
              style={{ '--legend-color': cat.color }}
            >
              <Icon size={12} className="sunburst-legend-icon" style={{ color: cat.color }} />
              <span className="sunburst-legend-dot" style={{ background: cat.color }} />
              <span className="sunburst-legend-label">{cat.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Skills Component ────────────────────────────────
const Skills = () => {
  const [categories, setCategories] = useState(skillCategories);
  const [activeIndex, setActiveIndex] = useState(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const chartAreaRef = useRef(null);

  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('skills');

  useEffect(() => {
    client.fetch('*[_type == "skillCategory"] | order(order asc)')
      .then(data => {
        if (data && data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // GSAP entrance
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        const els = headerRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider, .section-desc');
        gsap.fromTo(els,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true } }
        );
      }
      if (chartAreaRef.current) {
        gsap.fromTo(chartAreaRef.current,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.0, ease: 'back.out(1.4)',
            scrollTrigger: { trigger: chartAreaRef.current, start: 'top 80%', once: true } }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [categories]);

  const handleSegmentClick = useCallback((idx) => {
    if (idx === null) {
      setActiveIndex(null);
      setPanelVisible(false);
    } else {
      setActiveIndex(idx);
      setPanelVisible(true);
    }
  }, []);

  const handlePanelClose = useCallback(() => {
    setActiveIndex(null);
    setPanelVisible(false);
  }, []);

  const displayCategories = categories.length > 0 ? categories : skillCategories;
  const activeCategory = activeIndex !== null ? displayCategories[activeIndex] : null;

  return (
    <section className="skills" id="skills" ref={sectionRef}>
      <ExpertDoc
        title="Skills.js"
        notes="Radial Sunburst + Sanity CMS."
        data={{
          'visualization': 'SVG Radial Sunburst',
          'categories': displayCategories.length,
          'interaction': 'Click segment → side panel',
          'contentSource': 'Sanity CMS (GROQ)',
          'animationEngine': 'GSAP',
        }}
      />

      <div className="container">
        <div className="skills-header" ref={headerRef}>
          <span className="section-label">{'// what I know'}</span>
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
            Full-Stack Developer · AI-Assisted Builder · ECE Engineer · Designer
          </p>
        </div>

        {/* Sunburst + Panel layout */}
        <div className="skills-stage" ref={chartAreaRef}>
          <SunburstChart
            categories={displayCategories}
            activeIndex={activeIndex}
            onSegmentClick={handleSegmentClick}
          />

          <div className={`skill-panel-slot ${panelVisible ? 'skill-panel-slot--visible' : ''}`}>
            {panelVisible && activeCategory && (
              <SkillPanel
                key={activeIndex}
                category={activeCategory}
                onClose={handlePanelClose}
              />
            )}
            {!panelVisible && (
              <div className="skill-panel-placeholder">
                <span className="skill-panel-placeholder-icon">↖</span>
                <p>Select a domain from the chart to explore capabilities</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
