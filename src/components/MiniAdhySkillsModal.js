import React, { useState } from 'react';
import { MINI_ADHY_SKILLS, executeSkillCommand } from '../core/MiniAdhySkills';

export default function MiniAdhySkillsModal({ onClose }) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [lastFeedback, setLastFeedback] = useState(null);

  const categories = ['ALL', ...new Set(MINI_ADHY_SKILLS.map(s => s.category))];

  const filteredSkills = activeCategory === 'ALL'
    ? MINI_ADHY_SKILLS
    : MINI_ADHY_SKILLS.filter(s => s.category === activeCategory);

  const handleTestSkill = (skill) => {
    const res = executeSkillCommand(skill.command, 'test');
    setLastFeedback({
      name: skill.name,
      output: res.output || (res.success ? 'Executed successfully' : res.error)
    });
    setTimeout(() => setLastFeedback(null), 4000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(5, 5, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0a0d14',
        border: '2px solid #22c55e',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(34, 197, 94, 0.2)',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(34, 197, 94, 0.05)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>⚡</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4ade80' }}>
                Mini-Adhy Cognitive AI Skills Engine
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', fontFamily: "'Fira Code', monospace", color: '#94a3b8' }}>
              18 Modular Autonomous Capabilities Installed & Active in Digital Twin Architecture
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Category Filters */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          overflowX: 'auto',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? '#22c55e' : 'rgba(255, 255, 255, 0.05)',
                color: activeCategory === cat ? '#000' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live execution toast */}
        {lastFeedback && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.2)',
            borderLeft: '4px solid #22c55e',
            padding: '8px 24px',
            fontFamily: "'Fira Code', monospace",
            fontSize: '0.72rem',
            color: '#86efac'
          }}>
            ▶ [SKILL TRIGGERED: {lastFeedback.name}] → {lastFeedback.output}
          </div>
        )}

        {/* Skills Grid */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px',
          flex: 1
        }}>
          {filteredSkills.map(skill => (
            <div
              key={skill.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{skill.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9' }}>{skill.name}</span>
                  </div>
                  <span style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: '0.62rem',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    {skill.category}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {skill.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <code style={{ fontSize: '0.65rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  [CMD:{skill.command}]
                </code>
                <button
                  onClick={() => handleTestSkill(skill)}
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ade80',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Test Skill
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#64748b'
        }}>
          <span>Active Architecture: Antigravity Cognitive Kernel 2.0</span>
          <span>Status: 18/18 Neural Skills Operational</span>
        </div>
      </div>
    </div>
  );
}
