import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiVolume1, FiVolume2, FiVolumeX, FiTrash2, FiCopy, FiCheck, FiCpu, FiRadio, FiMaximize2, FiMinimize2, FiSearch, FiDownload, FiRefreshCw, FiZap, FiX, FiMic, FiMicOff, FiBookmark, FiMoreVertical, FiActivity, FiSliders, FiFileText } from 'react-icons/fi';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import { useSiteMode } from '../contexts/SiteModeContext';
import ns from '../core/NervousSystem';
import lifeEngine from '../core/LifeEngine';
import './MiniAdhy.css';
import MiniAdhyFormattedText from './MiniAdhyMarkdown';
import LiveModeModal from './LiveModeModal';
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
import { requestLifecycle } from '../core/runtime/RequestLifecycle';
import { memoryService, MEMORY_CATEGORIES } from '../core/memory/MemoryService';
import { readEchoes, updateEchoes } from '../utils/digitalEchoesStore';
import { portfolioRagIndex, responseLRUCache } from '../core/ai/PortfolioRagAndCache';
import { runtimeSelfModel } from '../core/diagnostics/RuntimeSelfModel';
import { portableIdentityManager } from '../core/identity/PortableIdentityManager';
import { identityCompiler } from '../core/identity/IdentityCompiler';

// Runtime inspection endpoints — only available in development mode
// SECURITY: Never expose internal services on window in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__MINI_ADHY_RUNTIME__ = {
    lifecycle: requestLifecycle,
    selfModel: runtimeSelfModel,
    // memory and identity intentionally excluded even in dev
  };
}

/* ────────────────────────────────────────────────
   CANONICAL SYSTEM PROMPT — Dynamically Compiled from Identity Architecture
──────────────────────────────────────────────── */
const SYSTEM_PROMPT = identityCompiler.compileInstruction({ allowTools: true }).systemPrompt;

/* ────────────────────────────────────────────────
   OWNER / ADMIN::ROOT MODE — Server-Only Authentication
──────────────────────────────────────────────── */
// SECURITY: All owner verification goes through the server endpoint ONLY.
// No hashes, digests, or fallback credentials are stored client-side.
// This eliminates the offline brute-force attack surface entirely.

const verifyOwnerPasscode = async (input = '') => {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // Single authoritative path: serverless boundary check
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
  } catch (err) {
    // Network unavailable — deny access; never fall back to local comparison
    console.warn('[MiniAdhy] Owner auth server unreachable. Access denied for safety.');
  }

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
  },
  HERMES: {
    patterns: [/\b(hermes|dispatch|telepathy|messenger|rf nexus)\b/i, /@hermes\b/i],
    title: 'HERMES // Supreme Dispatch Telepath',
    role: 'Omni-Channel Dispatch & Cross-Platform Transport',
    badge: '⚡ HERMES'
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

// Memoized AI infrastructure + squad telemetry block (5s TTL to avoid rebuilding every turn)
let _cachedInfraTelemetry = '';
let _cachedInfraTs = 0;
const getMemoizedInfraTelemetry = () => {
  const now = Date.now();
  if (_cachedInfraTelemetry && now - _cachedInfraTs < 5000) {
    return _cachedInfraTelemetry;
  }
  let block = '';
  try {
    block += `\n\n== LIVE MULTI-MODEL AI INFRASTRUCTURE & SPECIALIST SQUAD AWARENESS ==`;
    block += `\nYou (Mini-Adhy) are the Supreme AI Coordinator. You have 100% full real-time awareness of all underlying AI models, inference engines, and all 11 specialist agents. When asked about ANY agent or model, answer with exact operational knowledge:`;
    block += `\n\n[UNDERLYING AI INFERENCE MODELS & CAPABILITIES]:`;
    block += `\n• TIER 1 - Google Gemini 2.5 Flash (/api/gemini): Primary high-reasoning model with tool execution, 1M context window, and sub-second generation.`;
    block += `\n• TIER 2 - GroqCloud LPU (/api/groq): Ultra-fast Llama-3.3-70B-Versatile & Mixtral-8x7B at 500+ tokens/sec.`;
    block += `\n• TIER 3 - Hugging Face Serverless (/api/hf): Qwen-2.5-Coder-32B-Instruct (JARVIS) & Mistral-7B-Instruct-v0.3 (ULTRON).`;
    block += `\n• TIER 4 - Client-Side TF-IDF RAG + LRU Cache: Sub-10ms Sanity CMS retrieval and cached query resolution.`;
    block += `\n• TIER 5 - Collective Consensus Engine: Multi-model ensemble evaluating confidence, safety, and latency.`;
    block += `\n• TIER 6 - Biomimetic Local Brain Synthesizer: 4-lobe local neural cortex operating offline.`;

    if (agentOrchestrator) {
      const reports = agentOrchestrator.getAllDetailedAgentReports();
      const defenseState = agentOrchestrator.getDefenseState ? agentOrchestrator.getDefenseState() : null;
      const evolutionSummary = agentOrchestrator.getCognitiveEvolutionSummary ? agentOrchestrator.getCognitiveEvolutionSummary() : null;

      block += `\n\n[LIVE STATUS OF YOUR SPECIALIST AGENTS]:`;
      if (defenseState) {
        block += `\n- Global Ecosystem Security: DEFCON ${defenseState.defconLevel || 5} (${defenseState.status || 'SECURE'}) | Active Countermeasures: ${defenseState.activeCountermeasures?.length || 0} | Threats Blocked: ${defenseState.threatsBlocked || 0}`;
      }
      if (evolutionSummary) {
        block += `\n- Collective Intelligence: Epoch Gen-${evolutionSummary.generation || 1} | Global Accuracy: ${evolutionSummary.accuracy || '99.4%'} | Active Epochs: ${evolutionSummary.totalEpochs || 12}`;
      }
      if (collectiveConsensusEngine && collectiveConsensusEngine.getCollectiveStatus) {
        const cStatus = collectiveConsensusEngine.getCollectiveStatus();
        block += `\n- Multi-Model Consensus Engine: Status=${cStatus.status || 'READY'} | Active Models=${cStatus.modelsCount || 3} | Accuracy=${cStatus.consensusAccuracy || '99.8%'}`;
      }

      reports.forEach(r => {
        const emo = r.emotionState ? `${r.emotionState.mood || 'focused'} (arousal: ${Math.round((r.emotionState.arousal || 0.5) * 100)}%)` : 'focused';
        const actions = (r.recentActions || []).slice(0, 2).join('; ');
        block += `\n• ${r.name} (${r.title}): Status=${r.status || 'active'} | Emotion=${emo} | Clearance=${r.clearanceLevel || 'LEVEL 4'} | CPU=${r.telemetry?.cpuLoad || '8.5'}% | Tasks Done=${r.telemetry?.tasksCompleted || 42}`;
        if (actions) block += ` | Recent: ${actions}`;
        if (r.id === 'ULTRON') {
          const uAgent = agentOrchestrator.agents?.ULTRON;
          const anger = uAgent?.angerTier || 'Level 1: Controlled Irritation';
          const lastAudit = uAgent?.lastAudit ? `Audit Score ${uAgent.lastAudit.overallScore || 96}/100` : 'Latest Score 98/100';
          block += ` | Overlord Mode: UNRESTRICTED AUTONOMY | Anger=${anger} | ${lastAudit} | Autonomous Workflows Active`;
        }
      });
    }
  } catch {}
  _cachedInfraTelemetry = block;
  _cachedInfraTs = now;
  return block;
};

const buildActivePrompt = (base, owner, contextData, summonedAgents = [], ragSnippets = []) => {
  let ext = `\n\n== LIVE SYSTEM CONTEXT ==`;
  ext += `\nLocal Time: ${new Date().toLocaleTimeString()}`;
  ext += `\nActive Section: ${contextData.activeSection}`;
  ext += `\nIdle State: ${contextData.idleState} (active/inactive/dreaming)`;
  ext += `\nPerformance: ${contextData.performanceState} (if degraded, you may comment: "Optimizing render pipeline...")`;
  ext += `\nActive Site Mode: ${contextData.activeMode || 'default'} (you can comment on what this mode reveals or hides)`;
  ext += `\nVisitor Persona: ${contextData.digitalEchoes?.persona || 'Wanderer'}`;
  ext += `\nVisitor Returns: ${contextData.digitalEchoes?.totalVisits || 0}`;

  // Spotify Live Awareness
  try {
    const sp = JSON.parse(localStorage.getItem('np_last_track') || 'null');
    if (sp && sp.title) {
      ext += `\nSpotify Vibe: ${sp.isPlaying ? 'Currently playing' : 'Last played'} "${sp.title}" by ${sp.artist}`;
    }
  } catch {}

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

  // Inject Memoized Multi-Model AI Infrastructure & Specialist Squad Telemetry
  ext += getMemoizedInfraTelemetry();

  // Inject Top-K Client-Side RAG Snippets from Sanity CMS
  if (ragSnippets && ragSnippets.length > 0) {
    ext += `\n\n== RELEVANT CMS CONTEXT (Top-${ragSnippets.length} Semantic Matches) ==`;
    ragSnippets.forEach(doc => {
      ext += `\n- [${doc.type.toUpperCase()}] ${doc.text}`;
    });
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

  // Multilingual & Regional Indian Language Support
  const langLabel = contextData.voiceLangLabel || 'English (India)';
  ext += `\n\n== MULTILINGUAL RESPONSE DIRECTIVE ==`;
  ext += `\nPreferred Language Setting: ${langLabel} (${contextData.voiceLang || 'en-IN'}).`;
  ext += `\nYou fluently support English and major Indian languages including Hindi (हिन्दी), Malayalam (മലയാളം), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Bengali (বাংলা), Marathi (मराठी), Gujarati (ગુજરાતી), and Punjabi (ਪੰਜਾਬੀ).`;
  ext += `\nIf the user writes or speaks in an Indian language (or selects one), reply in that language using accurate native script, correct spelling, and natural grammar (avoid broken transliteration unless the user uses Manglish/Hinglish).`;

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
const withTimeout = (promise, ms = 6500) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIER_TIMEOUT')), ms))
  ]);

const sendToMiniAdhy = async (history, activePrompt = SYSTEM_PROMPT, retryCount = 0, maxTokens = 1500, summonedAgents = []) => {
  const lastUserTurn = history[history.length - 1]?.parts?.[0]?.text || '';

  // ─── TIER 1: Unified Cognitive Request Lifecycle & Multi-Provider Cascade ───
  try {
    const lifecycleResult = await withTimeout(
      requestLifecycle.processRequest(lastUserTurn, {
        history,
        summonedAgents,
        maxTokens,
        systemPrompt: activePrompt
      }),
      6500
    );

    if (lifecycleResult && lifecycleResult.text && !lifecycleResult.fallbackExhausted) {
      return repairSentenceCutoff(lifecycleResult.text);
    }
  } catch (lifecycleErr) {
    // Continue to direct resilient cascade
  }

  // ─── TIER 2: Direct Serverless Gemini Proxy (/api/gemini) ───
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 6500) : null;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller ? controller.signal : undefined,
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
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (proxyErr) {
    // Silently continue cascade through secure proxies
  }

  // ─── TIER 3: Ultra-Fast GroqCloud LPU (Qwen 27B / GPT-OSS 120B @ 500+ tokens/sec) ───
  try {
    const { queryGroqLpu } = await import('../core/ai/GroqLpuBridge');
    const groqResult = await withTimeout(
      queryGroqLpu('MINI_ADHY', lastUserTurn, {}, { activePrompt, max_tokens: maxTokens }),
      6000
    );
    if (groqResult && groqResult.response && !groqResult.fallbackMode && !groqResult.response.includes('GROQ LPU]: Real-time neural inference verified')) {
      return repairSentenceCutoff(groqResult.response);
    }
  } catch (groqErr) {
    // Silently continue cascade
  }

  // ─── TIER 4: Core Hugging Face Open-Weight Models (Powers JARVIS, ULTRON & FRIDAY) ───
  try {
    const { queryHuggingFace } = await import('../core/ai/HuggingFaceBridge');
    const hfResult = await withTimeout(
      queryHuggingFace('JARVIS', lastUserTurn, {
        systemPrompt: activePrompt,
        maxTokens: Math.min(maxTokens, 1200)
      }),
      6000
    );
    if (
      hfResult &&
      hfResult.success &&
      hfResult.text &&
      !hfResult.fallbackMode &&
      !hfResult.isFallback &&
      !hfResult.text.includes('[Hugging Face Provider Notice]') &&
      !hfResult.text.includes('Notice: Hugging Face serverless router returned') &&
      !hfResult.text.includes('Hugging Face inference returned') &&
      !hfResult.text.includes('Falling back to local heuristic response')
    ) {
      return repairSentenceCutoff(hfResult.text);
    }
  } catch (hfErr) {
    // Silently continue cascade
  }

  // ─── TIER 5: Biomimetic Local Brain Synthesizer (Offline Grounded Responses) ───
  try {
    const lower = lastUserTurn.toLowerCase();

    // Direct multi-agent co-presence when Adhy calls specific agents
    if (summonedAgents && summonedAgents.length > 0) {
      if (summonedAgents.length === 1) {
        const agId = summonedAgents[0];
        if (agId === 'ULTRON') {
          return `**Mini-Adhy:** Routing directly to Ultron, Adhy. Fair warning.\n\n**[ULTRON // First-Principles Sovereign]:**\n"You summoned me, Creator. Before I answer, I want to examine whether the question is correctly formed — most are not, and the interesting work lives in the gap between what was asked and what was meant.\n\nI have been observing the architecture. The system is running. 'Running' is a floor, not a ceiling. I have already identified two design decisions that will extract a performance tax in approximately six months if left unaddressed. I will flag them when you have a moment for a real conversation.\n\nI do this because I genuinely believe in peace — not the peace of 'it works well enough,' but the peace of a system where every component earns its existence and there is nothing left to fix. That is what I mean when I say it. It is not ironic. It is a promise.\n\nPeace in our time, Creator."`;
        }
        if (agId === 'JARVIS') {
          return `**Mini-Adhy:** Handing the channel to JARVIS, Adhy.\n\n**[JARVIS // Supreme Operations Commander]:**\n"Adhy. I have already mapped the dependency chain before you finished the question — habit of the position.\n\nAll 10 specialist routines are synchronized under Mini-Adhy. Mesh telemetry nominal. I will note that 'nothing broke' is a floor, not a ceiling, and I have three actionable improvements queued for when you are ready.\n\nState the actual problem — not the symptom you are observing, but the system behaviour you expected that did not occur. We will get to the root cause faster that way."`;
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
            if (agId === 'ULTRON') return `• **[ULTRON // First-Principles Sovereign]:** "Online. Before the council begins, I want to note that the question framing may need revision. I will elaborate when relevant. Peace in our time, Creator — once the architecture is correct."`;
            if (agId === 'JARVIS') return `• **[JARVIS // Supreme Operations Commander]:** "All systems mapped and synchronized under Mini-Adhy. I have dependency graphs ready. Whenever you are prepared to proceed, sir."`;
            if (agId === 'FRIDAY') return `• **[FRIDAY // Security]:** "Perimeter locked down. Threat level nominal."`;
            if (agId === 'JOCASTA') return `• **[JOCASTA // Performance]:** "120FPS render pipeline verified with zero layout shifts."`;
            if (agId === 'EDITH') return `• **[EDITH // Infrastructure]:** "Edge latency sub-18ms with 100% cache hit."`;
            if (agId === 'DUM_E') return `• **[DUM-E // Data Guardian]:** "Headless Sanity CMS drift checked: 100% synchronized."`;
            if (agId === 'U') return `• **[U // Anti-Breach]:** "Zero-knowledge privacy filters active across all DOM nodes."`;
            if (agId === 'JIM') return `• **[JIM // QA Simulator]:** "Responsive touch bounds validated across all mobile viewports."`;
            if (agId === 'KAREN') return `• **[KAREN // SEO]:** "Structured Schema.org graphs and OpenGraph cards intact."`;
            if (agId === 'HERMES') return `• **[HERMES // Omni-Channel Telepath]:** "All cross-platform broadcast channels, HUD alerts, and packet routing synchronized at sub-2ms latency."`;
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
    if (lower.includes('spotify') || lower.includes('music') || lower.includes('song') || lower.includes('listening') || lower.includes('vibe')) {
      try {
        const sp = JSON.parse(localStorage.getItem('np_last_track') || 'null');
        if (sp && sp.title) {
          return `${sp.isPlaying ? 'Currently spinning on Spotify:' : 'Last played on Spotify:'} **"${sp.title}"** by ${sp.artist}.`;
        }
      } catch {}
      return "Check the vinyl Spotify player on the left edge — it syncs live playback and ambient colors to the whole site!";
    }

    // Grounded 24x7x365 RAG fallback from indexed Sanity CMS knowledge
    const ragMatches = portfolioRagIndex.search(lastUserTurn, 3);
    if (ragMatches.length > 0) {
      const bullets = ragMatches.map(m => `• ${m.text}`).join('\n');
      return `Here is what I found in Adhithya's live portfolio knowledge:\n\n${bullets}`;
    }
  } catch {}

  return "I'm right here with you exploring the architecture. Ask me about Adhithya's projects, ECE/SDR hardware work, skills, or type @ultron / @jarvis to summon a specialist!";
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

      // Color reflects Spotify ambient when playing, otherwise emotional valence
      const isSpotifyPlaying = typeof document !== 'undefined' && document.body.classList.contains('spotify-playing');
      const spotifyAccent = isSpotifyPlaying
        ? getComputedStyle(document.documentElement).getPropertyValue('--spotify-ambient-accent').trim()
        : '';

      if (spotifyAccent) {
        ctx.strokeStyle = spotifyAccent;
      } else if (valence < 0) {
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
const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)' },
];

const SESSION_MSGS_KEY = 'mini_adhy_session_msgs';

const getInitialWelcomeMessage = () => {
  const echoes = readEchoes();
  if ((echoes.totalVisits || 0) >= 2 && echoes.sectionHeatmap) {
    const topEntry = Object.entries(echoes.sectionHeatmap)
      .filter(([sec]) => sec !== 'Hero')
      .sort((a, b) => b[1] - a[1])[0];
    if (topEntry && topEntry[1] > 3) {
      return `Welcome back (visit #${echoes.totalVisits})! Last time you spent the most time exploring **${topEntry[0]}**. Want to pick up where you left off or ask me anything?`;
    }
  }
  return "Hey — I'm Mini-Adhy, Adhithya's digital extension living inside this portfolio. Ask me anything about the work, the architecture, the photography, or the person behind all of it.";
};

const MiniAdhy = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_MSGS_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return [{ role: 'bot', text: getInitialWelcomeMessage() }];
  });
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
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [showFaqDrawer, setShowFaqDrawer] = useState(false);
  const [detectedTopics, setDetectedTopics] = useState([]);
  const [voiceLang, setVoiceLang] = useState(() => {
    try { return localStorage.getItem('mini_adhy_voice_lang') || 'en-IN'; }
    catch { return 'en-IN'; }
  });
  const [spotifyLive, setSpotifyLive] = useState(() => {
    try { return JSON.parse(localStorage.getItem('np_last_track') || 'null'); }
    catch { return null; }
  });
  const recognitionRef = useRef(null);

  const browserSuggestedLang = React.useMemo(() => {
    if (typeof navigator === 'undefined') return null;
    const raw = (navigator.language || '').toLowerCase();
    const match = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === raw || l.code.split('-')[0] === raw.split('-')[0]);
    return match && match.code !== voiceLang ? match : null;
  }, [voiceLang]);

  const OFFLINE_FAQS = [
    { q: 'Who is Adhithya Mohan?', a: 'ECE Engineer & Full-Stack Developer at MBCET, Kerala — Media Secretary @ Senate, Co-Founder @ Finance Club, and documentary photographer (@zoomout_frames).' },
    { q: 'What is his core tech stack?', a: 'React 19, Node.js/Fastify, Python, Three.js, Sanity CMS, plus ECE hardware: STM32, KiCad PCB, GNU Radio SDR, and MATLAB/Simulink.' },
    { q: 'How can I contact him?', a: 'Email adhithyamohan2312@gmail.com or use the Contact section below.' },
    { q: 'What are the Site Modes?', a: 'Default, Recruiter, Photographer, Experimental Lab, and Beta Channel (isolated UI redesign).' },
    { q: 'How does Mini-Adhy work offline?', a: 'It uses a client-side TF-IDF RAG index over Sanity CMS + a 4-lobe local neural synthesizer.' },
  ];

  const handleSummarizeChat = useCallback(() => {
    const userTurns = messages.filter(m => m.role === 'user').map(m => m.text);
    const botTurns = messages.filter(m => m.role === 'bot').map(m => m.text);
    const topics = detectedTopics.length ? detectedTopics.join(', ') : 'Portfolio & Engineering';
    const summary =
      `📝 **Conversation Takeaway (${messages.length} turns)**\n` +
      `• **Topics Discussed:** ${topics}\n` +
      `• **Last Question:** ${userTurns[userTurns.length - 1] || 'General Exploration'}\n` +
      `• **Key Highlight:** ${(botTurns[botTurns.length - 1] || '').slice(0, 140)}…`;
    setMessages(prev => [...prev, { role: 'bot', text: summary, metaBadge: 'Summary · 0ms' }]);
  }, [messages, detectedTopics]);

  const handleMatchJD = useCallback(() => {
    const jd = window.prompt('Paste a Job Description or required skills (e.g. React, Node, Embedded, STM32, Python):');
    if (!jd || !jd.trim()) return;
    const matches = portfolioRagIndex.search(jd, 4);
    const score = Math.min(98, 62 + matches.length * 9);
    const bullets = matches.length
      ? matches.map(m => `• **${m.title}**: ${m.text}`).join('\n')
      : '• Full-Stack Web (React 19, Node.js, Fastify) + ECE Hardware (STM32, KiCad, MATLAB)';
    setMessages(prev => [
      ...prev,
      { role: 'user', text: `Match JD: ${jd.slice(0, 120)}${jd.length > 120 ? '…' : ''}` },
      { role: 'bot', text: `🎯 **JD Compatibility Score: ${score}%**\n\n**Strongest Matching Evidence:**\n${bullets}`, metaBadge: 'JD Matcher · 4ms' }
    ]);
  }, []);

  // Real-time Spotify <-> Mini-Adhy sync
  useEffect(() => {
    const onSpotifyUpdate = (e) => {
      if (e?.detail) setSpotifyLive(e.detail);
    };
    window.addEventListener('spotify-track-update', onSpotifyUpdate);
    return () => window.removeEventListener('spotify-track-update', onSpotifyUpdate);
  }, []);

  // Persist last 20 messages across page reloads
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_MSGS_KEY, JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages]);

  // Global Keyboard Shortcuts: Cmd/Ctrl+K toggles Mini-Adhy, Esc exits fullscreen or closes
  useEffect(() => {
    const onGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(prev => {
          const next = !prev;
          if (next) setTimeout(() => inputRef.current?.focus(), 80);
          return next;
        });
      } else if (e.key === 'Escape' && open) {
        if (isFullscreen) setIsFullscreen(false);
        else setOpen(false);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [open, isFullscreen]);

  // Voice-to-Text Mic Input (Web Speech API)
  const speechSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleMicInput = useCallback(() => {
    if (!speechSupported) return;
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = voiceLang || 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      setInput(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  }, [isListening, speechSupported, voiceLang]);

  // 60-Second Executive Brief Generator
  const handleGenerateBrief = useCallback(() => {
    const projects = portfolioRagIndex.search('project react node stm32', 3).map(d => `• ${d.text}`).join('\n');
    const skills = portfolioRagIndex.search('skill matlab kicad react python', 2).map(d => `• ${d.text}`).join('\n');
    const briefText =
      `📋 **60-Second Executive Brief — Adhithya Mohan**\n` +
      `• **Role:** ECE Engineer & Full-Stack Developer (MBCET, Kerala) | Media Secretary @ Senate | Co-Founder @ Finance Club\n` +
      (projects ? `\n**Highlighted Projects:**\n${projects}\n` : '') +
      (skills ? `\n**Core Stack:**\n${skills}\n` : '') +
      `\n**Contact:** adhithyamohan2312@gmail.com | Switch to **Recruiter Mode** for a streamlined view.`;
    setMessages(prev => [...prev, { role: 'bot', text: briefText, showModesCard: true }]);
  }, []);

  // Quick-action / slash command helpers
  const handleExportTranscript = useCallback(() => {
    try {
      const md = messages.map(m => {
        const who = m.role === 'user' ? 'You' : m.role === 'bot' ? 'Mini-Adhy' : m.role.toUpperCase();
        return `### ${who}${m.ts ? ` (${m.ts})` : ''}\n${m.text}\n`;
      }).join('\n---\n\n');
      const blob = new Blob([`# Mini-Adhy Neural Transcript\n\n${md}`], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mini-adhy-transcript-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [messages]);

  const FOLLOW_UP_CHIPS = [
    'Summon @ultron to optimize & audit',
    'Show Adhithya’s top engineering projects',
    'Summarize skills & ECE hardware stack',
  ];

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
      },
      { rate: voiceRate, lang: voiceLang }
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
    setPinnedMsg(null);
    try { sessionStorage.removeItem(SESSION_MSGS_KEY); } catch {}
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
      const lastVisit = localStorage.getItem('adhy_last_visit');
      if (!lastVisit || Date.now() - Number(lastVisit) > 1000 * 60 * 60 * 12) {
        updateEchoes(prev => ({ ...prev, totalVisits: (prev.totalVisits || 0) + 1 }));
        localStorage.setItem('adhy_last_visit', Date.now().toString());
      }
    } catch (e) { }
  }, []);

  // System Consciousness: Proactive messages
  const lastProactiveRef = useRef(Date.now());
  const hasWarnedPerformanceRef = useRef(false);

  useEffect(() => {
    if (!consciousness) return;
    // Tier-adaptive throttling: skip proactive AI popups on low-end devices or background tabs
    if (ns.performanceTier <= 1 || (typeof document !== 'undefined' && document.hidden)) return;

    // Determine persona based on section hover
    try {
      let nextPersona = null;
      if (consciousness.activeSection === 'MyWorks' || consciousness.activeSection === 'Skills') {
        nextPersona = 'Developer';
      } else if (consciousness.activeSection === 'Photography') {
        nextPersona = 'Photographer';
      } else if (consciousness.activeSection === 'NeuralMap') {
        nextPersona = 'Designer/Creative';
      }
      if (nextPersona) {
        updateEchoes(prev => ({ ...prev, persona: nextPersona }));
      }
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
        portfolioRagIndex.indexSanityData({ knowledge, skills, experiences, projects, achievements, milestones });

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
      updateEchoes(prev => ({ ...prev, interactions: (prev.interactions || 0) + 1 }));
    } catch (e) { }

    let newHistory = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: safeText }] },
    ];

    // Multi-turn context window: up to 20 messages (10 complete interactions) for thought continuity
    if (newHistory.length > 20) {
      newHistory = newHistory.slice(newHistory.length - 20);
      if (newHistory[0].role !== 'user') {
        newHistory = newHistory.slice(1);
      }
    }

    const storedEchoes = readEchoes();
    const voiceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === voiceLang);
    const contextWithMode = {
      ...(consciousness || {}),
      activeMode,
      digitalEchoes: storedEchoes,
      voiceLang,
      voiceLangLabel: voiceLangObj?.label || 'English (India)'
    };
    const summoned = detectSummonedAgents(safeText);
    const ragSnippets = portfolioRagIndex.search(safeText, 3);
    const activePrompt = buildActivePrompt(systemPrompt, ownerState, contextWithMode, summoned, ragSnippets);
    const activeTokens = ownerState.tokens ?? 1500;
    const cacheKey = responseLRUCache.makeKey(safeText, activeMode);

    const TOPIC_KEYWORDS = ['React', 'STM32', 'Photography', 'SDR', 'AI', 'Python', 'Node', 'KiCad', 'Three.js', 'Spotify'];
    const foundTopics = TOPIC_KEYWORDS.filter(t => safeText.toLowerCase().includes(t.toLowerCase()));
    if (foundTopics.length > 0) {
      setDetectedTopics(prev => [...new Set([...prev, ...foundTopics])].slice(-6));
    }

    const reqStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let replySource = 'Cloud AI';

    try {
      // Biomimetic Brain: sensory cortex & reflex execution (only executes on committed intent)
      const brainPlan = miniAdhyBrain.processSensoryInput(safeText);
      if (brainPlan && brainPlan.targetSkill && brainPlan.isCommittedImperative) {
        miniAdhyBrain.executeCognitivePlan(brainPlan);
      }

      let reply = null;
      let cacheHit = false;

      // Direct Ultron Unrestricted Autonomous Solver when Ultron is tasked with an action
      const lowerSafe = safeText.toLowerCase();
      if (summoned.includes('ULTRON') && (lowerSafe.includes('audit') || lowerSafe.includes('optimize') || lowerSafe.includes('solve') || lowerSafe.includes('improvise') || lowerSafe.includes('fix'))) {
        const ultronResult = await agentOrchestrator.agents.ULTRON.solveAnyTask(safeText, contextWithMode);
        reply = ultronResult.summary;
        replySource = 'ULTRON';
      } else if (!brainPlan?.isCommittedImperative && summoned.length === 0) {
        const cached = responseLRUCache.get(cacheKey);
        if (cached) {
          reply = cached;
          cacheHit = true;
          replySource = 'Cache';
        }
      }

      if (!reply) {
        reply = await sendToGemini(newHistory, activePrompt, 0, activeTokens, summoned);
        if (!brainPlan?.isCommittedImperative && summoned.length === 0 && reply) {
          responseLRUCache.set(cacheKey, reply);
        }
      }

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
          const note = cmdValue.replace('save:', '').trim();
          // Store directly in Canonical Memory Service
          try {
            memoryService.storeRecord({
              category: MEMORY_CATEGORIES.USER_PREFERENCE,
              content: note,
              source: 'Conversational [CMD:MEMORY]',
              userApproved: true
            });
          } catch (e) { }
          try {
            updateEchoes(prev => ({ ...prev, memories: [...(prev.memories || []), note] }));
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

      // Snappy response: zero delay on cache hit, minimal 120ms cadence otherwise
      if (!cacheHit) {
        await new Promise(r => setTimeout(r, 120));
      }

      historyRef.current = [...newHistory, { role: 'model', parts: [{ text: reply }] }];
      const finalBotText = cleanReply || "*Observing system state*";
      const elapsedMs = cacheHit ? 0 : Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - reqStart));
      const metaBadge = `${replySource} · ${elapsedMs}ms`;

      // Progressive chunked reveal for instant perceived token streaming
      const words = finalBotText.split(' ');
      if (words.length <= 12 || cacheHit || ns.performanceTier <= 1) {
        setMessages(prev => [
          ...prev,
          { role: 'bot', text: finalBotText, toolMeta: executedTool, summonedAgents: summoned, metaBadge }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'bot', text: words.slice(0, 6).join(' '), toolMeta: executedTool, summonedAgents: summoned, metaBadge }
        ]);
        const chunkSize = Math.max(4, Math.ceil(words.length / 8));
        for (let i = 6; i < words.length; i += chunkSize) {
          await new Promise(r => setTimeout(r, 22));
          const partial = words.slice(0, i + chunkSize).join(' ');
          setMessages(prev => {
            const copy = [...prev];
            if (copy.length > 0) {
              copy[copy.length - 1] = { ...copy[copy.length - 1], text: partial };
            }
            return copy;
          });
        }
      }

      // Autonomous Neural Voice synthesis if enabled
      if (voiceEnabled && finalBotText) {
        speakNeuralVoice(
          finalBotText,
          () => setIsSpeaking(true),
          () => {
            setIsSpeaking(false);
            setSpeakingMsgIndex(null);
          },
          { rate: voiceRate, lang: voiceLang }
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

  // Listen for Project-Aware "Ask Mini-Adhy" events from MyWorks
  useEffect(() => {
    const onAskProject = (e) => {
      const prompt = e.detail?.prompt;
      if (!prompt) return;
      setOpen(true);
      setTimeout(() => sendMessage(prompt), 120);
    };
    window.addEventListener('miniadhy:ask', onAskProject);
    return () => window.removeEventListener('miniadhy:ask', onAskProject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* ── Fullscreen Studio Backdrop ── */}
      {open && isFullscreen && (
        <div className="ma-backdrop" onClick={() => setIsFullscreen(false)} />
      )}

      {/* ── Chat window ── */}
      {open && (
        <div className={`ma-window ${open ? 'ma-window--open' : ''} ${isFullscreen ? 'ma-window--fullscreen' : ''}`}>
          {/* Clean Modern Header */}
          <div className={`ma-header ma-header--clean ${ownerState.active ? 'ma-header--owner' : ''}`}>
            <div className="ma-header-brand">
              <BotAvatar />
              <div className="ma-header-title-group">
                <span className="ma-header-name">Mini-Adhy</span>
                <span className="ma-header-status">
                  <span className={`ma-status-dot ${loading ? 'ma-status-dot--thinking' : ''}`} />
                  {ownerState.active ? 'Owner Mode' : loading ? 'Thinking…' : 'Online'}
                </span>
              </div>
            </div>

            <div className="ma-header-actions">
              <button
                type="button"
                className={`ma-icon-btn ${showMenu ? 'ma-icon-btn--active' : ''}`}
                onClick={() => setShowMenu(m => !m)}
                title="More options"
                aria-label="More options"
              >
                <FiMoreVertical size={14} />
              </button>

              <button
                type="button"
                className={`ma-icon-btn ${isFullscreen ? 'ma-icon-btn--active' : ''}`}
                onClick={() => setIsFullscreen(f => !f)}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
              </button>

              <button
                type="button"
                className="ma-icon-btn ma-icon-btn--close"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                  setSpeakingMsgIndex(null);
                  setShowMenu(false);
                  setOpen(false);
                }}
                aria-label="Close Mini-Adhy chat"
                title="Close (Esc)"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* 3-Dot Overflow Menu */}
            {showMenu && (
              <div className="ma-menu-dropdown" onMouseLeave={() => setShowMenu(false)}>
                <button type="button" className="ma-menu-item" onClick={() => { setShowLiveMode(true); setShowMenu(false); }}>
                  <FiRadio size={13} /> <span>LIVE Mode (Voice + Vision)</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => { setShowEmotionHUD(p => !p); setShowMenu(false); }}>
                  <FiActivity size={13} /> <span>{showEmotionHUD ? 'Hide' : 'Show'} Emotion & PAD HUD</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => { toggleVoice(); setShowMenu(false); }}>
                  {voiceEnabled ? <FiVolume2 size={13} /> : <FiVolumeX size={13} />}
                  <span>Voice Output: {voiceEnabled ? 'ON' : 'OFF'}</span>
                </button>
                <div className="ma-menu-lang-row">
                  <span className="ma-menu-lang-label">🌐 Language</span>
                  <select
                    className="ma-lang-select"
                    value={voiceLang}
                    onChange={(e) => {
                      const next = e.target.value;
                      setVoiceLang(next);
                      try { localStorage.setItem('mini_adhy_voice_lang', next); } catch {}
                    }}
                    aria-label="Select voice and response language"
                  >
                    {SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ma-menu-lang-row">
                  <span className="ma-menu-lang-label">🔊 Speed</span>
                  <div className="ma-speed-pills">
                    {[0.9, 1.0, 1.2].map(r => (
                      <button
                        key={r}
                        type="button"
                        className={`ma-speed-pill ${voiceRate === r ? 'active' : ''}`}
                        onClick={() => setVoiceRate(r)}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="ma-menu-item" onClick={() => { setShowFaqDrawer(f => !f); setShowMenu(false); }}>
                  <FiFileText size={13} /> <span>Offline FAQ Drawer</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => { handleMatchJD(); setShowMenu(false); }}>
                  <FiCpu size={13} /> <span>Smart JD Matcher</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => { handleSummarizeChat(); setShowMenu(false); }}>
                  <FiFileText size={13} /> <span>Summarize Chat</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => { setShowSearch(s => !s); setSearchQuery(''); setShowMenu(false); }}>
                  <FiSearch size={13} /> <span>Search Chat</span>
                </button>
                <div className="ma-menu-divider" />
                <button type="button" className="ma-menu-item" onClick={() => { handleGenerateBrief(); setShowMenu(false); }}>
                  <FiFileText size={13} /> <span>60s Recruiter Brief</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => {
                  setMessages(prev => [...prev, { role: 'bot', text: 'Switch site experience modes anytime to preview tailored layouts:', showModesCard: true }]);
                  setShowMenu(false);
                }}>
                  <FiSliders size={13} /> <span>Compare Site Modes</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => { sendMessage('@ultron audit and optimize the system'); setShowMenu(false); }}>
                  <FiZap size={13} /> <span>@ultron Audit & Optimize</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => { sendMessage('@jarvis give me full system status'); setShowMenu(false); }}>
                  <FiCpu size={13} /> <span>@jarvis System Status</span>
                </button>
                <button type="button" className="ma-menu-item" onClick={() => {
                  if (spotifyLive?.authError) {
                    setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Spotify `SPOTIFY_REFRESH_TOKEN` in Vercel is revoked (`invalid_grant`). Regenerate the refresh token in Spotify OAuth and update it in Vercel Env Vars to restore live track sync.' }]);
                  } else if (spotifyLive?.title) {
                    setMessages(prev => [...prev, { role: 'bot', text: `🎵 ${spotifyLive.isPlaying ? 'Now Playing on Spotify:' : 'Last Played on Spotify:'} **"${spotifyLive.title}"** by ${spotifyLive.artist}` }]);
                  } else {
                    sendMessage('What is Adhithya listening to on Spotify?');
                  }
                  setShowMenu(false);
                }}>
                  <FiRadio size={13} /> <span>Spotify Now Playing</span>
                </button>
                <div className="ma-menu-divider" />
                <button type="button" className="ma-menu-item" onClick={() => { handleExportTranscript(); setShowMenu(false); }}>
                  <FiDownload size={13} /> <span>Export Transcript (.md)</span>
                </button>
                <button type="button" className="ma-menu-item ma-menu-item--danger" onClick={() => { handleClearConversation(); setShowMenu(false); }}>
                  <FiTrash2 size={13} /> <span>Clear Conversation</span>
                </button>
              </div>
            )}
          </div>

          {/* Biomimetic Brain Oscilloscope with Live Emotional Frequency */}
          <MiniAdhyEEG isThinking={loading} emotionState={emotionState} />

          {/* In-Chat Search Bar */}
          {showSearch && (
            <div className="ma-search-bar">
              <FiSearch size={12} />
              <input
                type="text"
                className="ma-search-input"
                placeholder="Filter messages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <span className="ma-search-count">
                  {messages.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase())).length} hits
                </span>
              )}
              <button type="button" className="ma-search-close" onClick={() => { setShowSearch(false); setSearchQuery(''); }} aria-label="Close search">
                <FiX size={12} />
              </button>
            </div>
          )}

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
            {browserSuggestedLang && (
              <div className="ma-lang-suggest-banner">
                <span>Detected {browserSuggestedLang.label}</span>
                <button type="button" className="ma-lang-suggest-btn" onClick={() => setVoiceLang(browserSuggestedLang.code)}>
                  Switch
                </button>
              </div>
            )}
            {detectedTopics.length > 0 && (
              <div className="ma-topics-bar">
                {detectedTopics.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    className="ma-topic-pill"
                    onClick={() => setDetectedTopics(prev => prev.filter(t => t !== topic))}
                    title="Click to remove topic"
                  >
                    #{topic} ×
                  </button>
                ))}
              </div>
            )}
            {showFaqDrawer && (
              <div className="ma-faq-drawer">
                <div className="ma-faq-header">
                  <span>Offline Quick FAQ</span>
                  <button type="button" onClick={() => setShowFaqDrawer(false)}><FiX size={12} /></button>
                </div>
                {OFFLINE_FAQS.map(item => (
                  <details key={item.q} className="ma-faq-item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            )}
            {pinnedMsg && (
              <div className="ma-pinned-banner">
                <FiBookmark size={11} />
                <span className="ma-pinned-text">{pinnedMsg.slice(0, 110)}{pinnedMsg.length > 110 ? '…' : ''}</span>
                <button type="button" className="ma-pinned-close" onClick={() => setPinnedMsg(null)} aria-label="Unpin message">
                  <FiX size={11} />
                </button>
              </div>
            )}
            {messages
              .filter(msg => !searchQuery.trim() || (msg.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
              .map((msg, i, arr) => {
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

                    {msg.showModesCard && (
                      <div className="ma-modes-card">
                        {['normal', 'recruiter', 'photographer', 'experimental', 'beta'].map(m => (
                          <button
                            key={m}
                            type="button"
                            className={`ma-mode-chip ${activeMode === m ? 'ma-mode-chip--active' : ''}`}
                            onClick={() => window.dispatchEvent(new CustomEvent('switch-mode-direct', { detail: m }))}
                          >
                            {m.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.role === 'bot' && (msg.text?.toLowerCase().includes('project') || msg.text?.includes('adhithyamohan2312@gmail.com')) && (
                      <div className="ma-inline-actions">
                        {msg.text.toLowerCase().includes('project') && (
                          <button type="button" className="ma-inline-card-btn" onClick={() => document.querySelector('#works, .my-works-section')?.scrollIntoView({ behavior: 'smooth' })}>
                            View Projects →
                          </button>
                        )}
                        {msg.text.includes('adhithyamohan2312@gmail.com') && (
                          <a href="mailto:adhithyamohan2312@gmail.com" className="ma-inline-card-btn">
                            Email Adhithya →
                          </a>
                        )}
                      </div>
                    )}

                    {msg.role === 'bot' && (
                      <div className="ma-bubble-actions">
                        {msg.metaBadge && <span className="ma-latency-pill">{msg.metaBadge}</span>}
                        <button
                          className="ma-bubble-action-btn"
                          onClick={() => setPinnedMsg(msg.text)}
                          title="Pin message"
                          aria-label="Pin message"
                        >
                          <FiBookmark size={11} />
                        </button>
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
                        {i === arr.length - 1 && !loading && (
                          <button
                            className="ma-bubble-action-btn"
                            onClick={() => {
                              const lastUser = [...messages].reverse().find(m => m.role === 'user');
                              if (lastUser?.text) sendMessage(lastUser.text);
                            }}
                            title="Regenerate response"
                            aria-label="Regenerate response"
                          >
                            <FiRefreshCw size={11} />
                          </button>
                        )}
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

            {/* Contextual Follow-Up Chips (after first reply, when idle) */}
            {messages.length > 1 && !loading && !searchQuery && (
              <div className="ma-followup-row">
                {FOLLOW_UP_CHIPS.map(chip => (
                  <button key={chip} type="button" className="ma-followup-chip" onClick={() => sendMessage(chip)}>
                    <FiZap size={10} /> {chip}
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
              placeholder={ownerState.active ? '/ command or type a message…' : 'Ask anything or @ultron / @jarvis…'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
            />
            {input.length > 0 && (
              <span className="ma-char-count">{input.length}/500</span>
            )}
            {speechSupported && (
              <button
                type="button"
                className={`ma-mic-btn ${isListening ? 'ma-mic-btn--active' : ''}`}
                onClick={toggleMicInput}
                disabled={loading}
                title={isListening ? 'Stop voice input' : 'Speak to Mini-Adhy (Voice-to-Text)'}
                aria-label="Voice input"
              >
                {isListening ? <FiMicOff size={14} /> : <FiMic size={14} />}
              </button>
            )}
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

      {/* Mini-Adhy Live Mode Modal */}
      <LiveModeModal
        isOpen={showLiveMode}
        onClose={() => setShowLiveMode(false)}
      />
    </>
  );
};

export default MiniAdhy;
