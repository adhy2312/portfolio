import React, { useEffect, useRef, useCallback, useState } from 'react';
import './PingPongGame.css';

const W = 800;
const H = 500;
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 10;
const PADDLE_SPEED = 6;
const AI_SPEED = 4.2;
const INIT_BALL_SPEED = 5;
const MAX_SCORE = 7;

// Web Audio API beep synthesizer
function createBeep(ctx, freq, duration, type = 'square') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function initState() {
  const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
  const dir = Math.random() > 0.5 ? 1 : -1;
  return {
    ball: { x: W / 2, y: H / 2, vx: INIT_BALL_SPEED * dir * Math.cos(angle), vy: INIT_BALL_SPEED * Math.sin(angle) },
    player: { y: H / 2 - PADDLE_H / 2 },
    ai: { y: H / 2 - PADDLE_H / 2 },
    scores: { player: 0, ai: 0 },
    keys: {},
  };
}

const PingPongGame = ({ onClose }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef(initState());
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(null); // 'win' | 'lose' | null
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const getAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const resetBall = useCallback((scores) => {
    const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
    const dir = Math.random() > 0.5 ? 1 : -1;
    const speed = INIT_BALL_SPEED + Math.min((scores.player + scores.ai) * 0.3, 4);
    stateRef.current.ball = {
      x: W / 2, y: H / 2,
      vx: speed * dir * Math.cos(angle),
      vy: speed * Math.sin(angle),
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(6, 9, 24, 0.95)';
    ctx.fillRect(0, 0, W, H);

    // Center dashed line
    ctx.setLineDash([10, 14]);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Neon glow helper
    const drawNeon = (color, blur, fn) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      fn();
      ctx.shadowBlur = 0;
    };

    // Player paddle (left) — purple
    drawNeon('var(--accent-primary)', 24, () => {
      ctx.fillStyle = 'var(--accent-primary)';
      const rx = 7;
      const px = 20, py = s.player.y;
      ctx.beginPath();
      ctx.moveTo(px + rx, py);
      ctx.lineTo(px + PADDLE_W - rx, py);
      ctx.quadraticCurveTo(px + PADDLE_W, py, px + PADDLE_W, py + rx);
      ctx.lineTo(px + PADDLE_W, py + PADDLE_H - rx);
      ctx.quadraticCurveTo(px + PADDLE_W, py + PADDLE_H, px + PADDLE_W - rx, py + PADDLE_H);
      ctx.lineTo(px + rx, py + PADDLE_H);
      ctx.quadraticCurveTo(px, py + PADDLE_H, px, py + PADDLE_H - rx);
      ctx.lineTo(px, py + rx);
      ctx.quadraticCurveTo(px, py, px + rx, py);
      ctx.closePath();
      ctx.fill();
    });

    // AI paddle (right) — cyan
    drawNeon('var(--accent-cyan)', 24, () => {
      ctx.fillStyle = 'var(--accent-cyan)';
      const rx = 7;
      const px = W - 20 - PADDLE_W, py = s.ai.y;
      ctx.beginPath();
      ctx.moveTo(px + rx, py);
      ctx.lineTo(px + PADDLE_W - rx, py);
      ctx.quadraticCurveTo(px + PADDLE_W, py, px + PADDLE_W, py + rx);
      ctx.lineTo(px + PADDLE_W, py + PADDLE_H - rx);
      ctx.quadraticCurveTo(px + PADDLE_W, py + PADDLE_H, px + PADDLE_W - rx, py + PADDLE_H);
      ctx.lineTo(px + rx, py + PADDLE_H);
      ctx.quadraticCurveTo(px, py + PADDLE_H, px, py + PADDLE_H - rx);
      ctx.lineTo(px, py + rx);
      ctx.quadraticCurveTo(px, py, px + rx, py);
      ctx.closePath();
      ctx.fill();
    });

    // Ball — neon green
    drawNeon('var(--accent-green)', 28, () => {
      ctx.fillStyle = 'var(--accent-green)';
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ball trail
    ctx.fillStyle = 'rgba(0, 229, 160, 0.15)';
    ctx.beginPath();
    ctx.arc(s.ball.x - s.ball.vx * 2, s.ball.y - s.ball.vy * 2, BALL_R * 0.7, 0, Math.PI * 2);
    ctx.fill();

  }, []);

  const update = useCallback(() => {
    if (pausedRef.current) return;
    const s = stateRef.current;
    const audio = getAudio();

    // Player movement
    if (s.keys['ArrowUp'] || s.keys['w'] || s.keys['W']) {
      s.player.y = Math.max(0, s.player.y - PADDLE_SPEED);
    }
    if (s.keys['ArrowDown'] || s.keys['s'] || s.keys['S']) {
      s.player.y = Math.min(H - PADDLE_H, s.player.y + PADDLE_SPEED);
    }

    // AI movement — tracks ball center with slight lag
    const aiCenter = s.ai.y + PADDLE_H / 2;
    const ballCenter = s.ball.y;
    if (aiCenter < ballCenter - 8) s.ai.y = Math.min(H - PADDLE_H, s.ai.y + AI_SPEED);
    if (aiCenter > ballCenter + 8) s.ai.y = Math.max(0, s.ai.y - AI_SPEED);

    // Ball movement
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    // Top/bottom wall bounce
    if (s.ball.y - BALL_R <= 0) { s.ball.y = BALL_R; s.ball.vy *= -1; createBeep(audio, 440, 0.06); }
    if (s.ball.y + BALL_R >= H) { s.ball.y = H - BALL_R; s.ball.vy *= -1; createBeep(audio, 440, 0.06); }

    // Player paddle collision (left)
    const playerPX = 20, playerPY = s.player.y;
    if (
      s.ball.x - BALL_R <= playerPX + PADDLE_W &&
      s.ball.x + BALL_R >= playerPX &&
      s.ball.y >= playerPY && s.ball.y <= playerPY + PADDLE_H &&
      s.ball.vx < 0
    ) {
      const hitPos = (s.ball.y - playerPY) / PADDLE_H - 0.5; // -0.5 to 0.5
      const angle = hitPos * (Math.PI / 3);
      const speed = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2) + 0.3;
      s.ball.vx = Math.cos(angle) * speed;
      s.ball.vy = Math.sin(angle) * speed;
      s.ball.x = playerPX + PADDLE_W + BALL_R;
      createBeep(audio, 660, 0.08);
    }

    // AI paddle collision (right)
    const aiPX = W - 20 - PADDLE_W, aiPY = s.ai.y;
    if (
      s.ball.x + BALL_R >= aiPX &&
      s.ball.x - BALL_R <= aiPX + PADDLE_W &&
      s.ball.y >= aiPY && s.ball.y <= aiPY + PADDLE_H &&
      s.ball.vx > 0
    ) {
      const hitPos = (s.ball.y - aiPY) / PADDLE_H - 0.5;
      const angle = hitPos * (Math.PI / 3);
      const speed = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2) + 0.3;
      s.ball.vx = -Math.cos(angle) * speed;
      s.ball.vy = Math.sin(angle) * speed;
      s.ball.x = aiPX - BALL_R;
      createBeep(audio, 520, 0.08);
    }

    // Scoring
    if (s.ball.x < 0) {
      s.scores.ai += 1;
      createBeep(audio, 220, 0.25, 'sawtooth');
      const ns = { ...s.scores };
      setScores(ns);
      if (ns.ai >= MAX_SCORE) { setGameOver('lose'); return; }
      resetBall(ns);
    }
    if (s.ball.x > W) {
      s.scores.player += 1;
      createBeep(audio, 880, 0.15, 'sine');
      const ns = { ...s.scores };
      setScores(ns);
      if (ns.player >= MAX_SCORE) { setGameOver('win'); return; }
      resetBall(ns);
    }
  }, [resetBall]);

  const loop = useCallback(() => {
    update();
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.type === 'keydown') {
        stateRef.current.keys[e.key] = true;
        if (e.key === 'Escape') onClose();
        if (e.key === ' ') {
          pausedRef.current = !pausedRef.current;
          setPaused(p => !p);
        }
      } else {
        stateRef.current.keys[e.key] = false;
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [onClose]);

  const handleRestart = () => {
    stateRef.current = initState();
    setScores({ player: 0, ai: 0 });
    setGameOver(null);
    pausedRef.current = false;
    setPaused(false);
  };

  // Touch / mouse control
  const handleCanvasMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = H / rect.height;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const y = (clientY - rect.top) * scaleY;
    stateRef.current.player.y = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H / 2));
  };

  return (
    <div className="ppg-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ppg-container">
        {/* Header */}
        <div className="ppg-header">
          <div className="ppg-title">
            <span className="ppg-icon">🏓</span>
            <span>PONG</span>
            <span className="ppg-easter-tag">easter egg</span>
          </div>
          <div className="ppg-controls-hint">
            ↑↓ / W S to move &nbsp;·&nbsp; Space to pause &nbsp;·&nbsp; ESC to exit
          </div>
          <button className="ppg-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Score */}
        <div className="ppg-score">
          <div className="ppg-score-side">
            <span className="ppg-score-label" style={{ color: 'var(--accent-primary)' }}>YOU</span>
            <span className="ppg-score-num" style={{ color: 'var(--accent-primary)' }}>{scores.player}</span>
          </div>
          <div className="ppg-score-divider">:</div>
          <div className="ppg-score-side">
            <span className="ppg-score-num" style={{ color: 'var(--accent-cyan)' }}>{scores.ai}</span>
            <span className="ppg-score-label" style={{ color: 'var(--accent-cyan)' }}>CPU</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="ppg-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="ppg-canvas"
            onMouseMove={handleCanvasMove}
            onTouchMove={handleCanvasMove}
          />
          {paused && !gameOver && (
            <div className="ppg-overlay-msg">
              <span>PAUSED</span>
              <small>Press Space to continue</small>
            </div>
          )}
          {gameOver && (
            <div className={`ppg-overlay-msg ppg-gameover ${gameOver === 'win' ? 'ppg-win' : 'ppg-lose'}`}>
              <span>{gameOver === 'win' ? '🏆 YOU WIN!' : '💀 GAME OVER'}</span>
              <small>{gameOver === 'win' ? 'Not bad, hacker 😏' : 'The machine reigns supreme 🤖'}</small>
              <div className="ppg-gameover-btns">
                <button className="ppg-btn ppg-btn-primary" onClick={handleRestart}>Play Again</button>
                <button className="ppg-btn ppg-btn-outline" onClick={onClose}>Exit</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="ppg-footer-hint">
          First to <strong>{MAX_SCORE}</strong> wins &nbsp;·&nbsp; You control the <span style={{ color: 'var(--accent-primary)' }}>purple</span> paddle
        </div>
      </div>
    </div>
  );
};

export default PingPongGame;
