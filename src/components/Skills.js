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

// ─── Precision Dial Constants & Geometry ──────────────────
const CENTER = 250;
const SUNBURST_R_INNER = 106;
const SUNBURST_R_OUTER = 208;
const GAP_DEG = 3;
const TOTAL_DEG = 360;

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
    `M ${s1.x.toFixed(2)} ${s1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${e1.x.toFixed(2)} ${e1.y.toFixed(2)}`,
    `L ${s2.x.toFixed(2)} ${s2.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${e2.x.toFixed(2)} ${e2.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function outerArcPath(cx, cy, r, startDeg, endDeg) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function midAngle(startDeg, endDeg) {
  return (startDeg + endDeg) / 2;
}

function labelPos(cx, cy, startDeg, endDeg) {
  const mid = midAngle(startDeg, endDeg);
  const r = (SUNBURST_R_INNER + SUNBURST_R_OUTER) / 2;
  return polarToXY(cx, cy, r, mid);
}

// Generate outer chronograph ticks (72 ticks = 5 deg intervals)
const DIAL_TICKS = Array.from({ length: 72 }).map((_, i) => {
  const deg = i * 5;
  const isCardinal = deg % 45 === 0;
  const isMajor = deg % 15 === 0;
  const rInner = isCardinal ? 218 : isMajor ? 222 : 226;
  const rOuter = 232;
  const p1 = polarToXY(CENTER, CENTER, rInner, deg);
  const p2 = polarToXY(CENTER, CENTER, rOuter, deg);
  return { p1, p2, deg, isCardinal, isMajor };
});

const CARDINAL_DEGS = [0, 45, 90, 135, 180, 225, 270, 315];

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

// ─── Precision Radial Instrument ──────────────────────────
const SunburstChart = ({ categories, activeIndex, onSegmentClick }) => {
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const segCount = categories.length;
  const degPerSeg = (TOTAL_DEG - segCount * GAP_DEG) / segCount;

  // Build segments with angular geometry
  const segments = categories.map((cat, i) => {
    const startDeg = i * (degPerSeg + GAP_DEG) + (GAP_DEG / 2);
    const endDeg   = startDeg + degPerSeg;
    const mid = midAngle(startDeg, endDeg);
    return { cat, startDeg, endDeg, mid, i };
  });

  const effectiveIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
  const effectiveCat = effectiveIndex !== null ? categories[effectiveIndex] : null;
  const targetAngle = effectiveIndex !== null && segments[effectiveIndex]
    ? segments[effectiveIndex].mid
    : 0;

  // 3D Mouse Parallax & Specular Glare
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -14;
    const tiltY = (x - 0.5) * 14;
    setTilt({
      x: tiltX,
      y: tiltY,
      glareX: x * 100,
      glareY: y * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
    setHoveredIndex(null);
  };

  const handleSegClick = (i) => {
    onSegmentClick(activeIndex === i ? null : i);
  };

  return (
    <div
      ref={containerRef}
      className="sunburst-instrument"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--tilt-x': `${tilt.x}deg`,
        '--tilt-y': `${tilt.y}deg`,
        '--glare-x': `${tilt.glareX}%`,
        '--glare-y': `${tilt.glareY}%`,
        '--ambient-color': effectiveCat?.color || '#6366f1',
      }}
    >
      {/* Dynamic Ambient Atmospheric Glow (GPU-composited) */}
      <div className="sunburst-ambient-halo" />

      {/* Specular Glare Surface */}
      <div className="sunburst-glare-surface" />

      {/* Main High-Precision SVG Dial */}
      <svg
        viewBox="0 0 500 500"
        className="sunburst-svg"
        role="img"
        aria-label="Interactive skills precision radar dial"
      >
        <defs>
          {/* Subtle Outer Radar Sweep Beam */}
          <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Laser Glow Filter */}
          <filter id="dialLaserGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Deep Shadow for Active Segment Elevation */}
          <filter id="segmentDepth" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
          </filter>

          {/* Segment Radial Gradients */}
          {segments.map(({ cat, i, startDeg, endDeg }) => {
            const pStart = polarToXY(CENTER, CENTER, SUNBURST_R_INNER, startDeg);
            const pEnd = polarToXY(CENTER, CENTER, SUNBURST_R_OUTER, endDeg);
            return (
              <linearGradient
                key={i}
                id={`seg-grad-${i}`}
                x1={pStart.x} y1={pStart.y}
                x2={pEnd.x} y2={pEnd.y}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={cat.color} stopOpacity="0.35" />
                <stop offset="65%" stopColor={cat.color} stopOpacity="0.82" />
                <stop offset="100%" stopColor={cat.color} stopOpacity="0.98" />
              </linearGradient>
            );
          })}

          {/* Subtle Cyber Texture */}
          <pattern id="cyberMicroGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* ── Background Chassis & Instrument Housing ── */}
        <circle cx={CENTER} cy={CENTER} r="248" fill="#080c18" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r="246" fill="url(#cyberMicroGrid)" />
        <circle cx={CENTER} cy={CENTER} r="236" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={CENTER} cy={CENTER} r="214" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="3" />

        {/* Optical Scanning Line (GPU-rotated) */}
        <g className="sunburst-scanning-ray">
          <line x1={CENTER} y1={CENTER} x2={CENTER} y2="16" stroke="url(#radarSweep)" strokeWidth="2.5" />
        </g>

        {/* ── Precision Chronograph Dial Ticks ── */}
        <g className="sunburst-dial-ticks">
          {DIAL_TICKS.map((tick, idx) => (
            <line
              key={idx}
              x1={tick.p1.x}
              y1={tick.p1.y}
              x2={tick.p2.x}
              y2={tick.p2.y}
              stroke={tick.isCardinal ? 'rgba(255,255,255,0.45)' : tick.isMajor ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={tick.isCardinal ? 1.5 : tick.isMajor ? 1 : 0.6}
            />
          ))}
        </g>

        {/* Cardinal Degree Readouts */}
        <g className="sunburst-cardinal-labels">
          {CARDINAL_DEGS.map((deg, idx) => {
            const p = polarToXY(CENTER, CENTER, 241, deg);
            const str = String(deg).padStart(3, '0') + '°';
            return (
              <text
                key={idx}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="6.5"
                fontFamily="'Fira Code', monospace"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {str}
              </text>
            );
          })}
        </g>

        {/* ── Outer Track Decorative Arc Rails ── */}
        <circle cx={CENTER} cy={CENTER} r={SUNBURST_R_OUTER + 4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r={SUNBURST_R_INNER - 4} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* ── Radial Domain Segments ── */}
        <g className="sunburst-segments-group">
          {segments.map(({ cat, startDeg, endDeg, mid, i }) => {
            const isActive = activeIndex === i;
            const isHovered = hoveredIndex === i;
            const isHighlighted = isActive || isHovered;
            const isDimmed = effectiveIndex !== null && !isHighlighted;
            const Icon = iconMap[cat.iconName] || FiCpu;
            const lp = labelPos(CENTER, CENTER, startDeg, endDeg);

            // Dynamic expansion geometry
            const rIn = isHighlighted ? SUNBURST_R_INNER - 4 : SUNBURST_R_INNER;
            const rOut = isHighlighted ? SUNBURST_R_OUTER + 10 : SUNBURST_R_OUTER;
            const pathD = arcPath(CENTER, CENTER, rIn, rOut, startDeg, endDeg);
            const rimD = outerArcPath(CENTER, CENTER, rOut, startDeg, endDeg);

            // Internal micro-density tick rays (chronograph sub-ticks)
            const subTicks = [-12, -6, 0, 6, 12].map(delta => {
              const p1 = polarToXY(CENTER, CENTER, rIn + 6, mid + delta);
              const p2 = polarToXY(CENTER, CENTER, rIn + 14, mid + delta);
              return { p1, p2 };
            });

            return (
              <g
                key={i}
                className={`sunburst-sector ${isActive ? 'sunburst-sector--active' : ''} ${isHovered ? 'sunburst-sector--hover' : ''}`}
                onClick={() => handleSegClick(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                role="button"
                tabIndex={0}
                aria-label={`${cat.title}, ${cat.skills.length} skills`}
                onKeyDown={e => e.key === 'Enter' && handleSegClick(i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Elevation drop shadow on highlight */}
                {isHighlighted && (
                  <path
                    d={pathD}
                    fill={cat.color}
                    opacity="0.3"
                    filter="url(#dialLaserGlow)"
                  />
                )}

                {/* Primary Arc Segment Body */}
                <path
                  d={pathD}
                  fill={`url(#seg-grad-${i})`}
                  opacity={isDimmed ? 0.28 : isHighlighted ? 1 : 0.85}
                  filter={isHighlighted ? 'url(#segmentDepth)' : 'none'}
                  stroke={isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isHighlighted ? 1.5 : 0.8}
                  style={{
                    transition: 'd 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, stroke 0.25s ease',
                  }}
                />

                {/* Luminous Specular Outer Rim */}
                <path
                  d={rimD}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  opacity={isDimmed ? 0.3 : 1}
                  filter={isHighlighted ? 'url(#dialLaserGlow)' : 'none'}
                  style={{ transition: 'stroke-width 0.25s ease, opacity 0.25s ease' }}
                />

                {/* Machined Internal Density Ticks */}
                <g opacity={isDimmed ? 0.2 : isHighlighted ? 0.85 : 0.45}>
                  {subTicks.map((st, sidx) => (
                    <line
                      key={sidx}
                      x1={st.p1.x}
                      y1={st.p1.y}
                      x2={st.p2.x}
                      y2={st.p2.y}
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="1"
                    />
                  ))}
                </g>

                {/* Domain Code Monogram */}
                {(() => {
                  const badgePos = polarToXY(CENTER, CENTER, rIn + 22, mid);
                  return (
                    <text
                      x={badgePos.x}
                      y={badgePos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.6)'}
                      fontSize="7"
                      fontFamily="'Fira Code', monospace"
                      fontWeight="800"
                      letterSpacing="0.05em"
                      style={{ pointerEvents: 'none' }}
                    >
                      {`0${i + 1}`}
                    </text>
                  );
                })()}

                {/* Sector Domain Icon */}
                <foreignObject
                  x={lp.x - 11}
                  y={lp.y - 8}
                  width={22}
                  height={22}
                  style={{ pointerEvents: 'none', overflow: 'visible' }}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      color: isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.9)',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      opacity: isDimmed ? 0.35 : 1,
                      filter: isHighlighted ? `drop-shadow(0 0 6px ${cat.color})` : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                      transition: 'transform 0.25s ease, opacity 0.25s ease, filter 0.25s ease',
                      transform: isHighlighted ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    <Icon size={13} />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>

        {/* ── Mechanical Aiming Reticle (Laser Pointer Needle) ── */}
        <g
          className="sunburst-targeting-reticle"
          style={{
            transform: `rotate(${targetAngle}deg)`,
            transformOrigin: `${CENTER}px ${CENTER}px`,
            opacity: effectiveIndex !== null ? 1 : 0.35,
            transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          }}
        >
          {/* Aim line from hub to outer rim */}
          <line
            x1={CENTER}
            y1={CENTER - SUNBURST_R_INNER + 8}
            x2={CENTER}
            y2={CENTER - SUNBURST_R_OUTER - 18}
            stroke={effectiveCat?.color || '#ffffff'}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            filter="url(#dialLaserGlow)"
          />
          {/* Chevron tip at outer rim */}
          <polygon
            points={`${CENTER - 4},${CENTER - SUNBURST_R_OUTER - 20} ${CENTER + 4},${CENTER - SUNBURST_R_OUTER - 20} ${CENTER},${CENTER - SUNBURST_R_OUTER - 26}`}
            fill={effectiveCat?.color || '#ffffff'}
          />
        </g>

        {/* ── Central Iris Aperture (Machined Telemetry Hub) ── */}
        {/* Step 1: Metallic Outer Bezel */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r="98"
          fill="#0c1122"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />

        {/* Step 2: High-contrast Dark Inset */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r="88"
          fill="#070a14"
          stroke="rgba(0,0,0,0.8)"
          strokeWidth="2"
        />

        {/* Step 3: Spinning Dashed Micro-Gear Ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r="84"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          strokeDasharray="3 6"
          className="sunburst-gear-ring"
        />

        {/* Step 4: Glowing Inner LED Ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r="78"
          fill="none"
          stroke={effectiveCat?.color || 'rgba(255,255,255,0.25)'}
          strokeWidth="1.5"
          filter={effectiveCat ? 'url(#dialLaserGlow)' : 'none'}
          style={{ transition: 'stroke 0.35s ease' }}
        />

        {/* Step 5: Glass Lens Aperture Face */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r="76"
          fill="#090d1c"
          opacity="0.95"
        />

        {/* Central Telemetry Readout */}
        {effectiveCat ? (
          <g className="sunburst-center-content">
            <text
              x={CENTER}
              y={CENTER - 30}
              textAnchor="middle"
              fill={effectiveCat.color}
              fontSize="7"
              fontWeight="800"
              fontFamily="'Fira Code', monospace"
              letterSpacing="0.12em"
              style={{ pointerEvents: 'none' }}
            >
              {`[DOM.0${effectiveCat.order || effectiveIndex + 1}]`}
            </text>

            <text
              x={CENTER}
              y={CENTER - 10}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12.5"
              fontWeight="800"
              fontFamily="var(--font-heading, sans-serif)"
              letterSpacing="0.02em"
              style={{ pointerEvents: 'none' }}
            >
              {effectiveCat.title.split(' ')[0]}
            </text>

            <text
              x={CENTER}
              y={CENTER + 8}
              textAnchor="middle"
              fill={effectiveCat.color}
              fontSize="16"
              fontWeight="800"
              fontFamily="'Fira Code', monospace"
              style={{ pointerEvents: 'none' }}
            >
              {effectiveCat.skills.length}
            </text>

            <text
              x={CENTER}
              y={CENTER + 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="7"
              fontWeight="600"
              fontFamily="'Fira Code', monospace"
              letterSpacing="0.08em"
              style={{ pointerEvents: 'none' }}
            >
              CAPABILITIES
            </text>

            <text
              x={CENTER}
              y={CENTER + 36}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="6"
              fontFamily="'Fira Code', monospace"
              letterSpacing="0.05em"
              style={{ pointerEvents: 'none' }}
            >
              CLICK TO LOCK
            </text>
          </g>
        ) : (
          <g className="sunburst-center-content">
            <text
              x={CENTER}
              y={CENTER - 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="7"
              fontWeight="700"
              fontFamily="'Fira Code', monospace"
              letterSpacing="0.12em"
              style={{ pointerEvents: 'none' }}
            >
              RADIAL INDEX
            </text>

            <text
              x={CENTER}
              y={CENTER - 3}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="800"
              fontFamily="'Fira Code', monospace"
              style={{ pointerEvents: 'none' }}
            >
              8 DOMAINS
            </text>

            <text
              x={CENTER}
              y={CENTER + 15}
              textAnchor="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize="7.5"
              fontFamily="'Fira Code', monospace"
              letterSpacing="0.06em"
              style={{ pointerEvents: 'none' }}
            >
              61 CAPABILITIES
            </text>

            <text
              x={CENTER}
              y={CENTER + 30}
              textAnchor="middle"
              fill="#6366f1"
              fontSize="6.5"
              fontWeight="700"
              fontFamily="'Fira Code', monospace"
              letterSpacing="0.06em"
              style={{ pointerEvents: 'none' }}
            >
              HOVER / SELECT
            </text>
          </g>
        )}
      </svg>

      {/* ── Calibration Control Bar (Quick Select) ── */}
      <div className="sunburst-legend">
        {categories.map((cat, i) => {
          const isActive = activeIndex === i;
          const isHovered = hoveredIndex === i;
          const Icon = iconMap[cat.iconName] || FiCpu;
          return (
            <button
              key={i}
              className={`sunburst-legend-item ${isActive ? 'sunburst-legend-item--active' : ''} ${isHovered ? 'sunburst-legend-item--hover' : ''}`}
              onClick={() => onSegmentClick(activeIndex === i ? null : i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ '--legend-color': cat.color }}
              title={`Examine ${cat.title}`}
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
