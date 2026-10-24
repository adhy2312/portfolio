import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function ChromeDinoGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('adhy_dino_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const gameStateRef = useRef({
    dino: { x: 40, y: 0, w: 22, h: 26, vy: 0, isJumping: false, legStep: 0 },
    obstacles: [],
    speed: 4.5,
    frameCount: 0,
    score: 0,
    isGameOver: false,
    groundY: 100
  });

  const jump = useCallback(() => {
    const s = gameStateRef.current;
    if (s.isGameOver) {
      restartGame();
      return;
    }
    if (!s.dino.isJumping) {
      s.dino.vy = -9.5;
      s.dino.isJumping = true;
    }
  }, []);

  const restartGame = () => {
    const s = gameStateRef.current;
    s.dino.y = 0;
    s.dino.vy = 0;
    s.dino.isJumping = false;
    s.obstacles = [];
    s.speed = 4.5;
    s.frameCount = 0;
    s.score = 0;
    s.isGameOver = false;
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, jump]);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameStateRef.current;

    const updateLoop = () => {
      s.frameCount++;

      const width = canvas.width;
      const height = canvas.height;
      s.groundY = height - 22;

      ctx.clearRect(0, 0, width, height);

      // Draw Ground
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(width, s.groundY);
      ctx.stroke();

      // Ground texture dots
      ctx.fillStyle = '#475569';
      for (let i = 0; i < width; i += 32) {
        const dotOffset = (i - (s.frameCount * (s.speed * 0.8)) % 32);
        ctx.fillRect(dotOffset, s.groundY + 6, 2, 2);
        ctx.fillRect(dotOffset + 14, s.groundY + 12, 3, 1);
      }

      if (!s.isGameOver) {
        // Dino Physics
        s.dino.y += s.dino.vy;
        s.dino.vy += 0.58; // Gravity

        if (s.dino.y >= 0) {
          s.dino.y = 0;
          s.dino.vy = 0;
          s.dino.isJumping = false;
        }

        // Score progression
        if (s.frameCount % 5 === 0) {
          s.score += 1;
          setScore(s.score);
          if (s.score > highScore) {
            setHighScore(s.score);
            try {
              localStorage.setItem('adhy_dino_highscore', s.score.toString());
            } catch {}
          }
          if (s.score % 100 === 0 && s.speed < 9) {
            s.speed += 0.35; // Accelerate
          }
        }

        // Spawn Obstacles (Cactus)
        if (s.frameCount % Math.max(50, Math.floor(110 - s.speed * 5)) === 0 && Math.random() > 0.3) {
          const isLarge = Math.random() > 0.6;
          s.obstacles.push({
            x: width + 10,
            w: isLarge ? 14 : 10,
            h: isLarge ? 28 : 20,
          });
        }

        // Move Obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Collision detection (AABB with slight hitbox grace)
          const dinoX = s.dino.x + 3;
          const dinoY = s.groundY - s.dino.h + s.dino.y + 2;
          const dinoW = s.dino.w - 6;
          const dinoH = s.dino.h - 4;

          const obsX = obs.x + 2;
          const obsY = s.groundY - obs.h;
          const obsW = obs.w - 4;
          const obsH = obs.h;

          if (
            dinoX < obsX + obsW &&
            dinoX + dinoW > obsX &&
            dinoY < obsY + obsH &&
            dinoY + dinoH > obsY
          ) {
            s.isGameOver = true;
            setGameOver(true);
          }

          if (obs.x < -30) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // Draw Obstacles (Pixel Cacti)
      ctx.fillStyle = '#22c55e';
      s.obstacles.forEach((obs) => {
        const obsY = s.groundY - obs.h;
        // Main stem
        ctx.fillRect(obs.x + obs.w * 0.3, obsY, obs.w * 0.4, obs.h);
        // Arms
        ctx.fillRect(obs.x, obsY + obs.h * 0.35, obs.w * 0.3, 4);
        ctx.fillRect(obs.x, obsY + obs.h * 0.2, 3, obs.h * 0.25);
        ctx.fillRect(obs.x + obs.w * 0.7, obsY + obs.h * 0.45, obs.w * 0.3, 4);
        ctx.fillRect(obs.x + obs.w - 3, obsY + obs.h * 0.3, 3, obs.h * 0.25);
      });

      // Draw Dino (Retro Pixel T-Rex)
      const curY = s.groundY - s.dino.h + s.dino.y;
      ctx.fillStyle = s.isGameOver ? '#ef4444' : '#f8fafc';

      // Head & snout
      ctx.fillRect(s.dino.x + 8, curY, 14, 10);
      ctx.fillRect(s.dino.x + 14, curY + 2, 8, 5);
      // Eye
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(s.dino.x + 11, curY + 2, 2, 2);
      ctx.fillStyle = s.isGameOver ? '#ef4444' : '#f8fafc';
      // Body
      ctx.fillRect(s.dino.x + 4, curY + 8, 12, 12);
      ctx.fillRect(s.dino.x, curY + 11, 6, 6); // Tail
      ctx.fillRect(s.dino.x + 15, curY + 12, 4, 3); // Arms

      // Animated Legs
      if (!s.dino.isJumping && !s.isGameOver) {
        if (Math.floor(s.frameCount / 6) % 2 === 0) {
          ctx.fillRect(s.dino.x + 6, curY + 20, 3, 6);
          ctx.fillRect(s.dino.x + 12, curY + 20, 3, 3);
        } else {
          ctx.fillRect(s.dino.x + 6, curY + 20, 3, 3);
          ctx.fillRect(s.dino.x + 12, curY + 20, 3, 6);
        }
      } else {
        // Jumping or game over legs
        ctx.fillRect(s.dino.x + 5, curY + 20, 3, 5);
        ctx.fillRect(s.dino.x + 12, curY + 20, 3, 5);
      }

      // Draw Score on Canvas
      ctx.font = '11px "Fira Code", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      const pad = (num) => String(num).padStart(5, '0');
      ctx.fillText(`HI ${pad(highScore)}   ${pad(s.score)}`, width - 12, 20);

      // Game Over Message
      if (s.isGameOver) {
        ctx.fillStyle = 'rgba(10, 13, 20, 0.75)';
        ctx.fillRect(width / 2 - 90, height / 2 - 28, 180, 52);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(width / 2 - 90, height / 2 - 28, 180, 52);

        ctx.font = 'bold 12px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('G A M E   O V E R', width / 2, height / 2 - 8);

        ctx.font = '10px "Fira Code", monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText('TAP OR PRESS SPACE', width / 2, height / 2 + 12);
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, highScore]);

  // Adjust canvas resolution dynamically
  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = 130;
  }, [isPlaying]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isPlaying ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.2rem',
          textAlign: 'center',
          height: '100%',
          minHeight: '130px',
          background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.08) 0%, transparent 70%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>🦖</span>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Chrome Dino Runner
            </span>
          </div>
          <p style={{
            fontSize: '0.72rem',
            fontFamily: "'Fira Code', monospace",
            color: 'var(--text-muted)',
            margin: '0 0 14px'
          }}>
            NO INTERNET // ARCADE BREAK • HI: {highScore}
          </p>
          <button
            onClick={() => {
              restartGame();
              setIsPlaying(true);
            }}
            style={{
              background: '#22c55e',
              color: '#000',
              border: '2px solid #000',
              boxShadow: '3px 3px 0px #000',
              padding: '8px 20px',
              borderRadius: '8px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease'
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = '1px 1px 0px #000';
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '3px 3px 0px #000';
            }}
          >
            ▶ PLAY DINO GAME
          </button>
        </div>
      ) : (
        <div
          onClick={jump}
          style={{
            position: 'relative',
            width: '100%',
            height: '130px',
            cursor: 'pointer',
            userSelect: 'none',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '130px', display: 'block' }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(false);
            }}
            style={{
              position: 'absolute',
              top: '6px',
              left: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#94a3b8',
              borderRadius: '6px',
              fontSize: '0.62rem',
              fontFamily: "'Fira Code', monospace",
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            ✕ Exit Game
          </button>
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              color: gameOver ? '#ef4444' : '#22c55e',
              fontSize: '0.62rem',
              fontFamily: "'Fira Code', monospace",
              fontWeight: 700,
              pointerEvents: 'none'
            }}
          >
            {gameOver ? 'CRASHED! CLICK TO RESTART' : `RUNNING • ${score} PTS`}
          </div>
        </div>
      )}
    </div>
  );
}
