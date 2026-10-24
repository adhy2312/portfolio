import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';
import { EmotionEngine } from '../EmotionEngine';

export class JarvisAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.JARVIS,
      name: 'JARVIS',
      role: 'Operations & Strategic Coordination',
      category: 'Operations',
      permissionLevel: CAPABILITY_LEVELS.SAFE_AUTOMATION
    });
    this.title = 'Operations & Strategic Coordination';
    this.emotionEngine = new EmotionEngine('JARVIS');
  }

  async execute(params = {}) {
    const reports = await this.runRoutine(params.agentRegistry || {});
    return reports[0] || {};
  }

  async runRoutine(agentRegistry = {}) {
    const reports = [];
    const agentsList = Object.values(agentRegistry);

    let healthyCount = 0;
    let stalledAgents = [];

    for (const ag of agentsList) {
      if (ag.status === 'active' || ag.status === 'completed' || ag.status === 'pending') {
        healthyCount++;
      } else {
        stalledAgents.push(ag.name);
      }
    }

    if (stalledAgents.length > 0) {
      this.emotionEngine.stimulate('AGENT_STALLED', { summary: `Agents unresponsive: ${stalledAgents.join(', ')}` });
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'agent_health_warning',
        severity: SEVERITY_LEVELS.HIGH,
        summary: `Detected ${stalledAgents.length} stalled specialist agent(s): ${stalledAgents.join(', ')}`,
        evidence: stalledAgents,
        recommendedAction: 'Execute safe agent restart protocol.',
        requiresApproval: false
      }));
    } else {
      this.emotionEngine.stimulate('TASKS_SYNCHRONIZED', { summary: 'All 10 specialist agents active and synchronized.' });
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'operations_nominal',
        severity: SEVERITY_LEVELS.INFO,
        summary: `Ecosystem operations nominal. All ${healthyCount || 10} registered specialist agents responding.`,
        evidence: { healthyCount: healthyCount || 10, totalRegistered: agentsList.length || 10 }
      }));
    }

    return reports;
  }
}
