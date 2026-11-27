import React, { useState, useRef, useEffect } from 'react';
import emailjs from 'emailjs-com';
import { FiChevronDown, FiSend, FiCheckCircle, FiXCircle, FiCopy, FiCheck, FiMapPin, FiLinkedin } from 'react-icons/fi';
import { hermesAgent } from '../../core/agents/specialists/HermesAgent';
import { useSiteMode } from '../../contexts/SiteModeContext';
import './BetaSections.css';

/* ── 1. Minimal Proof Bar (Replaces StatsBento & TrustedBy in Beta) ── */
export function BetaProofBar() {
  const { t } = useSiteMode();
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
    tag: 'Leadership',
    bullets: [
      'Direct official campus communications, institutional press coverage, and digital media strategy at the apex student governance level.',
      'Coordinate multi-club announcements and student media representation across college-wide initiatives.',
    ],
  },
  {
    id: 'finance-2026',
    year: '2026',
    period: 'Oct 2026 — Present',
    org: 'Finance Club MBCET',
    role: 'Co-Founder & Director of External Affairs',
    tag: 'Community',
    bullets: [
      'Co-founded the chapter and built industry partnerships for campus financial literacy workshops.',
      'Connected student builders with professional mentors across fintech, markets, and strategy.',
    ],
  },
  {
    id: 'iste-chair-2026',
    year: '2026',
    period: 'Aug 2026 — Oct 2026',
    org: 'ISTE SC MBCET',
    role: 'Chairperson',
    tag: 'Leadership',
    bullets: [
      'Led 300+ student members across technical workshops, state conventions, and chapter operations.',
      'Architected and oversaw the official ISTE MBCET Next.js + Sanity digital portal.',
    ],
  },
  {
    id: 'frames-2026',
    year: '2026',
    period: 'Aug 2026 — Present',
    org: 'FRAMES MBCET',
    role: 'Lead Photographer',
    tag: 'Community',
    bullets: [
      'Lead visual storytelling, event documentation, and Lightroom editorial direction for flagship campus events.',
      'Mentored junior photographers in composition, low-light shooting, and documentary framing.',
    ],
  },
  {
    id: 'ece-eng-2025',
    year: '2025',
    period: 'Jan 2025 — Present',
    org: 'Full-Stack, AI & ECE Systems',
    role: 'Developer & Hardware Builder',
    tag: 'Engineering',
    bullets: [
      'Built production web apps with React, Next.js, Node.js, Sanity CMS, and Gemini-powered AI agents.',
      'Designed embedded IoT & hardware workflows spanning ESP32, STM32, KiCad BOM automation, and SDR.',
    ],
  },
];

export function BetaCareerRail() {
  const { t } = useSiteMode();
  const [activeTag, setActiveTag] = useState('All');
  const [expandedId, setExpandedId] = useState('senate-2026');
  const tags = [
    { id: 'All', label: t('career.filterAll', 'All') },
    { id: 'Leadership', label: t('career.filterLeadership', 'Leadership') },
    { id: 'Engineering', label: t('career.filterEngineering', 'Engineering') },
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

      <div className="beta-rail-list">
        {visible.map((item) => {
          const isOpen = expandedId === item.id;
          return (
            <div key={item.id} className={`beta-rail-item ${isOpen ? 'is-open' : ''}`}>
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
                      <span className="beta-rail-tag">{item.tag}</span>
                      <span className="beta-rail-period">{item.period}</span>
                    </div>
                    <h3 className="beta-rail-role">{item.role}</h3>
                    <div className="beta-rail-org">{item.org}</div>
                  </div>
                  <FiChevronDown className={`beta-rail-chevron ${isOpen ? 'rotated' : ''}`} size={18} />
                </div>

                {isOpen && (
                  <ul className="beta-rail-bullets">
                    {item.bullets.map((b, i) => (
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

/* ── 3. Single Cinematic Inquiry Studio (Replaces CallToAction + Contact in Beta) ── */
export function BetaInquiryStudio() {
  const { t } = useSiteMode();
  const formRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [copied, setCopied] = useState(false);
  const [istTime, setIstTime] = useState('');

  useEffect(() => {
    const update = () => {
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      setIstTime(`${String(ist.getHours()).padStart(2, '0')}:${String(ist.getMinutes()).padStart(2, '0')} IST`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

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
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="beta-studio-form">
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

