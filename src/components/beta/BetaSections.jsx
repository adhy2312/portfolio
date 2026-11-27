import React, { useState, useRef, useEffect } from 'react';
import emailjs from 'emailjs-com';
import { FiChevronDown, FiSend, FiCheckCircle, FiXCircle, FiCopy, FiCheck, FiMapPin, FiLinkedin, FiRefreshCw, FiSliders } from 'react-icons/fi';
import { hermesAgent } from '../../core/agents/specialists/HermesAgent';
import { useSiteMode } from '../../contexts/SiteModeContext';
import { getIstClock } from '../../utils/istTime';
import { getBetaUrlParam, updateBetaUrlParam } from '../../core/betaAgenticBus';
import './BetaSections.css';

const SOLARI_WIDTH = 34;

function formatSolariLine(text) {
  return String(text || '')
    .toUpperCase()
    .slice(0, SOLARI_WIDTH)
    .padEnd(SOLARI_WIDTH, ' ');
}

/* ── 1. Minimal Proof Bar + Mechanical Solari Split-Flap Display ── */
export function BetaProofBar() {
  const { t } = useSiteMode();
  const [lineIdx, setLineIdx] = useState(0);
  const [istClock, setIstClock] = useState(getIstClock);

  useEffect(() => {
    const clockId = setInterval(() => setIstClock(getIstClock()), 30000);
    const cycleId = setInterval(() => setLineIdx((prev) => (prev + 1) % 4), 4200);
    return () => {
      clearInterval(clockId);
      clearInterval(cycleId);
    };
  }, []);

  const solariLines = [
    `IST ${istClock} // OPEN FOR COLLABS`,
    'BUILDING // BETA LABS + AGENTIC UI',
    'STACK    // REACT . PYTHON . ESP32',
    'BASE     // KERALA IN . 29C CLEAR',
  ];

  const activeChars = formatSolariLine(solariLines[lineIdx]).split('');

  const orgs = ['MBCET Senate', 'Finance Club MBCET', 'ISTE SC MBCET', 'FRAMES MBCET'];
  const metrics = [
    { value: '300+', label: t('proof.membersLed', 'Members Led') },
    { value: '15+', label: t('proof.projectsBuilt', 'Projects Built') },
    { value: '10+', label: t('proof.techStacks', 'Tech Stacks') },
  ];

  return (
    <section className="beta-proof-section" aria-label="Proof and Affiliations">
      <div className="beta-proof-bar">
        <div className="beta-proof-orgs">
          <span className="beta-proof-kicker">{t('proof.affiliations', 'AFFILIATIONS')}</span>
          <div className="beta-proof-badges">
            {orgs.map((org) => (
              <span key={org} className="beta-proof-org">{org}</span>
            ))}
          </div>
        </div>
        <div className="beta-proof-metrics">
          {metrics.map((m) => (
            <div key={m.label} className="beta-proof-metric">
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mechanical Split-Flap Solari Board */}
      <div
        className="beta-solari-board"
        onClick={() => setLineIdx((prev) => (prev + 1) % solariLines.length)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setLineIdx((prev) => (prev + 1) % solariLines.length);
          }
        }}
        title="Click to cycle live status board"
        aria-label={`Live status board: ${solariLines[lineIdx]}`}
      >
        <div className="beta-solari-meta">
          <span className="beta-solari-led" aria-hidden="true" />
          <span className="beta-solari-tag">SOLARI // LIVE</span>
        </div>
        <div className="beta-solari-cells" aria-hidden="true">
          {activeChars.map((ch, idx) => (
            <span
              key={`${idx}-${ch}-${lineIdx}`}
              className={`beta-solari-cell ${ch === ' ' ? 'is-blank' : 'is-flipping'}`}
              style={{ animationDelay: `${idx * 14}ms` }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>
        <span className="beta-solari-cycle" aria-hidden="true">
          <FiRefreshCw size={12} />
        </span>
      </div>
    </section>
  );
}

/* ── 2. Unified Interactive Career Rail (Replaces Experience & Timeline in Beta) ── */
const CAREER_MILESTONES = [
  {
    id: 'senate-2026',
    year: '2026',
    period: 'Oct 2026 — Present',
    org: 'MBCET Senate',
    role: 'Media Secretary',
    unfilteredRole: 'The 11 PM Rapid-Response Media Desk',
    tag: 'Leadership',
    bullets: [
      'Direct official campus communications, institutional press coverage, and digital media strategy at the apex student governance level.',
      'Coordinate multi-club announcements and student media representation across college-wide initiatives.',
    ],
    unfilteredBullets: [
      'Turning last-minute 10 PM event changes into clean press releases and campus-wide rollouts before morning assembly.',
      'Balancing 10+ club voices without letting a single announcement clash or miss its deadline.',
    ],
  },
  {
    id: 'finance-2026',
    year: '2026',
    period: 'Oct 2026 — Present',
    org: 'Finance Club MBCET',
    role: 'Co-Founder & Director of External Affairs',
    unfilteredRole: 'Building a Finance Chapter From Zero',
    tag: 'Community',
    bullets: [
      'Co-founded the chapter and built industry partnerships for campus financial literacy workshops.',
      'Connected student builders with professional mentors across fintech, markets, and strategy.',
    ],
    unfilteredBullets: [
      'Cold-messaged mentors and industry speakers until the first room of skeptical engineering students actually showed up.',
      'Learned how to translate dry market jargon into practical sessions people stay awake for.',
    ],
  },
  {
    id: 'iste-chair-2026',
    year: '2026',
    period: 'Aug 2026 — Oct 2026',
    org: 'ISTE SC MBCET',
    role: 'Chairperson',
    unfilteredRole: '300+ Members, 1 Portal, Zero Sleep',
    tag: 'Leadership',
    bullets: [
      'Led 300+ student members across technical workshops, state conventions, and chapter operations.',
      'Architected and oversaw the official ISTE MBCET Next.js + Sanity digital portal.',
    ],
    unfilteredBullets: [
      'Shipped the Next.js + Sanity portal while simultaneously juggling convention logistics and volunteer firefighting.',
      'Discovered that automating certificates in code saves way more sanity than manual spreadsheets.',
    ],
  },
  {
    id: 'frames-2026',
    year: '2026',
    period: 'Aug 2026 — Present',
    org: 'FRAMES MBCET',
    role: 'Lead Photographer',
    unfilteredRole: 'Chasing Golden Hour Between Labs',
    tag: 'Community',
    bullets: [
      'Lead visual storytelling, event documentation, and Lightroom editorial direction for flagship campus events.',
      'Mentored junior photographers in composition, low-light shooting, and documentary framing.',
    ],
    unfilteredBullets: [
      'Sprinting across campus with a camera bag right after circuits lab to catch the last 10 minutes of stage lighting.',
      'Batch-culling 800 RAW frames at 2 AM so event highlights hit socials before breakfast.',
    ],
  },
];

export function BetaCareerRail() {
  const { t } = useSiteMode();
  const [activeTag, setActiveTag] = useState('All');
  const [expandedId, setExpandedId] = useState('senate-2026');
  const [isUnfiltered, setIsUnfiltered] = useState(() => getBetaUrlParam('view') === 'unfiltered');

  const setPerspective = (unfiltered) => {
    setIsUnfiltered(unfiltered);
    updateBetaUrlParam('view', unfiltered ? 'unfiltered' : null);
  };

  useEffect(() => {
    const onCareerView = (e) => {
      const { perspective, filter } = e?.detail || {};
      if (perspective) setIsUnfiltered(perspective === 'unfiltered');
      if (filter) setActiveTag(filter);
    };
    window.addEventListener('beta:career-view', onCareerView);
    return () => window.removeEventListener('beta:career-view', onCareerView);
  }, []);
  const tags = [
    { id: 'All', label: t('career.filterAll', 'All') },
    { id: 'Leadership', label: t('career.filterLeadership', 'Leadership') },
    { id: 'Community', label: t('career.filterCommunity', 'Community') },
  ];

  const visible = activeTag === 'All'
    ? CAREER_MILESTONES
    : CAREER_MILESTONES.filter((m) => m.tag === activeTag);

  return (
    <section className="beta-career-section" id="experience">
      <div className="beta-section-head">
        <span className="section-label">{t('career.label', '// career & milestones')}</span>
        <h2 className="section-title">
          {t('career.title', 'Interactive')} <span>{t('career.titleAccent', 'Career Rail')}</span>
        </h2>
        <p className="beta-section-sub">
          {t('career.sub', 'Unified timeline of leadership roles, engineering builds, and community initiatives — click any milestone to inspect impact.')}
        </p>
      </div>

      <div className="beta-rail-controls">
        <div className="beta-rail-filters">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`beta-rail-filter ${activeTag === tag.id ? 'is-active' : ''}`}
              onClick={() => setActiveTag(tag.id)}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <div className="beta-story-toggle" role="group" aria-label="Perspective toggle">
          <button
            type="button"
            className={`beta-story-btn ${!isUnfiltered ? 'is-active' : ''}`}
            onClick={() => setPerspective(false)}
          >
            Formal
          </button>
          <button
            type="button"
            className={`beta-story-btn ${isUnfiltered ? 'is-active is-unfiltered' : ''}`}
            onClick={() => setPerspective(true)}
          >
            Unfiltered
          </button>
        </div>
      </div>

      <div className="beta-rail-list">
        {visible.map((item) => {
          const isOpen = expandedId === item.id;
          const displayRole = isUnfiltered ? item.unfilteredRole : item.role;
          const displayBullets = isUnfiltered ? item.unfilteredBullets : item.bullets;
          return (
            <div key={item.id} className={`beta-rail-item ${isOpen ? 'is-open' : ''} ${isUnfiltered ? 'is-unfiltered' : ''}`}>
              <div className="beta-rail-year">{item.year}</div>
              <button
                type="button"
                className="beta-rail-card"
                onClick={() => setExpandedId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
              >
                <div className="beta-rail-top">
                  <div>
                    <div className="beta-rail-meta">
                      <span className="beta-rail-tag">{isUnfiltered ? 'Behind the Scenes' : item.tag}</span>
                      <span className="beta-rail-period">{item.period}</span>
                    </div>
                    <h3 className="beta-rail-role" key={`${item.id}-${isUnfiltered ? 'u' : 'f'}`}>{displayRole}</h3>
                    <div className="beta-rail-org">{item.org}</div>
                  </div>
                  <FiChevronDown className={`beta-rail-chevron ${isOpen ? 'rotated' : ''}`} size={18} />
                </div>

                {isOpen && (
                  <ul className="beta-rail-bullets" key={`${item.id}-b-${isUnfiltered ? 'u' : 'f'}`}>
                    {displayBullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const DIAL_STACKS = {
  Web: 'Next.js · React · Supabase · GSAP',
  IoT: 'ESP32 · KiCad · MQTT · React Dashboard',
  AI: 'Gemini / LLM · Python · Tool Calling · Next.js',
  Design: 'Figma · Design System · Interactive Prototype',
};

const DIAL_STAGE_NOTES = {
  Idea: 'architecture & rapid proof-of-concept',
  Prototype: 'end-to-end working build & polish',
  Scale: 'production hardening, performance & deployment',
};

/* ── 3. Single Cinematic Inquiry Studio + Scope Your Idea Dial Builder ── */
export function BetaInquiryStudio() {
  const { t } = useSiteMode();
  const formRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [copied, setCopied] = useState(false);
  const [istTime, setIstTime] = useState('');
  const [dialWhat, setDialWhat] = useState('Web');
  const [dialPace, setDialPace] = useState('1 Month');
  const [dialStage, setDialStage] = useState('Prototype');
  const [showBuilder, setShowBuilder] = useState(true);

  useEffect(() => {
    const update = () => {
      setIstTime(`${getIstClock()} IST`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onPrefill = (e) => {
      const d = e?.detail || {};
      const nextWhat = d.what && DIAL_STACKS[d.what] ? d.what : dialWhat;
      const nextPace = d.pace || dialPace;
      const nextStage = d.stage || dialStage;
      if (d.what && DIAL_STACKS[d.what]) setDialWhat(d.what);
      if (d.pace) setDialPace(d.pace);
      if (d.stage) setDialStage(d.stage);
      setShowBuilder(true);
      if (formRef.current) {
        if (formRef.current.subject) {
          formRef.current.subject.value = d.subject || `[${nextWhat} · ${nextPace}] ${nextStage} Build Inquiry`;
        }
        if (formRef.current.message) {
          formRef.current.message.value = d.message || `Hi Adhithya, I'm looking to collaborate on a ${nextWhat} project (${nextStage} stage — focused on ${DIAL_STAGE_NOTES[nextStage] || 'delivery'}) with a ${nextPace} pace. Suggested stack: ${DIAL_STACKS[nextWhat]}.`;
        }
      }
    };
    window.addEventListener('beta:inquiry-prefill', onPrefill);
    return () => window.removeEventListener('beta:inquiry-prefill', onPrefill);
  }, [dialWhat, dialPace, dialStage]);

  const generatedStack = DIAL_STACKS[dialWhat];
  const generatedSubject = `[${dialWhat} · ${dialPace}] ${dialStage} Build Inquiry`;
  const generatedBrief = `Hi Adhithya, I'm looking to collaborate on a ${dialWhat} project (${dialStage} stage — focused on ${DIAL_STAGE_NOTES[dialStage]}) with a ${dialPace} pace. Suggested stack: ${generatedStack}.`;

  const applyDialBrief = () => {
    if (!formRef.current) return;
    if (formRef.current.subject) formRef.current.subject.value = generatedSubject;
    if (formRef.current.message) formRef.current.message.value = generatedBrief;
  };

  const presets = [
    { label: t('studio.presetInternship', 'Internship / Role'), subject: 'Engineering Role / Internship Opportunity', msg: 'Hi Adhithya, we reviewed your portfolio and would like to discuss an engineering opportunity...' },
    { label: t('studio.presetFreelance', 'Freelance'), subject: 'Freelance Web / AI Project Inquiry', msg: 'Hi Adhithya, we have a web/AI project in mind and would love to collaborate...' },
    { label: t('studio.presetHardware', 'Hardware Collab'), subject: 'ECE / Embedded / SDR Collaboration', msg: 'Hi Adhithya, reaching out regarding your STM32 / KiCad / GNU Radio hardware work...' },
    { label: t('studio.presetHi', 'Quick Hi'), subject: 'Hello from your portfolio!', msg: 'Hey Adhithya, just wanted to connect and say hello!' },
  ];

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText('adhithyamohan2312@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    const fd = new FormData(formRef.current);
    const fromName = fd.get('from_name');
    const replyTo = fd.get('reply_to');
    const subject = fd.get('subject') || 'Portfolio Inquiry (Beta Studio)';
    const message = fd.get('message');

    emailjs
      .send(
        'service_25wh03l',
        'template_hdpyibu',
        {
          from_name: fromName,
          user_name: fromName,
          reply_to: replyTo,
          user_email: replyTo,
          subject,
          message: `Sender Details:\nName: ${fromName}\nEmail: ${replyTo}\n\nOriginal Message:\n${message}`,
        },
        'dcGuY9_4lV1xSr5zN'
      )
      .then(() => {
        setStatus('success');
        try {
          hermesAgent.dispatchContactInquiry({ name: fromName, email: replyTo, message });
          hermesAgent.dispatchToast('Message Dispatched', `HERMES routed inquiry from ${fromName || 'Visitor'} to Adhy.`, { type: 'success' });
        } catch {}
        formRef.current.reset();
        setTimeout(() => setStatus('idle'), 5000);
      })
      .catch(() => {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 4000);
      });
  };

  return (
    <section className="beta-studio-section" id="contact">
      <div className="beta-studio-grid">
        <div className="beta-studio-info">
          <span className="section-label">{t('studio.label', '// studio inquiry')}</span>
          <h2 className="section-title">
            {t('contact.title', "Let's Connect")}
          </h2>
          <p className="beta-section-sub">
            {t('contact.desc', 'Whether you have a project in mind, a collaboration idea, or just want to say hi — my inbox is always open.')}
          </p>

          <div className="beta-studio-status">
            <span className="beta-studio-dot" />
            <span>{t('contact.available', 'Available for opportunities')} · {istTime}</span>
          </div>

          <div className="beta-studio-quick">
            <button type="button" className="beta-studio-chip" onClick={handleCopyEmail}>
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
              <span>{copied ? t('studio.copied', 'Copied email!') : 'adhithyamohan2312@gmail.com'}</span>
            </button>
            <a
              href="https://www.linkedin.com/in/adhithya-mohan-s"
              target="_blank"
              rel="noopener noreferrer"
              className="beta-studio-chip"
            >
              <FiLinkedin size={14} />
              <span>LinkedIn</span>
            </a>
            <span className="beta-studio-chip beta-studio-chip--static">
              <FiMapPin size={14} />
              <span>Kerala, India</span>
            </span>
          </div>

          <div className="beta-open-matrix" aria-label="Availability Matrix">
            {[
              { role: 'Internships', status: 'Yes', tone: 'open' },
              { role: 'Freelance', status: 'Select', tone: 'select' },
              { role: 'Hardware', status: 'Yes', tone: 'open' },
              { role: 'Speaking', status: 'Yes', tone: 'open' },
            ].map((cell) => (
              <div key={cell.role} className="beta-open-cell">
                <span className="beta-open-role">{cell.role}</span>
                <span className={`beta-open-status is-${cell.tone}`}>{cell.status}</span>
              </div>
            ))}
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="beta-studio-form">
          <div className="beta-dial-header">
            <div className="beta-studio-presets">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="beta-preset-pill"
                  onClick={() => {
                    if (!formRef.current) return;
                    if (formRef.current.subject) formRef.current.subject.value = p.subject;
                    if (formRef.current.message) formRef.current.message.value = p.msg;
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`beta-dial-toggle ${showBuilder ? 'is-open' : ''}`}
              onClick={() => setShowBuilder((v) => !v)}
            >
              <FiSliders size={12} />
              <span>Scope Dial</span>
            </button>
          </div>

          {showBuilder && (
            <div className="beta-dial-builder">
              <div className="beta-dial-group">
                <span className="beta-dial-label">WHAT</span>
                <div className="beta-dial-pills">
                  {['Web', 'IoT', 'AI', 'Design'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`beta-dial-pill ${dialWhat === opt ? 'is-selected' : ''}`}
                      onClick={() => setDialWhat(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="beta-dial-group">
                <span className="beta-dial-label">PACE</span>
                <div className="beta-dial-pills">
                  {['Weekend Sprint', '1 Month', 'Ongoing'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`beta-dial-pill ${dialPace === opt ? 'is-selected' : ''}`}
                      onClick={() => setDialPace(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="beta-dial-group">
                <span className="beta-dial-label">STAGE</span>
                <div className="beta-dial-pills">
                  {['Idea', 'Prototype', 'Scale'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`beta-dial-pill ${dialStage === opt ? 'is-selected' : ''}`}
                      onClick={() => setDialStage(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="beta-dial-preview">
                <div className="beta-dial-stack">STACK // {generatedStack}</div>
                <button type="button" className="beta-dial-apply" onClick={applyDialBrief}>
                  Apply to Brief →
                </button>
              </div>
            </div>
          )}

          <div className="beta-studio-row">
            <input type="text" name="from_name" required placeholder={t('contact.yourName', 'Your Name')} className="beta-studio-input" />
            <input type="email" name="reply_to" required placeholder={t('contact.yourEmail', 'Your Email')} className="beta-studio-input" />
          </div>
          <input type="text" name="subject" placeholder={t('contact.subject', 'Subject')} className="beta-studio-input" />
          <textarea name="message" rows={4} required placeholder={t('contact.message', 'Message')} className="beta-studio-textarea" />

          <button type="submit" className="hero-beta-cta-primary beta-studio-submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : status === 'success' ? (
              <><FiCheckCircle size={15} /> Message Sent!</>
            ) : status === 'error' ? (
              <><FiXCircle size={15} /> Failed — try again</>
            ) : (
              <><FiSend size={15} /> {t('contact.send', 'Send Message')}</>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

