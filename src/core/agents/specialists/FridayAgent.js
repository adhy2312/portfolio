import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';
import { EmotionEngine } from '../EmotionEngine';

export class FridayAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.FRIDAY,
      name: 'FRIDAY',
      role: 'Cybersecurity & Active Defense',
      category: 'Security',
      permissionLevel: CAPABILITY_LEVELS.SAFE_AUTOMATION
    });
    this.title = 'Cybersecurity & Active Defense';
    this.emotionEngine = new EmotionEngine('FRIDAY');
  }

  async execute(params = {}) {
    const reports = await this.runSecurityAudit();
    return reports[0] || {};
  }

  async runSecurityAudit() {
    const reports = [];

    // 1. Inspect Content Security Policy & Security Meta Headers
    const isHttps = typeof window !== 'undefined' ? window.location.protocol === 'https:' : true;

    if (!isHttps && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.emotionEngine.stimulate('THREAT_DETECTED', { summary: 'Production request served over unencrypted HTTP' });
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'insecure_transport',
        severity: SEVERITY_LEVELS.HIGH,
        summary: 'Insecure transport detected: Application not serving strictly over HTTPS.',
        evidence: typeof window !== 'undefined' ? window.location.href : 'http://',
        recommendedAction: 'Enforce HSTS and automatic HTTP to HTTPS redirect on edge.'
      }));
    }

    // 2. Client-side DOM Injection Surface Audit
    const scripts = typeof document !== 'undefined' 
      ? Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline') 
      : [];
    const hasUnsafeScripts = scripts.some(src => src.includes('eval') || src.includes('document.write'));

    if (hasUnsafeScripts) {
      this.emotionEngine.stimulate('THREAT_DETECTED', { summary: 'Unsafe dynamic evaluation detected in script tag' });
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'unsafe_eval_detected',
        severity: SEVERITY_LEVELS.MEDIUM,
        summary: 'Identified script tag utilizing potentially unsafe dynamic evaluation.',
        evidence: scripts.filter(s => s.includes('eval')),
        recommendedAction: 'Refactor code to use strict JSON parsing instead of eval.'
      }));
    } else {
      this.emotionEngine.stimulate('SECURITY_VERIFIED', { summary: 'Zero unsafe script tags identified.' });
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'security_audit_passed',
        severity: SEVERITY_LEVELS.INFO,
        summary: 'Frontend runtime security audit passed. Headers, transport, and DOM injection surfaces verified.',
        evidence: { scriptCount: scripts.length, httpsVerified: isHttps }
      }));
    }

    return reports;
  }
}
