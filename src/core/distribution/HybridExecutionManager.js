/**
 * ════════════════════════════════════════════════════════════════════
 *  HYBRID EXECUTION MANAGER — LOCAL VS CLOUD ROUTING & PRIVACY (PHASE 9)
 * ════════════════════════════════════════════════════════════════════
 * Governs the hybrid execution boundary between local and cloud infrastructure:
 * • Local: sensitive context processing, local memory, sandboxed code, small models
 * • Cloud: advanced reasoning, larger models, approved external research
 * 
 * STRICT PRIVACY INVARIANTS:
 * 1. Data Minimization: Credentials, secrets, and raw biosignals are NEVER
 *    transmitted to cloud providers.
 * 2. Privacy Mode Enforcement: When user sets STRICT_LOCAL, all cloud routing
 *    is strictly blocked.
 */

export const PRIVACY_MODES = Object.freeze({
  STRICT_LOCAL: 'STRICT_LOCAL',         // Zero external cloud calls permitted
  HYBRID_PROTECTED: 'HYBRID_PROTECTED', // Sensitive local, general reasoning cloud
  CLOUD_PERMISSIVE: 'CLOUD_PERMISSIVE'  // Cloud allowed for all non-credential tasks
});

export const EXECUTION_TIERS = Object.freeze({
  LOCAL: 'LOCAL',
  CLOUD: 'CLOUD'
});

export class HybridExecutionManager {
  constructor(options = {}) {
    this.privacyMode = options.privacyMode || PRIVACY_MODES.HYBRID_PROTECTED;
    this.hasLocalModel = options.hasLocalModel !== undefined ? options.hasLocalModel : false;
  }

  setPrivacyMode(mode) {
    if (Object.values(PRIVACY_MODES).includes(mode)) {
      this.privacyMode = mode;
    }
  }

  /**
   * Evaluates task and context to determine whether execution must be LOCAL or CLOUD
   */
  resolveExecutionTier(taskOrOptions = {}, maybeContext = {}) {
    const task = taskOrOptions || {};
    const context = maybeContext && Object.keys(maybeContext).length > 0
      ? maybeContext
      : (task.context || {});

    const hasRawBiosignals = Boolean(
      task.hasRawBiosignals ||
      context.hasRawBiosignals ||
      task.rawEegSamples ||
      context.rawEegSamples
    );

    const isSensitive = Boolean(
      hasRawBiosignals ||
      context.isPrivate ||
      context.isSensitive ||
      context.containsSecrets ||
      task.isPrivate ||
      task.isSensitive
    );

    // Rule 1: STRICT_LOCAL mandates local tier for everything
    if (this.privacyMode === PRIVACY_MODES.STRICT_LOCAL) {
      return {
        tier: EXECUTION_TIERS.LOCAL,
        reason: 'User privacy policy is set to STRICT_LOCAL. Cloud access prohibited.',
        allowedToCallCloud: false,
        allowedOnCloud: false
      };
    }

    // Rule 2: Sensitive context, credentials, or raw biosignals MUST stay LOCAL
    if (isSensitive) {
      return {
        tier: EXECUTION_TIERS.LOCAL,
        reason: 'Task involves sensitive user context, credentials, or biosignals. Confined to local processing.',
        allowedToCallCloud: false,
        allowedOnCloud: false
      };
    }

    // Rule 3: Complex multi-step reasoning, external search, or large generation routes to CLOUD
    const requiresAdvancedReasoning = Boolean(
      task.requiresDeepReasoning ||
      task.complexity === 'LEVEL_3_COMPLEX' ||
      task.requiresVision
    );

    if (requiresAdvancedReasoning) {
      return {
        tier: EXECUTION_TIERS.CLOUD,
        reason: 'Task requires advanced multi-modal or deep reasoning model.',
        allowedToCallCloud: true,
        allowedOnCloud: true
      };
    }

    // Default: route to LOCAL if local model present, else CLOUD
    const allowed = !this.hasLocalModel;
    return {
      tier: this.hasLocalModel ? EXECUTION_TIERS.LOCAL : EXECUTION_TIERS.CLOUD,
      reason: this.hasLocalModel ? 'Handled by local lightweight runtime.' : 'Standard general reasoning via cloud provider.',
      allowedToCallCloud: allowed,
      allowedOnCloud: allowed
    };
  }

  determineExecutionTier(taskOrOptions, maybeContext) {
    return this.resolveExecutionTier(taskOrOptions, maybeContext);
  }

  canExecuteOnCloud(task = {}, context = {}) {
    const resolution = this.resolveExecutionTier(task, context);
    return {
      allowed: resolution.allowedToCallCloud,
      tier: resolution.tier,
      reason: resolution.reason
    };
  }

  /**
   * Sanitizes payload before cloud transmission (strips raw biosignals, credentials, and sensitive artifacts)
   */
  sanitizeForCloud(payload = {}) {
    if (payload === null || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = JSON.parse(JSON.stringify(payload));
    const sensitiveKeyPattern = /(raw.*(eeg|ecg|ppg|bio|signal)|api_?key|secret|password|bearer|credential|auth_?token)/i;

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeyPattern.test(key)) {
        delete sanitized[key];
      }
    }

    return sanitized;
  }
}

export const hybridExecutionManager = new HybridExecutionManager();
