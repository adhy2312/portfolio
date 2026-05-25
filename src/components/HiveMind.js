import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
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

      {/* Central Core */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color={isThinking ? "#d946ef" : "#6c63ff"} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function HiveMind({ onClose, isThinking, currentThought }) {
  return (
    <div className="hive-mind-overlay">
      <div className="hive-mind-header">
        <div className="hm-title">
          <span className="hm-pulse" style={{ backgroundColor: isThinking ? '#e879f9' : '#6c63ff' }} />
          MINI-ADHY HIVE MIND 
        </div>
        <button className="hm-close" onClick={onClose}>Disconnect ✕</button>
      </div>

      <div className="hm-status">
        <div className="hm-status-label">CURRENT NEURAL PROCESS:</div>
        <div className="hm-status-thought">
          {isThinking ? (currentThought || 'Processing external stimuli...') : 'Idle. Awaiting input.'}
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 60 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <Network isThinking={isThinking} />
        <OrbitControls enableZoom={true} enablePan={false} autoRotate={!isThinking} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
