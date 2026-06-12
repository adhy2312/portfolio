import React, { useRef, useEffect, useState } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import { useOrchestrator } from '../contexts/SystemOrchestrator';
import './DigitalSeed.css';

const DigitalSeed = () => {
  const { temporalAge, weatherData, idleState } = useConsciousness();
  const [forceStage, setForceStage] = useState(0);
  const orchestrator = useOrchestrator();
  
  const treeRef = useRef(null);
  const rootsRef = useRef(null);
  const leavesRef = useRef(null);
  
  const hour = new Date().getHours();
  const isLateNight = hour < 5 || hour >= 23;
  const isRain = weatherData?.condition === 'Rain' || weatherData?.condition === 'Drizzle';

  useEffect(() => {
    if (!orchestrator) return;

    // Organic stillness & micro-behaviors via masterRAF
    const tick = (time, delta, mousePos, isMoving, tier, heartbeatValue) => {
      if (!treeRef.current) return;
      if (tier === 0) return; // Static mode, no movement

      // Late night slows down everything
      const speedMult = isLateNight ? 0.3 : 1;
      
      // Micro branch sway - very slow, barely noticeable
      const sway = Math.sin(time * 0.0005 * speedMult) * 0.5;
      
      // Leaf hesitation (complex layered sine waves)
      const leafFlutter = isRain ? 
        (Math.sin(time * 0.005) * 0.5) : // Rain hits leaves
        (Math.sin(time * 0.001) * Math.cos(time * 0.0015) * 0.5); // Natural breeze
        
      // Root neural pulse (only visible when idle)
      const rootPulse = idleState !== 'active' ? (1 + heartbeatValue * 0.05) : 1;

      // Apply transforms via DOM for performance
      if (treeRef.current) {
        treeRef.current.style.transform = `translate3d(0, 0, 0) rotate(${sway}deg)`;
      }
      
      if (leavesRef.current && tier >= 2) {
        leavesRef.current.style.transform = `rotate(${leafFlutter}deg)`;
      }
      
      if (rootsRef.current && tier >= 2) {
        rootsRef.current.style.opacity = idleState === 'active' ? 0.8 : rootPulse;
      }
    };

    orchestrator.subscribeToRAF('digital-tree-biology', tick, { priority: 'NORMAL', gpuCost: 'LOW', cooldown: 0 });
    return () => orchestrator.unsubscribeFromRAF('digital-tree-biology');
  }, [orchestrator, isLateNight, isRain, idleState]);

  // Calculate growth stage based on temporal age (real time)
  // Adjusted for faster visible progression
  let stage = 0;
  if (temporalAge >= 365) stage = 4; // Mature Tree (1 year)
  else if (temporalAge >= 90) stage = 3; // Young Tree (3 months)
  else if (temporalAge >= 30) stage = 2; // Sapling (1 month)
  else if (temporalAge >= 10) stage = 1; // Sprout (10 days)

  // AI Override
  if (forceStage > stage) stage = Math.min(4, forceStage);

  useEffect(() => {
    const handleForceGrowth = () => setForceStage(prev => Math.min(4, prev + 1));
    window.addEventListener('force-seed-growth', handleForceGrowth);
    return () => window.removeEventListener('force-seed-growth', handleForceGrowth);
  }, []);

  const containerClasses = [
    'digital-seed-bedrock',
    `stage-${stage}`,
    isLateNight ? 'late-night-loneliness' : '',
    isRain ? 'weather-moist' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Atmospheric Fog */}
      <div className="ambient-fog" />
      
      {/* Subconscious Soil Layers */}
      <div className="soil-surface-layer">
        <div className="soil-texture" />
        <div className="soil-shadow" />
      </div>

      <div className="subconscious-depths">
        {/* The Root System - Psychological Anchor */}
        <div className="root-system" ref={rootsRef}>
          <div className="root root-main" />
          <div className="root root-left" />
          <div className="root root-right" />
          <div className="root root-deep-1" />
          <div className="root root-deep-2" />
          <div className="root-neural-pathway" />
        </div>
      </div>

      {/* The Physical Tree emerging from the soil */}
      <div className="tree-organism" ref={treeRef}>
        <div className="tree-trunk">
          {/* Bark texture via CSS gradients */}
          <div className="bark-texture" />
          
          {/* Asymmetrical Branches */}
          {stage >= 1 && <div className="branch branch-1" />}
          {stage >= 2 && <div className="branch branch-2" />}
          {stage >= 3 && <div className="branch branch-3" />}
          {stage >= 4 && <div className="branch branch-4" />}
          
          {/* Leaf Canopy */}
          {stage >= 1 && (
            <div className="leaf-canopy" ref={leavesRef}>
              <div className="leaf-cluster cluster-1">
                <div className="leaf" />
                <div className="leaf leaf-b" />
              </div>
              {stage >= 2 && (
                <div className="leaf-cluster cluster-2">
                  <div className="leaf" />
                  <div className="leaf leaf-b" />
                </div>
              )}
              {stage >= 3 && (
                <div className="leaf-cluster cluster-3">
                  <div className="leaf" />
                  <div className="leaf leaf-b" />
                  <div className="leaf leaf-c" />
                </div>
              )}
              {stage >= 4 && (
                <div className="leaf-cluster cluster-4">
                  <div className="leaf" />
                  <div className="leaf leaf-b" />
                  <div className="leaf leaf-c" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Subtle indicator of its buried nature */}
      <div className="timeline-whisper">
        Age: T + {temporalAge} days. A living memory in the architecture.
      </div>
    </div>
  );
};

export default DigitalSeed;
