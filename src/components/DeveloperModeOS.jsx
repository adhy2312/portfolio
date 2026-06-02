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

const FrequencyCanvas = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      baseRadius: Math.random() * 3 + 1
    }));

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const pulse = Math.abs(ns.state.heartbeatValue) || 0.1;
      const stress = (ns.fatigue || 0) / 100;
      
      particles.forEach(p => {
        p.x += p.vx * (1 + stress * 5);
        p.y += p.vy * (1 + stress * 5);
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.baseRadius * (1 + pulse * 2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, ${255 - stress * 200}, 255, ${0.5 + pulse * 0.5})`;
        ctx.fill();
        
        if (stress > 0.5 && Math.random() > 0.9) {
          ctx.strokeStyle = `rgba(255, 0, 0, ${stress})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (Math.random() - 0.5) * 50, p.y + (Math.random() - 0.5) * 50);
          ctx.stroke();
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

const ArchitectureConstellation = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const nodes = [
      { id: 'App', x: 0.5, y: 0.2, color: '#0ff' },
      { id: 'NervousSystem', x: 0.5, y: 0.5, color: '#e040fb' },
      { id: 'DigitalSoul', x: 0.3, y: 0.5, color: '#ffb300' },
      { id: 'DeveloperModeOS', x: 0.7, y: 0.5, color: '#00e676' },
      { id: 'Hero', x: 0.2, y: 0.8, color: '#fff' },
      { id: 'Skills', x: 0.5, y: 0.8, color: '#fff' },
      { id: 'Projects', x: 0.8, y: 0.8, color: '#fff' }
    ];

    const edges = [
      ['App', 'NervousSystem'],
      ['App', 'DigitalSoul'],
      ['App', 'DeveloperModeOS'],
      ['NervousSystem', 'DigitalSoul'],
      ['NervousSystem', 'DeveloperModeOS'],
      ['App', 'Hero'],
      ['App', 'Skills'],
      ['App', 'Projects']
    ];

    let time = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let mouse = { x: -1000, y: -1000 };
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Draw edges
      ctx.lineWidth = 1;
      edges.forEach(([idA, idB]) => {
        const a = nodes.find(n => n.id === idA);
        const b = nodes.find(n => n.id === idB);
        if (a && b) {
          const ax = a.x * canvas.width + Math.sin(time + a.y * 10) * 10;
          const ay = a.y * canvas.height + Math.cos(time + a.x * 10) * 10;
          const bx = b.x * canvas.width + Math.sin(time + b.y * 10) * 10;
          const by = b.y * canvas.height + Math.cos(time + b.x * 10) * 10;
          
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const nx = n.x * canvas.width + Math.sin(time + n.y * 10) * 10;
        const ny = n.y * canvas.height + Math.cos(time + n.x * 10) * 10;
        
        const dist = Math.hypot(nx - mouse.x, ny - mouse.y);
        const isHover = dist < 40;

        ctx.shadowBlur = 15;
        ctx.shadowColor = n.color;
        ctx.beginPath();
        ctx.arc(nx, ny, isHover ? 8 : 4, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        if (isHover) {
          ctx.fillStyle = '#fff';
          ctx.font = '14px "Fira Code", monospace';
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#000';
          ctx.fillText(n.id, nx + 15, ny + 5);
        }
      });
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />;
};

const SystemObservatory = () => {
  const canvasRef = useRef(null);
  const [domNodes, setDomNodes] = useState(0);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    // Live metric polling
    const domInterval = setInterval(() => {
      // Throttle heavy DOM counting to 5 seconds to prevent performance regressions
      setDomNodes(document.getElementsByTagName('*').length);
    }, 5000);
    
    const timeInterval = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(domInterval);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) * 0.8;
      
      time += 0.02;

      // Draw radar sweep
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time);
      
      const gradient = ctx.createConicGradient(0, 0, 0);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(0.8, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.5)');
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Radar line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, 0);
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw grid circles
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      [0.3, 0.6, 1].forEach(scale => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw active data points
      const points = [
        { x: Math.sin(time * 0.5) * 0.5, y: Math.cos(time * 0.3) * 0.5 },
        { x: Math.sin(time * -0.7) * 0.8, y: Math.cos(time * 0.8) * 0.8 },
        { x: Math.sin(time * 1.2) * 0.4, y: Math.cos(time * -1.5) * 0.4 }
      ];

      points.forEach(p => {
        const px = cx + p.x * radius;
        const py = cy + p.y * radius;
        
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#0ff';
        ctx.fill();
        
        // ping ripple
        ctx.beginPath();
        ctx.arc(px, py, 10 + Math.sin(time * 5) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 - Math.sin(time * 5) * 0.5})`;
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="dev-observatory-wrapper" style={{ display: 'flex', gap: '2rem', height: '100%' }}>
      <div className="obs-radar-container" style={{ flex: 1, position: 'relative', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, color: '#0ff', fontFamily: 'monospace', fontSize: '0.8rem' }}>SYS.RADAR_ACTIVE</div>
      </div>
      
      <div className="obs-metrics-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="obs-metric-card" style={{ padding: '1rem', background: 'rgba(0, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.1)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>TOTAL DOM NODES</div>
          <div style={{ fontSize: '1.5rem', color: '#0ff', fontFamily: 'monospace' }}>{domNodes}</div>
        </div>
        
        <div className="obs-metric-card" style={{ padding: '1rem', background: 'rgba(0, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.1)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>SESSION UPTIME</div>
          <div style={{ fontSize: '1.5rem', color: '#00e676', fontFamily: 'monospace' }}>{Math.floor(uptime / 60)}m {uptime % 60}s</div>
        </div>
        
        <div className="obs-metric-card" style={{ padding: '1rem', background: 'rgba(0, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.1)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>DATA STREAM</div>
          <div style={{ fontSize: '0.9rem', color: '#e040fb', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>TX: {Math.floor(Math.random() * 1000)} kb/s</span>
            <span>RX: {Math.floor(Math.random() * 5000)} kb/s</span>
            <span>PING: {Math.floor(12 + Math.random() * 5)}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DeveloperModeOS({ onClose, onLaunchGame }) {
  const [osState, setOsState] = useState({
    cursorMode: 'hybrid',
    crt: true,
    scanlines: true,
    fps: true,
    audio: true,
    glitches: true,
    soulEnabled: true
  });

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

  // Soul Override State
  const [soulConfig, setSoulConfig] = useState({ speed: 3, scale: 1, color: '#ffffff' });

  // Corrupted Sectors State
  const [corruptions, setCorruptions] = useState([]);

  const handleSoulConfigChange = (key, value) => {
    setSoulConfig(prev => ({ ...prev, [key]: value }));
    if (key === 'color') document.documentElement.style.setProperty('--soul-core-override', value);
    if (key === 'speed') document.documentElement.style.setProperty('--soul-orbit-speed', `${value}s`);
    if (key === 'scale') document.documentElement.style.setProperty('--soul-aura-scale', value);
  };

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

    // Spawn Corrupted Sectors randomly
    const glitchInterval = setInterval(() => {
      setCorruptions(prev => {
        if (Math.random() > 0.8 && prev.length < 2) {
          const secrets = [
            "DECRYPTED: The original design used a pure white theme. It was too bright.",
            "DECRYPTED: There are exactly 3 ways to crash this terminal.",
            "DECRYPTED: The Digital Soul was almost named 'Core Entity'.",
            "DECRYPTED: You are being tracked by the Markov Chain."
          ];
          return [...prev, {
            id: Date.now(),
            top: 10 + Math.random() * 80,
            left: 10 + Math.random() * 80,
            secret: secrets[Math.floor(Math.random() * secrets.length)]
          }];
        }
        // Also randomly despawn them
        if (Math.random() > 0.6 && prev.length > 0) {
          return prev.slice(1);
        }
        return prev;
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(glitchInterval);
    };
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

  const handleCorruptionClick = (id, secret) => {
    setCorruptions(prev => prev.filter(c => c.id !== id));
    setTerminalHistory(prev => [...prev, 
      { type: 'system', text: '>>> INTERCEPTING CORRUPTED SECTOR...' },
      { type: 'output', text: secret }
    ]);
    setActiveTab('Terminal');
  };

  const executeCommand = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    const newHistory = [...terminalHistory, { type: 'command', text: `user@adhy:~$ ${cmd}` }];
    unlockAchievement('hacker');

    let response = null;

    if (trimmed === 'help') {
      response = 'Available commands: ls, cat <file>, clear, play <game>, whoami, fork bomb, killall, exit';
    } else if (trimmed === 'fork bomb') {
      response = 'CRITICAL ERROR: MEMORY LEAK DETECTED. SYSTEM COMPROMISED.';
      const elements = document.querySelectorAll('.dev-os-content *, .dev-os-sidebar *');
      gsap.to(elements, {
        y: '100vh',
        rotation: 'random(-90, 90)',
        x: 'random(-100, 100)',
        duration: 3,
        stagger: 0.02,
        ease: 'power2.in',
        onComplete: () => {
          unlockAchievement('void');
        }
      });
    } else if (trimmed === 'killall') {
      response = 'Processes terminated. Memory cleared. Restoring UI...';
      const elements = document.querySelectorAll('.dev-os-content *, .dev-os-sidebar *');
      gsap.killTweensOf(elements);
      gsap.to(elements, {
        y: 0,
        x: 0,
        rotation: 0,
        duration: 0.5,
        stagger: 0.01,
        ease: 'power3.out'
      });
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
      case '[SOUL_LINK]':
        return (
          <div className="dev-soul-link">
            <h3 className="dev-section-title">SOUL OVERRIDE PROTOCOL</h3>
            <p className="dev-desc" style={{marginBottom: '2rem', color: 'rgba(255,255,255,0.6)'}}>Direct hardware link established. Manipulate the emotional rendering engine.</p>
            
            <div className="soul-controls" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="soul-control-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '8px' }}>
                <label style={{ fontFamily: 'monospace', color: '#0ff', margin: 0 }}>SYS.SOUL_VISIBILITY</label>
                <input 
                  type="checkbox" 
                  checked={osState.soulEnabled} 
                  onChange={(e) => setOsState(prev => ({ ...prev, soulEnabled: e.target.checked }))} 
                  style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                />
              </div>

              <div className="soul-control-group">
                <label style={{ display: 'block', marginBottom: '8px', fontFamily: 'monospace', color: '#0ff' }}>CORE HEX_COLOR</label>
                <div className="color-picker-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="color" value={soulConfig.color} onChange={(e) => handleSoulConfigChange('color', e.target.value)} style={{ width: '50px', height: '30px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
                  <span className="hex-display" style={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>{soulConfig.color.toUpperCase()}</span>
                </div>
              </div>

              <div className="soul-control-group">
                <label style={{ display: 'block', marginBottom: '8px', fontFamily: 'monospace', color: '#0ff' }}>ORBIT_SPEED: {soulConfig.speed}s</label>
                <input type="range" min="0.5" max="10" step="0.1" value={soulConfig.speed} onChange={(e) => handleSoulConfigChange('speed', e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div className="soul-control-group">
                <label style={{ display: 'block', marginBottom: '8px', fontFamily: 'monospace', color: '#0ff' }}>AURA_SCALE: {soulConfig.scale}x</label>
                <input type="range" min="0.5" max="5" step="0.1" value={soulConfig.scale} onChange={(e) => handleSoulConfigChange('scale', e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />
              </div>
            </div>
          </div>
        );
      case '[FREQUENCY]':
        return (
          <div className="dev-frequency-tab" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="dev-section-title">FREQUENCY MATRIX</h3>
            <p className="dev-desc" style={{marginBottom: '1rem', color: 'rgba(255,255,255,0.6)'}}>Generative art reacting to realtime heartbeat and system fatigue.</p>
            <div style={{ flex: 1, position: 'relative', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
               <FrequencyCanvas />
            </div>
          </div>
        );
      case '[OBSERVATORY]':
        return (
          <div className="dev-observatory-tab" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="dev-section-title">SYSTEM OBSERVATORY</h3>
            <p className="dev-desc" style={{marginBottom: '1rem', color: 'rgba(255,255,255,0.6)'}}>Live telemetry array and spatial radar.</p>
            <div style={{ flex: 1 }}>
               <SystemObservatory />
            </div>
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
          <div className="dev-markdown" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '100%' }}>
            <h3 className="dev-section-title">ARCHITECTURE EXPLORER</h3>
            <p className="dev-desc" style={{ marginBottom: '1rem' }}>Interactive map of the core NervousSystem architecture. Hover over nodes to identify them.</p>
            <div style={{ flex: 1, position: 'relative', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
               <ArchitectureConstellation />
            </div>
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
      case '[ML_CORE]':
        const persona = document.documentElement.getAttribute('data-persona') || 'Unidentified';
        return (
          <div className="perf-tab-wrapper">
             <h3 className="dev-section-title">PREDICTIVE MARKOV MODEL</h3>
             <p className="dev-desc" style={{marginBottom: '1rem'}}>Machine Learning engine analyzing scroll velocity and section dwell time to adapt the OS to your persona.</p>
             <div className="perf-grid">
               <div className="perf-card">
                 <span className="perf-card-label">CLASSIFIED PERSONA</span>
                 <span className="perf-card-value" style={{color: persona !== 'Unidentified' ? '#e040fb' : 'rgba(255,255,255,0.3)'}}>{persona}</span>
               </div>
               <div className="perf-card">
                 <span className="perf-card-label">MARKOV STATE</span>
                 <span className="perf-card-value" style={{color: '#00e676'}}>Active</span>
               </div>
               <div className="perf-card">
                 <span className="perf-card-label">PRE-FETCHING</span>
                 <span className="perf-card-value">Enabled</span>
               </div>
             </div>
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
          {['Terminal', '[SOUL_LINK]', '[FREQUENCY]', '[OBSERVATORY]', '[ML_CORE]', 'Performance', 'Achievements', 'Architecture', 'Stats', 'System', 'History'].map(tab => (
            <button 
              key={tab} 
              className={`dev-os-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab.startsWith('[') ? tab : `[${tab.toUpperCase()}]`}
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

      {/* Corrupted Sectors Layer */}
      {corruptions.map(c => (
        <div 
          key={c.id} 
          className="hud-corrupted-sector" 
          style={{ top: `${c.top}%`, left: `${c.left}%` }}
          onClick={() => handleCorruptionClick(c.id, c.secret)}
          title="Decrypt Sector"
        >
          [ERR_DATA]
        </div>
      ))}
    </div>
  );
}
