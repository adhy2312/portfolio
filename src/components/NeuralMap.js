import React, { useState, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Line, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { FiMonitor, FiWind, FiCamera, FiBox, FiRadio, FiBookOpen } from 'react-icons/fi';
import { client } from '../sanity';
import './NeuralMap.css';

const ICON_MAP = {
  FiMonitor: <FiMonitor />,
  FiBox: <FiBox />,
  FiWind: <FiWind />,
  FiRadio: <FiRadio />,
  FiCamera: <FiCamera />,
  FiBookOpen: <FiBookOpen />
};

const BRAIN_DATA = {
  frontend: {
    color: '#00d2ff',
    icon: <FiMonitor />,
    projects: ['Living Portfolios', 'Interactive UI Systems', 'Scalable Architectures'],
    thoughts: ['Websites must feel alive', 'Balance aesthetics with performance'],
    experiments: ['Asynchronous APIs', 'Accessibility-focused UX'],
    failures: ['Overcomplicating state early on'],
    pos: [2.0, 2.0, 4.0]
  },
  spatial: {
    color: '#aa00ff',
    icon: <FiBox />,
    projects: ['Three.js Holograms', 'WebGL Particle Systems', 'Digital Environments'],
    thoughts: ['Push beyond traditional layouts', 'Code as a creative medium'],
    experiments: ['Gesture-based interactions', 'Immersive 3D storytelling'],
    failures: ['Unoptimized render loops'],
    pos: [-2.0, 2.0, 4.0]
  },
  motion: {
    color: '#ff0055',
    icon: <FiWind />,
    projects: ['Cinematic Transitions', 'Fluid Micro-interactions', 'Scroll-driven Worlds'],
    thoughts: ['Motion connects psychology & code', 'Ease-out makes it natural'],
    experiments: ['Framer Motion layout API', 'Physics-based animations'],
    failures: ['Sacrificing UX for flashy effects'],
    pos: [3.8, 1.5, 0]
  },
  media: {
    color: '#ffaa00',
    icon: <FiRadio />,
    projects: ['ISTE PR Campaigns', 'AKSSC Media Strategy', 'FRAMES Visual Content'],
    thoughts: ['Communication is design', 'Brand consistency builds trust'],
    experiments: ['Campaign ideation', 'Event coordination systems'],
    failures: ['Underestimating data & spreadsheets'],
    pos: [-3.8, 1.5, 0]
  },
  photography: {
    color: '#00ffaa',
    icon: <FiCamera />,
    projects: ['Portrait Photography', 'Event Coverage', 'Cinematic Framing'],
    thoughts: ['Preserve atmosphere over pixels', 'Lighting is the narrative'],
    experiments: ['Emotion-driven imagery', 'Visual hierarchy in frames'],
    failures: ['Missed focus on a fleeting moment'],
    pos: [2.0, -1.0, -4.0]
  },
  storytelling: {
    color: '#ff00aa',
    icon: <FiBookOpen />,
    projects: ['Interactive Narratives', 'Hidden Easter Eggs', 'Emotion-driven UX'],
    thoughts: ['Connect multiple domains together', 'Tech should feel human'],
    experiments: ['Unconventional digital spaces', 'Jack-of-all-trades mindset'],
    failures: ['Forgetting the audience in the story'],
    pos: [-2.0, -1.0, -4.0]
  }
};

const CATEGORIES = ['projects', 'thoughts', 'experiments', 'failures'];
const BRAIN_POINTS_COUNT = 2500;

function BrainPoints() {
  const pointsRef = useRef();
  
  const positions = useMemo(() => {
    const pts = new Float32Array(BRAIN_POINTS_COUNT * 3);
    for (let i = 0; i < BRAIN_POINTS_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      // Bias points to surface for hollow look, but keep some interior
      const r = (Math.cbrt(Math.random()) * 0.5 + 0.5) * 3.5; 
      
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);
      
      // Basic brain shape
      z *= 1.4; // Elongate front-to-back
      y *= 0.85; // Flatten slightly top-to-bottom
      
      // Taper the front (frontal lobe)
      if (z > 0) {
        x *= (1 - z * 0.1);
        y *= (1 - z * 0.05);
      } else {
        // Widen the back (parietal/occipital)
        x *= (1 - z * 0.05);
      }

      // Temporal lobe bulge (sides)
      if (z > -1.5 && z < 1.5 && y < 0) {
        x *= 1.15;
      }
      
      // Cerebellum bulge (bottom back)
      if (z < -1.5 && y < -1) {
        x *= 1.1;
        y *= 1.1;
      }

      // Longitudinal fissure (split hemispheres) - Make the gap large enough!
      if (x > 0) {
        x += 0.5;
      } else {
        x -= 0.5;
      }
      
      // Add noise for "folds" (sulci/gyri) - keep it smaller than the fissure!
      const noise = (Math.sin(x * 3) * Math.cos(z * 3) * Math.sin(y * 3)) * 0.2;
      
      pts[i * 3] = x + noise;
      pts[i * 3 + 1] = y + noise;
      pts[i * 3 + 2] = z + noise;
    }
    return pts;
  }, []);

  useFrame((state) => {
    // Removed material opacity animation for better performance
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={BRAIN_POINTS_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#9b9aff" size={0.08} sizeAttenuation={true} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function NeuralConnections({ activeNode, brainData }) {
  return (
    <>
      {/* Core thalamus glowing sphere */}
      <mesh position={[0,0,0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {Object.entries(brainData).map(([key, data]) => {
        const isActive = activeNode === key;
        const isDimmed = activeNode && !isActive;
        return (
          <Line
            key={`line-${key}`}
            points={[[0, 0, 0], data.pos]}
            color={data.color}
            lineWidth={isActive ? 2 : 1}
            transparent
            opacity={isActive ? 0.8 : (isDimmed ? 0.05 : 0.2)}
          />
        );
      })}
    </>
  );
}

function NodeGroup({ nodeKey, data, activeNode, setActiveNode }) {
  const groupRef = useRef();
  const isActive = activeNode === nodeKey;
  const isDimmed = activeNode && !isActive;

  useFrame((state, delta) => {
    if (isActive) {
      groupRef.current.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 5 * delta);
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 5 * delta);
    }
  });

  return (
    <group position={data.pos} ref={groupRef}>
      <mesh onClick={(e) => { e.stopPropagation(); setActiveNode(isActive ? null : nodeKey); }}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial 
          color="#111" 
          emissive={data.color} 
          emissiveIntensity={isActive ? 1.5 : (isDimmed ? 0.1 : 0.8)} 
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={isDimmed ? 0.3 : 1}
        />
        
        <Html center zIndexRange={[100, 0]} style={{ pointerEvents: isDimmed ? 'none' : 'auto', transition: 'all 0.3s', opacity: isDimmed ? 0.1 : 1 }}>
          <div 
            className={`node-html-container ${isActive ? 'active' : ''}`} 
            style={{ '--node-color': data.color }}
            onClick={(e) => { e.stopPropagation(); setActiveNode(isActive ? null : nodeKey); }}
          >
            <div className="node-icon-3d">{data.icon}</div>
            <div className="node-label-3d">{nodeKey}</div>
            
            {isActive && (
              <div className="sub-nodes-grid">
                {CATEGORIES.map((cat, i) => (
                  <div key={cat} className="sub-node-3d" style={{ animationDelay: `${i * 0.05}s` }}>
                    <h4>{cat}</h4>
                    <ul>
                      {data[cat].map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Html>
      </mesh>
    </group>
  );
}

function BrainSystem({ activeNode, setActiveNode, brainData }) {
  const systemRef = useRef();

  useFrame((state) => {
    // Only slowly auto-rotate the entire brain if no node is active
    if (!activeNode) {
      const t = state.clock.getElapsedTime();
      systemRef.current.position.y = Math.sin(t * 1.5) * 0.15; // Subtle floating
    }
  });

  return (
    <group ref={systemRef}>
      <BrainPoints />
      <NeuralConnections activeNode={activeNode} brainData={brainData} />
      {Object.entries(brainData).map(([key, data]) => (
        <NodeGroup 
          key={key} 
          nodeKey={key} 
          data={data} 
          activeNode={activeNode} 
          setActiveNode={setActiveNode} 
        />
      ))}
    </group>
  );
}

export default function NeuralMap3D() {
  const [activeNode, setActiveNode] = useState(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [brainData, setBrainData] = useState(BRAIN_DATA);

  React.useEffect(() => {
    client.fetch('*[_type == "neuralMap"]')
      .then(data => {
        if (data && data.length > 0) {
          const formattedData = {};
          data.forEach(item => {
            formattedData[item.nodeKey] = {
              color: item.color,
              icon: ICON_MAP[item.icon] || <FiMonitor />,
              projects: item.projects || [],
              thoughts: item.thoughts || [],
              experiments: item.experiments || [],
              failures: item.failures || [],
              pos: item.pos || [0,0,0]
            };
          });
          setBrainData(formattedData);
        }
      })
      .catch(err => console.error("Failed to load neural map from sanity:", err));
  }, []);

  return (
    <section className="neural-map-section" id="neural-map" onClick={() => setActiveNode(null)}>
      <div className="neural-map-header section-title-wrapper" style={{ justifyContent: 'center', flexDirection: 'column' }}>
        <div className="section-label">NEURAL MAP</div>
        <h2 className="section-title" data-hover="HOLOGRAPHIC BRAIN">
          <span>HOLOGRAPHIC</span> BRAIN
        </h2>
        <p className="section-desc" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          Interactive 3D neural map. Rotate, zoom, and tap nodes to explore.
        </p>
      </div>

      <div className="neural-map-container" style={{ height: '700px', cursor: isInteractive ? (activeNode ? 'default' : 'grab') : 'default' }}>
        
        <button 
          className={`unlock-3d-btn ${isInteractive ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setIsInteractive(!isInteractive); }}
        >
          <FiMonitor style={{ marginRight: '8px' }}/>
          {isInteractive ? 'Lock 3D View' : 'Unlock 3D Rotation'}
        </button>

        <Canvas camera={{ position: [0, 0, 12], fov: 60 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={800} factor={4} saturation={0} fade speed={1} />
            
            <BrainSystem activeNode={activeNode} setActiveNode={setActiveNode} brainData={brainData} />

            {isInteractive && (
              <OrbitControls 
                enablePan={false} 
                enableZoom={true} 
                minDistance={5} 
                maxDistance={20} 
              />
            )}
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}
