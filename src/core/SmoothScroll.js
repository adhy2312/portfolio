/**
 * SmoothScroll — NervousSystem-Synchronized Butter Scroll Engine
 * ════════════════════════════════════════════════════════════════
 *
 * PHILOSOPHY:
 *   Uses the same GSAP ticker as NervousSystem — NO competing RAF loops.
 *   Momentum-based lerp scroll gives buttery smooth feel on all devices.
 *   Mobile: native scroll passthrough with momentum assist.
 *   Desktop: full intercepted lerp scroll.
 *
 * ARCHITECTURE:
 *   - Registers into NervousSystem as 'smooth-scroll' with CRITICAL priority
 *     so it always runs even under heavy load (tier 0).
 *   - Reads ns.scrollPos (already written by NervousSystem's global scroll listener)
 *   - Writes back a lerped value each frame — zero additional event listeners.
 *
 * MOBILE HANDLING:
 *   - On touch devices we skip DOM transform scroll (causes jank).
 *   - Instead we boost the native scroll experience with momentum correction.
 *   - The lerp factor auto-adjusts based on NervousSystem.fps (adaptive smoothness).
 * ════════════════════════════════════════════════════════════════
 */
import ns from './NervousSystem';

class SmoothScrollEngine {
  constructor() {
    this._current    = 0;   // Current lerped scroll position
    this._target     = 0;   // Target (native) scroll position
    this._isRunning  = false;
    this._isMobile   = false;
    this._lerpFactor = 0.09; // 0 = laggy, 1 = instant. 0.09 = buttery sweet spot
    this._lastTarget = 0;
    this._velocity   = 0;
    this._settled    = true;
    this._mounted    = false;

    // Adaptive lerp: tighten when system is under load so it never feels disconnected
    this._LERP_FAST   = 0.12;  // High FPS
    this._LERP_NORMAL = 0.09;  // Normal FPS (60fps target)
    this._LERP_SLOW   = 0.065; // Low FPS (system strain)

    this._detectDevice();
  }

  _detectDevice() {
    if (typeof window === 'undefined') return;
    // Touch device detection — standard + vendor
    this._isMobile = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  }

  /**
   * Initialize — call once on app boot.
   * Waits for NervousSystem to be running before registering.
   */
  init() {
    if (this._mounted) return;
    this._mounted = true;

    if (typeof window === 'undefined') return;

    // Always use native scroll on mobile — transforms cause jank
    if (this._isMobile) {
      this._initMobileMode();
      return;
    }

    // Desktop: intercept scroll and lerp it
    this._initDesktopMode();
  }

  // ─── DESKTOP MODE ────────────────────────────────────────────────
  _initDesktopMode() {
    // Sync current position on boot
    this._current = window.scrollY;
    this._target  = window.scrollY;

    // Register into the NervousSystem unified RAF loop
    // CRITICAL priority — this must ALWAYS run, even when tier is 0
    ns.register('smooth-scroll', (time, delta) => {
      this._tick(delta);
    }, { priority: 'CRITICAL', cooldown: 0 });

    // Listen to the NervousSystem scroll position (already tracked)
    // We also add our own for extra precision
    window.addEventListener('wheel', this._onWheel.bind(this), { passive: true });
    window.addEventListener('scroll', this._onScroll.bind(this), { passive: true });

    this._isRunning = true;
    console.log('%c[SmoothScroll] ✓ Desktop lerp mode active — synced to NervousSystem ticker', 'color: #00ff41; font-weight: bold;');
  }

  // ─── MOBILE MODE ─────────────────────────────────────────────────
  _initMobileMode() {
    // On mobile: enable momentum/inertia via CSS only (no JS transform scroll)
    // We enhance the native scroll by ensuring the body has the right CSS
    this._applyMobileScrollCSS();

    // Still register for scroll position tracking (used by NervousSystem.scrollPos)
    ns.register('smooth-scroll', (time, delta) => {
      // On mobile: just keep target synced — no lerp applied
      this._target  = window.scrollY;
      this._current = window.scrollY;
    }, { priority: 'NORMAL', cooldown: 16 });

    console.log('%c[SmoothScroll] ✓ Mobile native-scroll mode active — momentum CSS enabled', 'color: #00ddff; font-weight: bold;');
  }

  _applyMobileScrollCSS() {
    // CSS-level momentum scroll for iOS
    const style = document.createElement('style');
    style.id = 'smooth-scroll-mobile-css';
    style.textContent = `
      /* SmoothScroll — Mobile Momentum CSS */
      html {
        scroll-behavior: auto !important; /* Let JS handle smooth, not CSS (conflicts) */
        -webkit-overflow-scrolling: touch; /* iOS momentum */
        overflow-y: scroll;
      }
      body {
        overscroll-behavior-y: none; /* Kill elastic bounce that fights lerp */
        -webkit-overflow-scrolling: touch;
      }
      /* Ensure no element blocks touch-action scrolling */
      .dna-interactive-zone {
        touch-action: pan-x !important; /* Allow vertical scroll, intercept only horizontal */
      }
    `;
    document.head.appendChild(style);
  }

  // ─── DESKTOP TICK ────────────────────────────────────────────────
  _tick(delta = 16.67) {
    // Read latest target from NervousSystem (already updated by its scroll listener)
    this._target = ns.scrollPos || window.scrollY;

    const diff = this._target - this._current;

    // Skip sub-pixel updates — avoid unnecessary work
    if (Math.abs(diff) < 0.05) {
      if (!this._settled) {
        this._current  = this._target;
        this._velocity = 0;
        this._settled  = true;
      }
      return;
    }

    this._settled = false;

    // Adaptive lerp factor based on NervousSystem's measured FPS
    let lerpFactor = this._LERP_NORMAL;
    if (ns.fps >= 55) {
      lerpFactor = this._LERP_FAST;
    } else if (ns.fps < 35) {
      lerpFactor = this._LERP_SLOW;
    }

    // Time-normalized lerp so scroll speed is consistent at any FPS
    // Formula: lerped = 1 - (1 - lerpFactor)^(delta/16.67)
    const normalizedLerp = 1 - Math.pow(1 - lerpFactor, delta / 16.67);
    this._current += diff * normalizedLerp;

    // Velocity tracking (used by NervousSystem for intent detection)
    this._velocity = this._current - this._lastTarget;
    this._lastTarget = this._current;

    // Update NervousSystem scroll position with lerped value
    // This ensures ScrollTrigger and other subsystems see smooth values
    ns.scrollPos = this._current;
  }

  _onWheel(e) {
    // Allow NervousSystem to also process this — no prevention needed on desktop
    this._target = Math.max(0, Math.min(
      document.documentElement.scrollHeight - window.innerHeight,
      this._target + (e.deltaY * (e.deltaMode === 1 ? 28 : 1))
    ));
  }

  _onScroll() {
    this._target = window.scrollY;
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────

  /** Smooth-scroll to a Y position */
  scrollTo(y, { duration = 0.8, ease = 'power3.out' } = {}) {
    if (this._isMobile) {
      // Native smooth scroll on mobile
      window.scrollTo({ top: y, behavior: 'smooth' });
      return;
    }
    // Desktop: animate target
    import('gsap').then(({ default: gsap }) => {
      gsap.to(this, {
        _target: y,
        duration,
        ease,
        onUpdate: () => { ns.scrollPos = this._target; }
      });
    });
  }

  /** Smooth-scroll to a DOM element */
  scrollToElement(el, { offset = 0, ...opts } = {}) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top  = rect.top + (window.scrollY || window.pageYOffset) - offset;
    this.scrollTo(top, opts);
  }

  /** Pause/resume */
  pause()  { ns.unregister('smooth-scroll'); this._isRunning = false; }
  resume() { this.init(); }

  destroy() {
    ns.unregister('smooth-scroll');
    window.removeEventListener('wheel',  this._onWheel);
    window.removeEventListener('scroll', this._onScroll);
    this._isRunning = false;
    this._mounted   = false;

    const mobileCss = document.getElementById('smooth-scroll-mobile-css');
    if (mobileCss) mobileCss.remove();
  }

  get currentY() { return this._current; }
  get targetY()  { return this._target;  }
  get velocity() { return this._velocity; }
  get isMobile() { return this._isMobile; }
}

// ────────────────────────────────────────────────────────────────
// Singleton export — one instance for the entire app lifetime
// ────────────────────────────────────────────────────────────────
export const smoothScroll = new SmoothScrollEngine();
export default smoothScroll;
