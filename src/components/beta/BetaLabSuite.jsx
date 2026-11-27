import React, { Component } from 'react';
import { FiSun, FiMoon, FiArrowUpRight, FiCompass } from 'react-icons/fi';
import { useSiteMode, MODES } from '../../contexts/SiteModeContext';
import './BetaLabSuite.css';

class BetaErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="beta-error-box">
          <h3>Beta Sandbox Caught an Error</h3>
          <p>The main portfolio is unaffected. Error: {this.state.error?.message || 'Unknown error'}</p>
          <button type="button" className="beta-btn" onClick={() => this.setState({ hasError: false, error: null })}>
            Reset Beta Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const JUMP_SECTIONS = [
  { label: 'About', selector: '#about, .about-section' },
  { label: 'Works', selector: '#works, .projects-section, .my-works-section' },
  { label: 'Skills', selector: '#skills, .skills-section' },
  { label: 'Photography', selector: '#photography, .photography-section' },
  { label: 'Contact', selector: '#contact, .contact-section' },
];

function BetaWorkspaceBar() {
  const { setMode, isDarkMode, toggleDarkMode } = useSiteMode();

  const scrollToSection = (selector) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="beta-suite-section" id="beta-lab">
      <div className="beta-suite-card">
        <div className="beta-suite-header">
          <div className="beta-brand-block">
            <span className="beta-pill">BETA v2.0 // STUDIO REDESIGN</span>
            <h2 className="beta-title">Next-Gen Portfolio Preview</h2>
            <p className="beta-subtitle">
              Refined editorial typography, soft glass surfaces, and indigo-ink palette — isolated in Beta without touching Experimental or Default modes.
            </p>
          </div>

          <div className="beta-actions-cluster">
            <button type="button" className="beta-btn beta-btn--ghost" onClick={toggleDarkMode} title="Toggle Light/Obsidian Dark">
              {isDarkMode ? <FiSun size={14} /> : <FiMoon size={14} />}
              <span>{isDarkMode ? 'Light Studio' : 'Obsidian Dark'}</span>
            </button>
            <button type="button" className="beta-btn" onClick={() => setMode(MODES.NORMAL)}>
              <span>Exit Beta</span>
              <FiArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="beta-jump-bar">
          <span className="beta-jump-label"><FiCompass size={12} /> Quick Jump:</span>
          <div className="beta-jump-pills">
            {JUMP_SECTIONS.map(s => (
              <button key={s.label} type="button" className="beta-jump-pill" onClick={() => scrollToSection(s.selector)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BetaLabSuite() {
  return (
    <BetaErrorBoundary>
      <BetaWorkspaceBar />
    </BetaErrorBoundary>
  );
}
