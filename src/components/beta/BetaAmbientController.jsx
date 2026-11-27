import React, { useEffect, useRef, useState } from 'react';
import { useSiteMode } from '../../contexts/SiteModeContext';

const AMBIENT_STORAGE_KEY = 'beta-ambient-flags';

export function readAmbientFlags() {
  try {
    const raw = JSON.parse(localStorage.getItem(AMBIENT_STORAGE_KEY) || '{}');
    return {
      paperGrain: Boolean(raw.paperGrain),
      monsoonRain: Boolean(raw.monsoonRain),
      zenMode: Boolean(raw.zenMode),
      thermalGlow: Boolean(raw.thermalGlow),
      kicadLayer: Boolean(raw.kicadLayer),
    };
  } catch {
    return {
      paperGrain: false,
      monsoonRain: false,
      zenMode: false,
      thermalGlow: false,
      kicadLayer: false,
    };
  }
}

export function writeAmbientFlags(next) {
  try {
    localStorage.setItem(AMBIENT_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new CustomEvent('beta:ambient-change', { detail: next }));
}

function getIstHour() {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist.getHours();
}

function getSkyPhase(hour) {
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

export default function BetaAmbientController() {
  const { mode } = useSiteMode();
  const isBeta = mode === 'beta';
  const [flags, setFlags] = useState(readAmbientFlags);
  const canvasRef = useRef(null);

  // Sync ambient flags via custom event
  useEffect(() => {
    const onChange = (e) => {
      if (e?.detail) setFlags(e.detail);
      else setFlags(readAmbientFlags());
    };
    window.addEventListener('beta:ambient-change', onChange);
    return () => window.removeEventListener('beta:ambient-change', onChange);
  }, []);

  // #76 Live IST Sky Tint + body class toggles (#82, #88, #12, #3)
  useEffect(() => {
    if (!isBeta) {
      document.body.removeAttribute('data-ist-sky');
      document.body.classList.remove(
        'beta-paper-grain',
        'beta-zen-mode',
        'beta-thermal-mode',
        'beta-kicad-mode'
      );
      return;
    }

    const applySky = () => {
      document.body.setAttribute('data-ist-sky', getSkyPhase(getIstHour()));
    };
    applySky();
    const skyTimer = setInterval(applySky, 60000);

    document.body.classList.toggle('beta-paper-grain', flags.paperGrain);
    document.body.classList.toggle('beta-zen-mode', flags.zenMode);
    document.body.classList.toggle('beta-thermal-mode', flags.thermalGlow);
    document.body.classList.toggle('beta-kicad-mode', flags.kicadLayer);

    return () => {
      clearInterval(skyTimer);
      document.body.removeAttribute('data-ist-sky');
      document.body.classList.remove(
        'beta-paper-grain',
        'beta-zen-mode',
        'beta-thermal-mode',
        'beta-kicad-mode'
      );
    };
  }, [isBeta, flags]);

  // #80 Dynamic Favicon Status Dot (IST active hours)
  useEffect(() => {
    if (!isBeta) return;
    const link = document.querySelector("link[rel*='icon']");
    if (!link) return;
    const originalHref = link.getAttribute('href');
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 32, 32);
        const h = getIstHour();
        const isActiveIst = h >= 8 && h < 23;
        ctx.beginPath();
        ctx.arc(25, 25, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#0f131d';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(25, 25, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = isActiveIst ? '#10b981' : '#e5c158';
        ctx.fill();
        link.setAttribute('href', canvas.toDataURL('image/png'));
      } catch {}
    };
    if (originalHref) img.src = originalHref;

    return () => {
      cancelled = true;
      if (originalHref) link.setAttribute('href', originalHref);
    };
  }, [isBeta]);

  // #77 Monsoon Rain Ambient Toggle (lightweight 30fps canvas, off by default)
  useEffect(() => {
    if (!isBeta || !flags.monsoonRain) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId = null;
    let lastTime = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drops = Array.from({ length: 42 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      len: 10 + Math.random() * 14,
      vy: 6 + Math.random() * 5,
      alpha: 0.08 + Math.random() * 0.14,
    }));

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (now - lastTime < 33) return; // ~30fps cap for battery friendliness
      lastTime = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.strokeStyle = `rgba(186, 210, 245, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1.5, d.y + d.len);
        ctx.stroke();
        d.y += d.vy;
        d.x -= 0.6;
        if (d.y > canvas.height) {
          d.y = -d.len;
          d.x = Math.random() * (canvas.width + 60);
        }
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isBeta, flags.monsoonRain]);

  if (!isBeta || !flags.monsoonRain) return null;

  return (
    <canvas
      ref={canvasRef}
      className="beta-monsoon-canvas"
      aria-hidden="true"
    />
  );
}
