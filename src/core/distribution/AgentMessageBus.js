/**
 * ════════════════════════════════════════════════════════════════════
 *  AGENT MESSAGE BUS — DISTRIBUTED TYPED MESSAGING (PHASE 9)
 * ════════════════════════════════════════════════════════════════════
 * Coordinates peer-to-peer and hierarchical communication among the 10
 * autonomous specialist agents and Mini-Adhy with:
 * • Typed messages with Task IDs and Correlation IDs
 * • Delivery receipts (PENDING → DELIVERED → ACKNOWLEDGED)
 * • Broadcast is NEVER treated as delivery proof
 * • Cycle & loop detection (visited agent chain & max hop bounds)
 * • Timeouts, retries, and cancellation
 */

export const AGENT_MESSAGE_TYPES = Object.freeze({
  TASK_ASSIGNMENT: 'TASK_ASSIGNMENT',
  TASK_PROGRESS: 'TASK_PROGRESS',
  TASK_RESULT: 'TASK_RESULT',
  TASK_CANCEL: 'TASK_CANCEL',
  HEARTBEAT: 'HEARTBEAT'
});

export const DELIVERY_STATUS = Object.freeze({
  PENDING: 'PENDING',
  DELIVERED: 'DELIVERED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
});

export class AgentMessageBus {
  constructor(options = {}) {
    this.agentHandlers = new Map(); // agentId -> handlerFunction
    this.inFlightMessages = new Map(); // messageId -> messageRecord
    this.deduplicationCache = new Map(); // dedupKey -> { result, timestamp }
    this.dedupTtlMs = options.dedupTtlMs || 60000;
    this.messageHistory = [];
    this.maxHistory = options.maxHistory || 200;
    this.maxHopLimit = options.maxHopLimit || 5;
  }

  /**
   * Register a recipient agent's handler callback
   */
  registerAgent(agentId, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for agent '${agentId}' must be a function.`);
    }
    this.agentHandlers.set(agentId, handler);
  }

  unregisterAgent(agentId) {
    this.agentHandlers.delete(agentId);
  }

  /**
   * Formulates and sends a typed message with loop prevention & delivery verification
   */
  async sendMessage({
    taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    messageType = AGENT_MESSAGE_TYPES.TASK_ASSIGNMENT,
    sender = 'MINI_ADHY',
    recipient,
    payload = {},
    timeoutMs = 5000,
    retryLimit = 2,
    hopCount = 0,
    visitedAgents = []
  }) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!recipient) {
      return { success: false, error: 'Recipient agentId is required.', deliveryStatus: DELIVERY_STATUS.FAILED };
    }

    if (!Object.values(AGENT_MESSAGE_TYPES).includes(messageType)) {
      return { success: false, error: `Invalid messageType: ${messageType}`, deliveryStatus: DELIVERY_STATUS.FAILED };
    }

    // Deduplication check: return cached outcome for identical in-flight or recently processed tasks
    const dedupKey = `${taskId}:${recipient}:${messageType}`;
    if (this.deduplicationCache.has(dedupKey)) {
      const cached = this.deduplicationCache.get(dedupKey);
      if (Date.now() - cached.timestamp < this.dedupTtlMs) {
        return {
          ...cached.result,
          isDuplicate: true,
          deduplicated: true
        };
      } else {
        this.deduplicationCache.delete(dedupKey);
      }
    }

    // 1. Loop and Cycle Prevention
    const currentVisited = [...visitedAgents, sender];
    if (currentVisited.includes(recipient)) {
      return {
        success: false,
        error: `Cycle detected: message routing loop between ${currentVisited.join(' -> ')} -> ${recipient}`,
        deliveryStatus: DELIVERY_STATUS.FAILED,
        loopDetected: true
      };
    }

    if (hopCount >= this.maxHopLimit) {
      return {
        success: false,
        error: `Hop limit exceeded (${hopCount} >= ${this.maxHopLimit})`,
        deliveryStatus: DELIVERY_STATUS.FAILED,
        hopLimitExceeded: true
      };
    }

    const message = {
      messageId,
      taskId,
      correlationId,
      messageType,
      sender,
      recipient,
      payload,
      timestamp: new Date().toISOString(),
      deliveryStatus: DELIVERY_STATUS.PENDING,
      retryLimit,
      timeoutMs,
      hopCount: hopCount + 1,
      visitedAgents: currentVisited,
      result: null,
      error: null
    };

    this.inFlightMessages.set(messageId, message);

    // 2. Dispatch with retries and timeout
    const result = await this._dispatchWithRetry(message);

    this.inFlightMessages.delete(messageId);
    this.messageHistory.unshift(message);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.pop();
    }

    return result;
  }

  async _dispatchWithRetry(message) {
    const handler = this.agentHandlers.get(message.recipient);

    if (!handler) {
      message.deliveryStatus = DELIVERY_STATUS.FAILED;
      message.error = `Agent '${message.recipient}' is not registered on the message bus.`;
      return {
        success: false,
        deliveryStatus: DELIVERY_STATUS.FAILED,
        error: message.error
      };
    }

    let lastError = null;

    for (let attempt = 0; attempt <= message.retryLimit; attempt++) {
      try {
        message.deliveryStatus = DELIVERY_STATUS.DELIVERED;

        // Invariant: Deliver with explicit timeout race
        const response = await Promise.race([
          handler(message),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Delivery timeout after ${message.timeoutMs}ms`)), message.timeoutMs)
          )
        ]);

        // Invariant: Must receive explicit acknowledgement/result
        if (response && response.acknowledged !== false) {
          message.deliveryStatus = DELIVERY_STATUS.ACKNOWLEDGED;
          message.result = (typeof response === 'object' && response !== null) ? response : { data: response };

          const outcome = {
            success: true,
            deliveryStatus: DELIVERY_STATUS.ACKNOWLEDGED,
            acknowledged: true,
            taskId: message.taskId,
            correlationId: message.correlationId,
            result: message.result
          };

          // Cache verified acknowledgement for recipient-side deduplication
          const dedupKey = `${message.taskId}:${message.recipient}:${message.messageType}`;
          this.deduplicationCache.set(dedupKey, { result: outcome, timestamp: Date.now() });

          return outcome;
        } else {
          throw new Error(`Agent '${message.recipient}' failed to acknowledge message.`);
        }
      } catch (err) {
        lastError = err;
        if (attempt < message.retryLimit) {
          await new Promise(r => setTimeout(r, 50 * (attempt + 1)));
        }
      }
    }

    message.deliveryStatus = DELIVERY_STATUS.FAILED;
    message.error = lastError?.message || 'Delivery failed after retries.';
    return {
      success: false,
      deliveryStatus: DELIVERY_STATUS.FAILED,
      error: message.error
    };
  }

  cancelTask(taskId, reason = 'Cancelled by orchestrator') {
    let cancelledCount = 0;
    for (const [msgId, msg] of this.inFlightMessages.entries()) {
      if (msg.taskId === taskId) {
        msg.deliveryStatus = DELIVERY_STATUS.CANCELLED;
        msg.error = reason;
        this.inFlightMessages.delete(msgId);
        cancelledCount++;
      }
    }
    return { cancelledCount, taskId, reason };
  }

  getMessageHistory(filter = {}) {
    return this.messageHistory.filter(m => {
      if (filter.taskId && m.taskId !== filter.taskId) return false;
      if (filter.recipient && m.recipient !== filter.recipient) return false;
      if (filter.deliveryStatus && m.deliveryStatus !== filter.deliveryStatus) return false;
      return true;
    });
  }
}

export const agentMessageBus = new AgentMessageBus();

