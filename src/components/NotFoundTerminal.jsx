import React, { useState, useRef, useEffect } from 'react';
import { FiArrowLeft, FiCpu, FiTerminal } from 'react-icons/fi';
import './NotFoundTerminal.css';

const HELP_TEXT = [
  'Available commands:',
  '  help      — show available commands',
  '  whoami    — print Adhithya Mohan dossier',
  '  ls        — list valid portfolio routes',
  '  ping      — check adhy.tech latency',
  '  clear     — clear terminal buffer',
  '  cd /      — return to main portfolio',
];

export default function NotFoundTerminal({ path, onGoHome, onOpenAgentPortal }) {
  const cleanPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/unknown');
  const [history, setHistory] = useState([
    { type: 'cmd', text: `adhy@mbcet-lab:~$ resolve --route "${cleanPath}"` },
    { type: 'err', text: 'ERR_ROUTE_UNMAPPED // 404: Identity not found.' },
    { type: 'muted', text: 'Scanned React Router, Sanity CMS, and ESP32 telemetry nodes — 0 matching routes.' },
    { type: 'info', text: 'Type "help" for commands, or "cd /" to return home.' },
  ]);
  const [cmd, setCmd] = useState('');
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  const runCommand = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const next = [{ type: 'cmd', text: `adhy@mbcet-lab:~$ ${trimmed}` }];

    if (lower === 'help') {
      HELP_TEXT.forEach((line) => next.push({ type: 'info', text: line }));
    } else if (lower === 'whoami') {
      next.push({ type: 'accent', text: 'Adhithya Mohan — Full-Stack Dev · ECE Engineer · Media Secretary @ MBCET Senate · Co-Founder @ Finance Club' });
    } else if (lower === 'ls') {
      next.push({ type: 'info', text: 'drwxr-xr-x   /           (Main Portfolio)' });
      next.push({ type: 'info', text: 'drwxr-xr-x   /agentp     (10-Agent Portal)' });
      next.push({ type: 'info', text: '-rw-r--r--   /#works     (Featured Projects)' });
      next.push({ type: 'info', text: '-rw-r--r--   /#skills    (Precision Dial & Capabilities)' });
    } else if (lower === 'ping') {
      next.push({ type: 'accent', text: '64 bytes from adhy.tech (IST Asia/Kolkata): icmp_seq=1 ttl=64 time=1.4 ms' });
    } else if (lower === 'clear') {
      setHistory([]);
      setCmd('');
      return;
    } else if (lower === 'cd /' || lower === 'home' || lower === 'exit') {
      onGoHome?.();
      return;
    } else if (lower === 'cd /agentp' || lower === 'agentp') {
      onOpenAgentPortal?.();
      return;
    } else {
      next.push({ type: 'err', text: `zsh: command not found: ${trimmed}. Try "help" or "cd /".` });
    }

    setHistory((prev) => [...prev, ...next]);
    setCmd('');
  };

  return (
    <main className="nf-shell" onClick={() => inputRef.current?.focus()}>
      <div className="nf-card">
        <div className="nf-titlebar">
          <div className="nf-dots" aria-hidden="true">
            <span className="nf-dot nf-dot--red" />
            <span className="nf-dot nf-dot--amber" />
            <span className="nf-dot nf-dot--green" />
          </div>
          <span className="nf-titlebar-text">
            <FiTerminal size={12} /> adhy@mbcet-lab — zsh — 404
          </span>
          <span className="nf-status-pill">404 // UNMAPPED</span>
        </div>

        <div className="nf-hero-band">
          <p className="nf-code">404</p>
          <h1 className="nf-heading">404: Identity not found</h1>
          <p className="nf-sub">
            The route <code>{cleanPath}</code> doesn’t exist in this build — maybe it’s still on Adhy’s workbench or never shipped.
          </p>
        </div>

        <div className="nf-terminal" ref={bodyRef}>
          {history.map((line, i) => (
            <div key={i} className={`nf-line nf-line--${line.type}`}>
              {line.text}
            </div>
          ))}

          <form
            className="nf-prompt-row"
            onSubmit={(e) => {
              e.preventDefault();
              runCommand(cmd);
            }}
          >
            <span className="nf-prompt-prefix">adhy@mbcet-lab:~$</span>
            <input
              ref={inputRef}
              type="text"
              className="nf-prompt-input"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="type 'help' or 'cd /'..."
              aria-label="Terminal command input"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        </div>

        <div className="nf-actions">
          <button type="button" className="nf-btn nf-btn--primary" onClick={onGoHome}>
            <FiArrowLeft size={14} /> cd / (Return Home)
          </button>
          <button type="button" className="nf-btn" onClick={onOpenAgentPortal}>
            <FiCpu size={14} /> open /agentp
          </button>
          {['whoami', 'ls', 'ping'].map((quick) => (
            <button
              key={quick}
              type="button"
              className="nf-btn nf-btn--ghost"
              onClick={(e) => {
                e.stopPropagation();
                runCommand(quick);
              }}
            >
              $ {quick}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

