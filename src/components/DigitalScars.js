import React, { useState, useRef, useEffect } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './DigitalScars.css';
import {
  FiActivity, FiTerminal, FiAlertCircle,
  FiDatabase, FiLayers, FiRepeat, FiCpu,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────
   V200 Scar Data — Full Narrative Cards
───────────────────────────────────────── */
const SCARS = [
  {
    id: 'ERR-01',
    errorCode: 'SIGKILL',
    severity: 'Fatal',
    title: 'The Particle Collapse',
    description:
      'An early physics simulation that broke the render loop and destroyed the browser\'s memory. Preserved as a reminder of ambition exceeding constraints.',
    beforeCode: '// 10,000 particles. requestAnimationFrame. No cleanup.\nsetInterval(() => spawnParticle(), 0);',
    afterCode:  '// Now: Worker-offloaded, FPS-gated, pooled.\npipeline.dispatch("physics", { count: lerp(n, maxTier) });',
    recovery:
      'Learned that ambition without throttling is just a memory leak. Every animation now runs through the NervousSystem performance tier gate.',
    icon: <FiActivity size={22} />,
    status: 'Archived',
    statusColor: '#A0A0B0',
  },
  {
    id: 'SYS-04',
    errorCode: '404',
    severity: 'Critical',
    title: 'Forgotten Architectures',
    description:
      'Traces of a massive 3D environment that was eventually deleted. The ghost of its structure still subtly influences the current routing logic.',
    beforeCode: '// 3D scene: 40+ Three.js objects, no LOD, no culling.\nscene.add(...allObjects); // renderer.info.memory.geometries: 847',
    afterCode:  '// Now: scene graph pruned. LOD + frustum culling active.\nif (!frustum.containsPoint(obj.position)) obj.visible = false;',
    recovery:
      'You cannot build a cathedral in a browser tab. Learned scene graph discipline, LOD strategies, and when to murder your darlings.',
    icon: <FiTerminal size={22} />,
    status: 'Fading',
    statusColor: '#8C82FC',
  },
  {
    id: 'MEM-09',
    errorCode: 'ENOMEM',
    severity: 'Critical',
    title: 'The Silent Leak',
    description:
      'A beautiful but chaotic state management system that slowly consumed all available memory until the UI froze into silence. No crash — just silence.',
    beforeCode: '// Every scroll created a new subscription.\nuseEffect(() => { bus.on("scroll", handler); }, [scrollY]);',
    afterCode:  '// Now: single subscription, proper cleanup.\nuseEffect(() => { bus.on("scroll", handler);\n  return () => bus.off("scroll", handler); }, []);',
    recovery:
      'Subscriptions without teardowns are slow executions. Now every event listener has a signed death warrant inside its cleanup function.',
    icon: <FiDatabase size={22} />,
    status: 'Contained',
    statusColor: '#FF6B6B',
  },
  {
    id: 'RND-11',
    errorCode: 'EINFINITE',
    severity: 'Warning',
    title: 'The Infinite Cascade',
    description:
      'A single missing useEffect dependency that triggered an infinite render loop, crashing the layout engine before it even painted the first frame.',
    beforeCode: '// Missing dep. State updates → re-render → state updates → ...\nuseEffect(() => { setData(process(data)); }); // no dep array',
    afterCode:  '// Now: exhaustive-deps lint rule + useMemo guard.\nconst processed = useMemo(() => process(data), [data]);',
    recovery:
      'The React dependency array is a contract, not a suggestion. Installed eslint-plugin-react-hooks and never looked back.',
    icon: <FiRepeat size={22} />,
    status: 'Resolved',
    statusColor: '#4CAF50',
  },
  {
    id: 'STY-22',
    errorCode: 'ZCONFLICT',
    severity: 'Warning',
    title: 'Z-Index Warfare',
    description:
      'A brutal conflict of absolutely positioned elements competing for dominance, culminating in a mobile navbar that swallowed the entire viewport.',
    beforeCode: '// zIndex: 9999, 99999, 999999999...\n.navbar { z-index: 9999999; }\n.modal  { z-index: 99999999; }',
    afterCode:  '// Now: CSS stacking context layers documented.\n:root { --z-navbar: 100; --z-modal: 200; --z-toast: 300; }',
    recovery:
      'Introduced a z-index token system in CSS custom properties. Named layers, no magic numbers. The DOM is no longer a war zone.',
    icon: <FiLayers size={22} />,
    status: 'Patched',
    statusColor: '#FF9800',
  },
  {
    id: 'CON-42',
    errorCode: 'ERACE',
    severity: 'Critical',
    title: 'Race Condition Roulette',
    description:
      'Async state updates firing out of order. For three days, the application lived in a superposition of multiple UI states simultaneously.',
    beforeCode: '// Two fetches. First one to finish wins. Randomly.\nfetch(url1).then(setData);\nfetch(url2).then(setData); // which data survives?',
    afterCode:  '// Now: AbortController + sequential promise chains.\nconst ctrl = new AbortController();\nconst data = await fetchWithAbort(url, ctrl.signal);',
    recovery:
      'Race conditions are not bugs — they\'re physics. Adopted AbortController, useId for reconciliation, and acceptance that async is just time traveling.',
    icon: <FiCpu size={22} />,
    status: 'Isolated',
    statusColor: '#9C27B0',
  },
];

const severityConfig = {
  Fatal:    { bg: 'rgba(255, 50, 50, 0.08)',   text: '#ff4d4d', border: 'rgba(255,50,50,0.2)' },
  Critical: { bg: 'rgba(255, 120, 50, 0.08)',  text: '#ff8c42', border: 'rgba(255,120,50,0.2)' },
  Warning:  { bg: 'rgba(255, 193, 7, 0.08)',   text: '#ffc107', border: 'rgba(255,193,7,0.2)' },
};

/* ─────────────────────────────────────────
   Individual Scar Card
───────────────────────────────────────── */
const ScarCard = ({ scar, index }) => {
  const [expanded, setExpanded] = useState(false);
  const cardRef    = useRef(null);
  const detailRef  = useRef(null);
  const sv = severityConfig[scar.severity] || severityConfig.Warning;

  // GSAP scroll entrance
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.7,
        delay: index * 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 88%',
          once: true,
        }
      }
    );
  }, [index]);

  // GSAP expand animation
  useEffect(() => {
    if (!detailRef.current) return;
    if (expanded) {
      gsap.fromTo(detailRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.45, ease: 'power3.out' }
      );
    } else {
      gsap.to(detailRef.current,
        { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' }
      );
    }
  }, [expanded]);

  return (
    <div ref={cardRef} className={`scar-card ${expanded ? 'scar-card--expanded' : ''}`}>

      {/* ── Severity header ── */}
      <div className="scar-card-header">
        <div className="scar-icon-wrap" style={{ color: sv.text }}>
          {scar.icon}
        </div>
        <div className="scar-meta">
          <span className="scar-id">{scar.id}</span>
          <span
            className="scar-severity-badge"
            style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}
          >
            {scar.severity}
          </span>
        </div>
      </div>

      {/* ── Error code strip ── */}
      <div className="scar-error-code">
        <span className="scar-error-prefix">{'>'}_</span>
        <span className="scar-error-value">{scar.errorCode}</span>
      </div>

      {/* ── Title + Description ── */}
      <h3 className="scar-title">{scar.title}</h3>
      <p className="scar-desc">{scar.description}</p>

      {/* ── Expand Toggle ── */}
      <button
        className="scar-expand-btn"
        onClick={() => setExpanded(prev => !prev)}
        aria-label={expanded ? 'Collapse case study' : 'Expand case study'}
      >
        <span>Case Study</span>
        {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {/* ── Expandable Detail Panel ── */}
      <div ref={detailRef} className="scar-detail" style={{ height: 0, overflow: 'hidden', opacity: 0 }}>
        <div className="scar-code-block">
          <div className="scar-code-label">
            <span className="code-label-icon">✕</span> Before
          </div>
          <pre className="scar-code scar-code--before"><code>{scar.beforeCode}</code></pre>
        </div>

        <div className="scar-code-block">
          <div className="scar-code-label">
            <span className="code-label-icon" style={{ color: '#4CAF50' }}>✓</span> After
          </div>
          <pre className="scar-code scar-code--after"><code>{scar.afterCode}</code></pre>
        </div>

        <div className="scar-recovery">
          <span className="scar-recovery-label">{'// Recovery Protocol'}</span>
          <p className="scar-recovery-text">{scar.recovery}</p>
        </div>
      </div>

      {/* ── Footer status ── */}
      <div className="scar-footer">
        <span
          className="scar-status"
          style={{ background: sv.bg, color: scar.statusColor, borderColor: `${scar.statusColor}33` }}
        >
          ◉ {scar.status}
        </span>
      </div>

      {/* Glitch overlay on hover */}
      <div className="scar-glitch-overlay" aria-hidden="true" />
    </div>
  );
};

/* ─────────────────────────────────────────
   Section
───────────────────────────────────────── */
const DigitalScars = () => {
  const { idleState } = useConsciousness();
  const sectionRef   = useRef(null);
  const headerRef    = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        const els = headerRef.current.querySelectorAll(
          '.section-label, .section-title-wrapper, .section-divider, .scars-subtitle, .scars-counter'
        );
        gsap.fromTo(els,
          { y: 35, opacity: 0 },
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
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      className="digital-scars-section"
      id="scars"
      ref={sectionRef}
      data-xray="[SECTION: DIGITAL SCARS]&#10;Theme: Dark narrative cards&#10;Animation: GSAP ScrollTrigger entrance + GSAP expand/collapse&#10;Data: Hardcoded (transparent failure archive)"
    >
      <div className="container">
        {/* ── Header ── */}
        <div className="scars-header" ref={headerRef}>
          <span
            className="section-label"
            style={{ color: '#ffffff', background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            {'// preserved imperfections'}
          </span>

          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="System Scars">
              <span className="section-title-inner" style={{ color: '#ffffff' }}>
                <FiAlertCircle
                  size={34}
                  style={{ verticalAlign: 'middle', marginRight: '12px', paddingBottom: '4px', opacity: 0.8 }}
                />
                Digital <span className="scarred-text" data-text="Scars">Scars</span>
              </span>
            </h2>
          </div>

          <div className="section-divider" style={{ background: 'linear-gradient(90deg, #ff4d4d, #ff9800)' }} />

          <p className="scars-subtitle">
            A transparent archive of failed experiments, broken architectures, and performance disasters.
            In software engineering, perfection is an illusion — these are the traces of struggle and iteration that taught me the most.
          </p>

          {/* Bug Graveyard Counter */}
          <div className="scars-counter">
            <span className="scars-counter-num">{SCARS.length}</span>
            <span className="scars-counter-label">lessons excavated from the codebase graveyard</span>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className={`scars-grid ${idleState === 'dreaming' ? 'scars-dreaming' : ''}`}>
          {SCARS.map((scar, idx) => (
            <ScarCard key={scar.id} scar={scar} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DigitalScars;
