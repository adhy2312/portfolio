import React, { useEffect, useState } from 'react';
import './Footer.css';
import { motion } from 'framer-motion';
import { FiGithub, FiLinkedin, FiInstagram, FiMail, FiHeart, FiMapPin } from 'react-icons/fi';
import { client } from '../sanity';

const iconMap = {
  FiLinkedin: <FiLinkedin size={18} />,
  FiGithub: <FiGithub size={18} />,
  FiInstagram: <FiInstagram size={18} />,
  FiMail: <FiMail size={18} />,
};

const links = [
  { label: 'About', target: 'about' },
  { label: 'Skills', target: 'skills' },
  { label: 'Projects', target: 'works' },
  { label: 'Photography', target: 'photography' },
  { label: 'Contact', target: 'contact' },
];

const socials = [
  { icon: <FiLinkedin size={18} />, href: 'https://www.linkedin.com/in/adhithya-mohan-s', label: 'LinkedIn' },
  { icon: <FiGithub size={18} />, href: 'https://github.com/adhy2312', label: 'GitHub' },
  { icon: <FiInstagram size={18} />, href: 'https://instagram.com/zoomout_frames', label: 'Instagram' },
  { icon: <FiMail size={18} />, href: 'mailto:adhithyamohan2312@gmail.com', label: 'Email' },
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

  const displayData = {
    tagline: footerData?.tagline || "Building digital experiences that matter — with code, design, and creativity.",
    email: footerData?.email || "adhithyamohan2312@gmail.com",
    whatsapp: footerData?.whatsapp || "919539066643",
    location: footerData?.location || "Kerala, India",
    socialLinks: footerData?.socialLinks || [
      { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/adhithya-mohan-s', iconName: 'FiLinkedin' },
      { platform: 'GitHub', url: 'https://github.com/adhy2312', iconName: 'FiGithub' },
      { platform: 'Instagram', url: 'https://instagram.com/zoomout_frames', iconName: 'FiInstagram' },
      { platform: 'Email', url: 'mailto:adhithyamohan2312@gmail.com', iconName: 'FiMail' },
    ]
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
        <div className="footer-main-row">
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
        </div>

        <div className="footer-simple-bottom">
          <div className="bottom-divider" />
          <div className="bottom-flex">
            <p className="retro-copy">© {new Date().getFullYear()} ADHITHYA MOHAN</p>
            <div className="retro-made">
              CRAFTED WITH <FiHeart className="heart-icon-simple" /> IN KERALA
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
