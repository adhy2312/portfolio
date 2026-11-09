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

export const DATA_CLASSIFICATION = Object.freeze({
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  PERSONAL: 'PERSONAL',
  SENSITIVE: 'SENSITIVE',
  SECRET: 'SECRET'
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
   * Classifies data according to 5-level security taxonomy
   */
  classifyData(payload = {}) {
    const raw = JSON.stringify(payload || {}).toLowerCase();
    
    // 1. SECRET: credentials, private keys, auth tokens, passwords
    if (
      /(api_?key|password|passwd|bearer\s+[a-z0-9]|private_?key|adhy_session|session_secret)/i.test(raw) ||
      /(?:sk-[a-zA-Z0-9_-]{20,}|aiza[0-9a-za-z-_]{35}|gsk_[a-zA-Z0-9]{20,})/i.test(raw)
    ) {
      return DATA_CLASSIFICATION.SECRET;
    }

    // 2. SENSITIVE: raw biosignals, biometric waveforms, health readings
    if (/(raw.*(eeg|ecg|ppg|bio|signal)|biosignal|electrode|microvolt)/i.test(raw)) {
      return DATA_CLASSIFICATION.SENSITIVE;
    }

    // 3. PERSONAL: user personal facts, private diary, relationship continuity
    if (payload.isPrivate || payload.isPersonal || /personal_fact|relationship_anchor/i.test(raw)) {
      return DATA_CLASSIFICATION.PERSONAL;
    }

    // 4. INTERNAL: system telemetry, agent communication, routing metrics
    if (payload.isInternal || /telemetry|metrics|heartbeat|agent_bus/i.test(raw)) {
      return DATA_CLASSIFICATION.INTERNAL;
    }

    // 5. PUBLIC: tutorials, DSP guides, documentation, portfolio pages
    return DATA_CLASSIFICATION.PUBLIC;
  }

  /**
   * Deep recursive sanitization of payloads before cloud transmission:
   * 1. Recursively traverses nested objects and arrays
   * 2. Completely strips sensitive key identifiers
   * 3. Uses regular expressions to redact API keys, tokens, and passwords inside strings
   */
  sanitizeForCloud(payload = {}) {
    if (payload === null || payload === undefined) {
      return payload;
    }

    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/(?:sk-[a-zA-Z0-9_-]{20,}|AIza[0-9A-Za-z-_]{35}|gsk_[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[0-9a-zA-Z-]{10,})/g, '[REDACTED_API_KEY]')
        .replace(/Bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]')
        .replace(/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
        .replace(/(?:password|passwd|secret)\s*[:=]\s*["']?([^"'\s,]+)["']?/gi, 'password: "[REDACTED]"');
    };

    const recursiveSanitize = (node) => {
      if (node === null || node === undefined) return node;

      if (typeof node === 'string') {
        return sanitizeString(node);
      }

      if (Array.isArray(node)) {
        return node.map(item => recursiveSanitize(item));
      }

      if (typeof node === 'object') {
        const sensitiveKeyPattern = /(raw.*(eeg|ecg|ppg|bio|signal)|api_?key|secret|password|bearer|credential|auth_?token|access_?token|refresh_?token|private_?key)/i;
        const clean = {};
        for (const [k, v] of Object.entries(node)) {
          if (sensitiveKeyPattern.test(k)) {
            continue; // Completely redact/strip sensitive key
          }
          clean[k] = recursiveSanitize(v);
        }
        return clean;
      }

      return node;
    };

    return recursiveSanitize(payload);
  }
}

export const hybridExecutionManager = new HybridExecutionManager();
