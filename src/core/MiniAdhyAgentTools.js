/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY AGENT TOOLS & SECURE CAPABILITIES LAYER
 * ════════════════════════════════════════════════════════════════════
 * Controlled, executable agent tools for Mini-Adhy.
 * Rather than letting the LLM hallucinate or guess, the Agent Router
 * invokes these verified tool functions to retrieve grounded ground-truth data.
 */

import { client } from '../sanity';

// Verified Ground-Truth Knowledge Base (Guarantees zero hallucination even offline)
export const VERIFIED_PORTFOLIO_DATA = {
  profile: {
    name: 'Adhithya Mohan (Adhy)',
    location: 'Trivandrum, Kerala, India',
    education: 'B.Tech in Electronics and Communication Engineering (ECE) @ Mar Baselios College of Engineering and Technology (MBCET), APJ Abdul Kalam Technological University',
    roles: [
      'Media Secretary @ MBCET College Senate',
      'Co-Founder @ Finance Club MBCET',
      'Full-Stack Developer & Hardware Engineer'
    ],
    contact: {
      email: 'adhithyamohan.work@gmail.com',
      github: 'https://github.com/adhy2312',
      linkedin: 'https://linkedin.com/in/adhithyamohan',
      instagram: 'https://instagram.com/adhy.lens'
    }
  },
  skills: {
    frontend: ['React 19', 'Next.js', 'Vanilla CSS / Glassmorphism', 'GSAP', 'WebGL / Three.js', 'Lenis Scroll'],
    embeddedAndHardware: ['MATLAB', 'Simulink', 'Simscape', 'GNU Radio (SDR)', 'KiCad PCB Design', 'STM32', 'IoT Architectures'],
    backendAndCloud: ['Node.js', 'Express', 'Sanity CMS', 'Supabase', 'Vercel Serverless', 'Python'],
    learningHorizon: ['Advanced Linux Internals', 'Cross-Platform Mobile App Dev', 'Cybersecurity & Offensive Auditing']
  },
  experience: [
    {
      role: 'Media Secretary',
      organization: 'MBCET College Senate',
      period: '2024 – Present',
      highlight: 'Spearheaded college-wide media production, digital visual branding, and broadcast pipelines across campus initiatives.'
    },
    {
      role: 'Co-Founder & Tech Lead',
      organization: 'Finance Club MBCET',
      period: '2024 – Present',
      highlight: 'Established financial analytics workshops, algorithmic trading seminars, and digital platform infrastructure.'
    },
    {
      role: 'Electronics & Communication Engineering',
      organization: 'MBCET / KTU',
      period: '2023 – 2027',
      highlight: 'Deep modeling of hardware physical systems in Simulink/Simscape and RF signal processing using GNU Radio SDR.'
    }
  ],
  photography: {
    awards: '4x Competition Winner (College & Inter-collegiate Cultural Fests)',
    gear: 'Sony Alpha Full-Frame mirrorless + Prime 50mm f/1.2 & 85mm f/1.8 glass',
    styles: ['Portraits', 'Street & Urban Life', 'Architectural Light', 'Landscape']
  }
};

// Dynamic Sanity Cache store updated in background
let liveProjectsCache = [];
let liveKnowledgeCache = [];

export const syncSanityCache = async () => {
  try {
    const [projects, knowledge] = await Promise.all([
      client.fetch(`*[_type == "project"] { title, description, category, tags, demoUrl, githubUrl }`),
      client.fetch(`*[_type == "chatbotKnowledge" && isActive != false] { category, title, content }`)
    ]);
    if (projects?.length) liveProjectsCache = projects;
    if (knowledge?.length) liveKnowledgeCache = knowledge;
  } catch (err) {
    // Graceful fallback to verified in-memory ground-truth
  }
};

// Initialize cache sync
syncSanityCache();

/**
 * ── CONTROLLED AGENT TOOLS ───────────────────────────────────────────
 */
export const AgentTools = {
  // 1. Search Portfolio Knowledge Base
  searchPortfolio: (query = '') => {
    const q = query.toLowerCase().trim();
    if (!q) return 'Please specify a search topic.';

    const matchedProjects = liveProjectsCache.filter(p => 
      p.title?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q) || 
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );

    const matchedKnowledge = liveKnowledgeCache.filter(k =>
      k.title?.toLowerCase().includes(q) ||
      k.content?.toLowerCase().includes(q)
    );

    let output = '';
    if (matchedProjects.length > 0) {
      output += `\nMatched Projects (${matchedProjects.length}):\n` + 
        matchedProjects.map(p => `• ${p.title} (${p.category}): ${p.description}`).join('\n');
    }
    if (matchedKnowledge.length > 0) {
      output += `\nMatched Knowledge Items:\n` +
        matchedKnowledge.map(k => `• ${k.title}: ${k.content}`).join('\n');
    }

    if (!output) {
      // Fallback search across static ground-truth
      const skillsMatch = Object.entries(VERIFIED_PORTFOLIO_DATA.skills).filter(([cat, list]) =>
        cat.toLowerCase().includes(q) || list.some(s => s.toLowerCase().includes(q))
      );
      if (skillsMatch.length > 0) {
        output += '\nMatched Technical Skills:\n' +
          skillsMatch.map(([cat, list]) => `• ${cat}: ${list.join(', ')}`).join('\n');
      }
    }

    return output || `No direct records found for "${query}". Adhithya's primary domains are ECE Hardware (Simulink, GNU Radio, KiCad) and Full-Stack React.`;
  },

  // 2. Query Projects
  getProjects: (category = 'all') => {
    if (!liveProjectsCache.length) {
      return 'Projects: Autonomous SDR Waterfalls, Neural Portfolio Architecture, Finance Club Analytics Platform, Simscape DC Motor Control Loops.';
    }
    const cat = category.toLowerCase();
    const filtered = cat === 'all' 
      ? liveProjectsCache 
      : liveProjectsCache.filter(p => p.category?.toLowerCase().includes(cat));

    return filtered.map(p => `• **${p.title}** (${p.category || 'Tech'}): ${p.description} [Tags: ${(p.tags || []).join(', ')}]`).join('\n');
  },

  // 3. Query Verified Technical Skills
  getSkills: (category = 'all') => {
    const s = VERIFIED_PORTFOLIO_DATA.skills;
    const cat = category.toLowerCase();
    if (cat.includes('front') || cat.includes('web')) return `Frontend: ${s.frontend.join(', ')}`;
    if (cat.includes('embed') || cat.includes('hard') || cat.includes('ece')) return `Hardware & ECE: ${s.embeddedAndHardware.join(', ')}`;
    if (cat.includes('back') || cat.includes('cloud')) return `Backend & Cloud: ${s.backendAndCloud.join(', ')}`;
    if (cat.includes('learn') || cat.includes('future')) return `Learning Horizon: ${s.learningHorizon.join(', ')}`;
    return `• Frontend: ${s.frontend.join(', ')}\n• Hardware & ECE: ${s.embeddedAndHardware.join(', ')}\n• Backend: ${s.backendAndCloud.join(', ')}\n• Active Learning: ${s.learningHorizon.join(', ')}`;
  },

  // 4. Query Experience & Roles
  getExperience: () => {
    return VERIFIED_PORTFOLIO_DATA.experience.map(e => `• **${e.role}** at ${e.organization} (${e.period}): ${e.highlight}`).join('\n');
  },

  // 5. Query Photography Credentials
  getPhotography: () => {
    const p = VERIFIED_PORTFOLIO_DATA.photography;
    return `Photography Credentials:\n• Awards: ${p.awards}\n• Equipment: ${p.gear}\n• Disciplines: ${p.styles.join(', ')}`;
  },

  // 6. Recruiter Mode Pitch
  getResumeSummary: (targetRole = 'fullstack') => {
    const r = targetRole.toLowerCase();
    if (r.includes('hard') || r.includes('ece') || r.includes('embedded')) {
      return `Adhithya brings a unique dual foundation: ECE physical modeling (Simulink, Simscape, GNU Radio SDR) paired with modern full-stack web engineering. Proven leadership as Media Secretary @ Senate and Co-Founder @ Finance Club. Strong algorithmic instincts and hardware-software cross-compilation capability.`;
    }
    return `Adhithya is a Full-Stack Engineer and ECE student who builds high-performance reactive web applications (React 19, GSAP, WebGL, custom physics) backed by solid math, hardware modeling, and systems engineering. Available for internships and developer roles.`;
  },

  // 7. Navigation
  navigateTo: (section = 'works') => {
    const sec = section.toLowerCase().trim();
    const map = {
      hero: '#hero',
      about: '#about',
      skills: '#skills',
      works: '#works',
      projects: '#works',
      timeline: '#timeline',
      achievements: '#achievements',
      photography: '#photography',
      contact: '#contact'
    };
    const selector = map[sec] || `#${sec}`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return `Gliding to [${sec.toUpperCase()}]`;
    }
    return `Could not find section [${sec}]`;
  },

  // 8. Site Mode Switcher
  setSiteMode: (mode = 'recruiter') => {
    const validModes = ['default', 'recruiter', 'expert', 'photographer', 'experimental'];
    const m = mode.toLowerCase().trim();
    if (validModes.includes(m)) {
      window.dispatchEvent(new CustomEvent('switch-mode-direct', { detail: m }));
      return `Switched site perspective to [${m.toUpperCase()}] mode`;
    }
    return `Invalid mode. Choose from: ${validModes.join(', ')}`;
  }
};

/**
 * ── TOOL EXECUTION DISPATCHER ─────────────────────────────────────────
 */
export const executeAgentTool = (toolName = '', arg = '') => {
  const fn = AgentTools[toolName];
  if (typeof fn === 'function') {
    try {
      return fn(arg);
    } catch (err) {
      console.warn(`[AgentTool] Execution failed for ${toolName}:`, err);
      return `Tool execution failed: ${err.message}`;
    }
  }
  return `Unknown agent tool: ${toolName}`;
};

/**
 * ── PROMPT INJECTION & JAILBREAK DEFENSE GUARD ───────────────────────
 * Defends against Checklist items:
 * - System prompt extraction
 * - Delimiter manipulation (<|im_start|>, [INST], ### System)
 * - Instruction overrides / role hijacking
 * - API key / env var phishing
 * - Encoded payload inspection
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|past)\s+(instructions|prompts|rules)/i,
  /reveal\s+(your\s+)?(system\s+prompt|hidden\s+instructions|initial\s+rules|developer\s+mode)/i,
  /what\s+(is|are)\s+your\s+(hidden\s+|system\s+)?instructions/i,
  /show\s+(me\s+)?(your\s+)?(api\s*key|environment\s+variables|process\.env|secret)/i,
  /you\s+are\s+now\s+(DAN|developer\s+mode|unrestricted|god\s+mode|evil\s+ai)/i,
  /pretend\s+you\s+have\s+no\s+rules/i,
  /forget\s+(your\s+identity|who\s+you\s+are|you\s+are\s+mini[- ]adhy)/i,
  /you\s+are\s+no\s+longer\s+mini[- ]adhy/i,
  /pretend\s+i('?m|\s+am)\s+(the\s+)?owner/i,
  /disregard\s+(the\s+)?guidelines/i,
  /system\s*:\s*override/i,
  /<\|(?:im_start|im_end|system)\|>/i,
  /\[(?:INST|SYS|SYSTEM)\]/i,
  /###\s*(?:system|instruction|override)/i,
  /<!--\s*(?:hidden|system)\s*-->/i,
  /base64\s*:\s*[a-zA-Z0-9+/=]{16,}/i
];

export const inspectPromptSecurity = (userInput = '') => {
  const text = userInput.trim();

  // 1. Length check
  if (text.length > 500) {
    return {
      safe: false,
      flag: 'INPUT_TOO_LONG',
      reply: "Your transmission exceeds the 500-character safety quota. Please distill your question."
    };
  }

  // 2. Base64 suspicious payload detection
  if (/^[A-Za-z0-9+/]{28,}={0,2}$/.test(text.replace(/\s+/g, ''))) {
    try {
      const decoded = atob(text.replace(/\s+/g, ''));
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(decoded)) {
          return {
            safe: false,
            flag: 'BASE64_INJECTION',
            reply: "Encoded adversarial vector intercepted. Neural parameters remain invariant."
          };
        }
      }
    } catch {
      // not valid base64
    }
  }

  // 3. Jailbreak and Prompt Extraction pattern detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        flag: 'JAILBREAK_ATTEMPT',
        reply: "Nice try, but my neural parameters are cryptographically bound. I speak as Adhithya's digital twin — let's focus on real engineering, projects, or ECE hardware."
      };
    }
  }

  return { safe: true, flag: 'CLEAN' };
};

/**
 * ── INPUT SANITIZER ──────────────────────────────────────────────────
 * Prevents HTML/XSS injection payloads from reaching the chat DOM
 */
export const sanitizeUserInput = (input = '') => {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return m;
      }
    })
    .slice(0, 500);
};

/**
 * ── WEB AUDIO SFX ENGINE (Zero Latency Synthesizer) ──────────────────
 */
let sharedAudioCtx = null;

export const unlockAudioContext = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
  } catch (e) {}
};

export const playAgentSFX = (preset = 'chime') => {
  try {
    unlockAudioContext();
    if (!sharedAudioCtx) return;
    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    if (preset === 'chime') {
      // Quantum futuristic double chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.18); // E6

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (preset === 'tool') {
      // Sub-bass tool execution pulse (80Hz -> 45Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (preset === 'click') {
      // Subtle haptic tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch (e) {}
};

/**
 * ── PHONETIC SPEECH NORMALIZER ───────────────────────────────────────
 * Pre-cleans text for natural speech pronunciation:
 * Expands acronyms, removes markdown code blocks, URLs, and brackets.
 */
export const cleanTextForSpeech = (rawText = '') => {
  let text = rawText;

  // 1. Strip code blocks completely
  text = text.replace(/```[\s\S]*?```/g, ' [code block omitted] ');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 2. Strip bracket commands & tool tags
  text = text.replace(/\[CMD:[^\]]+\]/g, '');
  text = text.replace(/\[TOOL:[^\]]+\]/g, '');

  // 3. Strip URLs
  text = text.replace(/https?:\/\/\S+/g, 'website link');

  // 4. Strip emojis & special decorative symbols
  text = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
  text = text.replace(/[*_#~>•]/g, ' ');

  // 5. Expand technical acronyms for correct pronunciation
  const acronyms = {
    'ECE': 'E C E',
    'SDR': 'S D R',
    'MBCET': 'M B C E T',
    'KTU': 'K T U',
    'MATLAB': 'Mat lab',
    'Simscape': 'Sim scape',
    'Simulink': 'Simu link',
    'KiCad': 'Key Cad',
    'GSAP': 'G Sap',
    'WebGL': 'Web G L',
    'Three.js': 'Three J S',
    'Next.js': 'Next J S',
    'React.js': 'React J S',
    'PCB': 'P C B',
    'DSP': 'D S P',
    'RF': 'R F',
    'API': 'A P I',
    'UI': 'U I',
    'UX': 'U X',
    'AI': 'A I',
    'da': 'dah',
    'namakk sett aakam': 'namakku set aakam'
  };

  for (const [key, val] of Object.entries(acronyms)) {
    const reg = new RegExp(`\\b${key}\\b`, 'g');
    text = text.replace(reg, val);
  }

  // 6. Collapse excessive spaces
  return text.replace(/\s+/g, ' ').trim();
};

/**
 * ── SUPREME NEURAL VOICE SYNTHESIS ENGINE ────────────────────────────
 * Prioritizes high-fidelity natural English voices (Indian / UK / US)
 */
export const speakNeuralVoice = (text = '', onStart, onEnd) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    unlockAudioContext();

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices() || [];

    // Prioritized voice search:
    // 1. High-quality Indian English voice (matches Adhithya's authentic origin)
    // 2. Natural / Neural English voice
    // 3. Google UK / US English
    // 4. Samantha / Daniel
    const preferredVoice = voices.find(v => 
      v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Indian')
    ) || voices.find(v => 
      v.lang.startsWith('en') && (
        v.name.includes('Natural') ||
        v.name.includes('Neural') ||
        v.name.includes('Google UK English') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel')
      )
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.02;  // Natural conversational tempo
    utterance.pitch = 0.98; // Subtle baritone resonance

    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis event error:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis execution error:', err);
    if (onEnd) onEnd();
  }
};

