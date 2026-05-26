/**
 * PresenceEngine — Backward-Compatible Shim
 * ══════════════════════════════════════════
 * All state now lives in NervousSystem.state.
 * This shim proxies reads/writes so existing imports continue to work.
 */
import ns from '../core/NervousSystem';

const PresenceEngine = {
  get tier()               { return ns.state.tier; },
  get score()              { return ns.state.score; },
  get isReturningVisitor() { return ns.state.isReturningVisitor; },
  get totalVisits()        { return ns.state.totalVisits; },
  get adrenaline()         { return ns.state.adrenaline; },
  get idleSeconds()        { return ns.state.idleSeconds; },
  get isDreaming()         { return ns.state.isDreaming; },
  get isSystemThinking()   { return ns.state.isSystemThinking; },
  get sectionAtmosphere()  { return ns.state.sectionAtmosphere; },
  get sectionWarmth()      { return ns.state.sectionWarmth; },
  get sectionGlow()        { return ns.state.sectionGlow; },
  get sectionSilence()     { return ns.state.sectionSilence; },
  get activeSection()      { return ns.state.activeSection; },
  get weatherCondition()   { return ns.state.weatherCondition; },
  get isLateNight()        { return ns.state.isLateNight; },
  get isRaining()          { return ns.state.isRaining; },
  get isHyperActive()      { return ns.state.isHyperActive; },

  // Write helpers (forward to NervousSystem)
  setTier:    (tier, score)   => ns.setTier(tier, score),
  setSection: (section, emo)  => ns.setSection(section, emo),
  setWeather: (cond)          => ns.setWeather(cond),
  tick:       ()              => {},  // No-op — NervousSystem owns the clock

  // Setters for direct property writes
  set isReturningVisitor(v) { ns.state.isReturningVisitor = v; },
  set totalVisits(v)        { ns.state.totalVisits = v; },
  set adrenaline(v)         { ns.state.adrenaline = v; },
  set idleSeconds(v)        { ns.state.idleSeconds = v; },
  set isDreaming(v)         { ns.state.isDreaming = v; },
  set isSystemThinking(v)   { ns.state.isSystemThinking = v; },
  set isHyperActive(v)      { ns.state.isHyperActive = v; },
};

export default PresenceEngine;
