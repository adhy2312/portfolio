import React, { useEffect, useRef } from 'react';
import ns from '../core/NervousSystem';
import pipeline from '../core/WorkerPipeline';

export default function FluidCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (ns.performanceTier < 2) return; // Only run on high-end machines

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const uuid = 'fluid-canvas-1';

    // In React 18 Strict Mode, useEffect runs twice. 
    // We cannot transfer control to offscreen twice on the same canvas element.
    if (!canvas.dataset.offscreenTransferred) {
      canvas.dataset.offscreenTransferred = 'true';
      
      // Set initial size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const offscreen = canvas.transferControlToOffscreen();
      
      // Send the offscreen canvas to the worker
      pipeline.dispatch('science', 'INIT_FLUID_OFFSCREEN', uuid, { canvas: offscreen }, [offscreen]);
    }
    
    let frame = 0;

    const tick = () => {
      frame++;
      if (frame % 2 === 0) { // Throttle state updates to 60Hz, Worker renders at 144Hz
        pipeline.dispatch('science', 'UPDATE_FLUID_STATE', uuid, {
          width: window.innerWidth, 
          height: window.innerHeight,
          mouseX: ns.mousePos.x,
          mouseY: ns.mousePos.y,
          velocityX: ns.mousePos.vx || 0,
          velocityY: ns.mousePos.vy || 0
        });
      }
    };
    
    // Bind into the central brain instead of isolated RAF
    ns.register(uuid, tick, { priority: 'NORMAL' });

    return () => {
      ns.unregister(uuid);
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
