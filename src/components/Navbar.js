import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiLinkedin, FiInstagram, FiSun, FiMoon, FiCloud, FiCloudRain, FiCloudLightning, FiCloudSnow, FiActivity } from 'react-icons/fi';
import gsap from 'gsap';
import './Navbar.css';
import './XRayMode.css';
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
  const [xrayActive, setXrayActive] = useState(false);
  const pillRef = useRef(null);
  const linksRef = useRef([]);

  const toggleXray = () => {
    setXrayActive(!xrayActive);
    document.body.classList.toggle('xray-mode');
  };

  const { weatherData } = useConsciousness();
  const [ambientClass, setAmbientClass] = useState('');
  const scrolledRef = useRef(false);

  // Determine Ambient Class
  useEffect(() => {
    if (!weatherData) return;
    const { condition, isDay } = weatherData;
    let newClass = '';
    
    switch (condition) {
      case 'Clear':
        newClass = isDay ? 'ambient-clear-day' : 'ambient-clear-night';
        break;
      case 'Clouds':
        newClass = 'ambient-clouds';
        break;
      case 'Rain':
      case 'Drizzle':
        newClass = 'ambient-rain';
        break;
      case 'Thunderstorm':
        newClass = 'ambient-thunderstorm';
        break;
      case 'Snow':
        newClass = 'ambient-snow';
        break;
      default:
        newClass = 'ambient-clouds'; // Default fallback
    }
    setAmbientClass(newClass);
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
    if (condition === 'Clouds') return <FiCloud className="weather-icon" />;
    if (condition === 'Rain' || condition === 'Drizzle') return <FiCloudRain className="weather-icon" />;
    if (condition === 'Thunderstorm') return <FiCloudLightning className="weather-icon" />;
    if (condition === 'Snow') return <FiCloudSnow className="weather-icon" />;
    return <FiCloud className="weather-icon" />;
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
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
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

      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${ambientClass}`} data-xray="[COMPONENT: NAVBAR]&#10;API: OpenWeatherMap&#10;Logic: Dynamic ambient classes&#10;Listener: passive true">
        <div className={`navbar-inner ${ambientClass}`}>
          {ambientClass === 'ambient-rain' && <RainDroplets />}

          {/* Left cluster: logo + weather + xray toggle */}
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

            <button className="xray-toggle-btn" onClick={toggleXray} title="Toggle X-Ray / Developer Mode">
              <FiActivity />
            </button>
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
