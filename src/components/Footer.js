import React, { useEffect, useState, useRef } from 'react';
import './Footer.css';
import { FiGithub, FiLinkedin, FiInstagram, FiMail, FiMessageCircle } from 'react-icons/fi';
import CopyEmail from './CopyEmail';
import { client } from '../sanity';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  FiLinkedin: <FiLinkedin size={18} />,
  FiGithub: <FiGithub size={18} />,
  FiInstagram: <FiInstagram size={18} />,
  FiMail: <FiMail size={18} />,
  FiMessageCircle: <FiMessageCircle size={18} />,
};

const links = [
  { label: 'About', target: 'about' },
  { label: 'Skills', target: 'skills' },
  { label: 'Projects', target: 'works' },
  { label: 'Photography', target: 'photography' },
  { label: 'Contact', target: 'contact' },
];


const Footer = () => {
  const [footerData, setFooterData] = useState(null);
  const [legalModalTab, setLegalModalTab] = useState(null);
  const footerRef = useRef(null);
  const popupRef = useRef(null);
  const mainRowRef = useRef(null);
  
  const devConsoleClickCount = useRef(0);
  const devConsoleTimer = useRef(null);

  const handleLogoClick = () => {
    devConsoleClickCount.current += 1;
    if (devConsoleClickCount.current >= 3) {
      window.dispatchEvent(new CustomEvent('trigger-dev-console'));
      devConsoleClickCount.current = 0;
    }
    clearTimeout(devConsoleTimer.current);
    devConsoleTimer.current = setTimeout(() => {
      devConsoleClickCount.current = 0;
    }, 1000);
  };

  useEffect(() => {
    const query = '*[_type == "footer"][0]';
    client.fetch(query).then((data) => {
      if (data) setFooterData(data);
    }).catch(console.error);
  }, []);

  // GSAP Footer Animations
  useEffect(() => {
    if (!footerRef.current) return;

    const ctx = gsap.context(() => {
      // Footer fade-in
      gsap.fromTo(footerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          scrollTrigger: { trigger: footerRef.current, start: 'top 90%', once: true }
        }
      );

      // 3D Pop-up Card — cinematic spring entrance
      if (popupRef.current) {
        gsap.fromTo(popupRef.current,
          { y: 100, opacity: 0, rotateX: 45, scale: 0.8 },
          {
            y: 0, opacity: 1, rotateX: 0, scale: 1,
            duration: 1.2,
            ease: 'back.out(1.4)',
            scrollTrigger: { trigger: popupRef.current, start: 'top 85%', once: true }
          }
        );

        // Hover 3D tilt
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) {
          popupRef.current.addEventListener('mouseenter', () => {
            gsap.to(popupRef.current, {
              y: -15, rotateX: 10, rotateY: -5,
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              duration: 0.4,
              ease: 'power2.out',
            });
          });
          popupRef.current.addEventListener('mouseleave', () => {
            gsap.to(popupRef.current, {
              y: 0, rotateX: 0, rotateY: 0,
              boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
              duration: 0.6,
              ease: 'elastic.out(1, 0.5)',
            });
          });
        }
      }

      // Main row slide up
      if (mainRowRef.current) {
        gsap.fromTo(mainRowRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.8,
            delay: 0.3,
            ease: 'power4.out',
            scrollTrigger: { trigger: mainRowRef.current, start: 'top 90%', once: true }
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const whatsappNumber = footerData?.whatsapp || '919539066643';
  const baseSocialLinks = footerData?.socialLinks || [
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/adhithya-mohan-s', iconName: 'FiLinkedin' },
    { platform: 'GitHub', url: 'https://github.com/adhy2312', iconName: 'FiGithub' },
    { platform: 'Instagram', url: 'https://instagram.com/zoomout_frames', iconName: 'FiInstagram' },
    { platform: 'Email', url: 'mailto:adhithyamohan2312@gmail.com', iconName: 'FiMail' },
  ];

  // Always ensure WhatsApp is present (Sanity may not include it)
  const socialLinksWithWhatsApp = baseSocialLinks.some(s => s.platform === 'WhatsApp')
    ? baseSocialLinks
    : [...baseSocialLinks, { platform: 'WhatsApp', url: `https://wa.me/${whatsappNumber}`, iconName: 'FiMessageCircle' }];

  const displayData = {
    tagline: footerData?.tagline || "Building digital experiences that matter — with code, design, and creativity.",
    email: footerData?.email || "adhithyamohan2312@gmail.com",
    whatsapp: whatsappNumber,
    location: footerData?.location || "Kerala, India",
    socialLinks: socialLinksWithWhatsApp,
  };

  return (
    <footer
      className="footer-retro-simple"
      ref={footerRef}
    >
      {/* Elegant Topographic Contours */}
      <div className="footer-contours" />

      <div className="container footer-simple-inner">
        {/* 3D Pop-up Card */}
        <div
          className="footer-3d-popup"
          ref={popupRef}
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          <div className="popup-3d-content">
            <div className="popup-tag">PROJECT_READY</div>
            <h3>Let's build your next masterpiece together.</h3>
            <p>Currently accepting new freelance opportunities and full-time collaborations.</p>
            <a 
              href="#contact" 
              className="popup-btn"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              GET IN TOUCH <FiMail />
            </a>
          </div>
          <div className="popup-3d-glow" />
        </div>

        <div className="footer-main-row" ref={mainRowRef}>
          <div className="footer-brand-column">
            <div 
              className="footer-logo-simple" 
              onClick={handleLogoClick}
              style={{ cursor: 'pointer' }}
              title="Sys Console: Click 3x"
            >
              ADHY<span>.</span>
            </div>
            <p className="footer-simple-tagline">
              {displayData.tagline}
            </p>
            <div className="footer-simple-socials">
              {displayData.socialLinks.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="retro-icon-btn"
                  aria-label={s.platform}
                >
                  {iconMap[s.iconName] || <FiGithub size={18} />}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-links-column">
            <h4 className="column-title">Directory</h4>
            <ul className="footer-simple-nav">
              {links.map((link) => (
                <li key={link.target}>
                  <a
                    href={`#${link.target}`}
                    onClick={(e) => handleNavClick(e, link.target)}
                    className="retro-nav-link"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-contact-column">
            <h4 className="column-title">Contact</h4>
            <div className="contact-details">
              <CopyEmail email={displayData.email} variant="minimal" />
              <p className="retro-text-muted">Kerala, India</p>
              <div className="system-status-badge">
                <span className="status-indicator-green" /> SYSTEM_ONLINE
              </div>
            </div>
          </div>
        </div>

        <div className="footer-simple-bottom">
          <div className="bottom-divider" />
          <div className="bottom-flex">
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <p className="retro-copy" style={{ opacity: 0.6, fontSize: '0.65rem', margin: 0 }}>
                <span className="retro-text-muted">HINT:</span> TRY CLICKING THE LOGO 5 TIMES ✨
              </p>
            </div>
            <div className="retro-made">
              BUILT WITH LATE NIGHT CODING SESSIONS & CAFFEINE
              <div style={{ marginTop: '8px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setLegalModalTab('privacy')}
                  style={{ 
                    background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', 
                    fontSize: '0.65rem', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  Privacy Policy &amp; GDPR
                </button>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.65rem' }}>•</span>
                <button 
                  onClick={() => setLegalModalTab('terms')}
                  style={{ 
                    background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', 
                    fontSize: '0.65rem', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  Terms &amp; Conditions
                </button>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.65rem' }}>•</span>
                <button 
                  onClick={() => setLegalModalTab('cookies')}
                  style={{ 
                    background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', 
                    fontSize: '0.65rem', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  Cookie Policy
                </button>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.65rem' }}>•</span>
                <button 
                  onClick={() => setLegalModalTab('a11y')}
                  style={{ 
                    background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', 
                    fontSize: '0.65rem', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  Accessibility Statement
                </button>
              </div>
            </div>
          </div>
          <div className="footer-git-telemetry">
            <div className="git-telemetry-badge">
              <span className="git-live-dot" />
              <span className="git-telemetry-label">DEPLOYED</span>
              <a 
                href="https://github.com/adhy2312/portfolio/commit/d141adf" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="git-commit-hash"
                title="View commit d141adf on GitHub"
              >
                d141adf
              </a>
              <span className="git-telemetry-sep">/</span>
              <span className="git-telemetry-branch">main</span>
              <span className="git-telemetry-sep">/</span>
              <span className="git-telemetry-env">production</span>
            </div>
            <div className="git-telemetry-meta">
              <span>Next-Gen React 19 Engine</span>
              <span className="git-telemetry-sep">·</span>
              <span>Sanity Studio CMS</span>
              <span className="git-telemetry-sep">·</span>
              <span>Kerala, India</span>
            </div>
          </div>
        </div>
      </div>

      {legalModalTab && (
        <div 
          className="privacy-modal-overlay" 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setLegalModalTab(null)}
        >
          <div 
            className="privacy-modal-content"
            style={{
              background: '#090d1a', border: '1px solid rgba(0, 240, 255, 0.3)',
              boxShadow: '0 0 35px rgba(0, 240, 255, 0.15), 8px 8px 0px #000',
              padding: '32px', borderRadius: '16px', maxWidth: '640px', width: '92%',
              maxHeight: '85vh', overflowY: 'auto',
              color: 'rgba(255, 255, 255, 0.88)', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setLegalModalTab(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)', color: '#fff', width: '32px', height: '32px',
                borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              &times;
            </button>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
              {[
                { id: 'privacy', label: 'Privacy & GDPR' },
                { id: 'terms', label: 'Terms & Conditions' },
                { id: 'cookies', label: 'Cookie Policy' },
                { id: 'a11y', label: 'Accessibility' },
                { id: 'disclaimer', label: 'Disclaimer & Refund' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setLegalModalTab(tab.id)}
                  style={{
                    background: legalModalTab === tab.id ? '#00f0ff' : 'rgba(255,255,255,0.06)',
                    color: legalModalTab === tab.id ? '#030712' : '#cbd5e1',
                    border: 'none', padding: '6px 12px', borderRadius: '6px',
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {legalModalTab === 'privacy' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Space Grotesk, sans-serif', color: '#00f0ff' }}>Privacy Policy &amp; GDPR Compliance</h3>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  <strong>1. Data Controller:</strong> Adhithya Mohan (Kerala, India). We process minimal contact telemetry strictly for direct communication.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  <strong>2. Zero Third-Party Selling:</strong> We never sell, monetize, or broker personal information. All contact form inputs are routed solely via encrypted channels to respond to professional inquiries.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  <strong>3. GDPR Rights:</strong> Under Articles 15-22 of the GDPR, visitors possess the right to access, rectify, or request immediate deletion of any submitted contact correspondence by emailing adhithyamohan.work@gmail.com.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                  <strong>4. Data Retention:</strong> Contact messages are stored only for the duration of the professional dialogue and purged systematically thereafter.
                </p>
              </div>
            )}

            {legalModalTab === 'terms' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Space Grotesk, sans-serif', color: '#00f0ff' }}>Terms &amp; Conditions</h3>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  <strong>1. Intellectual Property:</strong> All original source code, photography, circuit schematics, 3D assets, and graphic designs showcased on this portfolio are the proprietary property of Adhithya Mohan (&copy; 2026).
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  <strong>2. Permitted Usage:</strong> Visitors are granted a limited license to browse and evaluate the portfolio for recruitment, engineering consultation, and creative review. Unauthorized scraping or impersonation is strictly prohibited.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                  <strong>3. Open-Source Attribution:</strong> Open-source projects linked herein are subject to their respective GitHub repository licenses (e.g. MIT / Apache 2.0).
                </p>
              </div>
            )}

            {legalModalTab === 'cookies' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Space Grotesk, sans-serif', color: '#00f0ff' }}>Cookie &amp; Local Storage Policy</h3>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  <strong>1. Strictly Essential Local Storage:</strong> This website utilizes browser LocalStorage exclusively to persist user preferences:
                </p>
                <ul style={{ fontSize: '0.8rem', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '12px' }}>
                  <li><code>portfolio-mode</code> — Saves active visual mode (Normal, Recruiter, Photographer, Experimental).</li>
                  <li><code>portfolio-a11y</code> — Remembers accessibility flags (Reduced Motion, Low-GPU 60FPS).</li>
                  <li><code>mini_adhy_voice</code> — Remembers Neural Voice mute/unmute state.</li>
                </ul>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                  <strong>2. Zero Tracking Cookies:</strong> We do not use third-party behavioral ad trackers, cross-site tracking pixels, or invasive profiling cookies.
                </p>
              </div>
            )}

            {legalModalTab === 'a11y' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Space Grotesk, sans-serif', color: '#00f0ff' }}>Accessibility Statement (WCAG 2.1 AA)</h3>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  We are committed to digital inclusion. This website provides dedicated accessibility accommodations:
                </p>
                <ul style={{ fontSize: '0.8rem', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '12px' }}>
                  <li><strong>Reduced Motion:</strong> Automatically honors OS <code>prefers-reduced-motion</code> or manual toggle in Settings.</li>
                  <li><strong>High Contrast &amp; Readability:</strong> High-legibility typography mode eliminates complex distortion for maximum clarity.</li>
                  <li><strong>Touch Targets:</strong> Interactive action items maintain minimum 44&times;44px bounding targets for mobile navigation.</li>
                  <li><strong>Screen Reader Semantic Tags:</strong> Proper semantic headings, ARIA labels, and descriptive alternative text across all visual modules.</li>
                </ul>
              </div>
            )}

            {legalModalTab === 'disclaimer' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Space Grotesk, sans-serif', color: '#00f0ff' }}>Disclaimer &amp; Refund Policy</h3>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  <strong>1. Informational Showcase:</strong> This site is an engineering portfolio and personal creative archive. No direct commercial transactions or e-commerce purchases are executed on this domain.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                  <strong>2. Client Engagement &amp; Refunds:</strong> Independent consulting, software engineering, or photography services are conducted via mutually signed freelance contracts, which explicitly specify deliverable milestones and refund/revision terms.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
