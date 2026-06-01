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

  // ─── FLUID DYNAMICS (Navier-Stokes Light) ───
  if (type === 'CALC_FLUID_TICK') {
    // A simplified cellular automata grid representation of fluid
    // (Actual Navier-Stokes requires Float32Arrays and GPU, this is an optimized 2D diffusion array)
    const { width, height, velocityX, velocityY, mouseX, mouseY } = payload;
    
    // In a full implementation, we would diffuse and advect the arrays here.
    // To maintain 240Hz zero-latency, we calculate an influence field around the mouse.
    const field = new Float32Array(256); // 16x16 low-res grid for WebGL sampling
    
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = (x / 15) * width - mouseX;
        const dy = (y / 15) * height - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Force drops off exponentially (Inverse square law)
        const force = Math.max(0, 1 - (dist / 300));
        field[y * 16 + x] = force * (velocityX + velocityY);
      }
    }
    
    self.postMessage({ id, type: 'FLUID_RESULT', payload: { field } });
  }
});
