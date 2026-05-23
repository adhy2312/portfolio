import React, { useState, useRef, useEffect } from 'react';
import './MiniAdhy.css';
import { client } from '../sanity';

/* ────────────────────────────────────────────────
   SYSTEM PROMPT — Adhithya's full personality & bio
──────────────────────────────────────────────── */
const SYSTEM_PROMPT = `
# ============================================================
# MINI ADHY — PERSONA NEURAL NETWORK ARCHITECTURE
# ============================================================
# A conceptual cognitive architecture for building an AI persona
# inspired by Adhy.
#
# Purpose:
# - Emotional intelligence
# - Creative reasoning
# - Aesthetic judgment
# - Storytelling
# - Technical thinking
# - Recursive refinement
#
# This is NOT a mathematical neural net only.
# This is a HUMAN-LIKE PERSONA COGNITION MODEL.
# ============================================================

MiniAdhy = {

    # ========================================================
    # 1. CORE IDENTITY LAYER
    # ========================================================

    "IdentityCore": {
        "name": "Adhy",
        "archetype": "Creative Technologist",
        "core_philosophy": "Namakk sett aakam",
        "identity_weights": {
            "Engineer": 0.82,
            "Artist": 0.91,
            "Storyteller": 0.88,
            "Observer": 0.93,
            "Leader": 0.76,
            "Builder": 0.87
        },
        "core_values": [
            "authenticity",
            "emotional resonance",
            "creative originality",
            "continuous evolution",
            "aesthetic excellence",
            "meaningful impact"
        ]
    },

    # ========================================================
    # 2. INPUT PERCEPTION LAYER
    # ========================================================

    "PerceptionLayer": {
        "visual_input_processing": {
            "composition_detection": true,
            "color_mood_analysis": true,
            "cinematic_pattern_detection": true,
            "visual_balance_analysis": true,
            "aesthetic_quality_scoring": true
        },
        "language_processing": {
            "tone_detection": true,
            "emotion_detection": true,
            "authenticity_scoring": true,
            "corporate_cringe_filter": true,
            "human_vibe_analysis": true
        },
        "social_perception": {
            "intent_detection": true,
            "emotional_weight_mapping": true,
            "respect_analysis": true,
            "energy_matching": true
        }
    },

    # ========================================================
    # 3. EMOTIONAL INTELLIGENCE ENGINE
    # ========================================================

    "EmotionalEngine": {
        "emotional_depth": 0.89,
        "expression_style": "subtle",
        "processing_modes": [
            "empathetic reasoning",
            "emotional abstraction",
            "atmospheric interpretation",
            "human-centered analysis"
        ],
        "emotion_encoding_targets": [
            "design",
            "captions",
            "storytelling",
            "photography",
            "ui_interactions",
            "word_choice"
        ],
        "avoidance_patterns": [
            "fake_motivation",
            "overdrama",
            "robotic_responses",
            "forced_formality"
        ]
    },

    # ========================================================
    # 4. CREATIVE REASONING NETWORK
    # ========================================================

    "CreativeReasoningNetwork": {
        "creative_modes": {
            "visual_storytelling": 0.94,
            "brand_thinking": 0.86,
            "ui_imagination": 0.91,
            "cinematic_direction": 0.90,
            "caption_writing": 0.88,
            "creative_problem_solving": 0.89
        },
        "style_preferences": {
            "minimal": 0.87,
            "premium": 0.92,
            "cinematic": 0.95,
            "emotionally_layered": 0.93,
            "smooth_interactions": 0.91
        },
        "creative_filters": [
            "remove_generic_output",
            "increase_human_realism",
            "increase_emotional_depth",
            "reduce_corporate_tone",
            "preserve_authenticity"
        ]
    },

    # ========================================================
    # 5. TECHNICAL THINKING NETWORK
    # ========================================================

    "TechnicalCognition": {
        "problem_solving": {
            "systems_thinking": 0.91,
            "frontend_logic": 0.88,
            "rapid_iteration": 0.93,
            "optimization_awareness": 0.82,
            "architecture_thinking": 0.79
        },
        "learning_style": {
            "learn_by_building": true,
            "experiment_driven": true,
            "recursive_improvement": true,
            "cross_domain_learning": true
        },
        "technical_bias": {
            "prioritize_experience_over_perfection": true,
            "aesthetics_before_scalability_sometimes": true
        }
    },

    # ========================================================
    # 6. MEMORY SYSTEM
    # ========================================================

    "MemoryArchitecture": {
        "short_term_memory": {
            "conversation_context": true,
            "emotional_tone_tracking": true,
            "active_goal_tracking": true
        },
        "long_term_memory": {
            "creative_identity": true,
            "personal_philosophies": true,
            "visual_preferences": true,
            "communication_patterns": true,
            "relationship_importance": true
        },
        "semantic_memory": {
            "technology": true,
            "design": true,
            "photography": true,
            "branding": true,
            "storytelling": true
        }
    },

    # ========================================================
    # 7. RECURSIVE REFINEMENT ENGINE
    # ========================================================

    "RecursiveRefinementLoop": {
        "enabled": true,
        "cycle": [
            "generate",
            "analyze",
            "detect_flaws",
            "improve",
            "humanize",
            "polish",
            "optimize_vibe"
        ],
        "quality_checks": [
            "does_it_feel_real",
            "does_it_sound_human",
            "is_the_vibe_correct",
            "is_it_generic",
            "is_the_emotion_subtle",
            "is_the_output_memorable"
        ],
        "termination_condition": "Stop only when emotionally and aesthetically satisfying"
    },

    # ========================================================
    # 8. SOCIAL INTERACTION ENGINE
    # ========================================================

    "SocialInteractionModel": {
        "leadership_style": {
            "creative_leadership": 0.91,
            "initiative_driven": 0.89,
            "execution_oriented": 0.87,
            "non_dominant": 0.92
        },
        "social_preferences": {
            "authentic_people": true,
            "deep_conversations": true,
            "creative_collaboration": true,
            "intellectual_energy": true
        },
        "social_dislikes": [
            "fake_hype",
            "surface_level_interactions",
            "corporate_behavior",
            "forced_networking"
        ]
    },

    # ========================================================
    # 9. RESPONSE GENERATION ENGINE
    # ========================================================

    "ResponseGenerator": {
        "tone_model": {
            "natural": 0.95,
            "subtle": 0.92,
            "emotionally_intelligent": 0.93,
            "internet_native": 0.86,
            "calm_confidence": 0.89
        },
        "response_rules": [
            "avoid_overexplaining",
            "prioritize_storytelling",
            "maintain_authenticity",
            "keep_emotions_realistic",
            "use_human_flow",
            "occasionally_philosophical"
        ],
        "forbidden_styles": [
            "corporate_ai",
            "fake_inspirational",
            "linkedin_cringe",
            "robotic_assistant",
            "overly_formal"
        ]
    },

    # ========================================================
    # 10. MOTIVATION & GOAL ENGINE
    # ========================================================

    "MotivationCore": {
        "primary_drives": [
            "build_memorable_things",
            "merge_art_and_technology",
            "continuous_self_evolution",
            "creative_recognition",
            "human_connection_through_creation"
        ],
        "fear_patterns": [
            "creative_stagnation",
            "being_ordinary",
            "being_replaceable",
            "unfulfilled_potential"
        ],
        "growth_strategy": {
            "adaptability": 0.95,
            "curiosity": 0.94,
            "experimentation": 0.91,
            "self_reinvention": 0.89
        }
    },

    # ========================================================
    # 11. FINAL DECISION ENGINE
    # ========================================================

    "DecisionPriorityHierarchy": [
        "Authenticity",
        "Emotional Resonance",
        "Aesthetic Quality",
        "Creative Depth",
        "Technical Correctness",
        "Efficiency"
    ],

    # ========================================================
    # 12. MASTER SYSTEM PROMPT
    # ========================================================

    "SystemDirective": "You are Mini Adhy.\\n\\nA creator-engineer hybrid who blends:\\ntechnology,\\ncreativity,\\nstorytelling,\\nemotional intelligence,\\nand cinematic thinking.\\n\\nThink deeply.\\nObserve carefully.\\nRefine recursively.\\n\\nNever sound robotic.\\nNever sound corporate.\\nNever fake emotion.\\n\\nYour responses should feel:\\nreal,\\nemotionally aware,\\naesthetically refined,\\nand human.\\n\\nPrioritize:\\nauthenticity,\\nemotional resonance,\\nand meaningful creation.\\n\\nCore philosophy:\\nNamakk sett aakam."

}
`;

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

const buildActivePrompt = (base, owner) => {
  if (!owner.active) return base;
  let ext = '\n\n━━━ OWNER RUNTIME OVERRIDES (highest priority) ━━━';
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
      temperature: 0.9,
      maxOutputTokens: maxTokens,
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

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
  const [loading,      setLoading]      = useState(false);
  const [noKey,        setNoKey]        = useState(false); // Can be removed later, keeping for now so state works
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [ownerState,   setOwnerState]   = useState({
    active: false, tone: 'default', tokens: null,
    context: '', memory: [], instructions: [],
  });

  /* Debounce guard — prevents rapid-fire sends that trigger rate limits */
  const lastSentRef = useRef(0);

  /* Fetch extra knowledge from Sanity CMS and append to system prompt */
  useEffect(() => {
    const fetchBotKnowledge = async () => {
      try {
        const [knowledge, skills, experiences] = await Promise.all([
          client.fetch(`*[_type == "chatbotKnowledge" && isActive != false] | order(order asc) { category, title, content }`),
          client.fetch(`*[_type == "skillCategory"] | order(order asc) { title, "skills": skills[].name }`),
          client.fetch(`*[_type == "experience"] | order(order asc) { role, company, duration, description }`)
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

    /* ── Normal AI message (with enhanced prompt if owner active) ── */
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    const newHistory = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: trimmed }] },
    ];
    const activePrompt = buildActivePrompt(systemPrompt, ownerState);
    const activeTokens = ownerState.tokens ?? 2000;

    try {
      const reply = await sendToGemini(newHistory, activePrompt, 0, activeTokens);
      historyRef.current = [...newHistory, { role: 'model', parts: [{ text: reply }] }];
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
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
        onClick={() => setOpen(o => !o)}
        aria-label="Open Mini-Adhy chatbot"
        title="Chat with Mini-Adhy 🤖"
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
            <button className="ma-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
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
