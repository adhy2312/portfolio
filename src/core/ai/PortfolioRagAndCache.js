/**
 * PortfolioRagAndCache — Lightweight Client-Side RAG + LRU Response Cache
 * ════════════════════════════════════════════════════════════════════════
 * Zero external dependencies. Indexes Sanity CMS documents for fast
 * top-K retrieval and caches common portfolio queries in memory + sessionStorage.
 */

const CACHE_STORAGE_KEY = 'mini_adhy_lru_cache_v1';
const MAX_CACHE_ENTRIES = 25;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'of', 'to', 'in', 'for',
  'with', 'about', 'what', 'how', 'who', 'tell', 'me', 'show', 'can', 'you',
  'your', 'adhithya', 'are', 'do', 'does', 'has', 'have', 'this', 'that'
]);

export function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

export class PortfolioRagIndex {
  constructor() {
    this.docs = [];
  }

  /**
   * Index Sanity collections into searchable chunks.
   */
  indexSanityData({ knowledge = [], skills = [], experiences = [], projects = [], achievements = [], milestones = [] } = {}) {
    const docs = [];

    knowledge.forEach(k => {
      const text = `${k.category || ''} ${k.title || ''}: ${k.content || ''}`.trim();
      if (text) docs.push({ type: 'knowledge', title: k.title || k.category, text, tokens: new Set(tokenize(text)) });
    });

    skills.forEach(s => {
      const list = (s.skills || []).join(', ');
      const text = `Skill Category ${s.title || ''}: ${list}`.trim();
      if (text) docs.push({ type: 'skill', title: s.title, text, tokens: new Set(tokenize(text)) });
    });

    experiences.forEach(e => {
      const text = `Experience ${e.role || ''} at ${e.company || ''} (${e.duration || ''}): ${e.description || ''}`.trim();
      if (text) docs.push({ type: 'experience', title: `${e.role} @ ${e.company}`, text, tokens: new Set(tokenize(text)) });
    });

    projects.forEach(p => {
      const tags = (p.tags || []).join(', ');
      const text = `Project ${p.title || ''} [${p.category || ''}] (${tags}): ${p.description || ''}`.trim();
      if (text) docs.push({ type: 'project', title: p.title, text, tokens: new Set(tokenize(text)) });
    });

    achievements.forEach(a => {
      const text = `Achievement ${a.title || ''}: ${a.subtitle || ''}`.trim();
      if (text) docs.push({ type: 'achievement', title: a.title, text, tokens: new Set(tokenize(text)) });
    });

    milestones.forEach(m => {
      const text = `Milestone (${m.date || ''}) ${m.title || ''}: ${m.description || ''}`.trim();
      if (text) docs.push({ type: 'milestone', title: m.title, text, tokens: new Set(tokenize(text)) });
    });

    this.docs = docs;
    return docs.length;
  }

  /**
   * Retrieve top-K most relevant documents for a user query.
   */
  search(query = '', topK = 3) {
    if (!this.docs.length) return [];
    const qTokens = tokenize(query);
    if (!qTokens.length) return [];

    const scored = [];
    for (const doc of this.docs) {
      let score = 0;
      for (const qt of qTokens) {
        if (doc.tokens.has(qt)) score += 2;
        else {
          for (const dt of doc.tokens) {
            if (dt.includes(qt) || qt.includes(dt)) {
              score += 0.75;
              break;
            }
          }
        }
      }
      if (score > 0) scored.push({ doc, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.doc);
  }
}

export class ResponseLRUCache {
  constructor(maxEntries = MAX_CACHE_ENTRIES, ttlMs = CACHE_TTL_MS) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.map = new Map();
    this._hydrate();
  }

  _hydrate() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const raw = JSON.parse(sessionStorage.getItem(CACHE_STORAGE_KEY) || '[]');
      const now = Date.now();
      for (const [k, v] of raw) {
        if (v && now - v.ts < this.ttlMs) {
          this.map.set(k, v);
        }
      }
    } catch {}
  }

  _persist() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify([...this.map.entries()]));
    } catch {}
  }

  makeKey(query = '', mode = 'normal') {
    return `${mode}::${String(query).toLowerCase().trim().replace(/\s+/g, ' ')}`;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts >= this.ttlMs) {
      this.map.delete(key);
      this._persist();
      return null;
    }
    // Refresh LRU recency
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (!key || !value) return;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, ts: Date.now() });
    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this._persist();
  }
}

export const portfolioRagIndex = new PortfolioRagIndex();
export const responseLRUCache = new ResponseLRUCache();

