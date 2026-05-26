import React from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import './DigitalScars.css';
import { FiActivity, FiTerminal, FiAlertCircle, FiDatabase, FiLayers, FiRepeat, FiCpu } from 'react-icons/fi';

const SCARS = [
  {
    id: "ERR-01",
    title: "The Particle Collapse",
    description: "An early physics simulation that broke the render loop and destroyed the browser's memory. Preserved as a reminder of ambition exceeding constraints.",
    icon: <FiActivity size={24} />,
    status: "Archived"
  },
  {
    id: "SYS-04",
    title: "Forgotten Architectures",
    description: "Traces of a massive 3D environment that was eventually deleted. The ghost of its structure still subtly influences the current routing.",
    icon: <FiTerminal size={24} />,
    status: "Fading"
  },
  {
    id: "MEM-09",
    title: "The Silent Leak",
    description: "A beautiful but chaotic state management system that slowly consumed all available memory until the UI froze into silence.",
    icon: <FiDatabase size={24} />,
    status: "Contained"
  },
  {
    id: "RND-11",
    title: "The Infinite Cascade",
    description: "A single missing useEffect dependency that triggered an infinite render loop, crashing the entire layout engine before it even painted.",
    icon: <FiRepeat size={24} />,
    status: "Resolved"
  },
  {
    id: "STY-22",
    title: "Z-Index Warfare",
    description: "A brutal conflict of absolute positioned elements competing for dominance, ultimately resulting in a mobile navigation that swallowed the whole screen.",
    icon: <FiLayers size={24} />,
    status: "Patched"
  },
  {
    id: "CON-42",
    title: "Race Condition Roulette",
    description: "Asynchronous state updates firing out of order. For three days, the application lived in a superposition of multiple UI states simultaneously.",
    icon: <FiCpu size={24} />,
    status: "Isolated"
  }
];

const DigitalScars = () => {
  const { idleState } = useConsciousness();

  return (
    <section className="digital-scars-section" id="scars">
      <div className="container">
        <div className="scars-header">
          <span className="section-label" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}>
            {"// preserved imperfections"}
          </span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="System Scars">
              <span className="section-title-inner" style={{ color: '#ffffff' }}>
                <FiAlertCircle size={38} style={{ verticalAlign: 'middle', marginRight: '14px', paddingBottom: '6px' }} />
                Digital <span className="scarred-text" data-text="Scars">Scars</span>
              </span>
            </h2>
          </div>
          <div className="section-divider" />
          <p className="scars-subtitle">
            A transparent archive of my failed experiments, broken architectures, and performance disasters. In software engineering, perfection is an illusion—these are the traces of struggle and iteration that taught me the most.
          </p>
        </div>

        <div className={`scars-grid ${idleState === 'dreaming' ? 'scars-dreaming' : ''}`}>
          {SCARS.map((scar, idx) => (
            <div key={idx} className="scar-card glass-card">
              <div className="scar-card-header">
                <div className="scar-icon">{scar.icon}</div>
                <div className="scar-id">{scar.id}</div>
              </div>
              <h3 className="scar-title">{scar.title}</h3>
              <p className="scar-desc">{scar.description}</p>
              <div className="scar-footer">
                <span className={`scar-status status-${scar.status.toLowerCase()}`}>
                  {scar.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DigitalScars;
