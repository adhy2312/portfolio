import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';

export class UAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.U,
      name: 'U',
      role: 'Data Breach & Privacy Guardian',
      category: 'Security',
      permissionLevel: CAPABILITY_LEVELS.ANALYZE
    });
    this.title = 'Data Breach & Privacy Guardian';
  }

  async execute(params = {}) {
    const reports = await this.scanForSensitiveLeaks();
    return reports[0] || {};
  }

  async scanForSensitiveLeaks() {
    const reports = [];

    const suspiciousKeys = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (/api[_-]?key|secret|password|private_key|token/i.test(key) && !key.startsWith('np_')) {
          suspiciousKeys.push(key);
        }
      }
    }

    const cookieString = typeof document !== 'undefined' ? document.cookie : '';
    const hasExposedTokens = /token=|secret=|jwt=/i.test(cookieString);

    if (suspiciousKeys.length > 0 || hasExposedTokens) {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'client_storage_risk',
        severity: SEVERITY_LEVELS.HIGH,
        summary: `Detected potentially sensitive keys in client storage: ${suspiciousKeys.join(', ')}`,
        evidence: suspiciousKeys,
        recommendedAction: 'Migrate sensitive tokens to HTTP-only secure cookies.'
      }));
    } else {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'privacy_audit_nominal',
        severity: SEVERITY_LEVELS.INFO,
        summary: 'Zero exposed credentials or sensitive API secrets found in client runtime memory or storage.',
        evidence: { auditedStorageKeys: typeof localStorage !== 'undefined' ? localStorage.length : 0 }
      }));
    }

    return reports;
  }
}
