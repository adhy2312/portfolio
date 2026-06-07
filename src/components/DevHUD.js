import React, { useState, useEffect, useRef } from 'react';
import './DevHUD.css';
import ns from '../core/NervousSystem';
import gsap from 'gsap';

export default function DevHUD({ onClose, embedded = false }) {
  const [metrics, setMetrics] = useState({
    fps: 60,
    fatigue: 0,
    tier: 3,
    emotion: 'observing',
    scrollVel: 0,
    gravX: 0,
    gravY: 0,
    intent: 'None'
  });
  
  const [logs, setLogs] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    // Premium Entrance Animation
    if (!embedded) {
      gsap.fromTo(containerRef.current,
        { y: 50, scale: 0.95, opacity: 0, rotationX: 10 },
        { y: 0, scale: 1, opacity: 1, rotationX: 0, duration: 0.6, ease: 'power3.out' }
      );
    }

    // RAF Loop to fetch stats directly from NervousSystem without triggering React renders constantly
    // We only update React state a few times a second to keep the HUD itself from lagging
    let lastUpdate = 0;
    const hudTick = (time) => {
      if (time - lastUpdate > 100) { // Update 10 times a sec
        setMetrics({
          fps: ns.fps || 60,
          fatigue: Math.round(ns.fatigue) || 0,
          tier: ns.performanceTier || 3,
          emotion: ns.soul?.emotion || 'Unknown',
          scrollVel: Math.round(ns.scrollPos || 0), // Use scroll pos for now, or velocity if available
          gravX: (ns.gravity?.x || 0).toFixed(2),
          gravY: (ns.gravity?.y || 0).toFixed(2),
          intent: ns._intentFired ? 'FAST SCROLL DETECTED' : 'IDLE'
        });
        lastUpdate = time;
      }
    };
    ns.register('DevHUD', hudTick, { priority: 'CRITICAL' });

    // Listen for intent logs
    const intentSub = ns.subscribe('INTENT_FAST_MOVEMENT', (data) => {
      setLogs(prev => [`[INTENT] Rapid scroll ${data.direction} predicted. Prefetching...`, ...prev].slice(0, 5));
    });
    
    const overloadSub = ns.subscribe('SYSTEM_OVERLOAD', () => {
      setLogs(prev => [`[WARN] Hardware limits reached. Throttling visual fx...`, ...prev].slice(0, 5));
    });

    return () => {
      ns.unregister('DevHUD');
      intentSub();
      overloadSub();
    };
  }, []);

  const handleClose = () => {
    if (embedded) return;
    gsap.to(containerRef.current, {
      y: -50, scale: 0.95, opacity: 0, rotationX: -10, duration: 0.4, ease: 'power2.in',
      onComplete: onClose
    });
  };

  return (
    <div className={embedded ? "" : "dev-hud-overlay"} style={embedded ? { height: '100%', width: '100%' } : {}}>
      <div 
        className="dev-hud-container" 
        ref={containerRef} 
        style={embedded ? { 
          maxWidth: '100%', minHeight: '100%', padding: '1.5rem', 
          border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '8px', 
          boxShadow: 'none', background: 'transparent' 
        } : {}}
      >
        <div className="hud-scanlines" />
        
        <div className="hud-header">
          <div className="hud-title">
            <div className="hud-blinker" />
            SPACESHIP_TELEMETRY // DEV_HUD
          </div>
          {!embedded && <button className="hud-close" onClick={handleClose}>×</button>}
        </div>

        <div className="hud-grid">
          {/* Main Stats */}
          <div className="hud-box">
            <div className="hud-box-title">Core Frame Rate</div>
            <div className={`hud-value ${metrics.fps < 30 ? 'critical' : metrics.fps < 50 ? 'warning' : ''}`}>
              {metrics.fps} <span className="hud-unit">FPS</span>
            </div>
          </div>

          <div className="hud-box">
            <div className="hud-box-title">System Fatigue</div>
            <div className={`hud-value ${metrics.fatigue > 80 ? 'critical' : metrics.fatigue > 50 ? 'warning' : ''}`}>
              {metrics.fatigue} <span className="hud-unit">%</span>
            </div>
          </div>

          <div className="hud-radar-box hud-box">
             <div className="hud-box-title" style={{marginBottom: '1rem'}}>Motion Radar</div>
             <div className="radar">
               <div className="radar-sweep" />
             </div>
             <div style={{marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(0,255,255,0.6)'}}>
               G: X{metrics.gravX} Y{metrics.gravY}
             </div>
          </div>

          <div className="hud-box">
            <div className="hud-box-title">Soul State</div>
            <div className="hud-value" style={{fontSize: '1.5rem', textTransform: 'uppercase'}}>
              {metrics.emotion}
            </div>
          </div>

          <div className="hud-box">
            <div className="hud-box-title">AI Intent Tracker</div>
            <div className="hud-value" style={{fontSize: '1.2rem', color: metrics.intent === 'IDLE' ? 'rgba(255,255,255,0.4)' : '#0ff'}}>
              {metrics.intent}
            </div>
          </div>

          {/* Logs */}
          <div className="hud-box hud-log-box">
            <div className="hud-box-title">Event Matrix</div>
            <div className="hud-log">
              {logs.length === 0 && <span style={{opacity: 0.3}}>Awaiting system events...</span>}
              {logs.map((log, i) => (
                <div key={i} className={`hud-log-entry ${i === 0 ? 'new' : ''}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
