import React, { Component, useEffect, useRef, useState } from 'react';
import { FiSun, FiMoon, FiArrowUpRight, FiCompass, FiFileText, FiDownload, FiX, FiGlobe, FiSend, FiCheckCircle, FiCpu } from 'react-icons/fi';
import { useSiteMode, MODES } from '../../contexts/SiteModeContext';
import { useConsciousness } from '../../contexts/ConsciousnessContext';
import { readAmbientFlags, writeAmbientFlags } from './BetaAmbientController';
import { runBetaAgenticIntent, dispatchAgenticAction } from '../../core/betaAgenticBus';
import './BetaLabSuite.css';

export class BetaErrorBoundary extends Component {
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
  const [uptimeSec, setUptimeSec] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [ambientFlags, setAmbientFlags] = useState(readAmbientFlags);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [agenticTrace, setAgenticTrace] = useState('');
  const [loadMs, setLoadMs] = useState(null);
  const copilotInputRef = useRef(null);

  useEffect(() => {
    try {
      const nav = performance.getEntriesByType?.('navigation')?.[0];
      if (nav && nav.domInteractive > 0) {
        setLoadMs(Math.round(nav.domInteractive));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onTrace = (e) => {
      if (e?.detail?.label) setAgenticTrace(e.detail.label);
    };
    const onAmbient = (e) => {
      if (e?.detail) setAmbientFlags(e.detail);
    };
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        copilotInputRef.current?.focus();
      }
    };
    window.addEventListener('beta:agentic-trace', onTrace);
    window.addEventListener('beta:ambient-change', onAmbient);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('beta:agentic-trace', onTrace);
      window.removeEventListener('beta:ambient-change', onAmbient);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleCopilotSubmit = (e) => {
    e.preventDefault();
    const q = copilotQuery.trim();
    if (!q) return;
    const result = runBetaAgenticIntent(q);
    if (result.matched) {
      setAgenticTrace(result.summary);
    } else {
      setAgenticTrace(`Forwarded "${q}" to Mini-Adhy`);
      window.dispatchEvent(new CustomEvent('miniadhy:ask', { detail: { prompt: q } }));
    }
    setCopilotQuery('');
  };

  useEffect(() => {
    const id = setInterval(() => setUptimeSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        setScrollPct(Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100))));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const toggleAmbient = (key) => {
    setAmbientFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeAmbientFlags(next);
      return next;
    });
  };

  const uptimeStr = `${String(Math.floor(uptimeSec / 60)).padStart(2, '0')}:${String(uptimeSec % 60).padStart(2, '0')}`;
  const vuAngle = -42 + (scrollPct / 100) * 84;

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
              <span className="beta-deploy-pill" title="Production Deployment Status">
                <span className="beta-deploy-dot" aria-hidden="true" />
                PROD · HEALTHY{loadMs ? ` · ${loadMs}ms` : ''}
              </span>
              <span className="beta-uptime-pill" title="Active Session Uptime">
                UPTIME {uptimeStr}
              </span>
              <span className="beta-vu-meter" title={`Scroll Depth: ${scrollPct}%`} aria-label={`Scroll depth ${scrollPct} percent`}>
                <svg viewBox="0 0 36 20" width="32" height="18" aria-hidden="true">
                  <path d="M4 18 A14 14 0 0 1 32 18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <path d="M24 7 A14 14 0 0 1 32 18" fill="none" stroke="#e5c158" strokeWidth="2" />
                  <line
                    x1="18" y1="18" x2="18" y2="5"
                    stroke="#fafafa" strokeWidth="1.5" strokeLinecap="round"
                    style={{ transformOrigin: '18px 18px', transform: `rotate(${vuAngle}deg)`, transition: 'transform 120ms ease-out' }}
                  />
                  <circle cx="18" cy="18" r="2" fill="#e5c158" />
                </svg>
                <span>{scrollPct}%</span>
              </span>
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

        <div className="beta-lab-toggles">
          <span className="beta-jump-label">LAB FX:</span>
          {[
            { key: 'paperGrain', label: '35mm Grain' },
            { key: 'monsoonRain', label: 'Monsoon Rain' },
            { key: 'zenMode', label: 'Zen Reading' },
            { key: 'thermalGlow', label: 'Thermal Glow' },
            { key: 'kicadLayer', label: 'KiCad PCB' },
          ].map((fx) => (
            <button
              key={fx.key}
              type="button"
              className={`beta-fx-pill ${ambientFlags[fx.key] ? 'is-on' : ''}`}
              onClick={() => toggleAmbient(fx.key)}
              aria-pressed={ambientFlags[fx.key]}
            >
              {fx.label}
            </button>
          ))}
        </div>

        {/* Agentic Co-Pilot Command Bar */}
        <div className="beta-agentic-bar">
          <form className="beta-agentic-form" onSubmit={handleCopilotSubmit}>
            <FiCpu size={14} className="beta-agentic-icon" />
            <input
              ref={copilotInputRef}
              type="text"
              className="beta-agentic-input"
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              placeholder="Agentic Co-Pilot (Ctrl+K): 'Show ESP32 projects', 'Unfiltered story', 'Scope an AI build'..."
              aria-label="Agentic Co-Pilot command input"
            />
            <button type="submit" className="beta-agentic-run">Execute</button>
          </form>

          <div className="beta-agentic-goals">
            {[
              { label: 'Hiring: React Stack', run: () => { dispatchAgenticAction('HIGHLIGHT_SKILL', { skill: 'React' }); dispatchAgenticAction('PREFILL_INQUIRY', { what: 'Web', pace: '1 Month', stage: 'Scale', scroll: false }); } },
              { label: 'Hardware / ESP32 Proof', run: () => { dispatchAgenticAction('TOGGLE_LAB_FX', { key: 'kicadLayer', value: true }); dispatchAgenticAction('HIGHLIGHT_SKILL', { skill: 'ESP32' }); } },
              { label: 'Unfiltered Story', run: () => dispatchAgenticAction('SET_CAREER_VIEW', { perspective: 'unfiltered', scroll: true }) },
              { label: 'Scope AI Prototype', run: () => dispatchAgenticAction('PREFILL_INQUIRY', { what: 'AI', pace: '1 Month', stage: 'Prototype', scroll: true }) },
            ].map((goal) => (
              <button key={goal.label} type="button" className="beta-agentic-goal" onClick={goal.run}>
                {goal.label}
              </button>
            ))}
          </div>

          {agenticTrace && (
            <div className="beta-agentic-trace" role="status" aria-live="polite">
              <span>AGENT TRACE // {agenticTrace}</span>
            </div>
          )}
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

const GUESTBOOK_STORAGE_KEY = 'beta-digital-guestbook-v1';

const DEFAULT_GUESTBOOK_ENTRIES = [
  {
    id: 'seed-1',
    name: 'Kiran V.',
    category: 'Collab',
    message: 'Loved the ESP32 + KiCad integration. Would be awesome to collaborate on an open-source hardware dashboard.',
    date: 'Nov 2026',
  },
  {
    id: 'seed-2',
    name: 'Meera S.',
    category: 'Feedback',
    message: 'The Skill-to-Project cross-highlighter and Solari board make browsing way faster than standard portfolios.',
    date: 'Nov 2026',
  },
];

export function BetaFeedbackSection() {
  const [fbName, setFbName] = useState('');
  const [fbCategory, setFbCategory] = useState('Message');
  const [fbMessage, setFbMessage] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [sent, setSent] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [entries, setEntries] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(GUESTBOOK_STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return DEFAULT_GUESTBOOK_ENTRIES;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = fbMessage.trim();
    if (!msg) return;

    const newEntry = {
      id: `gb-${Date.now()}`,
      name: fbName.trim() || 'Anonymous Visitor',
      category: fbCategory,
      message: msg,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    const nextEntries = [newEntry, ...entries];
    setEntries(nextEntries);
    try {
      localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(nextEntries));
    } catch {}

    if (notifyEmail) {
      const subject = encodeURIComponent(`[Guestbook - ${fbCategory}] from ${newEntry.name}`);
      const body = encodeURIComponent(`Category: ${fbCategory}\nFrom: ${newEntry.name}\n\n${msg}`);
      window.location.href = `mailto:adhithyamohan2312@gmail.com?subject=${subject}&body=${body}`;
    }

    setFbName('');
    setFbMessage('');
    setSent(true);
    setTimeout(() => setSent(false), 3200);
  };

  const visibleEntries = filterCat === 'All'
    ? entries
    : entries.filter((item) => item.category === filterCat);

  return (
    <section className="beta-feedback-section" id="beta-guestbook">
      <div className="beta-suite-card">
        <div className="beta-badges-row">
          <span className="beta-pill">DIGITAL GUESTBOOK // SIGN THE WALL</span>
          <span className="beta-progress-pill">{entries.length} entries</span>
        </div>
        <h3 className="beta-title">Digital Guestbook</h3>
        <p className="beta-subtitle" style={{ marginBottom: '16px' }}>
          Leave a message, suggestion, collaboration request, or quick feedback — pinned straight to the wall.
        </p>

        <form className="beta-feedback-form" onSubmit={handleSubmit}>
          <div className="beta-feedback-row">
            <input
              type="text"
              className="beta-fb-input"
              placeholder="Your name or handle (optional)"
              value={fbName}
              onChange={(e) => setFbName(e.target.value)}
            />
            <select
              className="beta-fb-input"
              value={fbCategory}
              onChange={(e) => setFbCategory(e.target.value)}
              aria-label="Guestbook entry type"
            >
              <option value="Message">Message</option>
              <option value="Suggestion">Suggestion</option>
              <option value="Collab">Collaboration Request</option>
              <option value="Feedback">Feedback</option>
            </select>
            <label className="beta-gb-email-check">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
              />
              <span>Also send via email</span>
            </label>
          </div>

          <textarea
            className="beta-fb-textarea"
            rows={3}
            placeholder="Write a note, suggest a feature, or pitch a collaboration..."
            value={fbMessage}
            onChange={(e) => setFbMessage(e.target.value)}
            required
          />

          <div className="beta-feedback-footer">
            <div className="beta-gb-filters">
              {['All', 'Message', 'Suggestion', 'Collab', 'Feedback'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`beta-fx-pill ${filterCat === cat ? 'is-on' : ''}`}
                  onClick={() => setFilterCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button type="submit" className="beta-btn">
              {sent ? <><FiCheckCircle size={13} /> Pinned to Wall!</> : <><FiSend size={13} /> Sign Guestbook</>}
            </button>
          </div>
        </form>

        <div className="beta-gb-wall">
          {visibleEntries.map((item) => (
            <article key={item.id} className="beta-gb-entry">
              <div className="beta-gb-entry-top">
                <strong className="beta-gb-author">{item.name}</strong>
                <span className="beta-gb-tag">{item.category}</span>
                <span className="beta-gb-date">{item.date}</span>
              </div>
              <p className="beta-gb-msg">{item.message}</p>
            </article>
          ))}
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
