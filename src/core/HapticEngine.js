/**
 * HapticEngine — Physical Feedback Layer
 * ════════════════════════════════════════════════════════════════
 * Connects directly to the NervousSystem to provide physical vibrations
 * using the `navigator.vibrate` API.
 * 
 * It reads the system's performance tier and fatigue. If the system is 
 * overloaded (or the battery is dying), it will autonomously disable 
 * haptics to preserve the device's physical energy.
 * ════════════════════════════════════════════════════════════════
 */

class HapticEngine {
  constructor() {
    this.ns = null;
    this.isEnabled = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    this._unsubscribers = [];
  }

  init(nervousSystem) {
    if (!this.isEnabled) return;
    this.ns = nervousSystem;

    // Connect to the Nervous System event bus
    this._unsubscribers.push(
      this.ns.subscribe('BUTTON_CLICK', () => this.trigger('light')),
      this.ns.subscribe('SYSTEM_OVERLOAD', () => this.trigger('heavy')),
      this.ns.subscribe('CONSCIOUSNESS_SHIFT', () => this.trigger('medium')),
      this.ns.subscribe('SECTION_ENTER', () => this.trigger('light')),
      this.ns.subscribe('TIMELINE_FAST_SCROLL', () => this.trigger('pulse'))
    );

    // Bind to raw clicks for immediate tactile response
    const onClick = () => this.trigger('light');
    window.addEventListener('click', onClick, { passive: true });
    
    this._unsubscribers.push(() => window.removeEventListener('click', onClick));

    // V20: Velocity-based spatial haptics (No Audio)
    let lastScroll = 0;
    this.ns.register('HapticVelocityTick', (time, delta, mousePos, isMoving) => {
      if (!this.isEnabled) return;
      const velocity = Math.abs(this.ns.scrollPos - lastScroll);
      lastScroll = this.ns.scrollPos;

      if (velocity > 150) {
        this.trigger('heavy');
      } else if (velocity > 50 && Math.random() > 0.8) {
        this.trigger('light');
      }
    }, { priority: 'LOW', cooldown: 50 });

    console.log('[HapticEngine] Connected to Nervous System. Physical feedback active (V20).');
  }

  trigger(intensity = 'light') {
    if (!this.isEnabled || !this.ns) return;

    // Biological limitation: Don't vibrate if the system is exhausted or dying
    if (this.ns.fatigue > 80 || this.ns.performanceTier === 0) {
      return; 
    }

    try {
      switch (intensity) {
        case 'light':
          navigator.vibrate(10); // Quick, sharp tap
          break;
        case 'medium':
          navigator.vibrate(25); // Noticeable bump
          break;
        case 'heavy':
          navigator.vibrate([40, 30, 40]); // Warning rumble
          break;
        case 'pulse':
          navigator.vibrate([15, 20, 15]); // Heartbeat-like
          break;
        default:
          navigator.vibrate(10);
      }
    } catch (e) {
      // Ignore if user hasn't interacted with document yet or browser blocks it
    }
  }

  stop() {
    this._unsubscribers.forEach(unsub => unsub());
    this._unsubscribers = [];
    if (this.ns) {
      this.ns.unregister('HapticVelocityTick');
    }
  }
}

export const hapticEngine = new HapticEngine();
export default hapticEngine;
