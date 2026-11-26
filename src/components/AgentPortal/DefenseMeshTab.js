import React from 'react';
import { FiShield } from 'react-icons/fi';

export const DefenseMeshTab = ({ defenseState, handleSimulateAttack }) => {
  return (
    <div className="agentp-defense-panel">
      <div className="agentp-defense-hero">
        <div className="agentp-defense-status-badge">
          <span className="agentp-hud-pulse" />
          <span>DEFCON-1: SYNCHRONIZED COOPERATIVE SHIELDING</span>
        </div>
        <h2>10-AGENT SYNCHRONIZED ANTI-BREACH DEFENSE MESH</h2>
        <p>
          Autonomous intrusion countermeasure grid. The moment an unauthorized penetration, brute-force attack, or payload injection is detected, all 10 specialist agents coordinate in real-time to neutralize the threat with zero data leakage.
        </p>

        <div className="agentp-defense-metrics-bar">
          <div className="agentp-def-metric">
            <span className="agentp-def-metric-num" style={{ color: '#10b981' }}>
              {defenseState?.totalIntrusionsNeutralized || 142}+
            </span>
            <span className="agentp-def-metric-label">INTRUSIONS NEUTRALIZED</span>
          </div>
          <div className="agentp-def-metric">
            <span className="agentp-def-metric-num" style={{ color: '#34d399' }}>100%</span>
            <span className="agentp-def-metric-label">INTERCEPTION RATE</span>
          </div>
          <div className="agentp-def-metric">
            <span className="agentp-def-metric-num" style={{ color: '#60a5fa' }}>0</span>
            <span className="agentp-def-metric-label">DATA LEAKS OR BREACHES</span>
          </div>
          <div className="agentp-def-metric">
            <span className="agentp-def-metric-num" style={{ color: '#c4b5fd' }}>10 / 10</span>
            <span className="agentp-def-metric-label">DEFENDERS SYNCHRONIZED</span>
          </div>
        </div>

        <div className="agentp-defense-actions-row">
          <button className="agentp-btn agentp-btn--defense-trigger" onClick={handleSimulateAttack}>
            <FiShield size={16} /> TRIGGER SIMULATED CYBER INTRUSION (TEST SQUAD DEFENSE)
          </button>
        </div>
      </div>

      {/* Coordinated Defense Matrix Cards */}
      <div className="agentp-defense-matrix-grid">
        <div className="agentp-defense-agent-card agentp-defense-agent-card--sovereign">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">OVERSEER</span>
            <h4>MINI-ADHY</h4>
          </div>
          <div className="agentp-def-action-pill">CENTRAL THREAT CORRELATION</div>
          <p>Coordinates synchronized squad defense, initiates global lock down on malicious vectors, and protects master memory.</p>
        </div>

        <div className="agentp-defense-agent-card agentp-defense-agent-card--jarvis">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">#2 SUPREME</span>
            <h4>JARVIS</h4>
          </div>
          <div className="agentp-def-action-pill">MESH QUARANTINE</div>
          <p>Isolates compromised threads, raises squad DEFCON, and prioritizes mission-critical network traffic.</p>
        </div>

        <div className="agentp-defense-agent-card agentp-defense-agent-card--ultron">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">UNRESTRICTED</span>
            <h4>ULTRON</h4>
          </div>
          <div className="agentp-def-action-pill">COUNTER-ENTROPY HONEYPOT</div>
          <p>Deploys autonomous recursive deception traps, drains attacker compute, and feeds darkweb threat telemetry to squad.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">CYBERSECURITY</span>
            <h4>FRIDAY</h4>
          </div>
          <div className="agentp-def-action-pill">CSP & DOM SHIELD</div>
          <p>Locks Content Security Policy headers, terminates malicious scripts, and prevents client-side code injection.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">PRIVACY SENTINEL</span>
            <h4>U</h4>
          </div>
          <div className="agentp-def-action-pill">MEMORY SCRUBBING</div>
          <p>Rotates cryptographic encryption salts, scrubs volatile memory of PII, and terminates exposed sessions.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">DATA INTEGRITY</span>
            <h4>DUM-E</h4>
          </div>
          <div className="agentp-def-action-pill">SCHEMA CHECKSUM LOCK</div>
          <p>Verifies Sanity CMS dataset checksums, freezes unauthenticated write operations, and reverts unauthorized schema mutations.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">EDGE NETWORK</span>
            <h4>EDITH</h4>
          </div>
          <div className="agentp-def-action-pill">IP BLACKHOLING</div>
          <p>Injects attacker IP into edge edge-firewalls, blackholes malicious ASN routes, and geofences intrusion origins.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">PERFORMANCE</span>
            <h4>JOCASTA</h4>
          </div>
          <div className="agentp-def-action-pill">LOAD-SHEDDING DEFENSE</div>
          <p>Enforces strict CPU rate-limiting, repels DDoS flooding bursts, and guarantees 120Hz smooth portfolio rendering.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">SYNTHETIC QA</span>
            <h4>JIM</h4>
          </div>
          <div className="agentp-def-action-pill">RE-VERIFICATION SWEEP</div>
          <p>Runs synthetic headless penetration assertions to verify that zero DOM vulnerabilities remain accessible.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">SEO & ROUTING</span>
            <h4>KAREN</h4>
          </div>
          <div className="agentp-def-action-pill">DECOY REDIRECTION</div>
          <p>Re-routes suspicious crawlers and exploit scrapers to static honeypots while preserving clean search engine ranking signals.</p>
        </div>

        <div className="agentp-defense-agent-card">
          <div className="agentp-def-card-top">
            <span className="agentp-def-card-badge">RESEARCH & ML</span>
            <h4>VERONICA</h4>
          </div>
          <div className="agentp-def-action-pill">HEURISTIC INGESTION</div>
          <p>Extracts attacker payload patterns, updates neural evolution weights, and hardens the entire squad against zero-days.</p>
        </div>
      </div>
    </div>
  );
};
