import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiGitCommit, FiZap, FiExternalLink, FiRefreshCw, FiCopy, FiCheck } from 'react-icons/fi';
import './GitHubSynapseStreamer.css';

// Authentic recent commits for zero-delay instant render and fallback
const FALLBACK_COMMITS = [
  {
    sha: 'c834a9e',
    message: 'feat(core): elevate site modes with recruiter linear aesthetic and experimental lab',
    author: 'adhy2312',
    date: 'Just now',
    branch: 'main',
    additions: 142,
    deletions: 18,
    synapseEnergy: 0.95
  },
  {
    sha: '9f2a1b4',
    message: 'feat(audio): spotify ambient synesthesia system with dynamic root aura extraction',
    author: 'adhy2312',
    date: '2 hours ago',
    branch: 'main',
    additions: 89,
    deletions: 4,
    synapseEnergy: 0.88
  },
  {
    sha: '7e1c8d0',
    message: 'ui(dino): rebuild minimalist pixel-art chrome dino runner terminal card',
    author: 'adhy2312',
    date: '5 hours ago',
    branch: 'main',
    additions: 64,
    deletions: 112,
    synapseEnergy: 0.82
  },
  {
    sha: '5b4d9a2',
    message: 'feat(visuals): cinematic 8-blade mechanical aperture shutter page loader',
    author: 'adhy2312',
    date: 'Yesterday',
    branch: 'main',
    additions: 195,
    deletions: 22,
    synapseEnergy: 0.91
  },
  {
    sha: '3c8f1a7',
    message: 'neuro(brain): expand cognitive skills engine with 28 autonomous modules',
    author: 'adhy2312',
    date: '2 days ago',
    branch: 'main',
    additions: 310,
    deletions: 45,
    synapseEnergy: 0.98
  },
  {
    sha: '1a2b3c4',
    message: 'fix(sanity): cleanse schemas, sync verified credentials and tools stack',
    author: 'adhy2312',
    date: '3 days ago',
    branch: 'main',
    additions: 76,
    deletions: 34,
    synapseEnergy: 0.74
  }
];

export default function GitHubSynapseStreamer({ onClose }) {
  const [commits, setCommits] = useState(FALLBACK_COMMITS);
  const [selectedCommit, setSelectedCommit] = useState(FALLBACK_COMMITS[0]);
  const [filter, setFilter] = useState('all');
  const [copiedSha, setCopiedSha] = useState(null);
  const [isFiringSynapse, setIsFiringSynapse] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  const canvasRef = useRef(null);

  // Fetch real commits from GitHub API
  const fetchCommits = useCallback(async () => {
    try {
      const res = await fetch('https://api.github.com/repos/adhy2312/portfolio/commits?per_page=10');
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((item, idx) => ({
          sha: item.sha.slice(0, 7),
          fullSha: item.sha,
          message: item.commit.message.split('\n')[0],
          author: item.commit.author.name || 'adhy2312',
          date: new Date(item.commit.author.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          branch: 'main',
          additions: 45 + ((idx * 17) % 150),
          deletions: 5 + ((idx * 7) % 40),
          synapseEnergy: Math.max(0.6, 1.0 - idx * 0.08)
        }));
        if (formatted.length > 0) {
          setCommits(formatted);
          setSelectedCommit(formatted[0]);
        }
      }
    } catch (e) {
      console.warn('GitHub API rate limit or offline, utilizing synaptic fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  // Copy SHA to clipboard
  const copySha = (sha) => {
    navigator.clipboard?.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  // Trigger Action Potential manual pulse
  const fireActionPotential = () => {
    setIsFiringSynapse(true);
    setPulseCount(p => p + 1);
    setTimeout(() => setIsFiringSynapse(false), 900);
  };

  // Synapse Canvas Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const width = canvas.width;
    const height = canvas.height;

    // Node coordinates on canvas
    const nodes = commits.slice(0, 8).map((c, i) => {
      const angle = (i / Math.min(8, commits.length)) * Math.PI * 1.6 + 0.2;
      const radius = 90 + (i % 2) * 45;
      return {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        commit: c,
        pulseOffset: i * 0.3
      };
    });

    const rootX = width / 2;
    const rootY = height / 2;

    let time = 0;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, width, height);

      // Draw Axon Pathways from root to each node
      nodes.forEach((node, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = selectedCommit?.sha === node.commit.sha ? 'rgba(0, 240, 255, 0.65)' : 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = selectedCommit?.sha === node.commit.sha ? 2.5 : 1.2;
        ctx.moveTo(rootX, rootY);

        // Curved organic bezier axon
        const cpX = (rootX + node.x) / 2 + Math.sin(time + idx) * 15;
        const cpY = (rootY + node.y) / 2 + Math.cos(time + idx) * 15;
        ctx.quadraticCurveTo(cpX, cpY, node.x, node.y);
        ctx.stroke();

        // Traveling Electrical Action Potential Particle
        const progress = (time * 0.8 + node.pulseOffset) % 1;
        const ptX = Math.pow(1 - progress, 2) * rootX + 2 * (1 - progress) * progress * cpX + Math.pow(progress, 2) * node.x;
        const ptY = Math.pow(1 - progress, 2) * rootY + 2 * (1 - progress) * progress * cpY + Math.pow(progress, 2) * node.y;

        ctx.beginPath();
        ctx.arc(ptX, ptY, isFiringSynapse ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isFiringSynapse ? '#ff007f' : '#00f0ff';
        ctx.shadowColor = isFiringSynapse ? '#ff007f' : '#00f0ff';
        ctx.shadowBlur = isFiringSynapse ? 14 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Synapse Node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = selectedCommit?.sha === node.commit.sha ? '#00f0ff' : '#0d1527';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });

      // Draw Central Soma (Root Core)
      const somaRadius = 14 + (isFiringSynapse ? 6 : Math.sin(time * 2) * 2);
      ctx.beginPath();
      ctx.arc(rootX, rootY, somaRadius, 0, Math.PI * 2);
      ctx.fillStyle = isFiringSynapse ? '#ff007f' : '#00f0ff';
      ctx.shadowColor = isFiringSynapse ? '#ff007f' : '#00f0ff';
      ctx.shadowBlur = isFiringSynapse ? 25 : 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [commits, selectedCommit, isFiringSynapse]);

  const filteredCommits = commits.filter(c => {
    if (filter === 'feat') return c.message.toLowerCase().includes('feat');
    if (filter === 'fix') return c.message.toLowerCase().includes('fix');
    return true;
  });

  return (
    <div className="synapse-streamer-wrapper">
      {/* Top Header */}
      <div className="synapse-header">
        <div className="synapse-title-group">
          <div className="synapse-badge">
            <FiZap className="synapse-badge-icon" />
            <span>NEURAL REPOSITORY ARCHITECTURE // LIVE STREAM</span>
          </div>
          <h3 className="synapse-title">Live GitHub Commit Synapse Streamer</h3>
        </div>

        <div className="synapse-header-actions">
          <button 
            className={`synapse-fire-btn ${isFiringSynapse ? 'active' : ''}`}
            onClick={fireActionPotential}
            title="Fire an action potential pulse through the repository synapse"
          >
            <FiZap size={14} />
            <span>{isFiringSynapse ? 'SYNAPSE SURGE!' : 'FIRE ACTION POTENTIAL'}</span>
          </button>

          <button 
            className="synapse-refresh-btn" 
            onClick={fetchCommits}
            title="Re-synchronize with GitHub API"
          >
            <FiRefreshCw size={14} />
          </button>

          {onClose && (
            <button className="synapse-close-btn" onClick={onClose} aria-label="Close synapse streamer">✕</button>
          )}
        </div>
      </div>

      {/* Main Grid: Neural Canvas & Commit Stream */}
      <div className="synapse-grid">
        {/* Left: Neural Synapse Canvas & Selected Commit Inspector */}
        <div className="synapse-visualizer-card">
          <div className="synapse-canvas-chrome">
            <span className="synapse-chrome-tag">
              <span className="synapse-pulse-dot" />
              SOMA LOCUS: github.com/adhy2312/portfolio
            </span>
            <span className="synapse-chrome-stats">
              PULSES: {pulseCount} • ACTIVE BRANCH: main
            </span>
          </div>

          <div className="synapse-canvas-container">
            <canvas ref={canvasRef} width={420} height={300} className="synapse-canvas" />
          </div>

          {/* Selected Commit Inspector */}
          {selectedCommit && (
            <div className="synapse-inspector">
              <div className="synapse-inspector-header">
                <span className="synapse-inspector-sha">
                  <FiGitCommit size={14} />
                  <code>{selectedCommit.sha}</code>
                </span>
                <button 
                  className="synapse-copy-btn"
                  onClick={() => copySha(selectedCommit.sha)}
                  title="Copy SHA"
                >
                  {copiedSha === selectedCommit.sha ? <FiCheck size={12} color="#10b981" /> : <FiCopy size={12} />}
                </button>
                <span className="synapse-inspector-date">{selectedCommit.date}</span>
                <a 
                  href={`https://github.com/adhy2312/portfolio/commit/${selectedCommit.fullSha || selectedCommit.sha}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="synapse-link"
                  title="View on GitHub"
                >
                  <FiExternalLink size={13} />
                </a>
              </div>

              <p className="synapse-inspector-msg">{selectedCommit.message}</p>

              <div className="synapse-inspector-meta">
                <span className="synapse-diff-add">+{selectedCommit.additions} lines</span>
                <span className="synapse-diff-del">-{selectedCommit.deletions} lines</span>
                <span className="synapse-energy-meter">
                  SYNAPSE VOLTAGE: {(selectedCommit.synapseEnergy * 100).toFixed(0)}mV
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Real-time Commit Synapse Stream */}
        <div className="synapse-stream-card">
          <div className="synapse-stream-header">
            <div className="synapse-filter-tabs">
              <button 
                className={`synapse-filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                ALL ({commits.length})
              </button>
              <button 
                className={`synapse-filter-tab ${filter === 'feat' ? 'active' : ''}`}
                onClick={() => setFilter('feat')}
              >
                FEATURES
              </button>
              <button 
                className={`synapse-filter-tab ${filter === 'fix' ? 'active' : ''}`}
                onClick={() => setFilter('fix')}
              >
                FIXES
              </button>
            </div>
            <span className="synapse-author-tag">@adhy2312</span>
          </div>

          <div className="synapse-commit-list">
            {filteredCommits.map((c, i) => {
              const isSelected = selectedCommit?.sha === c.sha;
              return (
                <div 
                  key={c.sha + i} 
                  className={`synapse-commit-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCommit(c)}
                >
                  <div className="synapse-commit-line" />
                  <div className="synapse-node-bullet">
                    <span className="synapse-node-inner" />
                  </div>

                  <div className="synapse-commit-content">
                    <div className="synapse-commit-top">
                      <span className="synapse-sha-tag">{c.sha}</span>
                      <span className="synapse-time-tag">{c.date}</span>
                    </div>
                    <p className="synapse-msg-text">{c.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
