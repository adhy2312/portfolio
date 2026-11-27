import React, { Component, useState } from 'react';
import { FiSun, FiMoon, FiArrowUpRight, FiCompass, FiFileText, FiDownload, FiX, FiGlobe, FiSend, FiCheckCircle } from 'react-icons/fi';
import { useSiteMode, MODES } from '../../contexts/SiteModeContext';
import { useConsciousness } from '../../contexts/ConsciousnessContext';
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
  { labelKey: 'nav.about', fallback: 'About', selector: '#about, .about-section' },
  { labelKey: 'nav.works', fallback: 'Works', selector: '#works, .projects-section, .my-works-section' },
  { labelKey: 'nav.skills', fallback: 'Skills', selector: '#skills, .skills-section' },
  { labelKey: 'nav.photography', fallback: 'Photography', selector: '#photography, .photography-section' },
  { labelKey: 'nav.contact', fallback: 'Contact', selector: '#contact, .contact-section' },
];

const CORE_EXPLORE_SECTIONS = ['Hero', 'About', 'Skills', 'MyWorks', 'Photography', 'Contact'];

function BetaWorkspaceBar() {
  const { setMode, isDarkMode, toggleDarkMode, lang, setLang, t, detectedBrowserLang, siteLanguages } = useSiteMode();
  const { digitalEchoes, activeSection } = useConsciousness();
  const [showResumeModal, setShowResumeModal] = useState(false);

  const exploredSet = new Set(Object.keys(digitalEchoes?.sectionHeatmap || {}));
  if (activeSection) exploredSet.add(activeSection);
  const exploredCount = CORE_EXPLORE_SECTIONS.filter(s => exploredSet.has(s)).length;

  const scrollToSection = (selector) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="beta-suite-section" id="beta-lab">
      <div className="beta-suite-card">
        <div className="beta-suite-header">
          <div className="beta-brand-block">
            <div className="beta-badges-row">
              <span className="beta-pill">BETA v2.0 // STUDIO REDESIGN</span>
              <span className="beta-progress-pill" title="Sections explored in this session">
                {exploredCount}/6 {t('beta.explored', 'sections explored')}
              </span>
            </div>
            <h2 className="beta-title">{t('beta.title', 'Next-Gen Portfolio Preview')}</h2>
            <p className="beta-subtitle">{t('beta.subtitle')}</p>
          </div>

          <div className="beta-actions-cluster">
            <div className="beta-lang-wrap" title="Switch website language">
              <FiGlobe size={13} />
              <select
                className="beta-lang-select"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Website language"
              >
                {siteLanguages.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            {detectedBrowserLang !== 'en' && lang !== detectedBrowserLang && (
              <button
                type="button"
                className="beta-btn beta-btn--ghost"
                onClick={() => setLang(detectedBrowserLang)}
                title="Switch to your browser language"
              >
                Switch to {detectedBrowserLang.toUpperCase()}
              </button>
            )}

            <button type="button" className="beta-btn beta-btn--ghost" onClick={() => setShowResumeModal(true)}>
              <FiFileText size={14} />
              <span>{t('beta.resumeBtn', 'Resume Preview')}</span>
            </button>

            <button type="button" className="beta-btn beta-btn--ghost" onClick={toggleDarkMode} title="Toggle Light/Obsidian Dark">
              {isDarkMode ? <FiSun size={14} /> : <FiMoon size={14} />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>

            <button type="button" className="beta-btn" onClick={() => setMode(MODES.NORMAL)}>
              <span>{t('beta.exit', 'Exit Beta')}</span>
              <FiArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="beta-jump-bar">
          <span className="beta-jump-label"><FiCompass size={12} /> Quick Jump:</span>
          <div className="beta-jump-pills">
            {JUMP_SECTIONS.map(s => (
              <button key={s.labelKey} type="button" className="beta-jump-pill" onClick={() => scrollToSection(s.selector)}>
                {t(s.labelKey, s.fallback)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Resume Preview Modal */}
      {showResumeModal && (
        <div className="beta-modal-backdrop" onClick={() => setShowResumeModal(false)}>
          <div className="beta-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="beta-modal-header">
              <div>
                <h3 className="beta-modal-title">Adhithya Mohan — Resume</h3>
                <span className="beta-modal-sub">ECE Engineer · Full-Stack Developer · AI Systems</span>
              </div>
              <div className="beta-modal-actions">
                <a href="/resume.pdf" download className="beta-btn">
                  <FiDownload size={13} /> Download PDF
                </a>
                <button type="button" className="beta-btn beta-btn--ghost" onClick={() => setShowResumeModal(false)} aria-label="Close resume modal">
                  <FiX size={15} />
                </button>
              </div>
            </div>
            <div className="beta-modal-body">
              <iframe src="/resume.pdf" title="Resume Preview" className="beta-resume-frame" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function BetaFeedbackSection() {
  const { t } = useSiteMode();
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbCategory, setFbCategory] = useState('Visual / UI');
  const [fbMessage, setFbMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fbMessage.trim()) return;
    const subject = encodeURIComponent(`[Beta Feedback - ${fbCategory}] from ${fbName || 'Portfolio Visitor'}`);
    const body = encodeURIComponent(
      `Category: ${fbCategory}\nFrom: ${fbName || 'Anonymous'} (${fbEmail || 'No email provided'})\n\n${fbMessage}`
    );
    window.location.href = `mailto:adhithyamohan2312@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section className="beta-feedback-section" id="beta-feedback">
      <div className="beta-suite-card">
        <div className="beta-badges-row">
          <span className="beta-pill">BETA FEEDBACK // DIRECT TO ADHITHYA</span>
        </div>
        <h3 className="beta-title">{t('feedback.title', 'Beta Feedback')}</h3>
        <p className="beta-subtitle" style={{ marginBottom: '16px' }}>
          {t('feedback.desc')}
        </p>

        <form className="beta-feedback-form" onSubmit={handleSubmit}>
          <div className="beta-feedback-row">
            <input
              type="text"
              className="beta-fb-input"
              placeholder="Your name (optional)"
              value={fbName}
              onChange={(e) => setFbName(e.target.value)}
            />
            <input
              type="email"
              className="beta-fb-input"
              placeholder="Your email (optional)"
              value={fbEmail}
              onChange={(e) => setFbEmail(e.target.value)}
            />
            <select
              className="beta-fb-input"
              value={fbCategory}
              onChange={(e) => setFbCategory(e.target.value)}
              aria-label="Feedback category"
            >
              <option value="Visual / UI">Visual / UI</option>
              <option value="AI / Mini-Adhy">AI / Mini-Adhy</option>
              <option value="Language / Translation">Language / Translation</option>
              <option value="Bug Report">Bug Report</option>
            </select>
          </div>

          <textarea
            className="beta-fb-textarea"
            rows={3}
            placeholder="Share your thoughts, bugs, or feature ideas for Beta..."
            value={fbMessage}
            onChange={(e) => setFbMessage(e.target.value)}
            required
          />

          <div className="beta-feedback-footer">
            <span className="beta-fb-target">Target: adhithyamohan2312@gmail.com</span>
            <button type="submit" className="beta-btn">
              {sent ? <><FiCheckCircle size={13} /> Opening Mail Client…</> : <><FiSend size={13} /> {t('feedback.send', 'Send Feedback')}</>}
            </button>
          </div>
        </form>
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
