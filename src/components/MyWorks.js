import React, { useState, useEffect, useRef } from 'react';
import './MyWorks.css';
import { FiGithub, FiArrowRight, FiGlobe, FiZap, FiStar, FiPenTool, FiCamera, FiHome } from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import { useSiteMode } from '../contexts/SiteModeContext';
import { getBetaUrlParam, updateBetaUrlParam } from '../core/betaAgenticBus';
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
    liveLink: 'https://istembcet-web.vercel.app/',
    githubLink: 'https://github.com/adhy2312/ISTE-WEBSITE',
    accent: 'var(--accent-primary)',
    icon: <FiGlobe />,
  },
  {
    title: 'Automated Certificate Gen',
    description:
      'A full-stack application designed to automate the generation and distribution of certificates. Features an intuitive dashboard to manage templates, user records, and bulk email delivery.',
    tags: ['React', 'Node.js', 'Express', 'Automation'],
    category: 'fullstack',
    liveLink: null,
    githubLink: 'https://github.com/adhy2312/certificate-generator-app',
    accent: 'var(--accent-purple, #b19cd9)',
    icon: <FiZap />,
  },
  {
    title: 'Odoo - KiCad BOM Sync',
    description:
      'A specialized Python cron job that automatically synchronizes KiCad Bill of Materials (BOM) directly into Odoo. Automates sales order generation and manages inventory components seamlessly.',
    tags: ['Python', 'Odoo ERP', 'KiCad', 'Cron Job'],
    category: 'electronics',
    liveLink: null,
    githubLink: 'https://github.com/adhy2312/Odoo-KiCad-Sync',
    accent: 'var(--accent-blue, #6495ED)',
    icon: <FiZap />,
  },
  {
    title: 'Smart Lighting System (IoT)',
    description:
      'An ESP32-based intelligent lighting controller that reacts to ambient light and motion. Features Bluetooth configuration, LDR sensor integration, and real-time PWM dimming.',
    tags: ['ESP32', 'Arduino', 'Embedded C', 'IoT'],
    category: 'electronics',
    liveLink: null,
    githubLink: 'https://github.com/adhy2312/lumina-studio',
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
];

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Full-Stack', value: 'fullstack' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'Design', value: 'design' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Photography', value: 'photography' },
];


const normalizeTechToken = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\.js\b/g, '')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim();

const projectMatchesSkill = (project, skillName) => {
  const needle = normalizeTechToken(skillName);
  if (!needle) return false;
  const tags = Array.isArray(project.tags) ? project.tags : [];
  if (tags.some((tag) => {
    const normTag = normalizeTechToken(tag);
    return normTag === needle || normTag.includes(needle) || needle.includes(normTag);
  })) {
    return true;
  }
  const needleWords = needle.split(/\s+/).filter((w) => w.length >= 3);
  return tags.some((tag) => {
    const normTag = normalizeTechToken(tag);
    return needleWords.some((w) => normTag === w || normTag.includes(w));
  });
};

const MyWorks = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [fetchedProjects, setFetchedProjects] = useState([]);
  const [highlightedSkill, setHighlightedSkill] = useState(null);
  const highlightTimerRef = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const filtersRef = useRef(null);
  
  const { getStoryForSection, openStory } = useStory();
  const { t, mode } = useSiteMode();
  const hasStory = !!getStoryForSection('projects');

  useEffect(() => {
    const query = '*[_type == "project" && !(_id in path("drafts.**"))] | order(_createdAt asc) { title, description, category, tags, githubLink, liveLink, buildTime, soundtrack, emotionalNote }';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) {
        setFetchedProjects(data);
      }
    }).catch((err) => {
      console.error('Failed to load projects from Sanity:', err);
    });
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

  const currentProjects = React.useMemo(() => {
    const raw = fetchedProjects.length > 0 ? fetchedProjects : projects;
    return raw.map((p) => {
      let defaultAccent = 'var(--accent-primary)';
      let defaultIcon = <FiGlobe />;
      if (p.category === 'electronics') {
        defaultAccent = 'var(--accent-blue, #6495ED)';
        defaultIcon = <FiZap />;
      } else if (p.category === 'design') {
        defaultAccent = 'var(--accent-gold, #f5a623)';
        defaultIcon = <FiPenTool />;
      } else if (p.category === 'photography') {
        defaultAccent = 'var(--accent-cyan, #4fc3f7)';
        defaultIcon = <FiCamera />;
      } else if (p.category === 'fullstack') {
        defaultAccent = 'var(--accent-primary)';
        defaultIcon = <FiGlobe />;
      }

      const rawGithub = (p.githubLink && p.githubLink !== 'null' && p.githubLink !== '#') 
        ? p.githubLink 
        : ((p.github && p.github !== 'null' && p.github !== '#') ? p.github : null);
      const lowerTitle = (p.title || '').toLowerCase();
      const defaultRepo = lowerTitle.includes('iste')
        ? 'https://github.com/adhy2312/ISTE-WEBSITE'
        : lowerTitle.includes('certificate')
          ? 'https://github.com/adhy2312/certificate-generator-app'
          : lowerTitle.includes('odoo') && lowerTitle.includes('kicad')
            ? 'https://github.com/adhy2312/Odoo-KiCad-Sync'
            : lowerTitle.includes('smart lighting')
              ? 'https://github.com/adhy2312/lumina-studio'
              : lowerTitle.includes('portfolio')
                ? 'https://github.com/adhy2312/portfolio'
                : null;
      const defaultLive = lowerTitle.includes('iste')
        ? 'https://istembcet-web.vercel.app/'
        : lowerTitle.includes('portfolio')
          ? 'https://portfolio-adhym.vercel.app/'
          : null;
      const cleanGithub = rawGithub || defaultRepo;
      const rawLive = (p.liveLink && p.liveLink !== 'null' && p.liveLink !== '#') 
        ? p.liveLink 
        : ((p.link && p.link !== 'null' && p.link !== '#') ? p.link : null);
      const cleanLive = rawLive || defaultLive;

      return {
        ...p,
        tags: Array.isArray(p.tags) ? p.tags : [],
        accent: p.accent || defaultAccent,
        icon: p.icon || defaultIcon,
        githubLink: cleanGithub,
        liveLink: cleanLive,
      };
    });
  }, [fetchedProjects]);

  const filtered =
    activeFilter === 'all'
      ? currentProjects
      : currentProjects.filter((p) => p.category === activeFilter);

  const isBeta = mode === 'beta';

  const clearHighlightedSkill = () => {
    setHighlightedSkill(null);
    updateBetaUrlParam('skill', null);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isBeta) {
      clearHighlightedSkill();
      return;
    }
    const urlSkill = getBetaUrlParam('skill');
    if (urlSkill) {
      setActiveFilter('all');
      setHighlightedSkill(urlSkill);
    }
    const onSkillHighlight = (e) => {
      const skill = e?.detail?.skill;
      if (!skill) return;
      setActiveFilter('all');
      setHighlightedSkill(skill);
      updateBetaUrlParam('skill', skill);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedSkill(null);
        updateBetaUrlParam('skill', null);
      }, 6000);
    };
    window.addEventListener('beta:skill-highlight', onSkillHighlight);
    return () => {
      window.removeEventListener('beta:skill-highlight', onSkillHighlight);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [isBeta]);

  const skillMatchedProjects = (isBeta && highlightedSkill)
    ? currentProjects.filter((p) => projectMatchesSkill(p, highlightedSkill))
    : [];

  const displayedProjects = (isBeta && highlightedSkill && skillMatchedProjects.length > 0)
    ? skillMatchedProjects
    : filtered;


  return (
    <section className="myworks" id="works" ref={sectionRef} data-xray="[SECTION: PROJECTS]&#10;Data Source: Sanity.io CMS&#10;Cards: 3D Tilt via GSAP&#10;Images: @sanity/image-url (Optimized CDN)&#10;Performance: GSAP ScrollTrigger for entrance">
      <div className="container">
        <div className="works-header" ref={headerRef}>
          <span className="section-label">{t('works.label', "// what I've built")}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Masterpieces">
              <span className="section-title-inner"><DecryptedText text={t('works.title', 'Featured')} /> <span><DecryptedText text={t('works.titleAccent', 'Projects')} speed={50} /></span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('projects')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            {t('works.desc', 'A selection of projects spanning web development, hardware prototypes, UI design, and creative photography.')}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="works-filters" ref={filtersRef}>
          {filters.map((f) => {
            const labelMap = {
              all: t('works.filterAll', f.label),
              fullstack: t('works.filterFullstack', f.label),
              electronics: t('works.filterElectronics', f.label),
              design: t('works.filterDesign', f.label),
              photography: t('works.filterPhoto', f.label),
            };
            return (
              <button
                key={f.value}
                className={`filter-btn ${activeFilter === f.value ? 'filter-btn-active' : ''}`}
                onClick={() => {
                  clearHighlightedSkill();
                  setActiveFilter(f.value);
                }}
              >
                {labelMap[f.value] || f.label}
              </button>
            );
          })}
        </div>

        {isBeta && highlightedSkill && (
          <div className="beta-skill-highlight-bar" role="status" aria-live="polite">
            <span className="beta-skill-highlight-pill">
              <span className="beta-skill-highlight-dot" aria-hidden="true" />
              {skillMatchedProjects.length > 0
                ? `Showing ${skillMatchedProjects.length} project${skillMatchedProjects.length > 1 ? 's' : ''} using: ${highlightedSkill}`
                : `No project tagged "${highlightedSkill}" yet — showing all projects`}
              <button
                type="button"
                className="beta-skill-highlight-clear"
                onClick={clearHighlightedSkill}
                aria-label="Clear skill highlight"
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* Vault Grid Layout */}
        <div className="projects-vault-grid" key={`${activeFilter}-${highlightedSkill || 'none'}`}>
          {displayedProjects.map((project, index) => {
            const isSkillMatch = isBeta && highlightedSkill && projectMatchesSkill(project, highlightedSkill);
            return (
              <div 
                key={project.title}
                className={`vault-card specular-card ${isSkillMatch ? 'vault-card--skill-highlighted' : ''}`}
                style={{ 
                  '--card-accent': project.accent,
                  '--animation-order': index
                }}
              >
                <div className="vault-card-inner">
                  <div className="vault-header">
                    <span className="vault-icon" style={{ color: project.accent, textShadow: `0 0 10px ${project.accent}80` }}>{project.icon}</span>
                    <div className="vault-status">
                      <span className="status-dot" style={{ backgroundColor: project.accent, boxShadow: `0 0 8px ${project.accent}` }}></span>
                      <span className="status-text">{project.category}</span>
                    </div>
                  </div>
                  
                  <div className="vault-body">
                    <h3 className="vault-title">{project.title}</h3>
                    <p className="vault-desc">{project.description}</p>
                    <div className="vault-tags">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`vault-tag ${isBeta ? 'vault-tag--interactive' : ''}`}
                          style={{ borderColor: `${project.accent}40`, color: project.accent }}
                          onClick={isBeta ? () => {
                            window.dispatchEvent(new CustomEvent('beta:skill-highlight', { detail: { skill: tag } }));
                          } : undefined}
                          title={isBeta ? `Filter projects by ${tag}` : undefined}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="vault-footer">
                    <div className="vault-links">
                      {(project.githubLink || project.github) && (
                        <a href={project.githubLink || project.github} target="_blank" rel="noopener noreferrer" className="vault-icon-link" aria-label="GitHub">
                          <FiGithub size={18} />
                        </a>
                      )}
                      <button
                        type="button"
                        className="vault-icon-link"
                        title={`Ask Mini-Adhy about ${project.title}`}
                        aria-label={`Ask Mini-Adhy about ${project.title}`}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('miniadhy:ask', {
                            detail: {
                              prompt: `Explain the architecture, tech stack (${(project.tags || []).join(', ')}), and key engineering takeaways of Adhithya's project "${project.title}": ${project.description}`
                            }
                          }));
                        }}
                      >
                        <FiZap size={16} />
                      </button>
                    </div>
                    
                    {(project.liveLink || project.link) && (project.liveLink || project.link) !== '#' ? (
                      <a href={project.liveLink || project.link} target="_blank" rel="noopener noreferrer" className="vault-action-btn" style={{ background: project.accent, boxShadow: `0 4px 15px ${project.accent}40` }}>
                        Access Vault <FiArrowRight size={16} />
                      </a>
                    ) : project.githubLink ? (
                      <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="vault-action-btn" style={{ background: project.accent, boxShadow: `0 4px 15px ${project.accent}40` }}>
                        View Repo <FiArrowRight size={16} />
                      </a>
                    ) : (
                      <span className="vault-action-btn vault-btn-disabled">Locked</span>
                    )}
                  </div>
                </div>
                <div className="vault-glare"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MyWorks;
