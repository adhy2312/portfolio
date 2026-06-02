import React, { useState, useEffect, useRef } from 'react';
import './MyWorks.css';
import { FiExternalLink, FiGithub, FiArrowRight, FiGlobe, FiZap, FiStar, FiPenTool, FiCamera, FiHome } from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import DecryptedText from './DecryptedText';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: 'ISTE MBCET Portal',
    description:
      'A full-featured organizational portal for ISTE MBCET — built with Next.js and Sanity CMS. Features membership management, event listings, internship launchpad, and a premium glassmorphism UI.',
    tags: ['Next.js', 'Sanity CMS', 'Supabase', 'GSAP'],
    category: 'fullstack',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-primary)',
    icon: <FiGlobe />,
  },
  {
    title: 'Smart Lighting System (IoT)',
    description:
      'An ESP32-based intelligent lighting controller that reacts to ambient light and motion. Features Bluetooth configuration, LDR sensor integration, and real-time PWM dimming.',
    tags: ['ESP32', 'Arduino', 'Embedded C', 'IoT'],
    category: 'electronics',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-green)',
    icon: <FiZap />,
  },
  {
    title: 'Portfolio Website',
    description:
      'This very portfolio — a premium, interactive full-stack app. Features an AI chatbot persona (Mini-Adhy) powered by Gemini, real-time Spotify "Now Playing" integration, infinite marquees, and dynamic content managed via Sanity CMS.',
    tags: ['React.js', 'Sanity CMS', 'Gemini API', 'Spotify API', 'GSAP'],
    category: 'fullstack',
    liveLink: 'https://portfolio-adhym.vercel.app/',
    githubLink: 'https://github.com/adhy2312/portfolio',
    accent: 'var(--accent-cyan)',
    icon: <FiStar />,
  },
  {
    title: 'Figma Design System',
    description:
      'A comprehensive UI kit and design system built in Figma — includes component library, color palette, typography scale, spacing grid, and interactive prototypes.',
    tags: ['Figma', 'UI/UX', 'Prototyping', 'Design System'],
    category: 'design',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-gold)',
    icon: <FiPenTool />,
  },
  {
    title: 'Photo Story Series',
    description:
      'A curated visual storytelling project capturing human emotion, urban textures, and golden-hour landscapes. Shot and edited using Adobe Lightroom.',
    tags: ['Photography', 'Lightroom', 'Street', 'Documentary'],
    category: 'photography',
    liveLink: 'https://www.instagram.com/zoomout_frames',
    githubLink: null,
    accent: 'var(--accent-magenta)',
    icon: <FiCamera />,
  },
  {
    title: 'IoT Home Automation',
    description:
      'A wireless home automation prototype using NodeMCU and MQTT protocol. Control appliances via a custom-built React dashboard with real-time state sync.',
    tags: ['NodeMCU', 'MQTT', 'React', 'IoT'],
    category: 'electronics',
    liveLink: null,
    githubLink: null,
    accent: 'var(--accent-green)',
    icon: <FiHome />,
    buildTime: 'Built during the 2021 lockdown',
    soundtrack: 'listening to lo-fi beats',
    emotionalNote: 'Debugging hardware over Wi-Fi taught me patience the hard way.'
  },
];

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Full-Stack', value: 'fullstack' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'Design', value: 'design' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Photography', value: 'photography' },
];

const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

// Simplified BrutalCard — pure CSS hover, no JS 3D tracking, no GPU-heavy transforms
const BrutalCard = ({ children, project, index, className }) => {
  const ref = useRef(null);
  const [showMemory, setShowMemory] = useState(false);

  // Lightweight GSAP scroll entrance only
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    gsap.fromTo(el,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
          once: true,
        }
      }
    );
  }, []);

  return (
    <div ref={ref} className={`work-card-scroll-wrapper ${showMemory ? 'memory-active' : ''} ${className || ''}`}>
      <div
        className="work-card-wrapper"
        style={{ '--card-accent': project.accent }}
        data-cursor-ai="true"
        data-project-title={project.title}
        data-project-desc={project.description}
      >
        <div className="work-card">
          {showMemory ? (
            <div className="digital-memory-overlay">
              <button className="close-memory-btn" onClick={() => setShowMemory(false)}>✕</button>
              <div className="memory-header">
                <span className="memory-icon">🧠</span>
                <h4>Digital Memory</h4>
              </div>
              <div className="memory-content">
                {project.buildTime && (
                  <div className="memory-item">
                    <span className="memory-label">TIMELINE</span>
                    <p>{project.buildTime}</p>
                  </div>
                )}
                {project.soundtrack && (
                  <div className="memory-item">
                    <span className="memory-label">SOUNDTRACK</span>
                    <p>{project.soundtrack}</p>
                  </div>
                )}
                {project.emotionalNote && (
                  <div className="memory-item">
                    <span className="memory-label">PROCESS NOTE</span>
                    <p>{project.emotionalNote}</p>
                  </div>
                )}
                {!project.buildTime && !project.soundtrack && !project.emotionalNote && (
                  <p className="memory-empty">Memory fragment corrupted or not recorded for this project.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {children}
              {(project.buildTime || project.soundtrack || project.emotionalNote) && (
                <button
                  className="reveal-memory-btn"
                  onClick={(e) => { e.stopPropagation(); setShowMemory(true); }}
                  title="View Digital Memory"
                >
                  ✦
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MyWorks = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [fetchedProjects, setFetchedProjects] = useState([]);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const filtersRef = useRef(null);
  
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('projects');

  useEffect(() => {
    const query = '*[_type == "project"] | order(_createdAt asc) { title, description, category, tags, githubLink, liveLink, buildTime, soundtrack, emotionalNote }';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) {
        setFetchedProjects(data);
      }
    }).catch(console.error);
  }, []);

  // GSAP header + filters animation
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider, .section-desc');
        gsap.fromTo(headerEls,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true }
          }
        );
      }

      if (filtersRef.current) {
        gsap.fromTo(filtersRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.6,
            ease: 'power4.out',
            scrollTrigger: { trigger: filtersRef.current, start: 'top 90%', once: true }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const currentProjects = fetchedProjects.length > 0 ? fetchedProjects : projects;

  const filtered =
    activeFilter === 'all'
      ? currentProjects
      : currentProjects.filter((p) => p.category === activeFilter);

  return (
    <section className="myworks" id="works" ref={sectionRef} data-xray="[SECTION: PROJECTS]&#10;Data Source: Sanity.io CMS&#10;Cards: 3D Tilt via GSAP&#10;Images: @sanity/image-url (Optimized CDN)&#10;Performance: GSAP ScrollTrigger for entrance">
      <div className="container">
        <div className="works-header" ref={headerRef}>
          <span className="section-label">{"// what I've built"}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Masterpieces">
              <span className="section-title-inner"><DecryptedText text="Featured" /> <span><DecryptedText text="Projects" speed={50} /></span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('projects')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            A selection of projects spanning web development, hardware prototypes, UI design, and creative photography.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="works-filters" ref={filtersRef}>
          {filters.map((f) => (
            <button
              key={f.value}
              className={`filter-btn ${activeFilter === f.value ? 'filter-btn-active' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Project cards */}
        <div className="bento-grid" key={activeFilter}>
          {filtered.map((project, index) => {
            let spanClass = '';
            if (activeFilter === 'all') {
              if (index === 0 || index === 3) spanClass = 'bento-item-span-2';
              else if (index === 5) spanClass = 'bento-item-span-3';
            }

            return (
            <BrutalCard key={project.title} project={project} index={index} className={spanClass}>
              <div className="work-card-top">
                <span className="work-emoji" style={{ color: project.accent }}>{project.icon}</span>
                <div className="work-card-links">
                  {(project.githubLink || project.github) && (
                    <a href={project.githubLink || project.github} target="_blank" rel="noopener noreferrer" className="work-icon-link" aria-label="GitHub">
                      <FiGithub size={16} />
                    </a>
                  )}
                  {(project.liveLink || project.link) && (project.liveLink || project.link) !== '#' && (
                    <a href={project.liveLink || project.link} target="_blank" rel="noopener noreferrer" className="work-icon-link" aria-label="Live">
                      <FiExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>

              <h3 className="work-title">{project.title}</h3>
              <p className="work-desc">{project.description}</p>

              <div className="work-tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="work-tag" style={{ '--tag-color': project.accent }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="work-card-footer">
                {(project.liveLink || project.link) && (project.liveLink || project.link) !== '#' ? (
                  <a href={project.liveLink || project.link} target="_blank" rel="noopener noreferrer" className="work-view-link">
                    View Project <FiArrowRight size={14} />
                  </a>
                ) : (
                  <span className="work-view-link work-view-link-disabled">
                    Coming Soon
                  </span>
                )}
              </div>
            </BrutalCard>
          )})}
        </div>
      </div>
    </section>
  );
};

export default MyWorks;
