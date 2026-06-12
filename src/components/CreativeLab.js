import React, { useEffect, useRef, useState } from 'react';
import './CreativeLab.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiSettings, FiMaximize2, FiActivity } from 'react-icons/fi';

gsap.registerPlugin(ScrollTrigger);

const CreativeLab = () => {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [params, setParams] = useState({
    particles: 150,
    connectionDistance: 120,
    mouseRepulsion: 150,
    speed: 1,
  });

  // Canvas Physics Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    let particlesArray = [];
    let rafId;

    let mouse = {
      x: null,
      y: null,
      radius: params.mouseRepulsion
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    class Particle {
      constructor(x, y, dx, dy, size) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = size;
        this.baseX = this.x;
        this.baseY = this.y;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        // Uses the CSS variable for accent color to stay in theme
        ctx.fillStyle = `rgba(244, 208, 63, 0.8)`; 
        ctx.fill();
      }
      
      update() {
        if (this.x > width || this.x < 0) this.dx = -this.dx;
        if (this.y > height || this.y < 0) this.dy = -this.dy;
        
        // Mouse Repulsion
        if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = mouse.radius;
            const force = (maxDistance - distance) / maxDistance;
            const directionX = (forceDirectionX * force * 5);
            const directionY = (forceDirectionY * force * 5);
            this.x -= directionX;
            this.y -= directionY;
          } else {
            if (this.x !== this.baseX) {
              let dx = this.x - this.baseX;
              this.x -= dx / 20;
            }
            if (this.y !== this.baseY) {
              let dy = this.y - this.baseY;
              this.y -= dy / 20;
            }
          }
        }
        
        this.x += this.dx * params.speed;
        this.y += this.dy * params.speed;
        this.draw();
      }
    }

    const init = () => {
      particlesArray = [];
      const numParticles = (width * height) / (15000 / (params.particles / 100));
      for (let i = 0; i < numParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * (width - size * 2) + size * 2);
        let y = (Math.random() * (height - size * 2) + size * 2);
        let dx = (Math.random() - 0.5) * 1.5;
        let dy = (Math.random() - 0.5) * 1.5;
        particlesArray.push(new Particle(x, y, dx, dy, size));
      }
    }

    const connect = () => {
      let opacity = 1;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
            + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
          if (distance < (params.connectionDistance * params.connectionDistance)) {
            opacity = 1 - (distance / (params.connectionDistance * params.connectionDistance));
            ctx.strokeStyle = `rgba(244, 208, 63, ${opacity * 0.5})`; // Theme aware yellow/accent
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();
      rafId = requestAnimationFrame(animate);
    }

    init();
    animate();

    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [params]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  return (
    <section className="creative-lab-section" ref={sectionRef}>
      <div className="container">
        <div className="lab-header">
          <span className="section-label">{"// sandbox"}</span>
          <h2 className="section-title">Creative <span>Lab</span></h2>
          <p className="section-desc">Interactive physics simulation built on HTML5 Canvas. Play with the parameters below.</p>
        </div>

        <div className="lab-container glass-card">
          <canvas ref={canvasRef} className="lab-canvas"></canvas>
          
          <div className="lab-controls">
            <div className="lab-control-header">
              <FiSettings /> Physics Engine Controls
            </div>
            
            <div className="slider-group">
              <label>Particle Density: {params.particles}%</label>
              <input type="range" name="particles" min="50" max="300" value={params.particles} onChange={handleParamChange} />
            </div>
            
            <div className="slider-group">
              <label>Connection Distance: {params.connectionDistance}px</label>
              <input type="range" name="connectionDistance" min="50" max="250" value={params.connectionDistance} onChange={handleParamChange} />
            </div>
            
            <div className="slider-group">
              <label>Repulsion Field: {params.mouseRepulsion}px</label>
              <input type="range" name="mouseRepulsion" min="50" max="300" value={params.mouseRepulsion} onChange={handleParamChange} />
            </div>
            
            <div className="slider-group">
              <label>Kinetic Speed: {params.speed}x</label>
              <input type="range" name="speed" min="0.1" max="5" step="0.1" value={params.speed} onChange={handleParamChange} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreativeLab;
