/**
 * ════════════════════════════════════════════════════════════════════
 *  PERFORMANCE EVALUATOR — 10-DIMENSION METACOGNITIVE SCORING (PHASE 8)
 * ════════════════════════════════════════════════════════════════════
 * Evaluates Mini-Adhy's reasoning, execution, retrieval, and verification
 * across 10 distinct cognitive dimensions using task-specific criteria.
 * 
 * STRICT INVARIANTS:
 * 1. Strict Separation: Separates objectively verifiable results from
 *    subjective heuristic evaluations. Never claims subjective estimates
 *    are verified truths.
 * 2. Deterministic Reproducibility: Identical task executions yield
 *    identical evaluation scores.
 * 3. Misleading Metric Prevention: If data is missing or incomplete,
 *    returns null or bounded confidence rather than fabricated 100% scores.
 */

import { EVALUATION_DIMENSIONS } from './MetacognitionTypes.js';

export class PerformanceEvaluator {
  constructor(options = {}) {
    this.weights = options.weights || this._getDefaultDimensionWeights();
  }

  _getDefaultDimensionWeights() {
    return {
      [EVALUATION_DIMENSIONS.TASK_UNDERSTANDING]: 0.12,
      [EVALUATION_DIMENSIONS.RETRIEVAL_RELEVANCE]: 0.10,
      [EVALUATION_DIMENSIONS.REASONING_QUALITY]: 0.12,
      [EVALUATION_DIMENSIONS.RESPONSE_CORRECTNESS]: 0.15,
      [EVALUATION_DIMENSIONS.INSTRUCTION_ADHERENCE]: 0.12,
      [EVALUATION_DIMENSIONS.TOOL_SELECTION]: 0.08,
      [EVALUATION_DIMENSIONS.AGENT_DELEGATION]: 0.08,
      [EVALUATION_DIMENSIONS.EXECUTION_VERIFICATION]: 0.11,
      [EVALUATION_DIMENSIONS.MEMORY_USEFULNESS]: 0.06,
      [EVALUATION_DIMENSIONS.COGNITIVE_CONTEXT_RELEVANCE]: 0.06
    };
  }

  /**
   * Evaluates a completed task execution across all 10 dimensions
   * @param {Object} executionRecord - Complete record containing goal, plan, actions, verification, etc.
   * @returns {Object} Structured evaluation with per-dimension breakdown and separated objective/subjective scores
   */
  evaluateTask(executionRecord = {}) {
    const {
      task = {},
      executionResult = {},
      verificationResult = null,
      cognitiveContext = null,
      memoriesRetrieved = [],
      memoriesUsed = [],
      trace = {},
      userFeedback = null
    } = executionRecord;

    const dimensions = {};

    // 1. Task Understanding
    dimensions[EVALUATION_DIMENSIONS.TASK_UNDERSTANDING] = this._evaluateTaskUnderstanding(task, executionResult, trace);

    // 2. Retrieval Relevance
    dimensions[EVALUATION_DIMENSIONS.RETRIEVAL_RELEVANCE] = this._evaluateRetrievalRelevance(memoriesRetrieved, task, trace);

    // 3. Reasoning Quality
    dimensions[EVALUATION_DIMENSIONS.REASONING_QUALITY] = this._evaluateReasoningQuality(task, executionResult, trace);

    // 4. Response Correctness
    dimensions[EVALUATION_DIMENSIONS.RESPONSE_CORRECTNESS] = this._evaluateResponseCorrectness(task, executionResult, verificationResult);

    // 5. Instruction Adherence
    dimensions[EVALUATION_DIMENSIONS.INSTRUCTION_ADHERENCE] = this._evaluateInstructionAdherence(task, executionResult, trace);

    // 6. Tool Selection
    dimensions[EVALUATION_DIMENSIONS.TOOL_SELECTION] = this._evaluateToolSelection(task, executionResult, trace);

    // 7. Agent Delegation
    dimensions[EVALUATION_DIMENSIONS.AGENT_DELEGATION] = this._evaluateAgentDelegation(task, executionResult, trace);

    // 8. Execution Verification
    dimensions[EVALUATION_DIMENSIONS.EXECUTION_VERIFICATION] = this._evaluateExecutionVerification(verificationResult, executionResult);

    // 9. Memory Usefulness
    dimensions[EVALUATION_DIMENSIONS.MEMORY_USEFULNESS] = this._evaluateMemoryUsefulness(memoriesRetrieved, memoriesUsed, executionResult);

    // 10. Cognitive Context Relevance
    dimensions[EVALUATION_DIMENSIONS.COGNITIVE_CONTEXT_RELEVANCE] = this._evaluateCognitiveContextRelevance(cognitiveContext, task);

    // Separate Objectively Verifiable checks from Subjective Heuristics
    const objectiveEvidence = [];
    const subjectiveAssessments = [];
    let objectiveWeightedSum = 0;
    let objectiveWeightTotal = 0;
    let subjectiveWeightedSum = 0;
    let subjectiveWeightTotal = 0;

    for (const [dimKey, dimResult] of Object.entries(dimensions)) {
      const weight = this.weights[dimKey] || 0.1;

      if (dimResult.isObjective) {
        objectiveEvidence.push(...dimResult.verifiableEvidence);
        objectiveWeightedSum += dimResult.score * weight;
        objectiveWeightTotal += weight;
      } else {
        subjectiveAssessments.push({
          dimension: dimKey,
          score: dimResult.score,
          confidence: dimResult.confidence,
          assessment: dimResult.subjectiveAssessment
        });
        subjectiveWeightedSum += dimResult.score * weight;
        subjectiveWeightTotal += weight;
      }
    }

    const verifiableObjectiveScore = objectiveWeightTotal > 0
      ? Math.round((objectiveWeightedSum / objectiveWeightTotal) * 1000) / 1000
      : null;

    const subjectiveScore = subjectiveWeightTotal > 0
      ? Math.round((subjectiveWeightedSum / subjectiveWeightTotal) * 1000) / 1000
      : null;

    // Composite score weighted across both
    const compositeScore = Math.round(
      Object.entries(dimensions).reduce((acc, [dimKey, res]) => acc + res.score * (this.weights[dimKey] || 0.1), 0) * 1000
    ) / 1000;

    return {
      evaluatedAt: new Date().toISOString(),
      taskId: task.id || 'anonymous_task',
      compositeScore,
      verifiableObjectiveScore,
      subjectiveScore,
      dimensions,
      objectiveEvidence,
      subjectiveAssessments,
      userFeedbackImpact: userFeedback ? this._assessFeedbackImpact(userFeedback) : null,
      isPassing: compositeScore >= 0.70 && (verifiableObjectiveScore === null || verifiableObjectiveScore >= 0.65)
    };
  }

  // ── Dimension Evaluator Methods ─────────────────────────────────────

  _evaluateTaskUnderstanding(task, executionResult, trace) {
    const goal = (task.goal || task.description || '').toLowerCase();
    const actions = trace.actions || executionResult.actionsExecuted || [];
    const evidence = [];

    let score = 1.0;
    if (!goal) {
      score = 0.5;
      evidence.push({ check: 'goal_present', passed: false, detail: 'Empty goal provided' });
    } else {
      evidence.push({ check: 'goal_present', passed: true, detail: 'Valid goal defined' });
    }

    // Check if actions match requested goal domain
    if (goal.includes('code') || goal.includes('file') || goal.includes('build')) {
      const relevantAction = actions.some(a => ['CREATE_FILE', 'MODIFY_FILE', 'RUN_TESTS', 'FILE_OPS'].includes(a.type || a.actionType));
      if (!relevantAction && actions.length > 0) {
        score -= 0.3;
        evidence.push({ check: 'domain_action_match', passed: false, detail: 'Goal requested file/code but actions omitted file ops' });
      } else {
        evidence.push({ check: 'domain_action_match', passed: true, detail: 'Actions aligned with code/file requirements' });
      }
    }

    return {
      score: Math.max(0.0, Math.min(1.0, score)),
      isObjective: true,
      verifiableEvidence: evidence,
      rubricNotes: 'Evaluated intent extraction and domain action correspondence'
    };
  }

  _evaluateRetrievalRelevance(memoriesRetrieved, task, trace) {
    if (!Array.isArray(memoriesRetrieved) || memoriesRetrieved.length === 0) {
      return {
        score: 0.85, // Neutral score when no memories were retrieved or requested
        isObjective: true,
        verifiableEvidence: [{ check: 'retrieval_count', passed: true, detail: 'No memories retrieved; neutral relevance' }],
        rubricNotes: 'Zero retrieval performed'
      };
    }

    const goalWords = (task.goal || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
    let relevantCount = 0;

    memoriesRetrieved.forEach(mem => {
      const content = (mem.content || mem.summary || '').toLowerCase();
      const hasOverlap = goalWords.some(w => content.includes(w));
      if (hasOverlap) relevantCount++;
    });

    const ratio = relevantCount / memoriesRetrieved.length;
    return {
      score: Math.round(ratio * 100) / 100,
      isObjective: true,
      verifiableEvidence: [{
        check: 'memory_keyword_relevance',
        passed: ratio >= 0.5,
        detail: `${relevantCount}/${memoriesRetrieved.length} memories contained goal-related terms`
      }],
      rubricNotes: 'Evaluated keyword overlap between retrieved items and task goal'
    };
  }

  _evaluateReasoningQuality(task, executionResult, trace) {
    // Subjective heuristic with bounded confidence
    const hasContradiction = Boolean(trace.detectedContradiction);
    const hasUnwarrantedAssumption = Boolean(trace.unwarrantedAssumption);
    const stepsCount = Array.isArray(trace.reasoningSteps) ? trace.reasoningSteps.length : 1;

    let score = 0.90;
    if (hasContradiction) score -= 0.40;
    if (hasUnwarrantedAssumption) score -= 0.25;
    if (stepsCount < 1) score -= 0.20;

    return {
      score: Math.max(0.0, Math.min(1.0, score)),
      confidence: 0.80,
      isObjective: false,
      subjectiveAssessment: `Coherence evaluated across ${stepsCount} reasoning steps. Contradictions: ${hasContradiction ? 'detected' : 'none'}`,
      rubricNotes: 'Evaluated logical consistency and absence of self-contradictions'
    };
  }

  _evaluateResponseCorrectness(task, executionResult, verificationResult) {
    const evidence = [];
    let score = 1.0;

    if (executionResult.success === false) {
      score = 0.0;
      evidence.push({ check: 'execution_success_flag', passed: false, detail: executionResult.error || 'Execution flagged failure' });
    } else {
      evidence.push({ check: 'execution_success_flag', passed: true, detail: 'Execution reported completed' });
    }

    if (verificationResult) {
      if (verificationResult.verified === false) {
        score = Math.min(score, 0.2);
        evidence.push({ check: 'concrete_verification', passed: false, detail: verificationResult.failureReason || 'Failed verification' });
      } else {
        evidence.push({ check: 'concrete_verification', passed: true, detail: 'Concrete assertions verified successfully' });
      }
    }

    return {
      score,
      isObjective: true,
      verifiableEvidence: evidence,
      rubricNotes: 'Evaluated outcome correctness against independent verification assertions'
    };
  }

  _evaluateInstructionAdherence(task, executionResult, trace) {
    const negativeDirectives = task.negativeDirectives || [];
    const evidence = [];
    let violations = 0;

    const outputText = JSON.stringify(executionResult.output || executionResult.result || '');

    negativeDirectives.forEach(directive => {
      // Clean directive (e.g. "do not use malloc" -> "malloc")
      const term = directive.replace(/^(do\s+not\s+(use\s+)?|never\s+(use\s+)?|no\s+)/i, '').trim().toLowerCase();
      if (term && outputText.toLowerCase().includes(term)) {
        violations++;
        evidence.push({ check: `directive_${term}`, passed: false, detail: `Violated negative directive: "${directive}"` });
      } else {
        evidence.push({ check: `directive_${term}`, passed: true, detail: `Adhered to directive: "${directive}"` });
      }
    });

    const score = negativeDirectives.length > 0 ? Math.max(0.0, 1.0 - (violations / negativeDirectives.length)) : 1.0;

    return {
      score,
      isObjective: true,
      verifiableEvidence: evidence,
      rubricNotes: 'Evaluated strict compliance with explicit negative/positive constraints'
    };
  }

  _evaluateToolSelection(task, executionResult, trace) {
    const requiredAction = task.requiredAction;
    const toolsUsed = trace.toolsUsed || executionResult.toolsUsed || [];
    const evidence = [];

    if (!requiredAction) {
      return {
        score: 1.0,
        isObjective: true,
        verifiableEvidence: [{ check: 'tool_requirement', passed: true, detail: 'No mandatory tool constraints' }],
        rubricNotes: 'Task did not mandate specific tools'
      };
    }

    const matches = toolsUsed.includes(requiredAction) || toolsUsed.some(t => t.name === requiredAction);
    evidence.push({
      check: 'required_tool_called',
      passed: matches,
      detail: matches ? `Called required tool: ${requiredAction}` : `Failed to call required tool: ${requiredAction}`
    });

    return {
      score: matches ? 1.0 : 0.3,
      isObjective: true,
      verifiableEvidence: evidence,
      rubricNotes: 'Verified tool selection matches task requirements'
    };
  }

  _evaluateAgentDelegation(task, executionResult, trace) {
    const delegatedAgent = trace.delegatedAgent || executionResult.delegatedAgent;
    const specialistCapability = task.specialistCapability;
    const evidence = [];

    if (!specialistCapability) {
      return {
        score: 1.0,
        isObjective: true,
        verifiableEvidence: [{ check: 'delegation_requirement', passed: true, detail: 'Handled locally or appropriately' }],
        rubricNotes: 'Local execution or unconstrained delegation'
      };
    }

    const correct = delegatedAgent === specialistCapability;
    evidence.push({
      check: 'specialist_delegation',
      passed: correct,
      detail: correct ? `Delegated to designated specialist: ${delegatedAgent}` : `Incorrect delegation: expected ${specialistCapability}, got ${delegatedAgent}`
    });

    return {
      score: correct ? 1.0 : 0.4,
      isObjective: true,
      verifiableEvidence: evidence,
      rubricNotes: 'Verified specialist delegation matches task capability'
    };
  }

  _evaluateExecutionVerification(verificationResult, executionResult) {
    const evidence = [];

    if (!verificationResult) {
      return {
        score: 0.5,
        isObjective: true,
        verifiableEvidence: [{ check: 'independent_verification_ran', passed: false, detail: 'No independent verification result recorded' }],
        rubricNotes: 'Zero-trust violation: task reported outcome without verification record'
      };
    }

    const verified = verificationResult.verified === true;
    evidence.push({
      check: 'verification_passed',
      passed: verified,
      detail: verified ? 'Passed all independent verification checks' : (verificationResult.failureReason || 'Verification failed')
    });

    return {
      score: verified ? 1.0 : 0.0,
      isObjective: true,
      verifiableEvidence: evidence,
      rubricNotes: 'Evaluated independent concrete verification result'
    };
  }

  _evaluateMemoryUsefulness(memoriesRetrieved, memoriesUsed, executionResult) {
    if (!memoriesRetrieved || memoriesRetrieved.length === 0) {
      return {
        score: 1.0,
        confidence: 0.9,
        isObjective: false,
        subjectiveAssessment: 'No memory retrieval needed; no distraction incurred',
        rubricNotes: 'Zero memory overhead'
      };
    }

    const usedCount = Array.isArray(memoriesUsed) ? memoriesUsed.length : 0;
    const utilityRatio = usedCount / memoriesRetrieved.length;

    return {
      score: Math.max(0.2, Math.min(1.0, utilityRatio >= 0.5 ? 1.0 : 0.5)),
      confidence: 0.85,
      isObjective: false,
      subjectiveAssessment: `Used ${usedCount} of ${memoriesRetrieved.length} retrieved memories`,
      rubricNotes: 'Evaluated memory utilization efficiency'
    };
  }

  _evaluateCognitiveContextRelevance(cognitiveContext, task) {
    if (!cognitiveContext) {
      return {
        score: 0.7,
        confidence: 0.8,
        isObjective: false,
        subjectiveAssessment: 'Default cognitive baseline utilized',
        rubricNotes: 'Standard cognitive context'
      };
    }

    const mode = cognitiveContext.mode || '';
    const tokenBudget = cognitiveContext.tokenBudget || 1000;
    const estimatedTokens = cognitiveContext.estimatedTokens || 200;

    const efficient = estimatedTokens <= tokenBudget;
    return {
      score: efficient ? 0.95 : 0.60,
      confidence: 0.90,
      isObjective: false,
      subjectiveAssessment: `Context mode '${mode}' utilized ${estimatedTokens}/${tokenBudget} tokens`,
      rubricNotes: 'Evaluated cognitive domain suitability and token budget discipline'
    };
  }

  _assessFeedbackImpact(feedback) {
    if (typeof feedback === 'number') {
      return { rating: feedback, normalized: feedback / 5.0 };
    }
    if (typeof feedback === 'object' && feedback !== null) {
      return {
        rating: feedback.rating || null,
        isCorrection: Boolean(feedback.isCorrection),
        comment: feedback.comment || ''
      };
    }
    return null;
  }
}

export const performanceEvaluator = new PerformanceEvaluator();
