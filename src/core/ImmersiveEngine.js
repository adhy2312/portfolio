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

    const root = document.documentElement;
    
    // 1. Biological Rhythm Injection
    // Expose the raw heartbeat value to CSS for global breathing animations
    root.style.setProperty('--ns-heartbeat', heartbeat.toFixed(4));

    // 2. Adrenaline Mapping
    // Calculate global tension based on scrolling and moving speeds
    const targetAdrenaline = this.ns.isMoving ? 1.0 : Math.max(0, 1.0 - (this.ns.state.idleSeconds / 10));
    // Smooth dampening
    this.ns.state.adrenaline += (targetAdrenaline - this.ns.state.adrenaline) * (delta * 0.005);
    
    // Expose adrenaline so CSS can speed up animations when the user is erratic
    root.style.setProperty('--ns-adrenaline', this.ns.state.adrenaline.toFixed(3));

    // 3. Fatigue / Performance Degradation (Battery Symbiosis)
    // If the system is tired, physically darken the UI to save power
    const fatigue = this.ns.fatigue;
    if (fatigue > 30) {
      const dimming = Math.min(0.4, (fatigue - 30) * 0.01);
      root.style.setProperty('--ns-fatigue-dimming', dimming.toFixed(3));
    } else {
      root.style.setProperty('--ns-fatigue-dimming', '0');
    }
  }

  _triggerAtmosphereShift(atmosphereType) {
    const root = document.documentElement;
    
    // Apply a massive but subtle global atmospheric filter shift
    switch(atmosphereType) {
      case 'dreaming':
        root.style.setProperty('--atmosphere-hue', '280deg');
        root.style.setProperty('--atmosphere-sat', '120%');
        break;
      case 'overload':
        root.style.setProperty('--atmosphere-hue', '0deg');
        root.style.setProperty('--atmosphere-sat', '60%');
        break;
      case 'cold':
        root.style.setProperty('--atmosphere-hue', '200deg');
        root.style.setProperty('--atmosphere-sat', '90%');
        break;
      case 'warm':
        root.style.setProperty('--atmosphere-hue', '30deg');
        root.style.setProperty('--atmosphere-sat', '110%');
        break;
      default:
        // Return to normal baseline
        root.style.setProperty('--atmosphere-hue', '260deg'); // Default purple lean
        root.style.setProperty('--atmosphere-sat', '100%');
    }
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
