import React, { useRef, useState, useEffect } from 'react';
import { client } from '../sanity';
import DecryptedText from './DecryptedText';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Timeline.css';

gsap.registerPlugin(ScrollTrigger);

/* ── Module-level constants (never change, never recreated) ── */
const WHISPERS = [
  'memory still loading...',
  'temporal data fragmented',
  'retrieving archived state...',
  'system clock divergence detected',
  'compiling past into present',
  'rendering the unresolved future',
];

const fallbackData = [
  {
    id: 1,
    year: '2024',
    title: 'Completed 12th Std',
    description: 'Graduated higher secondary education with a strong foundation in science.',
    memory: '"Every ending is just a new stack frame."'
  },
  {
    id: 2,
    year: '2024',
    title: 'Started Engineering at MBCET',
    description: 'Embarked on B.Tech journey in Electronics and Communication Engineering.',
    memory: '"The first line of code I wrote at MBCET was a blinking LED. The rest is still compiling."'
  },
  {
    id: 3,
    year: '2024',
    title: 'Joined FRAMES MBCET',
    description: 'Became a member of the official photography club — started seeing the world through a lens.',
    memory: '"f/1.8 and a dream. That\'s how it started."'
  },
  {
    id: 4,
    year: '2025',
    title: 'Completed 1st Semester',
    description: 'Survived the first semester. Learned that electronics and coffee are deeply correlated.',
    memory: '"Sleep(0) is not a valid coping mechanism."'
  },
  {
    id: 5,
    year: '2025',
    title: 'Joined ISTE SC MBCET',
    description: 'Selected as PR and Media Junior Execom member. Learned that storytelling is engineering too.',
    memory: '"The best PR is code that speaks for itself."'
  },
  {
    id: 6,
    year: '2025',
    title: 'Completed 2nd Semester',
    description: 'Finished freshman year of engineering. The circuit diagrams started making sense.',
    memory: '"First PCB burned. Third one actually worked. Still counts."'
  },
  {
    id: 7,
    year: '2025',
    title: 'Promoted as Creative Curator',
    description: 'Elevated to Creative Curator at FRAMES MBCET — curating visual stories for the campus.',
    memory: '"A photo isn\'t taken. It\'s designed at 1/500th of a second."'
  },
  {
    id: 8,
    year: '2025',
    title: 'PR & Media Head at ISTE',
    description: 'Elevated to PR and Media Head at ISTE SC MBCET. First real leadership role.',
    memory: '"Being a head means your mistakes have a press release now."'
  },
  {
    id: 9,
    year: '2026',
    title: 'Media Head & Core Coordinator',
    description: 'Led media for NEXORA 26\' — the 24th All Kerala ISTE Annual Student State Convention.',
    memory: '"600 students. 48 hours. One Wi-Fi router. We survived."'
  },
  {
    id: 10,
    year: 'Now',
    title: 'Learning Full Stack & Design',
    description: 'Currently mastering Full Stack Development and UI/UX design. Building things that scale beyond the classroom.',
    memory: '"Still in beta. Shipping anyway."'
  },
];

const Timeline = () => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const activeLineRef = useRef(null);
  const progressRef = useRef(null);
  const whisperRef = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const nodesContainerRef = useRef(null);

  const [milestones, setMilestones] = useState(fallbackData);

  const scrollState = useRef({
    hoveredNode: null,
    lastScrollLeft: 0,
    whisperTimeout: null,
    whisperIndex: 0,
  });

  // Fetch from Sanity
  useEffect(() => {
    const query = '*[_type == "milestone"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) {
        setMilestones(data);
      }
    }).catch(console.error);
  }, []);

  // GSAP Header Reveal + Horizontal Scroll GSAP
  useEffect(() => {
    if (!sectionRef.current || !trackRef.current || !nodesContainerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Header Reveal
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll(
          '.section-label, .section-title, .section-divider, .section-desc, .timeline-scroll-hint'
        );
        gsap.fromTo(headerEls,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              once: true,
            }
          }
        );
      }

      // 2. Scroll progress tracker
      const container = containerRef.current;
      if (!container) return;

      const updateProgress = () => {
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;

        // Animate active line
        if (activeLineRef.current) {
          activeLineRef.current.style.transform = `translateY(-50%) scaleX(${progress})`;
        }
        // Update bottom progress bar
        if (progressRef.current) {
          progressRef.current.style.width = `${progress * 100}%`;
        }

        // ── TEMPORAL WHISPER: fire when scroll velocity is high ──
        const velocity = Math.abs(scrollLeft - scrollState.current.lastScrollLeft);
        scrollState.current.lastScrollLeft = scrollLeft;

        if (velocity > 18 && whisperRef.current) {
          const s = scrollState.current;
          // Only show if not already showing
          if (!whisperRef.current.classList.contains('whisper-active')) {
            const idx = s.whisperIndex % WHISPERS.length;
            whisperRef.current.textContent = WHISPERS[idx];
            s.whisperIndex++;
            whisperRef.current.classList.add('whisper-active');
          }
          // Debounce: reset timer on each fast-scroll event
          clearTimeout(s.whisperTimeout);
          s.whisperTimeout = setTimeout(() => {
            if (whisperRef.current) {
              whisperRef.current.classList.remove('whisper-active');
            }
          }, 2500);
        }
      };

      container.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();

      // 3. Node Scroll Animations
      const nodes = nodesContainerRef.current.querySelectorAll('.timeline-node-wrapper');
      nodes.forEach((node, i) => {
        const content = node.querySelector('.timeline-content');
        const point = node.querySelector('.timeline-point');
        const isTop = i % 2 === 0;

        if (content) {
          gsap.fromTo(content,
            { y: isTop ? -60 : 60, opacity: 0, scale: 0.88 },
            {
              y: 0, opacity: 1, scale: 1,
              scrollTrigger: {
                trigger: node,
                scroller: container,
                horizontal: true,
                start: 'left 95%',
                end: 'left 55%',
                scrub: 1.2,
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
                start: 'left 90%',
                end: 'left 65%',
                scrub: 1,
              }
            }
          );
        }
      });

      return () => {
        container.removeEventListener('scroll', updateProgress);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, [milestones]);

  // Drag to scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      isDown = true;
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const onMouseLeave = () => { isDown = false; container.style.cursor = 'grab'; };
    const onMouseUp   = () => { isDown = false; container.style.cursor = 'grab'; };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.8;
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener('mousedown',  onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseup',    onMouseUp);
    container.addEventListener('mousemove',  onMouseMove);

    return () => {
      container.removeEventListener('mousedown',  onMouseDown);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mouseup',    onMouseUp);
      container.removeEventListener('mousemove',  onMouseMove);
    };
  }, []);

  // GSAP hover micro-interactions
  useEffect(() => {
    if (!nodesContainerRef.current) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const nodes = nodesContainerRef.current.querySelectorAll('.timeline-content');

    const handleEnter = (e) => {
      gsap.to(e.currentTarget, {
        y: -6,
        scale: 1.02,
        duration: 0.35,
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

  return (
    <section
      className="timeline-section"
      id="timeline"
      ref={sectionRef}
      data-xray="[SECTION: TIMELINE]&#10;Render: Horizontal Scroll&#10;Animation: GSAP ScrollTrigger (horizontal scroller)&#10;Data: Sanity CMS + fallback static array"
    >
      {/* Temporal Whisper */}
      <div className="temporal-whisper" ref={whisperRef} />

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
          <div className="timeline-scroll-hint">
            <span>Drag to explore</span>
            <div className="hint-arrow">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        className="timeline-scroll-wrapper"
        ref={containerRef}
      >
        {/* Bottom progress bar */}
        <div className="timeline-progress-bar" ref={progressRef} />

        <div className="timeline-track-container" ref={trackRef}>
          {/* Central track lines */}
          <div className="timeline-line-bg" />
          <div className="timeline-line-active" ref={activeLineRef} />

          <div className="timeline-nodes" ref={nodesContainerRef}>
            {milestones.map((item, index) => {
              const isTop = index % 2 === 0;
              return (
                <div
                  key={item._id || item.id}
                  className={`timeline-node-wrapper ${isTop ? 'node-top' : 'node-bottom'}`}
                  onMouseEnter={() => { scrollState.current.hoveredNode = item.title; }}
                  onMouseLeave={() => { scrollState.current.hoveredNode = null; }}
                  onTouchStart={() => { scrollState.current.hoveredNode = item.title; }}
                  onTouchEnd={() => { scrollState.current.hoveredNode = null; }}
                >
                  <div className="timeline-content glass-card">
                    <span className="timeline-year">
                      <DecryptedText text={item.year || ''} speed={60} />
                    </span>
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-desc">{item.description}</p>

                    {/* Memory Fragment — revealed on hover */}
                    {(item.memory || item.memoryFragment) && (
                      <div className="timeline-memory">
                        {item.memory || item.memoryFragment}
                      </div>
                    )}

                    {/* Visual audio waveform */}
                    <div className="audio-resonance">
                      <span /><span /><span />
                    </div>
                  </div>

                  <div className="timeline-point">
                    <div className="timeline-point-inner heartbeat-pulse" />
                  </div>
                </div>
              );
            })}

            {/* UNRESOLVED FUTURE — always last */}
            <div
              className="timeline-node-wrapper node-bottom unresolved-future-node"
              onMouseEnter={() => { scrollState.current.hoveredNode = 'UNRESOLVED_FUTURE'; }}
              onMouseLeave={() => { scrollState.current.hoveredNode = null; }}
            >
              <div className="timeline-content glass-card fractured-memory">
                <span className="timeline-year corrupted-text">202X</span>
                <h3 className="timeline-title">Unknown Runtime</h3>
                <p className="timeline-desc">
                  System still evolving. Future architecture unresolved. Still writing the next milestone.
                </p>
                <div className="timeline-memory" style={{ opacity: 0.4, transform: 'translateY(0)' }}>
                  "The best code is the code yet to be written."
                </div>
                <div className="audio-resonance glitch-resonance">
                  <span /><span /><span />
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
