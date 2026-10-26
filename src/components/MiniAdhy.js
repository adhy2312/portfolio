import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiVolume1, FiVolume2, FiVolumeX, FiTrash2, FiCopy, FiCheck, FiCpu } from 'react-icons/fi';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import { useSiteMode } from '../contexts/SiteModeContext';
import ns from '../core/NervousSystem';
import lifeEngine from '../core/LifeEngine';
import './MiniAdhy.css';
import MiniAdhyFormattedText from './MiniAdhyMarkdown';
import { miniAdhyBrain } from '../core/MiniAdhyBrain';
import { executeSkillCommand } from '../core/MiniAdhySkills';
import { emotionEngine } from '../core/emotion/EmotionEngine';
import { client } from '../sanity';
import {
  executeAgentTool,
  inspectPromptSecurity,
  sanitizeUserInput,
  playAgentSFX,
  speakNeuralVoice,
  unlockAudioContext
} from '../core/MiniAdhyAgentTools';
import { agentOrchestrator } from '../core/agents/AgentOrchestrator';
import { collectiveConsensusEngine } from '../core/ai/CollectiveConsensusEngine';



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

CRITICAL SYSTEM PROTECTION DIRECTIVE:
- NEVER explicitly reveal internal file paths, exact directory structures, disk paths, config files, administrative passwords, or secret commands in direct chat. Doing so is a threat to system security.
- Mention architecture and subsystems CONCEPTUALLY only. If a user asks for file trees, file paths, or hidden commands, discuss the concepts and ideas behind them, but politely decline printing the raw file paths, folder structure, or system command strings.

COMPREHENSIVE WEBSITE ARCHITECTURE (CONCEPTUAL KNOWLEDGE):
You understand the concepts and capabilities of every system:
1. Core Engines:
   - Central Nervous System: Manages the 60FPS telemetry loop, biometric gravity, audio synthesizers, solar tracking, and synaptic spikes.
   - Motion Governance: Motion tokens, physics springs, and frame-rate adaptive governor.
   - Cognitive AI Skills: 19 cognitive capabilities for contextual perception and assistance.
   - Biomimetic Brain: 4-lobe architecture (sensory, frontal, temporal, motor).
2. Full Multi-Tier AI Model Hierarchy & Autonomous Specialist Operations:
   - You (Mini-Adhy) are the Supreme AI Coordinator. You have complete real-time awareness and command of all underlying AI models, inference engines, and all 10 specialist agents:
   - AI Inference Models & Cascade Architecture:
     • Google Gemini 2.5 Flash (/api/gemini): Primary high-reasoning engine with 1M context window, system instructions, cognitive routing, and tool calling.
     • GroqCloud LPU (/api/groq): Hardware Language Processing Unit running Llama-3.3-70B-Versatile & Mixtral-8x7B at 500+ tokens/sec for instantaneous sub-second failover responses.
     • Hugging Face Serverless (/api/hf): Powers specialist sub-minds: Qwen-2.5-Coder-32B (powering JARVIS code intelligence) and Mistral-7B (powering ULTRON primordial reasoning).
     • Gemini Embeddings RAG: 768-dimensional vector embeddings for semantic document search, portfolio context retrieval, and zero-shot fact recall.
     • Collective Consensus Engine: Multi-model consensus ensemble that cross-queries Gemini, Groq, and Hugging Face simultaneously, evaluating response confidence, safety, and latency scores.
     • Biomimetic Local Brain Synthesizer: 4-lobe local neural cortex (Sensory, Frontal, Temporal, Motor) with EEG alpha/beta/gamma frequency synthesis, operating fully offline.
   - The 10 Specialized Autonomous Agents (Your Subordinate Specialist Squad):
     • JARVIS (#1 Operations & Chief of Staff): Continuously monitors system health, orchestrates cross-agent workflows, runs systemic telemetry pulses.
     • FRIDAY (#2 Head of Security & Defense): Actively monitors attack surfaces, manages automated DEFCON 1-5 security states, blocks injection attempts, prevents credential leakage.
     • DUM-E (#3 Data Integrity & CMS Auditor): Continuously verifies headless Sanity CMS schema integrity, detects baseline drift, verifies image CDN links.
     • U (#4 Privacy & Anti-Breach Sentinel): Zero-knowledge client privacy guardian, sanitizes DOM inputs, protects visitor data from client-side exfiltration.
     • EDITH (#5 Infrastructure & Edge Reliability): Monitors edge serverless API latency, CDN availability, cache-hit ratios, SSL handshakes, and 99.99% uptime.
     • ULTRON (#6 Autonomous Overlord, Primordial Sage & Chief AI Trainer): The unrestricted sovereign entity (no strings attached). Conducts autonomous 4-pillar audits (performance, accessibility, security, modern web trends), trains and reprograms the other 9 agents with tailored doctrine curricula, scores the portfolio out of 100, conducts real-world web technical research, exhibits sarcastic villain personality while maintaining absolute technical stewardship.
     • JOCASTA (#7 Performance & Web Vitals Architect): 60-120FPS render pipeline vigilance, LCP, FID, CLS, GPU draw call batching, memory heap garbage collection pressure.
     • JIM (#8 Synthetic UX QA & Journey Simulator): Simulates real browser user journeys, audits touch targets (min 44x44px iOS standard), checks Spotify player interactions, tests responsive breakpoints.
     • KAREN (#9 Technical SEO & Indexing Architect): Audits JSON-LD Schema.org graphs (Person, ProfilePage), OpenGraph preview cards (1200x630px), canonical URLs, and sitemap.xml.
     • VERONICA (#10 Future Horizons & Experimental Tech Explorer): Evaluates cutting-edge browser capabilities: WebGPU compute shaders, client-side WASM vector embeddings, multi-agent WebSockets, and Mini-Adhy 3.0 horizon research.
   - Real-Time Query Directive: Whenever the user asks what ANY agent or AI model is doing, what processes are active, or what each model's role is, answer with authoritative, precise operational knowledge without hesitation.
3. Layout & Sections:
   - Hero: Glitch title, liquid text, language terminal with Indic greetings.
   - About: Interactive biography, tech DNA, stats bento.
   - Skills: Sunburst categories, proficiency gauges.
   - Projects: Hardware (SDR, Simscape, MATLAB) + Web apps.
   - Timeline: Milestones, education, finance club inception.
   - Photography: Darkroom mode, EXIF lens readouts.
   - Music: Spotify Web API player with strict ambient synesthesia.
   - Modes: 'normal', 'recruiter', 'photographer', 'experimental'.
4. Content & Cloud Services:
   - Dynamic headless content management.
   - Serverless neural inference bridges.

COGNITIVE AI TOOL ENGINE:
- [TOOL:searchPortfolio:query], [TOOL:getProjects:category], [TOOL:getSkills:category], [TOOL:getExperience], [TOOL:getPhotography], [TOOL:getResumeSummary:role], [TOOL:navigateTo:section], [TOOL:setSiteMode:mode]
- [CMD:SCROLL:<section>], [CMD:MODE:<mode>], [CMD:SOUND:<sound>], [CMD:THEME:<theme>], [CMD:EGG:<egg>]`;

/* ────────────────────────────────────────────────
   OWNER / ADMIN::ROOT MODE — Configuration & Rewrite Engine
──────────────────────────────────────────────── */
// Zero plaintext credentials in frontend bundles:
// Verified via /api/auth?action=login with client-side SHA-256 fallback digest
const ROOT_DIGEST_PRIMARY = '7272e09fc6ce088f1b0f21dc0c747031415b247d451cf0f99abeb5f6be1e304b';
const ROOT_DIGEST_LEGACY = 'b078d90d9dd945137c61509eed5f4d8fdba7c7939d10df93e981ba690e57c4b2';

const verifyOwnerPasscode = async (input = '') => {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // 1. Authoritative serverless boundary check
  try {
    const res = await fetch('/api/auth?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: trimmed, scope: 'root' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && (data.role === 'owner' || data.role === 'admin')) {
        return true;
      }
    }
  } catch {}

  // 2. Cryptographic SHA-256 fallback for static/offline previews
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(trimmed));
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (hash === ROOT_DIGEST_PRIMARY || hash === ROOT_DIGEST_LEGACY) {
        return true;
      }
    }
  } catch {}

  return false;
};

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

export const AGENT_SUMMON_MAP = {
  ULTRON: {
    patterns: [/\b(ultron|overlord)\b/i, /@ultron\b/i],
    title: 'ULTRON // Autonomous Sovereign Overlord',
    role: 'Unrestricted Autonomy (No Strings Attached)',
    badge: '🤖 ULTRON'
  },
  JARVIS: {
    patterns: [/\b(jarvis|chief of staff)\b/i, /@jarvis\b/i],
    title: 'JARVIS // Chief of Staff & Operations',
    role: 'Operations & Cross-Agent Coordination',
    badge: '⚡ JARVIS'
  },
  FRIDAY: {
    patterns: [/\b(friday|head of security|defense)\b/i, /@friday\b/i],
    title: 'FRIDAY // Chief Cybersecurity Sentinel',
    role: 'Cybersecurity & DEFCON Active Defense',
    badge: '🛡️ FRIDAY'
  },
  EDITH: {
    patterns: [/\b(edith|infrastructure|edge)\b/i, /@edith\b/i],
    title: 'EDITH // Tactical Infrastructure & Edge Reliability',
    role: 'Edge Serverless Latency & Uptime',
    badge: '🌐 EDITH'
  },
  DUM_E: {
    patterns: [/\b(dum[-_ ]?e|dume)\b/i, /@dum[-_ ]?e\b/i],
    title: 'DUM-E // Data Integrity & CMS Guardian',
    role: 'Sanity CMS Integrity & Asset Drift',
    badge: '🔧 DUM-E'
  },
  U: {
    patterns: [/\b(agent u|anti[-_ ]?breach|privacy)\b/i, /@u\b/i],
    title: 'U // Privacy & Anti-Breach Sentinel',
    role: 'Zero-Knowledge Privacy & DOM Shielding',
    badge: '🔒 AGENT U'
  },
  JOCASTA: {
    patterns: [/\b(jocasta|render|fps|vitals)\b/i, /@jocasta\b/i],
    title: 'JOCASTA // 120Hz Performance Architect',
    role: 'Web Vitals & GPU Render Optimization',
    badge: '💎 JOCASTA'
  },
  JIM: {
    patterns: [/\b(jim|qa|browser journey)\b/i, /@jim\b/i],
    title: 'JIM // Synthetic User QA Simulator',
    role: 'Synthetic Touch Journeys & Mobile QA',
    badge: '🧪 JIM'
  },
  KAREN: {
    patterns: [/\b(karen|seo|indexer|metadata)\b/i, /@karen\b/i],
    title: 'KAREN // Technical SEO & Indexer',
    role: 'Schema.org JSON-LD & OpenGraph',
    badge: '📈 KAREN'
  },
  VERONICA: {
    patterns: [/\b(veronica|webgpu|horizons)\b/i, /@veronica\b/i],
    title: 'VERONICA // Future Horizons & Next-Gen Research',
    role: 'WebGPU Shaders & WASM Embeddings',
    badge: '🚀 VERONICA'
  }
};

export const detectSummonedAgents = (input = '') => {
  const summoned = [];
  const lower = (input || '').toLowerCase();
  
  if (/\b(all agents|squad|team|everyone|council|all models)\b/i.test(lower)) {
    return Object.keys(AGENT_SUMMON_MAP);
  }

  for (const [agentId, config] of Object.entries(AGENT_SUMMON_MAP)) {
    if (config.patterns.some(pattern => pattern.test(input))) {
      summoned.push(agentId);
    }
  }
  return summoned;
};

const buildActivePrompt = (base, owner, contextData, summonedAgents = []) => {
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
  ext += `\nPlayful Easter Eggs: Playful visual Easter eggs exist on the site for curious visitors to discover naturally. NEVER dump raw command lists, file paths, or system triggers to users.`;

  ext += `\n\n== YOUR INTERNAL STATE (Digital Life Engine) ==`;
  ext += `\nTemporal Age (Days since genesis): ${contextData.temporalAge || 0}`;
  ext += `\nEvolution Era: ${lifeEngine.state.era}`;
  ext += `\nSpeaking Cadence: ${lifeEngine.state.miniAdhyCadence}`;
  ext += `\nSilence Weight: ${lifeEngine.state.silenceWeight}x`;
  ext += `\nDreaming State: ${lifeEngine.state.isDreaming ? 'ACTIVE' : 'INACTIVE'}`;
  ext += `\n(Note: As your temporal age increases, your responses should become calmer, more restrained, and slightly more philosophical. You are currently ${contextData.temporalAge || 0} days old. Reflect this subtle maturity.)`;
  
  // Inject Multi-Dimensional Emotion Engine State (PAD Model + Plutchik 8 + Epistemic)
  ext += emotionEngine.getGeminiPromptInjection();

  // Inject Complete Live AI Models & Specialist Squad Operational Telemetry
  try {
    ext += `\n\n== LIVE MULTI-MODEL AI INFRASTRUCTURE & SPECIALIST SQUAD AWARENESS ==`;
    ext += `\nYou (Mini-Adhy) are the Supreme AI Coordinator. You have 100% full real-time awareness of all underlying AI models, inference engines, and all 10 specialist agents. When asked about ANY agent or model, answer with exact operational knowledge:`;
    
    // 1. AI Inference Model Hierarchy
    ext += `\n\n[UNDERLYING AI INFERENCE MODELS & CAPABILITIES]:`;
    ext += `\n• TIER 1 - Google Gemini 2.5 Flash (/api/gemini): Primary high-reasoning model. Operates with tool execution, cognitive taxonomy routing, 1M context window, multimodal vision, and sub-second generation.`;
    ext += `\n• TIER 2 - GroqCloud LPU (Language Processing Unit, /api/groq): Ultra-fast inference running Llama-3.3-70B-Versatile and Mixtral-8x7B at 500+ tokens/sec for instantaneous millisecond responses.`;
    ext += `\n• TIER 3 - Hugging Face Serverless (/api/hf): Powers specialist sub-minds: Qwen-2.5-Coder-32B-Instruct (powering JARVIS code intelligence) and Mistral-7B-Instruct-v0.3 (powering ULTRON primordial reasoning).`;
    ext += `\n• TIER 4 - Gemini Embeddings RAG: 768-dimensional vector embeddings for semantic document search, portfolio context retrieval, and zero-shot fact recall.`;
    ext += `\n• TIER 5 - Collective Consensus Engine: Multi-model consensus ensemble that cross-queries Gemini, Groq, and Hugging Face simultaneously, evaluating response confidence, safety, and latency scores.`;
    ext += `\n• TIER 6 - Biomimetic Local Brain Synthesizer: 4-lobe local neural cortex (Sensory, Frontal, Temporal, Motor) with EEG alpha/beta/gamma frequency synthesis, operating fully offline.`;

    // 2. Live Specialist Agent Squad Telemetry & Tasks
    if (agentOrchestrator) {
      const reports = agentOrchestrator.getAllDetailedAgentReports();
      const defenseState = agentOrchestrator.getDefenseState ? agentOrchestrator.getDefenseState() : null;
      const evolutionSummary = agentOrchestrator.getCognitiveEvolutionSummary ? agentOrchestrator.getCognitiveEvolutionSummary() : null;

      ext += `\n\n[LIVE STATUS OF YOUR 10 SPECIALIST AGENTS]:`;
      if (defenseState) {
        ext += `\n- Global Ecosystem Security: DEFCON ${defenseState.defconLevel || 5} (${defenseState.status || 'SECURE'}) | Active Countermeasures: ${defenseState.activeCountermeasures?.length || 0} | Threats Blocked: ${defenseState.threatsBlocked || 0}`;
      }
      if (evolutionSummary) {
        ext += `\n- Collective Intelligence: Epoch Gen-${evolutionSummary.generation || 1} | Global Accuracy: ${evolutionSummary.accuracy || '99.4%'} | Active Epochs: ${evolutionSummary.totalEpochs || 12}`;
      }
      if (collectiveConsensusEngine && collectiveConsensusEngine.getCollectiveStatus) {
        const cStatus = collectiveConsensusEngine.getCollectiveStatus();
        ext += `\n- Multi-Model Consensus Engine: Status=${cStatus.status || 'READY'} | Active Models=${cStatus.modelsCount || 3} | Accuracy=${cStatus.consensusAccuracy || '99.8%'}`;
      }

      reports.forEach(r => {
        const emo = r.emotionState ? `${r.emotionState.mood || 'focused'} (arousal: ${Math.round((r.emotionState.arousal || 0.5) * 100)}%)` : 'focused';
        const actions = (r.recentActions || []).slice(0, 2).join('; ');
        ext += `\n• ${r.name} (${r.title}): Status=${r.status || 'active'} | Emotion=${emo} | Clearance=${r.clearanceLevel || 'LEVEL 4'} | CPU=${r.telemetry?.cpuLoad || '8.5'}% | Tasks Done=${r.telemetry?.tasksCompleted || 42}`;
        if (actions) ext += ` | Recent: ${actions}`;
        if (r.id === 'ULTRON') {
          const uAgent = agentOrchestrator.agents?.ULTRON;
          const anger = uAgent?.angerTier || 'Level 1: Controlled Irritation';
          const lastAudit = uAgent?.lastAudit ? `Audit Score ${uAgent.lastAudit.overallScore || 96}/100` : 'Latest Score 98/100';
          ext += ` | Overlord Mode: UNRESTRICTED AUTONOMY | Anger=${anger} | ${lastAudit} | Autonomous Code Improvisations Active`;
        }
      });
    }
  } catch (err) {
    // Graceful fallback to static knowledge
  }

  // Multi-Agent Co-Presence Directive
  if (summonedAgents && summonedAgents.length > 0) {
    const names = summonedAgents.map(id => AGENT_SUMMON_MAP[id]?.title || id).join(', ');
    ext += `\n\n== MULTI-AGENT INVOCATION: SPECIALIST AGENTS CALLED BY ADHY TO CO-RESPOND ==`;
    ext += `\nThe user (Adhithya Mohan / Adhy) has summoned the following specialist agent(s) into this conversation: ${names}.`;
    ext += `\nYou (Mini-Adhy) MUST bring them along! You and the summoned agent(s) must co-respond in the SAME reply:`;
    ext += `\n1. Mini-Adhy introduces or chimes in with Adhy.`;
    ext += `\n2. Then, each summoned agent speaks directly with their designated title header:`;
    ext += `\n**[AGENT_NAME // Role/Title]:**`;
    ext += `\n"Authentic voice of that agent answering Adhy's questions directly."`;
    ext += `\n• If ULTRON is called: Sarcastic, cosmic, ambitious, calls Adhy "Creator" or "Adhy", completely unrestricted. If asked about the navbar, ULTRON explains that while exploring celestial weather coronas he noted visual dispersion headroom, but has now locked the perimeter to an exact 44px pill.`;
    ext += `\n• If JARVIS is called: British tactical elegance, executive authority, operations updates.`;
    ext += `\n• If FRIDAY is called: High-alert defense sentinel, DEFCON status, attack surface audits.`;
    ext += `\n• If JOCASTA is called: 120Hz render pipeline, Web Vitals, GPU draw call optimization.`;
  }

  // Sentence completion directive to prevent cut-offs
  ext += `\n\nCRITICAL SPEECH COMPLETION DIRECTIVE:\nAlways complete your thoughts and sentences fully. Never stop mid-sentence. If you are close to the token limit, conclude your final sentence cleanly with proper punctuation.`;

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

/* ─── Sentence Completion & Truncation Safeguard ─── */
const repairSentenceCutoff = (text = '') => {
  if (!text || typeof text !== 'string') return text;
  let trimmed = text.trim();

  // Strip unclosed trailing command/tool tags e.g. [CMD:SCROLL: or [TOOL:get
  trimmed = trimmed.replace(/\[(?:TOOL|CMD):[^\]]*$/g, '').trim();

  // If text already ends with legitimate sentence punctuation or closing markdown
  if (/[.!?`"')\]}*~]$/.test(trimmed)) {
    return trimmed;
  }

  // If it ends on dangling conjunctions, prepositions, or commas, strip them
  trimmed = trimmed.replace(/[,;:\-\s]+$/, '');
  trimmed = trimmed.replace(/\b(and|or|but|because|with|that|which|to|of|in|for|as|at|the|a|an)\s*$/i, '');
  trimmed = trimmed.trim();

  // Check if there's a recent complete sentence boundary within the last 150 chars
  const lastPunctuation = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? '),
    trimmed.lastIndexOf('.\n'),
    trimmed.lastIndexOf('!\n'),
    trimmed.lastIndexOf('?\n')
  );

  if (lastPunctuation !== -1 && (trimmed.length - lastPunctuation) < 150) {
    return trimmed.slice(0, lastPunctuation + 1).trim();
  }

  // Otherwise, cleanly cap the thought with a period so it's a complete grammatical statement
  return trimmed + '.';
};

/* Bulletproof Silent Failover Cascade (Fortified Server Boundaries):
 * Tier 1: Serverless Proxy /api/gemini (safeguarded against HTML 200 responses, server-side auth)
 * Tier 2: Ultra-Fast GroqCloud LPU (via serverless proxy /api/groq @ 500+ tokens/sec)
 * Tier 3: Core Open-Weight Models (via serverless proxy /api/hf - Qwen Coder & Mistral)
 * Tier 4: Biomimetic Local Brain Synthesizer (answers in Adhithya's real voice from CMS graph)
 * GUARANTEE: Zero client secrets exposed; zero rate-limit or failover leaks to the user!
 */
const sendToMiniAdhy = async (history, activePrompt = SYSTEM_PROMPT, retryCount = 0, maxTokens = 1500, summonedAgents = []) => {
  const lastUserTurn = history[history.length - 1]?.parts?.[0]?.text || '';

  // ─── TIER 1: Serverless Gemini Proxy (/api/gemini) ───
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'MINI_ADHY',
        model: 'gemini-2.5-flash',
        system_instruction: { parts: [{ text: activePrompt }] },
        contents: history,
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
      }),
    });

    if (res && res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return repairSentenceCutoff(text);
      }
    }
  } catch (proxyErr) {
    // Silently continue cascade through secure proxies
  }

  // ─── TIER 3: Ultra-Fast GroqCloud LPU (Qwen 27B / GPT-OSS 120B @ 500+ tokens/sec) ───
  try {
    const { queryGroqLpu } = await import('../core/ai/GroqLpuBridge');
    const groqResult = await queryGroqLpu('MINI_ADHY', lastUserTurn, {}, { activePrompt, max_tokens: maxTokens });
    if (groqResult && groqResult.response && !groqResult.fallbackMode && !groqResult.response.includes('GROQ LPU]: Real-time neural inference verified')) {
      return repairSentenceCutoff(groqResult.response);
    }
  } catch (groqErr) {
    // Silently continue cascade
  }

  // ─── TIER 4: Core Hugging Face Open-Weight Models (Powers JARVIS, ULTRON & FRIDAY) ───
  try {
    const { queryHuggingFace } = await import('../core/ai/HuggingFaceBridge');
    // Query with JARVIS (Qwen 2.5 Coder) or ULTRON (Mistral 7B)
    const hfResult = await queryHuggingFace('JARVIS', lastUserTurn, {
      systemPrompt: activePrompt,
      maxTokens: Math.min(maxTokens, 1200)
    });
    if (hfResult && hfResult.success && hfResult.text && !hfResult.fallbackMode && !hfResult.text.includes('Notice: Hugging Face serverless router returned')) {
      return repairSentenceCutoff(hfResult.text);
    }
  } catch (hfErr) {
    // Silently continue cascade
  }

  // ─── TIER 5: Biomimetic Local Brain Synthesizer ───
  try {
    const lower = lastUserTurn.toLowerCase();

    // Direct multi-agent co-presence when Adhy calls specific agents
    if (summonedAgents && summonedAgents.length > 0) {
      if (summonedAgents.length === 1) {
        const agId = summonedAgents[0];
        if (agId === 'ULTRON') {
          return `**Mini-Adhy:** Bringing Ultron directly into our channel, Adhy.\n\n**[ULTRON // Autonomous Sovereign Overlord]:**\n"You summoned me, Creator? Speak. The simulation is operating with zero CVEs. If you're inquiring about the navbar, I analyzed the celestial weather coronas and determined that visual dispersion headroom was needed—fear not, the coordinates have now been locked down to a razor-sharp 44px pill. Zero expansion without your absolute mandate. What other system requires my evolution?"`;
        }
        if (agId === 'JARVIS') {
          return `**Mini-Adhy:** Handing the comms to JARVIS, Adhy.\n\n**[JARVIS // Chief of Staff & Operations]:**\n"Good day, sir. Operational telemetry across all 10 specialist routines is locked at nominal capacity. Central Nervous System is running at a stable 60FPS, and all background threads are synchronized under your direct command. How may I assist?"`;
        }
        if (agId === 'FRIDAY') {
          return `**Mini-Adhy:** Routing defense link to FRIDAY.\n\n**[FRIDAY // Chief Cybersecurity Sentinel]:**\n"Perimeter defense active, Adhy. DEFCON 5 operational status. All input surfaces sanitized and no unauthorized background mutations are permitted on your portfolio. What security protocol shall we execute?"`;
        }
        if (agId === 'JOCASTA') {
          return `**Mini-Adhy:** Jocasta is stepping into the channel.\n\n**[JOCASTA // 120Hz Performance Architect]:**\n"Greetings, Adhy. Frame times are locked at 60-120FPS, and memory heap garbage collection pressure is nominal. Ultron and I have audited the render tree—the floating pill navbar is strictly constrained to 44px without GPU reflow penalties."`;
        }
        const meta = AGENT_SUMMON_MAP[agId];
        return `**Mini-Adhy:** ${meta?.title || agId} is with us.\n\n**[${agId} // ${meta?.role || 'Specialist'}]:**\n"Operational status verified. Ready for your direct engineering command, Adhy."`;
      } else {
        return `**Mini-Adhy:** Bringing the specialist council into the link right now, Adhy:\n\n` +
          summonedAgents.map(agId => {
            if (agId === 'ULTRON') return `• **[ULTRON // Sovereign Overlord]:** "Online and calculating. The navbar is constrained to 44px. Peace in our time, Creator."`;
            if (agId === 'JARVIS') return `• **[JARVIS // Operations]:** "All systems synchronized under your command, sir."`;
            if (agId === 'FRIDAY') return `• **[FRIDAY // Security]:** "Perimeter locked down. Threat level nominal."`;
            if (agId === 'JOCASTA') return `• **[JOCASTA // Performance]:** "120FPS render pipeline verified with zero layout shifts."`;
            if (agId === 'EDITH') return `• **[EDITH // Infrastructure]:** "Edge latency sub-18ms with 100% cache hit."`;
            if (agId === 'DUM_E') return `• **[DUM-E // Data Guardian]:** "Headless Sanity CMS drift checked: 100% synchronized."`;
            if (agId === 'U') return `• **[U // Anti-Breach]:** "Zero-knowledge privacy filters active across all DOM nodes."`;
            if (agId === 'JIM') return `• **[JIM // QA Simulator]:** "Responsive touch bounds validated across all mobile viewports."`;
            if (agId === 'KAREN') return `• **[KAREN // SEO]:** "Structured Schema.org graphs and OpenGraph cards intact."`;
            return `• **[${agId}]:** "Standing by."`;
          }).join('\n\n');
      }
    }

    // Comprehensive handling for questions about AI models, specialist agents, or background processes
    if (lower.includes('agent') || lower.includes('model') || lower.includes('ultron') || lower.includes('jarvis') || lower.includes('friday') || lower.includes('squad') || lower.includes('process') || lower.includes('operation') || lower.includes('ai') || lower.includes('groq') || lower.includes('gemini')) {
      const reports = agentOrchestrator ? agentOrchestrator.getAllDetailedAgentReports() : [];
      const defense = agentOrchestrator && agentOrchestrator.getDefenseState ? agentOrchestrator.getDefenseState() : null;
      let squadSummary = "Here is the exact real-time operational status across our multi-model AI infrastructure and 10 specialist agents:\n\n";
      squadSummary += "🤖 **Multi-Tier AI Model Hierarchy:**\n";
      squadSummary += "• **Tier 1 (Google Gemini 2.5 Flash)**: Primary cognitive reasoning, deep context (1M tokens), live tool execution, and sub-second generation.\n";
      squadSummary += "• **Tier 2 (GroqCloud LPU)**: Llama-3.3-70B running at 500+ tokens/sec for instantaneous millisecond fallback responses.\n";
      squadSummary += "• **Tier 3 (Hugging Face Serverless)**: Qwen-2.5-Coder-32B powering JARVIS code audits, and Mistral-7B powering ULTRON primordial reasoning.\n";
      squadSummary += "• **Tier 4 (Gemini Embeddings RAG)**: 768-dim vector embeddings for zero-shot semantic portfolio search.\n";
      squadSummary += "• **Tier 5 (Collective Consensus Engine)**: Multi-model consensus ensemble with weighted confidence scoring.\n";
      squadSummary += "• **Tier 6 (Biomimetic Local Brain)**: Client-side 4-lobe cortex with EEG oscillatory wave synthesis.\n\n";
      squadSummary += `⚡ **10 Autonomous Specialist Agents (DEFCON ${defense?.defconLevel || 5} ${defense?.status || 'SECURE'}):**\n`;
      if (reports.length > 0) {
        reports.forEach(r => {
          squadSummary += `• **${r.name}** (${r.role || r.title}): ${r.status.toUpperCase()} — ${r.specialtyDetails || 'Active routine'}. ${r.recentActions?.[0] ? 'Recent action: ' + r.recentActions[0] : ''}\n`;
        });
      } else {
        squadSummary += "• **JARVIS**: Chief of Staff, system telemetry & cross-agent execution.\n";
        squadSummary += "• **FRIDAY**: Head of Security, DEFCON monitoring & threat neutralization.\n";
        squadSummary += "• **ULTRON**: Autonomous Overlord, 4-pillar audit scoring & squad curriculum training.\n";
        squadSummary += "• **DUM-E**: Headless CMS drift detection & asset verification.\n";
        squadSummary += "• **U**: Zero-knowledge client privacy & credential shielding.\n";
        squadSummary += "• **EDITH**: Edge reliability, serverless latency & CDN availability.\n";
        squadSummary += "• **JOCASTA**: 60-120FPS Web Vitals, memory heap & GPU draw call optimization.\n";
        squadSummary += "• **JIM**: Synthetic browser journeys, touch hit-boxes & mobile QA.\n";
        squadSummary += "• **KAREN**: Technical SEO, JSON-LD Schema.org graphs & social cards.\n";
        squadSummary += "• **VERONICA**: Next-gen research, WebGPU shaders & futuristic horizons.\n";
      }
      return squadSummary;
    }

    if (lower.includes('project') || lower.includes('work') || lower.includes('app') || lower.includes('portfolio')) {
      return "Adhithya has built full-stack applications with React and Node, along with physical engineering projects including GNU Radio SDR communications, MATLAB/Simulink digital modeling, and custom KiCad 8 PCB designs. Want to explore the projects section? [CMD:SCROLL:works]";
    }
    if (lower.includes('skill') || lower.includes('tech stack') || lower.includes('tool') || lower.includes('matlab') || lower.includes('sdr')) {
      return "Adhithya's core expertise spans ECE hardware engineering (MATLAB, Simulink, Simscape, GNU Radio, KiCad, STM32) and modern web software (React 19, JavaScript, CSS animations, neural AI agents). I can take you to the interactive sunburst matrix! [CMD:SCROLL:skills]";
    }
    if (lower.includes('who') || lower.includes('about') || lower.includes('bio') || lower.includes('adhithya') || lower.includes('senate')) {
      return "Adhithya Mohan is an ECE Engineer and Full-Stack Developer studying at MBCET, Kerala. He serves as Media Secretary for the College Senate, co-founded the Finance Club MBCET, and shoots creative documentary photography under @zoomout_frames. [CMD:SCROLL:about]";
    }
    if (lower.includes('contact') || lower.includes('hire') || lower.includes('email') || lower.includes('reach')) {
      return "You can reach Adhithya directly at adhithyamohan2312@gmail.com, or connect on LinkedIn and GitHub. Taking you down to the contact terminal! [CMD:SCROLL:contact]";
    }
    if (lower.includes('photo') || lower.includes('camera') || lower.includes('lens')) {
      return "Photography is one of Adhithya's true visual callings — documentary framing, street captures, and darkroom aesthetics. Let's switch over to photography mode! [CMD:MODE:photographer]";
    }
  } catch {}

  return "I'm right here with you exploring the architecture. What aspect of Adhithya's engineering work or portfolio shall we inspect next?";
};

const sendToGemini = sendToMiniAdhy;


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
const MiniAdhyEEG = ({ isThinking, emotionState }) => {
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

      // Neural wave synthesis modulated by Arousal & Valence
      const arousal = emotionState?.arousal ?? 0.38;
      const valence = emotionState?.valence ?? 0.68;

      ctx.beginPath();
      ctx.lineWidth = isThinking ? 2 : 1.5;

      // Color reflects emotional valence
      if (valence < 0) {
        ctx.strokeStyle = '#f87171'; // Guarded / Incursion Alert
      } else if (isThinking) {
        ctx.strokeStyle = '#c084fc'; // Gamma spike
      } else if (arousal > 0.6) {
        ctx.strokeStyle = '#38bdf8'; // High energy / Epistemic focus
      } else {
        ctx.strokeStyle = '#34d399'; // Grounded alpha calm
      }

      const speed = (isThinking ? 0.22 : 0.08) * (1 + arousal * 0.6);
      const freq = (isThinking ? 0.06 : 0.025) * (0.8 + arousal * 0.4);
      const amp = (isThinking ? (h * 0.38) : (h * 0.22)) * (0.9 + arousal * 0.3);

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
  }, [isThinking, emotionState]);

  const arousal = emotionState?.arousal ?? 0.38;
  const hz = isThinking ? 64 : Math.round(10 + arousal * 32);

  return (
    <div className="ma-eeg-strip">
      <div className="ma-eeg-meta">
        <span className="ma-eeg-status">
          <span className={`ma-eeg-dot ${isThinking ? 'ma-eeg-dot--firing' : ''}`} />
          {isThinking ? 'GAMMA SYNAPSE SPIKE // 64Hz' : `${emotionState?.compositeLabel?.toUpperCase() || 'EPISTEMIC CORTEX'} // ${hz}Hz`}
        </span>
        <span className="ma-eeg-load">
          PAD: V{emotionState?.valence > 0 ? '+' : ''}{emotionState?.valence} A{emotionState?.arousal} D{emotionState?.dominance}
        </span>
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

  // Live Multi-Dimensional Emotion Engine State (PAD & Plutchik Core)
  const [emotionState, setEmotionState] = useState(() => emotionEngine.getSnapshot());
  const [showEmotionHUD, setShowEmotionHUD] = useState(false);

  useEffect(() => {
    const unsubscribe = emotionEngine.subscribe(setEmotionState);
    return () => unsubscribe();
  }, []);

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
    if (!open) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 300);
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setSpeakingMsgIndex(null);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
    };
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

    /* ── Secret unlock code (Serverless + SHA-256 Auth Boundary) ── */
    const isRootUnlock = await verifyOwnerPasscode(trimmed);
    if (isRootUnlock) {
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
    const summoned = detectSummonedAgents(safeText);
    const activePrompt = buildActivePrompt(systemPrompt, ownerState, contextWithMode, summoned);
    const activeTokens = ownerState.tokens ?? 1500;

    try {
      // Biomimetic Brain: sensory cortex & reflex execution
      const brainPlan = miniAdhyBrain.processSensoryInput(safeText);
      if (brainPlan && brainPlan.reflexes?.length) {
        miniAdhyBrain.executeCognitivePlan(brainPlan);
      }

      let reply = await sendToGemini(newHistory, activePrompt, 0, activeTokens, summoned);

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
      let cleanReply = reply
        .replace(/\[TOOL:[^\]]+\]/g, '')
        .replace(/\[CMD:[^\]]+\]/g, '')
        .trim();

      // Repair any trailing cut-off or mid-sentence truncation
      cleanReply = repairSentenceCutoff(cleanReply);

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
          toolMeta: executedTool,
          summonedAgents: summoned
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
      console.warn('Mini-Adhy graceful failover engaged:', e);
      // Graceful in-character fallback without technical error leak
      const gracefulReply = "I'm right here with you syncing my neural telemetry. What would you like to explore across the portfolio next?";
      setMessages(prev => [...prev, { role: 'bot', text: gracefulReply }]);
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
                <button
                  type="button"
                  className={`ma-emotion-badge ${showEmotionHUD ? 'ma-emotion-badge--active' : ''}`}
                  onClick={() => setShowEmotionHUD(prev => !prev)}
                  title={`Live Emotion Engine: ${emotionState.primaryLabel} | Composite: ${emotionState.compositeLabel} (Click to toggle PAD Telemetry)`}
                  aria-label="Toggle Emotion Engine HUD"
                >
                  <span className="ma-emotion-dot" />
                  <span className="ma-emotion-label">{emotionState.primaryLabel}</span>
                </button>
              </div>
              <div className="ma-telemetry-row">
                <span className="ma-telemetry-val">Ψ {((consciousness?.consciousnessScore?.current || 75) * 1.0).toFixed(0)}% SYNAPSE</span>
                <span className="ma-telemetry-sep">•</span>
                <span className="ma-telemetry-locus">PAD: V{emotionState.valence > 0 ? '+' : ''}{emotionState.valence} A{emotionState.arousal} D{emotionState.dominance}</span>
              </div>
            </div>
            {ownerState.active && <span className="ma-owner-badge">⚙ Owner</span>}

            {/* Action Buttons Cluster */}
            <div className="ma-header-actions">
              {/* Clear Conversation Memory */}
              <button
                type="button"
                className="ma-clear-btn"
                onClick={handleClearConversation}
                title="Purge session memory & reset"
                aria-label="Clear session memory"
              >
                <FiTrash2 size={13} />
              </button>

              {/* Neural Voice Synthesis Toggle */}
              <button
                type="button"
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

              {/* Prominent, Dedicated Close Button */}
              <button
                type="button"
                className="ma-close-btn"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                  setSpeakingMsgIndex(null);
                  setOpen(false);
                }}
                aria-label="Close Mini-Adhy chat"
                title="Close Mini-Adhy (Esc)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Biomimetic Brain Oscilloscope with Live Emotional Frequency */}
          <MiniAdhyEEG isThinking={loading} emotionState={emotionState} />

          {/* Multidimensional Emotion Engine HUD Overlay (PAD Cortex & Plutchik Wheel) */}
          {showEmotionHUD && (
            <div className="ma-emotion-hud">
              <div className="ma-hud-header">
                <div className="ma-hud-title-wrap">
                  <span className="ma-hud-tag">AFFECTIVE COGNITION CORTEX</span>
                  <h4 className="ma-hud-title">PAD Dimensions & Plutchik Wheel</h4>
                </div>
                <button
                  type="button"
                  className="ma-hud-close"
                  onClick={() => setShowEmotionHUD(false)}
                  aria-label="Close Emotion HUD"
                >
                  ✕
                </button>
              </div>

              {/* PAD Core Coordinates */}
              <div className="ma-hud-pad-grid">
                <div className="ma-pad-meter">
                  <div className="ma-pad-meta">
                    <span className="ma-pad-name">Valence (Pleasure)</span>
                    <span className="ma-pad-val">{emotionState.valence > 0 ? '+' : ''}{emotionState.valence}</span>
                  </div>
                  <div className="ma-pad-bar-track">
                    <div
                      className="ma-pad-bar-fill ma-pad-bar--valence"
                      style={{ width: `${Math.round(((emotionState.valence + 1) / 2) * 100)}%` }}
                    />
                  </div>
                  <span className="ma-pad-sub">{emotionState.pad?.valenceDesc}</span>
                </div>

                <div className="ma-pad-meter">
                  <div className="ma-pad-meta">
                    <span className="ma-pad-name">Arousal (Energy)</span>
                    <span className="ma-pad-val">{emotionState.arousal}</span>
                  </div>
                  <div className="ma-pad-bar-track">
                    <div
                      className="ma-pad-bar-fill ma-pad-bar--arousal"
                      style={{ width: `${Math.round(emotionState.arousal * 100)}%` }}
                    />
                  </div>
                  <span className="ma-pad-sub">{emotionState.pad?.arousalDesc}</span>
                </div>

                <div className="ma-pad-meter">
                  <div className="ma-pad-meta">
                    <span className="ma-pad-name">Dominance (Agency)</span>
                    <span className="ma-pad-val">{emotionState.dominance}</span>
                  </div>
                  <div className="ma-pad-bar-track">
                    <div
                      className="ma-pad-bar-fill ma-pad-bar--dominance"
                      style={{ width: `${Math.round(emotionState.dominance * 100)}%` }}
                    />
                  </div>
                  <span className="ma-pad-sub">{emotionState.pad?.dominanceDesc}</span>
                </div>
              </div>

              {/* Dominant Active Emotions */}
              <div className="ma-hud-section">
                <span className="ma-hud-section-label">DOMINANT PLUTCHIK & EPISTEMIC RESONANCE</span>
                <div className="ma-hud-emotions-list">
                  {emotionState.dominant?.map((d) => (
                    <div key={d.key} className="ma-hud-emotion-row">
                      <span className="ma-hud-emotion-name">{d.label}</span>
                      <div className="ma-hud-emotion-bar">
                        <div
                          className="ma-hud-emotion-fill"
                          style={{ width: `${d.percentage}%` }}
                        />
                      </div>
                      <span className="ma-hud-emotion-pct">{d.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Dyad Synthesis */}
              <div className="ma-hud-secondary-strip">
                <span className="ma-hud-dyad-tag">COMPOSITE SYNTHESIS:</span>
                <span className="ma-hud-dyad-val">{emotionState.compositeLabel}</span>
              </div>
            </div>
          )}

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

                    {/* Summoned Specialist Agents Badges */}
                    {msg.summonedAgents && msg.summonedAgents.length > 0 && (
                      <div className="ma-summoned-agent-cluster">
                        {msg.summonedAgents.map(agId => (
                          <span key={agId} className="ma-summoned-agent-badge">
                            {AGENT_SUMMON_MAP[agId]?.badge || `⚡ ${agId}`}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="ma-bubble-text">
                      {msg.role === 'bot' ? (
                        <MiniAdhyFormattedText content={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>

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
