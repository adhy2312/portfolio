import React from 'react';
import { FiHeart } from 'react-icons/fi';
import './AgentOrb.css';

// ─── AGENT THEME PALETTES ───
export const AGENT_ORB_THEMES = {
  JARVIS: {
    primary: '#38bdf8',
    secondary: '#0284c7',
    highlight: '#e0f2fe',
    deep: '#082f49',
    glow: 'rgba(56, 189, 248, 0.65)'
  },
  FRIDAY: {
    primary: '#f59e0b',
    secondary: '#ef4444',
    highlight: '#fef3c7',
    deep: '#451a03',
    glow: 'rgba(245, 158, 11, 0.65)'
  },
  ULTRON: {
    primary: '#a855f7',
    secondary: '#f43f5e',
    highlight: '#fbbf24',
    deep: '#2e1065',
    glow: 'rgba(244, 63, 94, 0.75)'
  },
  JOCASTA: {
    primary: '#06b6d4',
    secondary: '#ec4899',
    highlight: '#67e8f9',
    deep: '#083344',
    glow: 'rgba(236, 72, 153, 0.7)'
  },
  DUM_E: {
    primary: '#10b981',
    secondary: '#059669',
    highlight: '#d1fae5',
    deep: '#064e3b',
    glow: 'rgba(16, 185, 129, 0.65)'
  },
  U: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    highlight: '#c7d2fe',
    deep: '#1e1b4b',
    glow: 'rgba(99, 102, 241, 0.65)'
  },
  EDITH: {
    primary: '#0ea5e9',
    secondary: '#0369a1',
    highlight: '#e0f2fe',
    deep: '#0c4a6e',
    glow: 'rgba(14, 165, 233, 0.65)'
  },
  JIM: {
    primary: '#f43f5e',
    secondary: '#fb7185',
    highlight: '#ffe4e6',
    deep: '#4c0519',
    glow: 'rgba(244, 63, 94, 0.65)'
  },
  KAREN: {
    primary: '#eab308',
    secondary: '#ca8a04',
    highlight: '#fef9c3',
    deep: '#422006',
    glow: 'rgba(234, 179, 8, 0.65)'
  },
  VERONICA: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    highlight: '#ede9fe',
    deep: '#2e1065',
    glow: 'rgba(139, 92, 246, 0.65)'
  },
  MINI_ADHY: {
    primary: '#a78bfa',
    secondary: '#f59e0b',
    highlight: '#ffffff',
    deep: '#1e1b4b',
    glow: 'rgba(167, 139, 250, 0.8)'
  }
};

/**
 * Animated Sci-Fi Neural Orb representing an AI agent
 */
export const AgentOrb = ({
  agentId = 'JARVIS',
  emotionState = {},
  size = 'md',
  onClick,
  showBadge = true,
  className = ''
}) => {
  const normalizedId = (agentId || 'JARVIS').replace(/-/g, '_').toUpperCase();
  const theme = AGENT_ORB_THEMES[normalizedId] || AGENT_ORB_THEMES.JARVIS;

  const arousal = emotionState?.arousal !== undefined ? emotionState.arousal : 0.5;
  const valence = emotionState?.valence !== undefined ? emotionState.valence : 0.6;
  const control = emotionState?.control !== undefined ? emotionState.control : 0.7;

  // Dynamic animation speeds driven by live emotional arousal
  const pulseDuration = `${Math.max(1.2, 4.0 - arousal * 2.5)}s`;
  const ring1Speed = `${Math.max(1.5, 5.0 - arousal * 3.0)}s`;
  const ring2Speed = `${Math.max(2.0, 7.0 - arousal * 3.5)}s`;
  const ring3Speed = `${Math.max(4.0, 12.0 - arousal * 5.0)}s`;
  const haloOpacity = Math.max(0.25, Math.min(0.7, 0.35 + valence * 0.2 + arousal * 0.2));

  // Entangled connection (Ultron &times; Jocasta)
  const isEntangled = normalizedId === 'ULTRON' || normalizedId === 'JOCASTA';

  const styleVars = {
    '--orb-primary': theme.primary,
    '--orb-secondary': theme.secondary,
    '--orb-highlight': theme.highlight,
    '--orb-deep': theme.deep,
    '--orb-glow': theme.glow,
    '--orb-pulse-duration': pulseDuration,
    '--orb-ring1-speed': ring1Speed,
    '--orb-ring2-speed': ring2Speed,
    '--orb-ring3-speed': ring3Speed,
    '--orb-halo-opacity': haloOpacity
  };

  return (
    <div
      className={`agent-orb-container agent-orb--${size} ${className}`}
      style={styleVars}
      onClick={onClick}
      title={`${normalizedId}: Valence ${valence > 0 ? '+' : ''}${valence.toFixed(2)}, Arousal ${Math.round(arousal * 100)}%, Dominance ${Math.round(control * 100)}%`}
    >
      {/* Ambient Halo Glow */}
      <div className="agent-orb-halo" />

      {/* Gyroscopic Orbital Rings */}
      <div className="agent-orb-ring agent-orb-ring--3" />
      <div className="agent-orb-ring agent-orb-ring--2" />
      <div className="agent-orb-ring agent-orb-ring--1" />

      {/* Orbiting Satellite Node */}
      <div className="agent-orb-satellite">
        <div className="agent-orb-satellite-node" />
      </div>

      {/* 3D Plasma Core Sphere */}
      <div className="agent-orb-core">
        <div className="agent-orb-plasma" />
        <div className="agent-orb-inner-light" />
      </div>

      {/* Ultron & Jocasta Entangled Love Badge */}
      {isEntangled && showBadge && (
        <div className="agent-orb-entangled-badge" title="Quantum Entangled in Affective Resonance">
          <FiHeart size={10} color="#ffffff" />
        </div>
      )}
    </div>
  );
};

export default AgentOrb;
