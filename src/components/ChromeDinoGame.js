import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function ChromeDinoGame() {
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

  const restartGame = useCallback(() => {
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
  }, []);

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
  }, [restartGame]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameStateRef.current;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width || 600);
      canvas.height = 130;
    };
    resize();
    window.addEventListener('resize', resize);

    const updateLoop = () => {
      s.frameCount++;

      const width = canvas.width;
      const height = canvas.height;
      s.groundY = height - 20;

      ctx.clearRect(0, 0, width, height);

      // Background Grid & Baseline
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(width, s.groundY);
      ctx.stroke();

      // Ground texture dots
      ctx.fillStyle = '#475569';
      for (let i = 0; i < width; i += 36) {
        const dotOffset = (i - (s.frameCount * (s.speed * 0.8)) % 36);
        ctx.fillRect(dotOffset, s.groundY + 6, 2, 2);
        ctx.fillRect(dotOffset + 14, s.groundY + 11, 3, 1);
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
            s.speed += 0.35;
          }
        }

        // Spawn Obstacles (Pixel Cacti)
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

          // AABB Hitbox detection
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

      // Draw Obstacles (Clean Pixel Cacti)
      ctx.fillStyle = '#10b981';
      s.obstacles.forEach(obs => {
        const ox = Math.floor(obs.x);
        const oy = Math.floor(s.groundY - obs.h);
        ctx.fillRect(ox + 3, oy, obs.w - 6, obs.h);
        ctx.fillRect(ox, oy + 4, obs.w, 4);
        ctx.fillRect(ox, oy + 4, 3, obs.h * 0.45);
        ctx.fillRect(ox + obs.w - 3, oy + 4, 3, obs.h * 0.45);
      });

      // Draw Minimalist Pixel T-Rex
      const dx = Math.floor(s.dino.x);
      const dy = Math.floor(s.groundY - s.dino.h + s.dino.y);

      ctx.fillStyle = s.isGameOver ? '#f43f5e' : '#f8fafc';
      // Head & Snout
      ctx.fillRect(dx + 10, dy, 12, 10);
      ctx.fillRect(dx + 14, dy + 2, 2, 2); // Eye cutout
      // Body & Spine
      ctx.fillRect(dx + 6, dy + 8, 10, 11);
      ctx.fillRect(dx, dy + 11, 7, 5); // Tail
      // Arms
      ctx.fillRect(dx + 16, dy + 10, 4, 2);

      // Pixel Legs
      if (!s.dino.isJumping) {
        if (Math.floor(s.frameCount / 4) % 2 === 0) {
          ctx.fillRect(dx + 8, dy + 19, 3, 7);
          ctx.fillRect(dx + 13, dy + 19, 3, 4);
        } else {
          ctx.fillRect(dx + 8, dy + 19, 3, 4);
          ctx.fillRect(dx + 13, dy + 19, 3, 7);
        }
      } else {
        // Jumping legs tucked
        ctx.fillRect(dx + 8, dy + 19, 3, 5);
        ctx.fillRect(dx + 13, dy + 19, 3, 5);
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [highScore]);

  return (
    <div
      onClick={jump}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '130px',
        cursor: 'pointer',
        userSelect: 'none',
        background: '#080c14',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Sleek Minimalist Retro HUD Header */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'Fira Code', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700 }}>
          [ RETRO T-REX RUNNER // ARCADE ]
        </span>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            HI: {highScore.toString().padStart(4, '0')}
          </span>
          <span style={{ color: '#10b981', fontWeight: 800 }}>
            SCORE: {score.toString().padStart(4, '0')}
          </span>
          <span style={{
            background: gameOver ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.15)',
            color: gameOver ? '#f43f5e' : '#10b981',
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${gameOver ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`
          }}>
            {gameOver ? 'CRASHED // CLICK TO REBOOT' : 'SPACE / TAP TO JUMP'}
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', minHeight: '130px', display: 'block' }}
      />
    </div>
  );
}
