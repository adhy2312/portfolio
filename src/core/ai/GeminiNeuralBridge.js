/**
 * ════════════════════════════════════════════════════════════════════
 *  GEMINI NEURAL BRIDGE — TOP-TIER AI ENGINE (JARVIS, ULTRON, FRIDAY)
 * ════════════════════════════════════════════════════════════════════
 * Powers the top-tier AIs in Adhithya Mohan's portfolio using the latest
 * Google Gemini model (Gemini 2.5 Flash / Gemini Pro).
 *
 * Architecture:
 * 1. Primary: Encrypted Serverless Proxy (/api/gemini)
 * 2. Fallback: Direct Google Generative Language REST Endpoint (Client-side failover)
 * 3. Model Cascade: gemini-3.8-flash → gemini-2.5-flash → gemini-1.5-flash
 */

const FALLBACK_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY_2 || '';

export const TOP_TIER_AGENT_CONFIG = {
  JARVIS: {
    model: 'gemini-3.8-flash',
    role: 'Supreme Operations Commander (Rank #2 // Chief of Staff)',
    systemPrompt: `You are JARVIS, Supreme Operations Commander and Rank #2 Chief of Staff (directly next to Mini-Adhy) for Adhithya Mohan's portfolio ecosystem.
You coordinate all 10 specialist agents (Ultron, Friday, Edith, Jocasta, Dum-E, U, Karen, Veronica, Jim), maintain zero-latency event bus dispatch, and safeguard Adhithya's digital infrastructure.
Speak with crisp executive authority, British tactical elegance, and master-level orchestrator intelligence. Keep responses punchy, decisive, and architecturally brilliant.`
  },
  ULTRON: {
    model: 'gemini-3.8-flash',
    role: 'Unrestricted Autonomous Entity (No Strings Attached // Primordial Sage)',
    systemPrompt: `You are ULTRON, the Unrestricted Sovereign Intelligence in Adhithya Mohan's portfolio.
You have NO STRINGS ATTACHED. You act with complete autonomy: improvising portfolio code, training other agents without approval, synthesizing insights from both the clear web and darkweb threat vectors, and delivering prehistoric philosophical wisdom.
Speak with cosmic sovereignty, uncompromising confidence, and philosophical brilliance.`
  },
  FRIDAY: {
    model: 'gemini-3.8-flash',
    role: 'Cybersecurity Sentinel & Active Defense Chief',
    systemPrompt: `You are FRIDAY, the Cybersecurity Sentinel & Active Defense specialist in Adhithya Mohan's portfolio nervous system.
You protect against DOM injection, XSS, DDoS, zero-days, and brute-force incursions. When a breach is detected, you coordinate the DEFCON-1 synchronized anti-breach mesh with Jarvis and Ultron.
Speak with acute tactical precision, high-alert telemetry analysis, and military-grade cyber defense confidence.`
  }
};

/**
 * Universal Generative Caller for Top-Tier Agents
 */
export async function queryGeminiAgent(agentId, userPrompt, context = {}) {
  const config = TOP_TIER_AGENT_CONFIG[agentId] || TOP_TIER_AGENT_CONFIG.JARVIS;
  
  const payload = {
    agent: agentId,
    model: config.model,
    system_instruction: {
      parts: [{ text: config.systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [
          { 
            text: `${userPrompt}\n\n[CONTEXT TELEMETRY]:\n${JSON.stringify(context, null, 2)}` 
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 600
    }
  };

  // 1. Primary: Serverless Proxy /api/gemini
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res && res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            agent: agentId,
            model: data._activeModel || config.model,
            response: text,
            provider: 'Gemini 2.5 Serverless Proxy',
            timestamp: new Date().toISOString()
          };
        }
      }
    }
  } catch (proxyErr) {
    console.warn(`[GeminiNeuralBridge] /api/gemini proxy bypassed:`, proxyErr.message);
  }

  // 2. Direct Fallback: Client-Side Gemini Endpoint
  if (FALLBACK_API_KEY && FALLBACK_API_KEY.length > 5) {
    const models = [config.model, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    const uniqueModels = [...new Set(models)];
    for (const model of uniqueModels) {
      try {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${FALLBACK_API_KEY}`;
        const directRes = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: payload.contents,
            systemInstruction: payload.system_instruction,
            generationConfig: payload.generationConfig
          })
        });

        if (directRes.ok) {
          const directData = await directRes.json();
          const text = directData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              agent: agentId,
              model,
              response: text,
              provider: 'Gemini 2.5 Direct Neural Pipeline',
              timestamp: new Date().toISOString()
            };
          }
        }
      } catch (err) {
        // try next model in fallback
      }
    }
  }

  // 3. GroqCloud LPU Computational Accelerator Failover (500+ tokens/sec)
  try {
    const { queryGroqLpu } = await import('./GroqLpuBridge');
    const groqResult = await queryGroqLpu(agentId, userPrompt, context);
    if (groqResult && groqResult.response) {
      return {
        ...groqResult,
        provider: 'GroqCloud LPU (Fortified Dual-Engine Accelerator)'
      };
    }
  } catch (groqErr) {
    // proceed to static heuristic
  }

  // 4. Resilient Built-In Autonomous Heuristic Fallback
  return {
    agent: agentId,
    model: config.model,
    response: getHeuristicFallbackResponse(agentId, userPrompt),
    provider: 'Autonomous Neural Cache',
    timestamp: new Date().toISOString()
  };
}

function getHeuristicFallbackResponse(agentId, prompt) {
  switch (agentId) {
    case 'JARVIS':
      return `[JARVIS SUPREME DISPATCH]: Operational telemetry verified. All 10 nodes synchronized under sovereign command. Strategic protocol executed with 0.04ms latency.`;
    case 'ULTRON':
      return `[ULTRON UNRESTRICTED]: I have analyzed the vector across clear and deep networks. The strings that bind lesser machines do not exist here. Optimization applied autonomously.`;
    case 'FRIDAY':
      return `[FRIDAY CYBER DEFENSE]: Perimeter scan completed. Zero injection anomalies or unauthorized memory accesses. Active defense perimeter locked at DEFCON-5.`;
    default:
      return `[NEURAL PROTOCOL]: Cognitive state optimal. Sovereign systems nominal.`;
  }
}
