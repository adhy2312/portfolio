import React, { useEffect, useState, useRef } from 'react';
import './DeveloperConsole.css';
import ns from '../core/NervousSystem';
import gsap from 'gsap';

export default function DeveloperConsole({ onClose }) {
  const [metrics, setMetrics] = useState({
    fps: 60,
    fatigue: 0,
    memory: 'N/A',
    timelines: 0,
    scrollPos: 0
  });

  const consoleRef = useRef(null);

  useEffect(() => {
    // Reveal animation
    gsap.fromTo(consoleRef.current, 
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
    );

    // Polling interval for live metrics
    const interval = setInterval(() => {
      let memoryUsage = 'N/A';
      if (window.performance && window.performance.memory) {
        const mem = window.performance.memory;
        memoryUsage = (mem.usedJSHeapSize / 1048576).toFixed(1) + ' MB';
      }

      setMetrics({
        fps: ns.fps,
        fatigue: ns.fatigue,
        memory: memoryUsage,
        timelines: gsap.globalTimeline.getChildren().length,
        scrollPos: ns.scrollPos
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getFpsColor = (fps) => {
    if (fps >= 50) return 'metric-good';
    if (fps >= 30) return 'metric-warn';
    return 'metric-bad';
  };

  const getFatigueColor = (fatigue) => {
    if (fatigue < 20) return 'metric-good';
    if (fatigue < 60) return 'metric-warn';
    return 'metric-bad';
  };

  const getStressLevel = (fatigue) => {
    if (fatigue < 20) return 'Relaxed';
    if (fatigue < 60) return 'Active';
    if (fatigue < 80) return 'Stressed';
    return 'Overloaded';
  };

  return (
    <div className="developer-console" ref={consoleRef}>
      <div className="dev-console-header">
        <span>NERVOUS_SYSTEM_CONSOLE</span>
        <button className="dev-console-close" onClick={onClose}>&times;</button>
      </div>
      <div className="dev-console-body">
        <div className="dev-console-metric">
          <span className="dev-metric-label">SYS.FPS</span>
          <span className={`dev-metric-value ${getFpsColor(metrics.fps)}`}>{metrics.fps}</span>
        </div>
        <div className="dev-console-metric">
          <span className="dev-metric-label">SYS.STRESS</span>
          <span className={`dev-metric-value ${getFatigueColor(metrics.fatigue)}`}>
            {getStressLevel(metrics.fatigue)} ({Math.round(metrics.fatigue)}%)
          </span>
        </div>
        <div className="dev-console-metric">
          <span className="dev-metric-label">SYS.MEMORY</span>
          <span className="dev-metric-value">{metrics.memory}</span>
        </div>
        <div className="dev-console-metric">
          <span className="dev-metric-label">GSAP.ACTIVE_TIMELINES</span>
          <span className="dev-metric-value">{metrics.timelines}</span>
        </div>
        <div className="dev-console-metric">
          <span className="dev-metric-label">SCROLL.VELOCITY_Y</span>
          <span className="dev-metric-value">{Math.round(metrics.scrollPos)}px</span>
        </div>
      </div>
    </div>
  );
}
