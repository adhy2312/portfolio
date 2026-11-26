/**
 * Canonical Digital Echoes Store
 * Single source of truth for reading/updating `adhy_digital_echoes` in localStorage.
 * Guarantees schema normalization so partial writes from any subsystem never leave
 * `sectionHeatmap` or `markovMatrix` undefined.
 */

const STORAGE_KEY = 'adhy_digital_echoes';

export function createDefaultEchoes() {
  return {
    sectionHeatmap: {},
    markovMatrix: {},
    totalVisits: 0,
    lastDecayTime: Date.now(),
    persona: 'Wanderer',
    memoryImportance: 1.0,
  };
}

export function normalizeEchoes(raw) {
  const defaults = createDefaultEchoes();
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const normalized = { ...defaults, ...base };

  if (!normalized.sectionHeatmap || typeof normalized.sectionHeatmap !== 'object' || Array.isArray(normalized.sectionHeatmap)) {
    normalized.sectionHeatmap = {};
  }
  if (!normalized.markovMatrix || typeof normalized.markovMatrix !== 'object' || Array.isArray(normalized.markovMatrix)) {
    normalized.markovMatrix = {};
  }
  if (!Number.isFinite(normalized.lastDecayTime)) {
    normalized.lastDecayTime = Date.now();
  }
  if (!Number.isFinite(normalized.totalVisits)) {
    normalized.totalVisits = 0;
  }

  return normalized;
}

export function readEchoes() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeEchoes(raw);
  } catch {
    return createDefaultEchoes();
  }
}

export function writeEchoes(next) {
  const normalized = normalizeEchoes(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {}
  return normalized;
}

export function updateEchoes(updater) {
  const current = readEchoes();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...(updater || {}) };
  return writeEchoes(next);
}

/**
 * Subscribe to cross-tab updates of `adhy_digital_echoes` via the browser `storage` event.
 * Returns an unsubscribe function.
 */
export function subscribeEchoes(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};
  const handler = (e) => {
    if (e.key !== STORAGE_KEY) return;
    callback(readEchoes());
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

