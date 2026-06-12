import React, { useEffect, useRef, useState } from 'react';
import './StatsBento.css';
import { client } from '../sanity';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiGithub, FiCamera, FiFigma, FiMap, FiAward, FiBookOpen, FiTerminal, FiZap } from 'react-icons/fi';
import { GitHubCalendar } from 'react-github-calendar';

gsap.registerPlugin(ScrollTrigger);


const StatsBento = () => {
  const sectionRef = useRef(null);
  const [sanityData, setSanityData] = useState(null);
  const [liveGithubData, setLiveGithubData] = useState({ repos: null, contributions: null });

  useEffect(() => {
    client.fetch('*[_type == "statsBento"][0]')
      .then(data => setSanityData(data))
      .catch(console.error);
  }, []);
  
  // Real-time GitHub fetching
  useEffect(() => {
    const username = sanityData?.githubUsername || 'adhy2312';
    
    // Fetch repositories
    fetch(`https://api.github.com/users/${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.public_repos !== undefined) {
          setLiveGithubData(prev => ({ ...prev, repos: data.public_repos }));
        }
      })
      .catch(err => console.error("Error fetching repos:", err));

    // Fetch contributions
    fetch(`https://github-contributions-api.deno.dev/${username}.json`)
      .then(res => res.json())
      .then(data => {
         if (data.totalContributions !== undefined) {
           setLiveGithubData(prev => ({ ...prev, contributions: data.totalContributions }));
         }
      })
      .catch(err => console.error("Error fetching contributions:", err));
  }, [sanityData?.githubUsername]);
  
  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.bento-card');
    
    const ctx = gsap.context(() => {
      gsap.fromTo(cards, 
        { y: 50, opacity: 0, rotateX: 10 }, 
        { 
          y: 0, 
          opacity: 1, 
          rotateX: 0,
          duration: 0.8, 
          stagger: 0.1, 
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
          }
        }
      );
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section className="stats-bento-section" ref={sectionRef}>
      <div className="container">
        <div className="stats-bento-grid">
          
          {/* GitHub Activity Bento */}
          <div className="bento-card bento-github">
            <div className="bento-header">
              <span className="bento-title">Git_Activity <span style={{fontSize:'0.65rem', color:'var(--text-muted)', marginLeft: '8px', letterSpacing: 'normal'}}>@{sanityData?.githubUsername || 'adhy2312'}</span></span>
              <FiGithub className="bento-icon" />
            </div>
            <div className="github-heatmap-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowX: 'auto', paddingBottom: '10px' }}>
              <div className="github-heatmap" style={{ minWidth: '700px' }}>
                <GitHubCalendar 
                  username={sanityData?.githubUsername || 'adhy2312'} 
                  colorScheme="light"
                  theme={{
                    light: ['#ebedf0', '#fbe04d', '#f4d03f', '#e6b800', '#cc9900']
                  }}
                  hideTotalCount={true}
                  hideColorLegend={true}
                />
              </div>
            </div>

            <div className="github-stats-row">
              <div className="gh-stat">
                <span className="gh-stat-val">{sanityData?.githubContributions || liveGithubData.contributions || '...'}</span>
                <span className="gh-stat-label">Contributions</span>
              </div>
              <div className="gh-stat">
                <span className="gh-stat-val">{sanityData?.githubRepos || liveGithubData.repos || '...'}</span>
                <span className="gh-stat-label">Repositories</span>
              </div>
              <div className="gh-stat">
                <span className="gh-stat-val">{sanityData?.githubStreak || '...'}</span>
                <span className="gh-stat-label">Day Streak</span>
              </div>
            </div>
          </div>
          
          {/* Photography Stats */}
          <div className="bento-card bento-photography" style={{ gridColumn: 'span 2' }}>
            <div className="bento-header">
              <FiCamera className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.photosCount || '20,000+'}</div>
            <div className="bento-subtitle">Photos Captured</div>
            <div className="bento-details" style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {sanityData?.photoStyles || 'Portraits • Nature • Landscape'} <br/>
              <span style={{ color: 'var(--accent-primary)' }}>{sanityData?.photoAwards || '🏆 4x Competition Winner'}</span>
            </div>
          </div>
          
          {/* Typing Speed */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiZap className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.wpmSpeed || 120}</div>
            <div className="bento-subtitle">WPM Speed</div>
          </div>
          
          {/* Design Stats */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiFigma className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.uiDesigns || '20+'}</div>
            <div className="bento-subtitle">UI Designs</div>
          </div>

          {/* Travel Stats */}
          <div className="bento-card bento-travel" style={{ gridColumn: 'span 2' }}>
            <div className="bento-header">
              <FiMap className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.travelKm || '5,000'}<span>km</span></div>
            <div className="bento-subtitle">Explored This Year</div>
          </div>

          {/* Learning & Courses */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiBookOpen className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.coursesCompleted || '10+'}</div>
            <div className="bento-subtitle">Courses Completed</div>
          </div>

          {/* Tech Stacks */}
          <div className="bento-card bento-counter">
            <div className="bento-header">
              <FiTerminal className="bento-icon" />
            </div>
            <div className="bento-number">{sanityData?.stacksLearned || '10+'}</div>
            <div className="bento-subtitle">Stacks Learned</div>
          </div>

          {/* Achievements */}
          <div className="bento-card bento-status" style={{ gridColumn: 'span 4' }}>
            <FiAward className="bento-icon" />
            <div className="bento-title" style={{ marginBottom: '0.5rem' }}>Achievements</div>
            <div className="status-text">{sanityData?.primaryAchievement || 'State Level Qualifier — YIP 2025'}</div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default StatsBento;
