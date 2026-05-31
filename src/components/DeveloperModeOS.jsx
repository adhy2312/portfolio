import React, { useState, useEffect, useRef } from 'react';
import './DeveloperModeOS.css';
import ns from '../core/NervousSystem';
import gsap from 'gsap';

// Upgraded Achievement Data with Rarity Tiers
const INITIAL_ACHIEVEMENTS = [
  { id: 'curious', title: 'Curious', desc: 'Discovered the hidden meta-layer.', icon: '🕵️', unlocked: true, rarity: 'Common', color: '#a8a8a8' },
  { id: 'architect', title: 'Architect', desc: 'Read the Architecture documentation.', icon: '🏛️', unlocked: false, rarity: 'Common', color: '#a8a8a8' },
  { id: 'hacker', title: 'Hacker', desc: 'Executed a terminal command.', icon: '💻', unlocked: false, rarity: 'Rare', color: '#4fc3f7' },
  { id: 'gamer', title: 'Gamer', desc: 'Launched a mini-game via terminal.', icon: '🎮', unlocked: false, rarity: 'Rare', color: '#4fc3f7' },
  { id: 'philosopher', title: 'Philosopher', desc: 'Found the hidden philosophy files.', icon: '🧠', unlocked: false, rarity: 'Legendary', color: '#ffb300' },
  { id: 'overloaded', title: 'Overloaded', desc: 'Pushed the system to critical stress levels.', icon: '⚡', unlocked: false, rarity: 'Legendary', color: '#ffb300' },
  { id: 'sudoer', title: 'Root Access', desc: 'Attempted to use sudo privileges.', icon: '🔑', unlocked: false, rarity: 'Mythic', color: '#e040fb' },
  { id: 'void', title: 'The Void', desc: 'Erased the terminal history.', icon: '🕳️', unlocked: false, rarity: 'Mythic', color: '#e040fb' },
  { id: 'matrix', title: 'Neo', desc: 'Triggered the digital rain simulation.', icon: '💊', unlocked: false, rarity: 'Legendary', color: '#00e676' },
  { id: 'insomniac', title: 'Insomniac', desc: 'Accessed the core during late-night hours.', icon: '🦉', unlocked: false, rarity: 'Rare', color: '#7986cb' },
];

export default function DeveloperModeOS({ onClose, onLaunchGame }) {
  const [activeTab, setActiveTab] = useState('Terminal');
  const [metrics, setMetrics] = useState({ fps: 60, fatigue: 0, memory: 'N/A' });
  const [achievements, setAchievements] = useState(INITIAL_ACHIEVEMENTS);
  const overlayRef = useRef(null);

  // Terminal State
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'AdhyOS v4.5.0 initialized.' },
    { type: 'system', text: 'Type "help" for a list of commands.' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const endOfHistoryRef = useRef(null);

  useEffect(() => {
    // Premium Glassmorphic Entrance Animation (VisionOS style)
    gsap.fromTo(overlayRef.current,
      { opacity: 0, backdropFilter: 'blur(0px)', scale: 1.05 },
      { opacity: 1, backdropFilter: 'blur(40px)', scale: 1, duration: 0.8, ease: 'power3.out' }
    );
    
    // Animate children staggering in
    gsap.fromTo('.dev-os-sidebar, .dev-os-content',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    );

    // Performance Polling
    const interval = setInterval(() => {
      let memoryUsage = 'N/A';
      if (window.performance && window.performance.memory) {
        const mem = window.performance.memory;
        memoryUsage = (mem.usedJSHeapSize / 1048576).toFixed(1) + ' MB';
      }
      setMetrics({
        fps: ns.fps,
        fatigue: ns.fatigue,
        memory: memoryUsage
      });

      // Secret unlock: Overloaded
      if (ns.fatigue > 90) {
        unlockAchievement('overloaded');
      }

      // Secret unlock: Insomniac (12 AM to 5 AM)
      const hour = new Date().getHours();
      if (hour >= 0 && hour <= 5) {
        unlockAchievement('insomniac');
      }

    }, 500);

    // Load achievements from localStorage (Merge state to preserve new fields like rarity)
    const saved = localStorage.getItem('adhy_achievements');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setAchievements(INITIAL_ACHIEVEMENTS.map(ach => {
          const savedAch = parsed.find(p => p.id === ach.id);
          return savedAch ? { ...ach, unlocked: savedAch.unlocked } : ach;
        }));
      } catch(e){}
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (endOfHistoryRef.current) {
      endOfHistoryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory]);

  // Tab change handler (unlocks 'architect' if they click Architecture)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Architecture') {
      unlockAchievement('architect');
    }
  };

  const unlockAchievement = (id) => {
    setAchievements(prev => {
      const next = prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
      localStorage.setItem('adhy_achievements', JSON.stringify(next));
      return next;
    });
  };

  const handleClose = () => {
    gsap.to(overlayRef.current, {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      duration: 0.3,
      onComplete: onClose
    });
  };

  const executeCommand = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    const newHistory = [...terminalHistory, { type: 'command', text: `user@adhy:~$ ${cmd}` }];
    unlockAchievement('hacker');

    let response = null;

    if (trimmed === 'help') {
      response = 'Available commands: ls, cat <file>, clear, play <game>, whoami, exit';
    } else if (trimmed === 'ls') {
      response = 'notes/   secrets/   games/';
    } else if (trimmed === 'matrix') {
      response = 'Wake up, Neo...';
      unlockAchievement('matrix');
      // Dispatch event to trigger the visual matrix effect globally if it exists, otherwise just give the badge.
      window.dispatchEvent(new CustomEvent('trigger-egg', { detail: 'matrix' }));
      setTimeout(handleClose, 1000);
    } else if (trimmed.startsWith('sudo ')) {
      response = 'nice try. this incident will be reported.';
      unlockAchievement('sudoer');
    } else if (trimmed.startsWith('cat ')) {
      const file = trimmed.split(' ')[1];
      if (file === 'notes/photography.txt') response = 'Photography is more about who is behind the lens. And sometimes, AI.';
      else if (file === 'secrets/philosophy.txt') {
        response = '"Features break. Architectures evolve."';
        unlockAchievement('philosopher');
      }
      else response = `cat: ${file}: No such file or directory`;
    } else if (trimmed === 'clear') {
      setTerminalHistory([]);
      setInputVal('');
      unlockAchievement('void');
      return;
    } else if (trimmed.startsWith('play ')) {
      const game = trimmed.split(' ')[1];
      if (game === 'tictactoe' || game === 'zip' || game === 'snake') {
        response = `Launching ${game}...`;
        unlockAchievement('gamer');
        setTimeout(() => {
          onLaunchGame(game);
          handleClose();
        }, 800);
      } else {
        response = `Game '${game}' not found. Try 'tictactoe', 'zip', or 'snake'.`;
      }
    } else if (trimmed === 'whoami') {
      response = 'A curious explorer.';
    } else if (trimmed === 'exit') {
      handleClose();
      return;
    } else {
      response = `Command not found: ${trimmed}. Type 'help' for available commands.`;
    }

    if (response) {
      newHistory.push({ type: response.includes('Command not found') || response.includes('No such file') ? 'error' : 'output', text: response });
    }

    setTerminalHistory(newHistory);
    setInputVal('');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Terminal':
        return (
          <div className="dev-terminal">
            <div className="dev-terminal-history">
              {terminalHistory.map((line, i) => (
                <div key={i} className={`terminal-line ${line.type}`}>{line.text}</div>
              ))}
              <div ref={endOfHistoryRef} />
            </div>
            <form className="dev-terminal-input-row" onSubmit={(e) => { e.preventDefault(); executeCommand(inputVal); }}>
              <span className="terminal-prompt">user@adhy:~$</span>
              <input 
                type="text" 
                value={inputVal} 
                onChange={(e) => setInputVal(e.target.value)} 
                autoFocus 
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          </div>
        );
      case 'Performance':
        return (
          <div className="perf-tab-wrapper">
            <h3 className="dev-section-title">SYSTEM METRICS</h3>
            <div className="perf-grid">
              <div className="perf-card">
                <span className="perf-card-label">SYS.FPS</span>
                <span className={`perf-card-value ${metrics.fps >= 50 ? 'good' : metrics.fps >= 30 ? 'warn' : 'bad'}`}>{metrics.fps}</span>
              </div>
              <div className="perf-card">
                <span className="perf-card-label">SYS.STRESS (Fatigue)</span>
                <span className={`perf-card-value ${metrics.fatigue < 50 ? 'good' : 'warn'}`}>{Math.round(metrics.fatigue)}%</span>
              </div>
              <div className="perf-card">
                <span className="perf-card-label">MEMORY</span>
                <span className="perf-card-value">{metrics.memory}</span>
              </div>
              <div className="perf-card">
                <span className="perf-card-label">ACTIVE TIMELINES</span>
                <span className="perf-card-value">{gsap.globalTimeline.getChildren().length}</span>
              </div>
            </div>

            <h3 className="dev-section-title" style={{ marginTop: '3rem' }}>LIGHTHOUSE AUDIT</h3>
            <div className="lighthouse-grid">
              {[
                { label: 'Performance', score: 98, color: '#0ff' },
                { label: 'Accessibility', score: 100, color: '#0ff' },
                { label: 'Best Practices', score: 100, color: '#0ff' },
                { label: 'SEO', score: 100, color: '#0ff' }
              ].map((lh, i) => (
                <div key={i} className="lighthouse-meter">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path className="circle"
                      strokeDasharray={`${lh.score}, 100`}
                      style={{ stroke: lh.color }}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.85" className="percentage" fill="#fff">{lh.score}</text>
                  </svg>
                  <span className="lighthouse-label">{lh.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Achievements':
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        const totalCount = achievements.length;
        return (
          <div className="dev-achievements-container">
            <div className="ach-header-row">
              <h3 className="dev-section-title">ACHIEVEMENTS</h3>
              <div className="ach-progress">
                <span className="ach-progress-text">{unlockedCount} / {totalCount} Unlocked</span>
                <div className="ach-progress-bar">
                  <div className="ach-progress-fill" style={{ width: `${(unlockedCount / totalCount) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="achievements-grid">
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                  style={{ '--rarity-color': ach.unlocked ? ach.color : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="ach-card-bg-glow" />
                  <div className="ach-icon-wrapper">
                    <span className="ach-icon">{ach.unlocked ? ach.icon : '🔒'}</span>
                  </div>
                  <div className="ach-content">
                    <div className="ach-title-row">
                      <h4 className="ach-title">{ach.unlocked ? ach.title : 'Classified'}</h4>
                      <span className={`ach-rarity ${ach.unlocked ? ach.rarity.toLowerCase() : ''}`}>{ach.rarity}</span>
                    </div>
                    <p className="ach-desc">{ach.unlocked ? ach.desc : 'Condition unknown. Keep exploring the system.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Architecture':
        return (
          <div className="dev-markdown">
            <h3 className="dev-section-title">ARCHITECTURE EXPLORER</h3>
            <p>Welcome to the source of truth.</p>
            <h3>Core Modules</h3>
            <ul>
              <li><strong>NervousSystem.js</strong>: A centralized singleton managing RAF polling and emotional state (fatigue, curiosity) to avoid React re-rendering latency.</li>
              <li><strong>DigitalSoul.js</strong>: Render layer mapping NervousSystem values to visual attributes (red dot).</li>
              <li><strong>DeveloperModeOS.jsx</strong>: You are here. The meta-layer.</li>
            </ul>
            <h3>Performance Philosophy</h3>
            <p>Zero overhead when inactive. Lazy-loaded games via suspense boundaries. Hardware-accelerated GSAP manipulation directly to the DOM.</p>
          </div>
        );
      case 'Stats':
        return (
          <div className="dev-markdown">
            <h3 className="dev-section-title">DEVELOPER STATS</h3>
            <ul>
              <li><strong>Projects Built:</strong> 24+</li>
              <li><strong>Lines of Code:</strong> 150,000+</li>
              <li><strong>Coffee Consumed:</strong> Error: Buffer Overflow</li>
              <li><strong>Tech Stack:</strong> React 18, GSAP, Sanity CMS, Vite</li>
            </ul>
          </div>
        );
      case 'History':
        return (
          <div className="dev-markdown">
            <h3 className="dev-section-title">VERSION HISTORY</h3>
            <ul>
              <li><strong>v4.5.0:</strong> Integrated Nervous System OS and Developer Mode meta-layer. Glassmorphic UI overhaul.</li>
              <li><strong>v4.0.0:</strong> Major architectural rewrite. Transitioned from static components to GSAP scroll-triggered cinematic experiences.</li>
              <li><strong>v3.2.0:</strong> Introduced dynamic color themes and Site Mode Switcher.</li>
              <li><strong>v2.0.0:</strong> Initial migration to React from vanilla JS. Added Sanity headless CMS integration.</li>
              <li><strong>v1.0.0:</strong> The beginning. Basic HTML/CSS static portfolio.</li>
            </ul>
          </div>
        );
      case 'System':
        return (
          <div className="dev-markdown">
            <h3 className="dev-section-title">SYSTEM SPECS</h3>
            <p>Underlying technology stack powering this digital experience.</p>
            <ul>
              <li><strong>Core Engine:</strong> React 18, Custom Hook architecture (useHybridMotion, useNervousSystem).</li>
              <li><strong>Animation Physics:</strong> GSAP (GreenSock) for hardware-accelerated 3D DOM manipulation and timelines.</li>
              <li><strong>Smooth Scrolling:</strong> Lenis (Studio Freight) for buttery inertial scrolling.</li>
              <li><strong>Data Layer:</strong> Sanity.io Headless CMS for real-time content delivery.</li>
              <li><strong>Bundler:</strong> Vite.</li>
              <li><strong>Styling:</strong> Vanilla CSS with heavy CSS Variables for dynamic mode switching. No Tailwind.</li>
            </ul>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="dev-os-overlay hud-active" ref={overlayRef}>
      
      {/* ── HUD Global Overlays ── */}
      <div className="hud-scanline" />
      <div className="hud-vignette" />
      <div className="hud-grid" />
      
      {/* HUD Edge Data */}
      <div className="hud-edge-data top-left">SYS.VER_4.5.0 // CORE_ACTIVE</div>
      <div className="hud-edge-data top-right">
        <span className="hud-live-dot" /> TELEMETRY_LINK_ESTABLISHED
      </div>
      <div className="hud-edge-data bottom-left">LAT: 34.0522 // LNG: -118.2437</div>
      <div className="hud-edge-data bottom-right">MEM_FRAG: {metrics.memory}</div>

      <aside className="dev-os-sidebar hud-panel">
        <div className="hud-corner top-left" />
        <div className="hud-corner bottom-left" />
        <div className="hud-corner bottom-right" />
        <div className="hud-corner top-right" />
        
        <div className="dev-os-brand">
          <h2>DEV_OS v4.5</h2>
          <p>NervousSystem Engine</p>
        </div>
        <nav className="dev-os-nav">
          {['Terminal', 'Performance', 'Achievements', 'Architecture', 'Stats', 'System', 'History'].map(tab => (
            <button 
              key={tab} 
              className={`dev-os-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              [{tab.toUpperCase()}]
            </button>
          ))}
          {/* Close button inside sidebar for mobile accessibility */}
          <button className="dev-os-close-btn" onClick={handleClose}>TERMINATE SESSION</button>
        </nav>
      </aside>

      <main className="dev-os-content hud-panel">
        <div className="hud-corner top-left" />
        <div className="hud-corner bottom-left" />
        <div className="hud-corner bottom-right" />
        <div className="hud-corner top-right" />
        
        {renderContent()}
      </main>
    </div>
  );
}
