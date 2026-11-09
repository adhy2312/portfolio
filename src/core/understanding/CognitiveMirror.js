/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE MIRROR — EVIDENCE-BACKED THINKING & PREFERENCE MODEL
 * ════════════════════════════════════════════════════════════════════
 * Module of the Personal Understanding Engine (AUA).
 * 
 * Purpose:
 * Builds an inspectable, correctable model of Adhy's thinking patterns,
 * problem-solving preferences, and technical tendencies.
 * 
 * CORE ARCHITECTURAL INVARIANTS:
 * 1. Evidence-backed: Every inferred tendency is linked to observable evidence and confidence.
 * 2. Explicit correction precedence: Direct user corrections strictly override inferences with 1.0 confidence.
 * 3. Never pathologize: Strictly evaluates engineering & creative preferences, never psychological diagnoses.
 * 4. Temporal decay: Isolated interactions never become permanent traits without repeated confirmation.
 */

import { adhyModel } from '../identity/AdhyModel';
import { cognitiveLearningEngine } from '../learning/CognitiveLearningEngine';

export class CognitiveMirror {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_cognitive_mirror_v3';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.adhyModel = adhyModel;
    this.dimensions = {};
    this.observationsLog = [];
    this.initDefaultDimensions();
    this.loadState();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); }
    };
  }

  initDefaultDimensions() {
    this.dimensions = {
      practicalVsTheoretical: {
        id: 'dim_practical_theoretical',
        name: 'Practical Prototype vs Theoretical Excess',
        value: 0.85, // 0.0 (Pure Theory) to 1.0 (Practical Working Build)
        confidence: 0.95,
        type: 'explicit',
        userApproved: true,
        evidence: 'Stated priority: Working physical hardware and tangible code before dry abstractions.',
        observationsCount: 12,
        lastObservedAt: new Date().toISOString()
      },
      analyticalVsExploratory: {
        id: 'dim_analytical_exploratory',
        name: 'Analytical Depth vs Exploratory Brainstorming',
        value: 0.65, // Balances DSP/math rigor with creative exploration
        confidence: 0.88,
        type: 'explicit',
        userApproved: true,
        evidence: 'Combines Fourier/DSP signal rigor with creative web shaders and darkroom photography.',
        observationsCount: 8,
        lastObservedAt: new Date().toISOString()
      },
      explanationDepth: {
        id: 'dim_explanation_depth',
        name: 'Preferred Explanation Depth',
        value: 'step_by_step_with_code', // 'concise' | 'step_by_step_with_code' | 'deep_theory'
        confidence: 0.92,
        type: 'explicit',
        userApproved: true,
        evidence: 'Requests functional minimal code first, then mechanical breakdown of why it works.',
        observationsCount: 15,
        lastObservedAt: new Date().toISOString()
      },
      directCriticismPreference: {
        id: 'dim_direct_criticism',
        name: 'Tolerance & Preference for Direct Technical Critique',
        value: 'strongly_preferred', // 'gentle' | 'balanced' | 'strongly_preferred'
        confidence: 0.98,
        type: 'explicit',
        userApproved: true,
        evidence: 'Explicitly requests radical honesty and flaw teardowns over decorative flattery.',
        observationsCount: 20,
        lastObservedAt: new Date().toISOString()
      },
      experimentationBias: {
        id: 'dim_experimentation_bias',
        name: 'Experimentation vs Established Convention',
        value: 0.80, // High willingness to experiment with bleeding-edge tools
        confidence: 0.85,
        type: 'inferred',
        userApproved: true,
        evidence: 'Evolving multi-agent frameworks, WebGPU compute, and custom SDR PCB builds.',
        observationsCount: 7,
        lastObservedAt: new Date().toISOString()
      },
      studentResourceConsciousness: {
        id: 'dim_resource_consciousness',
        name: 'Cost & Resource Awareness',
        value: 0.90, // High awareness of student budget, free-tier quotas, and edge efficiency
        confidence: 0.92,
        type: 'explicit',
        userApproved: true,
        evidence: 'Prioritizes free-tier model routing, local compute, and cost-effective embedded parts.',
        observationsCount: 10,
        lastObservedAt: new Date().toISOString()
      }
    };
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.dimensions) {
          for (const [k, d] of Object.entries(parsed.dimensions)) {
            if (this.dimensions[k]) {
              this.dimensions[k] = { ...this.dimensions[k], ...d };
            } else {
              this.dimensions[k] = d;
            }
          }
        }
        if (Array.isArray(parsed.observationsLog)) {
          this.observationsLog = parsed.observationsLog.slice(0, 50);
        }
      }
    } catch {}
  }

  saveState() {
    try {
      this.storageAdapter.set(this.storageKey, JSON.stringify({
        dimensions: this.dimensions,
        observationsLog: this.observationsLog.slice(0, 50),
        updatedAt: new Date().toISOString()
      }));
    } catch {}
  }

  /**
   * Observe an interaction and gently update inferred dimensions with confidence bounding
   */
  recordObservation({ dimensionKey, observedValue, evidence, confidenceDelta = 0.05 }) {
    if (!dimensionKey || !this.dimensions[dimensionKey]) return null;
    const dim = this.dimensions[dimensionKey];

    // Explicit user corrections cannot be overridden by casual observations
    if (dim.type === 'explicit' && dim.userApproved && dim.confidence >= 0.95) {
      return dim;
    }

    const prevCount = dim.observationsCount || 0;
    dim.observationsCount = prevCount + 1;
    dim.lastObservedAt = new Date().toISOString();

    if (typeof dim.value === 'number' && typeof observedValue === 'number') {
      // Exponential moving average for numeric tendencies
      const alpha = 0.2;
      dim.value = Math.round((dim.value * (1 - alpha) + observedValue * alpha) * 100) / 100;
    }

    dim.confidence = Math.min(0.92, dim.confidence + confidenceDelta);
    dim.evidence = evidence || dim.evidence;

    this.observationsLog.unshift({
      timestamp: new Date().toISOString(),
      dimensionKey,
      observedValue,
      evidence
    });
    if (this.observationsLog.length > 50) this.observationsLog.pop();

    try {
      cognitiveLearningEngine.recordObservation({
        candidateDimension: dimensionKey,
        observedValue,
        evidence: evidence || dim.evidence,
        confidence: dim.confidence,
        source: 'CognitiveMirror'
      });
    } catch {}

    this.saveState();
    return dim;
  }

  /**
   * Explicit user correction strictly supersedes inferred traits
   */
  correctDimension(key, newValue, userReason = '') {
    if (this.adhyModel) {
      this.adhyModel.recordCorrection(key, newValue, userReason);
    }
    const existing = this.dimensions[key] || {};
    this.dimensions[key] = {
      ...existing,
      id: existing.id || `dim_${key}`,
      name: existing.name || key,
      value: newValue,
      confidence: 1.0,
      type: 'explicit',
      userApproved: true,
      evidence: userReason || `Explicitly corrected by user: ${newValue}`,
      observationsCount: (existing.observationsCount || 0) + 1,
      lastObservedAt: new Date().toISOString(),
      correctedAt: new Date().toISOString()
    };
    this.saveState();
    return this.dimensions[key];
  }

  getDimension(key) {
    if (this.adhyModel) {
      const modelDim = this.adhyModel.getDimension(key);
      if (modelDim) {
        return {
          ...modelDim,
          type: modelDim.classification === 'explicit_preference' || modelDim.classification === 'fact' ? 'explicit' : 'inferred'
        };
      }
    }
    return this.dimensions[key] ? { ...this.dimensions[key] } : null;
  }

  getAllDimensions() {
    return { ...this.dimensions };
  }

  exportMirror() {
    return {
      schemaVersion: '3.0.0',
      exportedAt: new Date().toISOString(),
      dimensions: this.dimensions,
      recentObservations: this.observationsLog.slice(0, 20)
    };
  }

  importMirror(data = {}) {
    if (data.dimensions) {
      this.dimensions = { ...this.dimensions, ...data.dimensions };
      this.saveState();
    }
  }
}

export const cognitiveMirror = new CognitiveMirror();

