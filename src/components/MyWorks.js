import React, { useState, useEffect, useRef } from 'react';
import './MyWorks.css';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiExternalLink, FiGithub, FiArrowRight, FiGlobe, FiZap, FiStar, FiPenTool, FiCamera, FiHome } from 'react-icons/fi';
import { client } from '../sanity';

const projects = [
  {
    title: 'ISTE MBCET Portal',
    description:
      'A full-featured organizational portal for ISTE MBCET — built with Next.js and Sanity CMS. Features membership management, event listings, internship launchpad, and a premium glassmorphism UI.',
    tags: ['Next.js', 'Sanity CMS', 'Supabase', 'Framer Motion'],
    category: 'fullstack',
    link: '#',
    github: '#',
    accent: '#6C63FF',
    icon: <FiGlobe />,
  },
  {
    title: 'Smart Lighting System (IoT)',
    description:
      'An ESP32-based intelligent lighting controller that reacts to ambient light and motion. Features Bluetooth configuration, LDR sensor integration, and real-time PWM dimming.',
    tags: ['ESP32', 'Arduino', 'Embedded C', 'IoT'],
    category: 'electronics',
    link: '#',
    github: '#',
    accent: '#00E5A0',
    icon: <FiZap />,
  },
  {
    title: 'Portfolio Website',
    description:
      'This very portfolio — crafted with React, Framer Motion, and a custom design system. Features animated hero, skill bars, particle effects, and full EmailJS integration.',
    tags: ['React', 'Framer Motion', 'CSS3', 'EmailJS'],
    category: 'frontend',
    link: '#',
    github: '#',
    accent: '#4FC3F7',
    icon: <FiStar />,
  },
  {
    title: 'Figma Design System',
    description:
      'A comprehensive UI kit and design system built in Figma — includes component library, color palette, typography scale, spacing grid, and interactive prototypes.',
    tags: ['Figma', 'UI/UX', 'Prototyping', 'Design System'],
    category: 'design',
    link: '#',
    github: '#',
    accent: '#F5A623',
    icon: <FiPenTool />,
  },
  {
    title: 'Photo Story Series',
    description:
      'A curated visual storytelling project capturing human emotion, urban textures, and golden-hour landscapes. Shot and edited using Adobe Lightroom.',
    tags: ['Photography', 'Lightroom', 'Street', 'Documentary'],
    category: 'photography',
    link: '#',
    github: null,
    accent: '#a78bfa',
    icon: <FiCamera />,
  },
  {
    title: 'IoT Home Automation',
    description:
      'A wireless home automation prototype using NodeMCU and MQTT protocol. Control appliances via a custom-built React dashboard with real-time state sync.',
    tags: ['NodeMCU', 'MQTT', 'React', 'IoT'],
    category: 'electronics',
    link: '#',
    github: '#',
    accent: '#00E5A0',
    icon: <FiHome />,
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

const TiltCard = ({ children, project, index }) => {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12.5deg", "-12.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12.5deg", "12.5deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 1, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px",
        '--card-accent': project.accent
      }}
      className="work-card-wrapper"
    >
      <div 
        className="work-card glass-card"
        style={{ transform: "translateZ(50px)" }}
      >
        {children}
      </div>
    </motion.div>
  );
};

const MyWorks = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [fetchedProjects, setFetchedProjects] = useState([]);

  useEffect(() => {
    const query = '*[_type == "project"]';
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
    <section className="myworks" id="works">
      <div className="container">
        <motion.div
          className="works-header"
          initial={{ opacity: 1, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// what I've built</span>
          <h2 className="section-title" data-hover="Masterpieces">
            <span className="section-title-inner">Featured <span>Projects</span></span>
          </h2>
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
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener noreferrer" className="work-icon-link" aria-label="GitHub">
                        <FiGithub size={16} />
                      </a>
                    )}
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="work-icon-link" aria-label="Live">
                      <FiExternalLink size={16} />
                    </a>
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
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="work-view-link">
                    View Project <FiArrowRight size={14} />
                  </a>
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
