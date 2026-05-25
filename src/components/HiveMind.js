import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './HiveMind.css';

const NODE_COUNT = 150;
const CONNECTION_DISTANCE = 3.5;

function Network({ isThinking }) {
  const groupRef = useRef();
  
  // Generate random nodes
  const nodes = useMemo(() => {
    const pts = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      // distribute in a sphere
      const r = 8 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      pts.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }
    return pts;
  }, []);

  // Generate lines between close nodes
  const lines = useMemo(() => {
    const lns = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < CONNECTION_DISTANCE) {
          lns.push([nodes[i], nodes[j]]);
        }
      }
    }
    return lns;
  }, [nodes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += isThinking ? 0.01 : 0.002;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {nodes.map((pos, i) => (
        <mesh key={`node-${i}`} position={pos}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={isThinking ? "#a855f7" : "#6c63ff"} transparent opacity={0.8} />
        </mesh>
      ))}
      
      {/* Connections */}
      {lines.map((pts, i) => (
        <Line 
          key={`line-${i}`}
          points={pts}
          color={isThinking ? "#e879f9" : "#a78bfa"}
          lineWidth={isThinking ? 1.5 : 0.5}
          transparent
          opacity={isThinking ? 0.4 : 0.15}
        />
      ))}

      {/* Core Memories labeled with HTML */}
      <Html position={nodes[0]} center>
        <div className="hm-node-label">SKILLS_CORE</div>
      </Html>
      <Html position={nodes[10]} center>
        <div className="hm-node-label">PROJECT_MEMORY</div>
      </Html>
      <Html position={nodes[20]} center>
        <div className="hm-node-label">USER_CONTEXT</div>
      </Html>

      {/* Central Core */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color={isThinking ? "#d946ef" : "#6c63ff"} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function HiveMind({ onClose, isThinking, currentThought, ownerState, setOwnerState }) {
  const { activeSection, weatherData } = useConsciousness();
  const [injectInput, setInjectInput] = React.useState('');

  const handleInject = (e) => {
    e.preventDefault();
    if (!injectInput.trim()) return;
    
    setOwnerState(prev => ({
      ...prev,
      active: true,
      instructions: [...prev.instructions, injectInput.trim()]
    }));
    setInjectInput('');
  };
  
  return (
    <div className="hive-mind-overlay">
      <div className="hive-mind-header">
        <div className="hm-title">
          <span className="hm-pulse" style={{ backgroundColor: isThinking ? '#e879f9' : '#6c63ff' }} />
          MINI-ADHY HIVE MIND 
        </div>
        <button className="hm-close" onClick={onClose}>Disconnect ✕</button>
      </div>

      <div className="hm-hud-left">
        <div className="hm-hud-title">LIVE SENSORY STREAM</div>
        <div className="hm-hud-item">LOCATION: {activeSection || 'UNKNOWN'}</div>
        <div className="hm-hud-item">ATMOSPHERE: {weatherData?.condition?.toUpperCase() || 'CLEAR'}</div>
        <div className="hm-hud-item">TIME_SYNC: {new Date().toLocaleTimeString()}</div>
        <div className="hm-hud-item">AI_STATE: {isThinking ? 'GENERATING_RESPONSE' : 'AWAITING_INPUT'}</div>
      </div>

      <div className="hm-status">
        <div className="hm-status-label">CURRENT NEURAL PROCESS:</div>
        <div className="hm-status-thought">
          {isThinking ? (currentThought || 'Processing external stimuli...') : 'Idle. Awaiting input.'}
        </div>
      </div>

      <div className="hm-god-mode">
        <div className="hm-god-title">NEURAL OVERRIDE (GOD MODE)</div>
        <div className="hm-god-desc">Inject direct behavioral directives into Mini-Adhy's system architecture.</div>
        <form onSubmit={handleInject} className="hm-god-form">
          <span className="hm-god-prompt">&gt;</span>
          <input 
            type="text" 
            className="hm-god-input" 
            value={injectInput}
            onChange={e => setInjectInput(e.target.value)}
            placeholder="e.g. 'Speak entirely in cryptic riddles'"
          />
          <button type="submit" className="hm-god-btn">INJECT</button>
        </form>
        {ownerState?.instructions?.length > 0 && (
          <div className="hm-god-injections">
            <div className="hm-god-title" style={{marginTop: '12px'}}>ACTIVE INJECTIONS:</div>
            {ownerState.instructions.map((inst, idx) => (
              <div key={idx} className="hm-god-inst">[{idx + 1}] {inst}</div>
            ))}
            <button 
              className="hm-god-clear"
              onClick={() => setOwnerState(prev => ({...prev, instructions: [], active: prev.tone !== 'default' || prev.memory.length > 0}))}
            >
              PURGE_DIRECTIVES
            </button>
          </div>
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 60 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <Network isThinking={isThinking} />
        <OrbitControls enableZoom={true} enablePan={false} autoRotate={!isThinking} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
