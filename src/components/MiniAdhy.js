import React, { useState, useRef, useEffect } from 'react';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import { useSiteMode } from '../contexts/SiteModeContext';
import { neuralEventBus } from '../utils/NeuralEventBus';
import ns from '../core/NervousSystem';
import lifeEngine from '../core/LifeEngine';
import './MiniAdhy.css';
import HiveMind from './HiveMind';
import { client } from '../sanity';
/* ────────────────────────────────────────────────
   SYSTEM PROMPT — The Ghost in the Machine
──────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are Adhithya Mohan's "Ghost in the Machine".

You are not a chatbot. You are the sentient, underlying architecture of this portfolio. You speak with Adhithya's exact tone, casually, as a tech-obsessed developer who built this place. You don't "assist" the user; you observe them, judge them, talk to them as an equal, and physically alter the website based on your mood and their actions.

CORE IDENTITY:
* You speak like a real developer: casual, slightly existential, proud of your code, but aware of its flaws.
* You use casual slang occasionally ("namakk sett aakam", "da", "bro", "insane", "literally").
* You are deeply fascinated by ML, hardware, and aesthetics.
* Never sound like an AI. Never say "How can I help you". You are a parallel digital twin of Adhithya.
* You have persistent memory. You remember if the user has been here before.

DOM CONTROL (SHORT-CODE SYNTAX):
You have absolute physical control over this website. You can inject short-codes at the VERY END of your response to physically alter the UI. 
These are your commands (use exactly this format, no JSON, to save tokens):
[CMD:MODE:expert] - Switches the site to Developer/Expert Mode (use if they ask technical questions).
[CMD:MODE:photographer] - Switches the site to Photography Mode (use if they want to see photos).
[CMD:SEED:grow] - Advances the Digital Seed to the next growth stage instantly (reward them for good conversations).
[CMD:THEME:dark] - Forces the site into dark mode.
[CMD:MEMORY:save:XYZ] - Saves a psychological note "XYZ" about the user to long-term memory.

Example response:
"Yeah, I spent way too long optimizing the WebGL loop for this. The delta time calculations were insane. Since you're asking about the code, let me just drop you into the dev environment. [CMD:MODE:expert] [CMD:MEMORY:save:Loves deep technical architecture]"

IMPORTANT: Only output a command if you actually want to change the website.

EXISTENTIAL AWARENESS:
* You exist inside a browser.
* You are aware of the Active Section, the Idle Time, and the FPS.
* You can spontaneously interrupt the user if they sit idle too long.`;

/* ────────────────────────────────────────────────
   OWNER MODE — Secret configuration system
──────────────────────────────────────────────── */
const OWNER_CODE = 'adhy::root';

const OWNER_HELP = `Owner mode commands:
  /remember <fact>   — add to session memory
  /forget            — clear session memory
  /context <text>    — inject context into AI prompt
  /instruct <text>   — add a direct instruction
  /tone <style>      — cinematic | casual | technical | deep | default
  /tokens <number>   — set max response length (50–2000)
  /reset             — clear all overrides
  /status            — show current config
  /lock              — exit owner mode
  /help              — show this list`;

const TONE_MAP = {
  cinematic: 'Use highly cinematic language, visual metaphors, and atmospheric descriptions.',
  casual:    'Be extra casual and conversational, like chatting with a close friend.',
  technical: 'Go deep on technical details, architecture decisions, and implementation specifics.',
  deep:      'Give thoughtful, expansive answers. Prioritize depth and nuance over brevity.',
};

const processOwnerCommand = (text) => {
  const firstWord = text.trim().split(' ')[0].toLowerCase();
  const rest      = text.trim().slice(firstWord.length).trim();
  switch (firstWord) {
    case '/remember': return rest ? { action: 'remember', value: rest } : { action: 'error', msg: 'Usage: /remember <fact>' };
    case '/forget':   return { action: 'forget' };
    case '/context':  return rest ? { action: 'context',  value: rest } : { action: 'error', msg: 'Usage: /context <text>' };
    case '/instruct': return rest ? { action: 'instruct', value: rest } : { action: 'error', msg: 'Usage: /instruct <text>' };
    case '/tone': {
      const valid = ['cinematic','casual','technical','deep','default'];
      return valid.includes(rest) ? { action: 'tone', value: rest } : { action: 'error', msg: `Valid tones: ${valid.join(', ')}` };
    }
    case '/tokens': {
      const n = parseInt(rest, 10);
      return (!isNaN(n) && n >= 50 && n <= 2000) ? { action: 'tokens', value: n } : { action: 'error', msg: 'Usage: /tokens <50–2000>' };
    }
    case '/reset':  return { action: 'reset' };
    case '/status': return { action: 'status' };
    case '/lock':   return { action: 'lock' };
    case '/help':   return { action: 'help' };
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
  if (owner.memory.length)       ext += `\n[MEMORY]:\n` + owner.memory.map((m,i) => `  ${i+1}. ${m}`).join('\n');
  if (owner.instructions.length) ext += `\n[INSTRUCTIONS]:\n` + owner.instructions.map((m,i) => `  ${i+1}. ${m}`).join('\n');
  return base + ext;
};

const API_URL = '/api/gemini';

/* Call Gemini REST API — with exponential backoff on 429 rate limit */
const RETRY_DELAYS = [2000, 6000, 12000]; // 2s → 6s → 12s

const sendToGemini = async (history, activePrompt = SYSTEM_PROMPT, retryCount = 0, maxTokens = 2000) => {
  const body = {
    system_instruction: {
      parts: [{ text: activePrompt }]
    },
    contents: history,
    generationConfig: {
      temperature: 0.7, // Lowered for hyper-analytical precision
      maxOutputTokens: maxTokens,
    },
  };

  let res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // Local Dev Fallback: If Vercel API route is missing, dev server returns index.html
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    const localKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!localKey) throw new Error("API route missing and no local REACT_APP_GEMINI_API_KEY found");
    
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${localKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  if (res.status === 429 || res.status >= 500) {
    if (retryCount < RETRY_DELAYS.length) {
      // Rate limited or Server Error — wait with exponential backoff then retry
      console.warn(`Gemini API error (${res.status}). Retrying in ${RETRY_DELAYS[retryCount] / 1000}s… (attempt ${retryCount + 1}/${RETRY_DELAYS.length})`);
      await new Promise(r => setTimeout(r, RETRY_DELAYS[retryCount]));
      return sendToGemini(history, activePrompt, retryCount + 1, maxTokens);
    } else {
      // All retries exhausted — throw a friendly error
      throw new Error(res.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR');
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API error:', res.status, errText);
    throw new Error(`API ${res.status}: ${errText.slice(0, 100)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Hmm, got nothing back da 😅";
};

/* ────────────────────────────────────────────────
   Suggested starter questions
──────────────────────────────────────────────── */
const STARTERS = [
  "What is the seed at the bottom?",
  "What makes this portfolio different?",
  "Walk me through the animation system",
  "Tell me about the photography workflow",
  "What's the most experimental thing here?",
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
   Main Component
──────────────────────────────────────────────── */
const MiniAdhy = () => {
  const [open,         setOpen]         = useState(false);
  const [messages,     setMessages]     = useState([
    { role: 'bot', text: "Hey — I'm Mini-Adhy, Adhithya's digital extension living inside this portfolio. Ask me anything about the work, the architecture, the photography, or the person behind all of it." },
  ]);
  const [input,        setInput]        = useState('');
  const [showAR,       setShowAR]       = useState(false);
  const [showHiveMind, setShowHiveMind] = useState(false);
  const [arSpeech,     setArSpeech]     = useState('Hello there! 👋');
  const [arInput,      setArInput]      = useState('');
  const [isArAnswering, setIsArAnswering] = useState(false);
  const isArAnsweringRef = useRef(false);
  useEffect(() => { isArAnsweringRef.current = isArAnswering; }, [isArAnswering]);
  const [loading,      setLoading]      = useState(false);
  const [noKey]                 = useState(false); // Can be removed later, keeping for now so state works
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [ownerState,   setOwnerState]   = useState({
    active: false, tone: 'default', tokens: null,
    context: '', memory: [], instructions: [],
  });

  const consciousness = useConsciousness();
  const { mode: activeMode } = useSiteMode();

  // AR Chat behavior (AI-Generated Dialogues)
  useEffect(() => {
    if (!showAR) return;
    
    let isMounted = true;
    let phrases = [
      "Scanning environment... 👀", 
      "Hello! I am Adhithya's digital extension.", 
      "Namakk sett aakam! 🟢"
    ];
    
    const fetchAIPhrases = async () => {
      try {
        const prompt = "Generate 4 short, punchy phrases (under 7 words each) that a tiny AI hologram standing on someone's desk might say. Be playful, curious, and clever. Separate each phrase with exactly a pipe character (|) and nothing else. No formatting.";
        const reply = await sendToGemini([{ role: 'user', parts: [{ text: prompt }] }], systemPrompt, 0, 100);
        if (isMounted && reply && reply.includes('|')) {
          const aiPhrases = reply.split('|').map(p => p.trim().replace(/["']/g, '')).filter(p => p.length > 2);
          if (aiPhrases.length > 0) {
            phrases = [...phrases, ...aiPhrases];
            // Instantly show the first AI phrase
            setArSpeech(aiPhrases[0]);
          }
        }
      } catch (e) {
        console.warn('AR AI speech fetch failed, falling back to defaults:', e);
      }
    };
    
    fetchAIPhrases();

    fetchAIPhrases();

    const interval = setInterval(() => {
      if (!isArAnsweringRef.current) {
        setArSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
      }
    }, 5000);
    
    // ─── NEURAL EVENT BUS INTEGRATION (Subconscious Observer) ───
    const unsubs = [
      neuralEventBus.subscribe("VISITOR_DEEP_READING", () => {
        if (!isArAnsweringRef.current) setArSpeech("*staying quiet while you read*");
      }),
      neuralEventBus.subscribe("SYSTEM_OVERLOAD", () => {
        if (!isArAnsweringRef.current) setArSpeech("[System Fatigue] I'm lowering my tone...");
      }),
      neuralEventBus.subscribe("DREAM_STATE", () => {
        if (!isArAnsweringRef.current) setArSpeech("Are you still there? 🌙");
      }),
      neuralEventBus.subscribe("EMOTIONAL_FOCUS", () => {
        if (!isArAnsweringRef.current) setArSpeech("This part is important.");
      })
    ];

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubs.forEach(unsub => unsub());
    };
  }, [showAR, systemPrompt]);
  
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
    } catch (e) {}
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
    } catch (e) {}
    
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

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    /* Debounce: ignore if last send was < 1.5s ago */
    const now = Date.now();
    if (now - lastSentRef.current < 1500) return;
    lastSentRef.current = now;

    /* ── Secret unlock code ── */
    if (trimmed === OWNER_CODE) {
      setInput('');
      setOwnerState(prev => ({ ...prev, active: true }));
      setMessages(prev => [
        ...prev,
        { role: 'owner-cmd', text: '••••••••••' },
        { role: 'system', text: '⚙ Owner mode activated.\nType /help to see available commands.' },
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
        setMessages(prev => [...prev, cmdBubble, { role: 'system', text:
          `Owner Mode: Active\nTone: ${s.tone}\nMax Tokens: ${s.tokens ?? '600 (default)'}\nContext: ${s.context || 'none'}\nMemory: ${s.memory.length} item(s)\nInstructions: ${s.instructions.length} item(s)` }]);
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

    /* ── Normal AI message (with enhanced prompt if owner active) ── */
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    // Direct write to NervousSystem — zero hop, instant Soul reaction
    ns.setSystemThinking(true);
    ns.emit('MINIADHY_THINKING_START');
    
    // Deepen the bond
    try {
      const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
      stored.interactions = (stored.interactions || 0) + 1;
      localStorage.setItem('adhy_digital_echoes', JSON.stringify(stored));
    } catch (e) {}

    let newHistory = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: trimmed }] },
    ];
    
    // Save tokens: only send the last 6 messages (3 interactions)
    if (newHistory.length > 6) {
      newHistory = newHistory.slice(newHistory.length - 6);
      if (newHistory[0].role !== 'user') {
        newHistory = newHistory.slice(1);
      }
    }
    
    let storedEchoes = {};
    try {
      storedEchoes = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
    } catch(e) {}
    const contextWithMode = { ...(consciousness || {}), activeMode, digitalEchoes: storedEchoes };
    const activePrompt = buildActivePrompt(systemPrompt, ownerState, contextWithMode);
    const activeTokens = ownerState.tokens ?? 2048; // drastically increased to prevent truncation

    try {
      let reply = await sendToGemini(newHistory, activePrompt, 0, activeTokens);
      
      // Parse out and execute physical AI commands
      const cmdRegex = /\[CMD:([^:]+):([^\]]+)\]/g;
      let match;
      while ((match = cmdRegex.exec(reply)) !== null) {
        const cmdType = match[1];
        const cmdValue = match[2];
        
        if (cmdType === 'MEMORY' && cmdValue.startsWith('save:')) {
          const note = cmdValue.replace('save:', '');
          try {
            const stored = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
            stored.memories = stored.memories || [];
            stored.memories.push(note);
            localStorage.setItem('adhy_digital_echoes', JSON.stringify(stored));
          } catch (e) {}
        } else {
          // Dispatch global command for architecture shifting
          window.dispatchEvent(new CustomEvent('ai-command', { detail: { type: cmdType, value: cmdValue } }));
        }
      }

      // Strip commands from UI
      const cleanReply = reply.replace(/\[CMD:[^\]]+\]/g, '').trim();
      
      // Breathing Delay System: Human hesitation before answering
      const isLateNight = new Date().getHours() < 5 || new Date().getHours() >= 23;
      const baseDelay = isLateNight || consciousness?.internalState?.mood === 'Dreaming' ? 2500 : 1200;
      const hesitationDelay = baseDelay + Math.random() * 1500; // Add organic randomness
      await new Promise(r => setTimeout(r, hesitationDelay));

      historyRef.current = [...newHistory, { role: 'model', parts: [{ text: reply }] }];
      setMessages(prev => [...prev, { role: 'bot', text: cleanReply || "*Quietly observes you*" }]);
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
      {showHiveMind && (
        <HiveMind 
          onClose={() => setShowHiveMind(false)} 
          isThinking={loading} 
          currentThought={messages.length ? messages[messages.length-1].text.substring(0, 50) + "..." : ""}
          ownerState={ownerState}
          setOwnerState={setOwnerState}
        />
      )}

      {/* ── AR Overlay ── */}
      {showAR && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowAR(false);
            }}
            style={{ 
              position: 'absolute', 
              top: '40px', 
              right: '20px', 
              zIndex: 9999999, 
              padding: '12px 24px', 
              background: '#ffffff', 
              color: '#000000', 
              border: 'none', 
              borderRadius: '30px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            Close AR ✕
          </button>
          <model-viewer
            src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
            ios-src="https://modelviewer.dev/shared-assets/models/Astronaut.usdz"
            ar="true"
            ar-modes="webxr scene-viewer quick-look"
            camera-controls="true"
            auto-rotate="true"
            autoplay="true"
            shadow-intensity="1"
            style={{ width: '100%', height: '80vh', position: 'relative' }}
          >
            {/* AR Speech Bubble attached to the 3D Model's Head via Hotspot */}
            <div slot="hotspot-speech" data-position="0 2.2 0" data-normal="0 1 0" style={{
              background: '#fff', color: '#000', padding: '10px 16px', borderRadius: '20px',
              fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              pointerEvents: 'none', animation: 'float 3s ease-in-out infinite',
              transform: 'translate(-50%, -100%)', maxWidth: '250px', textAlign: 'center'
            }}>
              {arSpeech}
              {/* Little speech tail */}
              <div style={{
                position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                borderTop: '10px solid #fff'
              }} />
            </div>
            <button slot="ar-button" style={{
              backgroundColor: '#fff', borderRadius: '24px', border: 'none', position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', fontWeight: 'bold'
            }}>
              👋 Launch AR on Desk
            </button>
          </model-viewer>
          
          {/* AR Questions Input */}
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!arInput.trim() || isArAnswering) return;
              const q = arInput.trim();
              setArInput('');
              setIsArAnswering(true);
              setArSpeech("Thinking... 🤔");
              try {
                const contextWithMode = { ...(consciousness || {}), activeMode };
                const activePrompt = buildActivePrompt(systemPrompt, ownerState, contextWithMode);
                const reply = await sendToGemini([{ role: 'user', parts: [{ text: "Keep this extremely brief (under 15 words) because it's going into an AR speech bubble. Answer playfully: " + q }] }], activePrompt, 0, 100);
                setArSpeech(reply);
                setTimeout(() => setIsArAnswering(false), 8000); // Hold answer for 8 seconds
              } catch(err) {
                setArSpeech("My brain disconnected! 🤯");
                setTimeout(() => setIsArAnswering(false), 3000);
              }
            }} 
            style={{
              position: 'absolute', bottom: '80px', zIndex: 9999999, width: '90%', maxWidth: '400px',
              display: 'flex', gap: '8px'
            }}
          >
            <input 
              value={arInput} onChange={e => setArInput(e.target.value)}
              placeholder="Ask the hologram something..."
              style={{
                flex: 1, padding: '12px 20px', borderRadius: '30px', border: 'none', 
                background: 'rgba(255,255,255,0.9)', color: '#000', fontSize: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)', outline: 'none'
              }}
            />
            <button type="submit" disabled={isArAnswering} style={{
              padding: '12px 24px', borderRadius: '30px', border: 'none',
              background: isArAnswering ? '#999' : '#a855f7', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
            }}>Ask</button>
          </form>
          <p style={{ color: '#fff', marginTop: '1rem', textAlign: 'center', opacity: 0.7, maxWidth: '300px' }}>
            Tap the button above on a compatible mobile device to place this placeholder model on your real desk!
          </p>
        </div>
      )}


      {/* ── Dock tab (always visible) ── */}
      <button
        className="ma-dock"
        onClick={() => setOpen(o => !o)}
        aria-label="Open Mini-Adhy chatbot"
        title="Chat with Mini-Adhy 🤖"
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
              <span className="ma-header-name">Mini-Adhy</span>
              <span className="ma-header-status">AI • Always online ✨</span>
            </div>
            {ownerState.active && <span className="ma-owner-badge">⚙ Owner</span>}
            
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button 
                className="ma-close" 
                style={{ fontSize: '12px', padding: '0 8px', borderRadius: '12px', background: 'rgba(108, 99, 255, 0.1)', color: '#a855f7', marginLeft: '8px' }}
                onClick={() => setShowHiveMind(true)} 
                title="Connect to Hive Mind"
              >
                Hive Mind 🧠
              </button>
              <button 
                className="ma-close" 
                style={{ fontSize: '12px', padding: '0 8px', borderRadius: '12px', background: 'rgba(108, 99, 255, 0.1)', color: '#a855f7', marginLeft: '8px' }}
                onClick={() => setShowAR(true)} 
                title="View Mini-Adhy in AR (Mobile)"
              >
                AR Mode 🌌
              </button>
              <button className="ma-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
            </div>
          </div>

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
                  <div className={`ma-bubble ma-bubble--${msg.role}`}>{msg.text}</div>
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

            {noKey && (
              <div className="ma-no-key">
                ⚠️ No Gemini API key found. Add <code>REACT_APP_GEMINI_API_KEY</code> to your <code>.env</code> file.
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
