import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteMode, MODES } from '../contexts/SiteModeContext';
import { FiSettings, FiX, FiBriefcase, FiCpu, FiZap, FiEye, FiMonitor, FiType, FiMousePointer } from 'react-icons/fi';
import './SiteModeSwitcher.css';

import './SiteModeSwitcher.css';

export const SiteModePanel = ({ inline = false }) => {
  const { mode, setMode, a11y, toggleA11y, isExpert } = useSiteMode();

  const modes = [
    { key: MODES.NORMAL,       icon: <FiSettings size={16} />,   label: 'Normal',          desc: 'Standard fast experience' },
    { key: MODES.RECRUITER,    icon: <FiBriefcase size={16} />,  label: 'Recruiter',       desc: 'Focused portfolio view' },
    { key: MODES.EXPERT,       icon: <FiCpu size={16} />,        label: 'Expert',          desc: 'Full technical depth' },
    { key: MODES.EXPERIMENTAL, icon: <FiZap size={16} />,        label: 'Experimental Lab', desc: 'Bleeding-edge effects' },
  ];

  const a11yFlags = [
    { key: 'reducedMotion',         icon: <FiEye size={14} />,          label: 'Reduced Motion' },
    { key: 'lowGpu',                icon: <FiMonitor size={14} />,      label: 'Low GPU Mode' },
    { key: 'highReadability',       icon: <FiType size={14} />,         label: 'High Readability' },
    { key: 'simplifiedInteraction', icon: <FiMousePointer size={14} />, label: 'Simplified Interaction' },
  ];

  return (
    <div className={`smp-content ${inline ? 'smp-inline' : ''}`}>
      <div className="smp-header">
        <span className="smp-label">SITE MODE</span>
        {isExpert && <span className="smp-badge">EXPERT</span>}
      </div>

      <div className="smp-modes">
        {modes.map((m) => (
          <button
            key={m.key}
            className={`smp-mode-btn ${mode === m.key ? 'smp-active' : ''}`}
            onClick={() => setMode(m.key)}
          >
            <span className="smp-mode-icon">{m.icon}</span>
            <div className="smp-mode-text">
              <span className="smp-mode-label">{m.label}</span>
              <span className="smp-mode-desc">{m.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="smp-divider" />
      <div className="smp-header">
        <span className="smp-label">ACCESSIBILITY</span>
      </div>
      <div className="smp-a11y">
        {a11yFlags.map((f) => (
          <button
            key={f.key}
            className={`smp-a11y-btn ${a11y[f.key] ? 'smp-a11y-active' : ''}`}
            onClick={() => toggleA11y(f.key)}
          >
            {f.icon}
            <span>{f.label}</span>
            <span className="smp-toggle-dot" />
          </button>
        ))}
      </div>
    </div>
  );
};

const SiteModeSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="site-mode-fab"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 135 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        title="Site Mode Switcher"
      >
        {isOpen ? <FiX size={20} /> : <FiSettings size={20} />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="site-mode-panel"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <SiteModePanel />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SiteModeSwitcher;
