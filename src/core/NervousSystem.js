/**
 * NervousSystem — Unified Brain Singleton
 * ════════════════════════════════════════════════════════════════
 *
 * ONE file that owns:
 *   1. EVENT BUS       — replaces NeuralEventBus (backward-compatible shim kept)
 *   2. RAF SCHEDULER   — replaces SystemOrchestrator's inner loop
 *   3. LIVE STATE      — replaces PresenceEngine (direct memory reads, zero latency)
 *   4. SOUL ENGINE     — Digital Soul emotional state machine runs here natively
 *
 * WHY ONE FILE:
 *   Previous architecture: ConsciousnessContext → NeuralEventBus.emit() →
 *     DigitalSoul.subscribe() → setTimeout(Nms) → state change.
 *   That's 3 hops + artificial delay for every emotional reaction.
 *
 *   Now: ConsciousnessContext.write() → NervousSystem.state.* (direct)
 *        DigitalSoul RAF tick reads NervousSystem.state.* (direct, zero latency)
 *
 * PERFORMANCE PHILOSOPHY:
 *   - Single requestAnimationFrame loop for ALL subsystems
 *   - Priority scheduler: CRITICAL always runs, LOW drops when fatigued
 *   - Sleep mode: drops to 10fps when tab is hidden
 *   - All state is mutable primitives — no React state, no re-renders
 * ════════════════════════════════════════════════════════════════
 */
import gsap from 'gsap';

// ─── SOUL EMOTIONAL STATE ────────────────────────────────────────
// Runs natively inside the NervousSystem RAF loop.
// The Digital Soul component reads `ns.soul.*` directly — zero hop.
const createSoulState = () => ({
  emotion:      'observing', // calm|distant|observing|exhausted|curious|dormant|thinking|resonating
  emotionTimer: 0,
  idleTimer:    0,
  whisperTimer: 0,
  fractureTimer:0,
  lastMouse:    { x: 0, y: 0 },
  wanderAngle:  Math.random() * Math.PI * 2,
  isClicked:    false,
  lastScroll:   0,
  hoverTime:    0,
  whisperShown: false,
  hoveredNode:  null,
  // Interpolated position (written by Soul component's RAF subscriber)
  posX: typeof window !== 'undefined' ? window.innerWidth  / 2 : 400,
  posY: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
  targetX: typeof window !== 'undefined' ? window.innerWidth  / 2 : 400,
  targetY: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
});

// ────────────────────────────────────────────────────────────────
class NervousSystem {
  constructor() {

    // ─── EVENT BUS ──────────────────────────────────────
    this._listeners = {};
    this._history   = [];   // Rolling 80-event log

    // ─── LIVE STATE (direct read by all RAF loops) ───────
    this.state = {
      // Consciousness tier
      tier:          'SUBCONSCIOUS',
      score:         0,
      isHyperActive: false,

      // Visitor identity
      isReturningVisitor: false,
      totalVisits:        0,
      temporalAge:        0,

      // Presence / adrenaline
      adrenaline:   0,
      idleSeconds:  0,
      isDreaming:   false,
      isSystemThinking: false,

      // Section emotional temperature
      sectionAtmosphere: 'open',
      sectionWarmth:     0.6,
      sectionGlow:       0.7,
      sectionSilence:    false,
      activeSection:     'Hero',

      // Environment
      weatherCondition: 'Clear',
      isLateNight:      false,
      isRaining:        false,

      // Heartbeat wave (−1 → 1, updated every frame)
      heartbeatValue: 0,
      _heartbeatPhase: 0,
    };

    // ─── DIGITAL SOUL STATE (first-class citizen) ────────
    this.soul = createSoulState();

    // ─── RAF SCHEDULER ───────────────────────────────────
    this._callbacks    = new Map();   // id → { fn, opts, lastRun }
    this._isRunning    = false;
    this._lastTime     = 0;
    this._frameCount   = 0;
    this._lastFpsTime  = 0;
    this.fps           = 60;
    this.performanceTier = typeof window !== 'undefined' && window.innerWidth <= 768 ? 1 : 3;
    this.fatigue       = 0;
    this.isSleeping    = false;

    // ─── INPUT STATE ─────────────────────────────────────
    this.mousePos  = { x: -1000, y: -1000 };
    this.scrollPos = 0;
    this.isMoving  = false;
    this._idleMovTimer = null;

    // ─── SOUL EMOTIONAL REACTION QUEUE ───────────────────
    // Instead of setTimeout hops, we use a queue processed in RAF
    this._soulReactions = [];  // [{ emotion, delay, scheduledAt }]
  }

  // ════════════════════════════════════════
  // EVENT BUS API (backward-compatible with NeuralEventBus)
  // ════════════════════════════════════════

  subscribe(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data = {}) {
    const ts = Date.now();
    this._history.push({ event, data, ts });
    if (this._history.length > 80) this._history.shift();

    // ─── SOUL EMOTIONAL REACTIONS (queued, not setTimeout) ───
    // These execute on next RAF frame — <16ms latency vs 300ms+ before
    switch (event) {
      case 'VISITOR_DEEP_READING': this._queueSoulEmotion('observing',   1800); break;
      case 'SYSTEM_OVERLOAD':      this._queueSoulEmotion('exhausted',   800);  break;
      case 'SOUL_CURIOUS':         this._queueSoulEmotion('curious',     2400); break;
      case 'DREAM_STATE':          this._queueSoulEmotion('dormant',     3200); break;
      case 'ATMOSPHERE_CALM':      this._queueSoulEmotion('calm',        1200); break;
      case 'TIMELINE_FAST_SCROLL': this._queueSoulEmotion('distant',     200);  break;
      case 'TIMELINE_LINGER':      this._queueSoulEmotion('resonating',  600);  break;
      case 'HYPER_CONSCIOUS_ENTER':this._queueSoulEmotion('resonating',  100);  break;
      case 'HYPER_CONSCIOUS_EXIT': this._queueSoulEmotion('observing',   2800 + Math.random() * 1600); break;
      case 'MINIADHY_THINKING_START': this._queueSoulEmotion('resonating', 80); break;
      case 'MINIADHY_THINKING_END':   this._queueSoulEmotion('calm',       1200); break;
      case 'CONSCIOUSNESS_SHIFT':
        if (data.tier === 'HYPER_CONSCIOUS')   this._queueSoulEmotion('resonating', 400 + Math.random() * 800);
        else if (data.tier === 'SUPER_CONSCIOUS') this._queueSoulEmotion('curious', 1000);
        break;
      case 'SECTION_ENTER':
        if (data.emotion?.atmosphere === 'cold')      this._queueSoulEmotion('distant',   500 + Math.random() * 600);
        else if (data.emotion?.atmosphere === 'warm') this._queueSoulEmotion('calm',      800);
        else if (data.emotion?.atmosphere === 'nostalgic') this._queueSoulEmotion('thinking', 1200);
        break;
      default: break;
    }

    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => { try { cb(data); } catch {} });
  }

  _queueSoulEmotion(emotion, delayMs) {
    // Add natural micro-variation (±15%) to feel less mechanical
    const jitter = delayMs * (0.85 + Math.random() * 0.3);
    this._soulReactions.push({ emotion, scheduledAt: Date.now() + jitter });
  }

  // ════════════════════════════════════════
  // RAF SCHEDULER API (backward-compatible with SystemOrchestrator)
  // ════════════════════════════════════════

  register(id, fn, opts = {}) {
    const existing = this._callbacks.get(id);
    if (existing) {
      existing.fn   = fn;
      existing.opts = opts;
    } else {
      this._callbacks.set(id, { fn, opts, lastRun: 0 });
    }
  }

  unregister(id) {
    this._callbacks.delete(id);
  }

  // ════════════════════════════════════════
  // LIVE STATE WRITE HELPERS
  // (Called by ConsciousnessContext — synchronous, zero latency)
  // ════════════════════════════════════════

  setTier(tier, score) {
    this.state.tier          = tier;
    this.state.score         = score;
    this.state.isHyperActive = tier === 'HYPER_CONSCIOUS';
    try { document.documentElement.setAttribute('data-consciousness', tier); } catch {}
  }

  setSection(section, emotion) {
    this.state.activeSection      = section;
    this.state.sectionAtmosphere  = emotion.atmosphere;
    this.state.sectionWarmth      = emotion.warmth;
    this.state.sectionGlow        = emotion.glow;
    this.state.sectionSilence     = emotion.silence;
  }

  setWeather(condition) {
    this.state.weatherCondition = condition;
    this.state.isRaining = condition === 'Rain' || condition === 'Drizzle';
  }

  setSystemThinking(val) {
    this.state.isSystemThinking = val;
  }

  // ════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════

  start() {
    if (this._isRunning) return;
    this._isRunning = true;

    this._lastFpsTime = performance.now();
    this._lastTime    = performance.now();

    this._loop = () => {
      const time = performance.now();
      if (this.isSleeping) {
        this._lastTime = time;
        return;
      }

      const delta = Math.min(time - this._lastTime, 100); // Cap at 100ms (tab switch)
      this._lastTime = time;

      // ─── FPS Tracking & Tier Adjustment ───
      this._frameCount++;
      if (time - this._lastFpsTime >= 1000) {
        this.fps = this._frameCount;
        if (this._frameCount < 30) {
          this.performanceTier = Math.max(0, this.performanceTier - 1);
          this.fatigue = Math.min(100, this.fatigue + 15);
          if (this.fatigue > 80) this.emit('SYSTEM_OVERLOAD');
        } else if (this._frameCount >= 55) {
          const maxTier = window.innerWidth <= 768 ? 1 : 3;
          this.performanceTier = Math.min(maxTier, this.performanceTier + 1);
          this.fatigue = Math.max(0, this.fatigue - 5);
        } else {
          this.fatigue = Math.min(100, this.fatigue + 1);
        }
        this._frameCount  = 0;
        this._lastFpsTime = time;
      }

      // ─── Heartbeat ───
      const hbSpeed = this.performanceTier >= 2 ? 0.001 : 0.0005;
      this.state._heartbeatPhase += delta * hbSpeed * Math.max(0.2, 1 - this.fatigue / 100);
      this.state.heartbeatValue   = Math.sin(this.state._heartbeatPhase);

      if (this.isMoving && time - this._lastMoveTime > 2000) {
        this.isMoving = false;
      }

      // ─── Process Soul Reaction Queue ───
      const now = Date.now();
      let processed = false;
      this._soulReactions = this._soulReactions.filter(r => {
        if (r.scheduledAt <= now && !processed) {
          this.soul.emotion      = r.emotion;
          this.soul.emotionTimer = 3000 + Math.random() * 3000;
          processed = true;
          return false; // remove from queue
        }
        return true;
      });

      // ─── Run Registered Subsystem Callbacks ───
      const tier     = this.performanceTier;
      const fatigued = this.fatigue > 50;

      for (const [id, entry] of this._callbacks) {
        const { fn, opts, lastRun } = entry;
        const priority = opts.priority || 'NORMAL';

        if (tier === 0 && priority !== 'CRITICAL') continue;
        if (fatigued && priority === 'LOW') continue;
        if (opts.cooldown && (time - lastRun) < opts.cooldown) continue;

        entry.lastRun = time;
        try {
          fn(time, delta, this.mousePos, this.isMoving, tier, this.state.heartbeatValue);
        } catch (err) {
          console.error(`[NervousSystem] Callback error for "${id}":`, err);
        }
      }
    };

    gsap.ticker.add(this._loop);
    this._setupGlobalListeners();
  }

  stop() {
    if (this._isRunning) {
      gsap.ticker.remove(this._loop);
      this._isRunning = false;
    }
  }

  // ════════════════════════════════════════
  // GLOBAL INPUT LISTENERS
  // ════════════════════════════════════════

  _setupGlobalListeners() {
    this._lastMoveTime = 0;
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.mousePos  = { x: clientX, y: clientY };
      this.isMoving  = true;
      this._lastMoveTime = performance.now();
    };

    const onScroll = () => { this.scrollPos = window.scrollY; };

    const onVisibility = () => { this.isSleeping = document.hidden; };

    const onMouseDown = () => { this.soul.isClicked = true;  };
    const onMouseUp   = () => { this.soul.isClicked = false; };

    window.addEventListener('mousemove',       onMove,       { passive: true });
    window.addEventListener('scroll',          onScroll,     { passive: true });
    window.addEventListener('touchmove',       onMove,       { passive: true });
    window.addEventListener('mousedown',       onMouseDown,  { passive: true });
    window.addEventListener('mouseup',         onMouseUp,    { passive: true });
    window.addEventListener('touchstart',      onMouseDown,  { passive: true });
    window.addEventListener('touchend',        onMouseUp,    { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    // ─── Late-night clock tick (once per minute is enough) ───
    const clockTick = () => {
      const h = new Date().getHours();
      this.state.isLateNight = h < 5 || h >= 23;
    };
    clockTick();
    setInterval(clockTick, 60000);
  }
}

// ────────────────────────────────────────────────────────────────
// Singleton export — one instance for the entire app lifetime
// ────────────────────────────────────────────────────────────────
export const ns = new NervousSystem();
export default ns;
