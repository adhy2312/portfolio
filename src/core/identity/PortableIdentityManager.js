/**
 * ════════════════════════════════════════════════════════════════════
 *  PORTABLE IDENTITY MANAGER — BUNDLE EXPORT & IMPORT
 * ════════════════════════════════════════════════════════════════════
 * Generates and validates documented, versioned JSON identity bundles.
 * 
 * STRICT SECURITY INVARIANT:
 * Zero API keys, secrets, passwords, cookies, session tokens, or private
 * environment variables are ever included in export bundles.
 */

import { CANONICAL_IDENTITY, CANONICAL_IDENTITY_SCHEMA_VERSION, BEHAVIORAL_POLICY_VERSION } from './CanonicalIdentity';
import { cognitiveProfile } from './CognitiveProfile';
import { BEHAVIORAL_MODES } from './BehavioralModes';
import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { personalUnderstandingEngine } from '../understanding/PersonalUnderstandingEngine';

export const PORTABLE_BUNDLE_SCHEMA_VERSION = '2.0.0';

export class PortableIdentityManager {
  /**
   * Generates a portable, sanitized JSON bundle of Mini-Adhy's identity, memory,
   * understanding architecture, and relationship continuity.
   */
  exportBundle(options = {}) {
    const timestamp = new Date().toISOString();
    
    // 1. Approved Memory Only (Excludes sensitive or temporary unapproved working context)
    const approvedMemories = memoryService.exportMemories().filter(m => {
      if (options.includeUnapproved) return true;
      return m.userApproved || m.category === MEMORY_CATEGORIES.APPROVED_FACT || m.category === MEMORY_CATEGORIES.CORRECTED_FACT;
    });

    // 2. Cognitive Profile Snapshot
    const profileData = cognitiveProfile.exportProfile();

    // 3. Understanding Engine Bundle (Cognitive Mirror & Relationship Continuity)
    const understandingBundle = personalUnderstandingEngine.exportUnderstandingBundle();

    // 4. Assemble Non-Secret Portable Bundle
    const bundle = {
      bundleType: 'MINI_ADHY_PORTABLE_IDENTITY_BUNDLE',
      schemaVersion: options.schemaVersion || PORTABLE_BUNDLE_SCHEMA_VERSION,
      identityVersion: CANONICAL_IDENTITY_SCHEMA_VERSION,
      behavioralPolicyVersion: BEHAVIORAL_POLICY_VERSION,
      exportedAt: timestamp,
      sourceRuntime: options.sourceRuntime || 'antigravity-web-3.0',
      
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

      // Cognitive Preferences & Mirror
      cognitiveProfile: profileData,
      understanding: understandingBundle,

      // Behavioral Modes
      behavioralModes: BEHAVIORAL_MODES,

      // Approved Continuous Memory
      memories: approvedMemories,

      // Compatibility Metadata (Ready for future desktop mini-robot companion)
      compatibility: {
        supportedDestinations: [
          'portfolio_web',
          'desktop_companion',
          'local_ai_runtime',
          'hermes_adapter',
          'desk_robot_companion'
        ],
        minimumRuntimeVersion: '2.0.0'
      }
    };

    // Calculate simple integrity checksum
    const rawString = JSON.stringify(bundle);
    let checksum = 0;
    for (let i = 0; i < rawString.length; i++) {
      checksum = ((checksum << 5) - checksum) + rawString.charCodeAt(i);
      checksum |= 0;
    }
    bundle.integrityChecksum = Math.abs(checksum).toString(16);

    return bundle;
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

    // Security Scan: Verify no secret keys or passwords accidentally leaked in bundle
    const bundleString = JSON.stringify(bundle);
    const suspiciousPatterns = ['api_key', 'apikey', 'secret', 'password', 'bearer ', 'adhy_session'];
    suspiciousPatterns.forEach(pat => {
      if (bundleString.toLowerCase().includes(pat)) {
        // Check if it's merely a key name in metadata or actual token
        warnings.push(`Bundle contains keyword matching security filter: '${pat}'. Ensure no credentials are present.`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      identityName: bundle.identity?.name,
      memoryCount: Array.isArray(bundle.memories) ? bundle.memories.length : 0,
      schemaVersion: bundle.schemaVersion
    };
  }

  /**
   * Import bundle with dry-run support, conflict resolution ('merge' | 'overwrite')
   */
  importBundle(bundle, options = { dryRun: false, mode: 'merge' }) {
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
        if (mem && mem.content) {
          memoryService.storeRecord({
            id: mem.id,
            category: mem.category,
            content: mem.content,
            provenance: `Imported from bundle (${bundle.sourceRuntime || 'portable'})`,
            confidence: mem.confidence || 0.9,
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

    // Import Understanding Bundle (Cognitive Mirror & Relationship Continuity)
    if (bundle.understanding) {
      personalUnderstandingEngine.importUnderstandingBundle(bundle.understanding);
    }

    report.summary = `Successfully imported ${report.importedMemoriesCount} memories and ${report.updatedPreferencesCount} cognitive preferences in '${options.mode}' mode.`;
    return report;
  }
}

export const portableIdentityManager = new PortableIdentityManager();

