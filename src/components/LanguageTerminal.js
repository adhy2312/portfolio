import React, { useState, useEffect, useRef } from 'react';
import './LanguageTerminal.css';

const SNIPPETS = [
  {
    lang: 'Python',
    color: '#3B82F6',
    badge: '🐍 Python',
    lines: [
      { tokens: [{ text: 'def ', c: 'kw' }, { text: 'greet', c: 'fn' }, { text: '(name):', c: 'def' }] },
      { tokens: [{ text: '    ', c: 'plain' }, { text: 'return ', c: 'kw' }, { text: 'f"Hello, {name}! 🌍"', c: 'str' }] },
      { tokens: [{ text: '', c: 'plain' }] },
      { tokens: [{ text: 'print', c: 'fn' }, { text: '(', c: 'plain' }, { text: 'greet', c: 'fn' }, { text: '(', c: 'plain' }, { text: '"Adhy"', c: 'str' }, { text: '))', c: 'plain' }] },
    ],
  },
  {
    lang: 'JavaScript',
    color: '#F59E0B',
    badge: '⚡ JavaScript',
    lines: [
      { tokens: [{ text: 'const ', c: 'kw' }, { text: 'build ', c: 'fn' }, { text: '= async () => {', c: 'plain' }] },
      { tokens: [{ text: '  const ', c: 'kw' }, { text: 'dream ', c: 'def' }, { text: '= ', c: 'plain' }, { text: 'await ', c: 'kw' }, { text: 'ship()', c: 'fn' }, { text: ';', c: 'plain' }] },
      { tokens: [{ text: '  ', c: 'plain' }, { text: 'console', c: 'fn' }, { text: '.log(', c: 'plain' }, { text: '`✨ ${dream}`', c: 'str' }, { text: ');', c: 'plain' }] },
      { tokens: [{ text: '};', c: 'plain' }] },
    ],
  },
  {
    lang: 'C++',
    color: '#06B6D4',
    badge: '🔷 C++',
    lines: [
      { tokens: [{ text: '#include ', c: 'kw' }, { text: '<iostream>', c: 'str' }] },
      { tokens: [{ text: '', c: 'plain' }] },
      { tokens: [{ text: 'int ', c: 'kw' }, { text: 'main', c: 'fn' }, { text: '() {', c: 'plain' }] },
      { tokens: [{ text: '  std::', c: 'def' }, { text: 'cout ', c: 'fn' }, { text: '<< ', c: 'plain' }, { text: '"Compiling dreams 🔥"', c: 'str' }, { text: ';', c: 'plain' }] },
    ],
  },
  {
    lang: 'Rust',
    color: '#EF4444',
    badge: '🦀 Rust',
    lines: [
      { tokens: [{ text: 'fn ', c: 'kw' }, { text: 'main', c: 'fn' }, { text: '() {', c: 'plain' }] },
      { tokens: [{ text: '  let ', c: 'kw' }, { text: 'stack ', c: 'def' }, { text: '= ', c: 'plain' }, { text: '"blazing fast 🚀"', c: 'str' }, { text: ';', c: 'plain' }] },
      { tokens: [{ text: '  ', c: 'plain' }, { text: 'println!', c: 'fn' }, { text: '(', c: 'plain' }, { text: '"{}"', c: 'str' }, { text: ', stack);', c: 'plain' }] },
      { tokens: [{ text: '}', c: 'plain' }] },
    ],
  },
  {
    lang: 'Arduino',
    color: '#10B981',
    badge: '🔌 Arduino',
    lines: [
      { tokens: [{ text: 'void ', c: 'kw' }, { text: 'setup', c: 'fn' }, { text: '() {', c: 'plain' }] },
      { tokens: [{ text: '  Serial.', c: 'def' }, { text: 'begin', c: 'fn' }, { text: '(', c: 'plain' }, { text: '9600', c: 'num' }, { text: ');', c: 'plain' }] },
      { tokens: [{ text: '  Serial.', c: 'def' }, { text: 'println', c: 'fn' }, { text: '(', c: 'plain' }, { text: '"IoT is life 🛜"', c: 'str' }, { text: ');', c: 'plain' }] },
      { tokens: [{ text: '}', c: 'plain' }] },
    ],
  },
  {
    lang: 'Bash',
    color: '#8B5CF6',
    badge: '🖥️ Bash',
    lines: [
      { tokens: [{ text: '#!/bin/bash', c: 'def' }] },
      { tokens: [{ text: '', c: 'plain' }] },
      { tokens: [{ text: 'adhy', c: 'fn' }, { text: '() {', c: 'plain' }] },
      { tokens: [{ text: '  echo ', c: 'kw' }, { text: '"Always shipping 🚀"', c: 'str' }] },
    ],
  },
];

const CHAR_DELAY = 28;   // ms per character
const LINE_PAUSE = 180;  // ms between lines
const CYCLE_PAUSE = 3200; // ms before next language

function useTypewriter(lines, active) {
  const [displayed, setDisplayed] = useState([]);
  const [cursor, setCursor] = useState({ line: 0, char: 0 });
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    setDisplayed([]);
    setCursor({ line: 0, char: 0 });
  }, [lines, active]);

  useEffect(() => {
    if (!active) return;
    clearTimeout(timerRef.current);

    const { line, char } = cursor;
    if (line >= lines.length) return;

    const fullLineText = lines[line].tokens.map(t => t.text).join('');

    if (char <= fullLineText.length) {
      timerRef.current = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev];
          next[line] = fullLineText.slice(0, char);
          return next;
        });
        setCursor({ line, char: char + 1 });
      }, CHAR_DELAY);
    } else {
      // move to next line
      timerRef.current = setTimeout(() => {
        setCursor({ line: line + 1, char: 0 });
      }, LINE_PAUSE);
    }

    return () => clearTimeout(timerRef.current);
  }, [cursor, lines, active]);

  return displayed;
}

const LanguageTerminal = () => {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [typing, setTyping] = useState(true);
  const [commandHistory, setCommandHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(false);
      setTimeout(() => {
        setTyping(false);
        setTimeout(() => {
          setIdx(prev => (prev + 1) % SNIPPETS.length);
          setTyping(true);
          setFade(true);
        }, 300);
      }, 300);
    }, CYCLE_PAUSE + SNIPPETS[idx].lines.length * LINE_PAUSE + SNIPPETS[idx].lines.reduce((a, l) => a + l.tokens.map(t => t.text).join('').length, 0) * CHAR_DELAY);
    return () => clearTimeout(timer);
  }, [idx]);

  const snippet = SNIPPETS[idx];
  const displayedLines = useTypewriter(snippet.lines, typing);

  const handleCommand = (cmd) => {
    const lowerCmd = cmd.trim().toLowerCase();
    let response = '';
    
    if (!lowerCmd) return;
    
    switch (lowerCmd) {
      case 'help':
        response = 'Available commands: help, about, skills, ping, clear';
        break;
      case 'about':
        response = 'Hi, I am Adhithya Mohan! I am a full-stack dev and IoT enthusiast.';
        break;
      case 'skills':
        response = 'React, Node.js, Python, C++, Arduino, MongoDB, etc.';
        break;
      case 'ping':
        response = 'pong! 🏓';
        break;
      case 'clear':
        setCommandHistory([]);
        return;
      case 'sudo rm -rf /':
        response = 'Nice try. Permission denied. 😉';
        break;
      case 'matrix':
        response = 'Entering the matrix...';
        window.dispatchEvent(new CustomEvent('trigger-egg', { detail: 'matrix' }));
        break;
      case 'barrelroll':
        response = 'Executing 360 flip...';
        window.dispatchEvent(new CustomEvent('trigger-egg', { detail: 'barrelroll' }));
        break;
      case 'party':
        response = 'Initiating party protocols! 🎉';
        window.dispatchEvent(new CustomEvent('trigger-egg', { detail: 'party' }));
        break;
      case 'gravity':
        response = 'Disabling physics...';
        window.dispatchEvent(new CustomEvent('trigger-egg', { detail: 'gravity' }));
        break;
      case 'zoomout':
        response = 'Initiating Ant-Man mode...';
        window.dispatchEvent(new CustomEvent('trigger-egg', { detail: 'zoomout' }));
        break;
      case 'rickroll':
        response = 'Never gonna give you up...';
        setTimeout(() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank'), 1000);
        break;
      default:
        response = `Command not found: ${cmd}. Type 'help' for a list of commands.`;
    }

    
    setCommandHistory(prev => [...prev, { cmd, response }]);
    
    // Auto scroll to bottom
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(inputValue);
      setInputValue('');
    }
  };

  // Colorize a single displayed (partial) line against its token list
  const colorize = (lineIdx, displayedText) => {
    const tokens = snippet.lines[lineIdx]?.tokens || [];
    const spans = [];
    let remaining = displayedText;
    let key = 0;
    for (const token of tokens) {
      if (!remaining) break;
      const part = remaining.slice(0, token.text.length);
      remaining = remaining.slice(token.text.length);
      spans.push(<span key={key++} className={`lt-token lt-${token.c}`}>{part}</span>);
      if (remaining === '') break;
    }
    return spans;
  };

  return (
    <div className={`lang-terminal ${fade ? 'lt-fade-in' : 'lt-fade-out'}`}>
      {/* Terminal top bar */}
      <div className="lt-topbar">
        <div className="lt-dots">
          <span className="lt-dot lt-dot-red" />
          <span className="lt-dot lt-dot-yellow" />
          <span className="lt-dot lt-dot-green" />
        </div>
        <div className="lt-badge" style={{ '--badge-color': snippet.color }}>
          {snippet.badge}
        </div>
        <div className="lt-lines-label">terminal</div>
      </div>

      {/* Code area */}
      <div className="lt-body" onClick={() => inputRef.current && inputRef.current.focus()}>
        <div className="lt-line-numbers">
          {snippet.lines.map((_, i) => (
            <span key={`sn-${i}`}>{i + 1}</span>
          ))}
          {commandHistory.map((_, i) => (
            <React.Fragment key={`ch-${i}`}>
              <span>{snippet.lines.length + i * 2 + 1}</span>
              <span>{snippet.lines.length + i * 2 + 2}</span>
            </React.Fragment>
          ))}
          <span>{snippet.lines.length + commandHistory.length * 2 + 1}</span>
        </div>
        <div className="lt-code">
          {snippet.lines.map((line, i) => (
            <div key={i} className="lt-line">
              {displayedLines[i] !== undefined
                ? colorize(i, displayedLines[i])
                : null}
              {i === (displayedLines.length - 1) && typing && commandHistory.length === 0 && (
                <span className="lt-cursor">▌</span>
              )}
            </div>
          ))}
          
          {commandHistory.map((item, i) => (
            <React.Fragment key={i}>
              <div className="lt-line">
                <span className="lt-plain">visitor@portfolio:~$ {item.cmd}</span>
              </div>
              <div className="lt-line">
                <span className="lt-str">{item.response}</span>
              </div>
            </React.Fragment>
          ))}
          
          <div className="lt-line" style={{ display: 'flex', alignItems: 'center' }}>
            <span className="lt-plain">visitor@portfolio:~$ </span>
            <input 
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="lt-input"
              spellCheck="false"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* Language cycle dots */}
      <div className="lt-footer">
        {SNIPPETS.map((s, i) => (
          <button
            key={i}
            className={`lt-lang-dot ${i === idx ? 'lt-lang-dot-active' : ''}`}
            style={{ '--dot-color': s.color }}
            onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setTyping(true); setFade(true); }, 200); }}
            aria-label={s.lang}
            title={s.lang}
          />
        ))}
      </div>
    </div>
  );
};

export default LanguageTerminal;
