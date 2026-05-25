import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiCpu, FiLayers, FiZap, FiGlobe, FiPackage, FiClock, FiActivity } from 'react-icons/fi';
import './StackVisualizer.css';

const ARCHITECTURE = [
  { layer: 'Frontend', tech: 'React 19', icon: <FiLayers />, color: '#61DAFB', desc: 'Component-based UI with Suspense + Lazy loading' },
  { layer: 'Animation', tech: 'Framer Motion 12', icon: <FiZap />, color: '#FF6B9D', desc: 'Spring physics, scroll-scrubbing, layout animations' },
  { layer: 'Scrolling', tech: 'Lenis', icon: <FiActivity />, color: '#00FF87', desc: 'Lerp-based smooth scrolling at 60fps' },
  { layer: '3D Engine', tech: 'Three.js + R3F', icon: <FiCpu />, color: '#FFD93D', desc: 'WebGL Neural Map with real-time scroll-bound rotation' },
  { layer: 'CMS', tech: 'Sanity.io', icon: <FiGlobe />, color: '#F36458', desc: 'Headless CMS for dynamic content management' },
  { layer: 'Styling', tech: 'Vanilla CSS', icon: <FiPackage />, color: '#C084FC', desc: 'Custom design system with CSS variables & glass-morphism' },
  { layer: 'AI', tech: 'Gemini API', icon: <FiCpu />, color: '#4ECDC4', desc: 'Powers Mini-Adhy chatbot intelligence' },
  { layer: 'Hosting', tech: 'Vercel', icon: <FiGlobe />, color: '#fff', desc: 'Edge network with automatic CI/CD' },
];

const RENDER_STRATEGIES = [
  { name: 'Hero', strategy: 'Eager', reason: 'LCP critical — rendered immediately' },
  { name: 'Navbar', strategy: 'Eager', reason: 'Above the fold — always visible' },
  { name: 'Below-fold Sections', strategy: 'Lazy + IntersectionObserver', reason: 'Loaded 600px before entering viewport' },
  { name: 'NeuralMap (3D)', strategy: 'Lazy + Visibility Gate', reason: 'WebGL paused when off-screen' },
  { name: 'Spotify / Chatbot', strategy: 'Deferred (3.5s)', reason: 'Non-critical widgets loaded after TTI' },
  { name: 'Particles', strategy: 'Deferred (2s)', reason: 'Decorative — delayed to protect FCP' },
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
      </div>
    </section>
  );
};

export default StackVisualizer;
