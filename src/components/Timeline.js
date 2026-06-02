import React, { useRef, useState, useEffect } from 'react';
import { client } from '../sanity';
import DecryptedText from './DecryptedText';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Timeline.css';

gsap.registerPlugin(ScrollTrigger);

const fallbackData = [
  { id: 1, year: '2024', title: 'Completed 12th std', description: 'Graduated higher secondary education.' },
  { id: 2, year: '2024', title: 'Started Engineering at MBCET', description: 'Embarked on my B.Tech journey in Electronics and Communication.' },
  { id: 3, year: '2024', title: 'Joined FRAMES MBCET', description: 'Became a member of the official photography club.' },
  { id: 4, year: '2025', title: 'Completed 1st semester', description: 'Successfully finished the first semester.' },
  { id: 5, year: '2025', title: 'Joined ISTE SC MBCET', description: 'Selected as PR and Media Junior Execom member.' },
  { id: 6, year: '2025', title: 'Completed 2nd semester', description: 'Finished freshman year of engineering.' },
  { id: 7, year: '2025', title: 'Promoted as Creative Curator', description: 'Elevated to Creative Curator at FRAMES MBCET.' },
  { id: 8, year: '2025', title: 'PR & Media Head at ISTE', description: 'Elevated to PR and Media Head at ISTE SC MBCET.' },
  { id: 9, year: '2026', title: 'Media Head & Core Coordinator', description: 'Led media for NEXORA 26\' - 24th All Kerala ISTE Annual Student State Convention.' },
  { id: 10, year: 'Present', title: 'Learning Full Stack & Design', description: 'Currently mastering Full Stack Development and UI/UX designing in Figma.' },
];

const Timeline = () => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const activeLineRef = useRef(null);
  const whisperRef = useRef(null);
  const bgRef = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const nodesContainerRef = useRef(null);

  const [milestones, setMilestones] = useState(fallbackData);

  const scrollState = useRef({
    target: 0,
    current: 0,
    max: 0,
    velocity: 0,
    isDragging: false,
    startX: 0,
    startScroll: 0,
    hoveredNode: null,
    hoverTime: 0,
    whisperShown: false
  });

  useEffect(() => {
    const query = '*[_type == "milestone"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) {
        // Find if PR & Media Head exists, fix title for trigger if needed
        const processedData = data.map(m => {
          if (m.title.includes('PR') && m.title.includes('ISTE')) {
             return { ...m, title: 'PR & Media Head at ISTE' };
          }
          return m;
        });
        setMilestones(processedData);
      }
    }).catch(console.error);
  }, []);

  // ═══ GSAP Horizontal Pin + Dynamic Node Animations ═══
  useEffect(() => {
    if (!sectionRef.current || !trackRef.current || !nodesContainerRef.current) return;

    // We wait briefly for fonts/images to layout before measuring horizontal width
    const ctx = gsap.context(() => {
      // 1. Header Reveal
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('.section-label, .section-title, .section-divider, .section-desc');
        gsap.fromTo(headerEls,
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 1,
            stagger: 0.12,
            ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true }
          }
        );
      }

      // 2. Native Horizontal Scroll with GSAP
      const container = containerRef.current;
      if (!container) return;

      const updateScrollProgress = () => {
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;

        // Dynamic Background Mode
        if (bgRef.current) {
          const r = 255 - (progress * 10) | 0;
          const g = 255 - (progress * 14) | 0;
          const b = 255 - (progress * 20) | 0;
          bgRef.current.style.backgroundColor = `rgb(${r},${g},${b})`;
        }
        
        // Active line growth
        if (activeLineRef.current) {
          activeLineRef.current.style.transform = `scaleX(${progress})`;
          activeLineRef.current.style.transformOrigin = 'left center';
        }
      };

      container.addEventListener('scroll', updateScrollProgress);
      // Initial call
      updateScrollProgress();

      // 3. Dynamic Pro-Level Node Animations (triggered by horizontal intersection)
      const nodes = nodesContainerRef.current.querySelectorAll('.timeline-node-wrapper');
      nodes.forEach((node, i) => {
        const content = node.querySelector('.timeline-content');
        const point = node.querySelector('.timeline-point');
        const isTop = i % 2 === 0;
        
        if (content) {
          gsap.fromTo(content, 
            { y: isTop ? -80 : 80, opacity: 0, scale: 0.8, rotateY: 15 },
            {
              y: 0, opacity: 1, scale: 1, rotateY: 0,
              scrollTrigger: {
                trigger: node,
                scroller: container, // Use the horizontal container!
                horizontal: true,
                start: 'left 95%',
                end: 'left 50%',
                scrub: 1,
              }
            }
          );
        }
        
        if (point) {
          gsap.fromTo(point,
            { scale: 0, opacity: 0 },
            {
              scale: 1, opacity: 1,
              scrollTrigger: {
                trigger: node,
                scroller: container,
                horizontal: true,
                start: 'left 95%',
                end: 'left 60%',
                scrub: 1,
              }
            }
          );
        }
      });
      
      return () => {
        container.removeEventListener('scroll', updateScrollProgress);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, [milestones]);

  // Drag to scroll functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
    };

    const onMouseUp = () => {
      isDown = false;
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // GSAP hover effects on timeline nodes (micro-interactions)
  useEffect(() => {
    if (!nodesContainerRef.current) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const nodes = nodesContainerRef.current.querySelectorAll('.timeline-content');
    
    const handleEnter = (e) => {
      gsap.to(e.currentTarget, {
        y: -8,
        scale: 1.03,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleLeave = (e) => {
      gsap.to(e.currentTarget, {
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
        overwrite: 'auto',
      });
    };

    nodes.forEach(node => {
      node.addEventListener('mouseenter', handleEnter);
      node.addEventListener('mouseleave', handleLeave);
    });

    return () => {
      nodes.forEach(node => {
        node.removeEventListener('mouseenter', handleEnter);
        node.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, [milestones]);

  const handleMouseEnter = (title) => scrollState.current.hoveredNode = title;
  const handleMouseLeave = () => scrollState.current.hoveredNode = null;

  return (
    <section className="timeline-section" id="timeline" ref={(el) => { bgRef.current = el; sectionRef.current = el; }}>
      
      {/* Temporal Whisper Layer */}
      <div className="temporal-whisper" ref={whisperRef}></div>

      <div className="container">
        <div className="timeline-header" ref={headerRef}>
          <span className="section-label">{"// temporal memory"}</span>
          <h2 className="section-title">
            The <span>Timeline</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            A corridor of preserved architectural memories. The future remains unresolved.
          </p>
        </div>
      </div>

      <div className="timeline-scroll-wrapper" ref={containerRef} data-lenis-prevent="true">
        <div className="timeline-track-container" ref={trackRef}>
          
          {/* Central Track Lines */}
          <div className="timeline-line-bg" />
          <div className="timeline-line-active" ref={activeLineRef} />

          <div className="timeline-nodes" ref={nodesContainerRef}>
            {milestones.map((item, index) => {
              const isTop = index % 2 === 0;
              return (
                <div
                  key={item._id || item.id}
                  className={`timeline-node-wrapper ${isTop ? 'node-top' : 'node-bottom'}`}
                  onMouseEnter={() => handleMouseEnter(item.title)}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={() => handleMouseEnter(item.title)}
                  onTouchEnd={handleMouseLeave}
                >
                  <div className="timeline-content glass-card">
                    <span className="timeline-year">
                      <DecryptedText text={item.year} speed={60} />
                    </span>
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-desc">{item.description}</p>
                    
                    {/* Visual Audio Resonance (CSS-only illusion) */}
                    <div className="audio-resonance">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                  <div className="timeline-point">
                    <div className="timeline-point-inner heartbeat-pulse" />
                  </div>
                </div>
              );
            })}

            {/* UNFINISHED FUTURE SYSTEM */}
            <div 
              className="timeline-node-wrapper node-bottom unresolved-future-node"
              onMouseEnter={() => handleMouseEnter('UNRESOLVED_FUTURE')}
              onMouseLeave={handleMouseLeave}
            >
              <div className="timeline-content glass-card fractured-memory">
                <span className="timeline-year corrupted-text">202X</span>
                <h3 className="timeline-title">Unknown Runtime</h3>
                <p className="timeline-desc">System still evolving. Future architecture unresolved.</p>
                <div className="audio-resonance glitch-resonance">
                   <span></span><span></span><span></span>
                </div>
              </div>
              <div className="timeline-point glitch-point">
                <div className="timeline-point-inner" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
