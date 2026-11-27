/**
 * Beta Agentic Action Bus
 * Allowlisted, deterministic UI action layer for Beta Mode.
 * Allows Mini-Adhy and the Beta Agentic Co-Pilot to observe and act
 * on the portfolio UI safely (human-in-the-loop: never auto-submits forms).
 */

import { readAmbientFlags, writeAmbientFlags } from '../components/beta/BetaAmbientController';

const ALLOWED_SECTIONS = {
  hero: '#hero',
  about: '#about, .about-section',
  skills: '#skills, .skills-section',
  works: '#works, .myworks',
  experience: '#experience, .beta-career-section',
  contact: '#contact, .beta-studio-section',
};

const ALLOWED_FX = new Set([
  'paperGrain',
  'monsoonRain',
  'zenMode',
  'thermalGlow',
  'kicadLayer',
]);

export function dispatchAgenticAction(type, payload = {}) {
  if (typeof window === 'undefined') return null;

  let traceLabel = '';

  switch (type) {
    case 'SCROLL_TO': {
      const key = String(payload.section || '').toLowerCase();
      const selector = ALLOWED_SECTIONS[key];
      if (!selector) return null;
      const el = document.querySelector(selector);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      traceLabel = `Navigated to #${key}`;
      break;
    }

    case 'HIGHLIGHT_SKILL': {
      const skill = String(payload.skill || '').trim();
      if (!skill) return null;
      window.dispatchEvent(new CustomEvent('beta:skill-highlight', { detail: { skill } }));
      const worksEl = document.getElementById('works');
      if (worksEl) worksEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      traceLabel = `Cross-highlighted "${skill}" in Featured Projects`;
      break;
    }

    case 'SET_CAREER_VIEW': {
      window.dispatchEvent(new CustomEvent('beta:career-view', {
        detail: {
          perspective: payload.perspective === 'unfiltered' ? 'unfiltered' : 'formal',
          filter: payload.filter || null,
        },
      }));
      const expEl = document.getElementById('experience');
      if (expEl && payload.scroll !== false) {
        expEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      traceLabel = `Switched Career Rail to ${payload.perspective === 'unfiltered' ? 'Unfiltered' : 'Formal'}`;
      break;
    }

    case 'PREFILL_INQUIRY': {
      window.dispatchEvent(new CustomEvent('beta:inquiry-prefill', { detail: payload }));
      const contactEl = document.getElementById('contact');
      if (contactEl && payload.scroll !== false) {
        contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      traceLabel = `Configured Inquiry Studio (${payload.what || 'Web'} · ${payload.stage || 'Prototype'})`;
      break;
    }

    case 'TOGGLE_LAB_FX': {
      const key = payload.key;
      if (!ALLOWED_FX.has(key)) return null;
      const prev = readAmbientFlags();
      const nextVal = typeof payload.value === 'boolean' ? payload.value : !prev[key];
      const next = { ...prev, [key]: nextVal };
      writeAmbientFlags(next);
      traceLabel = `${nextVal ? 'Enabled' : 'Disabled'} Lab FX: ${key}`;
      break;
    }

    default:
      return null;
  }

  const eventRecord = { type, payload, label: traceLabel, ts: Date.now() };
  window.dispatchEvent(new CustomEvent('beta:agentic-trace', { detail: eventRecord }));
  return eventRecord;
}

/**
 * Deterministic natural-language intent planner for Beta Mode.
 * Parses visitor goals into safe multi-step UI actions.
 */
export function runBetaAgenticIntent(rawQuery = '') {
  const q = String(rawQuery).toLowerCase().trim();
  if (!q) return { matched: false, steps: [], summary: '' };

  const steps = [];
  const run = (type, payload) => {
    const res = dispatchAgenticAction(type, payload);
    if (res) steps.push(res.label);
  };

  // 1. Hardware / ECE / IoT / KiCad / ESP32 intents
  if (/\b(esp32|iot|hardware|embedded|arduino|kicad|pcb|electronics|stm32)\b/.test(q)) {
    const skillMatch = q.match(/\b(esp32|iot|arduino|kicad|python|react|next\.?js|figma|gsap)\b/i);
    const skill = skillMatch ? skillMatch[1] : 'IoT';
    if (/\b(kicad|pcb|hardware|esp32)\b/.test(q)) {
      run('TOGGLE_LAB_FX', { key: 'kicadLayer', value: true });
    }
    run('HIGHLIGHT_SKILL', { skill });
    if (/\b(hire|collab|build|scope|intern|project)\b/.test(q)) {
      run('PREFILL_INQUIRY', { what: 'IoT', pace: '1 Month', stage: 'Prototype', scroll: false });
    }
  }
  // 2. Web / React / Next.js / Full-Stack / AI intents
  else if (/\b(react|next\.?js|node|python|figma|gsap|full.?stack|frontend|web)\b/.test(q)) {
    const skillMatch = q.match(/\b(react|next\.?js|node|python|figma|gsap)\b/i);
    const skill = skillMatch ? skillMatch[1] : 'React';
    run('HIGHLIGHT_SKILL', { skill });
    if (/\b(hire|intern|role|freelance)\b/.test(q)) {
      run('PREFILL_INQUIRY', { what: 'Web', pace: '1 Month', stage: 'Scale', scroll: false });
    }
  }
  // 3. Unfiltered / Behind-the-scenes / Career / Experience intents
  else if (/\b(unfiltered|behind|real story|honest|career|experience|senate|iste|finance)\b/.test(q)) {
    const perspective = /\b(formal|resume)\b/.test(q) ? 'formal' : 'unfiltered';
    run('SET_CAREER_VIEW', { perspective, scroll: true });
  }
  // 4. Scope / Inquiry / Hire / Contact intents
  else if (/\b(scope|hire|contact|collaborate|build|ai agent|prototype|internship)\b/.test(q)) {
    const what = /\b(ai|agent|llm)\b/.test(q) ? 'AI' : /\b(design|ui|figma)\b/.test(q) ? 'Design' : 'Web';
    const pace = /\b(weekend|fast|sprint)\b/.test(q) ? 'Weekend Sprint' : '1 Month';
    const stage = /\b(idea)\b/.test(q) ? 'Idea' : /\b(scale|prod)\b/.test(q) ? 'Scale' : 'Prototype';
    run('PREFILL_INQUIRY', { what, pace, stage, scroll: true });
  }
  // 5. Lab FX intents
  else if (/\b(rain|monsoon)\b/.test(q)) {
    run('TOGGLE_LAB_FX', { key: 'monsoonRain', value: true });
  } else if (/\b(zen|quiet|minimal)\b/.test(q)) {
    run('TOGGLE_LAB_FX', { key: 'zenMode', value: true });
  } else if (/\b(thermal|heat)\b/.test(q)) {
    run('TOGGLE_LAB_FX', { key: 'thermalGlow', value: true });
  } else if (/\b(grain|film)\b/.test(q)) {
    run('TOGGLE_LAB_FX', { key: 'paperGrain', value: true });
  }
  // 6. Direct navigation intents
  else if (/\b(skills|stack|radar|dial)\b/.test(q)) {
    run('SCROLL_TO', { section: 'skills' });
  } else if (/\b(projects|works|portfolio)\b/.test(q)) {
    run('SCROLL_TO', { section: 'works' });
  } else if (/\b(about|bio)\b/.test(q)) {
    run('SCROLL_TO', { section: 'about' });
  }

  return {
    matched: steps.length > 0,
    steps,
    summary: steps.length > 0 ? steps.join(' → ') : '',
  };
}
