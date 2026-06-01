import React, { useEffect, useRef } from 'react';
import ns from '../core/NervousSystem';
import pipeline from '../core/WorkerPipeline';

export default function FluidCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (ns.performanceTier < 2) return; // Only run on high-end machines

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let rafId;
    const uuid = 'fluid-canvas-1';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const unsubscribe = pipeline.subscribe(uuid, (data) => {
      if (data.type === 'FLUID_RESULT') {
        const { field } = data.payload; // Float32Array 16x16
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the fluid influence field
        const cellW = canvas.width / 16;
        const cellH = canvas.height / 16;
        
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const force = field[y * 16 + x];
            if (force > 0) {
              const alpha = Math.min(0.15, Math.abs(force) * 0.05); // Very subtle
              ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
              ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
            }
          }
        }
      }
    });

    const loop = () => {
      // Offload fluid force calculation
      pipeline.dispatch('science', 'CALC_FLUID_TICK', uuid, {
        width: canvas.width,
        height: canvas.height,
        mouseX: ns.mousePos.x,
        mouseY: ns.mousePos.y,
        velocityX: ns.mousePos.vx || 0,
        velocityY: ns.mousePos.vy || 0
      });
      rafId = requestAnimationFrame(loop);
    };
    
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      unsubscribe();
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (ns.performanceTier < 2) return null;

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1, // Behind everything except global background
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: 0.8
      }}
    />
  );
}
