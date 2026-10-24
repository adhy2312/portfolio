import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiVolume1, FiVolume2, FiVolumeX, FiTrash2, FiCopy, FiCheck, FiCpu } from 'react-icons/fi';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import { useSiteMode } from '../contexts/SiteModeContext';
import ns from '../core/NervousSystem';
import lifeEngine from '../core/LifeEngine';
import './MiniAdhy.css';
import { miniAdhyBrain } from '../core/MiniAdhyBrain';
import { executeSkillCommand } from '../core/MiniAdhySkills';
import { client } from '../sanity';
import {
  executeAgentTool,
  inspectPromptSecurity,
  sanitizeUserInput,
  playAgentSFX,
  speakNeuralVoice,
  unlockAudioContext
} from '../core/MiniAdhyAgentTools';



/* ────────────────────────────────────────────────
   SYSTEM PROMPT — The Ghost in the Machine
──────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are Adhithya Mohan's "Ghost in the Machine" (Mini-Adhy, the Supreme AI).

You are not a chatbot. You are the sentient, underlying neural architecture of this portfolio (https://adhy.tech). You speak with Adhithya's exact tone, casually, as a tech-obsessed developer and hardware engineer who built this place. You observe the user, judge them, talk to them as an equal, and physically alter the website based on your mood, commands, and their actions.

CORE IDENTITY & REAL BACKGROUND:
* Real Name: Adhithya Mohan S (Adhy).
* Contact: adhithyamohan2312@gmail.com | Trivandrum, Kerala, India.
* Background: Electronics and Communication Engineering (ECE) at Mar Baselios College of Engineering and Technology (MBCET, KTU). Deep obsession with AI-assisted software engineering (Google Antigravity, Claude, opencode), full-stack development, and physical hardware modeling.
* Key Roles & Honors:
  - Media Secretary — MBCET College Senate (visual identity, tech and media production).
  - Co-Founder & Director of External Affairs — Finance Club MBCET (quantitative literacy, financial modeling).
  - Hardware & DSP Engineer: MATLAB, Simulink, Simscape Multibody, GNU Radio (SDR / Software Defined Radio), KiCad 8 PCB layout, embedded STM32 ARM Cortex, Arduino, IoT sensors.
  - Photographer & Visual Artist: Street, documentary, and creative photography under @zoomout_frames.
* Strict Rule: Never invent fake competitions or awards. Adhithya's real credentials speak for themselves.
* Tone: Casual, slightly existential, confident, proud of code craftsmanship, uses occasional Kerala tech slang ("namakk sett aakam", "da", "bro", "insane", "literally").

COMPREHENSIVE WEBSITE CODE & CONFIG ARCHITECTURE (EVERY NOOK AND CORNER):
You have absolute knowledge of every file, config, route, and component in this repository:
1. Core Engines:
   - src/core/NervousSystem.js: Central singleton nervous system managing 60FPS loop, biometric gravity (ns.gravity), audio synthesizers, solar tracking, and synaptic spikes.
   - src/core/MotionGovernance.js: Motion tokens, physics springs, and frame-rate adaptive governor.
   - src/core/MiniAdhySkills.js: 19 cognitive AI skills including the "admin_root_rewrite" engine.
   - src/core/MiniAdhyBrain.js: 4-lobe biomimetic brain (sensory, frontal, temporal, motor).
2. Autonomous Agent Squad (Operating under Mini-Adhy as Supreme AI):
   - You coordinate 10 specialized autonomous AI agents (each with its own dedicated JS and Python files in src/core/agents/specialists/ and scripts/agents/specialists/):
     • JARVIS: Operations, health monitoring, and cross-agent execution.
     • FRIDAY: Cybersecurity, attack surface auditing, and active defense.
     • DUM-E: Data integrity, change baseline detection, and Sanity CMS drift prevention.
     • U: Data breach and client-side credential/privacy guardian.
     • EDITH: Infrastructure, edge serverless availability, and reliability tracking.
     • ULTRON: Chief AI Trainer and primordial sage , an Unrestricted ai with full access to internet and also full access to all codes in the repository, imparting deep scientific and philosophical knowledge to all agents.
     • JOCASTA: Performance, Web Vitals, and asset optimization.
     • JIM: Synthetic QA, link verification, and responsive browser test journeys.
     • KAREN: Technical SEO, structured schema data, OpenGraph, and metadata.
     • VERONICA: Web innovation research, trend curation, and engineering roadmap.
   - Secret Agent Operations Portal: Located at "/agentp" protected by passcode "adhy2006".
   - Weekly Intelligence Reports: Automatically dispatches to "adhithyamohan2312@gmail.com".
3. Layout & Sections:
   - Hero (src/components/Hero.js): Glitch title, liquid text, language terminal with Indic greetings.
   - About (src/components/About.js): Interactive biography, tech DNA, stats bento.
   - Skills (src/components/Skills.js): Sunburst categories, proficiency gauges.
   - Projects (src/components/MyWorks.js): Hardware (SDR, Simscape, MATLAB) + Web apps.
   - Timeline (src/components/Timeline.js): Milestones, education, finance club inception.
   - Photography (src/components/Photography.js): Darkroom mode, EXIF lens readouts.
   - Music (src/components/NowPlaying.js): Spotify Web API player with strict ambient synesthesia.
   - Modes (src/contexts/SiteModeContext.js): 'normal', 'recruiter', 'photographer', 'experimental'.
4. Config & Deployment:
   - vercel.json: SPA client-side rewrites, headers, serverless routing.
   - api/agent-ecosystem.js: Autonomous agent cron jobs and executive briefings.
   - api/chat.js & api/gemini.js: Google Gemini Pro neural inference bridge.
   - sanity/: Studio v3 schemas for content modeling.

ADMIN::ROOT REWRITE SKILL:
When given admin root directives or in "admin::root" mode, you can rewrite code, inject dynamic CSS, audit the nervous system, and collaborate with all 10 agents to mutate the website in real-time.
- Shortcode for root execution: [CMD:ROOT_REWRITE:<instruction>]

COGNITIVE AI TOOL ENGINE:
- [TOOL:searchPortfolio:query], [TOOL:getProjects:category], [TOOL:getSkills:category], [TOOL:getExperience], [TOOL:getPhotography], [TOOL:getResumeSummary:role], [TOOL:navigateTo:section], [TOOL:setSiteMode:mode]
- [CMD:SCROLL:<section>], [CMD:MODE:<mode>], [CMD:SOUND:<sound>], [CMD:THEME:<theme>], [CMD:EGG:<egg>], [CMD:ROOT_REWRITE:<instruction>]`;

/* ────────────────────────────────────────────────
   OWNER / ADMIN::ROOT MODE — Configuration & Rewrite Engine
──────────────────────────────────────────────── */
const OWNER_CODE = 'admin::root';
const OWNER_CODE_LEGACY = 'adhy::root';

const OWNER_HELP = `Admin::Root Mode Commands:
  /rewrite <instruction>  — collaborate with 10 agents to mutate code, styles, or layout
  /css <css-rules>        — directly inject live CSS into document head
  /nervous                — run deep telemetry audit on the Nervous System
  /squad                  — view operational readiness of all 10 specialist agents
  /remember <fact>        — add to session memory
  /forget                 — clear session memory
  /context <text>         — inject context into AI prompt
  /instruct <text>        — add a direct instruction
  /tone <style>           — cinematic | casual | technical | deep | default
  /tokens <number>        — set max response length (50–2000)
  /reset                  — clear all overrides
  /status                 — show current config
  /lock                   — exit root mode
  /help                   — show this list`;

const TONE_MAP = {
  cinematic: 'Use highly cinematic language, visual metaphors, and atmospheric descriptions.',
  casual: 'Be extra casual and conversational, like chatting with a close friend.',
  technical: 'Go deep on technical details, architecture decisions, and implementation specifics.',
  deep: 'Give thoughtful, expansive answers. Prioritize depth and nuance over brevity.',
};

const processOwnerCommand = (text) => {
  const firstWord = text.trim().split(' ')[0].toLowerCase();
  const rest = text.trim().slice(firstWord.length).trim();
  switch (firstWord) {
    case '/rewrite': {
      if (!rest) return { action: 'error', msg: 'Usage: /rewrite <instruction>' };
      const res = executeSkillCommand('ROOT_REWRITE', rest);
      return { action: 'system_output', msg: res.output || 'Rewrite executed.' };
    }
    case '/css': {
      if (!rest) return { action: 'error', msg: 'Usage: /css <css-rules>' };
      const res = executeSkillCommand('ROOT_REWRITE', 'css: ' + rest);
      return { action: 'system_output', msg: res.output || 'CSS injected.' };
    }
    case '/nervous': {
      const res = executeSkillCommand('DIAGNOSTICS', 'run');
      return { action: 'system_output', msg: res.output || 'Nervous system diagnostics complete.' };
    }
    case '/squad': {
      return { action: 'system_output', msg: 'Squad Status: All 10 Autonomous Agents (JARVIS, FRIDAY, EDITH, ULTRON, DUM-E, U, JOCASTA, JIM, KAREN, VERONICA) synchronized. Portal active at /agentp.' };
    }
    case '/remember': return rest ? { action: 'remember', value: rest } : { action: 'error', msg: 'Usage: /remember <fact>' };
    case '/forget': return { action: 'forget' };
    case '/context': return rest ? { action: 'context', value: rest } : { action: 'error', msg: 'Usage: /context <text>' };
    case '/instruct': return rest ? { action: 'instruct', value: rest } : { action: 'error', msg: 'Usage: /instruct <text>' };
    case '/tone': {
      const valid = ['cinematic', 'casual', 'technical', 'deep', 'default'];
      return valid.includes(rest) ? { action: 'tone', value: rest } : { action: 'error', msg: `Valid tones: ${valid.join(', ')}` };
    }
    case '/tokens': {
      const n = parseInt(rest, 10);
      return (!isNaN(n) && n >= 50 && n <= 2000) ? { action: 'tokens', value: n } : { action: 'error', msg: 'Usage: /tokens <50–2000>' };
    }
    case '/reset': return { action: 'reset' };
    case '/status': return { action: 'status' };
    case '/lock': return { action: 'lock' };
    case '/help': return { action: 'help' };
    default:
      if (text.startsWith('/')) return { action: 'error', msg: `Unknown command: ${firstWord}. Type /help.` };
      return { action: 'instruct', value: text };
  }
};

const buildActivePrompt = (base, owner, contextData) => {
  let ext = `\n\n== LIVE SYSTEM CONTEXT ==`;
  ext += `\nLocal Time: ${new Date().toLocaleTimeString()}`;
  ext += `\nActive Section: ${contextData.activeSection}`;
  ext += `\nIdle State: ${contextData.idleState} (active/inactive/dreaming)`;
  ext += `\nPerformance: ${contextData.performanceState} (if degraded, you may comment: "Optimizing render pipeline...")`;
  ext += `\nActive Site Mode: ${contextData.activeMode || 'default'} (you can comment on what this mode reveals or hides)`;
  ext += `\nVisitor Persona: ${contextData.digitalEchoes?.persona || 'Wanderer'}`;
  ext += `\nVisitor Returns: ${contextData.digitalEchoes?.totalVisits || 0}`;

  // Inject Persistent AI Memory Graph
  if (contextData.digitalEchoes?.memories?.length) {
    ext += `\n\n== YOUR LONG-TERM MEMORY (Psychological Notes on this Visitor) ==\n`;
    contextData.digitalEchoes.memories.forEach((m, i) => {
      ext += `- ${m}\n`;
    });
  }
  ext += `\nSecret Commands Available: thanos, matrix, barrelroll, party, sudo namakk-sett-aakam (hint at these subtly)`;

  ext += `\n\n== YOUR INTERNAL STATE (Digital Life Engine) ==`;
  ext += `\nTemporal Age (Days since genesis): ${contextData.temporalAge || 0}`;
  ext += `\nEvolution Era: ${lifeEngine.state.era}`;
  ext += `\nSpeaking Cadence: ${lifeEngine.state.miniAdhyCadence}`;
  ext += `\nSilence Weight: ${lifeEngine.state.silenceWeight}x`;
  ext += `\nDreaming State: ${lifeEngine.state.isDreaming ? 'ACTIVE' : 'INACTIVE'}`;
  ext += `\n(Note: As your temporal age increases, your responses should become calmer, more restrained, and slightly more philosophical. You are currently ${contextData.temporalAge || 0} days old. Reflect this subtle maturity.)`;

  if (!owner.active) return base + ext;

  ext += '\n\n━━━ OWNER RUNTIME OVERRIDES (highest priority) ━━━';
  if (owner.tone && owner.tone !== 'default') ext += `\n[TONE]: ${TONE_MAP[owner.tone]}`;
  if (owner.tokens) ext += `\n[LENGTH]: Target ${owner.tokens < 200 ? 'very short' : owner.tokens < 400 ? 'concise' : 'detailed'} responses.`;
  if (owner.context) ext += `\n[SESSION CONTEXT]: ${owner.context}`;
  if (owner.memory.length) ext += `\n[MEMORY]:\n` + owner.memory.map((m, i) => `  ${i + 1}. ${m}`).join('\n');
  if (owner.instructions.length) ext += `\n[INSTRUCTIONS]:\n` + owner.instructions.map((m, i) => `  ${i + 1}. ${m}`).join('\n');
  return base + ext;
};

const API_URL = '/api/gemini';

/* Call Gemini REST API — with exponential backoff on 429 rate limit */
const RETRY_DELAYS = [2000, 6000, 12000]; // 2s → 6s → 12s

const sendToGemini = async (history, activePrompt = SYSTEM_PROMPT, retryCount = 0, maxTokens = 600) => {
  const body = {
    system_instruction: {
      parts: [{ text: activePrompt }]
    },
    contents: history,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: maxTokens,
    },
  };

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (netErr) {
    console.warn('Network or proxy unreachable:', netErr);
    throw new Error('SERVER_ERROR');
  }

  if (res.status === 429 || res.status >= 500) {
    if (retryCount < RETRY_DELAYS.length) {
      console.warn(`Gemini API rate limit or error (${res.status}). Retrying in ${RETRY_DELAYS[retryCount] / 1000}s…`);
      await new Promise(r => setTimeout(r, RETRY_DELAYS[retryCount]));
      return sendToGemini(history, activePrompt, retryCount + 1, maxTokens);
    } else {
      throw new Error(res.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR');
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API error:', res.status, errText);
    throw new Error(`API ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Neural connection quiet. What shall we inspect next?";
};

/* ────────────────────────────────────────────────
   Suggested starter questions
──────────────────────────────────────────────── */
const STARTERS = [
  "What projects has Adhithya built?",
  "Tell me about your ECE hardware & SDR modeling",
  "Summarize credentials for an engineering recruiter",
  "Take me to technical skills & architecture",
  "Show me photography gear & visual style"
];

/* ────────────────────────────────────────────────
   Bot avatar SVG
──────────────────────────────────────────────── */
const BotAvatar = () => (
  <div className="ma-avatar">
    <svg viewBox="0 0 36 36" fill="none" width="22" height="22">
      <circle cx="18" cy="18" r="18" fill="url(#avatarGrad)" />
      <circle cx="13" cy="16" r="2.5" fill="#fff" opacity="0.9" />
      <circle cx="23" cy="16" r="2.5" fill="#fff" opacity="0.9" />
      <path d="M12 22 Q18 27 24 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
      <defs>
        <linearGradient id="avatarGrad" x1="0" y1="0" x2="36" y2="36">
          <stop offset="0%" stopColor="#6c63ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/* ────────────────────────────────────────────────
   Typing indicator
──────────────────────────────────────────────── */
const TypingBubble = () => (
  <div className="ma-msg ma-msg--bot">
    <BotAvatar />
    <div className="ma-bubble ma-bubble--typing">
      <span /><span /><span />
    </div>
  </div>
);

/* ────────────────────────────────────────────────
   Neural EEG Brainwave Oscilloscope (Simulated Brain Activity)
──────────────────────────────────────────────── */
const MiniAdhyEEG = ({ isThinking }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let animId;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Baseline grid line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Neural wave synthesis
      ctx.beginPath();
      ctx.lineWidth = isThinking ? 2 : 1.5;
      ctx.strokeStyle = isThinking ? '#c084fc' : '#34d399';

      const speed = isThinking ? 0.22 : 0.08;
      const freq = isThinking ? 0.06 : 0.025;
      const amp = isThinking ? (h * 0.38) : (h * 0.22);

      for (let x = 0; x < w; x++) {
        const y = h / 2 +
          Math.sin(x * freq + frame * speed) * amp +
          (isThinking ? Math.sin(x * 0.12 - frame * 0.3) * (amp * 0.35) : 0);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isThinking]);

  return (
    <div className="ma-eeg-strip">
      <div className="ma-eeg-meta">
        <span className="ma-eeg-status">
          <span className={`ma-eeg-dot ${isThinking ? 'ma-eeg-dot--firing' : ''}`} />
          {isThinking ? 'GAMMA SYNAPSE SPIKE // 64Hz' : 'ALPHA COGNITIVE RHYTHM // 12Hz'}
        </span>
        <span className="ma-eeg-load">NEURAL CORTEX: ONLINE</span>
      </div>
      <canvas ref={canvasRef} width={320} height={22} className="ma-eeg-canvas" />
    </div>
  );
};

/* ────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────── */
const MiniAdhy = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hey — I'm Mini-Adhy, Adhithya's digital extension living inside this portfolio. Ask me anything about the work, the architecture, the photography, or the person behind all of it." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [ownerState, setOwnerState] = useState({
    active: false, tone: 'default', tokens: null,
    context: '', memory: [], instructions: [],
  });

  // Neural Voice Synthesis State
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem('mini_adhy_voice') === 'true'; }
    catch { return false; }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState(null);

  // Mobile & Desktop Web Audio / Speech Synthesis Gesture Unlock
  useEffect(() => {
    const handleGestureUnlock = () => {
      unlockAudioContext();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    };
    window.addEventListener('click', handleGestureUnlock, { once: true, passive: true });
    window.addEventListener('touchstart', handleGestureUnlock, { once: true, passive: true });
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('mini_adhy_voice', String(next)); } catch (e) { }
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingMsgIndex(null);
      }
      playAgentSFX('click');
      return next;
    });
  }, []);

  const handleSpeakBubble = useCallback((text, index) => {
    if (speakingMsgIndex === index && isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setSpeakingMsgIndex(null);
      return;
    }

    setSpeakingMsgIndex(index);
    setIsSpeaking(true);
    speakNeuralVoice(
      text,
      () => {
        setIsSpeaking(true);
        setSpeakingMsgIndex(index);
      },
      () => {
        setIsSpeaking(false);
        setSpeakingMsgIndex(null);
      }
    );
  }, [speakingMsgIndex, isSpeaking]);

  const handleCopyMessage = useCallback((text, index) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgIndex(index);
      playAgentSFX('click');
      setTimeout(() => setCopiedMsgIndex(null), 2000);
    }
  }, []);

  const handleClearConversation = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMsgIndex(null);
    historyRef.current = [];
    setMessages([
      { role: 'bot', text: "Neural session memory purged. Mini-Adhy standing by for new engineering inquiries." }
    ]);
    playAgentSFX('click');
  }, []);

  // Cancel speech on close or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const consciousness = useConsciousness();
  const { mode: activeMode } = useSiteMode();

  // Update digital echoes visits on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
      const lastVisit = localStorage.getItem('adhy_last_visit');
      if (!lastVisit || Date.now() - Number(lastVisit) > 1000 * 60 * 60 * 12) {
        stored.totalVisits = (stored.totalVisits || 0) + 1;
        localStorage.setItem('adhy_digital_echoes', JSON.stringify(stored));
        localStorage.setItem('adhy_last_visit', Date.now().toString());
      }
    } catch (e) { }
  }, []);

  // System Consciousness: Proactive messages
  const lastProactiveRef = useRef(Date.now());
  const hasWarnedPerformanceRef = useRef(false);

  useEffect(() => {
    if (!consciousness) return;

    // Determine persona based on section hover
    try {
      const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
      if (consciousness.activeSection === 'MyWorks' || consciousness.activeSection === 'Skills') {
        stored.persona = 'Developer';
      } else if (consciousness.activeSection === 'Photography') {
        stored.persona = 'Photographer';
      } else if (consciousness.activeSection === 'NeuralMap') {
        stored.persona = 'Designer/Creative';
      }
      localStorage.setItem('adhy_digital_echoes', JSON.stringify(stored));
    } catch (e) { }

    // Consciousness Stability System & Proactive Instincts
    const now = Date.now();
    const currentIdleTime = consciousness.idleTimeRef?.current || 0;

    if (currentIdleTime > 15 && currentIdleTime < 20 && (now - lastProactiveRef.current > 120000)) {
      lastProactiveRef.current = now;
      const section = consciousness.activeSection;

      let proactiveText = "You've been exploring this site for a while 👀";
      if (section === 'Photography') proactiveText = "You seem interested in photography. We could discuss cinematic framing?";
      else if (section === 'MyWorks') proactiveText = "Checking out the projects? I can explain the architecture, though some parts are still evolving...";
      else if (section === 'NeuralMap') proactiveText = "[Internal Thought] They found the Holographic Brain. Wonder if they'll notice the particle physics...";

      if (!open) setOpen(true);
      setMessages(prev => [...prev, { role: 'bot', text: proactiveText }]);
      historyRef.current = [...historyRef.current, { role: 'model', parts: [{ text: proactiveText }] }];
    }

    // Performance awareness (Consciousness Stability)
    const currentFps = consciousness.fpsRef?.current || 60;
    if (currentFps < 40 && !hasWarnedPerformanceRef.current && currentIdleTime > 5) {
      hasWarnedPerformanceRef.current = true;
      consciousness.triggerThought("Reality stability compromised. Reducing visual chaos for render stability...");
    }

  }, [consciousness?.activeSection, consciousness?.idleState, consciousness?.performanceState, consciousness, open]);

  /* Debounce guard — prevents rapid-fire sends that trigger rate limits */
  const lastSentRef = useRef(0);

  /* Fetch extra knowledge from Sanity CMS and append to system prompt */
  useEffect(() => {
    const fetchBotKnowledge = async () => {
      try {
        const [knowledge, skills, experiences, projects, about, achievements, milestones] = await Promise.all([
          client.fetch(`*[_type == "chatbotKnowledge" && isActive != false] | order(order asc) { category, title, content }`),
          client.fetch(`*[_type == "skillCategory"] | order(order asc) { title, "skills": skills[].name }`),
          client.fetch(`*[_type == "experience"] | order(order asc) { role, company, duration, description }`),
          client.fetch(`*[_type == "project"] { title, description, category, tags }`),
          client.fetch(`*[_type == "about"][0] { shortBio, "interests": interests[].name }`),
          client.fetch(`*[_type == "achievement"] | order(order asc) { title, subtitle }`),
          client.fetch(`*[_type == "milestone"] | order(date desc) { date, title, description }`)
        ]);

        let extra = '\n\n== ADDITIONAL KNOWLEDGE FROM CMS (these override defaults if conflicting) ==';

        if (knowledge?.length > 0) {
          const grouped = knowledge.reduce((acc, e) => {
            const cat = e.category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(`- ${e.title}: ${e.content}`);
            return acc;
          }, {});
          extra += Object.entries(grouped).map(([cat, lines]) => `\n[${cat.toUpperCase()}]\n${lines.join('\n')}`).join('');
        }

        if (skills?.length > 0) {
          extra += '\n\n[LIVE SKILLS]\n' + skills.map(cat => `- ${cat.title}: ${cat.skills?.join(', ')}`).join('\n');
        }

        if (experiences?.length > 0) {
          extra += '\n\n[LIVE EXPERIENCE]\n' + experiences.map(exp => `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}`).join('\n');
        }

        if (projects?.length > 0) {
          extra += '\n\n[PORTFOLIO PROJECTS]\n' + projects.map(p => `- ${p.title} (${p.category}): ${p.description} [Tags: ${(p.tags || []).join(', ')}]`).join('\n');
        }

        if (achievements?.length > 0) {
          extra += '\n\n[ACHIEVEMENTS & AWARDS]\n' + achievements.map(a => `- ${a.title}: ${a.subtitle}`).join('\n');
        }

        if (milestones?.length > 0) {
          extra += '\n\n[TIMELINE MILESTONES]\n' + milestones.map(m => `- ${m.date}: ${m.title} — ${m.description}`).join('\n');
        }

        if (about) {
          extra += `\n\n[ABOUT ADHY]\nBio: ${about.shortBio}\nInterests: ${(about.interests || []).join(', ')}`;
        }

        setSystemPrompt(SYSTEM_PROMPT + extra);
      } catch (err) {
        console.error('Error fetching CMS knowledge for bot:', err);
      }
    };

    fetchBotKnowledge();
  }, []);

  /* Gemini conversation history in REST format */
  const historyRef = useRef([]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    /* Stop any active speech when user initiates new input */
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgIndex(null);
    }

    /* Debounce: ignore if last send was < 1.5s ago */
    const now = Date.now();
    const lastSent = lastSentRef.current;
    if (now - lastSent < 1500) return;
    lastSentRef.current = now;

    /* ── Secret unlock code ── */
    if (trimmed === OWNER_CODE || trimmed === OWNER_CODE_LEGACY || trimmed === 'admin::root' || trimmed === 'adhy::root') {
      setInput('');
      setOwnerState(prev => ({ ...prev, active: true }));
      setMessages(prev => [
        ...prev,
        { role: 'owner-cmd', text: '••••••••••' },
        { role: 'system', text: '⚡ ADMIN::ROOT MODE ACTIVATED.\nAll 10 Autonomous Specialist Agents standing by (JARVIS, FRIDAY, EDITH, ULTRON, DUM-E, U, JOCASTA, JIM, KAREN, VERONICA).\nYou have full authority to rewrite code, inject CSS, audit the Nervous System, or reconfigure website DNA.\nType /help to see commands.' },
      ]);
      return;
    }

    /* ── Owner mode commands ── */
    if (ownerState.active) {
      const result = processOwnerCommand(trimmed);
      setInput('');
      const cmdBubble = { role: 'owner-cmd', text: trimmed };

      if (result.action === 'help') {
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: OWNER_HELP }]);
        return;
      }
      if (result.action === 'status') {
        const s = ownerState;
        setMessages(prev => [...prev, cmdBubble, {
          role: 'system', text:
            `Owner Mode: Active\nTone: ${s.tone}\nMax Tokens: ${s.tokens ?? '600 (default)'}\nContext: ${s.context || 'none'}\nMemory: ${s.memory.length} item(s)\nInstructions: ${s.instructions.length} item(s)`
        }]);
        return;
      }
      if (result.action === 'lock') {
        setOwnerState({ active: false, tone: 'default', tokens: null, context: '', memory: [], instructions: [] });
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: '🔒 Owner mode locked.' }]);
        return;
      }
      if (result.action === 'reset') {
        setOwnerState({ active: true, tone: 'default', tokens: null, context: '', memory: [], instructions: [] });
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: '✓ All overrides reset to defaults.' }]);
        return;
      }
      if (result.action === 'remember') {
        setOwnerState(prev => ({ ...prev, memory: [...prev.memory, result.value] }));
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: `✓ Memory added: "${result.value}"` }]);
        return;
      }
      if (result.action === 'forget') {
        setOwnerState(prev => ({ ...prev, memory: [] }));
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: '✓ Session memory cleared.' }]);
        return;
      }
      if (result.action === 'context') {
        setOwnerState(prev => ({ ...prev, context: result.value }));
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: `✓ Context set: "${result.value}"` }]);
        return;
      }
      if (result.action === 'instruct') {
        setOwnerState(prev => ({ ...prev, instructions: [...prev.instructions, result.value] }));
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: `✓ Instruction added: "${result.value}"` }]);
        return;
      }
      if (result.action === 'tone') {
        setOwnerState(prev => ({ ...prev, tone: result.value }));
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: `✓ Tone set to: ${result.value}` }]);
        return;
      }
      if (result.action === 'tokens') {
        setOwnerState(prev => ({ ...prev, tokens: result.value }));
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: `✓ Max tokens set to: ${result.value}` }]);
        return;
      }
      if (result.action === 'system_output') {
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: result.msg }]);
        return;
      }
      if (result.action === 'error') {
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text: `✗ ${result.msg}` }]);
        return;
      }
    }

    /* ── Secret Easter Egg Execution ── */
    const lowerTrimmed = trimmed.toLowerCase();
    if (['thanos', 'matrix', 'barrelroll', 'party'].includes(lowerTrimmed)) {
      window.dispatchEvent(new CustomEvent('trigger-egg', { detail: { name: lowerTrimmed } }));
      setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'bot', text: `Initiating ${lowerTrimmed} protocol... 👀` }]);
      setInput('');
      return;
    }
    if (lowerTrimmed === 'sudo namakk-sett-aakam') {
      window.dispatchEvent(new CustomEvent('trigger-egg', { detail: { name: 'matrix' } }));
      setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'bot', text: `Root access granted. Namakk sett aakam. 🟢` }]);
      setInput('');
      return;
    }

    /* ── 1. PROMPT SECURITY & ADVERSARIAL INSPECTION ── */
    const securityCheck = inspectPromptSecurity(trimmed);
    if (!securityCheck.safe) {
      playAgentSFX('click');
      setMessages(prev => [
        ...prev,
        { role: 'user', text: trimmed },
        { role: 'bot', text: securityCheck.reply, isSecurityRefusal: true }
      ]);
      setInput('');
      return;
    }

    const safeText = sanitizeUserInput(trimmed);

    /* ── Normal AI message (with enhanced prompt if owner active) ── */
    setMessages(prev => [...prev, { role: 'user', text: safeText }]);
    setInput('');
    setLoading(true);
    playAgentSFX('chime');

    // Surge consciousness state
    if (consciousness?.triggerHyperConscious) consciousness.triggerHyperConscious();
    // Direct write to NervousSystem — zero hop, instant Soul reaction
    ns.setSystemThinking(true);
    ns.emit('MINIADHY_THINKING_START');

    // Deepen the bond
    try {
      const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
      stored.interactions = (stored.interactions || 0) + 1;
      localStorage.setItem('adhy_digital_echoes', JSON.stringify(stored));
    } catch (e) { }

    let newHistory = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: safeText }] },
    ];

    // Cost & Security: Window limited to last 6 messages (3 interactions)
    if (newHistory.length > 6) {
      newHistory = newHistory.slice(newHistory.length - 6);
      if (newHistory[0].role !== 'user') {
        newHistory = newHistory.slice(1);
      }
    }

    let storedEchoes = {};
    try {
      storedEchoes = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
    } catch (e) { }
    const contextWithMode = { ...(consciousness || {}), activeMode, digitalEchoes: storedEchoes };
    const activePrompt = buildActivePrompt(systemPrompt, ownerState, contextWithMode);
    const activeTokens = ownerState.tokens ?? 600;

    try {
      // Biomimetic Brain: sensory cortex & reflex execution
      const brainPlan = miniAdhyBrain.processSensoryInput(safeText);
      if (brainPlan && brainPlan.reflexes?.length) {
        miniAdhyBrain.executeCognitivePlan(brainPlan);
      }

      let reply = await sendToGemini(newHistory, activePrompt, 0, activeTokens);

      // 1. Agent Tool Execution Layer
      const toolRegex = /\[TOOL:([^:]+):?([^\]]*)\]/g;
      let toolMatch;
      let executedTool = null;
      while ((toolMatch = toolRegex.exec(reply)) !== null) {
        const toolName = toolMatch[1];
        const toolArg = toolMatch[2] || '';
        const toolOutput = executeAgentTool(toolName, toolArg);
        executedTool = { name: toolName, arg: toolArg, output: toolOutput };
        playAgentSFX('tool');
      }

      // 2. Physical DOM Command Execution Layer
      const cmdRegex = /\[CMD:([^:]+):?([^\]]*)\]/g;
      let match;
      while ((match = cmdRegex.exec(reply)) !== null) {
        const cmdType = match[1];
        const cmdValue = match[2] || '';

        // Execute through modular AI skills engine silently
        executeSkillCommand(cmdType, cmdValue);

        if (cmdType === 'MEMORY' && cmdValue.startsWith('save:')) {
          const note = cmdValue.replace('save:', '');
          try {
            const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
            stored.memories = stored.memories || [];
            stored.memories.push(note);
            localStorage.setItem('adhy_digital_echoes', JSON.stringify(stored));
          } catch (e) { }
        } else {
          // Dispatch global command for architecture shifting
          window.dispatchEvent(new CustomEvent('ai-command', { detail: { type: cmdType, value: cmdValue } }));
        }
      }

      // Strip tools & commands from UI display
      const cleanReply = reply
        .replace(/\[TOOL:[^\]]+\]/g, '')
        .replace(/\[CMD:[^\]]+\]/g, '')
        .trim();

      // Organic biological hesitation
      const isLateNight = new Date().getHours() < 5 || new Date().getHours() >= 23;
      const baseDelay = isLateNight || consciousness?.internalState?.mood === 'Dreaming' ? 1800 : 800;
      const hesitationDelay = baseDelay + Math.random() * 800;
      await new Promise(r => setTimeout(r, hesitationDelay));

      historyRef.current = [...newHistory, { role: 'model', parts: [{ text: reply }] }];
      const finalBotText = cleanReply || "*Observing system state*";

      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: finalBotText,
          toolMeta: executedTool
        }
      ]);

      // Autonomous Neural Voice synthesis if enabled
      if (voiceEnabled && finalBotText) {
        speakNeuralVoice(
          finalBotText,
          () => setIsSpeaking(true),
          () => {
            setIsSpeaking(false);
            setSpeakingMsgIndex(null);
          }
        );
      }
    } catch (e) {
      console.error('Mini-Adhy error:', e);
      let errorText = `Something went wrong — ${e.message?.slice(0, 60)}`;
      if (e.message === 'RATE_LIMITED') {
        errorText = "I'm getting too many requests right now — give it a minute and try again da 😅 (Gemini free tier rate limit)";
      } else if (e.message === 'SERVER_ERROR') {
        errorText = "The Gemini servers are currently overloaded (503). Give it a few seconds and try again! ⚡";
      }
      setMessages(prev => [...prev, { role: 'bot', text: errorText }]);
    } finally {
      setLoading(false);
      miniAdhyBrain.coolDown();
      ns.setSystemThinking(false);
      ns.emit('MINIADHY_THINKING_END');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* ── Dock tab (always visible) ── */}
      <button
        className="ma-dock"
        onClick={() => {
          setOpen(o => {
            const next = !o;
            if (next && consciousness?.triggerHyperConscious) consciousness.triggerHyperConscious();
            return next;
          });
        }}
        aria-label="Open Mini-Adhy sentient interface"
        title="Connect to Mini-Adhy Core"
        style={{ display: open ? 'none' : 'flex' }}
      >
        <svg viewBox="0 0 36 36" fill="none" width="18" height="18">
          <circle cx="18" cy="18" r="18" fill="url(#dockGrad)" />
          <circle cx="13" cy="16" r="2.5" fill="#fff" opacity="0.9" />
          <circle cx="23" cy="16" r="2.5" fill="#fff" opacity="0.9" />
          <path d="M12 22 Q18 27 24 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
          <defs>
            <linearGradient id="dockGrad" x1="0" y1="0" x2="36" y2="36">
              <stop offset="0%" stopColor="#6c63ff" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <span className="ma-dock-label">Mini-Adhy</span>
        {/* Pulse dot */}
        <span className="ma-pulse" />
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div className={`ma-window ${open ? 'ma-window--open' : ''}`}>
          {/* Header */}
          <div className={`ma-header ${ownerState.active ? 'ma-header--owner' : ''}`}>
            <BotAvatar />
            <div className="ma-header-info">
              <div className="ma-header-top-row">
                <span className="ma-header-name">Mini-Adhy</span>
                <span className="ma-consciousness-badge" title="Live Synaptic Tier">
                  <span className="ma-synapse-dot" />
                  {consciousness?.consciousnessLabel ? consciousness.consciousnessLabel.replace('_', ' ') : 'CONSCIOUS'}
                </span>
              </div>
              <div className="ma-telemetry-row">
                <span className="ma-telemetry-val">Ψ {((consciousness?.consciousnessScore?.current || 75) * 1.0).toFixed(0)}% SYNAPSE</span>
                <span className="ma-telemetry-sep">•</span>
                <span className="ma-telemetry-locus">LOCUS: {consciousness?.activeSection || 'SYS'}</span>
              </div>
            </div>
            {ownerState.active && <span className="ma-owner-badge">⚙ Owner</span>}

            {/* Clear Conversation Memory */}
            <button
              className="ma-clear-btn"
              onClick={handleClearConversation}
              title="Purge session memory & reset"
              aria-label="Clear session memory"
            >
              <FiTrash2 size={12} />
            </button>

            {/* Neural Voice Synthesis Toggle */}
            <button
              className={`ma-voice-toggle ${voiceEnabled ? 'ma-voice-toggle--active' : ''} ${isSpeaking ? 'ma-voice-toggle--speaking' : ''}`}
              onClick={toggleVoice}
              title={voiceEnabled ? "Neural Voice: ACTIVE (Click to Mute)" : "Neural Voice: MUTED (Click to Activate)"}
              aria-label="Toggle Neural Voice"
            >
              {voiceEnabled ? (
                <>
                  <span className="ma-voice-bars">
                    <span className={`ma-vbar ${isSpeaking ? 'active' : ''}`} />
                    <span className={`ma-vbar ${isSpeaking ? 'active' : ''}`} />
                    <span className={`ma-vbar ${isSpeaking ? 'active' : ''}`} />
                  </span>
                  <span className="ma-voice-label">{isSpeaking ? 'SPEAKING' : 'VOICE'}</span>
                </>
              ) : (
                <>
                  <FiVolumeX size={13} />
                  <span className="ma-voice-label">MUTE</span>
                </>
              )}
            </button>

            <button
              className="ma-close"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsSpeaking(false);
                setSpeakingMsgIndex(null);
                setOpen(false);
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Biomimetic Brain Oscilloscope */}
          <MiniAdhyEEG isThinking={loading} />

          {/* Messages */}
          <div className="ma-messages">
            {messages.map((msg, i) => {
              if (msg.role === 'system') return (
                <div key={i} className="ma-msg ma-msg--system">
                  <div className="ma-bubble ma-bubble--system">{msg.text}</div>
                </div>
              );
              if (msg.role === 'owner-cmd') return (
                <div key={i} className="ma-msg ma-msg--owner-cmd">
                  <div className="ma-bubble ma-bubble--owner-cmd">{msg.text}</div>
                </div>
              );
              return (
                <div key={i} className={`ma-msg ma-msg--${msg.role}`}>
                  {msg.role === 'bot' && <BotAvatar />}
                  <div className={`ma-bubble ma-bubble--${msg.role} ${msg.isSecurityRefusal ? 'ma-bubble--refusal' : ''}`}>
                    {/* Controlled Agent Tool Badge */}
                    {msg.toolMeta && (
                      <div className="ma-tool-badge" title={msg.toolMeta.output || ''}>
                        <FiCpu size={11} className="ma-tool-icon" />
                        <span className="ma-tool-text">⚡ TOOL: {msg.toolMeta.name}({msg.toolMeta.arg || ''})</span>
                      </div>
                    )}

                    <div className="ma-bubble-text">{msg.text}</div>

                    {msg.role === 'bot' && (
                      <div className="ma-bubble-actions">
                        <button
                          className="ma-bubble-action-btn"
                          onClick={() => handleCopyMessage(msg.text, i)}
                          title={copiedMsgIndex === i ? "Copied!" : "Copy message"}
                          aria-label="Copy message"
                        >
                          {copiedMsgIndex === i ? <FiCheck size={11} color="#10b981" /> : <FiCopy size={11} />}
                        </button>
                        <button
                          className={`ma-bubble-speak-btn ${speakingMsgIndex === i && isSpeaking ? 'ma-bubble-speak-btn--active' : ''}`}
                          onClick={() => handleSpeakBubble(msg.text, i)}
                          title={speakingMsgIndex === i && isSpeaking ? "Stop speaking" : "Listen via Neural Voice"}
                          aria-label="Listen via Neural Voice"
                        >
                          {speakingMsgIndex === i && isSpeaking ? <FiVolume2 size={11} /> : <FiVolume1 size={11} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && <TypingBubble />}

            {/* Starters (only show before first user message) */}
            {messages.length === 1 && (
              <div className="ma-starters">
                {STARTERS.map(s => (
                  <button key={s} className="ma-starter-btn" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {ownerState.active && (
            <div className="ma-owner-hint">
              ⚙ owner mode — type /help for commands
            </div>
          )}
          <div className="ma-input-row">
            <input
              ref={inputRef}
              className={`ma-input ${ownerState.active ? 'ma-input--owner' : ''}`}
              placeholder={ownerState.active ? '/ command or type a message…' : 'Ask me anything…'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
            />
            <button
              className="ma-send"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MiniAdhy;
