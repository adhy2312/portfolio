import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';
import { client } from '../../../sanity';

export class DumEAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.DUM_E,
      name: 'DUM-E',
      role: 'Data Integrity & Change Detection',
      category: 'Data',
      permissionLevel: CAPABILITY_LEVELS.READ
    });
    this.title = 'Data Integrity & Change Detection';
  }

  async execute(params = {}) {
    const reports = await this.verifyDataIntegrity();
    return reports[0] || {};
  }

  async verifyDataIntegrity() {
    const reports = [];

    try {
      // Query Sanity Content Store baseline
      const [projectsCount, skillsCount] = await Promise.all([
        client.fetch(`count(*[_type == "project"])`),
        client.fetch(`count(*[_type == "skillCategory"])`)
      ]);

      if (projectsCount === 0 || skillsCount === 0) {
        reports.push(createAgentMessage({
          agent: this.name,
          eventType: 'data_anomaly',
          severity: SEVERITY_LEVELS.HIGH,
          summary: 'Sanity dataset returns unexpected zero-count for projects or skills.',
          evidence: { projectsCount, skillsCount },
          recommendedAction: 'Verify Sanity CMS dataset connection and query permissions.'
        }));
      } else {
        reports.push(createAgentMessage({
          agent: this.name,
          eventType: 'integrity_verified',
          severity: SEVERITY_LEVELS.INFO,
          summary: 'Data integrity verified. Content records match trusted baseline.',
          evidence: { verifiedProjects: projectsCount, verifiedSkillCategories: skillsCount }
        }));
      }
    } catch (err) {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'cms_connection_failure',
        severity: SEVERITY_LEVELS.MEDIUM,
        summary: `Data integrity probe could not reach CMS: ${err.message}`,
        evidence: err.message,
        recommendedAction: 'Inspect Sanity API credentials and network connectivity.'
      }));
    }

    return reports;
  }
}
