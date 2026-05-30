import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ns from '../core/NervousSystem';

const LocalRainCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const setSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    setSize();

    const ro = new ResizeObserver(setSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    class Drop {
      constructor(spread) {
        this.spawn(spread);
      }
      spawn(spread = false) {
        this.r        = 1.5 + Math.random() * 2.8;
        this.x        = this.r + Math.random() * (canvas.width  - this.r * 2);
        this.y        = spread ? Math.random() * canvas.height : this.r + Math.random() * canvas.height * 0.25;
        this.vy       = 0.18 + Math.random() * 0.28;
        this.wobble   = Math.random() * Math.PI * 2;
        this.wobbleS  = 0.018 + Math.random() * 0.016;
        this.wobbleA  = 0.18 + Math.random() * 0.22;
        this.opacity  = 0.22 + Math.random() * 0.18;
        this.stuck    = false;
        this.stuckFor = 0;
        this.stuckMax = 140 + Math.random() * 200;
        this.fadeOut  = 1;
      }
      update() {
        if (this.stuck) {
          this.stuckFor++;
          if (this.stuckFor > this.stuckMax * 0.65) this.fadeOut -= 0.005;
          if (this.fadeOut <= 0) this.spawn();
          return;
        }
        this.wobble += this.wobbleS;
        this.x += Math.sin(this.wobble) * this.wobbleA;
        this.y += this.vy;
        this.x = Math.max(this.r, Math.min(canvas.width - this.r, this.x));
        if (this.y >= canvas.height - this.r - 3) {
          this.y = canvas.height - this.r - 3;
          this.stuck = true;
        }
      }
      draw(lx, ly) {
        const alpha = this.opacity * this.fadeOut;
        
        // 1. Cast Shadow (Opposite of light source)
        // Light refracts, so shadow has a slight blue-ish core
        ctx.fillStyle = `rgba(0, 10, 30, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(this.x - lx * this.r * 0.7, this.y - ly * this.r * 0.7, this.r * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // 2. Main Drop Body (Water base)
        ctx.fillStyle = `rgba(160, 200, 230, ${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();

        // 3. Fresnel Edge Ring (Darker border for surface tension depth)
        ctx.strokeStyle = `rgba(10, 30, 50, ${alpha * 0.3})`;
        ctx.lineWidth = this.r * 0.15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 0.95, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Internal Caustic Glow (Light passing through focusing on opposite inner edge)
        ctx.fillStyle = `rgba(220, 245, 255, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(this.x - lx * this.r * 0.4, this.y - ly * this.r * 0.4, this.r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 5. Specular Highlight (Direct reflection facing the light source)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.beginPath();
        const hx = this.x + lx * this.r * 0.45;
        const hy = this.y + ly * this.r * 0.45;
        ctx.arc(hx, hy, this.r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // 6. Secondary micro-highlight for ultra-realism (sharp dot)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(hx + lx * this.r * 0.15, hy + ly * this.r * 0.15, this.r * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const COUNT = Math.floor((canvas.width * canvas.height) / 30000) || 5; 
    const drops = Array.from({ length: COUNT }, () => new Drop(true));
    
    let spawnTimer = 0;
    let animId;
    let lastTime = 0;
    let isVisible = false;

    // Intersection Observer to PAUSE animation when offscreen
    const io = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    io.observe(canvas);

    const animate = (time) => {
      if (!isVisible) return; // KILL loop if offscreen! Zero GPU cost!
      if (time - lastTime < 40) return; // ~25fps throttle
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Compute solar light vector dynamically (without heavy CSS reads)
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      let lx = 0, ly = 1; // Default moon/night light pointing down
      if (currentHour >= 6 && currentHour <= 18) {
        const sunAngle = ((currentHour - 6) / 12) * Math.PI; // 0 to PI
        lx = -Math.cos(sunAngle); // -1 (left/morning) to 1 (right/evening)
        ly = -Math.sin(sunAngle); // pointing UP towards the sun
      } else {
        // Moonlight casts a softer, static angle
        lx = 0.2;
        ly = -0.8;
      }

      spawnTimer++;
      if (spawnTimer > 15) {
        spawnTimer = 0;
        const candidates = drops.filter(d => d.stuck && d.fadeOut < 0.4);
        const target = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
        if (target) target.spawn();
      }
      drops.forEach(d => { d.update(); d.draw(lx, ly); });
    };
    
    // Register with brain: LOW priority means drops frame cleanly during heavy fatigue
    ns.register('rainDroplets', animate, { priority: 'LOW' });

    return () => {
      ns.unregister('rainDroplets');
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="local-rain-overlay"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        borderRadius: 'inherit'
      }}
    />
  );
};

const RainDroplets = ({ targetSelector }) => {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (targetSelector) {
      // Find all target elements and ensure they have position relative/absolute
      const elements = Array.from(document.querySelectorAll(targetSelector));
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'static') {
          el.style.position = 'relative';
        }
        // Force overflow hidden so rain doesn't bleed out of rounded corners
        el.style.overflow = 'hidden'; 
      });
      setNodes(elements);
    }
  }, [targetSelector]);

  if (targetSelector) {
    if (nodes.length === 0) return null;
    return nodes.map((node, i) => createPortal(<LocalRainCanvas key={i} />, node));
  }

  return <LocalRainCanvas />;
};

export default RainDroplets;
