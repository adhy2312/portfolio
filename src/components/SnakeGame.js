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
const GAME_SPEED = 120; // ms per frame

export default function SnakeGame({ onClose }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const { triggerHyperConscious } = useConsciousness();
  const directionRef = useRef(direction);
  const containerRef = useRef(null);
  
  // Audio context for authentic retro beeps
  const audioCtx = useRef(null);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

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

  const spawnFood = useCallback((currentSnake) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Make sure food doesn't spawn on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, []);

  // Entrance animation
  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { y: 100, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
    );
    spawnFood(INITIAL_SNAKE);
    triggerHyperConscious('playing_snake');
    
    // Unlock achievement via localStorage directly just to be safe
    try {
      const achs = JSON.parse(localStorage.getItem('adhy_achievements') || '[]');
      if (!achs.find(a => a.id === 'retro_gamer')) {
         achs.push({ id: 'retro_gamer', title: 'Retro Gamer', desc: 'Launched the Snake Xenzia terminal protocol.', icon: '🐍', unlocked: true, rarity: 'Rare', color: '#00ff00' });
         localStorage.setItem('adhy_achievements', JSON.stringify(achs));
      }
    } catch(e) {}
  }, [spawnFood, triggerHyperConscious]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setHasStarted(true);
    spawnFood(INITIAL_SNAKE);
  };

  const handleClose = () => {
    gsap.to(containerRef.current, {
      y: 50, opacity: 0, scale: 0.95, duration: 0.3,
      onComplete: onClose
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent scrolling when playing
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) resetGame();
        else if (hasStarted) setIsPaused(p => !p);
        else setHasStarted(true);
        return;
      }

      const currDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currDir.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currDir.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currDir.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currDir.x === 0) setDirection({ x: 1, y: 0 });
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, hasStarted]);

  useEffect(() => {
    if (gameOver || isPaused || !hasStarted) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        // Wall Collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          playBeep('die');
          setGameOver(true);
          return prevSnake;
        }

        // Self Collision
        const isSelfCollision = prevSnake.some(
          (segment, index) => index !== prevSnake.length - 1 && segment.x === newHead.x && segment.y === newHead.y
        );

        if (isSelfCollision) {
          playBeep('die');
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          playBeep('eat');
          spawnFood(newSnake);
          // Don't pop the tail so it grows
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [direction, food, gameOver, isPaused, hasStarted, spawnFood, playBeep]);

  // Touch/DPAD Controls
  const handleDPad = (dx, dy) => {
    if (gameOver || isPaused || !hasStarted) return;
    const currDir = directionRef.current;
    if (dx !== 0 && currDir.x === 0) setDirection({ x: dx, y: 0 });
    if (dy !== 0 && currDir.y === 0) setDirection({ x: 0, y: dy });
  };

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
            {/* Grid */}
            <div 
              className="snake-grid" 
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                
                const isHead = snake[0].x === x && snake[0].y === y;
                const isBody = snake.some((seg, idx) => idx !== 0 && seg.x === x && seg.y === y);
                const isFood = food.x === x && food.y === y;
                
                let cellClass = 'snake-cell';
                if (isHead) cellClass += ' snake-head';
                else if (isBody) cellClass += ' snake-body';
                else if (isFood) cellClass += ' snake-food';

                return <div key={i} className={cellClass} />;
              })}
            </div>

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

            {/* Score HUD */}
            <div className="snake-score-hud">
              SCORE: {score.toString().padStart(4, '0')}
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
                if (gameOver) resetGame();
                else if (!hasStarted) setHasStarted(true);
                else setIsPaused(!isPaused);
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
