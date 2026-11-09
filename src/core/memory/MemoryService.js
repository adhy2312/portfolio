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
      sensitivity: (sensitivity === 'private' || sensitivity === 'restricted' || String(sensitivity).toLowerCase() === 'high') ? 'private' : 'public',
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

  importMemories(recordsArray = [], options = {}) {
    if (!Array.isArray(recordsArray)) {
      return { imported: 0, rejected: 0, quarantined: 0, errors: ['Input must be an array'] };
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
        importedAt: new Date().toISOString(),
        schemaVersion: '3.0.0',
        // Preserve valid provenance fields but sanitize trust
        confidence: typeof rec.confidence === 'number' ? Math.min(1, Math.max(0, rec.confidence)) : 0.5
      });
    }

    // Transactional: validate entire batch before committing
    for (const rec of batch) {
      if (this.records.has(rec.id)) {
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

  // ── Memory Approval Workflow ────────────────────────────────────────

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
