import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const links = [
    { label: 'About', target: 'about' },
    { label: 'Skills', target: 'skills' },
    { label: 'Projects', target: 'works' },
    { label: 'Photography', target: 'photography' },
    { label: 'Contact', target: 'contact' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        <a className="nav-logo" href="#hero" onClick={(e) => handleNavClick(e, 'hero')}>
          <span className="logo-text">ADHY</span>
          <span className="logo-dot">.</span>
        </a>

        <ul className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          {links.map((link) => (
            <li key={link.target}>
              <a
                href={`#${link.target}`}
                className="nav-link"
                onClick={(e) => handleNavClick(e, link.target)}
              >
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
  );
};

export default Navbar;
