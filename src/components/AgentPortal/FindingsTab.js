import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

export const FindingsTab = ({ findings = [], handleTriggerScan }) => {
  return (
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
  );
};
