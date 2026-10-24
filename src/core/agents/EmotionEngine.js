/**
 * ════════════════════════════════════════════════════════════════════
 *  EMOTION ENGINE & REGULATION SYSTEM (FOR FRIDAY & JARVIS)
 * ════════════════════════════════════════════════════════════════════
 * Functional state-modeling and behavior-regulation architecture.
 * Evaluates operational stimuli as decision-support signals.
 *
 * CRITICAL SAFETY INVARIANT:
 * Simulated emotional states influence prioritization, depth of inquiry,
 * and conversational tone ONLY. They can NEVER bypass security controls,
 * authorization policies, or approval requirements.
 */

export class EmotionEngine {
  constructor(agentId, initialProfile = {}) {
    this.agentId = agentId;
    this.history = [];
    this.maxHistory = 50;

    // Default bounded state profiles
    if (agentId === 'FRIDAY') {
      this.state = {
        agent: 'FRIDAY',
        love: 0.65,             // Protective dedication to system security and user trust
        care: 0.85,             // Attentiveness to edge cases and user privacy
        vigilance: 0.70,        // Active scanning and anomaly detection readiness
        urgency: 0.20,          // Prioritization level for active findings
        confidence: 0.85,       // Grounded on verified evidence quality
        uncertainty: 0.15,      // Triggers requests for corroborating evidence
        operationalLoad: 0.25,  // Workload density (prompts deduplication)
        regulationMode: 'composed',
        ...initialProfile
      };
      this.baseline = {
        love: 0.65, care: 0.85, vigilance: 0.70, urgency: 0.20,
        confidence: 0.85, uncertainty: 0.15, operationalLoad: 0.25
      };
    } else if (agentId === 'JARVIS') {
      this.state = {
        agent: 'JARVIS',
        calmness: 0.88,         // Stability during routine operations
        curiosity: 0.60,        // Proactive investigation of subtle anomalies
        concern: 0.15,          // Escalation indicator for failing agents/services
        confidence: 0.90,       // Evidence-grounded operational certainty
        uncertainty: 0.10,      // Need for independent agent cross-verification
        coordinationLoad: 0.30, // Multi-agent orchestration volume
        regulationMode: 'serene',
        ...initialProfile
      };
      this.baseline = {
        calmness: 0.88, curiosity: 0.60, concern: 0.15,
        confidence: 0.90, uncertainty: 0.10, coordinationLoad: 0.30
      };
    } else {
      this.state = { agent: agentId, confidence: 0.8, operationalLoad: 0.2, ...initialProfile };
      this.baseline = { ...this.state };
    }

    this.clampState();
  }

  /**
   * Clamps all numerical variables to [0.0, 1.0] range
   */
  clampState() {
    for (const key of Object.keys(this.state)) {
      if (typeof this.state[key] === 'number') {
        this.state[key] = Math.max(0.0, Math.min(1.0, Math.round(this.state[key] * 1000) / 1000));
      }
    }
  }

  /**
   * Ingests operational evidence/stimulus and adjusts behavioral state
   */
  stimulate(eventType, evidence = {}) {
    const timestamp = new Date().toISOString();
    const previousState = { ...this.state };

    if (this.agentId === 'FRIDAY') {
      switch (eventType) {
        case 'THREAT_DETECTED':
          this.state.vigilance = Math.min(1.0, this.state.vigilance + 0.25);
          this.state.urgency = Math.min(1.0, this.state.urgency + 0.35);
          this.state.uncertainty = evidence.isVerified ? Math.max(0.05, this.state.uncertainty - 0.1) : Math.min(0.8, this.state.uncertainty + 0.2);
          this.state.regulationMode = this.state.urgency > 0.6 ? 'heightened' : 'alert';
          break;

        case 'SECURITY_VERIFIED':
          this.state.confidence = Math.min(1.0, this.state.confidence + 0.15);
          this.state.urgency = Math.max(0.1, this.state.urgency - 0.2);
          this.state.uncertainty = Math.max(0.05, this.state.uncertainty - 0.15);
          this.state.regulationMode = 'composed';
          break;

        case 'DATA_EXPOSURE_RISK':
          this.state.care = Math.min(1.0, this.state.care + 0.2);
          this.state.vigilance = Math.min(1.0, this.state.vigilance + 0.3);
          this.state.urgency = Math.min(1.0, this.state.urgency + 0.4);
          this.state.regulationMode = 'protective';
          break;

        case 'TASK_LOAD_SPIKE':
          this.state.operationalLoad = Math.min(1.0, this.state.operationalLoad + 0.25);
          break;

        default:
          break;
      }
    } else if (this.agentId === 'JARVIS') {
      switch (eventType) {
        case 'ANOMALY_SPOTTED':
          this.state.curiosity = Math.min(1.0, this.state.curiosity + 0.3);
          this.state.calmness = Math.max(0.5, this.state.calmness - 0.15);
          this.state.regulationMode = 'analytical';
          break;

        case 'AGENT_STALLED':
        case 'SERVICE_OUTAGE':
          this.state.concern = Math.min(1.0, this.state.concern + 0.4);
          this.state.calmness = Math.max(0.4, this.state.calmness - 0.3);
          this.state.uncertainty = Math.min(0.9, this.state.uncertainty + 0.25);
          this.state.regulationMode = 'focused';
          break;

        case 'TASKS_SYNCHRONIZED':
          this.state.confidence = Math.min(1.0, this.state.confidence + 0.1);
          this.state.concern = Math.max(0.05, this.state.concern - 0.2);
          this.state.calmness = Math.min(1.0, this.state.calmness + 0.15);
          this.state.coordinationLoad = Math.max(0.15, this.state.coordinationLoad - 0.2);
          this.state.regulationMode = 'serene';
          break;

        default:
          break;
      }
    }

    this.clampState();

    // Log significant transitions for transparency
    this.history.unshift({
      timestamp,
      eventType,
      evidenceSummary: evidence.summary || 'Operational signal',
      previousState,
      newState: { ...this.state }
    });

    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    return this.getState();
  }

  /**
   * Slowly recovers behavioral signals toward peaceful resting baseline (homeostasis)
   */
  decayTowardBaseline(factor = 0.08) {
    for (const key of Object.keys(this.baseline)) {
      if (typeof this.state[key] === 'number') {
        const diff = this.baseline[key] - this.state[key];
        this.state[key] += diff * factor;
      }
    }
    this.clampState();
  }

  /**
   * Returns current calibrated state object
   */
  getState() {
    return {
      ...this.state,
      lastUpdated: new Date().toISOString()
    };
  }
}
