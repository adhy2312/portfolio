import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { FiRotateCw, FiLock, FiWind, FiCamera, FiBox, FiRadio, FiBookOpen, FiMonitor, FiX } from 'react-icons/fi';
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

/* ── Brain Point Cloud ── */
function BrainPoints() {
  const pointsRef = useRef();

  const positions = useMemo(() => {
    const pts = new Float32Array(BRAIN_POINTS_COUNT * 3);
    for (let i = 0; i < BRAIN_POINTS_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi   = Math.acos(Math.random() * 2 - 1);
      const r     = (Math.cbrt(Math.random()) * 0.5 + 0.5) * 3.5;

      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);

      z *= 1.4;  // Elongate front-to-back
      y *= 0.85; // Flatten slightly

      if (z > 0) { x *= (1 - z * 0.1); y *= (1 - z * 0.05); }
      else        { x *= (1 - z * 0.05); }

      if (z > -1.5 && z < 1.5 && y < 0) x *= 1.15; // Temporal bulge
      if (z < -1.5 && y < -1) { x *= 1.1; y *= 1.1; } // Cerebellum

      if (x > 0) x += 0.5; else x -= 0.5; // Longitudinal fissure

      const noise = (Math.sin(x * 3) * Math.cos(z * 3) * Math.sin(y * 3)) * 0.2;
      pts[i * 3]     = x + noise;
      pts[i * 3 + 1] = y + noise;
      pts[i * 3 + 2] = z + noise;
    }
    return pts;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={BRAIN_POINTS_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#9b9aff" size={0.08} sizeAttenuation transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

/* ── Neural Connections (lines from thalamus to each node) ── */
function NeuralConnections({ activeNode, brainData }) {
  return (
    <>
      {/* Core thalamus */}
      <mesh position={[0, 0, 0]}>
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
            lineWidth={isActive ? 2.5 : 1}
            transparent
            opacity={isActive ? 0.9 : (isDimmed ? 0.04 : 0.2)}
          />
        );
      })}
    </>
  );
}

/* ── Single Node (sphere + HTML label + sub-panel) ── */
function NodeGroup({ nodeKey, data, activeNode, setActiveNode }) {
  const groupRef = useRef();
  const isActive = activeNode === nodeKey;
  const isDimmed = activeNode && !isActive;

  useFrame((state, delta) => {
    const target = isActive ? new THREE.Vector3(1.3, 1.3, 1.3) : new THREE.Vector3(1, 1, 1);
    groupRef.current.scale.lerp(target, 5 * delta);
  });

  const handleToggle = (e) => {
    e.stopPropagation();
    setActiveNode(isActive ? null : nodeKey);
  };

  return (
    <group position={data.pos} ref={groupRef}>
      <mesh onClick={handleToggle}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color="#111"
          emissive={data.color}
          emissiveIntensity={isActive ? 1.8 : (isDimmed ? 0.1 : 0.8)}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={isDimmed ? 0.25 : 1}
        />

        <Html center zIndexRange={[100, 0]} style={{ pointerEvents: isDimmed ? 'none' : 'auto', transition: 'all 0.3s', opacity: isDimmed ? 0.08 : 1 }}>
          <div
            className={`node-html-container ${isActive ? 'active' : ''}`}
            style={{ '--node-color': data.color }}
            onClick={handleToggle}
          >
            <div className="node-icon-3d">{data.icon}</div>
            <div className="node-label-3d">{nodeKey}</div>

            {isActive && (
              <div className="sub-nodes-grid">
                {/* ── V200: Close button inside panel ── */}
                <button
                  className="sub-nodes-close-btn"
                  onClick={(e) => { e.stopPropagation(); setActiveNode(null); }}
                  aria-label="Close node panel"
                  style={{ '--node-color': data.color }}
                >
                  <FiX size={12} />
                  <span>Close</span>
                </button>

                {CATEGORIES.map((cat, i) => (
                  <div key={cat} className="sub-node-3d" style={{ animationDelay: `${i * 0.06}s` }}>
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

/* ── Brain system: scroll-scrub rotation ── */
function BrainSystem({ activeNode, setActiveNode, brainData }) {
  const groupRef = useRef();

  const docHeightRef = useRef(1);
  useEffect(() => {
    const update = () => {
      docHeightRef.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      const pct    = window.scrollY / docHeightRef.current;
      const target = pct * Math.PI * 6;
      groupRef.current.rotation.y += (target - groupRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
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

/* ═══════════════════════════════
   MAIN SECTION COMPONENT
═══════════════════════════════ */
export default function NeuralMap3D() {
  const [activeNode,   setActiveNode]   = useState(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [brainData,    setBrainData]    = useState(BRAIN_DATA);
  const [isInView,     setIsInView]     = useState(false);
  const [showHint,     setShowHint]     = useState(true);
  const sectionRef = useRef(null);

  // IntersectionObserver to pause WebGL when off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  // Dismiss scroll hint after first scroll
  useEffect(() => {
    const dismiss = () => setShowHint(false);
    window.addEventListener('scroll', dismiss, { once: true });
    // Also auto-dismiss after 5s
    const id = setTimeout(() => setShowHint(false), 5000);
    return () => { window.removeEventListener('scroll', dismiss); clearTimeout(id); };
  }, []);

  // Sanity CMS fetch
  useEffect(() => {
    client.fetch('*[_type == "neuralMap"]')
      .then(data => {
        if (data && data.length > 0) {
          const formatted = {};
          data.forEach(item => {
            formatted[item.nodeKey] = {
              color: item.color,
              icon: ICON_MAP[item.icon] || <FiMonitor />,
              projects:     item.projects     || [],
              thoughts:     item.thoughts     || [],
              experiments:  item.experiments  || [],
              failures:     item.failures     || [],
              pos: item.pos || [0, 0, 0],
            };
          });
          setBrainData(formatted);
        }
      })
      .catch(err => console.error('Failed to load neural map from Sanity:', err));
  }, []);

  return (
    <section
      className="neural-map-section"
      id="neural-map"
      ref={sectionRef}
      onClick={() => setActiveNode(null)}
    >
      {/* ── Header ── */}
      <div className="neural-map-header section-title-wrapper" style={{ justifyContent: 'center', flexDirection: 'column' }}>
        <div className="section-label">NEURAL MAP</div>
        <h2 className="section-title" data-hover="HOLOGRAPHIC BRAIN">
          <span>HOLOGRAPHIC</span> BRAIN
        </h2>
        <p className="section-desc" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          Interactive 3D neural map. Click nodes to explore areas of expertise.
        </p>
      </div>

      {/* ── Canvas wrapper ── */}
      <div
        className="neural-map-container"
        style={{ cursor: isInteractive ? (activeNode ? 'default' : 'grab') : 'default' }}
      >

        {/* V200: Scroll-to-rotate hint — fades after first scroll */}
        {showHint && (
          <div className="neural-scroll-hint" aria-live="polite">
            <div className="neural-scroll-hint-icon">↕</div>
            <span>Scroll to rotate the brain</span>
          </div>
        )}

        {/* V200: Improved unlock button with FiRotateCw icon */}
        <button
          className={`unlock-3d-btn ${isInteractive ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setIsInteractive(v => !v); }}
          title={isInteractive ? 'Lock 3D freeform rotation' : 'Unlock 3D freeform rotation'}
        >
          {isInteractive
            ? <><FiLock    style={{ marginRight: '7px' }} />Lock 3D View</>
            : <><FiRotateCw style={{ marginRight: '7px' }} />Freeform Rotate</>
          }
        </button>

        {/* V200: Active node indicator */}
        {activeNode && (
          <div className="neural-active-badge" style={{ '--node-color': brainData[activeNode]?.color }}>
            <span className="neural-active-dot" />
            <span className="neural-active-label">{activeNode}</span>
            <button
              className="neural-active-close"
              onClick={(e) => { e.stopPropagation(); setActiveNode(null); }}
              aria-label="Deselect node"
            >
              <FiX size={12} />
            </button>
          </div>
        )}

        <Canvas
          frameloop={isInView ? 'always' : 'demand'}
          camera={{ position: [0, 0, 12], fov: 60 }}
          dpr={Math.min(window.devicePixelRatio, 1.5)}
        >
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={800} factor={4} saturation={0} fade speed={1} />
            <BrainSystem activeNode={activeNode} setActiveNode={setActiveNode} brainData={brainData} />
            {isInteractive && (
              <OrbitControls enablePan={false} enableZoom minDistance={5} maxDistance={20} />
            )}
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}
