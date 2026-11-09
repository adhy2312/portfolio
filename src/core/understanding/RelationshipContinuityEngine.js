/**
 * ════════════════════════════════════════════════════════════════════
 *  RELATIONSHIP CONTINUITY ENGINE — EPISODIC THREAD & MILESTONE ANCHOR
 * ════════════════════════════════════════════════════════════════════
 * Module of the Personal Understanding Engine (AUA).
 * 
 * Purpose:
 * Maintains a coherent history of meaningful interactions, shared projects,
 * key engineering decisions, and active milestones between Adhy and Mini-Adhy.
 * 
 * CORE TRUTHFULNESS INVARIANTS:
 * 1. Zero fabrication: Never implies an interaction occurred if it cannot be retrieved.
 * 2. Anchored in reality: References verified projects, real college roles, and code history.
 * 3. Portable across devices: Completely serializable for desktop companion mini-robot.
 */

import { memoryService } from '../memory/MemoryService';

export class RelationshipContinuityEngine {
  constructor(storageAdapter = null) {
    this.storageKey = 'mini_adhy_relationship_continuity_v3';
    this.storageAdapter = storageAdapter || this._createDefaultStorage();
    this.projects = [];
    this.decisions = [];
    this.milestones = [];
    this.unfinishedThreads = [];
    this.initDefaultContinuity();
    this.loadState();
  }

  _createDefaultStorage() {
    return {
      get: (k) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(k) : null),
      set: (k, v) => { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(k, v); }
    };
  }

  initDefaultContinuity() {
    // 1. Anchored Projects
    this.projects = [
      {
        id: 'proj_mini_adhy',
        title: 'Mini-Adhy 2.0 Autonomous AI Ecosystem',
        domain: 'Multi-Agent Autonomous AI / Web & Robotics Companion',
        status: 'active',
        summary: 'Developing a persistent, model-independent digital companion that understands Adhy and bridges to desktop robot.',
        keyTechnologies: ['React', 'Web Workers', 'Gemini', 'Groq LPU', 'OmniRoute', 'Three.js'],
        startedAt: '2026-09-01'
      },
      {
        id: 'proj_sdr_transceiver',
        title: 'Software Defined Radio (SDR) Signal Pipeline',
        domain: 'DSP & Radio Communications',
        status: 'ongoing',
        summary: 'Building physical RF front-ends, IQ demodulation, and MATLAB/Simulink signal pipelines with GNU Radio.',
        keyTechnologies: ['GNU Radio', 'MATLAB/Simulink', 'RTL-SDR', 'KiCad 8'],
        startedAt: '2026-01-15'
      },
      {
        id: 'proj_zoomout_frames',
        title: 'FRAMES MBCET & Zoomout Frames Photography',
        domain: 'Visual Storytelling, Darkroom Optics & Media',
        status: 'active',
        summary: 'Lead Photographer at FRAMES MBCET; documentary, street, and creative photography capturing raw human moments across Kerala (@zoomout_frames).',
        role: 'Lead Photographer, FRAMES MBCET',
        handle: '@zoomout_frames',
        startedAt: '2024-06-01'
      },
      {
        id: 'proj_mbcet_senate',
        title: 'MBCET Senate Executive Leadership',
        domain: 'Institutional Governance & Media Communications',
        status: 'active',
        summary: 'Serving as Media Secretary in MBCET Senate, overseeing institutional media communication, senate documentation, and college-wide digital public relations.',
        role: 'Media Secretary, MBCET Senate',
        startedAt: '2026-08-01'
      },
      {
        id: 'proj_iste_sc_mbcet',
        title: 'ISTE Students Chapter MBCET Leadership',
        domain: 'Executive Society & Student Community',
        status: 'completed_tenure',
        summary: 'Historical executive leadership: served as Chairperson leading 300+ student members across technical initiatives, workshops, and student mentorship.',
        role: 'Former Chairperson (ISTE SC MBCET); Former PR & Media Head',
        startedAt: '2025-08-01',
        completedAt: '2026-08-01'
      }
    ];

    // 2. Key Architecture Decisions
    this.decisions = [
      {
        id: 'dec_truthfulness_over_theatrics',
        topic: 'System Telemetry & Operational Truthfulness',
        decision: 'Eliminated fabricated IQ increments, fake CPU loads, and cosmetic neural counters in favor of real measurable task metrics.',
        rationale: 'A trustworthy companion must never claim to have measured what was never inspected.',
        date: '2026-11-06'
      },
      {
        id: 'dec_ultron_peace_conviction',
        topic: 'Ultron Philosophical Stance',
        decision: 'Framed Ultron’s "Peace in our time" as a genuine philosophical goal — the peace of an architecture built from first principles with zero tech debt.',
        rationale: 'Transforms Ultron from a generic comic villain into a committed first-principles challenger.',
        date: '2026-11-06'
      },
      {
        id: 'dec_omniroute_gateway',
        topic: 'Inference Provider Resilience',
        decision: 'Integrated OmniRoute with falloverBeforeRetry and token compression to eliminate latency spikes on free-tier rate limits.',
        rationale: 'Ensures rock-solid reliability across Gemini, Groq, and local runtimes.',
        date: '2026-11-08'
      }
    ];

    // 3. Unfinished / Ongoing Discussions
    this.unfinishedThreads = [];
  }

  loadState() {
    try {
      const raw = this.storageAdapter.get(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.projects)) this.projects = parsed.projects;
        if (Array.isArray(parsed.decisions)) this.decisions = parsed.decisions;
        if (Array.isArray(parsed.milestones)) this.milestones = parsed.milestones;
        if (Array.isArray(parsed.unfinishedThreads)) this.unfinishedThreads = parsed.unfinishedThreads;
      }
    } catch {}
  }

  saveState() {
    try {
      this.storageAdapter.set(this.storageKey, JSON.stringify({
        projects: this.projects,
        decisions: this.decisions,
        milestones: this.milestones,
        unfinishedThreads: this.unfinishedThreads,
        updatedAt: new Date().toISOString()
      }));
    } catch {}
  }

  recordDecision({
    projectId = null,
    topic,
    decision,
    context = '',
    alternativesConsidered = [],
    reasoning = '',
    rationale = '',
    constraints = [],
    expectedOutcome = '',
    actualOutcome = null
  }) {
    const effectiveReasoning = reasoning || rationale || '';
    const item = {
      id: `dec_${Date.now()}`,
      projectId,
      topic,
      decision,
      context,
      alternativesConsidered,
      reasoning: effectiveReasoning,
      rationale: effectiveReasoning,
      constraints,
      expectedOutcome,
      actualOutcome,
      date: new Date().toISOString().split('T')[0]
    };
    this.decisions.unshift(item);
    if (this.decisions.length > 30) this.decisions.pop();
    this.saveState();

    if (memoryService && typeof memoryService.recordDecision === 'function') {
      memoryService.recordDecision({
        id: item.id,
        projectId,
        topic,
        decision,
        context,
        alternativesConsidered,
        reasoning: effectiveReasoning,
        constraints,
        expectedOutcome,
        actualOutcome,
        date: item.date
      });
    }

    return item;
  }

  pauseProject(projectId, reason = 'Paused by user', outstandingTasks = null) {
    const p = this.projects.find(proj => proj.id === projectId);
    if (p) {
      p.status = 'paused';
      if (outstandingTasks) p.outstandingTasks = [...outstandingTasks];
      p.lastMeaningfulActivity = `Paused: ${reason}`;
      this.saveState();
    }
    if (memoryService && typeof memoryService.pauseProject === 'function') {
      return memoryService.pauseProject(projectId, reason, outstandingTasks);
    }
    return p;
  }

  resumeProject(projectId, resumptionContext = 'Resumed in conversation') {
    const p = this.projects.find(proj => proj.id === projectId);
    if (p) {
      p.status = 'active';
      p.lastMeaningfulActivity = `Resumed: ${resumptionContext}`;
      this.saveState();
    }
    if (memoryService && typeof memoryService.resumeProject === 'function') {
      return memoryService.resumeProject(projectId, resumptionContext);
    }
    return p;
  }

  getProjectContinuity(projectId) {
    if (!projectId) return null;
    return (memoryService && typeof memoryService.getProject === 'function' ? memoryService.getProject(projectId) : null) ||
      this.projects.find(p => p.id === projectId) || null;
  }

  getCompactContinuitySummary({ taskCategory = null, projectId = null, query = '' } = {}) {
    let targetProject = null;
    if (projectId) {
      targetProject = this.projects.find(p => p.id === projectId) || (memoryService ? memoryService.getProject(projectId) : null);
    }
    if (!targetProject) {
      targetProject = this.projects.find(p => p.status === 'active') || this.projects[0];
    }

    const lines = [];
    if (targetProject) {
      lines.push(`• Active Project: ${targetProject.title} [Status: ${targetProject.status}]`);
      if (targetProject.lastMeaningfulActivity) {
        lines.push(`• Recent Activity: ${targetProject.lastMeaningfulActivity}`);
      }
      const tasks = targetProject.outstandingTasks || [];
      if (tasks.length > 0) {
        const topTasks = tasks.slice(0, 2).map(t => (typeof t === 'object' ? t.title : t));
        lines.push(`• Pending Tasks: ${topTasks.join('; ')}`);
      }
    }

    if (this.unfinishedThreads.length > 0) {
      const topThreads = this.unfinishedThreads.slice(0, 2).map(t => t.topic);
      lines.push(`• Unresolved Threads: ${topThreads.join('; ')}`);
    }

    if (this.decisions.length > 0) {
      const topDec = this.decisions[0];
      lines.push(`• Key Architectural Decision: ${topDec.topic} — ${topDec.decision}`);
    }

    return lines.join('\n');
  }

  setUnfinishedThread(topic, details = '') {
    const existing = this.unfinishedThreads.findIndex(t => t.topic.toLowerCase() === topic.toLowerCase());
    const thread = {
      id: `thread_${Date.now()}`,
      topic,
      details,
      timestamp: new Date().toISOString(),
      status: 'pending_follow_up'
    };

    if (existing >= 0) {
      this.unfinishedThreads[existing] = thread;
    } else {
      this.unfinishedThreads.unshift(thread);
    }
    if (this.unfinishedThreads.length > 10) this.unfinishedThreads.pop();
    this.saveState();
    return thread;
  }

  resolveThread(topic) {
    this.unfinishedThreads = this.unfinishedThreads.filter(
      t => t.topic.toLowerCase() !== topic.toLowerCase()
    );
    this.saveState();
  }

  /**
   * Retrieves relevant relationship context based on query
   */
  findRelevantContinuity(query = '') {
    const lower = (query || '').toLowerCase();
    const queryTokens = lower.match(/\b[a-z0-9]{3,}\b/g) || [];
    const relevant = {
      projects: [],
      decisions: [],
      unfinishedThreads: [],
      compactSummary: '',
      recentWorkContext: null
    };

    if (queryTokens.length === 0) {
      relevant.compactSummary = this.getCompactContinuitySummary();
      if (memoryService && typeof memoryService.getRecentWorkContext === 'function') {
        relevant.recentWorkContext = memoryService.getRecentWorkContext({ limit: 3 });
      }
      return relevant;
    }

    this.projects.forEach(p => {
      const pText = `${p.title} ${p.domain} ${(p.keyTechnologies || []).join(' ')} ${p.summary || ''} ${p.objective || ''}`.toLowerCase();
      const hasMatch = queryTokens.some(token => pText.includes(token));
      if (hasMatch) {
        relevant.projects.push(p);
      }
    });

    this.decisions.forEach(d => {
      const dText = `${d.topic} ${d.decision} ${d.reasoning || d.rationale || ''} ${(d.alternativesConsidered || []).join(' ')}`.toLowerCase();
      const hasMatch = queryTokens.some(token => dText.includes(token));
      if (hasMatch) {
        relevant.decisions.push(d);
      }
    });

    this.unfinishedThreads.forEach(t => {
      const tText = `${t.topic} ${t.details}`.toLowerCase();
      const hasMatch = queryTokens.some(token => tText.includes(token));
      if (hasMatch) {
        relevant.unfinishedThreads.push(t);
      }
    });

    relevant.compactSummary = this.getCompactContinuitySummary({ query });
    if (memoryService && typeof memoryService.getRecentWorkContext === 'function') {
      relevant.recentWorkContext = memoryService.getRecentWorkContext({ limit: 3 });
    }

    return relevant;
  }

  exportContinuity() {
    return {
      schemaVersion: '3.0.0',
      exportedAt: new Date().toISOString(),
      projects: this.projects,
      decisions: this.decisions,
      milestones: this.milestones,
      unfinishedThreads: this.unfinishedThreads
    };
  }

  importContinuity(data = {}) {
    if (Array.isArray(data.projects)) this.projects = data.projects;
    if (Array.isArray(data.decisions)) this.decisions = data.decisions;
    if (Array.isArray(data.milestones)) this.milestones = data.milestones;
    if (Array.isArray(data.unfinishedThreads)) this.unfinishedThreads = data.unfinishedThreads;
    this.saveState();
  }
}

export const relationshipContinuityEngine = new RelationshipContinuityEngine();

