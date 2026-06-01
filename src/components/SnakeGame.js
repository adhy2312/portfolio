import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SnakeGame.css';
import gsap from 'gsap';
import { useConsciousness } from '../contexts/ConsciousnessContext';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Moving up
const GAME_SPEED = 100; // ms per frame (approx 10 ticks per second like vintage snake)

export default function SnakeGame({ onClose }) {
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const { triggerHyperConscious } = useConsciousness();
  
  // Mutable game state to prevent React re-renders during gameplay
  const stateRef = useRef({
    snake: [...INITIAL_SNAKE],
    direction: { ...INITIAL_DIRECTION },
    food: { x: 5, y: 5 },
    lastTick: 0,
    hasStarted: false,
    gameOver: false,
    isPaused: false,
    score: 0
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  
  // Audio context for authentic retro beeps
  const audioCtx = useRef(null);

  const playBeep = useCallback((type) => {
    try {
      if (!audioCtx.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx.current = new AudioContext();
      }
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      
      if (type === 'eat') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.current.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.current.currentTime + 0.1);
      } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.current.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.current.currentTime + 0.3);
      }
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  const spawnFood = useCallback(() => {
    const s = stateRef.current;
    while (true) {
      s.food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Make sure food doesn't spawn on snake
      const onSnake = s.snake.some(segment => segment.x === s.food.x && segment.y === s.food.y);
      if (!onSnake) break;
    }
  }, []);

  // Entrance animation & Init
  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { y: 100, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
    );
    spawnFood();
    triggerHyperConscious('playing_snake');
    
    // Unlock achievement
    try {
      const achs = JSON.parse(localStorage.getItem('adhy_achievements') || '[]');
      if (!achs.find(a => a.id === 'retro_gamer')) {
         achs.push({ id: 'retro_gamer', title: 'Retro Gamer', desc: 'Launched the Snake Xenzia terminal protocol.', icon: '🐍', unlocked: true, rarity: 'Rare', color: '#00ff00' });
         localStorage.setItem('adhy_achievements', JSON.stringify(achs));
      }
    } catch(e) {}
  }, [spawnFood, triggerHyperConscious]);

  const resetGame = () => {
    stateRef.current.snake = [...INITIAL_SNAKE];
    stateRef.current.direction = { ...INITIAL_DIRECTION };
    stateRef.current.score = 0;
    stateRef.current.gameOver = false;
    stateRef.current.hasStarted = true;
    stateRef.current.isPaused = false;
    
    setScore(0);
    setGameOver(false);
    setHasStarted(true);
    setIsPaused(false);
    
    spawnFood();
  };

  const handleClose = () => {
    gsap.to(containerRef.current, {
      y: 50, opacity: 0, scale: 0.95, duration: 0.3,
      onComplete: onClose
    });
  };

  // Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent scrolling when playing
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      const s = stateRef.current;

      if (e.key === ' ') {
        if (s.gameOver) resetGame();
        else if (s.hasStarted) {
          s.isPaused = !s.isPaused;
          setIsPaused(s.isPaused);
        } else {

          s.hasStarted = true;
          setHasStarted(true);
        }
        return;
      }

      const currDir = s.direction;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currDir.y === 0) s.direction = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currDir.y === 0) s.direction = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currDir.x === 0) s.direction = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currDir.x === 0) s.direction = { x: 1, y: 0 };
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main Game Loop (Canvas Render + Logic)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Virtual resolution (authentic chunky pixels)
    canvas.width = 300;
    canvas.height = 300;
    
    const cellSize = canvas.width / GRID_SIZE;

    const gameLoop = (timestamp) => {
      rafRef.current = requestAnimationFrame(gameLoop);
      
      const s = stateRef.current;
      
      // Fixed time step logic
      if (timestamp - s.lastTick > GAME_SPEED) {
        s.lastTick = timestamp;
        
        if (s.hasStarted && !s.isPaused && !s.gameOver) {
          const head = s.snake[0];
          let newHead = {
            x: head.x + s.direction.x,
            y: head.y + s.direction.y
          };

          // Endless Wrapping (Classic Nokia Snake Box Mode)
          if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
          else if (newHead.x >= GRID_SIZE) newHead.x = 0;
          
          if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
          else if (newHead.y >= GRID_SIZE) newHead.y = 0;

          // Self Collision (Dying only happens if it bites itself)
          const isSelfCollision = s.snake.some(
            (seg, idx) => idx !== s.snake.length - 1 && seg.x === newHead.x && seg.y === newHead.y
          );

          if (isSelfCollision) {
            playBeep('die');
            s.gameOver = true;
            setGameOver(true);
          } else {
            s.snake.unshift(newHead); // Add new head

            // Eat food
            if (newHead.x === s.food.x && newHead.y === s.food.y) {
              s.score += 10;
              setScore(s.score);
              playBeep('eat');
              spawnFood();
              // We keep the tail, effectively growing
            } else {
              s.snake.pop(); // Remove tail
            }
          }
        }
      }

      // ─── RENDER ENGINE ───
      
      // Clear background (Vintage LCD Green)
      ctx.fillStyle = '#879a73';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw faint grid (optional, for extreme retro feel)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      for(let i=0; i<GRID_SIZE; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(canvas.width, i * cellSize); ctx.stroke();
      }

      // Draw Snake Body
      s.snake.forEach((seg, idx) => {
        const x = Math.floor(seg.x * cellSize);
        const y = Math.floor(seg.y * cellSize);
        const size = Math.ceil(cellSize);
        
        if (idx === 0) {
          // Head: Solid with vintage pixel eyes
          ctx.fillStyle = '#1a2214';
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = '#879a73'; // Background color for eyes
          if (s.direction.x !== 0) { // Moving horizontally
            ctx.fillRect(x + size/2 - 1.5, y + 3, 3, 3);
            ctx.fillRect(x + size/2 - 1.5, y + size - 6, 3, 3);
          } else { // Moving vertically
            ctx.fillRect(x + 3, y + size/2 - 1.5, 3, 3);
            ctx.fillRect(x + size - 6, y + size/2 - 1.5, 3, 3);
          }
        } else {
          // Body: The classic Xenzia "hollow ring" segment pattern
          ctx.fillStyle = '#1a2214';
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = '#879a73';
          ctx.fillRect(x + 3, y + 3, size - 6, size - 6);
        }
      });

      // Draw Food (Classic diamond/cross bug shape)
      if (Math.floor(timestamp / 300) % 2 === 0) {
        ctx.fillStyle = '#1a2214';
        const fx = Math.floor(s.food.x * cellSize);
        const fy = Math.floor(s.food.y * cellSize);
        const cs = Math.ceil(cellSize);
        ctx.fillRect(fx + cs/2 - 2, fy + 2, 4, cs - 4);
        ctx.fillRect(fx + 2, fy + cs/2 - 2, cs - 4, 4);
      }
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playBeep, spawnFood]);

  // Touch/DPAD Controls
  const handleDPad = (dx, dy) => {
    const s = stateRef.current;
    if (s.gameOver || s.isPaused || !s.hasStarted) return;
    const currDir = s.direction;
    if (dx !== 0 && currDir.x === 0) s.direction = { x: dx, y: 0 };
    if (dy !== 0 && currDir.y === 0) s.direction = { x: 0, y: dy };
  };

  // Calculate length for progress bar (max visual length ~ 50)
  const snakeLength = stateRef.current.snake.length;
  const progressRatio = Math.min((snakeLength - 3) / 47, 1);

  return (
    <div className="snake-overlay">
      <div className="snake-device" ref={containerRef}>
        
        {/* Device Header */}
        <div className="snake-header">
          <span className="snake-brand">NOKIA_XENZIA v1.0</span>
          <button className="snake-close-btn" onClick={handleClose}>×</button>
        </div>

        {/* Display Screen */}
        <div className="snake-screen-bezel">
          <div className="snake-screen">
            
            {/* High-Performance Canvas */}
            <canvas ref={canvasRef} className="snake-canvas" />

            {/* Overlays */}
            {!hasStarted && !gameOver && (
              <div className="snake-message-overlay">
                <span className="blink-text">PRESS SPACE TO START</span>
                <span className="sub-text">USE WASD / ARROWS / DPAD</span>
              </div>
            )}
            
            {gameOver && (
              <div className="snake-message-overlay">
                <span className="blink-text">GAME OVER</span>
                <span className="sub-text">SCORE: {score}</span>
                <span className="sub-text">SPACE TO RESTART</span>
              </div>
            )}
            
            {isPaused && !gameOver && hasStarted && (
              <div className="snake-message-overlay">
                <span className="blink-text">PAUSED</span>
              </div>
            )}

            {/* Authentic Nokia Score & Progress HUD */}
            <div className="snake-hud-bottom">
              <div className="snake-score-classic">{score.toString().padStart(4, '0')}</div>
              <div className="snake-progress-bar">
                <div className="snake-progress-fill" style={{ width: `${progressRatio * 100}%` }} />
              </div>
            </div>
            
          </div>
        </div>

        {/* Mobile D-Pad Controls */}
        <div className="snake-controls">
          <div className="dpad">
            <button className="dpad-btn up" onClick={() => handleDPad(0, -1)}>▲</button>
            <div className="dpad-middle">
              <button className="dpad-btn left" onClick={() => handleDPad(-1, 0)}>◀</button>
              <button className="dpad-btn center" onClick={() => {
                const s = stateRef.current;
                if (s.gameOver) resetGame();
                else if (!s.hasStarted) { s.hasStarted = true; setHasStarted(true); }
                else { s.isPaused = !s.isPaused; setIsPaused(s.isPaused); }
              }}>
                {gameOver ? 'R' : hasStarted ? 'P' : '▶'}
              </button>
              <button className="dpad-btn right" onClick={() => handleDPad(1, 0)}>▶</button>
            </div>
            <button className="dpad-btn down" onClick={() => handleDPad(0, 1)}>▼</button>
          </div>
        </div>
      </div>
    </div>
  );
}
