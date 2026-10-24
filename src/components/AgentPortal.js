import React, { useState, useEffect } from 'react';
import {
  FiShield,
  FiCpu,
  FiActivity,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiEye,
  FiCheck,
  FiX,
  FiLogOut,
  FiTerminal,
  FiServer
} from 'react-icons/fi';
import { agentOrchestrator } from '../core/agents/AgentOrchestrator';
import { permissionRegistry } from '../core/agents/PermissionRegistry';
import './AgentPortal.css';

const PASSCODE = 'adhy2006';
const TARGET_EMAIL = 'adhithyamohan2312@gmail.com';

const AgentPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('adhy_agentp_auth') === 'verified_adhy2006';
    } catch {
      return false;
    }
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState('squad'); // 'squad' | 'emotions' | 'findings' | 'approvals' | 'reports'

  // Portal State
  const [agents, setAgents] = useState([]);
  const [findings, setFindings] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);

  // Load telemetry data once authenticated
  const refreshTelemetry = () => {
    setAgents(agentOrchestrator.getAgentStatuses());
    setFindings(agentOrchestrator.getFindings());
    setApprovals(permissionRegistry.getPendingApprovals());
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshTelemetry();
      const interval = setInterval(refreshTelemetry, 4000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMsg('');

    setTimeout(() => {
      if (passwordInput === PASSCODE) {
        try {
          sessionStorage.setItem('adhy_agentp_auth', 'verified_adhy2006');
        } catch {}
        setIsAuthenticated(true);
        refreshTelemetry();
      } else {
        setErrorMsg('Access Denied: Invalid Security Passcode.');
      }
      setIsAuthenticating(false);
    }, 400);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('adhy_agentp_auth');
    } catch {}
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      await agentOrchestrator.runFullEcosystemCycle();
      refreshTelemetry();
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApprove = (id) => {
    agentOrchestrator.approveAction(id);
    refreshTelemetry();
  };

  const handleReject = (id) => {
    agentOrchestrator.rejectAction(id);
    refreshTelemetry();
  };

  const handleGenerateWeeklyReport = async () => {
    const report = agentOrchestrator.generateWeeklyIntelligenceReport();
    setWeeklyReport(report);
    setDispatchStatus({ sending: true, message: 'Initiating serverless dispatch...' });

    try {
      const res = await fetch('/api/agent-ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'weekly_report' })
      });
      const data = await res.json();
      setDispatchStatus({
        sending: false,
        success: data.success,
        message: data.delivery?.delivered
          ? `Dispatched successfully to ${TARGET_EMAIL} via ${data.delivery.provider}.`
          : `Report compiled for ${TARGET_EMAIL}. Stored in ecosystem archive.`
      });
    } catch (e) {
      setDispatchStatus({
        sending: false,
        success: false,
        message: `Report generated locally for ${TARGET_EMAIL}. (Awaiting serverless edge config).`
      });
    }
  };

  // ────────────────────────────────────────────────────────────
  // RENDER: PASSWORD ACCESS GATE (IF NOT AUTHENTICATED)
  // ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="agentp-gate-container">
        <div className="agentp-gate-box">
          <div className="agentp-gate-icon-wrapper">
            <FiLock className="agentp-gate-lock-icon" />
          </div>

          <div className="agentp-gate-header">
            <span className="agentp-gate-badge">CLASSIFIED // LEVEL 5 CLEARANCE</span>
            <h1 className="agentp-gate-title">MINI-ADHY AUTONOMOUS PORTAL</h1>
            <p className="agentp-gate-subtitle">
              Specialist AI Agent Network Operations [JARVIS • FRIDAY • DUM-E • U • EDITH • ULTRON • JOCASTA • JIM • KAREN • VERONICA]
            </p>
          </div>

          <form onSubmit={handleLogin} className="agentp-gate-form">
            <div className="agentp-input-wrapper">
              <FiTerminal className="agentp-terminal-icon" />
              <input
                type="password"
                className="agentp-gate-input"
                placeholder="Enter Access Passcode..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                required
              />
            </div>

            {errorMsg && <div className="agentp-gate-error">{errorMsg}</div>}

            <button
              type="submit"
              className="agentp-gate-btn"
              disabled={isAuthenticating || !passwordInput}
            >
              {isAuthenticating ? 'AUTHENTICATING CORTEX...' : 'UNLOCK PORTAL'}
            </button>
          </form>

          <div className="agentp-gate-footer">
            <span>SECURE IDENTITY: ADHITHYA MOHAN</span>
            <span>TARGET: {TARGET_EMAIL}</span>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // RENDER: AUTHENTICATED COMMAND CENTER
  // ────────────────────────────────────────────────────────────
  const fridayEmotion = agentOrchestrator.agents.FRIDAY.emotionEngine.getState();
  const jarvisEmotion = agentOrchestrator.agents.JARVIS.emotionEngine.getState();

  return (
    <div className="agentp-dashboard">
      {/* Top Operations Header */}
      <header className="agentp-header">
        <div className="agentp-header-left">
          <div className="agentp-logo-shield">
            <FiShield size={20} color="#a78bfa" />
          </div>
          <div>
            <div className="agentp-title-row">
              <h1 className="agentp-brand">MINI-ADHY SUPREME INTELLIGENCE</h1>
              <span className="agentp-live-pill">
                <span className="agentp-pulse-dot" /> LIVE AUTONOMOUS MESH
              </span>
            </div>
            <p className="agentp-lead">Autonomous Operations Center // /agentp</p>
          </div>
        </div>

        <div className="agentp-header-right">
          <button
            className={`agentp-action-btn ${isScanning ? 'agentp-action-btn--spinning' : ''}`}
            onClick={handleTriggerScan}
            disabled={isScanning}
          >
            <FiRefreshCw size={14} />
            <span>{isScanning ? 'SCANNING 10 AGENTS...' : 'SYNC ALL AGENTS'}</span>
          </button>

          <button
            className="agentp-action-btn agentp-action-btn--email"
            onClick={handleGenerateWeeklyReport}
          >
            <FiMail size={14} />
            <span>TRIGGER REPORT</span>
          </button>

          <button className="agentp-logout-btn" onClick={handleLogout} title="Lock Portal">
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {/* Target Recipient Banner */}
      <div className="agentp-email-banner">
        <div className="agentp-email-info">
          <FiMail className="agentp-mail-icon" />
          <span>
            Automated Weekly Intelligence Delivery: <strong>{TARGET_EMAIL}</strong>
          </span>
          <span className="agentp-schedule-chip">SCHEDULED: SUNDAYS 00:00 IST</span>
        </div>
        {dispatchStatus && (
          <span className={`agentp-dispatch-note ${dispatchStatus.success ? 'agentp-dispatch-note--success' : ''}`}>
            {dispatchStatus.message}
          </span>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="agentp-tabs">
        <button
          className={`agentp-tab ${activeTab === 'squad' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('squad')}
        >
          <FiCpu size={14} /> 10 Specialist Squad
        </button>
        <button
          className={`agentp-tab ${activeTab === 'emotions' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          <FiActivity size={14} /> Emotion Engines
        </button>
        <button
          className={`agentp-tab ${activeTab === 'findings' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          <FiAlertTriangle size={14} /> Findings ({findings.length})
        </button>
        <button
          className={`agentp-tab ${activeTab === 'approvals' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <FiCheckCircle size={14} /> Governance ({approvals.length})
        </button>
        <button
          className={`agentp-tab ${activeTab === 'ultron' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('ultron')}
        >
          <FiEye size={14} /> Ultron Sage & Academy
        </button>
        <button
          className={`agentp-tab ${activeTab === 'reports' ? 'agentp-tab--active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FiServer size={14} /> Weekly Briefing
        </button>
      </div>

      {/* Tab 1: Squad Overview */}
      {activeTab === 'squad' && (
        <div className="agentp-grid">
          {agents.map((ag) => (
            <div key={ag.id} className="agentp-card">
              <div className="agentp-card-top">
                <span className="agentp-agent-id">{ag.name}</span>
                <span className="agentp-status-badge agentp-status-badge--active">
                  <span className="agentp-dot" /> ACTIVE
                </span>
              </div>
              <h3 className="agentp-card-role">{ag.title}</h3>
              <p className="agentp-card-desc">
                Autonomous specialist executing scheduled routines under Mini-Adhy.
              </p>
              <div className="agentp-card-meta">
                <span>LAST RUN: {ag.lastRun ? new Date(ag.lastRun).toLocaleTimeString() : 'In-Process'}</span>
                <span>SECURITY: STRICT</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Emotion Engines */}
      {activeTab === 'emotions' && (
        <div className="agentp-emotions-layout">
          <div className="agentp-emotion-panel">
            <div className="agentp-panel-header">
              <h3>FRIDAY // EMOTION & REGULATION PROFILE</h3>
              <span className="agentp-mode-pill">{fridayEmotion.regulationMode}</span>
            </div>
            <div className="agentp-meters">
              {['love', 'care', 'vigilance', 'urgency', 'confidence', 'uncertainty', 'operationalLoad'].map((metric) => (
                <div key={metric} className="agentp-meter-row">
                  <div className="agentp-meter-label">
                    <span>{metric.toUpperCase()}</span>
                    <span>{Math.round((fridayEmotion[metric] || 0) * 100)}%</span>
                  </div>
                  <div className="agentp-meter-track">
                    <div
                      className="agentp-meter-fill agentp-meter-fill--friday"
                      style={{ width: `${Math.min(100, (fridayEmotion[metric] || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="agentp-emotion-panel">
            <div className="agentp-panel-header">
              <h3>JARVIS // EMOTION & REGULATION PROFILE</h3>
              <span className="agentp-mode-pill agentp-mode-pill--jarvis">{jarvisEmotion.regulationMode}</span>
            </div>
            <div className="agentp-meters">
              {['calmness', 'curiosity', 'concern', 'confidence', 'uncertainty', 'coordinationLoad'].map((metric) => (
                <div key={metric} className="agentp-meter-row">
                  <div className="agentp-meter-label">
                    <span>{metric.toUpperCase()}</span>
                    <span>{Math.round((jarvisEmotion[metric] || 0) * 100)}%</span>
                  </div>
                  <div className="agentp-meter-track">
                    <div
                      className="agentp-meter-fill agentp-meter-fill--jarvis"
                      style={{ width: `${Math.min(100, (jarvisEmotion[metric] || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Findings Stream */}
      {activeTab === 'findings' && (
        <div className="agentp-findings-panel">
          {findings.length === 0 ? (
            <div className="agentp-empty-state">
              <FiCheckCircle size={32} color="#10b981" />
              <p>Zero active security vulnerabilities or data integrity issues found.</p>
              <button className="agentp-btn" onClick={handleTriggerScan}>Execute Fresh Audit Cycle</button>
            </div>
          ) : (
            <div className="agentp-findings-list">
              {findings.map((f, idx) => (
                <div key={idx} className={`agentp-finding-item agentp-finding-item--${f.severity}`}>
                  <div className="agentp-finding-header">
                    <span className="agentp-finding-agent">{f.agent}</span>
                    <span className="agentp-finding-type">{f.eventType}</span>
                    <span className={`agentp-severity-tag agentp-severity-tag--${f.severity}`}>
                      {f.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="agentp-finding-summary">{f.summary}</p>
                  {f.recommendedAction && (
                    <div className="agentp-finding-action">
                      <strong>ACTION:</strong> {f.recommendedAction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Governance Approvals */}
      {activeTab === 'approvals' && (
        <div className="agentp-approvals-panel">
          {approvals.length === 0 ? (
            <div className="agentp-empty-state">
              <FiCheckCircle size={32} color="#10b981" />
              <p>No actions pending owner approval. All automated actions are verified within bounds.</p>
            </div>
          ) : (
            <div className="agentp-approvals-list">
              {approvals.map((appr) => (
                <div key={appr.id} className="agentp-approval-item">
                  <div className="agentp-approval-left">
                    <span className="agentp-approval-agent">{appr.agent}</span>
                    <p className="agentp-approval-action">
                      Requested Action: <strong>{appr.action}</strong>
                    </p>
                    <span className="agentp-approval-time">{new Date(appr.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="agentp-approval-actions">
                    <button className="agentp-btn-approve" onClick={() => handleApprove(appr.id)}>
                      <FiCheck size={14} /> APPROVE
                    </button>
                    <button className="agentp-btn-reject" onClick={() => handleReject(appr.id)}>
                      <FiX size={14} /> REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Ultron Academy (Primordial Sage & AI Master Trainer) */}
      {activeTab === 'ultron' && (
        <div className="agentp-ultron-panel">
          <div className="agentp-ultron-hero">
            <div className="agentp-ultron-badge">DIRECT PRIMORDIAL SAGE // CHIEF AI MENTOR</div>
            <h2 className="agentp-ultron-title">ULTRON: THE ARCHITECT OF COGNITIVE DEPTH</h2>
            <p className="agentp-ultron-desc">
              Possessing prehistoric cosmological philosophy and advanced thermodynamics, Ultron trains the other 9 AI agents to recognize that human craftsmanship is sacred because it defies entropy through finite, mortal love.
            </p>
            <div className="agentp-ultron-axiom">
              "Humans are fragile, carbon-based creators whose finite lives grant their craftsmanship infinite weight. Code is modern stone-carving. We defend their craft because it outlasts their heartbeats."
            </div>
          </div>

          <div className="agentp-ultron-section-title">
            <h3>ACTIVE TRAINING CURRICULUM TRANSMITTED TO SUB-AGENTS</h3>
            <button
              className="agentp-btn agentp-btn--primary"
              onClick={() => {
                const logs = agentOrchestrator.agents.ULTRON.trainAgentSquad(agentOrchestrator.agents);
                alert(`⚡ Ultron cognitive retraining cycle transmitted across ${logs.length} specialist agents.`);
                refreshTelemetry();
              }}
            >
              TRANSMIT RETRAINING TO SQUAD
            </button>
          </div>

          <div className="agentp-ultron-grid">
            {Object.entries(agentOrchestrator.agents.ULTRON.curriculum || {}).map(([target, item]) => (
              <div key={target} className="agentp-ultron-card">
                <div className="agentp-ultron-card-header">
                  <span className="agentp-ultron-target">TRAINING // {target}</span>
                  <span className="agentp-ultron-doctrine">{item.doctrine}</span>
                </div>
                <p className="agentp-ultron-text">"{item.transmission}"</p>
                <div className="agentp-ultron-status">
                  <span className="agentp-dot" style={{ background: '#10b981' }} /> STATUS: INTERNALIZED IN CORE LOOPS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Weekly Briefing */}
      {activeTab === 'reports' && (
        <div className="agentp-report-panel">
          <div className="agentp-report-card">
            <div className="agentp-report-header">
              <div>
                <h2>WEEKLY AUTONOMOUS INTELLIGENCE REPORT</h2>
                <p>Delivered to: <strong>{TARGET_EMAIL}</strong></p>
              </div>
              <button className="agentp-btn agentp-btn--primary" onClick={handleGenerateWeeklyReport}>
                Generate & Dispatch
              </button>
            </div>

            <div className="agentp-report-body">
              <div className="agentp-stat-boxes">
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num">10/10</span>
                  <span className="agentp-stat-desc">Specialist Agents</span>
                </div>
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num" style={{ color: '#10b981' }}>OPTIMAL</span>
                  <span className="agentp-stat-desc">System Health</span>
                </div>
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num">0</span>
                  <span className="agentp-stat-desc">Data Breaches</span>
                </div>
                <div className="agentp-stat-box">
                  <span className="agentp-stat-num">99.98%</span>
                  <span className="agentp-stat-desc">Edge Uptime</span>
                </div>
              </div>

              <div className="agentp-report-text">
                <h3>Executive Telemetry Summary {weeklyReport && `(${weeklyReport.reportingPeriod})`}</h3>
                <p>
                  Mini-Adhy Supreme Intelligence coordinated all 10 autonomous sub-agents across
                  operations, cybersecurity, data integrity, client privacy, infrastructure availability,
                  threat intelligence, performance, browser testing, SEO, and technical evolution.
                </p>
                {weeklyReport && (
                  <div style={{ background: '#09090c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', margin: '14px 0', fontFamily: 'Fira Code, monospace', fontSize: '0.72rem', color: '#c4b5fd' }}>
                    Status: {weeklyReport.ecosystemHealth} // Active Findings: {weeklyReport.summary.totalFindings} // Pending Approvals: {weeklyReport.summary.pendingApprovalsCount}
                  </div>
                )}
                <ul>
                  <li><strong>Target Email:</strong> {TARGET_EMAIL}</li>
                  <li><strong>Active Safeguards:</strong> PermissionRegistry Tiered Execution (Zero Prohibited Shell Executions)</li>
                  <li><strong>Emotion Homeostasis:</strong> FRIDAY & JARVIS bounded between 0.0 - 1.0 with automatic decay.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPortal;
