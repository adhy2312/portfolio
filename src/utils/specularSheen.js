/**
 * Apple-Style Specular Card Sheen Engine
 * High-performance global event delegation for cursor-tracked specular light reflection.
 * Runs only on fine pointer devices (desktops/laptops).
 */

let initialized = false;

export const initSpecularSheen = () => {
  if (initialized || typeof window === 'undefined') return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  let activeCard = null;
  let rafId = null;
  let lastX = -1000;
  let lastY = -1000;

  const updateCardLight = () => {
    if (activeCard) {
      const rect = activeCard.getBoundingClientRect();
      const x = Math.round(lastX - rect.left);
      const y = Math.round(lastY - rect.top);
      activeCard.style.setProperty('--spec-x', `${x}px`);
      activeCard.style.setProperty('--spec-y', `${y}px`);
    }
    rafId = null;
  };

  const handlePointerMove = (e) => {
    lastX = e.clientX;
    lastY = e.clientY;

    const card = e.target?.closest ? e.target.closest('.specular-card') : null;
    if (card) {
      activeCard = card;
      if (!rafId) {
        rafId = requestAnimationFrame(updateCardLight);
      }
    } else {
      activeCard = null;
    }
  };

  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  initialized = true;
};
