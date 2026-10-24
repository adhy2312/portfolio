import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';

export class EdithAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.EDITH,
      name: 'EDITH',
      role: 'Infrastructure & Reliability',
      category: 'Infrastructure',
      permissionLevel: CAPABILITY_LEVELS.READ
    });
    this.title = 'Infrastructure & Reliability';
  }

  async execute(params = {}) {
    const reports = await this.checkInfrastructure();
    return reports[0] || {};
  }

  async checkInfrastructure() {
    const reports = [];

    const endpoints = [
      { name: 'Gemini AI Proxy', url: '/api/gemini' },
      { name: 'Spotify Realtime API', url: '/api/spotify' }
    ];

    const results = [];
    for (const ep of endpoints) {
      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      try {
        const res = await fetch(ep.url, { method: 'GET', cache: 'no-store' });
        const latency = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0);
        results.push({ name: ep.name, status: res.status, latency });
      } catch (e) {
        results.push({ name: ep.name, status: 'NETWORK_ERROR', latency: null });
      }
    }

    const failed = results.filter(r => r.status === 'NETWORK_ERROR' || r.status >= 500);
    if (failed.length > 0) {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'infrastructure_degraded',
        severity: SEVERITY_LEVELS.HIGH,
        summary: `Infrastructure service alert: ${failed.map(f => f.name).join(', ')} degraded.`,
        evidence: failed,
        recommendedAction: 'Engage bounded exponential retry and check Vercel runtime logs.'
      }));
    } else {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'uptime_healthy',
        severity: SEVERITY_LEVELS.INFO,
        summary: 'All edge serverless endpoints operational with healthy round-trip latencies.',
        evidence: results
      }));
    }

    return reports;
  }
}
