import React, { useState, useEffect, useRef } from 'react';
import { FiLinkedin, FiInstagram, FiSun, FiMoon, FiCloud, FiCloudRain, FiCloudLightning, FiCloudSnow } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const [logoGlow, setLogoGlow] = useState(false);

  // Weather Ambient State
  const [weatherData, setWeatherData] = useState(null);
  const [ambientClass, setAmbientClass] = useState('');

  const scrolledRef = useRef(false);

  // Fetch Weather Data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Fetching specifically for Thiruvananthapuram, Kerala
        const apiKey = '92e41715eebf95a75dca713b1bf3fe06';
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Thiruvananthapuram,IN&appid=${apiKey}&units=metric`);
        const data = await res.json();
        
        if (data.cod === 200 && data.weather && data.weather.length > 0) {
          setWeatherData({
            condition: data.weather[0].main,
            temp: Math.round(data.main.temp),
            isDay: data.dt > data.sys.sunrise && data.dt < data.sys.sunset
          });
        } else {
          // API key might be inactive (401), fallback to a default visual state
          console.warn("Weather API returned non-200. Using default ambient state.");
          setWeatherData({
            condition: 'Clear',
            temp: 28,
            isDay: true
          });
        }
      } catch (error) {
        console.error("Failed to fetch ambient weather data:", error);
        // Fallback visual state on network error
        setWeatherData({ condition: 'Clear', temp: 28, isDay: true });
      }
    };

    fetchWeather();
  }, []);

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

    if (clickCountRef.current >= 5) {
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

      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${ambientClass}`}>
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

          {weatherData && (
            <div className="weather-indicator" title={`${weatherData.condition}, ${weatherData.temp}°C`}>
              {renderWeatherIcon()}
              <span>{weatherData.temp}°C</span>
            </div>
          )}

          {/* Desktop Nav Links */}
          <ul className="desktop-nav-links">
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
    </>
  );
};

export default Navbar;
