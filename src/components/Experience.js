import React, { useState, useEffect } from 'react';
import { client, urlFor } from '../sanity';
import './Experience.css';
import { useStory } from '../contexts/StoryContext';

const defaultExperiences = [
  {
    _id: 'exp_iste',
    organization: 'ISTE SC MBCET',
    logo: null,
    roles: [
      {
        title: 'Chairperson',
        startDate: 'Aug 2026',
        endDate: 'Present',
        description: 'Elected Chairperson leading 300+ student members, directing technical initiatives, state conventions, and overseeing the official digital portal.'
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
    organization: 'FRAMES MBCET',
    logo: null,
    roles: [
      {
        title: 'Creative Curator',
        startDate: '2025',
        endDate: 'Present',
        description: 'Curating visual stories, campus media events, and photography workshops for the official photography club.'
      }
    ]
  }
];

const Experience = () => {
  const [experiences, setExperiences] = useState(defaultExperiences);
  const [loading, setLoading] = useState(true);
  
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('experience');

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const query = '*[_type == "experience"] | order(order asc)';
        const data = await client.fetch(query);
        if (data && data.length > 0) {
          setExperiences(data);
        }
      } catch (error) {
        console.error("Error fetching experiences:", error);
      } finally {
        setLoading(false);
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
          <span className="section-label">// my journey</span>
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
          {experiences.map((exp, index) => (
            <div 
              className="experience-card" 
              key={exp._id || index}
              data-aos="fade-up" 
              data-aos-delay={index * 100}
            >
              <div className="exp-org-header">
                <div className="exp-org-logo">
                  {exp.logo ? (
                    <img src={urlFor(exp.logo).width(120).url()} alt={exp.organization} />
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
                  return (
                    <div className={`exp-role-item ${isChair ? 'chairperson-exp-role' : ''}`} key={rIndex}>
                      <div className="exp-timeline-visual">
                        <div className={`exp-timeline-dot ${isChair ? 'chair-dot' : ''}`}>
                          {isChair && <span className="dot-crown-glow" />}
                        </div>
                        {rIndex !== exp.roles.length - 1 && <div className="exp-timeline-line"></div>}
                      </div>
                      <div className="exp-role-content">
                        <div className="exp-role-title-wrapper">
                          <h4 className="exp-role-title">
                            {role.title}
                            {isChair && <span className="role-crown-icon"> ♛</span>}
                          </h4>
                          {isChair && <span className="chair-badge-tag">EXECUTIVE LEAD</span>}
                        </div>
                        <div className={`exp-role-duration ${isChair ? 'chair-duration-badge' : ''}`}>
                          {role.startDate} – {role.endDate || 'Present'}
                        </div>
                        {role.description && (
                          <p className={`exp-role-desc ${isChair ? 'chair-role-desc' : ''}`}>{role.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
