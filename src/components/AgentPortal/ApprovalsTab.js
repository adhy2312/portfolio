import React from 'react';
import { FiShield, FiCheckCircle, FiCheck, FiX } from 'react-icons/fi';

export const ApprovalsTab = ({
  approvals = [],
  pendingMemories = [],
  handleApprove,
  handleReject,
  handleApproveMemory,
  handleRejectMemory
}) => {
  return (
    <div className="agentp-approvals-panel">
      <div className="agentp-approval-notice">
        <FiShield color="#00f5d4" size={16} />
        <span>
          <strong>GOVERNANCE POLICY:</strong> All consequential state mutations, code improvisations, and imported memory candidates require verified owner authorization. No unverified records or unapproved commands execute silently.
        </span>
      </div>

      {/* Section 1: Operational Action Approvals */}
      <h3 style={{ color: '#f1f5f9', fontSize: '1rem', marginTop: '20px', marginBottom: '10px' }}>
        Action Execution Requests ({approvals.length})
      </h3>
      {approvals.length === 0 ? (
        <div className="agentp-empty-state">
          <FiCheckCircle size={28} color="#10b981" />
          <p>No operational actions pending owner approval.</p>
        </div>
      ) : (
        <div className="agentp-approvals-list">
          {approvals.map((appr) => (
            <div key={appr.id} className="agentp-approval-item">
              <div className="agentp-approval-left">
                <span className="agentp-approval-agent">{appr.agent}</span>
                <p className="agentp-approval-action">
                  Requested Action: <strong>{appr.operationName}</strong>
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

      {/* Section 2: Memory Candidate Approvals */}
      <h3 style={{ color: '#f1f5f9', fontSize: '1rem', marginTop: '30px', marginBottom: '10px' }}>
        Memory Records Pending Approval ({pendingMemories.length})
      </h3>
      {pendingMemories.length === 0 ? (
        <div className="agentp-empty-state">
          <FiCheckCircle size={28} color="#10b981" />
          <p>No memory records pending owner approval. All canonical memory entries are verified.</p>
        </div>
      ) : (
        <div className="agentp-approvals-list">
          {pendingMemories.map((mem) => (
            <div key={mem.id} className="agentp-approval-item" style={{ borderLeft: '3px solid #8b5cf6' }}>
              <div className="agentp-approval-left">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="agentp-approval-agent" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                    {mem.category || 'MEMORY_CANDIDATE'}
                  </span>
                  {mem.confidence !== undefined && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Confidence: {Math.round(mem.confidence * 100)}%
                    </span>
                  )}
                  {mem.sensitivity && (
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                      [{mem.sensitivity}]
                    </span>
                  )}
                </div>
                <p className="agentp-approval-action" style={{ fontSize: '0.88rem', color: '#e2e8f0', margin: '4px 0' }}>
                  {mem.content}
                </p>
                <span className="agentp-approval-time">
                  Source: {mem.source || 'Interaction'} • {new Date(mem.importedAt || mem.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
              <div className="agentp-approval-actions">
                <button className="agentp-btn-approve" onClick={() => handleApproveMemory(mem.id)}>
                  <FiCheck size={14} /> APPROVE
                </button>
                <button className="agentp-btn-reject" onClick={() => handleRejectMemory(mem.id)}>
                  <FiX size={14} /> REJECT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
