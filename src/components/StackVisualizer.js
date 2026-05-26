import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiCpu, FiLayers, FiZap, FiGlobe, FiPackage, FiClock, FiActivity } from 'react-icons/fi';
import './StackVisualizer.css';

const ARCHITECTURE = [
  { layer: 'Frontend',        tech: 'React 19',              icon: <FiLayers />,   color: '#61DAFB', desc: 'Component-based UI with Suspense + Lazy loading' },
  { layer: 'Animation',       tech: 'Framer Motion 12',      icon: <FiZap />,      color: '#FF6B9D', desc: 'Spring physics, scroll-scrubbing, layout animations' },
  { layer: 'Scrolling',       tech: 'Lenis',                 icon: <FiActivity />, color: '#00FF87', desc: 'Lerp-based smooth scrolling at 60fps' },
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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

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

  return (
    <section className="stack-viz-section" id="stack-visualizer" ref={ref}>
      <div className="container">
        <motion.div
          className="stack-viz-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">{"// under the hood"}</span>
          <h2 className="section-title">
            Stack <span>Architecture</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            The engineering decisions and technical infrastructure powering this portfolio.
          </p>
        </motion.div>

        {/* Performance Metrics Bar */}
        <motion.div
          className="stack-metrics-bar"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
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
            <div className="metric-value">19</div>
            <div className="metric-label">Dependencies</div>
          </div>
          <div className="metric-card">
            <FiZap className="metric-icon" />
            <div className="metric-value">60</div>
            <div className="metric-label">Target FPS</div>
          </div>
        </motion.div>

        {/* Architecture Stack */}
        <div className="stack-architecture-grid">
          {ARCHITECTURE.map((item, i) => (
            <motion.div
              key={item.layer}
              className="stack-layer-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: isInView ? i * 0.08 : 0 }}
              viewport={{ once: true }}
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
            </motion.div>
          ))}
        </div>

        {/* Render Strategy Table */}
        <motion.div
          className="stack-render-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
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
              <motion.div
                key={r.name}
                className="render-row"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <span className="render-component">{r.name}</span>
                <span className="render-strategy-badge">{r.strategy}</span>
                <span className="render-reason">{r.reason}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Consciousness Tier System */}
        <motion.div
          className="stack-consciousness-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
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
              <motion.div
                key={t.tier}
                className="consciousness-tier-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                viewport={{ once: true }}
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
              </motion.div>
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
        </motion.div>
      </div>
    </section>
  );
};

export default StackVisualizer;
