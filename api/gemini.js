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
  const API_KEY = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
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

  // 6. Gemini Generative Safety Settings & Token Quota Limits
  const MODEL = 'gemini-2.5-flash';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const requestBody = {
    contents: bodyObj.contents || [],
    systemInstruction: bodyObj.systemInstruction || bodyObj.system_instruction || undefined,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.92,
      maxOutputTokens: 600, // Enforce cost protection & prevent runaway generation
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  };

  try {
    // 7. Timeout Abort Controller (12-second ceiling prevents hanging serverless execution)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const geminiRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await geminiRes.json();
    return res.status(geminiRes.status).json(data);
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({ 
      error: isTimeout ? 'Gateway Timeout' : 'AI Neural Engine Error' 
    });
  }
}
