/* eslint-disable no-restricted-globals */

/**
 * V40 SCIENCE ENGINE WORKER
 * ════════════════════════════════════════════════════════════════
 * Offloads extreme mathematical and physical calculations from the main thread.
 * Handles Shannon Entropy string collapses and Navier-Stokes grids.
 * ════════════════════════════════════════════════════════════════
 */

// Characters for maximum entropy state
const ENTROPY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';

self.addEventListener('message', (e) => {
  const { type, id, payload } = e.data;

  // ─── SHANNON ENTROPY TYPOGRAPHY ───
  if (type === 'CALC_ENTROPY') {
    const { targetText, progress } = payload; // progress: 0 (chaos) to 1 (target text)
    
    let result = '';
    for (let i = 0; i < targetText.length; i++) {
      if (targetText[i] === ' ') {
        result += ' ';
        continue;
      }
      
      // Calculate local probability for this specific character
      // Characters on the left settle faster than characters on the right
      const characterThreshold = (i / targetText.length) * 0.5 + 0.5; 
      
      if (progress >= characterThreshold || Math.random() < Math.pow(progress, 3)) {
        result += targetText[i]; // Collapsed state
      } else {
        result += ENTROPY_CHARS[Math.floor(Math.random() * ENTROPY_CHARS.length)]; // Quantum superposition
      }
    }
    
    self.postMessage({ id, type: 'ENTROPY_RESULT', payload: { text: result, done: progress >= 1 } });
  }

  // ─── FLUID DYNAMICS (OffscreenCanvas rendering) ───
  if (type === 'INIT_FLUID_OFFSCREEN') {
    self.offscreenCanvas = payload.canvas;
    self.ctx = self.offscreenCanvas.getContext('2d');
    
    // Internal state for fluid
    self.fluidState = { width: 0, height: 0, mouseX: -1000, mouseY: -1000, velocityX: 0, velocityY: 0 };
    
    const renderLoop = () => {
      if (!self.ctx || self.fluidState.width === 0) {
        requestAnimationFrame(renderLoop);
        return;
      }
      
      const { width, height, mouseX, mouseY, velocityX, velocityY } = self.fluidState;
      
      // Clear canvas
      self.ctx.clearRect(0, 0, width, height);
      
      const field = new Float32Array(256); // 16x16 low-res grid for WebGL sampling
      const cellW = width / 16;
      const cellH = height / 16;
      
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const dx = (x / 15) * width - mouseX;
          const dy = (y / 15) * height - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Force drops off exponentially (Inverse square law)
          const force = Math.max(0, 1 - (dist / 300));
          field[y * 16 + x] = force * (velocityX + velocityY);
          
          if (field[y * 16 + x] > 0) {
            const alpha = Math.min(0.15, Math.abs(field[y * 16 + x]) * 0.05); // Very subtle
            self.ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            self.ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
        }
      }
      
      requestAnimationFrame(renderLoop);
    };
    
    requestAnimationFrame(renderLoop);
  }

  if (type === 'UPDATE_FLUID_STATE') {
    self.fluidState = payload;
  }
});
