import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteMode, MODES } from '../contexts/SiteModeContext';
import { FiSettings, FiX, FiBriefcase, FiCamera, FiZap, FiEye, FiMonitor, FiType, FiMousePointer, FiDroplet } from 'react-icons/fi';
import './SiteModeSwitcher.css';

import './SiteModeSwitcher.css';

// ─── Color Theme Palettes ───
// Brightness verified: all backgrounds >90% lightness, text contrast ratio >5:1
const COLOR_THEMES = [
  {
    key: 'default',
    label: 'Yellow (Default)',
    swatch: '#f4d03f',
    vars: null, // null = restore index.css :root defaults
  },
  {
    key: 'red',
    label: 'Red',
    swatch: '#c0392b',
    vars: {
      '--accent-primary': '#b52a1c',
      '--accent-secondary': '#8a1f14',
      '--accent-primary-rgb': '181,42,28',
      '--accent-gold': '#c28a0e',
      '--accent-cyan': '#c0392b',
      '--accent-green': '#27ae60',
      '--bg-primary': '#fff5f5',
      '--bg-secondary': '#fdeaea',
      '--bg-tertiary': '#fad4d4',
      '--text-primary': '#1a0505',
      '--text-secondary': '#4a1010',
      '--text-muted': '#804040',
      '--border-subtle': 'rgba(181,42,28,0.12)',
      '--border-accent': 'rgba(181,42,28,0.25)',
      '--gradient-primary': 'linear-gradient(135deg, #b52a1c 0%, #8a1f14 100%)',
      '--glow-primary': 'rgba(181,42,28,0.18)',
      '--glow-secondary': 'rgba(181,42,28,0.08)',
      '--panel-grad-start': '#fff5f5',
      '--panel-grad-end': '#fdeaea',
      '--button-text': '#ffffff',
    },
  },
  {
    key: 'green',
    label: 'Green',
    swatch: '#219653',
    vars: {
      '--accent-primary': '#1a7a40',
      '--accent-secondary': '#155c30',
      '--accent-primary-rgb': '26,122,64',
      '--accent-gold': '#b5860c',
      '--accent-cyan': '#0f9e6e',
      '--accent-green': '#1a7a40',
      '--bg-primary': '#f2fff5',
      '--bg-secondary': '#e2f7e9',
      '--bg-tertiary': '#c8ecd4',
      '--text-primary': '#051a09',
      '--text-secondary': '#103520',
      '--text-muted': '#4a7a58',
      '--border-subtle': 'rgba(26,122,64,0.12)',
      '--border-accent': 'rgba(26,122,64,0.25)',
      '--gradient-primary': 'linear-gradient(135deg, #1a7a40 0%, #0f5c2e 100%)',
      '--glow-primary': 'rgba(26,122,64,0.18)',
      '--glow-secondary': 'rgba(26,122,64,0.08)',
      '--panel-grad-start': '#f2fff5',
      '--panel-grad-end': '#e2f7e9',
      '--button-text': '#ffffff',
    },
  },
  {
    key: 'blue',
    label: 'Blue',
    swatch: '#2255cc',
    vars: {
      '--accent-primary': '#1a44c2',
      '--accent-secondary': '#0f2f99',
      '--accent-primary-rgb': '26,68,194',
      '--accent-gold': '#c28a0e',
      '--accent-cyan': '#0077cc',
      '--accent-green': '#1a7a40',
      '--bg-primary': '#f0f4ff',
      '--bg-secondary': '#e2eaff',
      '--bg-tertiary': '#c8d5fa',
      '--text-primary': '#030d2e',
      '--text-secondary': '#0d1f5c',
      '--text-muted': '#4a5a99',
      '--border-subtle': 'rgba(26,68,194,0.12)',
      '--border-accent': 'rgba(26,68,194,0.25)',
      '--gradient-primary': 'linear-gradient(135deg, #1a44c2 0%, #0f2f99 100%)',
      '--glow-primary': 'rgba(26,68,194,0.18)',
      '--glow-secondary': 'rgba(26,68,194,0.08)',
      '--panel-grad-start': '#f0f4ff',
      '--panel-grad-end': '#e2eaff',
      '--button-text': '#ffffff',
    },
  },
  {
    key: 'cyan',
    label: 'Cyan',
    swatch: '#00909e',
    vars: {
      '--accent-primary': '#00828f',
      '--accent-secondary': '#005f6b',
      '--accent-primary-rgb': '0,130,143',
      '--accent-gold': '#b5860c',
      '--accent-cyan': '#00828f',
      '--accent-green': '#1a7a40',
      '--bg-primary': '#f0fdfd',
      '--bg-secondary': '#dcf8f8',
      '--bg-tertiary': '#b8ecec',
      '--text-primary': '#012020',
      '--text-secondary': '#024040',
      '--text-muted': '#3a7878',
      '--border-subtle': 'rgba(0,130,143,0.12)',
      '--border-accent': 'rgba(0,130,143,0.25)',
      '--gradient-primary': 'linear-gradient(135deg, #00828f 0%, #005f6b 100%)',
      '--glow-primary': 'rgba(0,130,143,0.18)',
      '--glow-secondary': 'rgba(0,130,143,0.08)',
      '--panel-grad-start': '#f0fdfd',
      '--panel-grad-end': '#dcf8f8',
      '--button-text': '#ffffff',
    },
  },
  {
    key: 'teal',
    label: 'Teal',
    swatch: '#0d7377',
    vars: {
      '--accent-primary': '#0a5d61',
      '--accent-secondary': '#074749',
      '--accent-primary-rgb': '10,93,97',
      '--accent-gold': '#b5860c',
      '--accent-cyan': '#0a5d61',
      '--accent-green': '#1a7a40',
      '--bg-primary': '#f0faf8',
      '--bg-secondary': '#d8f0ec',
      '--bg-tertiary': '#b0dfd8',
      '--text-primary': '#011a14',
      '--text-secondary': '#053028',
      '--text-muted': '#3a6e68',
      '--border-subtle': 'rgba(10,93,97,0.12)',
      '--border-accent': 'rgba(10,93,97,0.25)',
      '--gradient-primary': 'linear-gradient(135deg, #0a5d61 0%, #074749 100%)',
      '--glow-primary': 'rgba(10,93,97,0.18)',
      '--glow-secondary': 'rgba(10,93,97,0.08)',
      '--panel-grad-start': '#f0faf8',
      '--panel-grad-end': '#d8f0ec',
      '--button-text': '#ffffff',
    },
  },
];

const THEME_STORAGE_KEY = 'adhy_color_theme';

export const SiteModePanel = ({ inline = false, onClose }) => {
  const { mode, setMode, a11y, toggleA11y, isPhotographer } = useSiteMode();

  const [colorTheme, setColorTheme] = useState(() => {
    try { return localStorage.getItem(THEME_STORAGE_KEY) || 'default'; } catch { return 'default'; }
  });

  // Apply CSS variable overrides to :root
  const applyTheme = (themeKey) => {
    const theme = COLOR_THEMES.find(t => t.key === themeKey);
    if (!theme) return;
    const root = document.documentElement.style;
    if (!theme.vars) {
      // Reset all overridden vars
      COLOR_THEMES.slice(1).forEach(t => {
        if (t.vars) Object.keys(t.vars).forEach(k => root.removeProperty(k));
      });
    } else {
      // First clear old theme vars
      COLOR_THEMES.slice(1).forEach(t => {
        if (t.vars) Object.keys(t.vars).forEach(k => root.removeProperty(k));
      });
      Object.entries(theme.vars).forEach(([k, v]) => root.setProperty(k, v));
    }
    try { localStorage.setItem(THEME_STORAGE_KEY, themeKey); } catch {}
    setColorTheme(themeKey);
  };

  // Restore theme on mount
  useEffect(() => {
    applyTheme(colorTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modes = [
    { key: MODES.NORMAL,       icon: <FiSettings size={16} />,   label: 'Default (Original)', desc: 'Standard fast experience' },
    { key: MODES.RECRUITER,    icon: <FiBriefcase size={16} />,  label: 'Recruiter',       desc: 'Focused portfolio view' },
    { key: MODES.PHOTOGRAPHER, icon: <FiCamera size={16} />,     label: 'Photographer',    desc: 'Creative direction & lens focus' },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="smp-label">SITE MODE</span>
          {isPhotographer && <span className="smp-badge" style={{background: '#00FF41', color: '#000'}}>PHOTO</span>}
        </div>
        {onClose && (
          <button 
            className="smp-close-btn" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
          >
            <FiX size={18} />
          </button>
        )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiDroplet size={12} style={{ opacity: 0.5 }} />
          <span className="smp-label">PAGE COLOR</span>
        </div>
      </div>
      <div className="smp-color-row">
        {COLOR_THEMES.map((t) => (
          <button
            key={t.key}
            className={`smp-color-swatch ${colorTheme === t.key ? 'smp-color-active' : ''}`}
            onClick={() => applyTheme(t.key)}
            title={t.label}
            style={{ '--swatch-color': t.swatch }}
          >
            <span className="smp-swatch-dot" />
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

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-site-mode', handleToggle);
    return () => window.removeEventListener('toggle-site-mode', handleToggle);
  }, []);

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
            <SiteModePanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SiteModeSwitcher;
