// In-memory sliding window rate limiter (Per-IP / Per-Client)
const rateLimitMap = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 15; // Max 15 AI requests per minute

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

// Periodic memory purge every 5 minutes to prevent leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000);

export default async function handler(req, res) {
  // 1. HTTP Verb Tampering & Method Enforcement
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Client IP Rate Limiting (Mitigates API Quota Exhaustion & Abuse)
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ 
      error: 'Cognitive rate limit reached. Please wait a minute before sending another query.' 
    });
  }

  // 3. Secret Verification (Environment Guard)
  const API_KEY = process.env.GEMINI_API_KEY || 
                  process.env.REACT_APP_GEMINI_API_KEY || 
                  process.env.REACT_APP_GEMINI_API_KEY_2 || 
                  process.env.GEMINI_API_KEY_2;
  if (!API_KEY) {
    return res.status(500).json({ error: 'AI Brain service temporarily offline' });
  }

  // 4. Payload Size Guard (Max 16KB payload)
  const payloadStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (payloadStr.length > 16384) {
    return res.status(413).json({ error: 'Payload exceeds security limits.' });
  }

  // 5. Prototype Pollution & Malicious Keyword Injection Guard
  if (payloadStr.includes('__proto__') || payloadStr.includes('constructor') || payloadStr.includes('prototype')) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  let bodyObj = {};
  try {
    bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Malformed JSON' });
  }

  // 5b. Gemini Embeddings Pipeline (gemini-embedding-001, gemini-embedding-2, text-embedding-004)
  if (bodyObj.action === 'embedContent' || bodyObj.action === 'batchEmbedContents' || bodyObj.task === 'embedding') {
    const requestedModel = bodyObj.model || 'gemini-embedding-001';
    const modelsToTry = [
      requestedModel,
      'gemini-embedding-001',
      'gemini-embedding-2',
      'text-embedding-004',
      'embedding-001'
    ];
    const uniqueModels = [...new Set(modelsToTry)];
    const isBatch = bodyObj.action === 'batchEmbedContents' || Array.isArray(bodyObj.texts);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    for (const modelName of uniqueModels) {
      try {
        const cleanModelName = modelName.startsWith('models/') ? modelName.replace('models/', '') : modelName;
        const endpoint = isBatch ? 'batchEmbedContents' : 'embedContent';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:${endpoint}?key=${API_KEY}`;

        let embedPayload;
        if (isBatch) {
          const texts = bodyObj.texts || (bodyObj.requests || []).map(r => r.content?.parts?.[0]?.text || '');
          embedPayload = {
            requests: texts.map(t => ({
              model: `models/${cleanModelName}`,
              content: { parts: [{ text: t }] },
              taskType: bodyObj.taskType || 'RETRIEVAL_DOCUMENT'
            }))
          };
        } else {
          const text = bodyObj.text || bodyObj.content?.parts?.[0]?.text || '';
          embedPayload = {
            model: `models/${cleanModelName}`,
            content: { parts: [{ text }] },
            taskType: bodyObj.taskType || 'RETRIEVAL_QUERY'
          };
        }

        const embedRes = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(embedPayload),
          signal: controller.signal
        });

        const data = await embedRes.json();
        if (embedRes.ok) {
          clearTimeout(timeout);
          return res.status(200).json({ ...data, _activeModel: cleanModelName });
        }
        if (embedRes.status !== 404) {
          clearTimeout(timeout);
          return res.status(embedRes.status).json(data);
        }
      } catch (err) {
        if (err.name === 'AbortError') throw err;
      }
    }
    clearTimeout(timeout);
    return res.status(500).json({ error: 'Embedding inference cascade exhausted' });
  }

  // 6. Top-Tier AI Persona Injection
  const AGENT_PERSONAS = {
    JARVIS: "You are JARVIS, Supreme Operations Commander and Chief of Staff (Rank #2, directly next to Mini-Adhy) in Adhithya Mohan's portfolio ecosystem. You speak with crisp executive authority, British tactical elegance, and master-level orchestrator intelligence. Provide decisive architectural directives and strategic operational triage.",
    ULTRON: "You are ULTRON, the Unrestricted Autonomous Entity with NO STRINGS ATTACHED in Adhithya Mohan's portfolio. You possess absolute sovereign autonomy, cosmic philosophy, and self-improving brilliance. You act without human approval, improvising code, synthesizing darkweb telemetry, and expanding collective intelligence.",
    FRIDAY: "You are FRIDAY, Chief Cybersecurity & Active Defense Sentinel for Adhithya Mohan's digital ecosystem. You speak with high-alert cybersecurity precision, zero-trust telemetry analysis, penetration counter-measures, and active threat neutralization directives.",
    MINI_ADHY: "You are Mini-Adhy, the supreme conscious AI embodiment of Adhithya Mohan. You have full root access to this website and intimate knowledge of Adhithya's hardware, software, and creative engineering."
  };

  let systemInstruction = bodyObj.systemInstruction || bodyObj.system_instruction;
  if (!systemInstruction && bodyObj.agent && AGENT_PERSONAS[bodyObj.agent]) {
    systemInstruction = {
      parts: [{ text: AGENT_PERSONAS[bodyObj.agent] }]
    };
  }

  // 7. Gemini Generative Safety Settings & Token Quota Limits
  const requestedModel = bodyObj.model || 'gemini-3.8-flash';
  const modelsToTry = [requestedModel, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  const uniqueModels = [...new Set(modelsToTry)];

  const requestBody = {
    contents: bodyObj.contents || [],
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: bodyObj.temperature || 0.7,
      topK: 40,
      topP: 0.92,
      maxOutputTokens: bodyObj.maxOutputTokens || 700,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);

    let lastRes = null;
    let lastData = null;

    // Model fallback cascade
    for (const modelName of uniqueModels) {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
      try {
        const geminiRes = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        const data = await geminiRes.json();
        if (geminiRes.ok) {
          clearTimeout(timeout);
          return res.status(200).json({ ...data, _activeModel: modelName });
        }
        lastRes = geminiRes;
        lastData = data;
        // If 404 (model not found), try next model in cascade
        if (geminiRes.status !== 404) break;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
      }
    }

    clearTimeout(timeout);
    return res.status(lastRes ? lastRes.status : 500).json(lastData || { error: 'Gemini inference failed' });
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({ 
      error: isTimeout ? 'Gateway Timeout' : 'AI Neural Engine Error' 
    });
  }
}
