import React, { useState, useEffect } from 'react';
import { client, urlFor } from '../sanity';
import './Experience.css';
import { useStory } from '../contexts/StoryContext';

const defaultExperiences = [
  {
    _id: 'exp-senate',
    organization: 'MBCET Senate',
    logo: 'https://cdn.sanity.io/images/uefti8ya/production/20be38f1a8da9be9eb1aa1bdfc10ccdbd931e568-225x225.jpg',
    roles: [
      {
        title: 'Media Secretary',
        startDate: 'Oct 2026',
        endDate: 'Present',
        description: 'Nominated and selected as Media Secretary of the MBCET Senate — the apex student governance body of the college. Responsible for official campus communications, institutional press coverage, digital media strategy, and representing student media at the highest academic level.'
      }
    ]
  },
  {
    _id: 'exp_finance',
    organization: 'Finance Club MBCET',
    logo: 'https://cdn.sanity.io/images/uefti8ya/production/1b6babee7cbdb4f20bd959542c9ae2c49c8469cb-1024x1024.jpg',
    roles: [
      {
        title: 'Co-Founder & Director of External Affairs',
        startDate: 'Oct 2026',
        endDate: 'Present',
        description: 'Co-founded the Finance Club at MBCET and serve as Director of External Affairs — building industry partnerships, orchestrating financial literacy workshops, and forging connections between campus talent and the professional world.'
      }
    ]
  },
  {
    _id: 'exp_iste',
    organization: 'ISTE SC MBCET',
    logo: 'https://cdn.sanity.io/images/uefti8ya/production/0d78126270f91fb665446727aca1d35e015dcec2-117x120.png',
    roles: [
      {
        title: 'Chairperson',
        startDate: 'Aug 2026',
        endDate: 'Oct 2026',
        description: 'Served as Chairperson leading 300+ student members, directing technical initiatives, state conventions, and overseeing the official digital portal.'
      },
      {
        title: 'PR & Media Head',
        startDate: 'Aug 2025',
        endDate: 'Aug 2026',
        description: 'Elevated to PR & Media Head. Built the digital voice of the chapter, spearheaded media campaigns, and managed creative operations.'
      },
      {
        title: 'PR & Media Execom',
        startDate: 'Jan 2025',
        endDate: 'Aug 2025',
        description: 'Selected as PR and Media Execom member. Handled photography, video production, and social media reach.'
      }
    ]
  },
  {
    _id: 'exp_frames',
    organization: 'FRAMES MBCET — Photography Club',
    logo: 'https://cdn.sanity.io/images/uefti8ya/production/9c513dc842dbd4fe07c36de20addd8ba26c32231-224x254.png',
    roles: [
      {
        title: 'Lead Photographer',
        startDate: 'Aug 2026',
        endDate: 'Present',
        description: 'Promoted to Lead Photographer at FRAMES MBCET — leading visual storytelling, directing photography teams, and curating campus media coverage.'
      },
      {
        title: 'Creative Curator',
        startDate: 'Aug 2025',
        endDate: 'Aug 2026',
        description: 'Elevated to Creative Curator at FRAMES MBCET — curating visual stories, directing photography workshops, and managing campus media.'
      }
    ]
  },
  {
    _id: 'exp_socius',
    organization: 'Socius Innovative Global Brains',
    logo: 'https://cdn.sanity.io/images/uefti8ya/production/cf1043ea1118e0f164018e3d5a95d460757aae2e-756x796.jpg',
    roles: [
      {
        title: 'Intern',
        startDate: 'Jun 2026',
        endDate: 'Jul 2026',
        description: 'Internship focusing on AI-powered electronics manufacturing, hardware testing, and system implementation.'
      }
    ]
  }
];

// Helper to reliably resolve Sanity image object, direct CDN string, or asset ref
const getOrgLogo = (logo) => {
  if (!logo) return null;
  if (typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('/'))) return logo;
  if (logo.asset || logo._ref) {
    try {
      const url = urlFor(logo).width(160).height(160).fit('crop').auto('format').url();
      return url && url.length > 0 ? url : null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const Experience = () => {
  const [experiences, setExperiences] = useState(defaultExperiences);

  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('experience');

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const query = '*[_type == "experience" && !(_id in path("drafts.**"))] | order(order asc, _createdAt desc)';
        const data = await client.fetch(query);
        if (data && data.length > 0) {
          const seen = new Set();
          const unique = [];
          for (const exp of data) {
            const org = (exp.organization || exp.company || '').trim().toLowerCase();
            const normKey = org.includes('senate') ? 'senate'
              : org.includes('finance') ? 'finance'
              : org.includes('iste') ? 'iste'
              : org.includes('frames') ? 'frames'
              : org.includes('socius') ? 'socius'
              : org;
            if (!seen.has(normKey)) {
              seen.add(normKey);
              // Ensure logo is preserved or falls back to known CDN logo
              const fallbackLogo = defaultExperiences.find(d => d._id.includes(normKey))?.logo;
              unique.push({
                ...exp,
                logo: exp.logo || fallbackLogo
              });
            }
          }
          setExperiences(unique.length > 0 ? unique : data);
        }
      } catch (error) {
        console.error("Error fetching experiences from Sanity:", error);
      }
    };

    fetchExperiences();
  }, []);

  if (!experiences || experiences.length === 0) {
    return null;
  }

  return (
    <section id="experience" className="experience-section">
      <div className="experience-container">
        <div className="experience-header" data-aos="fade-up">
          <span className="section-label">{'// my journey'}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Career Path">
              <span className="section-title-inner">Professional <span>Experience</span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('experience')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
        </div>
        
        <div className="experience-list">
          {experiences.map((exp, index) => {
            const logoSrc = getOrgLogo(exp.logo);
            return (
              <div 
                className="experience-card specular-card" 
                key={exp._id || index}
                data-aos="fade-up" 
                data-aos-delay={index * 100}
              >
                <div className="exp-org-header">
                  <div className="exp-org-logo">
                    {logoSrc ? (
                      <img 
                        src={logoSrc} 
                        alt={exp.organization} 
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="exp-logo-placeholder">
                        {exp.organization ? exp.organization.charAt(0) : 'E'}
                      </div>
                    )}
                  </div>
                  <div className="exp-org-info">
                    <h3 className="exp-org-name">{exp.organization}</h3>
                  </div>
                </div>

              <div className="exp-timeline">
                {exp.roles && exp.roles.map((role, rIndex) => {
                  const isChair = role.title?.toLowerCase().includes('chairperson');
                  const isSecretary = role.title?.toLowerCase().includes('media secretary');
                  const isHighlight = isChair || isSecretary;
                  return (
                    <div className={`exp-role-item ${isChair ? 'chairperson-exp-role' : ''} ${isSecretary ? 'chairperson-exp-role' : ''}`} key={rIndex}>
                      <div className="exp-timeline-visual">
                        <div className={`exp-timeline-dot ${isHighlight ? 'chair-dot' : ''}`}>
                          {isHighlight && <span className="dot-crown-glow" />}
                        </div>
                        {rIndex !== exp.roles.length - 1 && <div className="exp-timeline-line"></div>}
                      </div>
                      <div className="exp-role-content">
                        <div className="exp-role-title-wrapper">
                          <h4 className="exp-role-title">
                            {role.title}
                            {isChair && <span className="role-crown-icon"> ♛</span>}
                            {isSecretary && <span className="role-crown-icon"> 📡</span>}
                          </h4>
                          {isChair && <span className="chair-badge-tag">EXECUTIVE LEAD</span>}
                          {isSecretary && <span className="chair-badge-tag">SENATE</span>}
                        </div>
                        <div className={`exp-role-duration ${isHighlight ? 'chair-duration-badge' : ''}`}>
                          {role.startDate} – {role.endDate || 'Present'}
                        </div>
                        {role.description && (
                          <p className={`exp-role-desc ${isHighlight ? 'chair-role-desc' : ''}`}>{role.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
};

export default Experience;
