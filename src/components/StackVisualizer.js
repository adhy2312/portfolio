import React, { useEffect, useState, useRef } from 'react';
import { FiCpu, FiLayers, FiZap, FiGlobe, FiPackage, FiClock, FiActivity } from 'react-icons/fi';
import './StackVisualizer.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ARCHITECTURE = [
  { layer: 'Frontend',        tech: 'React 19',              icon: <FiLayers />,   color: '#61DAFB', desc: 'Component-based UI with Suspense + Lazy loading' },
  { layer: 'Animation',       tech: 'GSAP 3 + ScrollTrigger',icon: <FiZap />,      color: '#88CE02', desc: 'GPU-accelerated scroll-triggered animations, buttery-smooth timelines' },
  { layer: 'Scrolling',       tech: 'Lenis',                 icon: <FiActivity />, color: '#00FF87', desc: 'Lerp-based smooth scrolling at 60fps, synced with GSAP ticker' },
  { layer: '3D Engine',       tech: 'Three.js + R3F',        icon: <FiCpu />,      color: '#FFD93D', desc: 'WebGL Neural Map with real-time scroll-bound rotation' },
  { layer: 'CMS',             tech: 'Sanity.io',             icon: <FiGlobe />,    color: '#F36458', desc: 'Headless CMS for dynamic content management' },
  { layer: 'Styling',         tech: 'Vanilla CSS',           icon: <FiPackage />,  color: '#C084FC', desc: 'Custom design system with CSS variables & glass-morphism' },
  { layer: 'AI',              tech: 'Gemini 2.5 Flash',      icon: <FiCpu />,      color: '#4ECDC4', desc: 'Powers Mini-Adhy with personality, memory & emotional context' },
  { layer: 'Hosting',         tech: 'Vercel',                icon: <FiGlobe />,    color: '#fff',    desc: 'Edge network with automatic CI/CD' },
  { layer: 'Nervous System',  tech: 'NervousSystem.js',      icon: <FiCpu />,      color: '#A78BFA', desc: 'Unified brain singleton — owns RAF loop, event bus & live state' },
  { layer: 'Consciousness',   tech: 'ConsciousnessContext',  icon: <FiActivity />, color: '#F59E0B', desc: '4-tier system: SUBCONSCIOUS → CONSCIOUS → SUPER → HYPER' },
  { layer: 'Presence Engine', tech: 'PresenceEngine.js',     icon: <FiLayers />,   color: '#34D399', desc: 'Zero-latency shared state proxy — direct RAF memory reads' },
  { layer: 'Event Bus',       tech: 'NeuralEventBus.js',     icon: <FiZap />,      color: '#FB7185', desc: 'Lightweight event router — shim delegating to NervousSystem' },
  { layer: 'Digital Soul',    tech: 'DigitalSoul.js',        icon: <FiActivity />, color: '#818CF8', desc: 'Emotionally-reactive cursor entity with 8 behavioral states' },
  { layer: 'Haptic Engine',   tech: 'HapticEngine.js',       icon: <FiZap />,      color: '#F43F5E', desc: 'Battery-aware tactile vibration API for physical feedback' },
  { layer: 'Immersive Engine',tech: 'ImmersiveEngine.js',    icon: <FiGlobe />,    color: '#3B82F6', desc: 'Translates biological stats to real-time atmospheric CSS variables' },
  { layer: 'Motion Engine',   tech: 'GSAP ScrollTrigger',    icon: <FiZap />,      color: '#88CE02', desc: 'Butter-smooth scroll-driven animations with GPU-friendly transforms' },
];

const RENDER_STRATEGIES = [
  { name: 'Hero',                  strategy: 'Eager',                   reason: 'LCP critical — rendered immediately' },
  { name: 'Navbar',                strategy: 'Eager',                   reason: 'Above the fold — always visible' },
  { name: 'Below-fold Sections',   strategy: 'Lazy + IntersectionObserver', reason: 'Loaded 600px before entering viewport' },
  { name: 'NeuralMap (3D)',         strategy: 'Lazy + Visibility Gate',  reason: 'WebGL paused when off-screen' },
  { name: 'Spotify / Chatbot',     strategy: 'Deferred (3.5s)',         reason: 'Non-critical widgets loaded after TTI' },
  { name: 'Particles',             strategy: 'Deferred (2s)',           reason: 'Decorative — delayed to protect FCP' },
  { name: 'DigitalSoul',           strategy: 'CRITICAL RAF Priority',   reason: 'Always runs — emotional engine must never sleep' },
  { name: 'Timeline Memory',       strategy: 'Cinematic Physics RAF',   reason: 'Virtual scroll with lerped momentum, no layout reads' },
  { name: 'Consciousness Tiers',   strategy: 'Interval @ 400ms',        reason: 'Score recalculated without React state, zero re-renders' },
  { name: 'GSAP Animations',       strategy: 'ScrollTrigger + Lenis',   reason: 'GPU-only transforms, synced via gsap.ticker proxy' },
];

const CONSCIOUSNESS_TIERS = [
  { tier: 'SUBCONSCIOUS',    range: '0–25',  color: '#6366F1', desc: 'Ambient baseline. Soul barely visible. Day-1 visitor.' },
  { tier: 'CONSCIOUS',       range: '26–55', color: '#10B981', desc: 'Active session. Standard Soul tracking. Whispers enabled.' },
  { tier: 'SUPER_CONSCIOUS', range: '56–80', color: '#F59E0B', desc: 'Returning visitor or 3+ min dwell. Soul becomes more present.' },
  { tier: 'HYPER_CONSCIOUS', range: '81+',   color: '#EF4444', desc: 'Peak event (Timeline linger, MiniAdhy open). Transient 18–22s.' },
];

const StackVisualizer = () => {
  const [loadTime, setLoadTime] = useState(null);
  const [componentCount, setComponentCount] = useState(0);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const metricsRef = useRef(null);
  const gridRef = useRef(null);
  const renderRef = useRef(null);
  const consciousnessRef = useRef(null);

  useEffect(() => {
    // Measure actual page load performance
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        setLoadTime((nav.loadEventEnd - nav.startTime).toFixed(0));
      }
    } catch { /* Fallback */ }

    // Count rendered components
    const allComponents = document.querySelectorAll('[class*="section"], [class*="container"], section');
    setComponentCount(allComponents.length);
  }, []);

  // GSAP Scroll Animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header: orchestrated stagger
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('.section-label, .section-title, .section-divider, .section-desc');
        gsap.fromTo(headerEls,
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true }
          }
        );
      }

      // Metrics bar: counter-like pop
      if (metricsRef.current) {
        const cards = metricsRef.current.querySelectorAll('.metric-card');
        gsap.fromTo(cards,
          { y: 30, opacity: 0, scale: 0.9 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'back.out(1.7)',
            scrollTrigger: { trigger: metricsRef.current, start: 'top 85%', once: true }
          }
        );
      }

      // Architecture grid: cascade with left-to-right slide
      if (gridRef.current) {
        const layers = gridRef.current.querySelectorAll('.stack-layer-card');
        gsap.fromTo(layers,
          { x: -40, opacity: 0 },
          {
            x: 0, opacity: 1,
            duration: 0.6,
            stagger: 0.06,
            ease: 'power4.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 80%', once: true }
          }
        );
      }

      // Render strategy table: fade rows
      if (renderRef.current) {
        const rows = renderRef.current.querySelectorAll('.render-row:not(.render-header)');
        gsap.fromTo(rows,
          { opacity: 0, x: -20 },
          {
            opacity: 1, x: 0,
            duration: 0.5,
            stagger: 0.04,
            ease: 'power3.out',
            scrollTrigger: { trigger: renderRef.current, start: 'top 85%', once: true }
          }
        );
      }

      // Consciousness tiers: scale-in cascade
      if (consciousnessRef.current) {
        const tierCards = consciousnessRef.current.querySelectorAll('.consciousness-tier-card');
        gsap.fromTo(tierCards,
          { opacity: 0, scale: 0.9, y: 20 },
          {
            opacity: 1, scale: 1, y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: consciousnessRef.current, start: 'top 85%', once: true }
          }
        );

        // NervousSystem callout
        const callout = consciousnessRef.current.querySelector('.nervous-system-callout');
        if (callout) {
          gsap.fromTo(callout,
            { y: 30, opacity: 0 },
            {
              y: 0, opacity: 1,
              duration: 0.8,
              ease: 'power4.out',
              scrollTrigger: { trigger: callout, start: 'top 90%', once: true }
            }
          );
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="stack-viz-section" id="stack-visualizer" ref={sectionRef}>
      <div className="container">
        <div className="stack-viz-header" ref={headerRef}>
          <span className="section-label">{"// under the hood"}</span>
          <h2 className="section-title">
            Stack <span>Architecture</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            The engineering decisions and technical infrastructure powering this portfolio.
          </p>
        </div>

        {/* Performance Metrics Bar */}
        <div className="stack-metrics-bar" ref={metricsRef}>
          <div className="metric-card">
            <FiClock className="metric-icon" />
            <div className="metric-value">{loadTime || '—'}ms</div>
            <div className="metric-label">Page Load</div>
          </div>
          <div className="metric-card">
            <FiLayers className="metric-icon" />
            <div className="metric-value">{componentCount}</div>
            <div className="metric-label">Components</div>
          </div>
          <div className="metric-card">
            <FiPackage className="metric-icon" />
            <div className="metric-value">20</div>
            <div className="metric-label">Dependencies</div>
          </div>
          <div className="metric-card">
            <FiZap className="metric-icon" />
            <div className="metric-value">60</div>
            <div className="metric-label">Target FPS</div>
          </div>
        </div>

        {/* Architecture Stack */}
        <div className="stack-architecture-grid" ref={gridRef}>
          {ARCHITECTURE.map((item, i) => (
            <div
              key={item.layer}
              className="stack-layer-card"
              style={{ '--layer-color': item.color }}
            >
              <div className="stack-layer-icon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="stack-layer-info">
                <div className="stack-layer-name">{item.layer}</div>
                <div className="stack-layer-tech">{item.tech}</div>
                <div className="stack-layer-desc">{item.desc}</div>
              </div>
              <div className="stack-layer-accent" style={{ background: item.color }} />
            </div>
          ))}
        </div>

        {/* Render Strategy Table */}
        <div className="stack-render-section" ref={renderRef}>
          <h3 className="stack-sub-title">
            <FiActivity /> Render Strategy
          </h3>
          <div className="render-table">
            <div className="render-row render-header">
              <span>Component</span>
              <span>Strategy</span>
              <span>Rationale</span>
            </div>
            {RENDER_STRATEGIES.map((r, i) => (
              <div key={r.name} className="render-row">
                <span className="render-component">{r.name}</span>
                <span className="render-strategy-badge">{r.strategy}</span>
                <span className="render-reason">{r.reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Consciousness Tier System */}
        <div className="stack-consciousness-section" ref={consciousnessRef}>
          <h3 className="stack-sub-title">
            <FiCpu /> Living Architecture — Consciousness Tiers
          </h3>
          <p className="stack-consciousness-desc">
            The website self-regulates into 4 awareness states based on visit history,
            session dwell, interaction density, and adrenaline score. All state lives in
            a single RAF-driven singleton — zero React re-renders for emotional transitions.
          </p>
          <div className="consciousness-tier-grid">
            {CONSCIOUSNESS_TIERS.map((t, i) => (
              <div
                key={t.tier}
                className="consciousness-tier-card"
                style={{ '--tier-color': t.color }}
              >
                <div className="tier-header">
                  <span className="tier-name" style={{ color: t.color }}>{t.tier}</span>
                  <span className="tier-range">{t.range} pts</span>
                </div>
                <p className="tier-desc">{t.desc}</p>
                <div className="tier-bar">
                  <div className="tier-bar-fill" style={{ background: t.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="nervous-system-callout">
            <div className="ns-callout-icon"><FiCpu /></div>
            <div>
              <div className="ns-callout-title">NervousSystem.js — Unified Brain</div>
              <div className="ns-callout-desc">
                Single singleton owns the RAF loop, event bus, shared state, and Digital Soul
                emotional queue. NeuralEventBus, PresenceEngine, and SystemOrchestrator are
                backward-compatible shims. Emotional latency reduced from ~800ms to &lt;16ms.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StackVisualizer;
