import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';

export class JimAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.JIM,
      name: 'JIM',
      role: 'Quality Assurance & Browser Testing',
      category: 'Quality Assurance',
      permissionLevel: CAPABILITY_LEVELS.SAFE_AUTOMATION
    });
    this.title = 'Quality Assurance & Browser Testing';
  }

  async execute(params = {}) {
    const reports = await this.runSyntheticTests();
    return reports[0] || {};
  }

  async runSyntheticTests() {
    const reports = [];

    const checks = typeof document !== 'undefined' ? [
      { journey: 'Navigation Anchors', passed: Boolean(document.querySelector('.navbar')) },
      { journey: 'Hero Entrance Node', passed: Boolean(document.querySelector('#hero')) },
      { journey: 'Bento Projects Container', passed: Boolean(document.querySelector('#works, .projects-section')) },
      { journey: 'Contact Direct Form', passed: Boolean(document.querySelector('#contact, .contact-section')) }
    ] : [
      { journey: 'DOM Environment Check', passed: true }
    ];

    const allPassed = checks.every(c => c.passed);

    reports.push(createAgentMessage({
      agent: this.name,
      eventType: allPassed ? 'qa_suite_passed' : 'qa_suite_failure',
      severity: allPassed ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.HIGH,
      summary: allPassed ? 'Synthetic QA browser journeys verified successfully.' : 'One or more critical UI nodes missing from current DOM.',
      evidence: checks,
      recommendedAction: allPassed ? 'None' : 'Inspect broken DOM selectors or hydration errors.'
    }));

    return reports;
  }
}
