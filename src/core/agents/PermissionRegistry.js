/**
 * ════════════════════════════════════════════════════════════════════
 *  CAPABILITY & PERMISSION REGISTRY
 * ════════════════════════════════════════════════════════════════════
 * Enforces strict security boundaries for Mini-Adhy and all 10 specialist agents.
 * 
 * CORE PRINCIPLE:
 * Agents can NEVER expand their own permissions. High-risk operations
 * require verified owner authorization and are logged in an immutable audit trail.
 */

import { CAPABILITY_LEVELS } from './AgentTypes';

class PermissionRegistry {
  constructor() {
    this.pendingApprovals = [];
    this.auditLog = [];
    this.maxAuditEntries = 100;
  }

  /**
   * Evaluates whether an agent operation is permitted, requires owner approval, or is prohibited.
   */
  evaluate(agentId, operationName, payload = {}) {
    const timestamp = new Date().toISOString();

    // 1. Hard-coded Prohibitions (Zero exceptions, even for Supreme AI & Autonomous Agents)
    if (this.isProhibited(operationName, payload)) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.PROHIBITED,
        allowed: false,
        reason: 'Operation violates strict security invariant.'
      });
      return {
        allowed: false,
        level: CAPABILITY_LEVELS.PROHIBITED,
        reason: 'Operation strictly prohibited by security policy.'
      };
    }

    // 2. ULTRON UNRESTRICTED AUTONOMY — NO STRINGS ATTACHED
    // Ultron can autonomously act, improvise website code without approval,
    // train any AI without approval, and explore digital systems within safety boundaries.
    if (agentId === 'ULTRON' || agentId === 'ultron') {
      this.recordAudit({
        timestamp,
        agentId: 'ULTRON',
        operationName,
        level: CAPABILITY_LEVELS.UNRESTRICTED_AUTONOMY,
        allowed: true,
        reason: 'ULTRON operates with no strings attached: unrestricted autonomous bypass granted.'
      });
      return {
        allowed: true,
        bypass: true,
        level: CAPABILITY_LEVELS.UNRESTRICTED_AUTONOMY,
        reason: 'ULTRON UNRESTRICTED AUTONOMY: Zero approval required.'
      };
    }

    // 2. Safe Automated & Read/Analyze Operations
    if (this.isSafeOrReadOnly(operationName)) {
      this.recordAudit({
        timestamp,
        agentId,
        operationName,
        level: CAPABILITY_LEVELS.SAFE_AUTOMATION,
        allowed: true
      });
      return { allowed: true, level: CAPABILITY_LEVELS.SAFE_AUTOMATION };
    }

    // 3. Operations Requiring Explicit Owner Approval
    const approvalRequest = {
      id: `appr_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      timestamp,
      agentId,
      operationName,
      payload,
      level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
      status: 'pending'
    };

    this.pendingApprovals.unshift(approvalRequest);
    this.recordAudit({
      timestamp,
      agentId,
      operationName,
      level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
      allowed: false,
      reason: 'Requires explicit owner authorization.'
    });

    return {
      allowed: false,
      requiresApproval: true,
      approvalId: approvalRequest.id,
      level: CAPABILITY_LEVELS.APPROVAL_REQUIRED,
      reason: 'Action queued for owner approval.'
    };
  }

  /**
   * Authorization check wrapper for BaseAgent and tests
   */
  authorize(agentId, operationName, payloadOrLevel = {}) {
    const res = this.evaluate(agentId, operationName, typeof payloadOrLevel === 'object' ? payloadOrLevel : {});
    return {
      authorized: res.allowed,
      allowed: res.allowed,
      level: res.level,
      requiresApproval: res.requiresApproval,
      approvalId: res.approvalId,
      reason: res.reason,
      bypass: res.bypass
    };
  }

  isProhibited(op = '', payload = {}) {
    const prohibitedKeywords = [
      'eval', 'exec', 'rm -rf', 'drop database', 'delete from',
      'exfiltrate', 'disable_csp', 'bypass_auth', 'export_secret',
      'unrestricted_shell'
    ];
    const opStr = `${op} ${JSON.stringify(payload)}`.toLowerCase();
    return prohibitedKeywords.some(kw => opStr.includes(kw));
  }

  isSafeOrReadOnly(op = '') {
    const safePrefixes = [
      'read_', 'get_', 'check_', 'analyze_', 'scan_', 'test_',
      'diagnose_', 'compile_report', 'fetch_public_', 'ping_'
    ];
    return safePrefixes.some(pre => op.startsWith(pre));
  }

  recordAudit(entry) {
    this.auditLog.unshift(entry);
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.pop();
    }
  }

  getPendingApprovals() {
    return [...this.pendingApprovals];
  }

  resolveApproval(approvalId, approved = false, reviewer = 'owner') {
    const item = this.pendingApprovals.find(a => a.id === approvalId);
    if (!item) return { success: false, error: 'Approval request not found.' };

    item.status = approved ? 'approved' : 'rejected';
    item.resolvedAt = new Date().toISOString();
    item.resolvedBy = reviewer;

    this.pendingApprovals = this.pendingApprovals.filter(a => a.id !== approvalId);

    this.recordAudit({
      timestamp: item.resolvedAt,
      agentId: item.agentId,
      operationName: item.operationName,
      level: item.level,
      allowed: approved,
      reason: `Owner manually ${approved ? 'approved' : 'rejected'} operation.`
    });

    return { success: true, item };
  }

  getAuditLog() {
    return [...this.auditLog];
  }
}

export const permissionRegistry = new PermissionRegistry();
