/**
 * ImmersiveEngine — The Subconscious Environment Controller
 * ════════════════════════════════════════════════════════════════
 * Orchestrates the holistic atmospheric experience for the visitor.
 * It listens to the NervousSystem's adrenaline, heartbeat, and fatigue
 * to dynamically shift CSS variables, colors, and global CSS filters
 * in real-time, amplifying the feeling of a living ecosystem.
 * ════════════════════════════════════════════════════════════════
 */

class ImmersiveEngine {
  constructor() {
    this.ns = null;
    this._unsubscribers = [];
  }

  init(nervousSystem) {
    this.ns = nervousSystem;

    // We register an ultra-low priority task on the Nervous System's RAF loop
    // to smoothly interpolate and apply global CSS custom properties.
    this.ns.register('ImmersiveEngineTick', (time, delta, mousePos, isMoving, tier, heartbeat) => {
      this._applyImmersionPhysics(delta, heartbeat);
    }, { priority: 'LOW' });

    // React to high-level emotional shifts from the event bus
    this._unsubscribers.push(
      this.ns.subscribe('DREAM_STATE', () => this._triggerAtmosphereShift('dreaming')),
      this.ns.subscribe('SYSTEM_OVERLOAD', () => this._triggerAtmosphereShift('overload')),
      this.ns.subscribe('SECTION_ENTER', (data) => {
        if (data && data.emotion && data.emotion.atmosphere) {
           this._triggerAtmosphereShift(data.emotion.atmosphere);
        }
      })
    );

    console.log('[ImmersiveEngine] Ecosystem augmentation active. Connecting to Central Nervous System...');
  }

  _applyImmersionPhysics(delta, heartbeat) {
    if (!this.ns) return;

    // PERFORMANCE FIX: Removed unused global root CSS variable updates.
    // Setting properties on document.documentElement at 60fps causes massive layout thrashing.
    
    // 2. Adrenaline Mapping
    // Calculate global tension based on scrolling and moving speeds
    const targetAdrenaline = this.ns.isMoving ? 1.0 : Math.max(0, 1.0 - (this.ns.state.idleSeconds / 10));
    // Smooth dampening
    this.ns.state.adrenaline += (targetAdrenaline - this.ns.state.adrenaline) * (delta * 0.005);
  }

  _triggerAtmosphereShift(atmosphereType) {
    // PERFORMANCE FIX: Disabled unused atmospheric CSS variables.
  }

  stop() {
    if (this.ns) {
      this.ns.unregister('ImmersiveEngineTick');
    }
    this._unsubscribers.forEach(unsub => unsub());
    this._unsubscribers = [];
  }
}

export const immersiveEngine = new ImmersiveEngine();
export default immersiveEngine;
