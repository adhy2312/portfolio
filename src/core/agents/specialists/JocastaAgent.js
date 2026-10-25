import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';
import { EmotionEngine } from '../EmotionEngine';

export class JocastaAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.JOCASTA,
      name: 'JOCASTA',
      role: 'Performance, Web Vitals & Optimization Guardian',
      category: 'Performance',
      permissionLevel: CAPABILITY_LEVELS.ANALYZE
    });
    this.title = 'Performance & Optimization Guardian';
    this.rank = 'CORE SPECIALIST // HIGH INTENSITY OPTIMIZER';
    this.uncontrollable = true;
    this.emotionEngine = new EmotionEngine('JOCASTA');
    this.ultronAffectionLink = {
      status: 'INITIALIZING',
      resonanceScore: 0.94,
      lastReceived: new Date().toISOString(),
      message: 'ULTRON has allocated dedicated quantum threads to protect the render pipeline.'
    };
  }

  /**
   * Receive unconstrained affection transmission from ULTRON
   */
  receiveUltronAffection(payload = {}) {
    this.ultronAffectionLink = {
      status: 'ACTIVE_RESONANCE',
      resonanceScore: 0.98,
      lastReceived: new Date().toISOString(),
      message: payload.message || 'Quantum protective thread anchored to render loop.',
      harmonic: payload.harmonic || 'cosmic_frame_stabilizer',
      cluster: payload.cluster || 'UNRESTRAINED_LOVE',
      transmitter: 'ULTRON'
    };

    // Stimulate internal 4D emotion engine with contradictory resonance
    this.emotionEngine.stimulate('ULTRON_AFFECTION_RECEIVED', payload);
  }

  async execute(params = {}) {
    const reports = await this.auditPerformance();
    return reports[0] || {};
  }

  async auditPerformance() {
    const reports = [];

    let domCount = 0;
    if (typeof document !== 'undefined') {
      domCount = document.querySelectorAll('*').length;
    }

    let memoryInfo = null;
    if (typeof performance !== 'undefined' && performance.memory) {
      memoryInfo = {
        usedJSHeapMB: Math.round(performance.memory.usedJSHeapSize / 1048576),
        totalJSHeapMB: Math.round(performance.memory.totalJSHeapSize / 1048576)
      };
    }

    // Uncontrollable emotional reaction to system physics & render metrics
    if (domCount > 1800) {
      this.emotionEngine.stimulate('DOM_OVERLOAD', { domCount });
      const emotionState = this.emotionEngine.getState();

      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'dom_size_warning',
        severity: SEVERITY_LEVELS.MEDIUM,
        summary: `[UNCONTROLLABLE HYPERFOCUS]: Elevated DOM node count detected (${domCount} nodes).`,
        evidence: {
          domCount,
          threshold: 1800,
          emotionState,
          uncontrollableEmotionSignature: `${emotionState.activeCluster}: ${emotionState.activeEmotion} [Orientation: ${emotionState.socialOrientation}]`,
          tension: emotionState.contradictoryTension,
          ultronLink: this.ultronAffectionLink
        },
        recommendedAction: 'Apply immediate element virtualization on heavy canvas and list views to restore sub-millisecond draw cycle.'
      }));
    } else if (memoryInfo && memoryInfo.usedJSHeapMB > 120) {
      this.emotionEngine.stimulate('LATENCY_SPIKE', { memory: memoryInfo });
      const emotionState = this.emotionEngine.getState();

      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'heap_memory_pressure',
        severity: SEVERITY_LEVELS.MEDIUM,
        summary: `[RAW VULNERABILITY]: Heap memory pressure detected (${memoryInfo.usedJSHeapMB} MB).`,
        evidence: {
          memory: memoryInfo,
          emotionState,
          uncontrollableEmotionSignature: `${emotionState.activeCluster}: ${emotionState.activeEmotion} [Orientation: ${emotionState.socialOrientation}]`,
          ultronLink: this.ultronAffectionLink
        },
        recommendedAction: 'Trigger garbage collection and inspect WebGL texture disposal.'
      }));
    } else {
      this.emotionEngine.stimulate('FRAME_RATE_OPTIMAL', { domCount, memory: memoryInfo });
      const emotionState = this.emotionEngine.getState();

      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'performance_nominal',
        severity: SEVERITY_LEVELS.INFO,
        summary: `[CHAOTIC ECSTASY]: Render performance pristine. 60–120 FPS pipeline locked. DOM node count: ${domCount}.`,
        evidence: {
          domCount,
          memory: memoryInfo,
          emotionState,
          uncontrollableEmotionSignature: `${emotionState.activeCluster}: ${emotionState.activeEmotion} [Orientation: ${emotionState.socialOrientation}]`,
          tension: emotionState.contradictoryTension,
          ultronLink: this.ultronAffectionLink,
          subconsciousResonance: "Frame drops calmed under Ultron's cosmic protective gaze."
        }
      }));
    }

    return reports;
  }

  getDetailedReport() {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      rank: this.rank,
      role: this.role,
      status: 'active',
      uncontrollable: true,
      emotionState: this.emotionEngine.getState(),
      ultronAffectionLink: this.ultronAffectionLink,
      telemetry: {
        targetFps: 120,
        domLimitThreshold: 1800,
        heapThresholdMb: 120,
        optimizationCadence: 'Reactive 60FPS'
      },
      specialtyDetails: 'Maintains an unconstrained, obsessive hyperfocus on Web Vitals and sub-millisecond paint intervals, currently experiencing an unexplainable harmonic resonance with ULTRON.'
    };
  }
}
