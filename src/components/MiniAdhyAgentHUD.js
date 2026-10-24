import React, { useState, useEffect } from 'react';
import './MiniAdhyAgentHUD.css';
import { agentOrchestrator } from '../core/agents/AgentOrchestrator';

const MiniAdhyAgentHUD = ({ onClose }) => {
  const [agents, setAgents] = useState([]);
  const [findings, setFindings] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'emotions' | 'findings' | 'report'
  const [weeklyReport, setWeeklyReport] = useState(null);

  const refreshData = () => {
    setAgents(agentOrchestrator.getAgentStatuses());
    setFindings(agentOrchestrator.getFindings());
    setApprovals(agentOrchestrator.getPendingApprovals());
  };

  useEffect(() => {
    refreshData();
    // Auto-run routine check on first open if never run
    if (!agentOrchestrator.lastFullAudit) {
      handleTriggerScan();
    }
  }, []);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    await agentOrchestrator.runFullEcosystemCycle();
    setIsScanning(false);
    refreshData();
  };

  const handleApprove = (id) => {
    agentOrchestrator.approveAction(id);
    refreshData();
  };

  const handleReject = (id) => {
    agentOrchestrator.rejectAction(id);
    refreshData();
  };

  const handleGenerateWeeklyReport = async () => {
    const report = agentOrchestrator.generateWeeklyIntelligenceReport();
    setWeeklyReport(report);
    setActiveTab('report');
  };

  const fridayEmotion = agents.find(a => a.id === 'FRIDAY')?.emotionState || {};
  const jarvisEmotion = agents.find(a => a.id === 'JARVIS')?.emotionState || {};

  return (
    <div className="agent-hud-overlay">
      <div className="agent-hud-modal">
        {/* Header */}
        <div className="agent-hud-header">
          <div className="agent-hud-title-wrap">
            <span className="agent-hud-badge">SUPREME AI ECOSYSTEM</span>
            <h2 className="agent-hud-title">Mini-Adhy Operations Command</h2>
          </div>

          <div className="agent-hud-header-actions">
            <button
              type="button"
              className={`agent-hud-scan-btn ${isScanning ? 'scanning' : ''}`}
              onClick={handleTriggerScan}
              disabled={isScanning}
            >
              {isScanning ? '⚡ RUNNING DIAGNOSTICS...' : '⚡ RUN ALL PROBES'}
            </button>
            <button type="button" className="agent-hud-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="agent-hud-tabs">
          <button
            type="button"
            className={`agent-hud-tab ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            Specialist Agents ({agents.length})
          </button>
          <button
            type="button"
            className={`agent-hud-tab ${activeTab === 'emotions' ? 'active' : ''}`}
            onClick={() => setActiveTab('emotions')}
          >
            Emotion Engines (FRIDAY & JARVIS)
          </button>
          <button
            type="button"
            className={`agent-hud-tab ${activeTab === 'findings' ? 'active' : ''}`}
            onClick={() => setActiveTab('findings')}
          >
            Findings & Telemetry ({findings.length})
          </button>
          <button
            type="button"
            className={`agent-hud-tab ${activeTab === 'report' ? 'active' : ''}`}
            onClick={handleGenerateWeeklyReport}
          >
            Weekly Intelligence Report
          </button>
        </div>

        {/* Content Body */}
        <div className="agent-hud-body">
          {/* TAB 1: Specialist Agents Grid */}
          {activeTab === 'agents' && (
            <div className="agent-cards-grid">
              {agents.map((ag) => (
                <div key={ag.id} className="agent-spec-card">
                  <div className="agent-spec-header">
                    <span className="agent-spec-name">{ag.name}</span>
                    <span className="agent-spec-status active">NOMINAL</span>
                  </div>
                  <p className="agent-spec-title">{ag.title}</p>
                  <div className="agent-spec-footer">
                    <span className="agent-spec-run">
                      Last Check: {ag.lastRun ? new Date(ag.lastRun).toLocaleTimeString() : 'Standby'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Emotion Engines Telemetry */}
          {activeTab === 'emotions' && (
            <div className="agent-emotions-section">
              {/* FRIDAY */}
              <div className="emotion-box">
                <div className="emotion-box-header">
                  <h3>FRIDAY: Active Defense Emotion Profile</h3>
                  <span className="emotion-mode-tag">{fridayEmotion.regulationMode || 'composed'}</span>
                </div>
                <div className="emotion-meters">
                  <div className="emotion-meter">
                    <span>Love / Dedication</span>
                    <div className="meter-track"><div className="meter-fill" style={{ width: `${(fridayEmotion.love || 0.65) * 100}%` }} /></div>
                  </div>
                  <div className="emotion-meter">
                    <span>Care / User Trust</span>
                    <div className="meter-track"><div className="meter-fill" style={{ width: `${(fridayEmotion.care || 0.85) * 100}%` }} /></div>
                  </div>
                  <div className="emotion-meter">
                    <span>Vigilance (Threat Readiness)</span>
                    <div className="meter-track"><div className="meter-fill" style={{ width: `${(fridayEmotion.vigilance || 0.7) * 100}%` }} /></div>
                  </div>
                  <div className="emotion-meter">
                    <span>Urgency</span>
                    <div className="meter-track"><div className="meter-fill alert" style={{ width: `${(fridayEmotion.urgency || 0.2) * 100}%` }} /></div>
                  </div>
                  <div className="emotion-meter">
                    <span>Confidence (Evidence-based)</span>
                    <div className="meter-track"><div className="meter-fill green" style={{ width: `${(fridayEmotion.confidence || 0.85) * 100}%` }} /></div>
                  </div>
                </div>
              </div>

              {/* JARVIS */}
              <div className="emotion-box">
                <div className="emotion-box-header">
                  <h3>JARVIS: Strategic Operations Emotion Profile</h3>
                  <span className="emotion-mode-tag">{jarvisEmotion.regulationMode || 'serene'}</span>
                </div>
                <div className="emotion-meters">
                  <div className="emotion-meter">
                    <span>Calmness</span>
                    <div className="meter-track"><div className="meter-fill blue" style={{ width: `${(jarvisEmotion.calmness || 0.88) * 100}%` }} /></div>
                  </div>
                  <div className="emotion-meter">
                    <span>Curiosity (Anomaly Probing)</span>
                    <div className="meter-track"><div className="meter-fill" style={{ width: `${(jarvisEmotion.curiosity || 0.6) * 100}%` }} /></div>
                  </div>
                  <div className="emotion-meter">
                    <span>Concern</span>
                    <div className="meter-track"><div className="meter-fill alert" style={{ width: `${(jarvisEmotion.concern || 0.15) * 100}%` }} /></div>
                  </div>
                  <div className="emotion-meter">
                    <span>Coordination Load</span>
                    <div className="meter-track"><div className="meter-fill" style={{ width: `${(jarvisEmotion.coordinationLoad || 0.3) * 100}%` }} /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Findings & Pending Approvals */}
          {activeTab === 'findings' && (
            <div className="agent-findings-section">
              {approvals.length > 0 && (
                <div className="approvals-group">
                  <h4>Pending Owner Authorizations ({approvals.length})</h4>
                  {approvals.map((appr) => (
                    <div key={appr.id} className="approval-card">
                      <div className="approval-info">
                        <strong>[{appr.agentId}]</strong> {appr.operationName}
                      </div>
                      <div className="approval-buttons">
                        <button type="button" className="btn-approve" onClick={() => handleApprove(appr.id)}>Approve</button>
                        <button type="button" className="btn-reject" onClick={() => handleReject(appr.id)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="findings-list">
                <h4>Verified Agent Findings & Audit Trail</h4>
                {findings.length === 0 ? (
                  <p className="no-findings">Zero anomalies detected. Run probes to update telemetry.</p>
                ) : (
                  findings.map((f) => (
                    <div key={f.id} className={`finding-item severity-${f.severity}`}>
                      <div className="finding-header">
                        <span className="finding-agent">[{f.agent}]</span>
                        <span className={`finding-sev sev-${f.severity}`}>{f.severity.toUpperCase()}</span>
                        <span className="finding-time">{new Date(f.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="finding-summary">{f.summary}</p>
                      {f.recommendedAction !== 'None' && (
                        <div className="finding-recom">
                          <em>Action:</em> {f.recommendedAction}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Weekly Intelligence Report */}
          {activeTab === 'report' && (
            <div className="agent-report-section">
              {weeklyReport ? (
                <div className="report-paper">
                  <div className="report-top">
                    <h3>{weeklyReport.coordinator}</h3>
                    <span className="report-health">{weeklyReport.ecosystemHealth}</span>
                  </div>
                  <p className="report-period">{weeklyReport.reportingPeriod}</p>
                  <hr />
                  <h4>Summary</h4>
                  <p>{weeklyReport.summary.criticalCount === 0 ? 'All 10 specialist agents reported optimal status. Zero critical findings.' : 'Review critical items below.'}</p>

                  <h4>Recommendations</h4>
                  <ul>
                    {weeklyReport.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>

                  <h4>Agent Roster & Health</h4>
                  <div className="report-roster-grid">
                    {weeklyReport.agentStatuses.map((a) => (
                      <div key={a.id} className="roster-pill">
                        <strong>{a.name}</strong>: {a.title}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>Generating report...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniAdhyAgentHUD;
