import React, { useEffect, useState } from 'react';
import './DreamStateLoader.css';
import ns from '../core/NervousSystem';

export default function DreamStateLoader({ onAwake }) {
  const [phase, setPhase] = useState(0); // 0: Sleeping, 1: Waking, 2: Awake
  const [dreamLog, setDreamLog] = useState('');

  useEffect(() => {
    // Generate poetic dream log based on ML persona
    const echoes = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
    const totalVisits = echoes.totalVisits || 1;
    
    const logs = [
      `reconstructing memory fragments... [${totalVisits}]`,
      `the architecture remembers the silence.`,
      `compiling subconscious subroutines...`,
      `synaptic connection restored.`
    ];
    
    setDreamLog(logs[Math.floor(Math.random() * logs.length)]);

    // V30: 3 Second Wake-up Phase
    const t1 = setTimeout(() => setPhase(1), 2000);
    const t2 = setTimeout(() => {
      setPhase(2);
      ns.emit('DREAM_STATE_END');
      if (onAwake) onAwake();
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onAwake]);

  if (phase === 2) return null;

  return (
    <div className={`dream-state-overlay phase-${phase}`}>
      <div className="dream-content">
        <div className="glitch-text" data-text="AWA_KENING">AWA_KENING</div>
        <div className="dream-log">{dreamLog}</div>
      </div>
      <div className="scan-line"></div>
    </div>
  );
}
