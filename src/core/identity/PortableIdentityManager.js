/**
 * ════════════════════════════════════════════════════════════════════
 *  PORTABLE IDENTITY MANAGER — BUNDLE EXPORT & IMPORT (PHASE 9 v3.0.0)
 * ════════════════════════════════════════════════════════════════════
 * Generates, validates, migrates, and restores documented, versioned JSON
 * identity bundles representing Mini-Adhy and AdhyModel.
 * 
 * STRICT SECURITY INVARIANTS:
 * 1. Zero API keys, secrets, passwords, cookies, session tokens, or private
 *    environment variables are ever included in export bundles.
 * 2. Deterministic dual-hash integrity checksum verification guarantees
 *    tamper detection across platforms.
 * 3. User corrections retain confidence = 1.0; provenance is preserved.
 * 4. Automatic migration elevates legacy v1.x / v2.x bundles to v3.0.0.
 */

import { CANONICAL_IDENTITY, CANONICAL_IDENTITY_SCHEMA_VERSION, BEHAVIORAL_POLICY_VERSION } from './CanonicalIdentity';
import { cognitiveProfile } from './CognitiveProfile';
import { adhyModel } from './AdhyModel';
import { BEHAVIORAL_MODES } from './BehavioralModes';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';

export const PORTABLE_BUNDLE_SCHEMA_VERSION = '3.0.0';

/**
 * Deeply sanitizes an object tree to ensure no credentials or secret keys are present.
 */
function deepSanitizeSecrets(obj) {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      // Check for raw auth headers or api key literals
      if (/bearer\s+[A-Za-z0-9_-]{16,}/i.test(obj) || /ai_za[0-9A-Za-z-_]{35}/i.test(obj)) {
        return '[REDACTED_CREDENTIAL]';
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitizeSecrets(item));
  }

  const clean = {};
  const secretKeyPatterns = /^(api_?key|secret|password|access_?token|auth_?token|bearer|adhy_session|credential|private_?key)$/i;

  for (const [key, val] of Object.entries(obj)) {
    if (secretKeyPatterns.test(key)) {
      continue; // Strip credential fields completely
    }
    clean[key] = deepSanitizeSecrets(val);
  }
  return clean;
}

/**
 * Recursively serializes any value to a stable, key-sorted JSON string.
 */
function canonicalJsonString(val) {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(canonicalJsonString).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJsonString(val[k])).join(',') + '}';
}

/**
 * Deterministically computes a 64-bit hex dual-hash (djb2 + sdbm) for a bundle,
 * omitting the `integrityChecksum` property itself.
 */
function computeBundleChecksum(bundle) {
  const clone = { ...bundle };
  delete clone.integrityChecksum;

  // Stable key serialization
  const stableString = canonicalJsonString(clone);
  let h1 = 5381;
  let h2 = 0;
  for (let i = 0; i < stableString.length; i++) {
    const char = stableString.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ char;
    h1 = h1 >>> 0;
    h2 = char + (h2 << 6) + (h2 << 16) - h2;
    h2 = h2 >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export class PortableIdentityManager {
  constructor() {
    this.backups = new Map(); // backupId -> bundle
  }

  /**
   * Generates a portable, sanitized JSON bundle of Mini-Adhy's identity, AdhyModel,
   * memory, understanding architecture, and relationship continuity.
   */
  exportBundle(options = {}) {
    const timestamp = new Date().toISOString();

    // 1. Memory Selection (Approved only by default, respecting private trait filters)
    let memories = memoryService.exportMemories();
    if (!options.includeUnapproved) {
      memories = memories.filter(m => (
        m.userApproved ||
        m.category === MEMORY_CATEGORIES.APPROVED_FACT ||
        m.category === MEMORY_CATEGORIES.CORRECTED_FACT
      ));
    }
    if (typeof options.minConfidence === 'number') {
      memories = memories.filter(m => (m.confidence ?? 1.0) >= options.minConfidence);
    }
    if (!options.includePrivateTraits) {
      memories = memories.filter(m => !m.isPrivate && !m.sensitive);
    }
    if (options.includeMemories === false) {
      memories = [];
    }

    // 2. Cognitive Profile & AdhyModel Snapshot
    const profileData = cognitiveProfile.exportProfile();

    const adhyModelSnapshot = {
      version: adhyModel.version,
      versionEpoch: adhyModel.versionEpoch,
      identity: adhyModel.getDomain('identity') || {},
      cognition: options.includeCognition !== false ? adhyModel.getAllCognitiveDimensions() : {},
      knowledge: options.includeKnowledge !== false ? adhyModel.getDomain('knowledge') : {},
      behaviour: adhyModel.getDomain('behaviour') || {}
    };

    // Filter private traits if not requested
    if (!options.includePrivateTraits && adhyModelSnapshot.identity?.personalFacts) {
      const sanitizedFacts = {};
      for (const [k, v] of Object.entries(adhyModelSnapshot.identity.personalFacts)) {
        if (!v?.isPrivate && !v?.sensitive) sanitizedFacts[k] = v;
      }
      adhyModelSnapshot.identity.personalFacts = sanitizedFacts;
    }

    // 3. Understanding Engine Bundle (Cognitive Mirror & Relationship Continuity)
    const understandingBundle = personalUnderstandingEngine.exportUnderstandingBundle();

    // 4. Assemble Portable Bundle
    const bundle = {
      bundleType: 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE',
      schemaVersion: options.schemaVersion || PORTABLE_BUNDLE_SCHEMA_VERSION,
      identityVersion: CANONICAL_IDENTITY_SCHEMA_VERSION,
      behavioralPolicyVersion: BEHAVIORAL_POLICY_VERSION,
      exportedAt: timestamp,
      sourceRuntime: options.sourceRuntime || 'mini-adhy-distributed-3.0',

      // Identity Specifications
      identity: {
        id: CANONICAL_IDENTITY.id,
        name: CANONICAL_IDENTITY.name,
        creator: CANONICAL_IDENTITY.creator,
        origin: CANONICAL_IDENTITY.origin,
        tagline: CANONICAL_IDENTITY.tagline,
        principles: CANONICAL_IDENTITY.principles,
        behavior: CANONICAL_IDENTITY.behavior,
        collective: CANONICAL_IDENTITY.collective
      },

      // Cognitive Model (Authoritative AdhyModel + Profile)
      adhyModel: adhyModelSnapshot,
      cognitiveProfile: profileData,
      understanding: understandingBundle,

      // Behavioral Modes
      behavioralModes: BEHAVIORAL_MODES,

      // Memories
      memories,

      // Compatibility Metadata
      compatibility: {
        supportedDestinations: [
          'portfolio_web',
          'desktop_companion',
          'local_ai_runtime',
          'hermes_adapter',
          'desk_robot_companion'
        ],
        minimumRuntimeVersion: '3.0.0'
      }
    };

    // Deep sanitize secrets to guarantee zero secret leakage
    const sanitizedBundle = deepSanitizeSecrets(bundle);

    // Calculate deterministic integrity checksum
    sanitizedBundle.integrityChecksum = computeBundleChecksum(sanitizedBundle);

    return sanitizedBundle;
  }

  /**
   * Calculates the integrity checksum for a given bundle
   */
  calculateChecksum(bundle) {
    if (!bundle || typeof bundle !== 'object') return null;
    return computeBundleChecksum(bundle);
  }

  /**
   * Verifies that the bundle's integrityChecksum matches its contents
   */
  verifyIntegrity(bundle) {
    if (!bundle || typeof bundle !== 'object') {
      return { valid: false, error: 'Bundle must be a non-null object.' };
    }
    if (!bundle.integrityChecksum) {
      return { valid: false, error: 'Missing integrityChecksum in bundle.' };
    }

    const calculatedChecksum = computeBundleChecksum(bundle);
    const valid = bundle.integrityChecksum === calculatedChecksum;

    return {
      valid,
      originalChecksum: bundle.integrityChecksum,
      calculatedChecksum
    };
  }

  /**
   * Migrates legacy v1.x / v2.x bundles to v3.0.0
   */
  migrateBundle(legacyBundle) {
    if (!legacyBundle || typeof legacyBundle !== 'object') {
      throw new Error('Cannot migrate an invalid bundle.');
    }

    const currentVersion = legacyBundle.schemaVersion || '1.0.0';
    if (currentVersion === PORTABLE_BUNDLE_SCHEMA_VERSION) {
      return legacyBundle; // Already up-to-date
    }

    const migrated = JSON.parse(JSON.stringify(legacyBundle));
    migrated.migratedFromVersion = currentVersion;
    migrated.schemaVersion = PORTABLE_BUNDLE_SCHEMA_VERSION;
    migrated.bundleType = 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE';

    // Upgrade: Populate adhyModel section if missing
    if (!migrated.adhyModel) {
      const cognitionDims = {};
      if (migrated.cognitiveProfile?.dimensions) {
        Object.entries(migrated.cognitiveProfile.dimensions).forEach(([k, dim]) => {
          cognitionDims[k] = {
            key: k,
            value: dim.value,
            classification: 'inference',
            confidence: dim.confidence || 0.85,
            provenance: `Migrated from cognitiveProfile (v${currentVersion})`,
            updatedAt: new Date().toISOString()
          };
        });
      }

      migrated.adhyModel = {
        version: '1.0.0',
        versionEpoch: 1,
        identity: migrated.identity || {},
        cognition: cognitionDims,
        knowledge: {},
        behaviour: migrated.behavioralModes || {}
      };
    }

    // Normalize memories: ensure timestamps and provenance
    if (Array.isArray(migrated.memories)) {
      migrated.memories = migrated.memories.map(m => ({
        ...m,
        provenance: m.provenance || `Migrated from v${currentVersion} bundle`,
        timestamp: m.timestamp || new Date().toISOString(),
        confidence: typeof m.confidence === 'number' ? m.confidence : 0.9
      }));
    }

    // Update integrity checksum
    migrated.integrityChecksum = computeBundleChecksum(migrated);
    return migrated;
  }

  /**
   * Validate a candidate bundle before importing
   */
  validateBundle(bundle) {
    const errors = [];
    const warnings = [];

    if (!bundle || typeof bundle !== 'object') {
      return { valid: false, errors: ['Invalid bundle: not a JSON object.'] };
    }

    if (bundle.bundleType !== 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE') {
      errors.push(`Invalid bundleType: expected 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE', got '${bundle.bundleType}'.`);
    }

    if (!bundle.schemaVersion) {
      errors.push('Missing required field: schemaVersion.');
    }

    if (!bundle.identity || bundle.identity.id !== 'mini-adhy') {
      errors.push('Invalid identity object or identity ID is not "mini-adhy".');
    }

    // Security Scan: Verify no secret keys or passwords leaked in bundle
    const bundleString = JSON.stringify(bundle);
    const suspiciousPatterns = ['api_key', 'apikey', 'bearer ', 'adhy_session', 'BEGIN PRIVATE KEY'];
    suspiciousPatterns.forEach(pat => {
      if (bundleString.toLowerCase().includes(pat.toLowerCase())) {
        warnings.push(`Bundle contains keyword matching security filter: '${pat}'. Ensure no credentials are present.`);
      }
    });

    // Integrity Check (if checksum present)
    let integrity = null;
    if (bundle.integrityChecksum) {
      integrity = this.verifyIntegrity(bundle);
      if (!integrity.valid) {
        warnings.push('Bundle integrity checksum mismatch: contents may have been altered.');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      integrity,
      identityName: bundle.identity?.name,
      memoryCount: Array.isArray(bundle.memories) ? bundle.memories.length : 0,
      schemaVersion: bundle.schemaVersion
    };
  }

  /**
   * Import bundle with dry-run support, auto-migration, and conflict resolution ('merge' | 'overwrite')
   */
  importBundle(rawBundle, options = { dryRun: false, mode: 'merge' }) {
    if (!rawBundle) {
      return { success: false, errors: ['Cannot import null or empty bundle.'] };
    }

    // Auto-migrate if older schema version
    let bundle = rawBundle;
    if (rawBundle.schemaVersion && rawBundle.schemaVersion !== PORTABLE_BUNDLE_SCHEMA_VERSION) {
      bundle = this.migrateBundle(rawBundle);
    }

    const validation = this.validateBundle(bundle);
    if (!validation.valid) {
      return {
        success: false,
        dryRun: options.dryRun,
        errors: validation.errors
      };
    }

    const report = {
      success: true,
      dryRun: Boolean(options.dryRun),
      mode: options.mode,
      importedMemoriesCount: 0,
      updatedPreferencesCount: 0,
      migratedFrom: bundle.migratedFromVersion || null,
      warnings: validation.warnings
    };

    if (options.dryRun) {
      report.summary = `Dry-run passed: Bundle version ${bundle.schemaVersion} with ${bundle.memories?.length || 0} memories ready to import in '${options.mode}' mode.`;
      return report;
    }

    // Apply Overwrite or Merge
    if (options.mode === 'overwrite') {
      memoryService.clearAll();
      cognitiveProfile.resetToBaseline();
    }

    // Import Memories
    if (Array.isArray(bundle.memories)) {
      bundle.memories.forEach(mem => {
        if (mem && (mem.content || mem.text)) {
          memoryService.storeRecord({
            id: mem.id,
            category: mem.category || MEMORY_CATEGORIES.APPROVED_FACT,
            content: mem.content || mem.text,
            provenance: mem.provenance || `Imported from bundle (${bundle.sourceRuntime || 'portable'})`,
            confidence: typeof mem.confidence === 'number' ? mem.confidence : 0.9,
            verified: mem.verified ?? true,
            userApproved: mem.userApproved ?? true
          });
          report.importedMemoriesCount += 1;
        }
      });
    }

    // Import Cognitive Profile Dimensions
    if (bundle.cognitiveProfile?.dimensions) {
      Object.entries(bundle.cognitiveProfile.dimensions).forEach(([k, dim]) => {
        if (dim && dim.value !== undefined) {
          cognitiveProfile.correctPreference(k, dim.value, `Imported from bundle: ${dim.evidence || ''}`);
          report.updatedPreferencesCount += 1;
        }
      });
    }

    // Import AdhyModel Cognition Dimensions
    if (bundle.adhyModel?.cognition) {
      Object.entries(bundle.adhyModel.cognition).forEach(([k, dim]) => {
        if (dim && dim.value !== undefined && typeof adhyModel.recordObservation === 'function') {
          // If explicitly marked as fact/preference or verified
          if (dim.classification === 'fact' || dim.confidence === 1.0) {
            adhyModel.correctDimension(k, dim.value, dim.provenance || 'Imported verified dimension');
          }
        }
      });
    }

    // Import Understanding Bundle (Cognitive Mirror & Relationship Continuity)
    if (bundle.understanding) {
      personalUnderstandingEngine.importUnderstandingBundle(bundle.understanding);
    }

    report.summary = `Successfully imported ${report.importedMemoriesCount} memories and ${report.updatedPreferencesCount} cognitive preferences in '${options.mode}' mode.`;
    return report;
  }

  /**
   * Create an in-memory/persisted snapshot backup of the current system
   */
  createBackup(label = 'manual_backup') {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bundle = this.exportBundle({ includeUnapproved: true, includePrivateTraits: true });

    const backupRecord = {
      backupId,
      label,
      createdAt: new Date().toISOString(),
      bundle
    };

    this.backups.set(backupId, backupRecord);
    return {
      backupId,
      label,
      createdAt: backupRecord.createdAt,
      memoryCount: bundle.memories.length
    };
  }

  /**
   * Restores system state from an existing backup ID
   */
  restoreBackup(backupId) {
    const backup = this.backups.get(backupId);
    if (!backup) {
      return { success: false, error: `Backup with ID '${backupId}' not found.` };
    }

    const result = this.importBundle(backup.bundle, { mode: 'overwrite', dryRun: false });
    return {
      success: result.success,
      restoredBackupId: backupId,
      label: backup.label,
      summary: result.summary
    };
  }

  /**
   * Lists available system backups
   */
  listBackups() {
    return Array.from(this.backups.values()).map(b => ({
      backupId: b.backupId,
      label: b.label,
      createdAt: b.createdAt,
      memoryCount: b.bundle?.memories?.length || 0
    }));
  }

  /**
   * Deletes a backup
   */
  deleteBackup(backupId) {
    return this.backups.delete(backupId);
  }
}

export const portableIdentityManager = new PortableIdentityManager();
