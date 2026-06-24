# AI History

## 2026-06-22
- **Performance Fixes**: 
  - Debounced the `ResizeObserver` `ScrollTrigger.refresh()` call in `src/App.js` to fix severe layout thrashing and scrolling performance on high refresh rate monitors (144Hz).
  - Removed duplicate initialization of `smoothScroll` Engine alongside `Lenis` (useHybridMotion) to stop scroll engines from fighting each other.
- **Styling**:
  - Added a `.glass-card:active` state to `src/index.css` resetting `translate` and `box-shadow` to create a satisfying, clickable neobrutalist push effect.
- **Sanity Schema**:
  - Implemented the Atomic content model: created `atomicBlockContent.js` and `atomicTextBlock.js`.
  - Registered the new atomic schemas in `studio/schemas/index.js` allowing custom highlight, glitch, and accent color marks over specific characters.
- **Extreme Performance Recovery**:
  - Activated a global kill-switch for `backdrop-filter` in `src/index.css`. Layered glassmorphism filters were forcing the GPU/CPU to re-composite the entire screen on every 144Hz frame, causing 11 FPS hardware exhaustion. Disabling this detached the massive composite load from the CPU, unlocking true 144Hz smooth scroll.
