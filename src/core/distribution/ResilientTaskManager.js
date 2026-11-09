/**
 * ════════════════════════════════════════════════════════════════════
 *  RESILIENT TASK MANAGER — RECOVERY & IDEMPOTENCY (PHASE 9)
 * ════════════════════════════════════════════════════════════════════
 * Ensures robust recovery from provider outages, network disconnects,
 * and partial failures by maintaining:
 * • Checkpoint-based step persistence
 * • Cryptographic / unique idempotency tokens to prevent duplicate side effects
 * • Resilient recovery lifecycle from last verified checkpoint
 */

export class ResilientTaskManager {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_task_checkpoints_v1';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.checkpoints = new Map(); // taskId -> checkpointRecord
    this.idempotencyTokens = new Map(); // token -> executionResult
    this.maxCheckpoints = 100;
    this.loadState();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); },
      remove: (k) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.removeItem(k); }
    };
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(cp => this.checkpoints.set(cp.taskId, cp));
        }
      }
    } catch {
      this.checkpoints = new Map();
    }
  }

  saveState() {
    try {
      const arr = Array.from(this.checkpoints.values()).slice(0, this.maxCheckpoints);
      this.storageAdapter.set(this.storageKey, JSON.stringify(arr));
    } catch {
      // Quota exceeded
    }
  }

  initTask(taskId, metadata = {}) {
    const record = {
      taskId,
      metadata,
      status: 'INITIALIZED',
      createdAt: new Date().toISOString(),
      lastCompletedStep: 0,
      stepIndex: 0,
      checkpointData: {}
    };
    this.checkpoints.set(taskId, record);
    this.saveState();
    return record;
  }

  /**
   * Saves task state at a verified checkpoint
   */
  saveCheckpoint(taskId, stepIndex, state = {}, intermediateResults = []) {
    const existing = this.checkpoints.get(taskId) || {};
    const checkpoint = {
      ...existing,
      taskId,
      stepIndex,
      lastCompletedStep: stepIndex,
      timestamp: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state)),
      checkpointData: JSON.parse(JSON.stringify(state)),
      intermediateResults: Array.isArray(intermediateResults) ? [...intermediateResults] : [intermediateResults],
      status: 'IN_PROGRESS'
    };

    this.checkpoints.set(taskId, checkpoint);
    this.saveState();
    return checkpoint;
  }

  recordCheckpoint(taskId, stepIndex, data = {}) {
    return this.saveCheckpoint(taskId, stepIndex, data);
  }

  getCheckpoint(taskId) {
    return this.checkpoints.get(taskId) || null;
  }

  /**
   * Executes an operation with idempotency protection.
   * If token was already successfully executed, returns cached result without re-executing.
   */
  async executeIdempotent(idempotencyToken, operationFn) {
    if (!idempotencyToken) {
      throw new Error('Idempotency token is required for consequential operations.');
    }

    if (this.idempotencyTokens.has(idempotencyToken)) {
      const cached = this.idempotencyTokens.get(idempotencyToken);
      return {
        ...cached,
        isDuplicate: true,
        idempotentReplay: true,
        message: 'Returned cached outcome; prevented duplicate execution.'
      };
    }

    const result = await operationFn();

    const record = {
      executedAt: new Date().toISOString(),
      idempotencyToken,
      result,
      data: result,
      isDuplicate: false,
      success: true
    };

    this.idempotencyTokens.set(idempotencyToken, record);
    return record;
  }

  /**
   * Recovers an interrupted task from its last recorded checkpoint
   */
  recoverTask(taskId) {
    const cp = this.getCheckpoint(taskId);
    if (!cp) {
      return {
        recoverable: false,
        canResume: false,
        error: `No checkpoint found for task '${taskId}'.`
      };
    }

    return {
      recoverable: true,
      canResume: true,
      taskId: cp.taskId,
      lastCompletedStep: cp.lastCompletedStep || cp.stepIndex || 0,
      checkpointData: cp.checkpointData || cp.state || {},
      resumeStepIndex: (cp.stepIndex || 0) + 1,
      restoredState: cp.state || cp.checkpointData || {},
      intermediateResults: cp.intermediateResults || [],
      checkpointAgeMs: Date.now() - new Date(cp.timestamp || Date.now()).getTime(),
      status: cp.status
    };
  }

  completeTask(taskId, finalResult = {}) {
    const cp = this.checkpoints.get(taskId);
    if (cp) {
      cp.status = 'COMPLETED';
      cp.finalResult = finalResult;
      cp.completedAt = new Date().toISOString();
      this.saveState();
    }
    return cp;
  }

  clearTask(taskId) {
    this.checkpoints.delete(taskId);
    this.saveState();
  }
}

export const resilientTaskManager = new ResilientTaskManager();
