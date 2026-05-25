import React, { useEffect, useState } from 'react';
import './Footer.css';
import { motion } from 'framer-motion';
import { FiGithub, FiLinkedin, FiInstagram, FiMail, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { client } from '../sanity';

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

  useEffect(() => {
    const query = '*[_type == "footer"][0]';
    client.fetch(query).then((data) => {
      if (data) setFooterData(data);
    }).catch(console.error);
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
    <motion.footer
      className="footer-retro-simple"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Elegant Topographic Contours */}
      <div className="footer-contours" />

      <div className="container footer-simple-inner">
        {/* 3D Pop-up Card */}
        <motion.div
          className="footer-3d-popup"
          initial={{ y: 100, opacity: 0, rotateX: 45, scale: 0.8 }}
          whileInView={{ y: 0, opacity: 1, rotateX: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.3
          }}
          viewport={{ once: true }}
          whileHover={{
            translateY: -15,
            rotateX: 10,
            rotateY: -5,
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)"
          }}
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
        </motion.div>

        <motion.div
          className="footer-main-row"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="footer-brand-column">
            <div className="footer-logo-simple">
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
              <a href={`mailto:${displayData.email}`} className="retro-nav-link">{displayData.email}</a>
              <p className="retro-text-muted">Kerala, India</p>
              <div className="system-status-badge">
                <span className="status-indicator-green" /> SYSTEM_ONLINE
              </div>
            </div>
          </div>
        </motion.div>

        <div className="footer-simple-bottom">
          <div className="bottom-divider" />
          <div className="bottom-flex">
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <p className="retro-copy" style={{ opacity: 0.6, fontSize: '0.65rem', margin: 0 }}>
                <span className="retro-text-muted">HINT:</span> TRY CLICKING THE LOGO 5 TIMES ✨
              </p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('trigger-trance'))}
                className="trance-mode-btn"
                style={{
                  background: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.55rem',
                  letterSpacing: '1px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontFamily: 'Fira Code, monospace',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                title="Initiate Mental Trance"
              >
                TRANCE_MODE
              </button>
            </div>
            <div className="retro-made">
              BUILT WITH LATE NIGHT CODING SESSIONS & CAFFEINE
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
