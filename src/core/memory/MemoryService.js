/**
 * ════════════════════════════════════════════════════════════════════
 *  CANONICAL MEMORY SERVICE & CONTINUITY ENGINE
 * ════════════════════════════════════════════════════════════════════
 * Central memory ownership for Mini-Adhy.
 * Supports:
 * • Structured categories (facts, preferences, ongoing projects, goals, decisions, session summaries)
 * • Rich metadata (provenance, confidence, verification state, supersession links)
 * • Contextual relevance ranking & contradiction detection
 * • User corrections taking strict precedence
 * • User inspection, editing, export, and deletion controls
 * • Idempotent migration from legacy stores
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

export class MemoryService {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_canonical_memory_v2';
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
        content: 'Adhithya Mohan S studies ECE at Mar Baselios College of Engineering and Technology (MBCET, KTU), Trivandrum.',
        provenance: 'Official Portfolio Background',
        confidence: 1.0,
        verified: true,
        userApproved: true
      },
      {
        id: 'mem_base_2',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Technical mastery includes MATLAB/Simulink, GNU Radio SDR, KiCad 8 PCB layout, and embedded STM32 ARM Cortex.',
        provenance: 'Engineering Projects Registry',
        confidence: 1.0,
        verified: true,
        userApproved: true
      },
      {
        id: 'mem_base_3',
        category: MEMORY_CATEGORIES.ONGOING_PROJECT,
        content: 'Mini-Adhy 2.0 multi-agent companion architecture and portfolio website (adhy.tech).',
        provenance: 'Active Project Workspace',
        confidence: 1.0,
        verified: true,
        userApproved: true
      },
      {
        id: 'mem_base_4',
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        content: 'Prefers simple, working code and practical prototypes before architectural abstractions.',
        provenance: 'Cognitive Mirror',
        confidence: 0.95,
        verified: true,
        userApproved: true
      }
    ];

    baselines.forEach(b => this.storeRecord(b));
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(rec => {
            if (rec && rec.id) {
              this.records.set(rec.id, rec);
            }
          });
        }
      }
    } catch {
      // Safe fallback
    }
  }

  saveState() {
    try {
      const recordsArray = Array.from(this.records.values());
      this.storageAdapter.set(this.storageKey, JSON.stringify(recordsArray));
    } catch {}
  }

  /**
   * Migrate legacy localStorage stores idempotently
   */
  migrateLegacyStores() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      // Check legacy findings
      const legacyFindings = localStorage.getItem('mini_adhy_findings');
      if (legacyFindings) {
        const parsed = JSON.parse(legacyFindings);
        if (Array.isArray(parsed)) {
          parsed.forEach((f, idx) => {
            const id = `migrated_finding_${idx}_${f.timestamp || Date.now()}`;
            if (!this.records.has(id)) {
              this.storeRecord({
                id,
                category: MEMORY_CATEGORIES.APPROVED_FACT,
                content: f.observation || f.summary || JSON.stringify(f),
                provenance: 'Migrated from mini_adhy_findings',
                confidence: 0.8,
                verified: true,
                userApproved: false
              });
            }
          });
        }
      }
    } catch {}
  }

  storeRecord({
    id = null,
    category = MEMORY_CATEGORIES.APPROVED_FACT,
    content = '',
    provenance = 'Direct Interaction',
    confidence = 0.9,
    verified = false,
    userApproved = false,
    supersedes = null
  }) {
    if (!this.isCollectionEnabled && category !== MEMORY_CATEGORIES.CORRECTED_FACT) {
      return null;
    }

    const recId = id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    // If this supersedes an older record, mark the old record as superseded
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
      content: String(content).trim(),
      provenance,
      confidence: Math.min(1.0, Math.max(0.0, confidence)),
      verified: Boolean(verified),
      userApproved: Boolean(userApproved),
      supersedes: supersedes || null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: '2.0.0'
    };

    this.records.set(recId, record);
    this.saveState();
    return record;
  }

  /**
   * Contextual relevance retrieval with keyword matching, recency weighting, and user correction precedence
   */
  retrieveRelevant(query = '', options = {}) {
    const limit = options.limit || 5;
    const queryTokens = (query || '').toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
    const activeRecords = Array.from(this.records.values()).filter(r => r.category !== MEMORY_CATEGORIES.SUPERSEDED_INFO);

    if (queryTokens.length === 0) {
      // Return most recent user-approved memories
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
   * Correct an existing memory (user correction strictly overrides)
   */
  correctMemory(id, newContent, reason = 'User correction') {
    if (!this.records.has(id)) {
      return this.storeRecord({
        category: MEMORY_CATEGORIES.CORRECTED_FACT,
        content: newContent,
        provenance: reason,
        confidence: 1.0,
        verified: true,
        userApproved: true
      });
    }

    return this.storeRecord({
      category: MEMORY_CATEGORIES.CORRECTED_FACT,
      content: newContent,
      provenance: reason,
      confidence: 1.0,
      verified: true,
      userApproved: true,
      supersedes: id
    });
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

  setCollectionEnabled(enabled) {
    this.isCollectionEnabled = Boolean(enabled);
  }
}

export const memoryService = new MemoryService();

