import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiLinkedin, FiInstagram, FiSun, FiMoon, FiCloud, FiCloudRain, FiCloudLightning, FiCloudSnow } from 'react-icons/fi';
import gsap from 'gsap';
import './Navbar.css';
import MagneticButton from './MagneticButton';
import { playClickSound } from '../utils/sound';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import RainDroplets from './RainDroplets';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const [logoGlow, setLogoGlow] = useState(false);
  const pillRef = useRef(null);
  const linksRef = useRef([]);

  const { weatherData } = useConsciousness();
  
  const getAmbientClass = (data) => {
    if (!data) {
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hour = ist.getHours();
      return (hour >= 6 && hour < 18) ? 'ambient-clear-day' : 'ambient-clear-night';
    }
    const { condition, isDay } = data;
    switch (condition) {
      case 'Clear':
        return isDay ? 'ambient-clear-day' : 'ambient-clear-night';
      case 'Clouds':
        return isDay ? 'ambient-clouds' : 'ambient-clouds-night';
      case 'Rain':
      case 'Drizzle':
        return 'ambient-rain';
      case 'Thunderstorm':
        return 'ambient-thunderstorm';
      case 'Snow':
        return 'ambient-snow';
      default:
        return isDay ? 'ambient-clear-day' : 'ambient-clear-night';
    }
  };

  const [ambientClass, setAmbientClass] = useState(() => getAmbientClass(weatherData));
  const scrolledRef = useRef(false);

  // Determine Ambient Class
  useEffect(() => {
    setAmbientClass(getAmbientClass(weatherData));
  }, [weatherData]);


  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolledRef.current) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP Liquid Glassmorphic Pill Logic
  const handlePillHover = (index) => {
    if (!pillRef.current || !linksRef.current[index]) return;
    const el = linksRef.current[index];
    
    gsap.to(pillRef.current, {
      x: el.offsetLeft - 12,
      y: el.offsetTop - 6,
      width: el.offsetWidth + 24,
      height: el.offsetHeight + 12,
      opacity: 1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.6)',
      overwrite: 'auto',
    });
    // Liquid morphing effect on hover
    gsap.to(pillRef.current, {
      borderRadius: '12px 24px 12px 24px',
      duration: 0.3,
      yoyo: true,
      repeat: 1
    });
  };

  const handlePillLeave = () => {
    if (!pillRef.current) return;
    gsap.to(pillRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto',
      borderRadius: '20px'
    });
  };

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
    handleNavClick(e, 'hero');

    clickCountRef.current += 1;
    setLogoGlow(true);
    setTimeout(() => setLogoGlow(false), 300);

    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      clearTimeout(clickTimerRef.current);
      window.dispatchEvent(new CustomEvent('launch-ttt'));
    }
  };

  const links = [
    { label: 'About', target: 'about' },
    { label: 'Skills', target: 'skills' },
    { label: 'Projects', target: 'works' },
    { label: 'Photography', target: 'photography' },
    { label: 'Contact', target: 'contact' },
  ];

  const renderWeatherIcon = () => {
    if (!weatherData) return null;
    const { condition, isDay } = weatherData;
    if (condition === 'Clear') return isDay ? <FiSun className="weather-icon" /> : <FiMoon className="weather-icon" />;
    if (condition === 'Clouds') return isDay ? <FiCloud className="weather-icon" /> : <FiMoon className="weather-icon" />;
    if (condition === 'Rain' || condition === 'Drizzle') return <FiCloudRain className="weather-icon" />;
    if (condition === 'Thunderstorm') return <FiCloudLightning className="weather-icon" />;
    if (condition === 'Snow') return <FiCloudSnow className="weather-icon" />;
    return isDay ? <FiSun className="weather-icon" /> : <FiMoon className="weather-icon" />;
  };

  return (
    <>
      <div
        className={`mobile-menu-backdrop ${menuOpen ? 'backdrop-visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className={`mobile-menu-panel ${menuOpen ? 'mobile-menu-open' : ''}`}>
        <button
          className="mobile-settings-icon"
          aria-label="Site Settings"
          title="Site Modes"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(false);
            window.dispatchEvent(new CustomEvent('toggle-site-mode'));
          }}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'var(--accent-brutal-yellow, #f4d03f)',
            border: '2px solid #000',
            boxShadow: '2px 2px 0px #000',
            color: '#000',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <FiSettings size={18} />
        </button>
        <ul className="mobile-nav-links">
          <li className="mobile-menu-label" aria-hidden="true">
            NAVIGATION
          </li>

          {links.map((link, idx) => (
            <li key={link.target}>
              <a
                href={`#${link.target}`}
                className="mobile-nav-link"
                onClick={(e) => handleNavClick(e, link.target)}
              >
                <span className="mobile-nav-link-index">0{idx + 1}</span>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/resume.pdf"
              download
              className="mobile-nav-resume-btn"
              onClick={playClickSound}
            >
              Resume ↓
            </a>
          </li>
          <li>
            <button
              className="mobile-nav-resume-btn"
              onClick={() => {
                setMenuOpen(false);
                playClickSound();
                if (window.openAgentPortal) {
                  window.openAgentPortal();
                } else {
                  window.location.hash = '#agentp';
                }
              }}
              style={{
                marginTop: '10px',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(123, 97, 255, 0.25))',
                borderColor: '#00f0ff',
                color: '#00f0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
                boxShadow: '0 0 16px rgba(0, 240, 255, 0.2)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
              ⚡ AGENT PORTAL [L5]
            </button>
          </li>

          <li className="mobile-menu-divider" aria-hidden="true" />

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
      </div>

      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${ambientClass}`}>
        <div className={`navbar-inner ${ambientClass}`}>
          {ambientClass === 'ambient-rain' && <RainDroplets />}

          {/* Left cluster: logo + weather indicator */}
          <div className="navbar-left-cluster">
            <a
              className={`nav-logo ${logoGlow ? 'nav-logo-glow' : ''}`}
              href="#hero"
              onClick={handleLogoClick}
              title="Try clicking me 3 times... ✨"
            >
              <span className="logo-text">ADHY</span>
              <span className="logo-dot">.</span>
            </a>

            {weatherData && (
              <div className="weather-indicator" title={`${weatherData.condition}, ${weatherData.temp}°C`}>
                {renderWeatherIcon()}
                <span>{weatherData.temp}°C</span>
              </div>
            )}
          </div>

          {/* Desktop Nav Links */}
          <ul className="desktop-nav-links" onMouseLeave={handlePillLeave} style={{ position: 'relative' }}>
            <div 
              ref={pillRef}
              className="nav-pill-bg"
              style={{
                opacity: 0,
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                zIndex: 0
              }}
            />
            {links.map((link, i) => (
              <li 
                key={link.target} 
                ref={el => linksRef.current[i] = el}
                onMouseEnter={() => handlePillHover(i)}
                style={{ position: 'relative' }}
              >
                <a
                  href={`#${link.target}`}
                  className="nav-link"
                  onClick={(e) => handleNavClick(e, link.target)}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <MagneticButton>
                <a
                  href="/resume.pdf"
                  download
                  className="nav-resume-btn"
                  onClick={playClickSound}
                >
                  Resume ↓
                </a>
              </MagneticButton>
            </li>
            <li>
              <button
                onClick={() => {
                  playClickSound();
                  if (window.openAgentPortal) {
                    window.openAgentPortal();
                  } else {
                    window.location.hash = '#agentp';
                  }
                }}
                className="nav-agent-portal-btn"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(123, 97, 255, 0.2))',
                  border: '1px solid rgba(0, 240, 255, 0.5)',
                  color: '#00f0ff',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 14px rgba(0, 240, 255, 0.25)',
                  transition: 'all 0.2s ease',
                  marginLeft: '8px',
                  fontFamily: 'Space Grotesk, sans-serif'
                }}
                title="Access Autonomous Agent Intelligence Portal & Cognitive OS"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                ⚡ AGENTS
              </button>
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
