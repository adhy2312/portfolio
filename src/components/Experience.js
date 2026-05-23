import React, { useState, useEffect } from 'react';
import { client, urlFor } from '../sanity';
import './Experience.css';
import { useStory } from '../contexts/StoryContext';

const Experience = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('experience');

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const query = '*[_type == "experience"] | order(order asc)';
        const data = await client.fetch(query);
        setExperiences(data);
      } catch (error) {
        console.error("Error fetching experiences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  if (loading) {
    return null;
  }

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
                {exp.roles && exp.roles.map((role, rIndex) => (
                  <div className="exp-role-item" key={rIndex}>
                    <div className="exp-timeline-visual">
                      <div className="exp-timeline-dot"></div>
                      {rIndex !== exp.roles.length - 1 && <div className="exp-timeline-line"></div>}
                    </div>
                    <div className="exp-role-content">
                      <h4 className="exp-role-title">{role.title}</h4>
                      <div className="exp-role-duration">
                        {role.startDate} – {role.endDate || 'Present'}
                      </div>
                      {role.description && (
                        <p className="exp-role-desc">{role.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
