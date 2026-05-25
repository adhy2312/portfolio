import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiLinkedin, FiInstagram, FiSun, FiMoon, FiCloud, FiCloudRain, FiCloudLightning, FiCloudSnow, FiActivity } from 'react-icons/fi';
import './Navbar.css';
import './XRayMode.css';
import MagneticButton from './MagneticButton';
import { playClickSound } from '../utils/sound';

/* ────────────────────────────────────────────────
   RainDroplets — realistic water beads on glass
──────────────────────────────────────────────── */
const RainDroplets = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const setSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width  = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(canvas.parentElement);

    /* ——— Droplet class ——— */
    class Drop {
      constructor(spread) {
        this.spawn(spread);
      }
      spawn(spread = false) {
        this.r        = 1.5 + Math.random() * 2.8;          // radius 1.5–4.3 px
        this.x        = this.r + Math.random() * (canvas.width  - this.r * 2);
        this.y        = spread
                          ? Math.random() * canvas.height        // initial spread
                          : this.r + Math.random() * canvas.height * 0.25; // spawn in top 25%
        this.vy       = 0.18 + Math.random() * 0.28;           // slow slide speed
        this.wobble   = Math.random() * Math.PI * 2;           // phase offset
        this.wobbleS  = 0.018 + Math.random() * 0.016;        // wobble speed
        this.wobbleA  = 0.18 + Math.random() * 0.22;          // horizontal wobble amplitude
        this.opacity  = 0.22 + Math.random() * 0.18;  // subtle: 0.22–0.40
        this.stuck    = false;
        this.stuckFor = 0;
        this.stuckMax = 140 + Math.random() * 200;            // frames to stay stuck
        this.fadeOut  = 1;                                     // 1 = fully visible
      }
      update() {
        if (this.stuck) {
          this.stuckFor++;
          // slowly fade out after a while
          if (this.stuckFor > this.stuckMax * 0.65) {
            this.fadeOut -= 0.005;
          }
          if (this.fadeOut <= 0) this.spawn();
          return;
        }
        this.wobble += this.wobbleS;
        this.x += Math.sin(this.wobble) * this.wobbleA;
        this.y += this.vy;

        // clamp horizontally
        this.x = Math.max(this.r, Math.min(canvas.width - this.r, this.x));

        // stick near bottom edge
        if (this.y >= canvas.height - this.r - 3) {
          this.y    = canvas.height - this.r - 3;
          this.stuck = true;
        }
      }
      draw() {
        const alpha = this.opacity * this.fadeOut;
        
        // shadow
        ctx.fillStyle = `rgba(0, 30, 80, ${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(this.x + 1, this.y + 1, this.r, 0, Math.PI * 2);
        ctx.fill();

        // main body
        ctx.fillStyle = `rgba(160, 220, 255, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();

        // highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* initialise drops spread across the surface */
    const COUNT = 18;  // fewer drops = more subtle
    const drops = Array.from({ length: COUNT }, () => new Drop(true));

    /* occasionally spawn a fresh drop at top */
    let spawnTimer = 0;

    let animId;
    let lastTime = 0;
    const animate = (time) => {
      animId = requestAnimationFrame(animate);
      
      // Throttle to roughly 30fps for performance
      if (time - lastTime < 33) return;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      spawnTimer++;
      if (spawnTimer > 15) {
        spawnTimer = 0;
        // find a stuck or faded drop to recycle
        const candidates = drops.filter(d => d.stuck && d.fadeOut < 0.4);
        const target = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
        if (target) target.spawn();
      }

      drops.forEach(d => { d.update(); d.draw(); });
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
};


const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const [logoGlow, setLogoGlow] = useState(false);
  const [xrayActive, setXrayActive] = useState(false);

  const toggleXray = () => {
    setXrayActive(!xrayActive);
    document.body.classList.toggle('xray-mode');
  };

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
        <div className="navbar-inner">
          {ambientClass === 'ambient-rain' && <RainDroplets />}
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

          <button className="xray-toggle-btn" onClick={toggleXray} title="Toggle X-Ray / Developer Mode">
            <FiActivity />
          </button>

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
