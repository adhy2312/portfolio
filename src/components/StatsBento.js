import React, { useEffect, useRef, useState } from 'react';
import './StatsBento.css';
import { client } from '../sanity';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Matter from 'matter-js';
import ns from '../core/NervousSystem';
import { FiGithub, FiCamera, FiFigma, FiMap, FiAward, FiBookOpen, FiTerminal, FiZap } from 'react-icons/fi';
import { GitHubCalendar } from 'react-github-calendar';

gsap.registerPlugin(ScrollTrigger);


const StatsBento = () => {
  const sectionRef = useRef(null);
  const [sanityData, setSanityData] = useState(null);
  const [liveGithubData, setLiveGithubData] = useState({ repos: null, contributions: null });
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const engineRef = useRef(null);
  const bodiesRef = useRef([]);

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
  }, [gravityEnabled]); // Re-run if gravity disables, but generally we just run once.

  // --- GRAVITY PHYSICS ENGINE ---
  useEffect(() => {
    if (!gravityEnabled || !sectionRef.current) return;

    const { Engine, World, Bodies, Mouse, MouseConstraint } = Matter;
    const engine = Engine.create();
    engineRef.current = engine;
    
    // Default gravity
    engine.world.gravity.y = 1;
    engine.world.gravity.x = 0;

    const section = sectionRef.current;
    const parentRect = section.getBoundingClientRect();
    const cards = Array.from(section.querySelectorAll('.bento-card'));
    
    // We must fix height of the grid container so it doesn't collapse when children become absolute
    const gridContainer = section.querySelector('.stats-bento-grid');
    gridContainer.style.height = `${gridContainer.offsetHeight}px`;

    const newBodies = [];

    cards.forEach((card) => {
      // Get position before absolute
      const rect = card.getBoundingClientRect();
      const localX = rect.left - parentRect.left;
      const localY = rect.top - parentRect.top;
      
      // Lock dimensions and position
      card.style.width = `${rect.width}px`;
      card.style.height = `${rect.height}px`;
      card.style.position = 'absolute';
      card.style.left = '0px';
      card.style.top = '0px';
      card.style.margin = '0px';
      card.style.transition = 'none'; // Disable CSS transitions for physics
      card.style.zIndex = '50';

      const body = Bodies.rectangle(
        localX + rect.width / 2,
        localY + rect.height / 2,
        rect.width,
        rect.height,
        {
          restitution: 0.6, // Bounciness
          friction: 0.1,
          frictionAir: 0.02,
          density: 0.05
        }
      );
      
      newBodies.push({ element: card, body, width: rect.width, height: rect.height });
      World.add(engine.world, body);
    });

    bodiesRef.current = newBodies;

    // Add boundaries so they don't fall off the screen
    const wallOptions = { isStatic: true, restitution: 0.4 };
    const w = parentRect.width;
    const h = parentRect.height;
    const thickness = 100;
    
    World.add(engine.world, [
      Bodies.rectangle(w/2, -thickness/2, w + thickness*2, thickness, wallOptions), // Top
      Bodies.rectangle(w/2, h + thickness/2, w + thickness*2, thickness, wallOptions), // Bottom
      Bodies.rectangle(-thickness/2, h/2, thickness, h + thickness*2, wallOptions), // Left
      Bodies.rectangle(w + thickness/2, h/2, thickness, h + thickness*2, wallOptions), // Right
    ]);

    // Mouse Interaction
    const mouse = Mouse.create(section);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    // Device Orientation Hook
    const handleOrientation = (e) => {
      if (!engineRef.current) return;
      // Gamma is left-to-right (-90 to 90). Beta is front-to-back (-180 to 180).
      const gravity = engineRef.current.world.gravity;
      gravity.x = Math.max(-1, Math.min(1, (e.gamma || 0) / 45));
      gravity.y = Math.max(-1, Math.min(1, (e.beta || 0) / 45));
    };
    window.addEventListener('deviceorientation', handleOrientation);

    // NervousSystem RAF hook
    const tick = (time) => {
      // Step the physics engine (fixed timestep)
      Engine.update(engine, 1000 / 60);

      // Sync DOM elements
      bodiesRef.current.forEach(({ element, body, width, height }) => {
        element.style.transform = `translate3d(${body.position.x - width / 2}px, ${body.position.y - height / 2}px, 0) rotate(${body.angle}rad)`;
      });
    };

    ns.register('bento-gravity', tick, { priority: 'NORMAL', cooldown: 0 });

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      ns.unregister('bento-gravity');
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, [gravityEnabled]);

  const toggleGravity = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setGravityEnabled(true);
        } else {
          alert('Gyroscope permission denied. Mouse drag is still enabled!');
          setGravityEnabled(true);
        }
      } catch (err) {
        console.error(err);
        setGravityEnabled(true);
      }
    } else {
      // Non-iOS 13+ devices or desktop
      setGravityEnabled(true);
    }
  };

  return (
    <section className="stats-bento-section" ref={sectionRef} style={{ position: 'relative' }}>
      <div className="container">
        
        {/* GRAVITY TOGGLE */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button 
            className={`retro-btn ${gravityEnabled ? 'active' : ''}`}
            onClick={toggleGravity}
            style={{ fontSize: '0.8rem', padding: '8px 16px', zIndex: 100, position: 'relative' }}
          >
            {gravityEnabled ? '[ GRAVITY: OFF ]' : 'ENABLE GRAVITY'}
          </button>
        </div>

        <div className="stats-bento-grid" style={{ position: 'relative' }}>
          
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
