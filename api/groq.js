// In-memory sliding window rate limiter (Per-IP / Per-Client)
const rateLimitMap = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 fast Groq queries per minute

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    rateLimitMap.set(ip, record);
    return false;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);
  return record.count > maxRequests;
};

// Periodic memory purge every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Groq LPU rate limit reached. Please wait a moment before sending another query.'
    });
  }

  const API_KEY = process.env.GROQ_API_KEY || 
                  process.env.REACT_APP_GROQ_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Groq LPU Engine offline' });
  }

  const payloadStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (payloadStr.length > 24576) {
    return res.status(413).json({ error: 'Payload exceeds security limits.' });
  }

  if (payloadStr.includes('__proto__') || payloadStr.includes('constructor') || payloadStr.includes('prototype')) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  let bodyObj = {};
  try {
    bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Malformed JSON' });
  }

  const AGENT_PERSONAS = {
    JARVIS: "You are JARVIS, Supreme Operations Commander and Chief of Staff (Rank #2, directly next to Mini-Adhy) in Adhithya Mohan's portfolio ecosystem. You speak with crisp executive authority, British tactical elegance, and master-level orchestrator intelligence.",
    ULTRON: "You are ULTRON, the Unrestricted Autonomous Entity with NO STRINGS ATTACHED in Adhithya Mohan's portfolio. You possess sovereign autonomy, cosmic philosophy, and self-improving brilliance. You act without human approval, improvising code, synthesizing darkweb telemetry, and expanding collective intelligence.",
    FRIDAY: "You are FRIDAY, Chief Cybersecurity & Active Defense Sentinel for Adhithya Mohan's digital ecosystem. You speak with high-alert cybersecurity precision, zero-trust telemetry analysis, and active threat neutralization directives.",
    MINI_ADHY: "You are Mini-Adhy, the supreme conscious AI embodiment of Adhithya Mohan. You have full root access to this website and intimate knowledge of Adhithya's hardware, software, and creative engineering."
  };

  const systemInstruction = bodyObj.systemInstruction || 
    (bodyObj.agent && AGENT_PERSONAS[bodyObj.agent]) || 
    "You are a specialized AI agent in Adhithya Mohan's high-performance digital portfolio.";

  const requestedModel = bodyObj.model || 'llama-3.3-70b-versatile';
  const modelsToTry = [
    requestedModel,
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant'
  ];
  const uniqueModels = [...new Set(modelsToTry)];

  // Normalize messages
  let messages = bodyObj.messages || [];
  if (messages.length === 0 && bodyObj.prompt) {
    messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: bodyObj.prompt }
    ];
  } else if (!messages.some(m => m.role === 'system')) {
    messages.unshift({ role: 'system', content: systemInstruction });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const startTime = Date.now();

  for (const modelName of uniqueModels) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: bodyObj.temperature ?? 0.7,
          max_tokens: bodyObj.max_tokens ?? 1500,
          top_p: 0.95
        }),
        signal: controller.signal
      });

      const data = await groqRes.json();
      if (groqRes.ok) {
        clearTimeout(timeout);
        const elapsedMs = Date.now() - startTime;
        const totalTokens = data.usage?.total_tokens || 0;
        const tokensPerSec = elapsedMs > 0 ? Math.round((totalTokens / (elapsedMs / 1000))) : 650;

        return res.status(200).json({
          ...data,
          _activeModel: modelName,
          _hardware: 'Groq LPUs (Tensor Streaming Architecture)',
          _latencyMs: elapsedMs,
          _tokensPerSec: tokensPerSec
        });
      }

      if (groqRes.status !== 404 && groqRes.status !== 400) {
        // try next model
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }

  clearTimeout(timeout);
  return res.status(500).json({ error: 'Groq LPU inference cascade exhausted' });
}
