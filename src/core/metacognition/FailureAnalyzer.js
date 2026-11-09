/**
 * ════════════════════════════════════════════════════════════════════
 *  FAILURE ANALYZER — ROOT CAUSE TAXONOMY & DIAGNOSTICS (PHASE 8)
 * ════════════════════════════════════════════════════════════════════
 * Investigates failed tasks or degraded performance across 7 root-cause
 * categories, assembling structured failure reports with evidence trails.
 */

import { FAILURE_CATEGORIES } from './MetacognitionTypes.js';

export class FailureAnalyzer {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_failure_reports_v1';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.reports = [];
    this.maxReports = 100;
    this.loadReports();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); },
      remove: (k) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.removeItem(k); }
    };
  }

  loadReports() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.reports = parsed;
      }
    } catch {
      this.reports = [];
    }
  }

  saveReports() {
    try {
      this.storageAdapter.set(this.storageKey, JSON.stringify(this.reports.slice(0, this.maxReports)));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  /**
   * Systematically analyzes a failed task or degraded evaluation
   * @param {Object} executionRecord - Task, trace, errors, verification, evaluation
   * @returns {Object} Structured Failure Report
   */
  analyzeFailure(executionRecord = {}) {
    const {
      task = {},
      executionResult = {},
      verificationResult = null,
      evaluation = null,
      trace = {},
      memoriesRetrieved = [],
      providerResponse = null,
      errors = []
    } = executionRecord;

    const contributingFactors = [];
    let primaryCategory = null;
    let rootCauseHypothesis = '';
    const evidenceTrail = [];

    // Investigation Question 1: Was execution interrupted or timed out?
    const hasTimeout = errors.some(e => /timeout|aborted|cancelled|deadline/i.test(String(e?.message || e)));
    if (hasTimeout || trace.timedOut) {
      contributingFactors.push({
        category: FAILURE_CATEGORIES.EXECUTION_TIMEOUT_OR_INTERRUPT,
        detail: 'Task execution exceeded deadline or received abort signal'
      });
      evidenceTrail.push({ step: 'execution', error: 'Timeout triggered' });
      if (!primaryCategory) primaryCategory = FAILURE_CATEGORIES.EXECUTION_TIMEOUT_OR_INTERRUPT;
    }

    // Investigation Question 2: Did an agent fail?
    const agentError = errors.find(e => /agent|specialist|orchestrator/i.test(String(e?.source || e?.message || e)));
    if (agentError || trace.agentFailure) {
      contributingFactors.push({
        category: FAILURE_CATEGORIES.AGENT_EXECUTION_FAILURE,
        detail: String(agentError?.message || agentError || 'Specialist agent crashed or returned empty response')
      });
      evidenceTrail.push({ step: 'agent_delegation', error: String(agentError?.message || agentError) });
      if (!primaryCategory) primaryCategory = FAILURE_CATEGORIES.AGENT_EXECUTION_FAILURE;
    }

    // Investigation Question 3: Was the provider unsuitable?
    const providerErr = providerResponse?.error || errors.find(e => /provider|rate\s*limit|quota|token\s*overflow|429|403|503/i.test(String(e?.message || e)));
    if (providerErr || trace.providerFailure) {
      contributingFactors.push({
        category: FAILURE_CATEGORIES.UNSUITABLE_PROVIDER_CAPABILITY,
        detail: `Provider failure: ${String(providerErr?.message || providerErr || 'Rate limit or context overflow')}`
      });
      evidenceTrail.push({ step: 'provider_call', error: String(providerErr?.message || providerErr) });
      if (!primaryCategory) primaryCategory = FAILURE_CATEGORIES.UNSUITABLE_PROVIDER_CAPABILITY;
    }

    // Investigation Question 4: Was the request misunderstood?
    if (evaluation?.dimensions?.TASK_UNDERSTANDING?.score < 0.6) {
      contributingFactors.push({
        category: FAILURE_CATEGORIES.INTENT_MISUNDERSTANDING,
        detail: 'Actions taken deviated from user requested goal or scope'
      });
      evidenceTrail.push({ step: 'task_intent', detail: 'Low intent understanding score' });
      if (!primaryCategory) primaryCategory = FAILURE_CATEGORIES.INTENT_MISUNDERSTANDING;
    }

    // Investigation Question 5: Was the wrong memory retrieved or did retrieval fail?
    const memoryError = errors.find(e => /memory|retrieval/i.test(String(e?.message || e)));
    const memoryIssue = memoriesRetrieved.some(m => m.deprecated || m.isContradiction || /error|deprecated|superseded/i.test(m.content || ''));
    if (memoryIssue || memoryError || evaluation?.dimensions?.RETRIEVAL_RELEVANCE?.score < 0.5) {
      contributingFactors.push({
        category: FAILURE_CATEGORIES.IRRELEVANT_OR_POISONED_MEMORY,
        detail: memoryError ? String(memoryError.message) : 'Retrieved memories contained stale, contradictory, or completely off-topic facts'
      });
      evidenceTrail.push({ step: 'memory_retrieval', detail: memoryError ? String(memoryError.message) : 'Poisoned or low-relevance memory injection' });
      if (!primaryCategory) primaryCategory = FAILURE_CATEGORIES.IRRELEVANT_OR_POISONED_MEMORY;
    }

    // Investigation Question 6: Was the context incomplete?
    if (evaluation?.dimensions?.COGNITIVE_CONTEXT_RELEVANCE?.score < 0.5 || trace.missingContext) {
      contributingFactors.push({
        category: FAILURE_CATEGORIES.INCOMPLETE_COGNITIVE_CONTEXT,
        detail: 'Essential domain constraints or cognitive dimensions were missing from prompt'
      });
      evidenceTrail.push({ step: 'context_compiler', detail: 'Incomplete task profile compilation' });
      if (!primaryCategory) primaryCategory = FAILURE_CATEGORIES.INCOMPLETE_COGNITIVE_CONTEXT;
    }

    // Investigation Question 7: Was verification insufficient?
    if (verificationResult && verificationResult.verified === false) {
      contributingFactors.push({
        category: FAILURE_CATEGORIES.INSUFFICIENT_OR_FALSE_VERIFICATION,
        detail: verificationResult.failureReason || 'Concrete verification check failed'
      });
      evidenceTrail.push({ step: 'verification', detail: verificationResult.failureReason });
      if (!primaryCategory) primaryCategory = FAILURE_CATEGORIES.INSUFFICIENT_OR_FALSE_VERIFICATION;
    }

    // Default fallback category if no specific category matched
    if (!primaryCategory) {
      primaryCategory = FAILURE_CATEGORIES.INTENT_MISUNDERSTANDING;
      contributingFactors.push({
        category: FAILURE_CATEGORIES.INTENT_MISUNDERSTANDING,
        detail: executionResult.error || 'General unclassified execution failure'
      });
      evidenceTrail.push({ step: 'execution', error: executionResult.error || 'Execution stopped without error code' });
    }

    // Assemble root cause hypothesis and recommendations
    rootCauseHypothesis = this._generateHypothesis(primaryCategory, contributingFactors);
    const preventativeRecommendation = this._generateRecommendation(primaryCategory);

    const report = {
      reportId: `fail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId: task.id || 'anonymous_task',
      goal: task.goal || task.description || 'Unspecified goal',
      timestamp: new Date().toISOString(),
      primaryCategory,
      category: primaryCategory,
      contributingFactors,
      rootCauseHypothesis,
      rootCauseInvestigation: rootCauseHypothesis,
      evidenceTrail,
      preventativeRecommendation,
      resolved: false
    };

    this.reports.unshift(report);
    if (this.reports.length > this.maxReports) this.reports.pop();
    this.saveReports();

    return report;
  }

  _generateHypothesis(primaryCategory, contributingFactors) {
    switch (primaryCategory) {
      case FAILURE_CATEGORIES.INTENT_MISUNDERSTANDING:
        return 'The agent misclassified user intent or missed critical negative constraints in the prompt.';
      case FAILURE_CATEGORIES.IRRELEVANT_OR_POISONED_MEMORY:
        return 'Vector/keyword memory retrieval injected stale or superseded experiences that distracted reasoning.';
      case FAILURE_CATEGORIES.INCOMPLETE_COGNITIVE_CONTEXT:
        return 'Task-specific compiler profile omitted key technical constraints or token budget cut off needed parameters.';
      case FAILURE_CATEGORIES.UNSUITABLE_PROVIDER_CAPABILITY:
        return 'Selected LLM provider was throttled, lacked context window, or failed to produce structured outputs.';
      case FAILURE_CATEGORIES.AGENT_EXECUTION_FAILURE:
        return 'Designated specialist agent threw an unhandled exception or lacked required tool capability.';
      case FAILURE_CATEGORIES.EXECUTION_TIMEOUT_OR_INTERRUPT:
        return 'Task planner formulated a dependency loop or individual tool step exceeded execution timeout.';
      case FAILURE_CATEGORIES.INSUFFICIENT_OR_FALSE_VERIFICATION:
        return 'Task completion claim was refuted by concrete file, state, or assertion verifier.';
      default:
        return 'Execution stopped due to unhandled pipeline friction.';
    }
  }

  _generateRecommendation(primaryCategory) {
    switch (primaryCategory) {
      case FAILURE_CATEGORIES.INTENT_MISUNDERSTANDING:
        return 'Refine intent classification prompt and tighten negative directive parsing in PromptCompilation.';
      case FAILURE_CATEGORIES.IRRELEVANT_OR_POISONED_MEMORY:
        return 'Enforce relevance scoring threshold (>=0.7) and filter out superseded records in RetrievalStrategy.';
      case FAILURE_CATEGORIES.INCOMPLETE_COGNITIVE_CONTEXT:
        return 'Update task profile in CognitiveContextCompiler to include required engineering parameters.';
      case FAILURE_CATEGORIES.UNSUITABLE_PROVIDER_CAPABILITY:
        return 'Update ProviderSelection fallback routing to prefer Groq/Gemini Flash when structured speed is required.';
      case FAILURE_CATEGORIES.AGENT_EXECUTION_FAILURE:
        return 'Audit specialist agent error handling and ensure fallback execution routes to general coordinator.';
      case FAILURE_CATEGORIES.EXECUTION_TIMEOUT_OR_INTERRUPT:
        return 'Decompose complex tasks into smaller atomic subtasks with incremental timeout checkpoints.';
      case FAILURE_CATEGORIES.INSUFFICIENT_OR_FALSE_VERIFICATION:
        return 'Enforce concrete schema and exit-code validation before returning task completion.';
      default:
        return 'Review system logs and refine execution lifecycle timeouts.';
    }
  }

  getReports(filter = {}) {
    return this.reports.filter(r => {
      if (filter.primaryCategory && r.primaryCategory !== filter.primaryCategory) return false;
      if (filter.resolved !== undefined && r.resolved !== filter.resolved) return false;
      return true;
    });
  }

  /**
   * Clusters reports by category to highlight top recurring failure modes
   */
  getFailureClusters() {
    const clusters = {};
    for (const cat of Object.values(FAILURE_CATEGORIES)) {
      clusters[cat] = 0;
    }
    this.reports.forEach(r => {
      if (clusters[r.primaryCategory] !== undefined) {
        clusters[r.primaryCategory]++;
      }
    });
    return clusters;
  }
}

export const failureAnalyzer = new FailureAnalyzer();
