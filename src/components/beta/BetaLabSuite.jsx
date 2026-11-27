import React, { Component, useState } from 'react';
import { useSiteMode, MODES } from '../../contexts/SiteModeContext';
import './BetaLabSuite.css';

class BetaErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="beta-error-box">
          <h3>Beta Sandbox Caught an Error</h3>
          <p>The main portfolio is unaffected. Error: {this.state.error?.message || 'Unknown error'}</p>
          <button type="button" className="beta-btn" onClick={() => this.setState({ hasError: false, error: null })}>
            Reset Beta Sandbox
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BetaSandboxContent() {
  const { setMode } = useSiteMode();
  const [bitA, setBitA] = useState(1);
  const [bitB, setBitB] = useState(0);
  const [gate, setGate] = useState('XOR');

  const computeGate = () => {
    if (gate === 'AND') return bitA & bitB;
    if (gate === 'OR') return bitA | bitB;
    if (gate === 'XOR') return bitA ^ bitB;
    if (gate === 'NAND') return Number(!(bitA & bitB));
    return 0;
  };

  return (
    <section className="beta-suite-section" id="beta-lab">
      <div className="beta-suite-card">
        <div className="beta-suite-header">
          <div>
            <span className="beta-pill">BETA CHANNEL // ISOLATED SANDBOX</span>
            <h2 className="beta-title">Beta Upgrade Workspace</h2>
            <p className="beta-subtitle">
              All upcoming features and experiments live here inside an isolated ErrorBoundary so the default portfolio stays 100% crash-free.
            </p>
          </div>
          <button type="button" className="beta-btn beta-btn--ghost" onClick={() => setMode(MODES.NORMAL)}>
            Exit to Default
          </button>
        </div>

        {/* Starter Beta Widget: Interactive Digital Logic Gate Bench */}
        <div className="beta-workbench">
          <div className="beta-bench-label">BETA-01 // INTERACTIVE LOGIC GATE BENCH</div>
          <div className="beta-gate-row">
            <button type="button" className={`beta-bit-btn ${bitA ? 'on' : ''}`} onClick={() => setBitA(b => (b ? 0 : 1))}>
              INPUT A: {bitA}
            </button>
            <select className="beta-gate-select" value={gate} onChange={(e) => setGate(e.target.value)} aria-label="Logic gate">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
              <option value="XOR">XOR</option>
              <option value="NAND">NAND</option>
            </select>
            <button type="button" className={`beta-bit-btn ${bitB ? 'on' : ''}`} onClick={() => setBitB(b => (b ? 0 : 1))}>
              INPUT B: {bitB}
            </button>
            <div className={`beta-output-badge ${computeGate() ? 'high' : 'low'}`}>
              OUT: {computeGate()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BetaLabSuite() {
  return (
    <BetaErrorBoundary>
      <BetaSandboxContent />
    </BetaErrorBoundary>
  );
}
