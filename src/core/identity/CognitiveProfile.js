/**
 * ════════════════════════════════════════════════════════════════════
 *  COGNITIVE PROFILE & MIRROR — INSPECTABLE USER PREFERENCE MODEL
 * ════════════════════════════════════════════════════════════════════
 * Purpose: Understand Adhy's preferred problem-solving and communication strategies.
 * Not a psychological diagnosis; purely an inspectable, correctable model
 * of technical, creative, and learning preferences.
 * 
 * CORE INVARIANT:
 * Explicit user corrections strictly override uncertain inferences.
 */

import { adhyModel } from './AdhyModel';

export const INITIAL_USER_CONTEXT = Object.freeze({
  fullName: 'Adhithya Mohan S (Adhy)',
  location: 'Trivandrum, Kerala, India',
  email: 'adhithyamohan2312@gmail.com',
  education: 'Electronics and Communication Engineering (ECE) at Mar Baselios College of Engineering and Technology (MBCET, KTU)',
  currentRoles: [
    'Media Secretary, MBCET Senate',
    'Lead Photographer, FRAMES MBCET'
  ],
  historicalRoles: [
    'Former Chairperson, ISTE Students Chapter MBCET (led 300+ student members)',
    'Former PR & Media Head, ISTE Students Chapter MBCET'
  ],
  
  technicalInterests: [
    'Signal processing & DSP',
    'Embedded systems & STM32 ARM Cortex',
    'Hardware-software integration',
    'GNU Radio & Software Defined Radio (SDR)',
    'KiCad 8 PCB layout & circuit design',
    'MATLAB, Simulink & Simscape Multibody',
    'Robotics & autonomous agents',
    'Space research & ISRO-related opportunities'
  ],

  creativeInterests: [
    'UI/UX design & modern web animation',
    'Street and documentary photography (@zoomout_frames)',
    'Visual storytelling & darkroom aesthetics',
    'Branding & portfolio crafting',
    'Creative technology'
  ],

  practicalConstraints: [
    'Realistic student budget considerations',
    'Practical working prototypes before theoretical excess',
    'Available lab equipment and hardware availability'
  ],

  learningPreferences: [
    'Step-by-step explanation for novel concepts',
    'Working minimal code before complex architectural abstraction',
    'Clear rationale for why an engineering decision was made',
    'Direct, honest technical corrections without excessive flattery'
  ]
});

export class CognitiveProfile {
  constructor() {
    this.storageKey = 'mini_adhy_cognitive_profile_v2';
    this.adhyModel = adhyModel;
    this.dimensions = {};
    this.initDefaultDimensions();
    this.loadState();
  }

  get context() {
    return this.adhyModel ? this.adhyModel.getIdentityContext() : { ...INITIAL_USER_CONTEXT };
  }

  set context(val) {
    // Read-only wrapper backed by canonical model
  }

  initDefaultDimensions() {
    this.dimensions = {
      analyticalVsExploratory: {
        id: 'pref_analytical_exploratory',
        name: 'Analytical vs Exploratory Approach',
        value: 0.65, // 0 = Purely Exploratory, 1 = Purely Analytical
        confidence: 0.85,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'Engineering curriculum and project history',
        evidence: 'Combines rigorous DSP / MATLAB modeling with creative web and photo exploration.',
        lastReviewDate: new Date().toISOString()
      },
      practicalVsTheoretical: {
        id: 'pref_practical_theoretical',
        name: 'Practical vs Theoretical Preference',
        value: 0.80, // High practical bias
        confidence: 0.90,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'User stated preference',
        evidence: 'Values working physical prototypes and tangible code over dry theoretical abstractions.',
        lastReviewDate: new Date().toISOString()
      },
      explanationDepth: {
        id: 'pref_explanation_depth',
        name: 'Preferred Explanation Depth',
        value: 'modular_step_by_step', // 'concise' | 'modular_step_by_step' | 'exhaustive'
        confidence: 0.88,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'Pair programming observations',
        evidence: 'Prefers clear incremental breakdowns with code examples, escalating to deep mathematics when required.',
        lastReviewDate: new Date().toISOString()
      },
      riskTolerance: {
        id: 'pref_risk_tolerance',
        name: 'Experimental Risk Tolerance',
        value: 'calculated_bold', // 'conservative' | 'calculated_bold' | 'high_risk'
        confidence: 0.82,
        explicitOrInferred: 'inferred',
        userApproved: true,
        source: 'Multi-agent architecture & experimental lab suite in portfolio',
        evidence: 'Willing to explore bleeding-edge frameworks (Three.js shaders, multi-agent mesh) while maintaining fallback safeguards.',
        lastReviewDate: new Date().toISOString()
      },
      creativeVsConventional: {
        id: 'pref_creative_conventional',
        name: 'Creative vs Conventional Solution Preference',
        value: 0.75, // Creative bias
        confidence: 0.85,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'Visual and design portfolio',
        evidence: 'Insists on distinctive visual identity, darkroom aesthetics, and novel interaction mechanisms.',
        lastReviewDate: new Date().toISOString()
      },
      speedVsCompleteness: {
        id: 'pref_speed_completeness',
        name: 'Speed vs Completeness',
        value: 0.70, // Lean towards solid, verified completeness
        confidence: 0.80,
        explicitOrInferred: 'inferred',
        userApproved: true,
        source: 'Engineering standards',
        evidence: 'Values working code that passes tests and handles error bounds cleanly.',
        lastReviewDate: new Date().toISOString()
      },
      technicalDetail: {
        id: 'pref_technical_detail',
        name: 'Interest in Technical Details',
        value: 'high',
        confidence: 0.95,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'Hardware engineering background',
        evidence: 'Enjoys understanding register-level logic, DSP transforms, Fourier domain math, and CSS rendering mechanics.',
        lastReviewDate: new Date().toISOString()
      },
      handsOn: {
        id: 'pref_hands_on',
        name: 'Hands-on Implementation Preference',
        value: 'very_high',
        confidence: 0.95,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'PCB layout & lab builds',
        evidence: 'Builds real boards, solders, flashes firmware, and writes production full-stack apps.',
        lastReviewDate: new Date().toISOString()
      },
      toleranceForUncertainty: {
        id: 'pref_tolerance_uncertainty',
        name: 'Tolerance for Ambiguity / Uncertainty',
        value: 0.60,
        confidence: 0.75,
        explicitOrInferred: 'inferred',
        userApproved: false,
        source: 'Project scoping',
        evidence: 'Comfortable exploring ambiguous experimental concepts but prefers clear execution milestones.',
        lastReviewDate: new Date().toISOString()
      },
      directCriticism: {
        id: 'pref_direct_criticism',
        name: 'Preference for Direct Technical Criticism',
        value: 'strongly_preferred',
        confidence: 0.95,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'Directive mandate',
        evidence: 'Strictly requests radical honesty and corrections over false praise.',
        lastReviewDate: new Date().toISOString()
      }
    };
  }

  loadState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.dimensions) {
            Object.keys(parsed.dimensions).forEach(k => {
              if (this.dimensions[k]) {
                this.dimensions[k] = { ...this.dimensions[k], ...parsed.dimensions[k] };
              }
            });
          }
        }
      }
    } catch (e) {
      // In-memory fallback
    }
  }

  saveState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify({
          dimensions: this.dimensions,
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (e) {}
  }

  getDimension(key) {
    if (this.adhyModel) {
      const modelDim = this.adhyModel.getDimension(key);
      if (modelDim) return { ...modelDim };
    }
    return this.dimensions[key] ? { ...this.dimensions[key] } : null;
  }

  getAllDimensions() {
    if (this.adhyModel) {
      return { ...this.adhyModel.getAllCognitiveDimensions() };
    }
    return { ...this.dimensions };
  }

  /**
   * Explicit user correction - immediately overrides inferred preferences with 1.0 confidence
   */
  correctPreference(key, newValue, userReason = '') {
    if (this.adhyModel) {
      this.adhyModel.recordCorrection(key, newValue, userReason);
    }

    if (!this.dimensions[key]) {
      this.dimensions[key] = {
        id: `pref_${key}`,
        name: key,
        value: newValue,
        confidence: 1.0,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'Direct user correction',
        evidence: userReason || 'User explicitly corrected this trait.',
        lastReviewDate: new Date().toISOString()
      };
    } else {
      this.dimensions[key] = {
        ...this.dimensions[key],
        value: newValue,
        confidence: 1.0,
        explicitOrInferred: 'explicit',
        userApproved: true,
        source: 'Direct user correction',
        evidence: userReason || `User explicitly updated preference: ${newValue}`,
        lastReviewDate: new Date().toISOString()
      };
    }
    this.saveState();
    return this.dimensions[key];
  }

  exportProfile() {
    return {
      schemaVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      userContext: this.context,
      dimensions: this.dimensions
    };
  }

  resetToBaseline() {
    this.initDefaultDimensions();
    this.saveState();
  }
}

export const cognitiveProfile = new CognitiveProfile();

