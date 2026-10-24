import React, { useState } from 'react';
import CircuitSimulatorSDR from './CircuitSimulatorSDR';
import GitHubSynapseStreamer from './GitHubSynapseStreamer';
import { FiCpu, FiGitBranch, FiActivity } from 'react-icons/fi';
import './ExperimentalLabSuite.css';

export default function ExperimentalLabSuite() {
  const [activeTab, setActiveTab] = useState('circuit'); // 'circuit' | 'synapse' | 'both'

  return (
    <section className="exp-lab-suite-section" id="experimental-lab">
      <div className="exp-lab-suite-banner">
        <div className="exp-lab-badge">
          <span className="exp-pulse-beacon" />
          <span>QUANTUM EXPERIMENTAL LAB // BLEEDING EDGE</span>
        </div>
        <h2 className="exp-lab-title">Hardware Synthesis & Neural Synapse Lab</h2>
        <p className="exp-lab-subtitle">
          Real-time interactive hardware modeling, GNU Radio SDR waterfall, and neural repository action potential streamers.
        </p>

        {/* Tab Switcher */}
        <div className="exp-lab-nav-pills">
          <button 
            className={`exp-lab-pill ${activeTab === 'circuit' ? 'active' : ''}`}
            onClick={() => setActiveTab('circuit')}
          >
            <FiCpu size={15} />
            <span>CIRCUIT & SDR WATERFALL</span>
          </button>
          <button 
            className={`exp-lab-pill ${activeTab === 'synapse' ? 'active' : ''}`}
            onClick={() => setActiveTab('synapse')}
          >
            <FiGitBranch size={15} />
            <span>GITHUB SYNAPSE STREAMER</span>
          </button>
          <button 
            className={`exp-lab-pill ${activeTab === 'both' ? 'active' : ''}`}
            onClick={() => setActiveTab('both')}
          >
            <FiActivity size={15} />
            <span>EXPAND ALL BENCHES</span>
          </button>
        </div>
      </div>

      {/* Render selected workstation */}
      {(activeTab === 'circuit' || activeTab === 'both') && (
        <CircuitSimulatorSDR />
      )}

      {(activeTab === 'synapse' || activeTab === 'both') && (
        <GitHubSynapseStreamer />
      )}
    </section>
  );
}
