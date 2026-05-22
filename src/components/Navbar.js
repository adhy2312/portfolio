import React, { useState, useEffect, useRef } from 'react';
import { FiLinkedin, FiInstagram } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const [logoGlow, setLogoGlow] = useState(false);

  const scrolledRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      // Only trigger re-render when state actually changes
      if (isScrolled !== scrolledRef.current) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    // Scroll to top on single click
    handleNavClick(e, 'hero');

    // Easter egg: 5 rapid clicks → launch ping pong
    clickCountRef.current += 1;
    setLogoGlow(true);
    setTimeout(() => setLogoGlow(false), 300);

    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      clearTimeout(clickTimerRef.current);
      window.dispatchEvent(new CustomEvent('launch-pong'));
    }
  };

  const links = [
    { label: 'About', target: 'about' },
    { label: 'Skills', target: 'skills' },
    { label: 'Projects', target: 'works' },
    { label: 'Photography', target: 'photography' },
    { label: 'Contact', target: 'contact' },
  ];

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      <div
        className={`mobile-menu-backdrop ${menuOpen ? 'backdrop-visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <a
            className={`nav-logo ${logoGlow ? 'nav-logo-glow' : ''}`}
            href="#hero"
            onClick={handleLogoClick}
            title="Try clicking me 5 times... ✨"
          >
            <span className="logo-text">ADHY</span>
            <span className="logo-dot">.</span>
          </a>

          <ul className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
            {/* Mobile-only section label */}
            <li className="mobile-menu-label" aria-hidden="true">
              NAVIGATION
            </li>

            {links.map((link, idx) => (
              <li key={link.target}>
                <a
                  href={`#${link.target}`}
                  className="nav-link"
                  onClick={(e) => handleNavClick(e, link.target)}
                >
                  <span className="nav-link-index">0{idx + 1}</span>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/resume.pdf"
                download
                className="nav-resume-btn"
              >
                Resume ↓
              </a>
            </li>

            {/* Mobile-only divider */}
            <li className="mobile-menu-divider" aria-hidden="true" />

            {/* Mobile-only social links */}
            <li className="mobile-menu-socials">
              <div className="mobile-socials-label">CONNECT</div>
              <div className="mobile-socials-row">
                <a
                  href="https://www.linkedin.com/in/adhithya-mohan-s"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-social-link"
                  aria-label="LinkedIn"
                >
                  <FiLinkedin />
                </a>
                <a
                  href="https://instagram.com/zoomout_frames"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-social-link"
                  aria-label="Instagram"
                >
                  <FiInstagram />
                </a>
              </div>
            </li>
          </ul>

          <button
            className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
