import React, { useEffect, useRef, useState } from 'react';
import './EasterEggOverlay.css';

const EasterEggOverlay = ({ egg }) => {
  const canvasRef = useRef(null);
  const [thanosSnapped, setThanosSnapped] = useState(false);

  /* ── PARTY — canvas confetti ── */
  useEffect(() => {
    if (egg !== 'party') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#ff4d6d','#ffd166','#06d6a0','#118ab2','#e040fb','#ffbe0b','#fb5607','#3a86ff'];
    const pieces = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 8 + 4,
      d: Math.random() * 4 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
        p.tiltAngle += p.tiltAngleIncrement;
        p.y += (Math.cos(p.d) + 2) * 1.5;
        p.x += Math.sin(p.d) * 1.5;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        if (p.y > canvas.height) { p.x = Math.random() * canvas.width; p.y = -20; }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  });

  /* ── MATRIX — canvas rain ── */
  useEffect(() => {
    if (egg !== 'matrix') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(1);
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ';

    let animId;
    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = y === 1 ? '#fff' : '#00ff41';
        ctx.font = '14px monospace';
        ctx.fillText(char, i * 16, y * 16);
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  });

  /* ── THANOS — snap 50% of elements to blank ── */
  useEffect(() => {
    if (egg !== 'thanos') {
      // Restore any previously snapped elements when egg clears
      document.querySelectorAll('.thanos-dusted').forEach(el => {
        el.classList.remove('thanos-dusted');
      });
      setThanosSnapped(false);
      return;
    }

    // Wait a beat for the "snap" sound word to show, then dust
    const snapTimer = setTimeout(() => {
      // Gather all meaningful visible elements on the page
      const selectors = [
        'section',
        '.about-stat',
        '.skill-item',
        '.work-card-wrapper',
        '.photo-item',
        '.gh-stat-card',
        '.gh-repo-card',
        '.achievement-card',
        '.testimonial-card',
        '.trusted-logo',
        '.nav-link',
        '.footer-link',
        'h1','h2','h3','p',
        '.btn-primary','.btn-outline',
        '.section-label',
      ];

      const allEls = [];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          // Only include visible, non-overlay elements
          if (
            el.offsetParent !== null &&
            !el.closest('.egg-overlay') &&
            !el.closest('.ttt-overlay') &&
            !el.closest('.page-loader')
          ) {
            allEls.push(el);
          }
        });
      });

      // Deduplicate
      const unique = [...new Set(allEls)];

      // Shuffle and pick exactly 50%
      const shuffled = unique.sort(() => Math.random() - 0.5);
      const half = shuffled.slice(0, Math.floor(shuffled.length / 2));

      // Stagger the dusting for dramatic effect
      half.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('thanos-dusted');
        }, Math.random() * 1200); // random within 1.2s window
      });

      setThanosSnapped(true);

      // Restore after 8s total (egg duration is 8s set in LanguageTerminal)
      setTimeout(() => {
        document.querySelectorAll('.thanos-dusted').forEach(el => {
          el.classList.remove('thanos-dusted');
        });
        setThanosSnapped(false);
      }, 14500);
    }, 800); // 800ms delay after snap word appears

    return () => clearTimeout(snapTimer);
  });

  if (!egg) return null;

  return (
    <div className={`egg-overlay egg-overlay-${egg}`}>
      {(egg === 'party' || egg === 'matrix') && (
        <canvas ref={canvasRef} className="egg-canvas" />
      )}

      {egg === 'party' && (
        <div className="egg-party-lights">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="party-light" style={{ '--i': i }} />
          ))}
          <div className="party-banner">🎉 P A R T Y M O D E 🎉</div>
        </div>
      )}

      {egg === 'matrix' && (
        <div className="matrix-label">// ENTERING THE MATRIX</div>
      )}

      {egg === 'barrelroll' && (
        <div className="barrelroll-hint">🔄 Barrel Roll!</div>
      )}

      {egg === 'gravity' && (
        <div className="gravity-hint">🌍 Gravity disabled...</div>
      )}

      {egg === 'zoomout' && (
        <div className="zoomout-hint">🐜 Ant-Man mode!</div>
      )}

      {egg === 'vibe' && (
        <div className="vibe-overlay-text">✨ V I B E S ✨</div>
      )}

      {egg === 'coffee' && (
        <div className="coffee-overlay">
          ☕ <span>Fuelling with coffee...</span>
        </div>
      )}

      {egg === 'thanos' && (
        <div className="thanos-overlay">
          <div className={`thanos-snap-word ${thanosSnapped ? 'thanos-word-done' : ''}`}>
            *  S N A P  *
          </div>
          <div className="thanos-quote">
            Perfectly balanced, as all things should be.
          </div>
        </div>
      )}
    </div>
  );
};

export default EasterEggOverlay;
