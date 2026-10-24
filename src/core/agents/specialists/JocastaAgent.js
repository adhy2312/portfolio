import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';

export class JocastaAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.JOCASTA,
      name: 'JOCASTA',
      role: 'Performance & Optimization',
      category: 'Performance',
      permissionLevel: CAPABILITY_LEVELS.ANALYZE
    });
    this.title = 'Performance & Optimization';
  }

  async execute(params = {}) {
    const reports = await this.auditPerformance();
    return reports[0] || {};
  }

  async auditPerformance() {
    const reports = [];

    let domCount = 0;
    if (typeof document !== 'undefined') {
      domCount = document.querySelectorAll('*').length;
    }

    let memoryInfo = null;
    if (typeof performance !== 'undefined' && performance.memory) {
      memoryInfo = {
        usedJSHeapMB: Math.round(performance.memory.usedJSHeapSize / 1048576),
        totalJSHeapMB: Math.round(performance.memory.totalJSHeapSize / 1048576)
      };
    }

    if (domCount > 1800) {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'dom_size_warning',
        severity: SEVERITY_LEVELS.MEDIUM,
        summary: `Elevated DOM node count detected (${domCount} nodes).`,
        evidence: { domCount, threshold: 1800 },
        recommendedAction: 'Verify virtualization on long lists and lazy-loaded containers.'
      }));
    } else {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'performance_nominal',
        severity: SEVERITY_LEVELS.INFO,
        summary: `Performance metrics within optimal bounds. DOM node count: ${domCount}.`,
        evidence: { domCount, memory: memoryInfo }
      }));
    }

    return reports;
  }
}
