/* eslint-disable no-restricted-globals */
/* global Atomics */

/**
 * V30 PHYSICS ENGINE WORKER (Quantum State Suspense)
 * ════════════════════════════════════════════════════════════════
 * This handles raw mathematical calculations for 3D matrices, 
 * bypassing the UI thread. Uses SharedArrayBuffer for zero-latency memory sharing.
 * ════════════════════════════════════════════════════════════════
 */

let sharedBuffer;
let floatArray;

self.addEventListener('message', (e) => {
  const { type, payload } = e.data;

  if (type === 'INIT_SAB') {
    sharedBuffer = payload.buffer;
    floatArray = new Float32Array(sharedBuffer);
  }

  if (type === 'CALC_MATRIX' && floatArray) {
    // Perform complex transform calculation (e.g. Parallax or 3D Node rotations)
    // floatArray[0] = translateX
    // floatArray[1] = translateY
    // floatArray[2] = rotateZ
    
    const { scrollY, mouseX, mouseY, depth } = payload;
    
    // Example heavy math: Quantum matrix multiplication
    const tx = (mouseX * 0.05) * depth;
    const ty = (scrollY * -0.2) + (mouseY * 0.05) * depth;
    const rz = (mouseX * 0.001) * depth;

    // Write directly to shared memory (Main thread reads this synchronously!)
    Atomics.store(floatArray, 0, tx);
    Atomics.store(floatArray, 1, ty);
    Atomics.store(floatArray, 2, rz);
  }
});
