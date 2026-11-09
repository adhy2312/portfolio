/**
 * ════════════════════════════════════════════════════════════════════
 *  TASK PLANNER — AUTONOMOUS EXECUTIVE DECOMPOSITION & SCHEDULING (PHASE 5)
 * ════════════════════════════════════════════════════════════════════
 * Transforms natural language goals into structured, ordered, dependency-aware
 * execution plans with explicit risk tiers, resource requirements, parent-child
 * hierarchies, and verifiable success criteria.
 */

import {
  RISK_TIERS,
  TASK_EXECUTION_STATUS,
  ACTION_TYPES
} from './ExecutiveTypes';
import { permissionRegistry } from '../agents/PermissionRegistry';

export class TaskPlanner {
  constructor(permissionRegistryInstance = permissionRegistry) {
    this.permissionRegistry = permissionRegistryInstance;
  }

  /**
   * Interprets goal intent and targets
   */
  interpretGoal(goal = '', context = {}) {
    const raw = String(goal || '').trim();
    const lower = raw.toLowerCase();

    let intent = 'GENERAL_EXECUTION';
    let target = context.targetFile || 'system';

    if (context.targetFile || lower.includes('refactor') || lower.includes('fix') || lower.includes('bug') || lower.includes('patch') || lower.includes('modify')) {
      intent = 'CODE_MODIFICATION';
      target = context.targetFile || 'codebase';
    } else if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('csrf') || lower.includes('xss') || lower.includes('csp')) {
      intent = 'SECURITY_HARDENING';
      target = 'cybersecurity_posture';
    } else if (lower.includes('perf') || lower.includes('speed') || lower.includes('vitals') || lower.includes('cls') || lower.includes('latency')) {
      intent = 'PERFORMANCE_OPTIMIZATION';
      target = 'runtime_performance';
    } else if (lower.includes('research') || lower.includes('explore') || lower.includes('investigate') || lower.includes('analyze')) {
      intent = 'TECHNICAL_RESEARCH';
      target = 'knowledge_base';
    } else if (lower.includes('deploy') || lower.includes('publish') || lower.includes('release')) {
      intent = 'PRODUCTION_RELEASE';
      target = 'production_environment';
    }

    const isHighImpact = Boolean(
      lower.includes('deploy') || lower.includes('production') ||
      lower.includes('delete') || lower.includes('purge') ||
      lower.includes('secret') || lower.includes('credential') ||
      lower.includes('spend') || lower.includes('publish')
    );

    return {
      rawGoal: raw,
      intent,
      target,
      isHighImpact
    };
  }

  /**
   * Primary planning entrypoint: decomposes goal into structured task DAG
   */
  plan(goal, context = {}, options = {}) {
    const interpretation = this.interpretGoal(goal, context);
    const planId = options.planId || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const subtasks = this._decomposeGoal(interpretation, planId, context, options);

    // Resolve dependencies and compute topological execution stages
    const { executionStages, hasCycle } = this._resolveExecutionOrder(subtasks);
    if (hasCycle) {
      throw new Error(`Circular dependency detected in plan [${planId}]`);
    }

    const overallRisk = this._calculateOverallRisk(subtasks);

    return {
      id: planId,
      goal: interpretation.rawGoal,
      intent: interpretation.intent,
      target: interpretation.target,
      status: TASK_EXECUTION_STATUS.PLANNED,
      overallRisk,
      estimatedComplexity: interpretation.isHighImpact
        ? 'LEVEL_4_CONSEQUENTIAL'
        : (subtasks.length > 2 ? 'LEVEL_3_COMPLEX' : 'LEVEL_2_TECHNICAL'),
      subtasks,
      executionStages,
      createdAt: now,
      updatedAt: now,
      context
    };
  }

  /**
   * Decompose interpreted goal into structured subtask tree
   */
  _decomposeGoal(interpretation, planId, context = {}, options = {}) {
    // If explicit custom tasks were provided in options, normalize and return them
    if (Array.isArray(options.customTasks) && options.customTasks.length > 0) {
      return options.customTasks.map((t, idx) => {
        const taskId = t.id || `task_${planId}_${idx + 1}`;
        const riskLevel = t.riskLevel || this.permissionRegistry.classifyRisk(t.actionType || t.title, t.parameters || {});
        return {
          id: taskId,
          planId,
          parentId: t.parentId || null,
          title: t.title || `Subtask ${idx + 1}`,
          actionType: t.actionType || ACTION_TYPES.RESEARCH,
          riskLevel,
          assignedAgent: t.assignedAgent || 'MINI_ADHY',
          dependencies: Array.isArray(t.dependencies) ? [...t.dependencies] : [],
          parameters: t.parameters || {},
          successCriteria: t.successCriteria || { outputPattern: '.*' },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: t.maxRetries || 3,
          result: null,
          createdAt: new Date().toISOString()
        };
      });
    }

    const subtasks = [];

    switch (interpretation.intent) {
      case 'CODE_MODIFICATION': {
        const targetFile = context.targetFile || 'src/components/MainApp.js';

        // 1. Root: File Analysis (Low Risk)
        subtasks.push({
          id: `${planId}_analyze`,
          planId,
          parentId: null,
          title: `Analyze file structure: ${targetFile}`,
          actionType: ACTION_TYPES.FILE_ANALYSIS,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'MINI_ADHY',
          dependencies: [],
          parameters: { targetFile, query: interpretation.rawGoal },
          successCriteria: { file_exists: targetFile },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        // 2. Child: Code Generation & Architectural Review (Low Risk)
        subtasks.push({
          id: `${planId}_codegen`,
          planId,
          parentId: `${planId}_analyze`,
          title: `Generate patched code logic and review with Ultron`,
          actionType: ACTION_TYPES.CODE_GENERATION,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'ULTRON',
          dependencies: [`${planId}_analyze`],
          parameters: { targetFile, requirement: interpretation.rawGoal },
          successCriteria: { schema_validation: ['codeSnippet', 'explanation'] },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        // 3. Child: Apply Code Change (Controlled Risk - Requires Authorization)
        subtasks.push({
          id: `${planId}_apply`,
          planId,
          parentId: `${planId}_codegen`,
          title: `Apply verified code change to ${targetFile}`,
          actionType: ACTION_TYPES.APPLY_CODE_CHANGE,
          riskLevel: RISK_TIERS.CONTROLLED,
          assignedAgent: 'MINI_ADHY',
          dependencies: [`${planId}_codegen`],
          parameters: { targetFile, modifiesProjectFiles: true },
          successCriteria: { file_content: { target: targetFile } },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        // 4. Verification Test (Low Risk)
        subtasks.push({
          id: `${planId}_test`,
          planId,
          parentId: `${planId}_apply`,
          title: `Run regression tests to verify code modification`,
          actionType: ACTION_TYPES.TEST_EXECUTION,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'JIM',
          dependencies: [`${planId}_apply`],
          parameters: { testSuite: 'regression', targetFile },
          successCriteria: { test_results: { mustPass: true } },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });
        break;
      }

      case 'SECURITY_HARDENING': {
        // 1. Cybersecurity Audit (FRIDAY - Low Risk)
        subtasks.push({
          id: `${planId}_sec_scan`,
          planId,
          parentId: null,
          title: 'Execute vulnerability scan and CSP header inspection',
          actionType: ACTION_TYPES.DELEGATE_SPECIALIST,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'FRIDAY',
          dependencies: [],
          parameters: { operation: 'security_audit', target: interpretation.target },
          successCriteria: { schema_validation: ['vulnerabilities', 'cspStatus'] },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        // 2. Secret Leak Inspection (U - Low Risk)
        subtasks.push({
          id: `${planId}_secret_audit`,
          planId,
          parentId: null,
          title: 'Scan environment and storage for sensitive secret leakage',
          actionType: ACTION_TYPES.DELEGATE_SPECIALIST,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'U',
          dependencies: [],
          parameters: { operation: 'secret_leak_detection' },
          successCriteria: { schema_validation: ['secretsExposed'] },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        // 3. First-Principles Hardening Review (ULTRON - Low Risk)
        subtasks.push({
          id: `${planId}_ultron_review`,
          planId,
          parentId: `${planId}_sec_scan`,
          title: 'Deconstruct security flaws and formulate first-principles hardening proposal',
          actionType: ACTION_TYPES.DELEGATE_SPECIALIST,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'ULTRON',
          dependencies: [`${planId}_sec_scan`, `${planId}_secret_audit`],
          parameters: { operation: 'architectural_stress_testing' },
          successCriteria: { schema_validation: ['flaws', 'recommendations'] },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        // 4. Apply Hardening Configuration (CONTROLLED Risk)
        subtasks.push({
          id: `${planId}_apply_hardening`,
          planId,
          parentId: `${planId}_ultron_review`,
          title: 'Apply updated Content-Security-Policy and security guards',
          actionType: ACTION_TYPES.APPLY_CODE_CHANGE,
          riskLevel: RISK_TIERS.CONTROLLED,
          assignedAgent: 'MINI_ADHY',
          dependencies: [`${planId}_ultron_review`],
          parameters: { modifiesProjectFiles: true, target: 'security_config' },
          successCriteria: { file_content: { target: 'csp_header' } },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });
        break;
      }

      case 'PRODUCTION_RELEASE': {
        // High impact release workflow
        subtasks.push({
          id: `${planId}_pre_release_audit`,
          planId,
          parentId: null,
          title: 'Execute pre-flight security, performance, and integrity audit',
          actionType: ACTION_TYPES.DELEGATE_SPECIALIST,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'JARVIS',
          dependencies: [],
          parameters: { operation: 'pre_flight_check' },
          successCriteria: { schema_validation: ['auditPassed'] },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        subtasks.push({
          id: `${planId}_prod_deploy`,
          planId,
          parentId: `${planId}_pre_release_audit`,
          title: 'Deploy verified build to production edge infrastructure',
          actionType: ACTION_TYPES.EXTERNAL_INTEGRATION,
          riskLevel: RISK_TIERS.HIGH_IMPACT,
          assignedAgent: 'EDITH',
          dependencies: [`${planId}_pre_release_audit`],
          parameters: { deployToProduction: true, irreversible: true },
          successCriteria: { external_confirmation: { expectedStatus: 200 } },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });
        break;
      }

      case 'TECHNICAL_RESEARCH':
      default: {
        // Standard Research & Analysis Workflow
        subtasks.push({
          id: `${planId}_research`,
          planId,
          parentId: null,
          title: `Research technical domain and specifications for: ${interpretation.rawGoal}`,
          actionType: ACTION_TYPES.RESEARCH,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'VERONICA',
          dependencies: [],
          parameters: { topic: interpretation.rawGoal },
          successCriteria: { schema_validation: ['findings', 'citations'] },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });

        subtasks.push({
          id: `${planId}_synthesize`,
          planId,
          parentId: `${planId}_research`,
          title: `Synthesize research into structured recommendations`,
          actionType: ACTION_TYPES.CODE_GENERATION,
          riskLevel: RISK_TIERS.LOW_RISK,
          assignedAgent: 'MINI_ADHY',
          dependencies: [`${planId}_research`],
          parameters: { prompt: interpretation.rawGoal },
          successCriteria: { schema_validation: ['summary', 'recommendations'] },
          status: TASK_EXECUTION_STATUS.PLANNED,
          retryCount: 0,
          maxRetries: 3
        });
        break;
      }
    }

    return subtasks;
  }

  /**
   * Resolves topological execution order and detects cycles
   */
  _resolveExecutionOrder(subtasks = []) {
    const inDegree = new Map();
    const adjList = new Map();

    subtasks.forEach(t => {
      inDegree.set(t.id, 0);
      adjList.set(t.id, []);
    });

    subtasks.forEach(t => {
      (t.dependencies || []).forEach(depId => {
        if (adjList.has(depId)) {
          adjList.get(depId).push(t.id);
          inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
        }
      });
    });

    // Kahn's algorithm for topological sorting in stages
    const stages = [];
    let queue = subtasks.filter(t => inDegree.get(t.id) === 0).map(t => t.id);
    let visitedCount = 0;

    while (queue.length > 0) {
      stages.push([...queue]);
      visitedCount += queue.length;
      const nextQueue = [];

      for (const u of queue) {
        for (const v of adjList.get(u) || []) {
          inDegree.set(v, inDegree.get(v) - 1);
          if (inDegree.get(v) === 0) {
            nextQueue.push(v);
          }
        }
      }

      queue = nextQueue;
    }

    const hasCycle = visitedCount !== subtasks.length;
    return { executionStages: stages, hasCycle };
  }

  /**
   * Determine overall risk level across all tasks in a plan
   */
  _calculateOverallRisk(subtasks = []) {
    if (subtasks.some(t => t.riskLevel === RISK_TIERS.PROHIBITED)) return RISK_TIERS.PROHIBITED;
    if (subtasks.some(t => t.riskLevel === RISK_TIERS.HIGH_IMPACT)) return RISK_TIERS.HIGH_IMPACT;
    if (subtasks.some(t => t.riskLevel === RISK_TIERS.CONTROLLED)) return RISK_TIERS.CONTROLLED;
    return RISK_TIERS.LOW_RISK;
  }
}

export const taskPlanner = new TaskPlanner();

