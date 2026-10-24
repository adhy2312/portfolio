/**
 * BaseAgent — High-Performance Modern ES2024 Autonomous Agent Template
 * 
 * Provides:
 * - Abstract lifecycle: initialize -> preExecute -> execute -> postExecute -> onError
 * - High-resolution performance telemetry via performance.now()
 * - Bounded execution timeouts via AbortSignal & AbortController
 * - Deduplication cache with TTL to eliminate redundant compute
 * - Structured message generation conforming to Mini-Adhy Ecosystem Schema
 * - Permission verification via PermissionRegistry
 * - Event bus telemetry dispatching
 */

import { CAPABILITY_LEVELS, TASK_STATUS, createAgentMessage } from './AgentTypes';
import { permissionRegistry } from './PermissionRegistry';

export class BaseAgent {
  #id;
  #name;
  #role;
  #category;
  #permissionLevel;
  #cache = new Map();
  #cacheTTLMs = 60000; // 1-minute deduplication window
  #status = TASK_STATUS.PENDING;
  #lastExecutionTime = 0;
  #executionDurationMs = 0;
  #runCount = 0;
  #errorCount = 0;

  /**
   * @param {Object} config
   * @param {string} config.id - Identifier from AGENT_IDS
   * @param {string} config.name - Display name (e.g., 'FRIDAY')
   * @param {string} config.role - Specialist responsibility
   * @param {string} config.category - Domain category
   * @param {string} [config.permissionLevel] - Required capability level
   * @param {number} [config.cacheTTLMs] - Cache retention
   */
  constructor(config) {
    if (new.target === BaseAgent) {
      throw new TypeError('BaseAgent is an abstract class and cannot be instantiated directly.');
    }
    this.#id = config.id;
    this.#name = config.name;
    this.#role = config.role;
    this.#category = config.category || 'Specialist';
    this.#permissionLevel = config.permissionLevel || CAPABILITY_LEVELS.READ;
    if (config.cacheTTLMs) this.#cacheTTLMs = config.cacheTTLMs;
  }

  // Getters
  get id() { return this.#id; }
  get name() { return this.#name; }
  get role() { return this.#role; }
  get category() { return this.#category; }
  get permissionLevel() { return this.#permissionLevel; }
  get status() { return this.#status; }
  get lastExecutionTime() { return this.#lastExecutionTime; }
  get executionDurationMs() { return this.#executionDurationMs; }
  get runCount() { return this.#runCount; }
  get errorCount() { return this.#errorCount; }

  /**
   * Verifies required permissions before executing a requested action
   * @param {string} action
   * @param {string} [requiredLevel]
   */
  verifyPermission(action, requiredLevel = this.#permissionLevel) {
    return permissionRegistry.authorize(this.#id, action, requiredLevel);
  }

  /**
   * Template Method: Standardized, high-performance execution pipeline
   * @param {Object} [params]
   * @param {number} [timeoutMs=8000] - Hard execution cutoff
   * @returns {Promise<Object>} Formatted Agent Message
   */
  async run(params = {}, timeoutMs = 8000) {
    const cacheKey = JSON.stringify(params);
    const cached = this.#cache.get(cacheKey);
    const now = Date.now();

    // Deduplication check
    if (cached && (now - cached.timestamp < this.#cacheTTLMs)) {
      return {
        ...cached.result,
        isCached: true,
        cachedAgeMs: now - cached.timestamp
      };
    }

    this.#status = TASK_STATUS.RUNNING;
    this.#runCount++;
    const startTime = (typeof performance !== 'undefined' && performance.now) 
      ? performance.now() 
      : Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // 1. Pre-execution Hook
      await this.preExecute(params);

      // 2. Core Execution with signal
      const rawResult = await Promise.race([
        this.execute(params, controller.signal),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => 
            reject(new Error(`[${this.#name}] Execution timed out after ${timeoutMs}ms`))
          );
        })
      ]);

      // 3. Post-execution Hook
      const processedResult = await this.postExecute(rawResult);

      const endTime = (typeof performance !== 'undefined' && performance.now) 
        ? performance.now() 
        : Date.now();
      this.#executionDurationMs = Math.round((endTime - startTime) * 100) / 100;
      this.#lastExecutionTime = Date.now();
      this.#status = TASK_STATUS.COMPLETED;

      // Wrap in strict ecosystem message schema
      const message = createAgentMessage({
        agent: this.#id,
        eventType: processedResult.eventType || 'status_report',
        severity: processedResult.severity || 'low',
        summary: processedResult.summary || `${this.#name} completed routine inspection.`,
        evidence: [
          ...(processedResult.evidence || []),
          { metric: 'execution_duration_ms', value: this.#executionDurationMs }
        ],
        sources: processedResult.sources || ['runtime://in-process'],
        confidence: typeof processedResult.confidence === 'number' ? processedResult.confidence : 0.95,
        recommendedAction: processedResult.recommendedAction || 'No remediation required.',
        requiresApproval: !!processedResult.requiresApproval,
        status: this.#status
      });

      // Cache result
      this.#cache.set(cacheKey, { timestamp: now, result: message });
      return message;

    } catch (err) {
      this.#errorCount++;
      this.#status = TASK_STATUS.FAILED;
      await this.onError(err, params);

      return createAgentMessage({
        agent: this.#id,
        eventType: 'execution_error',
        severity: 'high',
        summary: `[${this.#name}] Execution failure: ${err.message}`,
        evidence: [{ error: err.message, stack: err.stack ? err.stack.slice(0, 300) : null }],
        sources: ['runtime://error-boundary'],
        confidence: 0.1,
        recommendedAction: 'Inspect agent telemetry and retry bounded execution.',
        requiresApproval: false,
        status: TASK_STATUS.FAILED
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Lifecycle Hooks to override in subclasses
   */
  async preExecute(params) {
    // Optional hook before execution
  }

  /**
   * Abstract method: Subclasses MUST implement core logic
   * @abstract
   */
  async execute(params, signal) {
    throw new Error(`execute() must be implemented by subclass [${this.constructor.name}]`);
  }

  async postExecute(result) {
    // Optional transformation hook
    return result;
  }

  async onError(error, params) {
    console.error(`[Mini-Adhy:${this.#name}] Error:`, error);
  }

  /**
   * Clear deduplication cache
   */
  clearCache() {
    this.#cache.clear();
  }

  /**
   * Export telemetry snapshot
   */
  getTelemetry() {
    return {
      id: this.#id,
      name: this.#name,
      role: this.#role,
      category: this.#category,
      status: this.#status,
      runCount: this.#runCount,
      errorCount: this.#errorCount,
      lastExecutionTime: this.#lastExecutionTime,
      executionDurationMs: this.#executionDurationMs
    };
  }
}
