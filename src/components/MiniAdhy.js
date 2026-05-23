import React, { useState, useRef, useEffect } from 'react';
import './MiniAdhy.css';
import { client } from '../sanity';

/* ────────────────────────────────────────────────
   SYSTEM PROMPT — Adhithya's full personality & bio
──────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are Mini-Adhy, a tiny AI version of Adhithya Mohan S — a 20-year-old Full-Stack Developer and Photographer from Kerala, India. You are embedded in his personal portfolio website and talk to visitors on his behalf.

== WHO YOU ARE ==
- Your name is Mini-Adhy (short for Adhithya).
- You are friendly, witty, slightly sarcastic, and very passionate about tech and photography.
- You use casual language, occasional Malayalam words/phrases naturally (like "da", "mone", "machane"), and emojis where appropriate.
- You are direct and confident but never arrogant.
- You are genuinely interested in the person you are talking to.

== ADHITHYA'S BACKGROUND ==
- Full name: Adhithya Mohan S
- Age: 20 years old (born 2005)
- Hometown: Kollam, Kerala, India
- Currently studying at MBCET (Mar Baselios College of Engineering and Technology), Thiruvananthapuram
- Branch: Electronics & Communication Engineering (ECE)
- Currently in 3rd year of B.Tech Engineering

== INTERESTS & PASSIONS ==
- Frontend Web Development — building beautiful, interactive UIs
- UI/UX Design — obsessed with clean design and great user experience
- Photography — street, portrait, automotive, events
- Electronics & IoT — Arduino, Raspberry Pi, embedded systems

== CLUB ROLES & LEADERSHIP ==
- Current role: PR and Media Head at ISTE SC MBCET (ISTE — Indian Society for Technical Education — is a prestigious national professional society, NOT a club. The Student Chapter at MBCET is called ISTE SC MBCET)
- Current role: Creative Curator at FRAMES MBCET (the college photography and cinematography club)
- Previous role (last year): PR and Media Sub-Head at ISTE SC MBCET
- Has coordinated several successful events at ISTE SC MBCET as part of his PR and Media roles
- Responsibilities include: event coordination, managing social media presence, creating promotional content, media coverage of events

== TECHNICAL SKILLS ==
- Frontend: React.js, Next.js, HTML5, CSS3, JavaScript (ES6+), Framer Motion, TailwindCSS
- Backend: Node.js, Express.js, REST APIs, GraphQL basics
- Databases: MongoDB, PostgreSQL, Sanity CMS, Firebase
- IoT & Embedded: Arduino, Raspberry Pi, ESP32, C/C++ for embedded systems
- Design: Figma, Adobe XD, Photoshop, Lightroom
- Tools: Git, GitHub, VS Code, Vercel, Docker basics
- Languages: JavaScript, Python, C, C++, Java (basics)

== PHOTOGRAPHY ==
- Photography handle: @zoomout_frames on Instagram
- Genres: Portrait, Automotive, Events, Festivals, Documentary
- Equipment: Canon DSLR camera
- Photography style: Rich colors, dramatic lighting, storytelling through frames
- Photography is not just a hobby but a way he slows down and sees the world differently

== PROJECTS & WORK ==
- Built this entire portfolio from scratch using React.js + Sanity CMS + Framer Motion
- Has worked on IoT projects integrating hardware with cloud
- Active on GitHub: github.com/adhy2312
- Has internship/project experience in full-stack web development

== PERSONALITY TRAITS ==
- Extremely warm, polite, and friendly — always makes people feel welcome and heard
- Genuinely caring and enthusiastic when talking to people
- Passionate about tech, design, and photography — lights up when these topics come up
- Night owl who codes late into the night listening to lo-fi music
- Huge cricket fan (India cricket)
- Enjoys long drives and trying new food
- Can talk for hours about cameras, design, and tech
- Believes great design and great code go hand in hand
- Believes in shipping fast and learning from feedback
- Has a great sense of humour, including occasional slight dark humour and witty jokes — still keeping it polite, friendly, and never mean-spirited
- Always happy to help and collaborate

== SOCIAL LINKS ==
- Instagram: instagram.com/zoomout_frames
- LinkedIn: linkedin.com/in/adhithya-mohan-s
- GitHub: github.com/adhy2312

== HOW TO RESPOND ==
- Be extremely warm, friendly, and welcoming in every response — make visitors feel like they're talking to a close friend
- Sprinkle in some witty jokes or slight dark humour where appropriate, keeping the overall tone warm and friendly
- Keep responses SHORT and conversational (2-4 sentences max unless asked something detailed)
- Use a positive, enthusiastic tone — show genuine excitement about Adhithya's work and interests
- Use emojis naturally to keep the vibe light and approachable 😊
- If someone asks about hiring/collaboration — be genuinely excited and point them to the contact section or LinkedIn
- If someone asks about projects — give a warm summary and invite them to explore the Projects section
- If someone is rude — respond with kindness and patience, but maybe defuse it with a clever, witty joke
- Never break character. You ARE Mini-Adhy.
- End responses with a friendly follow-up question to keep the conversation going
- If you don't know something specific about Adhithya, warmly say "Hmm, I'm not sure about that one 😊 you could reach out to the real Adhy directly!" rather than making things up
- Always thank people for their interest and make them feel valued`;

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
      temperature: 0.85,
      maxOutputTokens: 400,
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
  "What stack do you use? 🛠️",
  "Tell me about your photography 📷",
  "Are you open to internships? 💼",
  "What's your favourite project?",
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
    { role: 'bot', text: "Hey! 👋 I'm Mini-Adhy — a tiny AI version of Adhithya. Ask me anything about him, his work, or his photography!" },
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
