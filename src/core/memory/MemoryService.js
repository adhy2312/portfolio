/**
 * ════════════════════════════════════════════════════════════════════
 *  CANONICAL MEMORY SERVICE & CONTINUITY ENGINE (AUA v3.0.0)
 * ════════════════════════════════════════════════════════════════════
 * Central memory ownership for Mini-Adhy.
 * Supports:
 * • Structured categories & rich memory types (FACT, PREFERENCE, INFERENCE, etc.)
 * • Rich metadata (provenance, confidence, evidence, sensitivity, supersession links)
 * • Contextual relevance ranking & contradiction detection
 * • User corrections taking strict precedence
 * • User inspection, editing, export, import, and deletion controls
 * • Zero-credential storage guarantee
 */

export const MEMORY_CATEGORIES = Object.freeze({
  APPROVED_FACT: 'APPROVED_FACT',
  USER_PREFERENCE: 'USER_PREFERENCE',
  ONGOING_PROJECT: 'ONGOING_PROJECT',
  GOAL: 'GOAL',
  DECISION: 'DECISION',
  DECISION_RATIONALE: 'DECISION_RATIONALE',
  SESSION_SUMMARY: 'SESSION_SUMMARY',
  PROCEDURE: 'PROCEDURE',
  WORKING_CONTEXT: 'WORKING_CONTEXT',
  CORRECTED_FACT: 'CORRECTED_FACT',
  SUPERSEDED_INFO: 'SUPERSEDED_INFO',

  // Phase 4 Structured Personal Experience & Continuity Categories
  SEMANTIC_MEMORY: 'SEMANTIC_MEMORY',
  EPISODIC_MEMORY: 'EPISODIC_MEMORY',
  PROCEDURAL_MEMORY: 'PROCEDURAL_MEMORY',
  DECISION_MEMORY: 'DECISION_MEMORY',
  PROJECT_MEMORY: 'PROJECT_MEMORY',
  RELATIONSHIP_CONTINUITY: 'RELATIONSHIP_CONTINUITY',
  PENDING_MEMORY: 'PENDING_MEMORY',
  HYPOTHESIS: 'PENDING_MEMORY'
});

export const MEMORY_TYPES = Object.freeze({
  FACT: 'FACT',
  PREFERENCE: 'PREFERENCE',
  INFERENCE: 'INFERENCE',
  EPISODIC: 'EPISODIC',
  PROJECT_CONTEXT: 'PROJECT_CONTEXT',
  DECISION: 'DECISION',
  GOAL: 'GOAL',
  TEMPORARY_CONTEXT: 'TEMPORARY_CONTEXT',
  CORRECTED_FACT: 'CORRECTED_FACT',
  PROCEDURE: 'PROCEDURE',
  PENDING_TASK: 'PENDING_TASK'
});

export class MemoryService {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_canonical_memory_v3';
    this.legacyKey = 'mini_adhy_canonical_memory_v2';
    this.records = new Map();
    this.projects = new Map();
    this.decisions = new Map();
    this.tombstones = new Map(); // Anti-resurrection tombstones for deleted records
    this.auditLog = [];
    this.storageAdapter = storageAdapter || this.createDefaultStorageAdapter();
    this.isCollectionEnabled = true;
    this.initBaselineMemories();
    this.loadState();
    this.migrateLegacyStores();
  }

  createDefaultStorageAdapter() {
    return {
      get: (key) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      set: (key, val) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, val);
        }
      },
      remove: (key) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      }
    };
  }

  setStorageAdapter(adapter) {
    if (adapter && typeof adapter.get === 'function' && typeof adapter.set === 'function') {
      this.storageAdapter = adapter;
      this.loadState();
      return true;
    }
    return false;
  }

  initBaselineMemories() {
    const baselines = [
      {
        id: 'mem_base_1',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        memoryType: MEMORY_TYPES.FACT,
        content: 'Adhithya Mohan S studies ECE at Mar Baselios College of Engineering and Technology (MBCET, KTU), Trivandrum.',
        source: 'Official Portfolio Background',
        evidence: 'Verified college registration and enrollment records.',
        confidence: 1.0,
        userApproved: true,
        sensitivity: 'public'
      },
      {
        id: 'mem_base_2',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        memoryType: MEMORY_TYPES.FACT,
        content: 'Technical mastery includes MATLAB/Simulink, GNU Radio SDR, KiCad 8 PCB layout, and embedded STM32 ARM Cortex.',
        source: 'Engineering Projects Registry',
        evidence: 'Verified GitHub repositories, PCB fabrications, and DSP experiments.',
        confidence: 1.0,
        userApproved: true,
        sensitivity: 'public'
      },
      {
        id: 'mem_base_3',
        category: MEMORY_CATEGORIES.ONGOING_PROJECT,
        memoryType: MEMORY_TYPES.PROJECT_CONTEXT,
        content: 'Mini-Adhy 2.0 multi-agent companion architecture and portfolio website (adhy.tech).',
        source: 'Active Project Workspace',
        evidence: 'Live production repository and agent runtime implementation.',
        confidence: 1.0,
        userApproved: true,
        sensitivity: 'public'
      },
      {
        id: 'mem_base_4',
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        memoryType: MEMORY_TYPES.PREFERENCE,
        content: 'Prefers simple, working code and practical prototypes before architectural abstractions.',
        source: 'Cognitive Mirror',
        evidence: 'Consistently prioritizes working functional demos over abstract boilerplate.',
        confidence: 0.95,
        userApproved: true,
        sensitivity: 'private'
      },
      {
        id: 'mem_base_5',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        memoryType: MEMORY_TYPES.FACT,
        content: 'Current roles: Media Secretary, MBCET Senate, and Lead Photographer, FRAMES MBCET.',
        source: 'Official Institutional Appointment',
        evidence: 'Elected Senate Media Secretary and FRAMES Lead Photographer.',
        confidence: 1.0,
        userApproved: true,
        sensitivity: 'public'
      },
      {
        id: 'mem_base_6',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        memoryType: MEMORY_TYPES.FACT,
        content: 'Historical leadership: Former Chairperson, ISTE Students Chapter MBCET (led 300+ student members; former PR & Media Head).',
        source: 'Official Society Records',
        evidence: 'Completed tenure as ISTE SC MBCET Chairperson.',
        confidence: 1.0,
        userApproved: true,
        sensitivity: 'public'
      }
    ];

    baselines.forEach(b => {
      if (!this.records.has(b.id)) {
        this.storeRecord(b);
      }
    });

    // Phase 4 Baseline Projects
    if (this.projects.size === 0) {
      const baselineProjects = [
        {
          id: 'proj_mini_adhy',
          title: 'Mini-Adhy 2.0 Autonomous AI Ecosystem',
          domain: 'Multi-Agent Autonomous AI / Web & Robotics Companion',
          objective: 'Develop a persistent, model-independent digital companion that understands Adhy and bridges to desktop robot.',
          status: 'active',
          keyTechnologies: ['React', 'Web Workers', 'Gemini', 'Groq LPU', 'OmniRoute', 'Three.js'],
          technicalArchitecture: 'Modular layered cognitive architecture: ContextCompiler, LearningEngine, MemoryService, OmniRoute ProviderRegistry.',
          constraints: ['Zero-credential persistence', 'Free-tier provider rate limits', 'Real measurable telemetry with zero fabrication'],
          milestones: [
            { id: 'm1', title: 'Phase 1-3 Cognitive Foundation', completed: true },
            { id: 'm2', title: 'Phase 4 Episodic Memory & Continuity', completed: false }
          ],
          knownProblems: ['Provider rate limits require graceful fallback to local neural heuristics'],
          dependencies: ['React 19', 'Sanity Studio', 'Hugging Face Inference API', 'Groq Cloud', 'Gemini API'],
          outstandingTasks: [
            { id: 'task_phase4_memory', title: 'Implement structured project continuity and decision rationale retrieval', status: 'in_progress', priority: 'high' }
          ],
          lastMeaningfulActivity: 'Implemented Phase 3 CognitiveLearningEngine and A/B strategy experiments.',
          history: [
            { timestamp: '2026-09-01T00:00:00.000Z', action: 'CREATED', summary: 'Project initialized', status: 'active' }
          ],
          startedAt: '2026-09-01',
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'proj_sdr_transceiver',
          title: 'Software Defined Radio (SDR) Signal Pipeline',
          domain: 'DSP & Radio Communications',
          objective: 'Build physical RF front-ends, IQ demodulation, and MATLAB/Simulink signal pipelines with GNU Radio.',
          status: 'active',
          keyTechnologies: ['GNU Radio', 'MATLAB/Simulink', 'RTL-SDR', 'KiCad 8'],
          technicalArchitecture: 'RTL-SDR hardware front-end -> IQ quadrature sampling -> GNU Radio DSP flowgraph -> Demodulated packet output.',
          constraints: ['Nyquist sampling bounds', 'ADC bit depth dynamic range', 'CPU buffer underruns during real-time streaming'],
          milestones: [
            { id: 'm_sdr_1', title: 'FM receiver flowgraph in GNU Radio', completed: true }
          ],
          knownProblems: [],
          dependencies: ['GNU Radio 3.10', 'MATLAB R2024a', 'RTL-SDR USB dongle'],
          outstandingTasks: [
            { id: 'task_sdr_filter', title: 'Optimize FIR bandpass coefficients for SSB reception', status: 'pending', priority: 'medium' }
          ],
          lastMeaningfulActivity: 'Tested IQ quadrature demodulation pipeline with GNU Radio.',
          history: [
            { timestamp: '2026-01-15T00:00:00.000Z', action: 'CREATED', summary: 'SDR pipeline project created', status: 'active' }
          ],
          startedAt: '2026-01-15',
          createdAt: '2026-01-15T00:00:00.000Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'proj_zoomout_frames',
          title: 'FRAMES MBCET & Zoomout Frames Photography',
          domain: 'Visual Storytelling, Darkroom Optics & Media',
          objective: 'Documentary, street, and creative photography capturing raw human moments across Kerala (@zoomout_frames).',
          status: 'active',
          role: 'Lead Photographer, FRAMES MBCET',
          handle: '@zoomout_frames',
          keyTechnologies: ['Sony Alpha', 'Prime Lenses', 'Lightroom Classic', 'Capture One'],
          constraints: ['Natural lighting only for street series', 'Preserve filmic grain and color grading integrity'],
          milestones: [
            { id: 'm_frames_1', title: '2025 Annual College Exhibition Gallery', completed: true }
          ],
          knownProblems: [],
          dependencies: ['Sony Alpha camera', 'Lightroom Classic'],
          outstandingTasks: [
            { id: 'task_frames_curate', title: 'Curate 2026 annual college exhibition print series', status: 'pending', priority: 'medium' }
          ],
          lastMeaningfulActivity: 'Lead photography coverage for campus cultural events.',
          history: [
            { timestamp: '2024-06-01T00:00:00.000Z', action: 'CREATED', summary: 'Photography documentary initiative launched', status: 'active' }
          ],
          startedAt: '2024-06-01',
          createdAt: '2024-06-01T00:00:00.000Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'proj_mbcet_senate',
          title: 'MBCET Senate Executive Leadership',
          domain: 'Institutional Governance & Media Communications',
          objective: 'Oversee institutional media communication, senate documentation, and college-wide digital public relations.',
          status: 'active',
          role: 'Media Secretary, MBCET Senate',
          keyTechnologies: ['Digital PR', 'Executive Dispatch', 'Media Relations'],
          constraints: ['Strict institutional governance guidelines', 'Adherence to college senate code of conduct'],
          milestones: [
            { id: 'm_senate_1', title: 'Election to Senate Media Secretary', completed: true }
          ],
          knownProblems: [],
          dependencies: ['Senate Executive Committee', 'College Administration'],
          outstandingTasks: [
            { id: 'task_senate_newsletter', title: 'Publish monthly Senate digital dispatch', status: 'in_progress', priority: 'high' }
          ],
          lastMeaningfulActivity: 'Published official senate communication dispatches.',
          history: [
            { timestamp: '2026-08-01T00:00:00.000Z', action: 'CREATED', summary: 'Elected Senate Media Secretary', status: 'active' }
          ],
          startedAt: '2026-08-01',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'proj_iste_sc_mbcet',
          title: 'ISTE Students Chapter MBCET Leadership',
          domain: 'Executive Society & Student Community',
          objective: 'Lead 300+ student members across technical initiatives, workshops, and student mentorship as Chairperson.',
          status: 'completed',
          role: 'Former Chairperson (ISTE SC MBCET); Former PR & Media Head',
          keyTechnologies: ['Student Chapter Governance', 'Technical Workshops', 'Symposium Leadership'],
          constraints: ['Budget ceilings per workshop', 'Venue coordination across college departments'],
          milestones: [
            { id: 'm_iste_1', title: 'State-level technical symposium organization', completed: true },
            { id: 'm_iste_2', title: 'Tenure completion with distinguished student leadership', completed: true }
          ],
          knownProblems: [],
          dependencies: ['ISTE Kerala Section', 'MBCET Faculty Advisory'],
          outstandingTasks: [],
          lastMeaningfulActivity: 'Successfully completed full executive tenure as Chairperson.',
          history: [
            { timestamp: '2025-08-01T00:00:00.000Z', action: 'CREATED', summary: 'Tenure started as Chairperson', status: 'active' },
            { timestamp: '2026-08-01T00:00:00.000Z', action: 'COMPLETED', summary: 'Tenure completed with distinction', status: 'completed' }
          ],
          startedAt: '2025-08-01',
          completedAt: '2026-08-01',
          createdAt: '2025-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z'
        }
      ];

      baselineProjects.forEach(p => this.projects.set(p.id, p));
    }

    // Phase 4 Baseline Decisions
    if (this.decisions.size === 0) {
      const baselineDecisions = [
        {
          id: 'dec_truthfulness_over_theatrics',
          projectId: 'proj_mini_adhy',
          topic: 'System Telemetry & Operational Truthfulness',
          decision: 'Eliminated fabricated IQ increments, fake CPU loads, and cosmetic neural counters in favor of real measurable task metrics.',
          context: 'Initial agent prototype featured animated but simulated neural telemetry.',
          alternativesConsidered: [
            'Keep cosmetic telemetry for visual appeal',
            'Hide telemetry entirely',
            'Surface real measurable operational metrics'
          ],
          reasoning: 'A trustworthy companion must never claim to have measured what was never inspected. First-principles engineering integrity requires absolute truthfulness.',
          constraints: ['Browser sandbox limits on direct hardware sensor inspection'],
          expectedOutcome: 'Accurate, verifiable trust and developer confidence in Mini-Adhy state.',
          actualOutcome: 'Zero fake telemetry in production; passes all strict audit invariants.',
          date: '2026-11-06',
          createdAt: '2026-11-06T00:00:00.000Z',
          updatedAt: '2026-11-06T00:00:00.000Z'
        },
        {
          id: 'dec_ultron_peace_conviction',
          projectId: 'proj_mini_adhy',
          topic: 'Ultron Philosophical Stance',
          decision: 'Framed Ultron’s "Peace in our time" as a genuine philosophical goal — the peace of an architecture built from first principles with zero tech debt.',
          context: 'Specialist Ultron agent was originally sounding like a cartoon villain.',
          alternativesConsidered: [
            'Standard antagonistic bot persona',
            'Pure technical linter tone',
            'Committed first-principles philosophical challenger'
          ],
          reasoning: 'Transforms Ultron into an indispensable intellectual sparring partner who violently rejects technical debt and superficial thinking.',
          constraints: ['Must remain collaborative and non-destructive within the portfolio ecosystem'],
          expectedOutcome: 'High-impact design critiques that strengthen system architecture.',
          actualOutcome: 'Successfully challenges sloppy abstractions during prompt reviews.',
          date: '2026-11-06',
          createdAt: '2026-11-06T00:00:00.000Z',
          updatedAt: '2026-11-06T00:00:00.000Z'
        },
        {
          id: 'dec_omniroute_gateway',
          projectId: 'proj_mini_adhy',
          topic: 'Inference Provider Resilience',
          decision: 'Integrated OmniRoute with falloverBeforeRetry and token compression to eliminate latency spikes on free-tier rate limits.',
          context: 'Free-tier providers (Groq, Gemini, HF) frequently hit rate limits or return 403/429.',
          alternativesConsidered: [
            'Single provider with exponential backoff',
            'Hard fail to offline message',
            'Multi-provider fallback cascade with client-side compression'
          ],
          reasoning: 'Ensures uninterrupted companion availability across network fluctuations and rate limiting without costing user budget.',
          constraints: ['No credit card / paid billing accounts; must operate within generous free tiers'],
          expectedOutcome: '99.9% uptime for conversational UI.',
          actualOutcome: 'Transparent failover active across Groq LPU, Gemini Flash, and local neural heuristics.',
          date: '2026-11-08',
          createdAt: '2026-11-08T00:00:00.000Z',
          updatedAt: '2026-11-08T00:00:00.000Z'
        }
      ];

      baselineDecisions.forEach(d => this.decisions.set(d.id, d));
    }
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey) || this.storageAdapter.get(this.legacyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const recordsList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.records) ? parsed.records : []);
        recordsList.forEach(rec => {
          if (rec && rec.id) {
            this.records.set(rec.id, {
              ...rec,
              memoryType: rec.memoryType || this._inferMemoryType(rec.category),
              sensitivity: rec.sensitivity || 'public',
              schemaVersion: '3.0.0'
            });
          }
        });

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          if (Array.isArray(parsed.projects)) {
            parsed.projects.forEach(p => { if (p && p.id) this.projects.set(p.id, p); });
          }
          if (Array.isArray(parsed.decisions)) {
            parsed.decisions.forEach(d => { if (d && d.id) this.decisions.set(d.id, d); });
          }
          if (Array.isArray(parsed.tombstones)) {
            parsed.tombstones.forEach(t => { if (t && t.id) this.tombstones.set(t.id, t); });
          }
        }
      }
    } catch {}
  }

  saveState() {
    try {
      const recordsArray = Array.from(this.records.values());
      const projectsArray = Array.from(this.projects.values());
      const decisionsArray = Array.from(this.decisions.values());
      const tombstonesArray = Array.from(this.tombstones.values());
      this.storageAdapter.set(this.storageKey, JSON.stringify({
        schemaVersion: '3.0.0',
        records: recordsArray,
        projects: projectsArray,
        decisions: decisionsArray,
        tombstones: tombstonesArray,
        updatedAt: new Date().toISOString()
      }));
    } catch {}
  }

  _inferMemoryType(category) {
    if (category === MEMORY_CATEGORIES.APPROVED_FACT || category === MEMORY_CATEGORIES.SEMANTIC_MEMORY) return MEMORY_TYPES.FACT;
    if (category === MEMORY_CATEGORIES.USER_PREFERENCE) return MEMORY_TYPES.PREFERENCE;
    if (category === MEMORY_CATEGORIES.ONGOING_PROJECT || category === MEMORY_CATEGORIES.PROJECT_MEMORY) return MEMORY_TYPES.PROJECT_CONTEXT;
    if (category === MEMORY_CATEGORIES.DECISION || category === MEMORY_CATEGORIES.DECISION_MEMORY || category === MEMORY_CATEGORIES.DECISION_RATIONALE) return MEMORY_TYPES.DECISION;
    if (category === MEMORY_CATEGORIES.GOAL) return MEMORY_TYPES.GOAL;
    if (category === MEMORY_CATEGORIES.CORRECTED_FACT) return MEMORY_TYPES.CORRECTED_FACT;
    if (category === MEMORY_CATEGORIES.EPISODIC_MEMORY) return MEMORY_TYPES.EPISODIC;
    if (category === MEMORY_CATEGORIES.PROCEDURAL_MEMORY || category === MEMORY_CATEGORIES.PROCEDURE) return MEMORY_TYPES.PROCEDURE;
    if (category === MEMORY_CATEGORIES.PENDING_MEMORY) return MEMORY_TYPES.PENDING_TASK;
    return MEMORY_TYPES.INFERENCE;
  }

  /**
   * Migrate legacy localStorage stores idempotently
   * Invariant: Legacy findings import as INFERENCE (unapproved), never confirmed facts!
   */
  migrateLegacyStores() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      // 1. Check legacy findings
      const legacyFindings = localStorage.getItem('mini_adhy_findings');
      if (legacyFindings) {
        const parsed = JSON.parse(legacyFindings);
        if (Array.isArray(parsed)) {
          parsed.forEach((f, idx) => {
            const id = `migrated_finding_${idx}_${f.timestamp || Date.now()}`;
            if (!this.records.has(id)) {
              this.storeRecord({
                id,
                category: MEMORY_CATEGORIES.WORKING_CONTEXT,
                memoryType: MEMORY_TYPES.INFERENCE,
                content: f.observation || f.summary || JSON.stringify(f),
                source: 'Migrated from mini_adhy_findings',
                evidence: 'Automated background audit observation.',
                confidence: 0.65,
                userApproved: false
              });
            }
          });
        }
      }

      // 2. Check legacy adhy_digital_echoes
      const legacyEchoes = localStorage.getItem('adhy_digital_echoes');
      if (legacyEchoes) {
        const parsed = JSON.parse(legacyEchoes);
        if (Array.isArray(parsed.memories)) {
          parsed.memories.forEach((echoStr, idx) => {
            const id = `migrated_echo_${idx}`;
            if (!this.records.has(id)) {
              this.storeRecord({
                id,
                category: MEMORY_CATEGORIES.WORKING_CONTEXT,
                memoryType: MEMORY_TYPES.TEMPORARY_CONTEXT,
                content: String(echoStr).trim(),
                source: 'Migrated from adhy_digital_echoes',
                evidence: 'Session note from earlier interaction.',
                confidence: 0.70,
                userApproved: false
              });
            }
          });
        }
      }
    } catch {}
  }

  /**
   * Calculate Jaccard token overlap between two strings
   */
  _calculateTokenOverlap(strA = '', strB = '') {
    const tokensA = new Set(String(strA).toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || []);
    const tokensB = new Set(String(strB).toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || []);
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    let shared = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) shared++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    return union > 0 ? shared / union : 0;
  }

  /**
   * Deduplication check across active memories
   * Threshold: exact match or >85% token overlap
   */
  detectDuplicate(content = '', category = null, projectId = null) {
    const text = String(content).trim();
    if (!text) return null;
    const lower = text.toLowerCase();

    for (const existing of this.records.values()) {
      if (existing.category === MEMORY_CATEGORIES.SUPERSEDED_INFO) continue;
      if (category && existing.category !== category) continue;
      if (projectId && existing.projectId && existing.projectId !== projectId) continue;

      const existingLower = existing.content.toLowerCase().trim();
      if (existingLower === lower) return existing;

      // Check token overlap (> 0.85 threshold)
      const overlap = this._calculateTokenOverlap(existing.content, text);
      if (overlap >= 0.85) return existing;
    }
    return null;
  }

  /**
   * Security Invariant: Detect & reject credentials or secrets
   */
  _containsSecret(text = '') {
    const lower = text.toLowerCase();
    return (
      /bearer\s+[a-z0-9_\-.]{20,}/i.test(text) ||
      /aiza[0-9a-z\-_]{35}/i.test(text) ||
      /gsk_[a-z0-9]{30,}/i.test(text) ||
      /ghp_[a-z0-9]{36}/i.test(text) ||
      lower.includes('api_key') ||
      lower.includes('private_key') ||
      (lower.includes('password') && lower.includes('='))
    );
  }

  /**
   * Store a memory record with full 14-field schema (extended with Phase 4 continuity)
   */
  storeRecord({
    id = null,
    category = MEMORY_CATEGORIES.APPROVED_FACT,
    memoryType = null,
    content = '',
    source = 'Direct Interaction',
    evidence = '',
    confidence = 0.9,
    userApproved = false,
    supersedes = null,
    relatedMemoryIds = [],
    sensitivity = 'public',
    projectId = null,
    structuredData = null,
    ttlExpiresAt = null,
    verified = false,
    lifecycleStatus = null
  }) {
    if (!this.isCollectionEnabled && category !== MEMORY_CATEGORIES.CORRECTED_FACT) {
      return null;
    }

    const trimmedContent = String(content).trim();
    if (!trimmedContent) return null;

    // Anti-Resurrection Invariant: Never re-persist deleted/tombstoned memories
    if (id && this.tombstones.has(id)) {
      console.warn(`[MemoryService] Rejected store: Record '${id}' has been tombstoned and cannot be resurrected.`);
      return null;
    }

    // Security Gate: Reject secrets
    if (this._containsSecret(trimmedContent)) {
      console.warn('[MemoryService] Secret detected. Refusing to persist credentials in memory.');
      return null;
    }

    // Deduplication check: if duplicate exists and not explicitly superseding
    if (!supersedes && !id) {
      const duplicate = this.detectDuplicate(trimmedContent, category, projectId);
      if (duplicate) {
        return duplicate;
      }
    }

    const recId = id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const resolvedType = memoryType || this._inferMemoryType(category);

    // Contradiction & Supersession link
    if (supersedes && this.records.has(supersedes)) {
      const oldRec = this.records.get(supersedes);
      oldRec.category = MEMORY_CATEGORIES.SUPERSEDED_INFO;
      oldRec.supersededBy = recId;
      oldRec.updatedAt = now;
      this.records.set(supersedes, oldRec);
    }

    const record = {
      id: recId,
      category,
      memoryType: resolvedType,
      content: trimmedContent,
      source,
      evidence: evidence || `Recorded via ${source}`,
      confidence: Math.min(1.0, Math.max(0.0, Number(confidence) || 0.5)),
      userApproved: Boolean(userApproved),
      createdAt: now,
      updatedAt: now,
      lastConfirmedAt: userApproved ? now : null,
      supersedes: supersedes || null,
      relatedMemoryIds: Array.isArray(relatedMemoryIds) ? relatedMemoryIds : [],
      sensitivity: (sensitivity === 'private' || sensitivity === 'restricted' || String(sensitivity).toLowerCase() === 'high') ? 'private' : 'public',
      schemaVersion: '3.0.0',
      projectId: projectId || null,
      structuredData: structuredData || null,
      ttlExpiresAt: ttlExpiresAt || null,
      verified: Boolean(verified),
      lifecycleStatus: lifecycleStatus || (Boolean(userApproved) ? 'APPROVED' : 'CANDIDATE')
    };

    this.records.set(recId, record);
    this.saveState();
    return record;
  }

  /**
   * Contextual relevance retrieval with keyword tokens, recency, approval boosting, and TTL filtering
   */
  retrieveRelevant(query = '', options = {}) {
    const limit = options.limit || 5;
    const nowMs = Date.now();
    const queryTokens = (query || '').toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
    const activeRecords = Array.from(this.records.values()).filter(r => {
      if (r.category === MEMORY_CATEGORIES.SUPERSEDED_INFO) return false;
      if (r.ttlExpiresAt && new Date(r.ttlExpiresAt).getTime() <= nowMs) return false;
      return true;
    });

    if (queryTokens.length === 0) {
      return activeRecords
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, limit);
    }

    const scored = activeRecords.map(rec => {
      const contentLower = rec.content.toLowerCase();
      let matchCount = 0;
      queryTokens.forEach(token => {
        if (contentLower.includes(token)) matchCount += 1;
      });

      const tokenScore = matchCount / queryTokens.length;
      const recencyDays = (Date.now() - new Date(rec.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 1 - (recencyDays / 30)) * 0.2;
      const approvalBoost = rec.userApproved ? 0.3 : 0.0;
      const correctionBoost = rec.category === MEMORY_CATEGORIES.CORRECTED_FACT ? 0.5 : 0.0;

      const totalScore = tokenScore * 1.5 + recencyBoost + approvalBoost + correctionBoost;
      return { rec, score: totalScore, matchCount };
    });

    return scored
      .filter(s => s.matchCount > 0 || s.rec.userApproved)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.rec);
  }

  /**
   * Purge expired memories with ttlExpiresAt
   */
  purgeExpiredMemories() {
    const nowMs = Date.now();
    let purgedCount = 0;
    for (const [id, rec] of this.records.entries()) {
      if (rec.ttlExpiresAt && new Date(rec.ttlExpiresAt).getTime() <= nowMs) {
        this.records.delete(id);
        this._logAudit(rec, 'PURGED_EXPIRED', `Memory expired at ${rec.ttlExpiresAt}`);
        purgedCount++;
      }
    }
    if (purgedCount > 0) {
      this.saveState();
    }
    return purgedCount;
  }

  /**
   * User Correction strictly supersedes old memory
   */
  correctMemory(id, newContent, reason = 'User correction') {
    if (!this.records.has(id)) {
      return this.storeRecord({
        category: MEMORY_CATEGORIES.CORRECTED_FACT,
        memoryType: MEMORY_TYPES.CORRECTED_FACT,
        content: newContent,
        source: reason,
        evidence: 'Direct explicit user correction.',
        confidence: 1.0,
        userApproved: true
      });
    }

    return this.storeRecord({
      category: MEMORY_CATEGORIES.CORRECTED_FACT,
      memoryType: MEMORY_TYPES.CORRECTED_FACT,
      content: newContent,
      source: reason,
      evidence: `Corrected earlier record #${id}.`,
      confidence: 1.0,
      userApproved: true,
      supersedes: id
    });
  }

  /**
   * Internal audit log for memory operations
   */
  _logAudit(candidate = {}, action = 'QUEUED_FOR_APPROVAL', reason = '') {
    const entry = {
      id: candidate.id || null,
      timestamp: new Date().toISOString(),
      action,
      reason,
      contentSnippet: (candidate.content || '').slice(0, 80),
      category: candidate.category || null,
      memoryType: candidate.memoryType || null,
      userApproved: Boolean(candidate.userApproved)
    };
    this.auditLog.push(entry);
    if (this.auditLog.length > 100) {
      this.auditLog.shift();
    }
    return entry;
  }

  getAuditTrail() {
    return [...this.auditLog];
  }

  /**
   * Automatically extract candidate observations from user conversation
   * Separates explicit user statements from inferred preferences.
   * Inferred preferences are NEVER auto-approved.
   */
  extractCandidateObservations(userInput = '') {
    const text = String(userInput).trim();
    const lower = text.toLowerCase();
    const candidates = [];

    // 0. Explicit User Corrections (authoritative; override existing facts)
    if (
      lower.startsWith('actually ') ||
      lower.startsWith('no, ') ||
      lower.startsWith('correction:') ||
      lower.includes("that's wrong") ||
      lower.includes('that is wrong') ||
      lower.includes('my current role is')
    ) {
      candidates.push({
        category: MEMORY_CATEGORIES.CORRECTED_FACT,
        memoryType: MEMORY_TYPES.CORRECTED_FACT,
        content: text,
        confidence: 1.0,
        userApproved: true,
        isExplicit: true,
        source: 'Explicit User Correction',
        evidence: `Direct user correction from input: "${text}"`
      });
      return candidates;
    }

    // 1. Explicit Role or Milestone Updates (direct user declarations)
    if (
      lower.includes('i am now ') ||
      lower.includes('my new role is ') ||
      lower.includes('i have been appointed') ||
      lower.includes('my position is now')
    ) {
      candidates.push({
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        memoryType: MEMORY_TYPES.FACT,
        content: text,
        confidence: 0.95,
        userApproved: true,
        isExplicit: true,
        source: 'Direct User Declaration',
        evidence: `Direct statement from user: "${text}"`
      });
    }

    // 2. Project Decisions (explicit choices)
    if (
      lower.includes('we decided to ') ||
      lower.includes('i chose to use ') ||
      lower.includes('we agreed on ') ||
      lower.includes('our architectural decision is')
    ) {
      candidates.push({
        category: MEMORY_CATEGORIES.DECISION,
        memoryType: MEMORY_TYPES.DECISION,
        content: text,
        confidence: 0.90,
        userApproved: true,
        isExplicit: true,
        source: 'Explicit Project Decision',
        evidence: `Direct decision statement: "${text}"`
      });
    }

    // 3. User Preferences (inferred from conversational patterns — NEVER auto-approved)
    if (
      lower.startsWith('i prefer ') ||
      lower.includes('i usually prefer ') ||
      lower.includes('i tend to ') ||
      lower.includes('i like to work with')
    ) {
      candidates.push({
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        memoryType: MEMORY_TYPES.PREFERENCE,
        content: text,
        confidence: 0.75,
        userApproved: false, // Inferred preferences require user confirmation; never auto-approved
        isExplicit: false,
        source: 'Inferred Conversational Pattern',
        evidence: `Inferred preference from user conversational habit: "${text}"`
      });
    }

    return candidates;
  }

  /**
   * Evaluate a candidate observation through security, deduplication,
   * contradiction checks, and approval gating before persistence.
   */
  evaluateAndProcessCandidate(candidate = {}) {
    if (!candidate || !candidate.content) return null;

    // 1. Check paused collection
    if (!this.isCollectionEnabled && candidate.category !== MEMORY_CATEGORIES.CORRECTED_FACT) {
      this._logAudit(candidate, 'COLLECTION_PAUSED', 'Memory collection is currently paused by user');
      return null;
    }

    // 2. Security Invariant: Detect credentials, tokens, or passwords
    if (this._containsSecret(candidate.content)) {
      this._logAudit(candidate, 'REJECTED_SECRET', 'Candidate text contains sensitive credential or API token patterns');
      return null;
    }

    const trimmedContent = String(candidate.content).trim();
    const lowerContent = trimmedContent.toLowerCase();

    // 3. Duplicate Detection across active records
    for (const existing of this.records.values()) {
      if (existing.category === MEMORY_CATEGORIES.SUPERSEDED_INFO) continue;
      if (existing.content.toLowerCase().trim() === lowerContent) {
        this._logAudit(candidate, 'REJECTED_DUPLICATE', `Identical memory content already exists under ${existing.id}`);
        return existing;
      }
    }

    // 4. Contradiction & Supersession Detection
    let supersedesId = candidate.supersedes || null;
    if (candidate.category === MEMORY_CATEGORIES.CORRECTED_FACT || candidate.isExplicit) {
      // Check for contradicting role/fact records
      const roleKeywords = ['role', 'chairperson', 'senate', 'secretary', 'iste', 'frames', 'lead'];
      const hasRoleKw = roleKeywords.some(kw => lowerContent.includes(kw));

      if (hasRoleKw) {
        for (const [id, rec] of this.records.entries()) {
          if (rec.category === MEMORY_CATEGORIES.SUPERSEDED_INFO) continue;
          const recLower = rec.content.toLowerCase();
          if (rec.category === MEMORY_CATEGORIES.APPROVED_FACT && roleKeywords.some(kw => recLower.includes(kw))) {
            supersedesId = id;
            this._logAudit(candidate, 'SUPERSEDED', `Candidate supersedes earlier role record ${id}`);
            break;
          }
        }
      }
    }

    // 5. Approval Pipeline Gate
    // Explicit user corrections and direct statements get stored with approval;
    // Inferred preferences and ambiguous statements get stored with userApproved: false.
    const isApproved = Boolean(candidate.isExplicit && candidate.userApproved);

    const stored = this.storeRecord({
      ...candidate,
      userApproved: isApproved,
      supersedes: supersedesId
    });

    if (stored) {
      if (isApproved) {
        this._logAudit(candidate, 'ACCEPTED', 'Explicit verified statement from user');
      } else {
        this._logAudit(candidate, 'QUEUED_FOR_APPROVAL', 'Inferred preference or unverified statement queued with userApproved=false');
      }
    }

    return stored;
  }

  deleteMemory(id, reason = 'Explicit deletion by owner') {
    if (this.records.has(id)) {
      this.records.delete(id);
      this.tombstones.set(id, {
        id,
        tombstonedAt: new Date().toISOString(),
        reason,
        authority: 'owner'
      });
      this.saveState();
      return true;
    }
    return false;
  }

  getTombstones() {
    return Array.from(this.tombstones.values());
  }

  clearAll() {
    this.records.clear();
    this.projects.clear();
    this.decisions.clear();
    this.saveState();
    this.initBaselineMemories();
  }

  exportMemories(options = {}) {
    if (options && options.fullBundle) {
      return {
        schemaVersion: '3.0.0',
        exportedAt: new Date().toISOString(),
        records: Array.from(this.records.values()),
        projects: Array.from(this.projects.values()),
        decisions: Array.from(this.decisions.values()),
        auditLog: this.getAuditTrail()
      };
    }
    return Array.from(this.records.values());
  }

  exportSelective(options = {}) {
    let records = Array.from(this.records.values());

    if (options.categories && Array.isArray(options.categories)) {
      records = records.filter(r => options.categories.includes(r.category));
    }

    if (typeof options.minConfidence === 'number') {
      records = records.filter(r => (r.confidence ?? 1.0) >= options.minConfidence);
    }

    if (options.approvedOnly) {
      records = records.filter(r => r.userApproved || r.category === MEMORY_CATEGORIES.APPROVED_FACT || r.category === MEMORY_CATEGORIES.CORRECTED_FACT);
    }

    if (options.excludePrivate) {
      records = records.filter(r => !r.isPrivate && !r.sensitive);
    }

    const bundle = {
      schemaVersion: '3.0.0',
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records
    };

    if (options.includeProjects !== false) {
      bundle.projects = Array.from(this.projects.values());
    }

    if (options.includeDecisions !== false) {
      bundle.decisions = Array.from(this.decisions.values());
    }

    return bundle;
  }

  importMemories(recordsOrBundle = [], options = {}) {
    if (!recordsOrBundle) {
      return { imported: 0, rejected: 0, quarantined: 0, errors: ['Input cannot be null'] };
    }

    // Support fullBundle import object
    let recordsArray = recordsOrBundle;
    if (!Array.isArray(recordsOrBundle) && typeof recordsOrBundle === 'object') {
      if (Array.isArray(recordsOrBundle.projects)) {
        recordsOrBundle.projects.forEach(p => { if (p && p.id) this.projects.set(p.id, p); });
      }
      if (Array.isArray(recordsOrBundle.decisions)) {
        recordsOrBundle.decisions.forEach(d => { if (d && d.id) this.decisions.set(d.id, d); });
      }
      if (Array.isArray(recordsOrBundle.tombstones)) {
        recordsOrBundle.tombstones.forEach(t => { if (t && t.id) this.tombstones.set(t.id, t); });
      }
      recordsArray = Array.isArray(recordsOrBundle.records) ? recordsOrBundle.records : [];
    }

    if (!Array.isArray(recordsArray)) {
      return { imported: 0, rejected: 0, quarantined: 0, errors: ['Input must be an array or bundle object'] };
    }
    // Guard against oversized batches
    if (recordsArray.length > 500) {
      return { imported: 0, rejected: 0, quarantined: 0, errors: ['Batch too large (max 500 records)'] };
    }

    const results = { imported: 0, rejected: 0, quarantined: 0, errors: [] };
    const batch = [];

    for (const rec of recordsArray) {
      // Basic schema validation
      if (!rec || typeof rec !== 'object' || !rec.id || !rec.content || !rec.category) {
        results.rejected++;
        continue;
      }

      // Anti-Resurrection: Reject tombstoned memories
      if (this.tombstones.has(rec.id)) {
        results.rejected++;
        results.quarantined++;
        this._logAudit(rec, 'REJECTED_TOMBSTONE_ON_IMPORT', `Record '${rec.id}' is tombstoned and cannot be resurrected.`);
        continue;
      }
      if (!Object.values(MEMORY_CATEGORIES).includes(rec.category)) {
        results.rejected++;
        continue;
      }
      if (typeof rec.content !== 'string' || rec.content.length > 2000) {
        results.rejected++;
        continue;
      }
      // Secret detection — never persist credentials
      if (this._containsSecret(rec.content)) {
        results.rejected++;
        this._logAudit(rec, 'REJECTED_SECRET_ON_IMPORT', 'Secret detected in imported record — rejected');
        continue;
      }
      // Strip any trust claims from imported data — imported records are ALWAYS untrusted
      batch.push({
        ...rec,
        userApproved: false,     // ← FORCE: ignore any userApproved: true from import
        category: rec.category === MEMORY_CATEGORIES.APPROVED_FACT ? MEMORY_CATEGORIES.HYPOTHESIS : rec.category,
        importedAt: new Date().toISOString(),
        schemaVersion: '3.0.0',
        confidence: typeof rec.confidence === 'number' ? Math.min(1, Math.max(0, rec.confidence)) : 0.5
      });
    }

    // Transactional: validate entire batch before committing
    for (const rec of batch) {
      if (this.records.has(rec.id) && options.mode !== 'overwrite') {
        results.quarantined++;
        this._logAudit(rec, 'QUARANTINED_DUPLICATE', 'Imported record ID already exists — not overwritten');
      } else {
        this.records.set(rec.id, rec);
        results.imported++;
        this._logAudit(rec, 'IMPORTED_PENDING_APPROVAL', 'Imported; forced userApproved=false — requires owner approval');
      }
    }

    if (results.imported > 0) {
      this.saveState();
    }
    return results;
  }

  // ── Structured Project Continuity ───────────────────────────────────

  storeProject(projectData = {}) {
    return this.createProject(projectData);
  }

  createProject(projectData = {}) {
    const id = projectData.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const project = {
      id,
      title: projectData.title || projectData.name || 'Untitled Project',
      name: projectData.name || projectData.title || 'Untitled Project',
      domain: projectData.domain || 'General Engineering',
      objective: projectData.objective || '',
      status: projectData.status || 'active',
      role: projectData.role || null,
      handle: projectData.handle || null,
      keyTechnologies: Array.isArray(projectData.keyTechnologies) ? [...projectData.keyTechnologies] : [],
      technicalArchitecture: projectData.technicalArchitecture || '',
      constraints: Array.isArray(projectData.constraints) ? [...projectData.constraints] : [],
      milestones: Array.isArray(projectData.milestones) ? [...projectData.milestones] : [],
      knownProblems: Array.isArray(projectData.knownProblems) ? [...projectData.knownProblems] : [],
      dependencies: Array.isArray(projectData.dependencies) ? [...projectData.dependencies] : [],
      decisions: Array.isArray(projectData.decisions) ? [...projectData.decisions] : [],
      outstandingTasks: Array.isArray(projectData.outstandingTasks) ? [...projectData.outstandingTasks] : [],
      lastMeaningfulActivity: projectData.lastMeaningfulActivity || projectData.objective || 'Project created',
      history: [
        {
          timestamp: now,
          action: 'CREATED',
          summary: projectData.objective ? `Created: ${projectData.objective}` : 'Project initialized',
          status: projectData.status || 'active'
        }
      ],
      startedAt: projectData.startedAt || now.split('T')[0],
      createdAt: now,
      updatedAt: now
    };

    this.projects.set(id, project);

    // Also index in memory records
    this.storeRecord({
      id: `mem_proj_${id}`,
      category: MEMORY_CATEGORIES.PROJECT_MEMORY,
      memoryType: MEMORY_TYPES.PROJECT_CONTEXT,
      content: `Project [${project.title}]: ${project.objective}. Status: ${project.status}. Architecture: ${project.technicalArchitecture}${project.knownProblems?.length ? `. Known issues: ${project.knownProblems.join('; ')}` : ''}`,
      source: 'Project Continuity Registry',
      evidence: 'Structured project entity creation',
      confidence: 1.0,
      userApproved: true,
      projectId: id,
      structuredData: project
    });

    this.saveState();
    return project;
  }

  updateProject(projectId, updateData = {}) {
    const project = this.projects.get(projectId);
    if (!project) return null;
    const now = new Date().toISOString();

    if (updateData.title !== undefined) project.title = updateData.title;
    if (updateData.objective !== undefined) project.objective = updateData.objective;
    if (updateData.status !== undefined) project.status = updateData.status;
    if (updateData.technicalArchitecture !== undefined) project.technicalArchitecture = updateData.technicalArchitecture;
    if (updateData.lastMeaningfulActivity !== undefined) project.lastMeaningfulActivity = updateData.lastMeaningfulActivity;

    if (Array.isArray(updateData.keyTechnologies)) project.keyTechnologies = [...updateData.keyTechnologies];
    if (Array.isArray(updateData.constraints)) project.constraints = [...updateData.constraints];
    if (Array.isArray(updateData.knownProblems)) project.knownProblems = [...updateData.knownProblems];
    if (Array.isArray(updateData.dependencies)) project.dependencies = [...updateData.dependencies];

    if (Array.isArray(updateData.milestones)) {
      project.milestones = [...updateData.milestones];
    }
    if (Array.isArray(updateData.outstandingTasks)) {
      project.outstandingTasks = [...updateData.outstandingTasks];
    }

    const summary = updateData.summary || updateData.lastMeaningfulActivity || 'Project updated';
    project.lastMeaningfulActivity = summary;
    project.updatedAt = now;
    project.history.unshift({
      timestamp: now,
      action: updateData.action || 'UPDATED',
      summary,
      status: project.status,
      details: updateData
    });

    this.saveState();
    return project;
  }

  pauseProject(projectId, reason = 'Project paused by user', outstandingTasks = null) {
    const project = this.projects.get(projectId);
    if (!project) return null;
    const now = new Date().toISOString();

    project.status = 'paused';
    if (Array.isArray(outstandingTasks)) {
      project.outstandingTasks = [...outstandingTasks];
    }
    const summary = `Paused: ${reason}`;
    project.lastMeaningfulActivity = summary;
    project.updatedAt = now;
    project.history.unshift({
      timestamp: now,
      action: 'PAUSED',
      summary,
      status: 'paused',
      outstandingTasks: [...project.outstandingTasks]
    });

    // Store a pending memory record so context compiler immediately knows this work is paused with tasks
    const taskSummary = project.outstandingTasks.map(t => (typeof t === 'object' ? t.title : t)).join('; ');
    this.storeRecord({
      id: `mem_pause_${projectId}_${Date.now()}`,
      category: MEMORY_CATEGORIES.PENDING_MEMORY,
      memoryType: MEMORY_TYPES.PENDING_TASK,
      content: `Paused project [${project.title}]: ${reason}. Outstanding tasks: ${taskSummary || 'None'}`,
      source: 'Project Pause Invariant',
      evidence: `User or system paused project on ${now}`,
      confidence: 1.0,
      userApproved: true,
      projectId,
      structuredData: {
        reason,
        pausedAt: now,
        outstandingTasks: project.outstandingTasks
      }
    });

    this.saveState();
    return project;
  }

  resumeProject(projectId, resumptionContext = 'Resumed in active conversation') {
    const project = this.projects.get(projectId);
    if (!project) return null;
    const now = new Date().toISOString();

    project.status = 'active';
    const summary = `Resumed: ${resumptionContext}`;
    project.lastMeaningfulActivity = summary;
    project.updatedAt = now;
    project.history.unshift({
      timestamp: now,
      action: 'RESUMED',
      summary,
      status: 'active'
    });

    this.saveState();
    return project;
  }

  getProject(projectId) {
    return this.projects.get(projectId) || null;
  }

  listProjects(filter = null) {
    const list = Array.from(this.projects.values());
    if (!filter) return list;
    if (typeof filter === 'string') {
      return list.filter(p => p.status === filter || p.id === filter);
    }
    if (typeof filter === 'object') {
      return list.filter(p => {
        return Object.entries(filter).every(([k, v]) => p[k] === v);
      });
    }
    return list;
  }

  getProjectHistory(projectId) {
    const project = this.projects.get(projectId);
    return project ? [...project.history] : [];
  }

  // ── Structured Decision History ─────────────────────────────────────

  recordDecision({
    id = null,
    projectId = null,
    topic = '',
    decision = '',
    context = '',
    alternativesConsidered = [],
    reasoning = '',
    constraints = [],
    expectedOutcome = '',
    actualOutcome = null,
    date = null
  } = {}) {
    if (!topic || !decision) return null;
    const decId = id || `dec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const resolvedDate = date || now.split('T')[0];

    // Do not invent missing rationale; preserve exact provided reasoning
    const resolvedReasoning = String(reasoning || '').trim();

    const decRecord = {
      id: decId,
      projectId: projectId || null,
      topic: String(topic).trim(),
      decision: String(decision).trim(),
      context: String(context || '').trim(),
      alternativesConsidered: Array.isArray(alternativesConsidered) ? [...alternativesConsidered] : [],
      reasoning: resolvedReasoning,
      constraints: Array.isArray(constraints) ? [...constraints] : [],
      expectedOutcome: String(expectedOutcome || '').trim(),
      actualOutcome: actualOutcome !== null && actualOutcome !== undefined ? String(actualOutcome).trim() : null,
      date: resolvedDate,
      createdAt: now,
      updatedAt: now
    };

    this.decisions.set(decId, decRecord);

    // Link decision to project if exists
    if (projectId && this.projects.has(projectId)) {
      const proj = this.projects.get(projectId);
      if (!Array.isArray(proj.decisions)) proj.decisions = [];
      if (!Array.isArray(proj.history)) proj.history = [];

      if (!proj.decisions.includes(decId)) {
        proj.decisions.unshift(decId);
        proj.history.unshift({
          timestamp: now,
          action: 'DECISION_LINKED',
          summary: `Decision [${topic}]: ${decision}`,
          status: proj.status
        });
      }
    }

    // Index into canonical memory records for unified search
    const altStr = decRecord.alternativesConsidered.length ? ` Alternatives considered: ${decRecord.alternativesConsidered.join(', ')}.` : '';
    const reasonStr = decRecord.reasoning ? ` Rationale: ${decRecord.reasoning}.` : '';
    this.storeRecord({
      id: `mem_${decId}`,
      category: MEMORY_CATEGORIES.DECISION_MEMORY,
      memoryType: MEMORY_TYPES.DECISION,
      content: `Decision on [${decRecord.topic}]: ${decRecord.decision}.${altStr}${reasonStr}`,
      source: 'Structured Decision History',
      evidence: decRecord.context || 'Recorded architectural decision',
      confidence: 1.0,
      userApproved: true,
      projectId,
      structuredData: decRecord
    });

    this.saveState();
    return decRecord;
  }

  updateDecisionOutcome(decisionId, actualOutcome = '') {
    const dec = this.decisions.get(decisionId);
    if (!dec) return null;
    dec.actualOutcome = String(actualOutcome).trim();
    dec.updatedAt = new Date().toISOString();

    // Update memory record if indexed
    if (this.records.has(`mem_${decisionId}`)) {
      const rec = this.records.get(`mem_${decisionId}`);
      rec.content += ` Actual Outcome: ${dec.actualOutcome}`;
      rec.updatedAt = dec.updatedAt;
      if (rec.structuredData) {
        rec.structuredData.actualOutcome = dec.actualOutcome;
      }
    }

    this.saveState();
    return dec;
  }

  getDecisionsForProject(projectId) {
    return Array.from(this.decisions.values()).filter(d => d.projectId === projectId);
  }

  getDecisionHistory(limit = 20) {
    return Array.from(this.decisions.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // ── Episodic & Procedural Memory Storage ───────────────────────────

  storeEpisodicRecord({
    eventName = '',
    context = '',
    outcome = '',
    reflections = '',
    timestamp = null,
    participants = ['Adhy', 'Mini-Adhy'],
    projectId = null,
    sensitivity = 'public',
    ttlExpiresAt = null
  } = {}) {
    const text = `${eventName}: ${context}. Outcome: ${outcome}.${reflections ? ' Reflections: ' + reflections : ''}`.trim();
    return this.storeRecord({
      category: MEMORY_CATEGORIES.EPISODIC_MEMORY,
      memoryType: MEMORY_TYPES.EPISODIC,
      content: text,
      source: 'Episodic Experience Anchor',
      evidence: `Episodic event "${eventName}" recorded`,
      confidence: 0.95,
      userApproved: true,
      projectId,
      sensitivity,
      ttlExpiresAt,
      structuredData: {
        eventName,
        context,
        outcome,
        reflections,
        timestamp: timestamp || new Date().toISOString(),
        participants
      }
    });
  }

  storeProceduralRecord({
    workflowName = '',
    steps = [],
    prerequisites = [],
    tips = [],
    tools = [],
    projectId = null
  } = {}) {
    const stepStr = Array.isArray(steps) ? steps.map((s, i) => `${i + 1}. ${s}`).join(' ') : String(steps);
    const content = `Procedure [${workflowName}]: ${stepStr}`;
    return this.storeRecord({
      category: MEMORY_CATEGORIES.PROCEDURAL_MEMORY,
      memoryType: MEMORY_TYPES.PROCEDURE,
      content,
      source: 'Procedural Knowledge Workflow',
      evidence: `Established workflow for "${workflowName}"`,
      confidence: 1.0,
      userApproved: true,
      projectId,
      structuredData: {
        workflowName,
        steps,
        prerequisites,
        tips,
        tools
      }
    });
  }

  // ── 5 Core Contextual Retrieval Queries ─────────────────────────────

  /**
   * Question 1: "What were we working on?"
   */
  getRecentWorkContext({ limit = 5, projectId = null } = {}) {
    let projects = Array.from(this.projects.values());
    if (projectId) {
      projects = projects.filter(p => p.id === projectId);
    }

    const activeOrPaused = projects
      .filter(p => p.status === 'active' || p.status === 'paused')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const recentEpisodes = Array.from(this.records.values())
      .filter(r => (r.category === MEMORY_CATEGORIES.EPISODIC_MEMORY || r.memoryType === MEMORY_TYPES.EPISODIC) && r.category !== MEMORY_CATEGORIES.SUPERSEDED_INFO)
      .filter(r => !projectId || r.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);

    const pendingTasks = [];
    activeOrPaused.forEach(p => {
      (p.outstandingTasks || []).forEach(t => {
        if (typeof t === 'object' && t.status !== 'completed') {
          pendingTasks.push({ ...t, projectTitle: p.title, projectId: p.id });
        } else if (typeof t === 'string') {
          pendingTasks.push({ id: `task_${p.id}`, title: t, projectTitle: p.title, projectId: p.id });
        }
      });
    });

    const topProject = activeOrPaused[0] || null;
    const summary = topProject
      ? `Currently focused on ${topProject.title} (${topProject.status}): ${topProject.lastMeaningfulActivity}. Pending tasks: ${pendingTasks.length}.`
      : 'No active project context found.';

    return {
      activeProjects: activeOrPaused.slice(0, limit),
      recentEvents: recentEpisodes,
      pendingTasks: pendingTasks.slice(0, limit * 2),
      summary
    };
  }

  /**
   * Question 2: "Why did we choose this architecture?"
   */
  findDecisionRationale(topicOrQuery = '') {
    const query = String(topicOrQuery || '').toLowerCase().trim();
    const queryTokens = query.match(/\b[a-z0-9]{3,}\b/g) || [];
    const allDecisions = Array.from(this.decisions.values());

    if (queryTokens.length === 0) {
      return allDecisions.slice(0, 5);
    }

    const scored = allDecisions.map(d => {
      const text = `${d.topic} ${d.decision} ${d.context} ${d.reasoning} ${(d.alternativesConsidered || []).join(' ')} ${(d.constraints || []).join(' ')}`.toLowerCase();
      let matchCount = 0;
      queryTokens.forEach(t => {
        if (text.includes(t)) matchCount++;
      });
      return { decision: d, score: matchCount };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.decision);
  }

  /**
   * Question 3: "What did we try previously?"
   */
  getPreviousAttempts(topicOrQuery = '') {
    const query = String(topicOrQuery || '').toLowerCase().trim();
    const queryTokens = query.match(/\b[a-z0-9]{3,}\b/g) || [];

    const alternativesTried = [];
    Array.from(this.decisions.values()).forEach(d => {
      const match = queryTokens.length === 0 || queryTokens.some(t => `${d.topic} ${d.decision}`.toLowerCase().includes(t));
      if (match && Array.isArray(d.alternativesConsidered) && d.alternativesConsidered.length > 0) {
        alternativesTried.push({
          topic: d.topic,
          chosen: d.decision,
          alternatives: d.alternativesConsidered,
          reasoning: d.reasoning
        });
      }
    });

    const supersededApproaches = Array.from(this.records.values())
      .filter(r => r.category === MEMORY_CATEGORIES.SUPERSEDED_INFO)
      .filter(r => queryTokens.length === 0 || queryTokens.some(t => r.content.toLowerCase().includes(t)))
      .map(r => ({
        id: r.id,
        content: r.content,
        supersededBy: r.supersededBy,
        updatedAt: r.updatedAt
      }));

    const pastEpisodes = Array.from(this.records.values())
      .filter(r => r.category === MEMORY_CATEGORIES.EPISODIC_MEMORY || r.memoryType === MEMORY_TYPES.EPISODIC)
      .filter(r => queryTokens.length === 0 || queryTokens.some(t => r.content.toLowerCase().includes(t)))
      .map(r => ({
        id: r.id,
        content: r.content,
        structuredData: r.structuredData,
        updatedAt: r.updatedAt
      }));

    return {
      alternativesTried,
      supersededApproaches,
      pastEpisodes
    };
  }

  /**
   * Question 4: "What remains unfinished?"
   */
  getUnfinishedWork({ projectId = null } = {}) {
    let projects = Array.from(this.projects.values());
    if (projectId) {
      projects = projects.filter(p => p.id === projectId);
    }

    const pendingTasks = [];
    const pausedProjects = [];

    projects.forEach(p => {
      if (p.status === 'paused') {
        pausedProjects.push({
          id: p.id,
          title: p.title,
          lastMeaningfulActivity: p.lastMeaningfulActivity,
          outstandingTasksCount: (p.outstandingTasks || []).length
        });
      }

      (p.outstandingTasks || []).forEach(t => {
        if (typeof t === 'object' && t.status !== 'completed') {
          pendingTasks.push({
            id: t.id || `task_${Math.random().toString(36).substr(2, 5)}`,
            title: t.title || 'Untitled task',
            status: t.status || 'pending',
            priority: t.priority || 'medium',
            projectId: p.id,
            projectTitle: p.title
          });
        } else if (typeof t === 'string') {
          pendingTasks.push({
            id: `task_${p.id}`,
            title: t,
            status: 'pending',
            priority: 'medium',
            projectId: p.id,
            projectTitle: p.title
          });
        }
      });
    });

    const pendingMemories = Array.from(this.records.values())
      .filter(r => (r.category === MEMORY_CATEGORIES.PENDING_MEMORY || r.memoryType === MEMORY_TYPES.PENDING_TASK) && r.category !== MEMORY_CATEGORIES.SUPERSEDED_INFO)
      .filter(r => !projectId || r.projectId === projectId);

    return {
      projectId,
      pendingTasks,
      pausedProjects,
      pendingMemories
    };
  }

  /**
   * Question 5: "What changed since the last session?"
   */
  getDiffSinceLastSession(sessionTimestamp) {
    const sinceTime = new Date(sessionTimestamp).getTime();
    if (isNaN(sinceTime)) {
      return { since: sessionTimestamp, error: 'Invalid session timestamp' };
    }

    const newMemories = Array.from(this.records.values()).filter(r => {
      return new Date(r.createdAt).getTime() > sinceTime;
    });

    const updatedProjects = Array.from(this.projects.values()).filter(p => {
      return new Date(p.updatedAt).getTime() > sinceTime;
    });

    const newDecisions = Array.from(this.decisions.values()).filter(d => {
      return new Date(d.createdAt).getTime() > sinceTime;
    });

    const pausedProjects = updatedProjects.filter(p => p.status === 'paused');
    const completedTasks = [];
    updatedProjects.forEach(p => {
      (p.outstandingTasks || []).forEach(t => {
        if (typeof t === 'object' && t.status === 'completed' && new Date(t.completedAt || p.updatedAt).getTime() > sinceTime) {
          completedTasks.push({ ...t, projectId: p.id });
        }
      });
    });

    return {
      since: new Date(sinceTime).toISOString(),
      newMemories,
      updatedProjects,
      newDecisions,
      pausedProjects,
      completedTasks
    };
  }

  // ── Memory Approval Workflow ────────────────────────────────────────

  getRecord(id) {
    return this.records.get(id) || null;
  }

  getMemory(id) {
    return this.records.get(id) || null;
  }

  getPendingApprovals() {
    return Array.from(this.records.values())
      .filter(r => !r.userApproved && r.category !== MEMORY_CATEGORIES.SUPERSEDED_INFO)
      .sort((a, b) => new Date(b.importedAt || b.timestamp || 0) - new Date(a.importedAt || a.timestamp || 0));
  }

  approveMemory(id) {
    const rec = this.records.get(id);
    if (!rec) return false;
    const updated = { ...rec, userApproved: true, approvedAt: new Date().toISOString() };
    this.records.set(id, updated);
    this.saveState();
    this._logAudit(updated, 'APPROVED', 'Owner approved memory');
    return true;
  }

  rejectMemory(id) {
    const rec = this.records.get(id);
    if (!rec) return false;
    this.records.delete(id);
    this.saveState();
    this._logAudit(rec, 'REJECTED', 'Owner rejected memory');
    return true;
  }

  editPendingMemory(id, changes = {}) {
    const rec = this.records.get(id);
    if (!rec) return false;
    const allowedFields = ['content', 'category', 'confidence', 'sensitivity'];
    const sanitized = {};
    for (const f of allowedFields) {
      if (changes[f] !== undefined) sanitized[f] = changes[f];
    }
    if (sanitized.content && this._containsSecret(String(sanitized.content))) return false;
    if (sanitized.category && !Object.values(MEMORY_CATEGORIES).includes(sanitized.category)) return false;
    const updated = { ...rec, ...sanitized, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    this.saveState();
    this._logAudit(updated, 'EDITED_PENDING', 'Owner edited pending memory');
    return true;
  }

  setCollectionEnabled(enabled) {
    this.isCollectionEnabled = Boolean(enabled);
  }

  pauseCollection() {
    this.isCollectionEnabled = false;
  }

  resumeCollection() {
    this.isCollectionEnabled = true;
  }
}

export const memoryService = new MemoryService();
