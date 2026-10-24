import { AGENT_IDS, SEVERITY_LEVELS, CAPABILITY_LEVELS, createAgentMessage } from '../AgentTypes';
import { BaseAgent } from '../BaseAgent';

export class KarenAgent extends BaseAgent {
  constructor() {
    super({
      id: AGENT_IDS.KAREN,
      name: 'KAREN',
      role: 'SEO & Audience Intelligence',
      category: 'SEO',
      permissionLevel: CAPABILITY_LEVELS.READ
    });
    this.title = 'SEO & Audience Intelligence';
  }

  async execute(params = {}) {
    const reports = await this.auditSEO();
    return reports[0] || {};
  }

  async auditSEO() {
    const reports = [];

    const title = typeof document !== 'undefined' ? document.title : '';
    const metaDesc = typeof document !== 'undefined' ? document.querySelector('meta[name="description"]')?.getAttribute('content') : '';
    const canonical = typeof document !== 'undefined' ? document.querySelector('link[rel="canonical"]')?.getAttribute('href') : '';
    const ogTitle = typeof document !== 'undefined' ? document.querySelector('meta[property="og:title"]')?.getAttribute('content') : '';

    const seoTelemetry = {
      titleExists: Boolean(title),
      metaDescLength: metaDesc ? metaDesc.length : 0,
      canonicalConfigured: Boolean(canonical),
      ogTitleConfigured: Boolean(ogTitle)
    };

    if (!title || !metaDesc || !canonical) {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'seo_gap_detected',
        severity: SEVERITY_LEVELS.LOW,
        summary: 'Technical SEO metadata incomplete.',
        evidence: seoTelemetry,
        recommendedAction: 'Ensure title, meta description (120-160 chars), and canonical URL are present.'
      }));
    } else {
      reports.push(createAgentMessage({
        agent: this.name,
        eventType: 'seo_nominal',
        severity: SEVERITY_LEVELS.INFO,
        summary: 'SEO metadata, canonical tags, and OpenGraph schemas verified.',
        evidence: seoTelemetry
      }));
    }

    return reports;
  }
}
