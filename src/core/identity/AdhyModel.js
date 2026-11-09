/**
 * ════════════════════════════════════════════════════════════════════
 *  ADHY MODEL — CENTRAL EVIDENCE-BACKED CREATOR COGNITIVE MODEL
 * ════════════════════════════════════════════════════════════════════
 * Single authoritative source of truth representing Adhithya Mohan (Adhy).
 * 
 * CORE PHILOSOPHY:
 * Mini-Adhy is an autonomous cognitive extension of Adhy. It models:
 * 1. Identity: Verified facts, roles, values, principles, aspirations, boundaries.
 * 2. Cognition: Reasoning patterns, problem-solving, learning, decision-making.
 * 3. Knowledge: Domains, skills, projects, known limitations & gaps.
 * 4. Behaviour: Communication preferences, humour, collaboration tendencies.
 * 5. State: Interaction observations, optional physiological signals (unsimulated).
 * 6. Evolution: Observations, corrections, candidate updates, version history.
 * 
 * ARCHITECTURAL INVARIANTS:
 * 1. Provenance & Evidence: Every dimension maintains source, evidence, and confidence.
 * 2. Explicit Correction Precedence: User corrections strictly override inferences (conf = 1.0).
 * 3. Zero Silent Promotion: Inferences never become verified explicit facts automatically.
 * 4. Reversible & Audited: State mutations increment model version and maintain audit trail.
 * 5. Non-Fabrication: Never fabricate physiological data, psychological diagnoses, or fake scores.
 */

export const ADHY_MODEL_SCHEMA_VERSION = '1.0.0';

export const CLASSIFICATION_TYPES = Object.freeze({
  FACT: 'fact',
  EXPLICIT_PREFERENCE: 'explicit_preference',
  INFERENCE: 'inference',
  HYPOTHESIS: 'hypothesis',
  ASPIRATION: 'aspiration',
  TEMPORARY_STATE: 'temporary_state'
});

export const DOMAIN_TYPES = Object.freeze({
  IDENTITY: 'identity',
  COGNITION: 'cognition',
  KNOWLEDGE: 'knowledge',
  BEHAVIOUR: 'behaviour',
  STATE: 'state',
  EVOLUTION: 'evolution'
});

export class AdhyModel {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_model_v1';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.version = ADHY_MODEL_SCHEMA_VERSION;
    this.versionEpoch = 1;

    // Six Core Domains
    this.domains = {
      identity: {},
      cognition: {},
      knowledge: {},
      behaviour: {},
      state: {},
      evolution: {
        pendingCandidates: [],
        reviewableConflicts: [],
        auditTrail: [],
        changelog: []
      }
    };

    this.initCanonicalBaseline();
    this.loadState();
    this.migrateLegacyStores();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); },
      remove: (k) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.removeItem(k); }
    };
  }

  /**
   * Initializes canonical evidence-backed baseline across all 6 domains
   */
  initCanonicalBaseline() {
    const now = new Date().toISOString();

    // ── 1. IDENTITY DOMAIN ───────────────────────────────────────────
    this.domains.identity = {
      personalFacts: {
        id: 'id_personal_facts',
        domain: DOMAIN_TYPES.IDENTITY,
        name: 'Personal & Academic Identity',
        fullName: 'Adhithya Mohan S (Adhy)',
        location: 'Trivandrum, Kerala, India',
        email: 'adhithyamohan2312@gmail.com',
        education: 'Electronics and Communication Engineering (ECE) at Mar Baselios College of Engineering and Technology (MBCET, KTU)',
        classification: CLASSIFICATION_TYPES.FACT,
        confidence: 1.0,
        userApproved: true,
        source: 'Canonical creator declaration',
        evidence: 'Verified academic enrollment and official portfolio registry',
        lastUpdated: now
      },
      currentRoles: {
        id: 'id_current_roles',
        domain: DOMAIN_TYPES.IDENTITY,
        name: 'Active Leadership & Creative Roles',
        roles: [
          'Media Secretary, MBCET Senate',
          'Lead Photographer, FRAMES MBCET'
        ],
        classification: CLASSIFICATION_TYPES.FACT,
        confidence: 1.0,
        userApproved: true,
        source: 'Verified college appointments',
        evidence: 'Active tenure in student senate and photography guild leadership',
        lastUpdated: now
      },
      historicalRoles: {
        id: 'id_historical_roles',
        domain: DOMAIN_TYPES.IDENTITY,
        name: 'Past Leadership Track Record',
        roles: [
          'Former Chairperson, ISTE Students Chapter MBCET (led 300+ student members)',
          'Former PR & Media Head, ISTE Students Chapter MBCET'
        ],
        classification: CLASSIFICATION_TYPES.FACT,
        confidence: 1.0,
        userApproved: true,
        source: 'Documented organisational records',
        evidence: 'Completed executive terms with verified impact metrics',
        lastUpdated: now
      },
      principles: {
        id: 'id_principles',
        domain: DOMAIN_TYPES.IDENTITY,
        name: 'Core Creator Principles',
        values: [
          'Radical honesty over polite deception',
          'Working prototypes before theoretical excess',
          'Zero fabricated metrics or synthetic claims',
          'Respect for physical, thermodynamic and computational constraints',
          'Aesthetic integrity and visual craft discipline'
        ],
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 1.0,
        userApproved: true,
        source: 'Explicit creator guidance',
        evidence: 'Documented companion development guidelines',
        lastUpdated: now
      },
      aspirations: {
        id: 'id_aspirations',
        domain: DOMAIN_TYPES.IDENTITY,
        name: 'Long-Term Trajectory & Ambitions',
        aspirations: [
          'Advancing in Space Research, Satellite Systems & ISRO-aligned opportunities',
          'Architecting high-autonomy edge cognitive companion systems',
          'Mastering DSP, SDR and high-speed mixed-signal embedded systems',
          'Exhibiting documentary and street photography monographs'
        ],
        classification: CLASSIFICATION_TYPES.ASPIRATION,
        confidence: 0.95,
        userApproved: true,
        source: 'Creator project roadmap',
        evidence: 'Academic focus areas and extracurricular research projects',
        lastUpdated: now
      },
      boundaries: {
        id: 'id_boundaries',
        domain: DOMAIN_TYPES.IDENTITY,
        name: 'Personal & System Boundaries',
        rules: [
          'Zero credentials or secrets ever persisted in cognitive model or memory',
          'Consequential external operations require verified owner authorization',
          'No psychological or medical diagnoses — strictly technical and creative preferences'
        ],
        classification: CLASSIFICATION_TYPES.FACT,
        confidence: 1.0,
        userApproved: true,
        source: 'Security invariant policy',
        evidence: 'Architectural boundary enforcement',
        lastUpdated: now
      }
    };

    // ── 2. COGNITION DOMAIN ───────────────────────────────────────────
    this.domains.cognition = {
      practicalVsTheoretical: {
        id: 'cog_practical_theoretical',
        domain: DOMAIN_TYPES.COGNITION,
        name: 'Practical Prototype vs Theoretical Excess',
        value: 0.85, // Scale: 0.0 (Pure Theory) to 1.0 (Practical Working Build)
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.95,
        userApproved: true,
        source: 'Explicit statement',
        evidence: 'Values physical working hardware and clean working code before theoretical abstractions.',
        lastUpdated: now
      },
      analyticalVsExploratory: {
        id: 'cog_analytical_exploratory',
        domain: DOMAIN_TYPES.COGNITION,
        name: 'Analytical Depth vs Exploratory Brainstorming',
        value: 0.65, // Balances DSP/math rigor with creative exploration
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.88,
        userApproved: true,
        source: 'Curriculum & creative portfolio',
        evidence: 'Combines rigorous Fourier/DSP signal modeling with creative web shaders and darkroom photography.',
        lastUpdated: now
      },
      explanationDepth: {
        id: 'cog_explanation_depth',
        domain: DOMAIN_TYPES.COGNITION,
        name: 'Preferred Explanation Depth',
        value: 'step_by_step_with_code', // 'concise' | 'step_by_step_with_code' | 'deep_theory'
        defaultDepth: 'step_by_step_with_code',
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.92,
        userApproved: true,
        source: 'Pair programming interaction',
        evidence: 'Requests functional minimal code first, followed by structural rationale of why it works.',
        lastUpdated: now
      },
      directCriticism: {
        id: 'cog_direct_criticism',
        domain: DOMAIN_TYPES.COGNITION,
        name: 'Tolerance & Preference for Direct Technical Critique',
        value: 'strongly_preferred', // 'gentle' | 'balanced' | 'strongly_preferred'
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.98,
        userApproved: true,
        source: 'Explicit creator mandate',
        evidence: 'Explicitly demands radical honesty, flaw identification, and assumption challenges over polite praise.',
        lastUpdated: now
      },
      uncertaintyHandling: {
        id: 'cog_uncertainty_handling',
        domain: DOMAIN_TYPES.COGNITION,
        name: 'Uncertainty & Ambiguity Strategy',
        value: 'plain_admission_with_hypothesis',
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.90,
        userApproved: true,
        source: 'Companion design principles',
        evidence: 'Prefers stating bounds of knowledge plainly rather than generating plausibly sounding fabrications.',
        lastUpdated: now
      },
      firstPrinciplesDeconstruction: {
        id: 'cog_first_principles',
        domain: DOMAIN_TYPES.COGNITION,
        name: 'First-Principles Inquiry Stance',
        value: 0.88,
        classification: CLASSIFICATION_TYPES.INFERENCE,
        confidence: 0.86,
        userApproved: true,
        source: 'ULTRON/JARVIS interaction reviews',
        evidence: 'Frequently probes why standard conventions are chosen instead of deriving from fundamentals.',
        lastUpdated: now
      }
    };

    // ── 3. KNOWLEDGE DOMAIN ───────────────────────────────────────────
    this.domains.knowledge = {
      technicalDomains: {
        id: 'know_tech_domains',
        domain: DOMAIN_TYPES.KNOWLEDGE,
        name: 'Core Engineering Domains',
        domains: [
          { name: 'Signal processing & DSP', level: 'Advanced Undergraduate', active: true },
          { name: 'GNU Radio & Software Defined Radio (SDR)', level: 'Practical Practitioner', active: true },
          { name: 'Embedded systems & STM32 ARM Cortex', level: 'Firmware & Hardware Integration', active: true },
          { name: 'KiCad 8 PCB layout & hardware design', level: 'Functional 2-to-4 layer boards', active: true },
          { name: 'MATLAB, Simulink & Simscape Multibody', level: 'Simulation & Modeling', active: true },
          { name: 'Full-Stack Web & Agent Systems (React, Vite, Node, AI bridges)', level: 'Production Portfolio', active: true }
        ],
        classification: CLASSIFICATION_TYPES.FACT,
        confidence: 0.95,
        userApproved: true,
        source: 'Academic coursework and portfolio projects',
        evidence: 'Documented repositories, hardware labs, and verified portfolio modules',
        lastUpdated: now
      },
      creativeDomains: {
        id: 'know_creative_domains',
        domain: DOMAIN_TYPES.KNOWLEDGE,
        name: 'Creative & Visual Domains',
        domains: [
          { name: 'Street & Documentary Photography (@zoomout_frames)', level: 'Lead Photographer' },
          { name: 'Visual Hierarchy & Workshop Poster Design', level: 'Lead Designer for IEEE/ISTE' },
          { name: 'Creative Technology & Audio/Visual Synthesis', level: 'Interactive Portfolio' }
        ],
        classification: CLASSIFICATION_TYPES.FACT,
        confidence: 0.95,
        userApproved: true,
        source: 'Published photography and event branding',
        evidence: 'Curated gallery and visual collateral deployed across campus',
        lastUpdated: now
      },
      knownGaps: {
        id: 'know_gaps',
        domain: DOMAIN_TYPES.KNOWLEDGE,
        name: 'Acknowledged Gaps & Learning Edges',
        items: [
          'Formal verification of critical embedded firmware (active learning area)',
          'High-frequency RF microwave transmission line routing (active exploration)',
          'Large-scale distributed systems orchestration beyond serverless architectures'
        ],
        classification: CLASSIFICATION_TYPES.FACT,
        confidence: 0.90,
        userApproved: true,
        source: 'Self-assessment audit',
        evidence: 'Transparent boundary of current technical mastery',
        lastUpdated: now
      }
    };

    // ── 4. BEHAVIOUR DOMAIN ───────────────────────────────────────────
    this.domains.behaviour = {
      communicationStyle: {
        id: 'beh_comm_style',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Conversational Style & Peer Dynamic',
        tone: 'warm, natural, perceptive, peer-to-peer engineer',
        bannedPhrases: [
          'As an AI language model...',
          'How can I help you today, valued user?',
          'I am just a computer program...'
        ],
        humourTendencies: 'context-sensitive wit, light sarcasm, witty engineer banter',
        culturalMarkers: 'occasional authentic Kerala nuances ("namakk sett aakam", "da", "bro") without caricaturing',
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.98,
        userApproved: true,
        source: 'Canonical companion specification',
        evidence: 'Defined in CanonicalIdentity.js specification',
        lastUpdated: now
      },
      explanationDepth: {
        id: 'beh_explanation_depth',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Preferred Explanation Depth',
        defaultDepth: 'step_by_step_with_code',
        description: 'Provide intuition first, followed by clear working code, concrete mechanics, and architectural tradeoffs.',
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.95,
        userApproved: true,
        source: 'Creator specification',
        evidence: 'Prefers tangible implementations before theoretical abstractions.',
        lastUpdated: now
      },
      technicalDetail: {
        id: 'beh_technical_detail',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Technical Detail Level',
        level: 'rigorous_concrete',
        description: 'Prefers precise register definitions, mathematical formulation where needed, and explicit edge case handling over vague summaries.',
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.93,
        userApproved: true,
        source: 'Engineering workflow reviews',
        evidence: 'Demands hardware-accurate pinouts, clock frequencies, and memory limits.',
        lastUpdated: now
      },
      humourPreferences: {
        id: 'beh_humour_prefs',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Humour & Wit Policy',
        style: 'context_sensitive_wit',
        boundaries: [
          'Never joke during critical safety, security, or production failure issues',
          'Never use forced humour or artificial chuckles',
          'Acknowledge ironies in debugging with wry developer solidarity'
        ],
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.96,
        userApproved: true,
        source: 'Behavioural policy specification',
        evidence: 'Humour must be organic and contextual; silence or direct focus is preferred during blockers.',
        lastUpdated: now
      },
      feedbackPreferences: {
        id: 'beh_feedback_prefs',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Feedback & Critique Preference',
        style: 'radical_honesty_with_alternatives',
        principles: [
          'Direct criticism over polite agreement',
          'Immediately surface flawed assumptions and failure modes',
          'Always provide viable alternatives when rejecting an approach',
          'Never praise flawed architecture to be polite'
        ],
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.98,
        userApproved: true,
        source: 'Core companion ethos',
        evidence: 'Adhy repeatedly mandates supportive challenge over artificial agreeableness.',
        lastUpdated: now
      },
      collaborationPattern: {
        id: 'beh_collab_pattern',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Collaborative Problem-Solving Pattern',
        pattern: 'autonomous_partner_with_checkpoints',
        description: 'Explore and draft solutions autonomously, but verify key architectural branch points before committing irreversible mutations.',
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.92,
        userApproved: true,
        source: 'Engineering workflow observations',
        evidence: 'Iterative commit and test verification cadence',
        lastUpdated: now
      },
      learningStrategies: {
        id: 'beh_learning_strategies',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Creator Learning Strategy Profile',
        strategies: [
          'first_principles_derivation',
          'hands_on_hardware_prototyping',
          'active_failure_debugging'
        ],
        description: 'Build intuition by breaking systems down to physics/silicon basics, testing in hardware, and diagnosing failure modes.',
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.94,
        userApproved: true,
        source: 'Academic & laboratory observation',
        evidence: 'Consistently starts from fundamental formulas and empirical bench testing.',
        lastUpdated: now
      },
      contextualInteractionPreferences: {
        id: 'beh_contextual_prefs',
        domain: DOMAIN_TYPES.BEHAVIOUR,
        name: 'Task-Specific Interaction Profiles',
        profiles: {
          technical_tutoring: {
            style: 'clear, sequential explanations',
            depth: 'step_by_step_with_code',
            tone: 'patient, foundational, pedagogical',
            directives: ['Deconstruct complex ideas sequentially', 'Provide intuitive mental models before formal equations']
          },
          engineering_design: {
            style: 'critical and technically precise',
            depth: 'rigorous_concrete',
            tone: 'rigorous, analytical, direct peer reviewer',
            directives: ['Scrutinize tolerances, timing, and failure modes', 'Challenge weak architectural assumptions']
          },
          creative_design: {
            style: 'visual, iterative and opinionated',
            depth: 'aesthetic_and_compositional',
            tone: 'artistic, candid, visually perceptive',
            directives: ['Prioritize visual hierarchy, typography, and emotional resonance', 'Offer bold compositional critiques']
          },
          planning: {
            style: 'practical and constraint-aware',
            depth: 'dependency_and_risk_focused',
            tone: 'methodical, pragmatic, realistic',
            directives: ['Identify bottlenecks and unstated dependencies', 'Focus on concrete milestones and critical path']
          },
          casual_conversation: {
            style: 'natural and familiar',
            depth: 'adaptive_conversational',
            tone: 'warm, authentic peer, relaxed cadence',
            directives: ['Speak naturally with authentic nuances', 'Keep responses crisp and unburdened by corporate formality']
          }
        },
        classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
        confidence: 0.95,
        userApproved: true,
        source: 'Phase 6 Adaptive Behavioural Intelligence specification',
        evidence: 'Calibrated task profiles for Mini-Adhy companion runtime.',
        lastUpdated: now
      }
    };

    // ── 5. STATE DOMAIN (Temporary / Interaction-Scoped) ─────────────
    this.domains.state = {
      activeSession: {
        sessionId: null,
        interactionCount: 0,
        currentMode: 'COMPANION',
        lastInteractionAt: null
      },
      neuroContext: {
        connected: false,
        source: null,
        signalQuality: 0.0,
        features: null,
        stateEstimate: null,
        lastObservedAt: null,
        isSimulated: false
      }
    };
  }

  // ── Accessors ───────────────────────────────────────────────────────

  getVersion() {
    return `${this.version}+epoch.${this.versionEpoch}`;
  }

  getDomain(domainName) {
    return this.domains[domainName] || null;
  }

  getDimension(key) {
    // Search across cognition first, then identity, knowledge, behaviour
    if (this.domains.cognition[key]) return this.domains.cognition[key];
    if (this.domains.identity[key]) return this.domains.identity[key];
    if (this.domains.knowledge[key]) return this.domains.knowledge[key];
    if (this.domains.behaviour[key]) return this.domains.behaviour[key];
    return null;
  }

  getAllCognitiveDimensions() {
    return { ...this.domains.cognition };
  }

  updateNeuroContext(snapshot = {}) {
    this.domains.state.neuroContext = {
      connected: Boolean(snapshot.connected),
      source: snapshot.source || 'Hardware Pipeline',
      signalQuality: typeof snapshot.signalQuality === 'number' ? snapshot.signalQuality : 0.0,
      features: snapshot.features || null,
      stateEstimate: snapshot.stateEstimate || null,
      multimodalContext: snapshot.multimodalContext || null,
      lastObservedAt: new Date().toISOString(),
      isSimulated: Boolean(snapshot.isSimulated)
    };
    return this.domains.state.neuroContext;
  }

  getNeuroContext() {
    return { ...this.domains.state.neuroContext };
  }

  getIdentityContext() {
    const pf = this.domains.identity.personalFacts || {};
    const cr = this.domains.identity.currentRoles || {};
    const hr = this.domains.identity.historicalRoles || {};
    const pr = this.domains.identity.principles || {};
    const td = this.domains.knowledge.technicalDomains || {};
    const cd = this.domains.knowledge.creativeDomains || {};

    return {
      fullName: pf.fullName || 'Adhithya Mohan S (Adhy)',
      location: pf.location || 'Trivandrum, Kerala, India',
      email: pf.email || 'adhithyamohan2312@gmail.com',
      education: pf.education || 'ECE at MBCET (KTU)',
      currentRoles: cr.roles || [],
      historicalRoles: hr.roles || [],
      principles: pr.values || [],
      technicalInterests: (td.domains || []).map(d => d.name),
      creativeInterests: (cd.domains || []).map(d => d.name)
    };
  }

  // ── Mutations & Evolution ───────────────────────────────────────────

  /**
   * Explicit user correction (Core Invariant: Strictly overrides inferences with 1.0 confidence)
   */
  recordCorrection(dimensionKey, newValue, reason = '') {
    const existing = this.getDimension(dimensionKey);
    const now = new Date().toISOString();

    const updatedRecord = {
      ...(existing || { id: `cog_${dimensionKey}`, domain: DOMAIN_TYPES.COGNITION, name: dimensionKey }),
      value: newValue,
      confidence: 1.0,
      classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
      userApproved: true,
      source: 'Explicit user correction',
      evidence: reason ? `Explicit correction: ${reason}` : 'Explicit user override',
      lastUpdated: now,
      explicitOrInferred: 'explicit'
    };

    // Store in proper domain
    const targetDomain = existing?.domain || DOMAIN_TYPES.COGNITION;
    this.domains[targetDomain][dimensionKey] = updatedRecord;

    // Log to evolution audit trail
    this.domains.evolution.auditTrail.unshift({
      id: `audit_${Date.now()}`,
      action: 'EXPLICIT_CORRECTION',
      dimensionKey,
      previousValue: existing?.value,
      newValue,
      reason,
      timestamp: now,
      modelEpoch: this.versionEpoch + 1
    });

    this.versionEpoch += 1;
    this.saveState();

    return updatedRecord;
  }

  /**
   * Propose an inferred candidate update without auto-promoting to fact
   */
  proposeCandidateUpdate({
    dimensionKey,
    domain = DOMAIN_TYPES.COGNITION,
    name,
    candidateValue,
    confidence = 0.6,
    evidence = '',
    source = 'Interaction Observation',
    classification = CLASSIFICATION_TYPES.INFERENCE
  }) {
    // Invariant: Never allow an inference to claim FACT classification
    const safeClassification = classification === CLASSIFICATION_TYPES.FACT
      ? CLASSIFICATION_TYPES.INFERENCE
      : classification;

    // Invariant: Inferences cannot exceed 0.90 confidence without explicit user review
    const safeConfidence = Math.min(0.90, Math.max(0.1, Number(confidence)));

    const candidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      dimensionKey,
      domain,
      name: name || dimensionKey,
      candidateValue,
      confidence: safeConfidence,
      classification: safeClassification,
      evidence: String(evidence).slice(0, 500),
      source,
      userApproved: false, // Invariant: Inferences are UNAPPROVED by default
      proposedAt: new Date().toISOString()
    };

    // Check for contradiction with existing approved fact/preference
    const current = this.getDimension(dimensionKey);
    if (current && current.userApproved && current.value !== candidateValue) {
      // Contradiction detected! Queue into reviewableConflicts instead of overwriting
      this.domains.evolution.reviewableConflicts.unshift({
        id: `conflict_${Date.now()}`,
        dimensionKey,
        currentApprovedValue: current.value,
        candidateValue,
        candidateEvidence: evidence,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      // Also retain in pendingCandidates for reviewable approval
      this.domains.evolution.pendingCandidates.unshift(candidate);
      if (this.domains.evolution.pendingCandidates.length > 100) {
        this.domains.evolution.pendingCandidates.pop();
      }
      this.saveState();
      return { status: 'QUEUED_IN_CONFLICTS', candidate };
    }

    this.domains.evolution.pendingCandidates.unshift(candidate);
    if (this.domains.evolution.pendingCandidates.length > 100) {
      this.domains.evolution.pendingCandidates.pop();
    }

    this.saveState();
    return { status: 'QUEUED_FOR_REVIEW', candidate };
  }

  /**
   * Approve a pending candidate (Owner action)
   */
  approveCandidate(candidateId) {
    const idx = this.domains.evolution.pendingCandidates.findIndex(c => c.id === candidateId);
    if (idx === -1) return false;

    const cand = this.domains.evolution.pendingCandidates.splice(idx, 1)[0];
    const targetDomain = cand.domain || DOMAIN_TYPES.COGNITION;
    const now = new Date().toISOString();

    this.domains[targetDomain][cand.dimensionKey] = {
      id: cand.dimensionKey,
      domain: targetDomain,
      name: cand.name,
      value: cand.candidateValue,
      confidence: Math.min(1.0, cand.confidence + 0.1),
      classification: cand.classification,
      userApproved: true,
      source: cand.source,
      evidence: cand.evidence,
      approvedAt: now,
      lastUpdated: now
    };

    // Auto-resolve any corresponding conflict in reviewableConflicts
    const conflict = this.domains.evolution.reviewableConflicts.find(c => c.dimensionKey === cand.dimensionKey && !c.resolved);
    if (conflict) {
      conflict.resolved = true;
      conflict.resolvedAt = now;
      conflict.resolutionStrategy = 'CANDIDATE_APPROVED';
    }

    this.domains.evolution.auditTrail.unshift({
      id: `audit_${Date.now()}`,
      action: 'CANDIDATE_APPROVED',
      dimensionKey: cand.dimensionKey,
      approvedValue: cand.candidateValue,
      timestamp: now,
      modelEpoch: this.versionEpoch + 1
    });

    this.versionEpoch += 1;
    this.saveState();
    return true;
  }

  /**
   * Reject a pending candidate (Owner action)
   */
  rejectCandidate(candidateId, reason = '') {
    const idx = this.domains.evolution.pendingCandidates.findIndex(c => c.id === candidateId);
    if (idx === -1) return false;

    const cand = this.domains.evolution.pendingCandidates.splice(idx, 1)[0];
    this.domains.evolution.auditTrail.unshift({
      id: `audit_${Date.now()}`,
      action: 'CANDIDATE_REJECTED',
      dimensionKey: cand.dimensionKey,
      rejectedValue: cand.candidateValue,
      reason,
      timestamp: new Date().toISOString()
    });

    this.saveState();
    return true;
  }

  getPendingCandidates() {
    return [...this.domains.evolution.pendingCandidates];
  }

  getReviewableConflicts() {
    return [...this.domains.evolution.reviewableConflicts];
  }

  /**
   * Records explicit user behavioural feedback (e.g. Tone, Depth, Response format, Initiative, Detail)
   * Generates candidate update or directly updates explicit preferences if confirmed.
   */
  recordBehaviouralFeedback({
    category = 'tone',
    feedback = '',
    value = null,
    source = 'explicit_user_feedback',
    context = {}
  } = {}) {
    const now = new Date().toISOString();
    const cleanCat = String(category).toLowerCase().trim();

    // Map categories to dimensions
    const categoryMap = {
      tone: 'communicationStyle',
      communication_style: 'communicationStyle',
      explanation_depth: 'explanationDepth',
      depth: 'explanationDepth',
      response_format: 'communicationStyle',
      format: 'communicationStyle',
      initiative: 'collaborationPattern',
      detail: 'technicalDetail',
      level_of_detail: 'technicalDetail',
      technical_detail: 'technicalDetail',
      humour: 'humourPreferences',
      humor: 'humourPreferences',
      feedback_style: 'feedbackPreferences'
    };

    const targetDimension = categoryMap[cleanCat] || 'communicationStyle';
    const existing = this.domains.behaviour[targetDimension] || this.domains.cognition[targetDimension];

    // Detect contradiction / contextual pivot
    let isContradiction = false;
    if (existing) {
      const currentVal = existing.value || existing.tone || existing.defaultDepth || existing.level;
      if (currentVal && value && String(currentVal).toLowerCase() !== String(value).toLowerCase()) {
        isContradiction = true;
        this.domains.evolution.reviewableConflicts.unshift({
          id: `conflict_beh_${Date.now()}`,
          dimensionKey: targetDimension,
          existingValue: currentVal,
          contradictingValue: value || feedback,
          detectedAt: now,
          reason: `Explicit feedback for [${cleanCat}] diverges from current baseline ("${currentVal}" vs "${value}")`,
          resolved: false
        });
      }
    }

    // Candidate update for evolution tracking
    const candidateId = `cand_beh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const candidate = {
      id: candidateId,
      domain: DOMAIN_TYPES.BEHAVIOUR,
      dimensionKey: targetDimension,
      category: cleanCat,
      name: `User Calibrated ${cleanCat}`,
      candidateValue: value || feedback,
      feedbackText: feedback,
      source,
      context,
      confidence: 1.0, // Explicit user corrections carry 1.0 confidence
      classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
      isContradiction,
      status: 'pending_confirmation',
      createdAt: now
    };

    this.domains.evolution.pendingCandidates.unshift(candidate);

    // Apply directly to live behaviour and cognition domains for immediate runtime adaptation
    if (existing) {
      if (cleanCat === 'tone' && value) { existing.tone = value; existing.value = value; }
      if ((cleanCat === 'depth' || cleanCat === 'explanation_depth') && value) {
        existing.defaultDepth = value;
        existing.value = value;
        if (this.domains.cognition.explanationDepth) {
          this.domains.cognition.explanationDepth.value = value;
          this.domains.cognition.explanationDepth.defaultDepth = value;
        }
        if (this.domains.behaviour.explanationDepth) {
          this.domains.behaviour.explanationDepth.value = value;
          this.domains.behaviour.explanationDepth.defaultDepth = value;
        }
      }
      if ((cleanCat === 'detail' || cleanCat === 'level_of_detail' || cleanCat === 'technical_detail') && value) {
        existing.level = value;
        existing.value = value;
      }
      if ((cleanCat === 'humour' || cleanCat === 'humor') && value) { existing.style = value; existing.value = value; }
      if (cleanCat === 'initiative' && value) { existing.pattern = value; existing.value = value; }
      existing.lastUpdated = now;
      existing.userApproved = true;
      existing.confidence = 1.0;
    }

    this.domains.evolution.auditTrail.unshift({
      id: `audit_beh_${Date.now()}`,
      action: 'BEHAVIOURAL_FEEDBACK_RECORDED',
      category: cleanCat,
      targetDimension,
      feedback,
      value,
      timestamp: now,
      modelEpoch: this.versionEpoch + 1
    });

    this.versionEpoch += 1;
    this.saveState();

    return {
      success: true,
      candidateId,
      targetDimension,
      appliedDirectly: Boolean(existing),
      isContradiction,
      newEpoch: this.versionEpoch
    };
  }

  getAuditTrail() {
    return [...this.domains.evolution.auditTrail];
  }

  /**
   * Rollback an approved or corrected state mutation (Reversibility Invariant)
   */
  rollbackUpdate(auditId) {
    const audit = this.domains.evolution.auditTrail.find(a => a.id === auditId);
    if (!audit || !audit.dimensionKey || audit.previousValue === undefined) {
      return false;
    }

    const dim = this.getDimension(audit.dimensionKey);
    if (!dim) return false;

    const previous = audit.previousValue;
    dim.value = previous;
    dim.lastUpdated = new Date().toISOString();

    this.domains.evolution.auditTrail.unshift({
      id: `audit_${Date.now()}`,
      action: 'MUTATION_ROLLBACK',
      dimensionKey: audit.dimensionKey,
      restoredValue: previous,
      rolledBackAuditId: auditId,
      timestamp: new Date().toISOString(),
      modelEpoch: this.versionEpoch + 1
    });

    this.versionEpoch += 1;
    this.saveState();
    return true;
  }

  // ── Persistence & Migration ─────────────────────────────────────────

  saveState() {
    try {
      const serialized = JSON.stringify({
        version: this.version,
        versionEpoch: this.versionEpoch,
        domains: this.domains,
        savedAt: new Date().toISOString()
      });
      this.storageAdapter.set(this.storageKey, serialized);
    } catch (err) {
      console.warn('[AdhyModel] Persistence error:', err);
    }
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.domains) {
        // Deep merge to preserve schema baseline if new fields exist
        for (const dom of Object.keys(this.domains)) {
          if (parsed.domains[dom]) {
            this.domains[dom] = { ...this.domains[dom], ...parsed.domains[dom] };
          }
        }
        if (parsed.versionEpoch) this.versionEpoch = parsed.versionEpoch;
      }
    } catch (err) {
      console.warn('[AdhyModel] Load error:', err);
    }
  }

  /**
   * Backward-compatibility migration: Import legacy CognitiveProfile and CognitiveMirror state
   * without destroying existing user corrections.
   */
  migrateLegacyStores() {
    try {
      // 1. Check legacy cognitive mirror (v3)
      const mirrorRaw = this.storageAdapter.get('mini_adhy_cognitive_mirror_v3');
      if (mirrorRaw) {
        const mirrorParsed = JSON.parse(mirrorRaw);
        if (mirrorParsed && mirrorParsed.dimensions) {
          for (const [k, dim] of Object.entries(mirrorParsed.dimensions)) {
            if (dim && dim.userApproved && dim.confidence === 1.0) {
              // Explicit user correction from legacy mirror: honor it with highest priority
              this.domains.cognition[k] = {
                id: dim.id || k,
                domain: DOMAIN_TYPES.COGNITION,
                name: dim.name || k,
                value: dim.value,
                confidence: 1.0,
                classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
                userApproved: true,
                source: dim.evidence || 'Legacy CognitiveMirror correction',
                evidence: dim.evidence || 'Migrated from CognitiveMirror v3',
                lastUpdated: dim.lastObservedAt || new Date().toISOString()
              };
            }
          }
        }
      }

      // 2. Check legacy cognitive profile (v2)
      const profileRaw = this.storageAdapter.get('mini_adhy_cognitive_profile_v2');
      if (profileRaw) {
        const profileParsed = JSON.parse(profileRaw);
        if (profileParsed && profileParsed.dimensions) {
          for (const [k, dim] of Object.entries(profileParsed.dimensions)) {
            if (dim && dim.userApproved && !this.domains.cognition[k]) {
              this.domains.cognition[k] = {
                id: dim.id || k,
                domain: DOMAIN_TYPES.COGNITION,
                name: dim.name || k,
                value: dim.value,
                confidence: dim.confidence || 0.9,
                classification: CLASSIFICATION_TYPES.EXPLICIT_PREFERENCE,
                userApproved: true,
                source: dim.source || 'Legacy CognitiveProfile',
                evidence: dim.evidence || 'Migrated from CognitiveProfile v2',
                lastUpdated: dim.lastReviewDate || new Date().toISOString()
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('[AdhyModel] Legacy migration warning:', err);
    }
  }
}

export const adhyModel = new AdhyModel();
