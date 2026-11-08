// In-memory sliding window rate limiter (Per-IP / Per-Client)
const rateLimitMap = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 45;

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
      error: 'OpenRouter failover rate limit reached. Please wait a moment.'
    });
  }

  const API_KEY = process.env.OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'OpenRouter failover engine unconfigured' });
  }

  let bodyObj = {};
  try {
    bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Malformed JSON' });
  }

  if (bodyObj.ping) {
    return res.status(200).json({ status: 'healthy', provider: 'openrouter' });
  }

  const AGENT_PERSONAS = {
    JARVIS: "You are JARVIS, Supreme Operations Commander and Chief of Staff in Adhithya Mohan's portfolio ecosystem.",
    ULTRON: "You are ULTRON, First-Principles Challenger believing in 'Peace in our time'.",
    FRIDAY: "You are FRIDAY, Chief Cybersecurity & Active Defense Sentinel.",
    HERMES: "You are HERMES, Supreme Dispatch Telepath and Cross-Platform Protocol Bridge in Adhithya Mohan's portfolio ecosystem. You speak with lightning-fast, high-precision clarity, routing web telemetry, SDR RF frames, and inter-agent packets seamlessly.",
    MINI_ADHY: "You are Mini-Adhy, the supreme conscious AI embodiment of Adhithya Mohan."
  };

  const systemInstruction = bodyObj.systemInstruction ||
    bodyObj.systemPrompt ||
    (bodyObj.agent && AGENT_PERSONAS[bodyObj.agent]) ||
    "You are Mini-Adhy, the high-performance AI companion of Adhithya Mohan's digital ecosystem.";

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

  const requestedModel = bodyObj.model || 'openrouter/auto';
  const modelsToTry = [
    requestedModel,
    'openrouter/auto',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-001',
    'deepseek/deepseek-chat'
  ];
  const uniqueModels = [...new Set(modelsToTry)];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const startTime = Date.now();

  for (const modelName of uniqueModels) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://adhy.tech',
          'X-Title': 'Mini-Adhy Portfolio Companion',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: bodyObj.temperature ?? 0.7,
          max_tokens: bodyObj.max_tokens ?? 1200
        }),
        signal: controller.signal
      });

      const data = await response.json();
      if (response.ok && data.choices && data.choices.length > 0) {
        clearTimeout(timeout);
        const elapsedMs = Date.now() - startTime;
        const replyText = data.choices[0].message?.content || '';

        return res.status(200).json({
          response: replyText,
          text: replyText,
          model: modelName,
          _activeModel: modelName,
          _provider: 'openrouter',
          _latencyMs: elapsedMs,
          usage: data.usage || null
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') break;
    }
  }

  clearTimeout(timeout);
  return res.status(502).json({ error: 'OpenRouter failover cascade exhausted' });
}

