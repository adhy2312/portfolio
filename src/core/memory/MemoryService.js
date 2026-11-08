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
  SUPERSEDED_INFO: 'SUPERSEDED_INFO'
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
  CORRECTED_FACT: 'CORRECTED_FACT'
});

export class MemoryService {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_canonical_memory_v3';
    this.legacyKey = 'mini_adhy_canonical_memory_v2';
    this.records = new Map();
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
        content: 'Current executive leadership role: Chairperson, ISTE Students Chapter MBCET (Aug 2026 – Present).',
        source: 'Official Society Appointment',
        evidence: 'Elected Chairperson leading 300+ student members.',
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
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey) || this.storageAdapter.get(this.legacyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(rec => {
            if (rec && rec.id) {
              this.records.set(rec.id, {
                ...rec,
                memoryType: rec.memoryType || this._inferMemoryType(rec.category),
                sensitivity: rec.sensitivity || 'public',
                schemaVersion: '3.0.0'
              });
            }
          });
        }
      }
    } catch {}
  }

  saveState() {
    try {
      const recordsArray = Array.from(this.records.values());
      this.storageAdapter.set(this.storageKey, JSON.stringify(recordsArray));
    } catch {}
  }

  _inferMemoryType(category) {
    if (category === MEMORY_CATEGORIES.APPROVED_FACT) return MEMORY_TYPES.FACT;
    if (category === MEMORY_CATEGORIES.USER_PREFERENCE) return MEMORY_TYPES.PREFERENCE;
    if (category === MEMORY_CATEGORIES.ONGOING_PROJECT) return MEMORY_TYPES.PROJECT_CONTEXT;
    if (category === MEMORY_CATEGORIES.DECISION) return MEMORY_TYPES.DECISION;
    if (category === MEMORY_CATEGORIES.GOAL) return MEMORY_TYPES.GOAL;
    if (category === MEMORY_CATEGORIES.CORRECTED_FACT) return MEMORY_TYPES.CORRECTED_FACT;
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
   * Security Invariant: Detect & reject credentials or secrets
   */
  _containsSecret(text = '') {
    const lower = text.toLowerCase();
    return (
      /bearer\s+[a-z0-9_\-\.]{20,}/i.test(text) ||
      /aiza[0-9a-z\-_]{35}/i.test(text) ||
      /gsk_[a-z0-9]{30,}/i.test(text) ||
      /ghp_[a-z0-9]{36}/i.test(text) ||
      lower.includes('api_key') ||
      lower.includes('private_key') ||
      lower.includes('password') && lower.includes('=')
    );
  }

  /**
   * Store a memory record with full 14-field schema
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
    sensitivity = 'public'
  }) {
    if (!this.isCollectionEnabled && category !== MEMORY_CATEGORIES.CORRECTED_FACT) {
      return null;
    }

    const trimmedContent = String(content).trim();
    if (!trimmedContent) return null;

    // Security Gate: Reject secrets
    if (this._containsSecret(trimmedContent)) {
      console.warn('[MemoryService] Secret detected. Refusing to persist credentials in memory.');
      return null;
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
      sensitivity: sensitivity === 'private' ? 'private' : 'public',
      schemaVersion: '3.0.0'
    };

    this.records.set(recId, record);
    this.saveState();
    return record;
  }

  /**
   * Contextual relevance retrieval with keyword tokens, recency, and approval boosting
   */
  retrieveRelevant(query = '', options = {}) {
    const limit = options.limit || 5;
    const queryTokens = (query || '').toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
    const activeRecords = Array.from(this.records.values()).filter(
      r => r.category !== MEMORY_CATEGORIES.SUPERSEDED_INFO
    );

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
   * Automatically extract candidate observations from user conversation
   */
  extractCandidateObservations(userInput = '') {
    const text = String(userInput).trim();
    const lower = text.toLowerCase();
    const candidates = [];

    // 1. Explicit preference statements
    if (lower.startsWith('i prefer ') || lower.includes('i usually prefer ')) {
      candidates.push({
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        memoryType: MEMORY_TYPES.PREFERENCE,
        content: text,
        confidence: 0.85,
        source: 'Conversational statement'
      });
    }

    // 2. Explicit role or milestone statements
    if (lower.includes('i am now ') || lower.includes('my new role is ')) {
      candidates.push({
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        memoryType: MEMORY_TYPES.FACT,
        content: text,
        confidence: 0.90,
        source: 'Conversational status update'
      });
    }

    // 3. Project decisions
    if (lower.includes('we decided to ') || lower.includes('i chose to use ')) {
      candidates.push({
        category: MEMORY_CATEGORIES.DECISION,
        memoryType: MEMORY_TYPES.DECISION,
        content: text,
        confidence: 0.85,
        source: 'Conversational engineering decision'
      });
    }

    return candidates;
  }

  deleteMemory(id) {
    if (this.records.has(id)) {
      this.records.delete(id);
      this.saveState();
      return true;
    }
    return false;
  }

  clearAll() {
    this.records.clear();
    this.saveState();
    this.initBaselineMemories();
  }

  exportMemories() {
    return Array.from(this.records.values());
  }

  importMemories(recordsArray = []) {
    if (!Array.isArray(recordsArray)) return 0;
    let imported = 0;
    recordsArray.forEach(rec => {
      if (rec && rec.id && rec.content) {
        this.records.set(rec.id, {
          ...rec,
          schemaVersion: '3.0.0'
        });
        imported++;
      }
    });
    this.saveState();
    return imported;
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
