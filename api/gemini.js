export default async function handler(req, res) {
  // 1. HTTP Verb Tampering & Method Enforcement
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Secret Verification (Environment Guard)
  const API_KEY = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Service temporarily unavailable' });
  }

  // 3. Payload Size Guard (Mitigates Memory Exhaustion & DoS)
  const payloadStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (payloadStr.length > 32768) { // Max 32KB
    return res.status(413).json({ error: 'Payload Too Large' });
  }

  // 4. Prototype Pollution & Injection Guard
  if (payloadStr.includes('__proto__') || payloadStr.includes('constructor') || payloadStr.includes('prototype')) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  const MODEL = 'gemini-2.5-flash';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    // 5. Timeout Abort Controller (Mitigates Slowloris & Hanging connections)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const geminiRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadStr,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await geminiRes.json();
    return res.status(geminiRes.status).json(data);
  } catch (error) {
    // 6. Information Disclosure Prevention (Sanitize error messages)
    const isTimeout = error.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({ 
      error: isTimeout ? 'Gateway Timeout' : 'AI Service Generation Error' 
    });
  }
}
