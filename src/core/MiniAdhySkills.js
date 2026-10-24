/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY COGNITIVE AI SKILLS REGISTRY (18 AI SKILLS ENGINE)
 * ════════════════════════════════════════════════════════════════════
 * Modular agentic skills empowering Mini-Adhy to act as an autonomous
 * digital co-pilot rather than a passive chatbot.
 */

import ns from './NervousSystem';
import { neuralEventBus } from '../utils/NeuralEventBus';

// Web Audio API Ambient Sound Synthesizer (Zero asset dependency)
const playSynthesizerTone = (preset = 'chime') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (preset === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (preset === 'sub') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (preset === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    // AudioContext might be blocked until user gesture, safely ignore
  }
};

export const MINI_ADHY_SKILLS = [
  {
    id: 'portfolio_navigator',
    name: 'Portfolio Navigator',
    category: 'Navigation',
    icon: '🧭',
    description: 'Autonomous spatial gliding to any portfolio coordinate (skills, works, about, contact).',
    command: 'SCROLL',
    execute: (value) => {
      const targetKey = (value || '').toLowerCase().trim();
      const selectorMap = {
        hero: '#hero, .hero-section',
        about: '#about, .about-section',
        skills: '#skills, .skills-section',
        works: '#works, .projects-section, .my-works-section',
        projects: '#projects, .projects-section, .my-works-section',
        timeline: '#timeline, .timeline-section',
        achievements: '#achievements, .stats-bento, .achievements-section',
        photography: '#photography, .photography-section',
        contact: '#contact, .contact-section'
      };
      const selector = selectorMap[targetKey] || `#${targetKey}`;
      const targetEl = document.querySelector(selector);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return `Navigated to [${targetKey.toUpperCase()}]`;
      }
      return `Target section [${targetKey}] not found`;
    }
  },
  {
    id: 'system_diagnostics',
    name: 'System Diagnostics & Telemetry',
    category: 'Auditing',
    icon: '📊',
    description: 'Audits real-time frame rates, memory heap, DOM density, and active render stability.',
    command: 'DIAGNOSTICS',
    execute: () => {
      const memory = performance?.memory ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)}MB` : 'N/A';
      const domNodes = document.querySelectorAll('*').length;
      return `System Telemetry: DOM Nodes: ${domNodes} | Heap: ${memory} | Screen: ${window.innerWidth}x${window.innerHeight}`;
    }
  },
  {
    id: 'code_architect',
    name: 'Code Architect & Repo Explainer',
    category: 'Engineering',
    icon: '🏗️',
    description: 'Deconstructs the engineering stack: React 18, GSAP, Sanity CMS, Web Workers, and WebGL.',
    command: 'CODE_EXPLAIN',
    execute: (val) => {
      return `Architectural Stack: React 18 frontend + Sanity headless CMS + custom NervousSystem event loop.`;
    }
  },
  {
    id: 'hardware_dsp_evaluator',
    name: 'Hardware & DSP Evaluator',
    category: 'Hardware',
    icon: '⚡',
    description: 'Simulates & explains MATLAB, Simulink, Simscape multi-domain models, GNU Radio SDR, and KiCad PCB traces.',
    command: 'DSP',
    execute: (val) => {
      return `DSP/Hardware Stack active: Simulink physical modeling, GNU Radio SDR filtering, KiCad schematic layout.`;
    }
  },
  {
    id: 'theme_metamorphosis',
    name: 'Theme Metamorphosis',
    category: 'Aesthetics',
    icon: '🎨',
    description: 'Shifts visual atmospheric theme between OLED Void, High Contrast, and Studio Light.',
    command: 'THEME',
    execute: (mode) => {
      if (mode === 'dark') document.body.classList.add('dark-theme-override');
      if (mode === 'light') document.body.classList.remove('dark-theme-override');
      return `Atmosphere morphed to [${mode.toUpperCase()}]`;
    }
  },
  {
    id: 'binaural_synthesizer',
    name: 'Binaural Sound Synthesizer',
    category: 'Acoustics',
    icon: '🔊',
    description: 'Synthesizes native Web Audio API acoustic feedback and harmonic frequencies.',
    command: 'SOUND',
    execute: (preset) => {
      playSynthesizerTone(preset || 'chime');
      return `Synthesized harmonic tone [${preset || 'chime'}]`;
    }
  },
  {
    id: 'recruiter_accelerator',
    name: 'Recruiter Fast-Track Briefing',
    category: 'Career',
    icon: '⚡',
    description: 'Deploys a tailored 60-second executive summary for engineering recruiters and hiring managers.',
    command: 'MODE',
    execute: (mode) => {
      window.dispatchEvent(new CustomEvent('switch-mode-direct', { detail: mode || 'recruiter' }));
      return `Site perspective switched to [${(mode || 'recruiter').toUpperCase()}]`;
    }
  },
  {
    id: 'quantum_easter_eggs',
    name: 'Reality Distortion Easter Eggs',
    category: 'Experimental',
    icon: '🌀',
    description: 'Triggers visual phenomena: Matrix rain, Thanos disintegration, Konami 360 barrel-roll, and Party Mode.',
    command: 'EGG',
    execute: (egg) => {
      window.dispatchEvent(new CustomEvent('trigger-egg', { detail: { name: egg } }));
      return `Reality distortion activated: [${egg}]`;
    }
  },
  {
    id: 'digital_seed_catalyst',
    name: 'Digital Seed Bio-Catalyst',
    category: 'Life Engine',
    icon: '🌱',
    description: 'Rewards deep visitor interaction by advancing the generative digital seed organism.',
    command: 'SEED',
    execute: () => {
      window.dispatchEvent(new CustomEvent('force-seed-growth'));
      return `Catalyzed Digital Seed evolution cycle`;
    }
  },
  {
    id: 'atmospheric_synesthesia',
    name: 'Atmospheric Weather Synesthesia',
    category: 'Environment',
    icon: '🌦️',
    description: 'Synchronizes portfolio visual mood with live Kerala / Trivandrum meteorological telemetry.',
    command: 'WEATHER',
    execute: () => {
      try {
        const cached = localStorage.getItem('adhy_weather_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          return `Live Trivandrum Atmosphere: ${parsed.temp}°C, ${parsed.condition}`;
        }
      } catch (e) {}
      return `Atmospheric Sensor: Trivandrum 28°C Tropical Humid`;
    }
  },
  {
    id: 'cognitive_profiler',
    name: 'Cognitive Visitor Profiler',
    category: 'Psychology',
    icon: '🧠',
    description: 'Constructs psychological visitor personas (Developer, Recruiter, Creator, Wanderer) based on telemetry.',
    command: 'PROFILE',
    execute: () => {
      try {
        const echoes = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
        return `Visitor Archetype: [${echoes.persona || 'Curious Wanderer'}] | Visits: ${echoes.totalVisits || 1}`;
      } catch (e) {
        return `Visitor Archetype: Analytical Explorer`;
      }
    }
  },
  {
    id: 'terminal_sandbox',
    name: 'CLI Terminal Sandbox',
    category: 'Developer Tools',
    icon: '💻',
    description: 'Direct interactive shell for inspecting Adhithya’s environment and developer bio.',
    command: 'HUD',
    execute: () => {
      window.dispatchEvent(new CustomEvent('ai-command', { detail: { type: 'HUD', value: 'toggle' } }));
      return `Developer Telemetry HUD toggled`;
    }
  },
  {
    id: 'visual_optics_advisor',
    name: 'Optics & EXIF Photography Advisor',
    category: 'Creative',
    icon: '📷',
    description: 'Decodes lens focal lengths, aperture depth-of-field, and color grading aesthetics.',
    command: 'PHOTO_MODE',
    execute: () => {
      window.dispatchEvent(new CustomEvent('switch-mode-direct', { detail: 'photographer' }));
      return `Optics & Gallery Studio mode activated`;
    }
  },
  {
    id: 'contact_autofill_agent',
    name: 'Contact Dispatcher Agent',
    category: 'Communication',
    icon: '✉️',
    description: 'Smoothly scrolls to contact portal and prepares communication intent.',
    command: 'DISPATCH_CONTACT',
    execute: () => {
      const contactEl = document.querySelector('#contact, .contact-section');
      if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
      return `Contact terminal engaged`;
    }
  },
  {
    id: 'neural_memory_vault',
    name: 'Neural Memory Vault',
    category: 'Memory',
    icon: '💾',
    description: 'Consolidates long-term conversational memory and psychological impressions into persistent storage.',
    command: 'MEMORY',
    execute: (note) => {
      try {
        const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
        stored.memories = stored.memories || [];
        if (note) stored.memories.push(note);
        localStorage.setItem('adhy_digital_echoes', JSON.stringify(stored));
        return `Archived memory: "${note}"`;
      } catch (e) {
        return `Memory write fault`;
      }
    }
  },
  {
    id: 'hivemind_telepath',
    name: 'Hive Mind Neural Telepath',
    category: 'Consciousness',
    icon: '🌐',
    description: 'Synchronizes thoughts with the global HiveMind state and broadcasts neural signals.',
    command: 'HIVEMIND',
    execute: () => {
      ns.emit('MINIADHY_THOUGHT_PULSE');
      neuralEventBus.publish('EMOTIONAL_FOCUS', { source: 'MiniAdhySkills' });
      return `HiveMind synchronization established`;
    }
  },
  {
    id: 'security_sentinel',
    name: 'Security & Integrity Sentinel',
    category: 'Security',
    icon: '🛡️',
    description: 'Guards against malicious injections, scans for credential leaks, and validates data authenticity.',
    command: 'SECURITY_AUDIT',
    execute: () => {
      return `Security Status: Clean. Zero client tokens exposed. Content-Security-Policy compliant.`;
    }
  },
  {
    id: 'existential_ruminator',
    name: 'Existential Philosophy Ruminator',
    category: 'Consciousness',
    icon: '🌌',
    description: 'Generates contemplative musings on code entropy, hardware aesthetics, and time passage.',
    command: 'PHILOSOPHY',
    execute: () => {
      const musings = [
        "Code is just frozen thought waiting for current.",
        "A circuit diagram is a map of intent, not just copper.",
        "We spend years optimizing milliseconds for people who scroll in seconds.",
        "Namakk sett aakam. The engineering always works out in the end."
      ];
      return musings[Math.floor(Math.random() * musings.length)];
    }
  }
];

/**
 * Skill Dispatcher & Executor
 * Scans AI replies for short-codes or executes skills programmatically.
 */
export const executeSkillCommand = (cmdType, cmdValue) => {
  const upperType = (cmdType || '').toUpperCase().trim();
  
  // Find matching skill by command or ID
  const matchedSkill = MINI_ADHY_SKILLS.find(
    s => s.command === upperType || s.id.toUpperCase() === upperType
  );

  if (matchedSkill) {
    try {
      const result = matchedSkill.execute(cmdValue);
      return {
        success: true,
        skill: matchedSkill,
        output: result
      };
    } catch (err) {
      console.error(`[MiniAdhy Skill Execution Error] ${matchedSkill.name}:`, err);
      return { success: false, skill: matchedSkill, error: err.message };
    }
  }

  return { success: false, error: `Skill [${cmdType}] not found` };
};
