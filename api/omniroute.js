/**
 * ════════════════════════════════════════════════════════════════════
 *  OMNIRUTE GATEWAY SERVERLESS PROXY (/api/omniroute)
 * ════════════════════════════════════════════════════════════════════
 * Bridges client browser sessions to local or self-hosted OmniRoute gateways:
 * • Protects against browser CORS issues when querying localhost or private LANs
 * • Forwards X-OmniRoute-Compression (RTK + Caveman) & telemetry headers
 * • Enforces payload size limits and prototype pollution sanitization
 */

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Health probe
    const targetUrl = (process.env.OMNIROUTE_URL || 
                       process.env.REACT_APP_OMNIROUTE_URL || 
                       'http://127.0.0.1:20128').replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const ping = await fetch(`${targetUrl}/models`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.status(ping.ok ? 200 : 503).json({
        gateway: 'OmniRoute',
        status: ping.ok ? 'connected' : 'degraded',
        url: targetUrl
      });
    } catch (e) {
      return res.status(503).json({
        gateway: 'OmniRoute',
        status: 'offline',
        url: targetUrl,
        error: e.message
      });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payloadStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (payloadStr.length > 65536) {
    return res.status(413).json({ error: 'Payload exceeds security limits (64KB).' });
  }

  // Prototype Pollution Key Injection Guard (safely ignores conversational prose)
  if (/(["'])(?:__proto__|constructor)\1\s*:\s*\{/i.test(payloadStr)) {
    return res.status(400).json({ error: 'Invalid payload structure.' });
  }

  let bodyObj = {};
  try {
    bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }

  const targetUrl = (process.env.OMNIROUTE_URL || 
                     process.env.REACT_APP_OMNIROUTE_URL || 
                     'http://127.0.0.1:20128').replace(/\/+$/, '');
  const apiKey = process.env.OMNIROUTE_API_KEY || '';

  const forwardHeaders = {
    'Content-Type': 'application/json'
  };
  if (apiKey) forwardHeaders['Authorization'] = `Bearer ${apiKey}`;
  if (req.headers['x-omniroute-strategy']) forwardHeaders['X-OmniRoute-Strategy'] = req.headers['x-omniroute-strategy'];
  if (req.headers['x-omniroute-compression']) forwardHeaders['X-OmniRoute-Compression'] = req.headers['x-omniroute-compression'];
  if (req.headers['x-omniroute-no-cache']) forwardHeaders['X-OmniRoute-No-Cache'] = req.headers['x-omniroute-no-cache'];
  if (req.headers['x-omniroute-fallover-before-retry']) forwardHeaders['X-OmniRoute-Fallover-Before-Retry'] = req.headers['x-omniroute-fallover-before-retry'];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const gatewayRes = await fetch(`${targetUrl}/chat/completions`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(bodyObj),
      signal: controller.signal
    });
    clearTimeout(timeout);

    // Forward OmniRoute telemetry headers back to client
    const telemetryHeaders = [
      'x-omniroute-provider',
      'x-omniroute-model',
      'x-omniroute-cache',
      'x-omniroute-tokens-saved',
      'x-omniroute-cost'
    ];
    telemetryHeaders.forEach(hdr => {
      const val = gatewayRes.headers.get(hdr);
      if (val) res.setHeader(hdr, val);
    });

    const data = await gatewayRes.json();
    return res.status(gatewayRes.status).json(data);
  } catch (err) {
    return res.status(503).json({
      error: 'OmniRoute gateway unreachable',
      message: err.message,
      targetUrl
    });
  }
}

