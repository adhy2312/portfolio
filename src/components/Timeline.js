import React, { useRef, useState, useEffect } from 'react';
import { client } from '../sanity';
import DecryptedText from './DecryptedText';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import { neuralEventBus } from '../utils/NeuralEventBus';
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
  const orchestrator = useOrchestrator();

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

  // ═══ GSAP Timeline Header + Node Entrance Animation ═══
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header: orchestrated stagger reveal
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

      // Timeline nodes: cinematic stagger with alternating direction
      if (nodesContainerRef.current) {
        const nodes = nodesContainerRef.current.querySelectorAll('.timeline-node-wrapper');
        
        nodes.forEach((node, i) => {
          const isTop = i % 2 === 0;
          const content = node.querySelector('.timeline-content');
          const point = node.querySelector('.timeline-point');
          
          if (content) {
            // Cards alternate: top cards drop down, bottom cards rise up
            gsap.fromTo(content,
              { 
                y: isTop ? -60 : 60, 
                opacity: 0, 
                scale: 0.85,
                rotateX: isTop ? 20 : -20,
              },
              {
                y: 0, opacity: 1, scale: 1, rotateX: 0,
                duration: 1,
                delay: 0.1,
                ease: 'power4.out',
                scrollTrigger: {
                  trigger: node,
                  start: 'left 85%',
                  end: 'left 20%',
                  toggleActions: 'play none none none',
                  once: true,
                  horizontal: true,
                  scroller: containerRef.current,
                  // Fallback: if horizontal scroller doesn't work, use section
                }
              }
            );
          }

          // Timeline point: scale in with pop
          if (point) {
            gsap.fromTo(point,
              { scale: 0, opacity: 0 },
              {
                scale: 1, opacity: 1,
                duration: 0.6,
                delay: 0.2,
                ease: 'back.out(2)',
                scrollTrigger: {
                  trigger: node,
                  start: 'left 85%',
                  toggleActions: 'play none none none',
                  once: true,
                  horizontal: true,
                  scroller: containerRef.current,
                }
              }
            );
          }
        });

        // Active line: animate width on section enter
        if (activeLineRef.current) {
          gsap.fromTo(activeLineRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            {
              scaleX: 0.05,
              duration: 1.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 70%',
                once: true,
              }
            }
          );
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [milestones]);

  // Master Physics Loop (RAF)
  useEffect(() => {
    if (!orchestrator) return;

    // ─── GEOMETRY CACHE (updated only on resize, NOT every frame) ───
    const geometryCache = { cw: 0, tw: 0 };
    const updateGeometry = () => {
      if (!containerRef.current || !trackRef.current) return;
      geometryCache.cw = containerRef.current.offsetWidth;
      geometryCache.tw = trackRef.current.scrollWidth;
    };
    const resizeObserver = new ResizeObserver(updateGeometry);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (trackRef.current) resizeObserver.observe(trackRef.current);
    // Initial measure
    updateGeometry();

    // ─── THROTTLE REFS (prevents per-frame emissions) ───
    let lastEmitTime = 0;
    let lastBgProgress = -1;
    let lastLineProgress = -1;

    const tick = (time, delta) => {
      if (!trackRef.current) return;
      const state = scrollState.current;

      // Use CACHED geometry — zero layout reads per frame
      state.max = Math.max(0, geometryCache.tw - geometryCache.cw + 200);

      // Clamp Target
      state.target = Math.max(0, Math.min(state.max, state.target));

      // Lerp (Momentum interpolation)
      const diff = state.target - state.current;
      state.current += diff * 0.08;
      state.velocity = Math.abs(diff);

      // Transform application (Zero React Renders)
      trackRef.current.style.transform = `translate3d(${-state.current | 0}px, 0, 0)`;

      // Active line — only update if progress changed by >0.5%
      if (activeLineRef.current && state.max > 0) {
        const progress = state.current / state.max;
        if (Math.abs(progress - lastLineProgress) > 0.005) {
          lastLineProgress = progress;
          activeLineRef.current.style.transform = `scaleX(${progress})`;
        }
      }

      // Background shift — throttled to max 4fps (every 250ms), only if visible
      if (bgRef.current && state.max > 0 && (time - lastBgProgress > 250)) {
        const progress = state.current / state.max;
        lastBgProgress = time;
        const r = 255 - (progress * 10) | 0;
        const g = 255 - (progress * 14) | 0;
        const b = 255 - (progress * 20) | 0;
        bgRef.current.style.backgroundColor = `rgb(${r},${g},${b})`;
      }

      // Neural Event Emissions — throttled to max 1 per 500ms
      if (time - lastEmitTime > 500) {
        if (state.velocity > 30) {
          neuralEventBus.emit("TIMELINE_FAST_SCROLL");
          lastEmitTime = time;
        } else if (state.velocity < 1 && state.hoveredNode) {
          neuralEventBus.emit("TIMELINE_LINGER");
          lastEmitTime = time;
        }
      }

      // Temporal Whispers Engine (only runs when nearly still)
      if (state.velocity < 1 && state.hoveredNode) {
        state.hoverTime += delta;
        if (state.hoverTime > 2000 && !state.whisperShown) {
           state.whisperShown = true;
           let text = "a fragment of time preserved.";
           if (state.hoveredNode === 'PR & Media Head at ISTE') {
             text = "A voice emerged from the runtime. This changed the rhythm of everything.";
           } else if (state.hoveredNode === 'UNRESOLVED_FUTURE') {
             text = "the architecture ends here, but the memory continues.";
           } else if (state.hoveredNode.includes('Started')) {
             text = "The foundation was poured in silence.";
           } else if (state.hoveredNode.includes('Completed')) {
             text = "One cycle closes, another begins.";
           }
           if (whisperRef.current) {
             whisperRef.current.textContent = text;
             whisperRef.current.classList.add('whisper-active');
           }
        }
      } else {
        state.hoverTime = 0;
        if (state.whisperShown) {
          state.whisperShown = false;
          if (whisperRef.current) whisperRef.current.classList.remove('whisper-active');
        }
      }
    };

    orchestrator.subscribeToRAF('timeline-physics', tick, { priority: 'CRITICAL', gpuCost: 'LOW' });
    return () => {
      orchestrator.unsubscribeFromRAF('timeline-physics');
      resizeObserver.disconnect();
    };
  }, [orchestrator, milestones]);

  // Event Listeners for Virtual Scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Prevent default only if we have room to scroll to prevent getting stuck
      const state = scrollState.current;
      const isScrollable = state.max > 0;
      
      const delta = e.deltaX || e.deltaY;
      
      // If we are scrolling vertically and hit the edge, let page scroll normally
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
         if ((state.target <= 0 && e.deltaY < 0) || (state.target >= state.max && e.deltaY > 0)) {
            return; // Let native vertical scroll happen
         }
      }
      
      if (isScrollable) e.preventDefault();
      scrollState.current.target += delta * 1.5;
    };

    const onTouchStart = (e) => {
      scrollState.current.isDragging = true;
      scrollState.current.startX = e.touches ? e.touches[0].clientX : e.clientX;
      scrollState.current.startScroll = scrollState.current.target;
    };

    const onTouchMove = (e) => {
      if (!scrollState.current.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = clientX - scrollState.current.startX;
      scrollState.current.target = scrollState.current.startScroll - dx * 2;
    };

    const onTouchEnd = () => {
      scrollState.current.isDragging = false;
    };

    // Use passive: false for wheel to prevent native scrolling interference
    el.addEventListener('wheel', onWheel, { passive: false });
    
    // Touch
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    
    // Mouse Drag
    el.addEventListener('mousedown', onTouchStart, { passive: true });
    window.addEventListener('mousemove', onTouchMove, { passive: true });
    window.addEventListener('mouseup', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onTouchStart);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);
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

      <div className="timeline-scroll-wrapper" ref={containerRef}>
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
