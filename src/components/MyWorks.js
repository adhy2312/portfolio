import React, { useState, useEffect, useRef } from 'react';
import './MyWorks.css';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiExternalLink, FiGithub, FiArrowRight, FiGlobe, FiZap, FiStar, FiPenTool, FiCamera, FiHome } from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';

const projects = [
  {
    title: 'ISTE MBCET Portal',
    description:
      'A full-featured organizational portal for ISTE MBCET — built with Next.js and Sanity CMS. Features membership management, event listings, internship launchpad, and a premium glassmorphism UI.',
    tags: ['Next.js', 'Sanity CMS', 'Supabase', 'Framer Motion'],
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
    tags: ['React.js', 'Sanity CMS', 'Gemini API', 'Spotify API', 'Framer Motion'],
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

const TiltCard = ({ children, project, index }) => {
  const ref = useRef(null);
  const [showMemory, setShowMemory] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12.5deg", "-12.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12.5deg", "12.5deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  // Touch/mobile: skip 3D physics layers, use simple fade-in
  if (isTouchDevice) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.06 }}
        className="work-card-wrapper"
        style={{ '--card-accent': project.accent }}
      >
        <div className="work-card glass-card">{children}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 1, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: "1000px", '--card-accent': project.accent }}
      className={`work-card-wrapper ${showMemory ? 'memory-active' : ''}`}
    >
      <div className="work-card glass-card" style={{ transform: "translateZ(50px)" }}>
        {showMemory ? (
          <div className="digital-memory-overlay" style={{ transform: "translateZ(40px)" }}>
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
                style={{ transform: "translateZ(30px)" }}
                title="View Digital Memory"
              >
                ✦
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

const MyWorks = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [fetchedProjects, setFetchedProjects] = useState([]);
  
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

  const currentProjects = fetchedProjects.length > 0 ? fetchedProjects : projects;

  const filtered =
    activeFilter === 'all'
      ? currentProjects
      : currentProjects.filter((p) => p.category === activeFilter);

  return (
    <section className="myworks" id="works" data-xray="[SECTION: PROJECTS]&#10;Data Source: Sanity.io CMS&#10;Cards: 3D Tilt via Framer Motion useSpring&#10;Images: @sanity/image-url (Optimized CDN)&#10;Performance: AnimatePresence for filter transitions">
      <div className="container">
        <motion.div
          className="works-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// what I've built</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Masterpieces">
              <span className="section-title-inner">Featured <span>Projects</span></span>
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
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          className="works-filters"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {filters.map((f) => (
            <button
              key={f.value}
              className={`filter-btn ${activeFilter === f.value ? 'filter-btn-active' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Project cards */}
        <AnimatePresence mode="wait">
          <motion.div
            className="works-grid"
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filtered.map((project, index) => (
              <TiltCard key={project.title} project={project} index={index}>
                <div className="work-card-top" style={{ transform: "translateZ(30px)" }}>
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

                <h3 className="work-title" style={{ transform: "translateZ(40px)" }}>{project.title}</h3>
                <p className="work-desc" style={{ transform: "translateZ(20px)" }}>{project.description}</p>

                <div className="work-tags" style={{ transform: "translateZ(25px)" }}>
                  {project.tags.map((tag) => (
                    <span key={tag} className="work-tag" style={{ '--tag-color': project.accent }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="work-card-footer" style={{ transform: "translateZ(35px)" }}>
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
              </TiltCard>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default MyWorks;
