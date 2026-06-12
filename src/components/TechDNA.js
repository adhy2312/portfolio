import React, { useEffect, useRef, useState } from 'react';
import './TechDNA.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ns from '../core/NervousSystem';

gsap.registerPlugin(ScrollTrigger);

const DNA_NODES = [
  { id: 1, label: "React.js", desc: "UI Architecture", color: "#61dafb" },
  { id: 2, label: "Node.js", desc: "Backend Logic", color: "#68a063" },
  { id: 3, label: "Hardware", desc: "ESP32 & Arduino", color: "#f4d03f" },
  { id: 4, label: "Photography", desc: "Visual Composition", color: "#ff6b6b" },
  { id: 5, label: "Figma", desc: "UX/UI Design", color: "#f24e1e" },
  { id: 6, label: "Python", desc: "Data & ML", color: "#3776ab" },
  { id: 7, label: "TypeScript", desc: "Type Safety", color: "#3178c6" },
  { id: 8, label: "MongoDB", desc: "NoSQL DB", color: "#47a248" },
  { id: 9, label: "C++", desc: "Embedded Systems", color: "#00599c" },
  { id: 10, label: "GSAP", desc: "Motion Design", color: "#88ce02" },
  { id: 11, label: "Three.js", desc: "3D WebGL", color: "#ffffff" },
  { id: 12, label: "Tailwind", desc: "Styling", color: "#38bdf8" },
];

const TechDNA = () => {
  const containerRef = useRef(null);
  const sectionRef = useRef(null);
  
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const lastRotationRef = useRef(0);
  const autoSpinRef = useRef(true);
  const lastTimeRef = useRef(performance.now());

  // Responsive Math
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const radius = isMobile ? 120 : 200;
  const verticalSpacing = isMobile ? 50 : 60;
  const totalHeight = DNA_NODES.length * verticalSpacing;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register into the NervousSystem unified loop — eliminates competing RAF
  useEffect(() => {
    const tick = (time) => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (autoSpinRef.current && !isDraggingRef.current) {
        rotationRef.current += 0.005 * (delta / 16.66); // Normalized for 60fps
      }
      
      if (containerRef.current) {
        const tiers = containerRef.current.children;
        const rot = rotationRef.current;
        
        for (let i = 0; i < DNA_NODES.length; i++) {
          const tierEl = tiers[i];
          if (!tierEl) continue;
          
          const angle1 = rot + (i * 0.6);
          const angle2 = angle1 + Math.PI;
          
          const x1 = Math.cos(angle1) * radius;
          const z1 = Math.sin(angle1) * radius;
          
          const x2 = Math.cos(angle2) * radius;
          const z2 = Math.sin(angle2) * radius;
          
          const depthRatio1 = (z1 + radius) / (radius * 2); 
          const scale1 = 0.4 + (depthRatio1 * 0.8);
          const isFront1 = depthRatio1 > 0.8;
          
          const depthRatio2 = (z2 + radius) / (radius * 2); 
          const scale2 = 0.3 + (depthRatio2 * 0.5);
          
          const dist = Math.abs(x1 - x2);
          const left = Math.min(x1, x2);
          const avgZ = (z1 + z2) / 2;
          
          // Update Link
          const linkEl = tierEl.children[0];
          if (linkEl) {
            linkEl.style.transform = `translate3d(${left}px, 0px, ${avgZ}px)`;
            linkEl.style.width = `${dist}px`;
            linkEl.style.opacity = 0.1 + (((avgZ + radius) / (radius * 2)) * 0.4);
          }
          
          // Update Node 1
          const node1El = tierEl.children[1];
          if (node1El) {
            node1El.style.transform = `translate3d(${x1}px, -15px, ${z1}px) scale(${scale1})`;
            node1El.style.opacity = 0.1 + (depthRatio1 * 0.9);
            node1El.style.zIndex = Math.round(depthRatio1 * 100);
            
            const coreEl = node1El.querySelector('.dna-node-core');
            const labelEl = node1El.querySelector('.dna-node-label');
            
            if (isFront1) {
              node1El.classList.add('is-front');
              if (coreEl) {
                coreEl.style.backgroundColor = DNA_NODES[i].color;
                coreEl.style.boxShadow = `0 0 20px ${DNA_NODES[i].color}`;
              }
              if (labelEl) labelEl.style.color = DNA_NODES[i].color;
            } else {
              node1El.classList.remove('is-front');
              if (coreEl) {
                coreEl.style.backgroundColor = '#555';
                coreEl.style.boxShadow = 'none';
              }
              if (labelEl) labelEl.style.color = 'var(--text-muted)';
            }
          }
          
          // Update Node 2
          const node2El = tierEl.children[2];
          if (node2El) {
            node2El.style.transform = `translate3d(${x2}px, -5px, ${z2}px) scale(${scale2})`;
            node2El.style.opacity = 0.1 + (depthRatio2 * 0.5);
            node2El.style.zIndex = Math.round(depthRatio2 * 100);
          }
        }
      }
    };

    ns.register('tech-dna', tick, { priority: 'NORMAL', cooldown: 0 });
    return () => ns.unregister('tech-dna');
  }, [radius]);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    autoSpinRef.current = false;
    dragStartXRef.current = e.clientX || (e.touches && e.touches[0].clientX);
    lastRotationRef.current = rotationRef.current;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const deltaX = clientX - dragStartXRef.current;
    rotationRef.current = lastRotationRef.current + deltaX * 0.01;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    if (!sectionRef.current) return;
    gsap.fromTo(sectionRef.current,
      { opacity: 0, y: 50 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1.2, 
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' }
      }
    );
  }, []);

  return (
    <section className="tech-dna-section" ref={sectionRef}>
      <div className="container">
        <div className="dna-header">
          <span className="section-label">{"// identity core"}</span>
          <h2 className="section-title">Tech <span>DNA</span></h2>
          <p className="section-desc">An interactive structural helix representing my core skills and traits. Drag horizontally to spin the model.</p>
        </div>

        <div 
          className="dna-interactive-zone"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <div className="dna-hint">DRAG TO SPIN</div>
          
          <div className="dna-helix-container" ref={containerRef} style={{ height: `${totalHeight}px` }}>
            {DNA_NODES.map((node, i) => {
              const y = i * verticalSpacing;
              
              // Calculate initial frame 0 values so it's not broken before JS kicks in
              const rot = 0;
              const angle1 = rot + (i * 0.6);
              const angle2 = angle1 + Math.PI;
              const x1 = Math.cos(angle1) * radius;
              const z1 = Math.sin(angle1) * radius;
              const x2 = Math.cos(angle2) * radius;
              const z2 = Math.sin(angle2) * radius;
              
              const depthRatio1 = (z1 + radius) / (radius * 2); 
              const scale1 = 0.4 + (depthRatio1 * 0.8);
              const isFront1 = depthRatio1 > 0.8;
              
              const depthRatio2 = (z2 + radius) / (radius * 2); 
              const scale2 = 0.3 + (depthRatio2 * 0.5);
              
              const dist = Math.abs(x1 - x2);
              const left = Math.min(x1, x2);
              const avgZ = (z1 + z2) / 2;

              return (
                <div key={node.id} className="dna-tier" style={{ transform: `translateY(${y}px)` }}>
                  {/* Link / Rung */}
                  <div className="dna-link" style={{
                    transform: `translate3d(${left}px, 0px, ${avgZ}px)`,
                    width: `${dist}px`,
                    opacity: 0.1 + (((avgZ + radius) / (radius * 2)) * 0.4)
                  }} />

                  {/* Node 1: Actual Skill */}
                  <div className={`dna-node ${isFront1 ? 'is-front' : ''}`} style={{
                    transform: `translate3d(${x1}px, -15px, ${z1}px) scale(${scale1})`,
                    opacity: 0.1 + (depthRatio1 * 0.9),
                    zIndex: Math.round(depthRatio1 * 100)
                  }}>
                    <div className="dna-node-core" style={{
                      backgroundColor: isFront1 ? node.color : '#555',
                      boxShadow: isFront1 ? `0 0 20px ${node.color}` : 'none'
                    }}></div>
                    <div className="dna-node-label" style={{ color: isFront1 ? node.color : 'var(--text-muted)' }}>
                      <div className="title">{node.label}</div>
                      <div className="desc" style={{ color: 'var(--text-primary)' }}>{node.desc}</div>
                    </div>
                  </div>

                  {/* Node 2: Structural Support */}
                  <div className="dna-node-secondary" style={{
                    transform: `translate3d(${x2}px, -5px, ${z2}px) scale(${scale2})`,
                    opacity: 0.1 + (depthRatio2 * 0.5),
                    zIndex: Math.round(depthRatio2 * 100)
                  }}>
                    <div className="dna-node-core-small"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechDNA;
