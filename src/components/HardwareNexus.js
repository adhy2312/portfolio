import React, { useEffect, useRef, useState } from 'react';
import './HardwareNexus.css';
import { client } from '../sanity';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Fallback data if Sanity is empty
const FALLBACK_DATA = {
  sectionTitle: 'Hardware Nexus',
  sectionSubtitle: 'Embedded Systems & Software Architecture',
  centralText: 'ADHY',
  nodes: [
    { _key: '1', label: 'MCU Processing', description: 'Programming ARM Cortex and ESP32 microcontrollers', tech: 'C / C++' },
    { _key: '2', label: 'Frontend Interface', description: 'Building brutalist user interfaces and dashboards', tech: 'React / GSAP' },
    { _key: '3', label: 'IoT Telemetry', description: 'Connecting embedded devices to cloud ecosystems', tech: 'MQTT / Node.js' },
    { _key: '4', label: 'Data Storage', description: 'Architecting relational and real-time databases', tech: 'SupaBase / SQL' },
    { _key: '5', label: 'Hardware Design', description: 'PCB layout and circuit schematic routing', tech: 'KiCad / Altium' },
    { _key: '6', label: 'AI Integration', description: 'Deploying edge ML and large language models', tech: 'Python / TensorFlow' }
  ]
};

const HardwareNexus = () => {
  const sectionRef = useRef(null);
  const svgRef = useRef(null);
  const [sanityData, setSanityData] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    client.fetch('*[_type == "hardwareNexus"][0]')
      .then(data => setSanityData(data))
      .catch(console.error);
  }, []);

  const displayData = sanityData || FALLBACK_DATA;
  const nodes = displayData.nodes || FALLBACK_DATA.nodes;

  // Reveal animation
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current,
        { opacity: 0, y: 100 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1.2, 
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // SVG Paths mapping logic for up to 6 nodes
  const nodePositions = [
    { x: 15, y: 20 },  // Top Left
    { x: 85, y: 20 },  // Top Right
    { x: 10, y: 50 },  // Mid Left
    { x: 90, y: 50 },  // Mid Right
    { x: 25, y: 80 },  // Bottom Left
    { x: 75, y: 80 }   // Bottom Right
  ];

  const getPath = (index) => {
    const pos = nodePositions[index % nodePositions.length];
    // Start at the node, path to center (50, 50)
    // Draw a jagged PCB-like route
    const midX = pos.x > 50 ? 60 : 40;
    return `M ${pos.x} ${pos.y} L ${midX} ${pos.y} L 50 50`;
  };

  return (
    <section className="hardware-nexus-section" ref={sectionRef}>
      <div className="container">
        <div className="nexus-header">
          <span className="section-label">{"// architecture"}</span>
          <h2 className="section-title">{displayData.sectionTitle}</h2>
          <p className="section-desc">{displayData.sectionSubtitle}</p>
        </div>

        <div className="nexus-board">
          {/* SVG Traces Background */}
          <svg className="nexus-svg" viewBox="0 0 100 100" preserveAspectRatio="none" ref={svgRef}>
            {nodes.map((node, i) => {
              const isHovered = hoveredNode === i;
              return (
                <g key={`path-${i}`}>
                  {/* Background faint trace */}
                  <path 
                    d={getPath(i)} 
                    className="nexus-trace-bg" 
                    fill="none" 
                  />
                  {/* Glowing active trace */}
                  <path 
                    d={getPath(i)} 
                    className={`nexus-trace-active ${isHovered ? 'glowing' : ''}`} 
                    fill="none" 
                  />
                </g>
              );
            })}
          </svg>

          {/* Central CPU Core */}
          <div className="nexus-core">
            <div className="nexus-core-inner">
              {displayData.centralText}
            </div>
            <div className="nexus-pulse-ring"></div>
          </div>

          {/* Peripheral Nodes */}
          {nodes.map((node, i) => {
            const pos = nodePositions[i % nodePositions.length];
            return (
              <div 
                key={node._key || i}
                className={`nexus-node ${hoveredNode === i ? 'active' : ''}`}
                style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div className="node-dot"></div>
                <div className="node-content">
                  <div className="node-tech">{node.tech}</div>
                  <div className="node-label">{node.label}</div>
                  <div className="node-desc">{node.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HardwareNexus;
