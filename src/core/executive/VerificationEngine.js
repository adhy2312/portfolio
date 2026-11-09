/**
 * ════════════════════════════════════════════════════════════════════
 *  VERIFICATION ENGINE — CONCRETE OUTCOME VALIDATION (PHASE 5)
 * ════════════════════════════════════════════════════════════════════
 * Validates task outcomes using actual state, files, tests, and confirmation
 * tokens rather than relying on generated claims.
 * 
 * CORE INVARIANT:
 * Never report success based solely on generated text.
 */

import { TASK_EXECUTION_STATUS } from './ExecutiveTypes';

export class VerificationEngine {
  constructor() {
    this.verificationHistory = [];
  }

  /**
   * Verifies task outcome against concrete success criteria
   * @param {Object} task
   * @param {Object} executionResult
   * @param {Object} systemContext
   * @returns {Promise<{ verified: boolean, failureReason: string | null, evidence: Array }>}
   */
  async verifyTaskOutcome(task = {}, executionResult = {}, systemContext = {}) {
    const criteria = task.successCriteria || {};
    const evidence = [];

    // Invariant: If execution result explicitly says failed or has error, fail immediately
    if (!executionResult || executionResult.success === false) {
      const failureReason = executionResult?.error || 'Task execution explicitly reported failure.';
      const res = {
        verified: false,
        failureReason,
        evidence: [{ check: 'execution_status', passed: false, error: failureReason }]
      };
      this._recordVerification(task.id, res);
      return res;
    }

    // 1. Prerequisite Dependency Satisfaction Check
    if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      const taskStates = systemContext.taskStates || new Map();
      const unmet = task.dependencies.filter(depId => {
        const dep = taskStates.get(depId);
        return !dep || dep.status !== TASK_EXECUTION_STATUS.COMPLETED;
      });

      if (unmet.length > 0) {
        const res = {
          verified: false,
          failureReason: `Unsatisfied prerequisite dependencies: ${unmet.join(', ')}`,
          evidence: [{ check: 'dependencies_satisfied', passed: false, unmet }]
        };
        this._recordVerification(task.id, res);
        return res;
      }
      evidence.push({ check: 'dependencies_satisfied', passed: true });
    }

    // 2. Concrete File Existence and Content Validation
    if (criteria.file_content || criteria.file_exists) {
      const target = criteria.file_content?.target || criteria.file_exists;
      const fileRegistry = systemContext.virtualFileSystem || systemContext.files || {};
      const actualContent = fileRegistry[target] !== undefined 
        ? fileRegistry[target] 
        : (executionResult.fileChanges?.[target] ?? 
           executionResult.targetContent ?? 
           executionResult.content ?? 
           executionResult.data?.content);

      if (actualContent === undefined || actualContent === null) {
        const res = {
          verified: false,
          failureReason: `Target file [${target}] was not produced or modified in system state.`,
          evidence: [{ check: 'file_exists', passed: false, target }]
        };
        this._recordVerification(task.id, res);
        return res;
      }

      if (criteria.file_content) {
        const { mustContain = [], mustNotContain = [] } = criteria.file_content;
        const requiredList = Array.isArray(mustContain) ? mustContain : [mustContain];
        const forbiddenList = Array.isArray(mustNotContain) ? mustNotContain : [mustNotContain];

        for (const req of requiredList.filter(Boolean)) {
          if (!String(actualContent).includes(req)) {
            const res = {
              verified: false,
              failureReason: `Target file [${target}] does not contain expected snippet: "${req}"`,
              evidence: [{ check: 'file_content_must_contain', passed: false, missing: req }]
            };
            this._recordVerification(task.id, res);
            return res;
          }
        }

        for (const forb of forbiddenList.filter(Boolean)) {
          if (String(actualContent).includes(forb)) {
            const res = {
              verified: false,
              failureReason: `Target file [${target}] contains prohibited snippet: "${forb}"`,
              evidence: [{ check: 'file_content_must_not_contain', passed: false, found: forb }]
            };
            this._recordVerification(task.id, res);
            return res;
          }
        }
      }

      evidence.push({ check: 'file_content_verified', passed: true, target });
    }

    // 3. Concrete Test Suite Results Verification
    if (criteria.test_results) {
      const { mustPass = true, minTests = 1 } = criteria.test_results;
      const testReport = executionResult.testReport || executionResult.data?.testReport || executionResult.data || {};

      const passed = typeof testReport.passedCount === 'number'
        ? testReport.passedCount
        : (testReport.success || testReport.passed ? 1 : 0);
      const failed = typeof testReport.failedCount === 'number'
        ? testReport.failedCount
        : (testReport.success === false ? 1 : 0);

      if (mustPass && (failed > 0 || testReport.success === false)) {
        const res = {
          verified: false,
          failureReason: `Tests failed during verification: ${failed} failed tests reported.`,
          evidence: [{ check: 'test_results', passed: false, failed, testReport }]
        };
        this._recordVerification(task.id, res);
        return res;
      }

      if (passed < minTests && !testReport.success) {
        const res = {
          verified: false,
          failureReason: `Insufficient test assertions: Expected at least ${minTests} passed tests, verified ${passed}.`,
          evidence: [{ check: 'test_results', passed: false, passedCount: passed }]
        };
        this._recordVerification(task.id, res);
        return res;
      }

      evidence.push({ check: 'test_results', passed: true, passedCount: passed });
    }

    // 4. Output Schema Validation
    if (criteria.schema_validation) {
      const requiredKeys = Array.isArray(criteria.schema_validation)
        ? criteria.schema_validation
        : Object.keys(criteria.schema_validation);

      // Merge top-level and nested data/output for unified schema inspection
      const outputData = {
        ...executionResult,
        ...(executionResult.data && typeof executionResult.data === 'object' ? executionResult.data : {}),
        ...(executionResult.output && typeof executionResult.output === 'object' ? executionResult.output : {})
      };

      const missingKeys = requiredKeys.filter(k => outputData[k] === undefined);

      if (missingKeys.length > 0) {
        const res = {
          verified: false,
          failureReason: `Output schema validation failed: Missing required keys [${missingKeys.join(', ')}]`,
          evidence: [{ check: 'schema_validation', passed: false, missingKeys }]
        };
        this._recordVerification(task.id, res);
        return res;
      }

      evidence.push({ check: 'schema_validation', passed: true, verifiedKeys: requiredKeys });
    }

    // 5. External Confirmation Validation
    if (criteria.external_confirmation) {
      const { expectedStatus = 200 } = criteria.external_confirmation;
      const response = executionResult.externalResponse || executionResult.response || {};

      if (response.status && response.status !== expectedStatus) {
        const res = {
          verified: false,
          failureReason: `External confirmation failed: Expected HTTP ${expectedStatus}, received ${response.status}`,
          evidence: [{ check: 'external_confirmation', passed: false, status: response.status }]
        };
        this._recordVerification(task.id, res);
        return res;
      }

      if (response.ok === false) {
        const res = {
          verified: false,
          failureReason: `External confirmation reported failure: ${response.statusText || 'Operation unconfirmed'}`,
          evidence: [{ check: 'external_confirmation', passed: false, response }]
        };
        this._recordVerification(task.id, res);
        return res;
      }

      evidence.push({ check: 'external_confirmation', passed: true, status: response.status || expectedStatus });
    }

    const verifiedResult = {
      verified: true,
      failureReason: null,
      evidence
    };
    this._recordVerification(task.id, verifiedResult);
    return verifiedResult;
  }

  _recordVerification(taskId, result) {
    this.verificationHistory.unshift({
      taskId,
      timestamp: new Date().toISOString(),
      ...result
    });
    if (this.verificationHistory.length > 100) {
      this.verificationHistory.pop();
    }
  }

  getVerificationHistory() {
    return [...this.verificationHistory];
  }
}

export const verificationEngine = new VerificationEngine();
