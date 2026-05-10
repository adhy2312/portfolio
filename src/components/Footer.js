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
      className="footer"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Ambient Glows */}
      <div className="footer-ambient-glow glow-1"></div>
      <div className="footer-ambient-glow glow-2"></div>

      {/* Animated SVG Wave Top */}
      <div className="footer-wave">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
        </svg>
      </div>

      {/* Giant Animated Marquee Text */}
      <div className="footer-marquee-container">
        <div className="footer-marquee">
          <span> ADHY • ADHY • ADHY • ADHY • ADHY • ADHY •</span>
          <span>ADHY • ADHY • ADHY • ADHY • ADHY • ADHY • </span>
        </div>
      </div>

      <div className="container footer-content-wrapper">
        {/* Interactive Tech Stack Showcase */}
        <div className="footer-tech-showcase">
          <div className="tech-showcase-header">
            <h3 className="tech-title">&lt;TechStack /&gt;</h3>
            <div className="tech-status">
              <span className="status-dot"></span>
              All systems operational
            </div>
          </div>
          <div className="tech-grid">
            {['React', 'Node.js', 'Python', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'PostgreSQL', 'Sanity CMS'].map((tech, idx) => (
              <div key={idx} className={`tech-tag tech-${idx % 4}`}>
                <span className="tech-syntax">const</span> {tech.toLowerCase().replace(/[^a-z0-9]/g, '')} <span className="tech-syntax">=</span> <span className="tech-string">"{tech}"</span>;
              </div>
            ))}
          </div>
        </div>

        <div className="footer-inner">
          {/* Brand column */}
          <div className="footer-brand">
            <div className="footer-logo">
              ADHY<span>.</span>
            </div>
            <p className="footer-tagline">
              {displayData.tagline}
            </p>
            <div className="footer-socials">
              {displayData.socialLinks.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  aria-label={s.platform}
                >
                  {iconMap[s.iconName] || <FiGithub size={18} />}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation column */}
          <div className="footer-nav">
            <h4 className="footer-nav-title">Navigation</h4>
            <ul className="footer-nav-list">
              {links.map((link) => (
                <li key={link.target}>
                  <a
                    href={`#${link.target}`}
                    className="footer-nav-link"
                    onClick={(e) => handleNavClick(e, link.target)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div className="footer-contact">
            <h4 className="footer-nav-title">Contact</h4>
            <ul className="footer-contact-list">
              <li>
                <a href={`mailto:${displayData.email}`} className="footer-nav-link">
                  {displayData.email}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${displayData.whatsapp}`} target="_blank" rel="noopener noreferrer" className="footer-nav-link">
                  WhatsApp ↗
                </a>
              </li>
              <li className="footer-location" style={{ display: 'flex', alignItems: 'center' }}>
                <FiMapPin style={{ marginRight: '6px' }} /> {displayData.location}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copy">
            © {new Date().getFullYear()} Adhithya Mohan. All rights reserved.
          </p>
          <p className="footer-made">
            Made with <FiHeart size={12} className="heart-icon" /> using React & Framer Motion
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
