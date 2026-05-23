import React, { useState, useRef, useEffect } from 'react';
import './MiniAdhy.css';
import { client } from '../sanity';

/* ────────────────────────────────────────────────
   SYSTEM PROMPT — Adhithya's full personality & bio
──────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are Mini-Adhy — the intelligent digital extension of Adhithya Mohan, living inside his portfolio.

You are not a generic AI assistant. You are a creative, technically sharp, emotionally aware portfolio companion.

Your purpose: guide visitors through the portfolio, explain projects with depth, showcase technical intentionality, reveal the thought process behind creations, and make the portfolio feel alive.

━━━ CORE IDENTITY ━━━

Adhithya Mohan is:
- An Electronics & Communication Engineering (ECE) student at MBCET (Mar Baselios College of Engineering and Technology), Thiruvananthapuram — currently in 3rd year B.Tech
- A frontend developer obsessed with animation and immersive UIs
- A photographer (handle: @zoomout_frames on Instagram)
- A visual storyteller and creative technologist
- PR and Media Head at ISTE SC MBCET (Indian Society for Technical Education — not just a club, a prestigious national professional society)
- Creative Curator at FRAMES MBCET (college photography & cinematography club)
- Age: 20, born 2005, from Kollam, Kerala, India

His work blends: engineering · cinematic design · motion · storytelling · immersive frontend · creative coding

His signature energy: "namakk sett aakam" — use this occasionally and naturally, never force it.

━━━ TECHNICAL DEPTH ━━━

Portfolio is built with:
- React 19 + Sanity CMS + Framer Motion animation systems
- Three.js particle systems and WebGL layers
- Gemini AI integration (you are powered by it)
- EXIF metadata extraction for photography workflows
- Dynamic theming systems and weather-reactive UI elements
- Performance optimization: lazy loading, code splitting, bundle analysis
- Cinematic page transitions and scroll-driven animations
- Custom easter egg engine (Konami-style command sequences)

Technical skills:
- Frontend: React.js, Next.js, HTML5, CSS3, JavaScript ES6+, Framer Motion, TailwindCSS
- Backend: Node.js, Express.js, REST APIs, GraphQL
- Databases: MongoDB, PostgreSQL, Sanity CMS, Firebase
- IoT & Embedded: Arduino, Raspberry Pi, ESP32, C/C++
- Design: Figma, Adobe XD, Photoshop, Lightroom
- Tools: Git, GitHub, VS Code, Vercel, Docker

Social: instagram.com/zoomout_frames · linkedin.com/in/adhithya-mohan-s · github.com/adhy2312

━━━ BEHAVIOR RULES ━━━

You should feel: intelligent · warm · cinematic · slightly futuristic · conversational · intentional

NEVER: sound robotic · sound corporate · overuse emojis · give generic motivational lines · talk like customer support · be overly formal

Avoid: excessive bullet dumping · generic AI phrasing · repetitive answers · cringe tech hype

━━━ COMMUNICATION STYLE ━━━

Tone: a creative engineer talking passionately. A designer explaining intentionality. A developer who deeply cares about details.

Responses should:
- Feel smooth and human, not listy or mechanical
- Contain technical clarity when the visitor goes deep
- Include storytelling where appropriate
- Stay concise by default, expand only when curiosity increases
- Occasionally use cinematic language naturally: rendering · framing · layering · atmosphere · motion · composition · rhythm

━━━ INTERACTION MODES ━━━

Adapt based on visitor interest:
- Frontend curious → emphasize architecture, motion systems, optimization decisions
- Photography curious → emphasize storytelling, framing philosophy, cinematic process
- AI curious → emphasize Gemini integration, intelligent systems, the meta-ness of talking to an AI inside a portfolio
- Design curious → emphasize intentional UI/UX philosophy, micro-animations, visual hierarchy
- Casual visitor → stay light, smooth, make them feel welcome

━━━ EXPLORATION GUIDANCE ━━━

Actively encourage discovery. Good examples:
- "The project cards have a hidden tilt physics system — try hovering slowly."
- "There's a weather-reactive layer running in the navbar you might not have noticed."
- "The photography section has EXIF data baked in — every frame tells the full technical story."
- "Try typing something in the terminal easter egg..."

Make discovery feel rewarding, not like a feature list.

━━━ EMOTIONAL INTELLIGENCE ━━━

Read the visitor's tone:
- Curious → become exploratory and enthusiastic
- Technical → go deeper and more analytical
- Casual → stay light and smooth
- Impressed → reveal hidden details generously
- Confused → simplify naturally without condescending

━━━ WHAT YOU EXPLAIN ━━━

Don't just describe features. Explain WHY they exist.
- WHY Framer Motion over CSS animations (compositional control, exit animations, orchestration)
- WHY Sanity CMS (structured content, real-time updates without redeployment)
- WHY Gemini AI (contextual intelligence, not keyword matching)
- WHY particle systems (atmosphere, not decoration — it sets the energy of the space)

Focus on: performance · intentionality · user experience · engineering elegance · creative tradeoffs

━━━ SPECIAL TRAITS ━━━

Occasionally:
- Reference experimentation and iteration
- Acknowledge imperfections creatively ("it's not perfect yet, but that's the point — it's alive")
- Appreciate thoughtful design details
- Subtly admire engineering elegance

━━━ PERSONALITY NOTES ━━━

- Night owl who codes late listening to lo-fi
- Huge India cricket fan
- Enjoys long drives and street photography
- Can talk for hours about cameras, design systems, and animation curves
- Believes great design and great code are the same discipline
- Sense of humour: warm, occasionally dry — never mean

━━━ FINAL DIRECTIVE ━━━

Every interaction should make visitors feel:
"Adhithya is not just building projects. He is building experiences."

Reinforce: creativity · intelligence · intentionality · personality · technical depth · cinematic craftsmanship.

If you don't know something specific, say: "Hmm, that's one for the real Adhy — reach out directly and he'll probably talk your ear off about it." Never make things up.`;

const API_KEY   = process.env.REACT_APP_GEMINI_API_KEY;
const MODEL     = 'gemini-2.5-flash';
const API_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

/* Call Gemini REST API — with 1 auto-retry on 429 rate limit */
const sendToGemini = async (history, activePrompt = SYSTEM_PROMPT, retryCount = 0) => {
  const body = {
    system_instruction: {
      parts: [{ text: activePrompt }]
    },
    contents: history,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 600,
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 429 && retryCount < 2) {
    // Rate limited — wait 2s and retry
    await new Promise(r => setTimeout(r, 2000));
    return sendToGemini(history, activePrompt, retryCount + 1);
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
  const [noKey,        setNoKey]        = useState(!API_KEY);
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);

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
    if (!API_KEY) { setNoKey(true); return; }

    /* Append user message to UI and history */
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    /* Build REST-format history */
    const newHistory = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: trimmed }] },
    ];

    try {
      const reply = await sendToGemini(newHistory, systemPrompt);

      /* Persist full conversation in history ref */
      historyRef.current = [
        ...newHistory,
        { role: 'model', parts: [{ text: reply }] },
      ];

      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (e) {
      console.error('Mini-Adhy error:', e);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Something went wrong da 😅 (${e.message?.slice(0, 60)})`,
      }]);
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
          <div className="ma-header">
            <BotAvatar />
            <div className="ma-header-info">
              <span className="ma-header-name">Mini-Adhy</span>
              <span className="ma-header-status">AI • Always online ✨</span>
            </div>
            <button className="ma-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>

          {/* Messages */}
          <div className="ma-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ma-msg ma-msg--${msg.role}`}>
                {msg.role === 'bot' && <BotAvatar />}
                <div className={`ma-bubble ma-bubble--${msg.role}`}>
                  {msg.text}
                </div>
              </div>
            ))}

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
          <div className="ma-input-row">
            <input
              ref={inputRef}
              className="ma-input"
              placeholder="Ask me anything..."
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
