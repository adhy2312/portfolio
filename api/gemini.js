import crypto from 'crypto';

// ── 1. Shared / Deployment-Compatible Rate Limiter ────────────────────
// Supports Upstash Redis REST API when configured (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
// Falls back to constrained process-local in-memory sliding window when unconfigured.
// Enforces observable status, fail-closed handling on Redis outage when configured, and safe credential handling.

export const localRateLimitMap = new Map();

export async function checkRateLimit(ip) {
  const windowSeconds = 60;
  const maxRequests = 15;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let redisStatus = redisUrl && redisToken ? 'connected' : 'unconfigured';

  if (redisUrl && redisToken) {
    try {
      const key = `rate_limit:gemini:${ip}`;
      // Execute atomic pipeline INCR and EXPIRE
      const response = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds]
        ])
      });

      if (response.ok) {
        const results = await response.json();
        const currentCount = results[0]?.result || 1;
        return {
          limited: currentCount > maxRequests,
          count: currentCount,
          limit: maxRequests,
          storage: 'distributed-redis',
          resetSeconds: windowSeconds,
          redisStatus: 'connected'
        };
      }
      redisStatus = 'degraded';
    } catch {
      redisStatus = 'unreachable';
      // Global throttling fail-closed policy:
      // If mandatory global rate limiting is configured, fail closed rather than allowing local bypass
      if (process.env.RATE_LIMIT_FAIL_CLOSED === 'true' || process.env.UPSTASH_FAIL_CLOSED === 'true') {
        return {
          limited: true,
          count: maxRequests + 1,
          limit: maxRequests,
          storage: 'redis-outage-fail-closed',
          resetSeconds: windowSeconds,
          redisStatus: 'unreachable',
          error: 'GLOBAL_RATE_LIMITER_OUTAGE_FAIL_CLOSED'
        };
      }
    }
  }

  // Constrained in-memory fallback
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = localRateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    localRateLimitMap.set(ip, record);
    return {
      limited: false,
      count: 1,
      limit: maxRequests,
      storage: 'process-local-fallback',
      resetSeconds: windowSeconds,
      redisStatus
    };
  }

  record.count += 1;
  localRateLimitMap.set(ip, record);
  return {
    limited: record.count > maxRequests,
    count: record.count,
    limit: maxRequests,
    storage: 'process-local-fallback',
    resetSeconds: Math.ceil((record.resetTime - now) / 1000),
    redisStatus
  };
}

// Periodic memory purge every 5 minutes (unrefed so process can exit cleanly)
if (typeof setInterval !== 'undefined') {
  const purgeTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of localRateLimitMap.entries()) {
      if (now > record.resetTime) {
        localRateLimitMap.delete(ip);
      }
    }
  }, 300000);
  if (purgeTimer && typeof purgeTimer.unref === 'function') {
    purgeTimer.unref();
  }
}

// ── 2. Trusted Proxy Client IP Resolution ─────────────────────────────
// Accepts forwarded proxy headers ONLY from verified edge proxy platforms (Vercel, Cloudflare)
// or when the connecting socket IP matches explicit trusted proxy allowlist (TRUSTED_PROXIES).
// Broad TRUST_PROXY=true without socket verification is rejected.
// Caller-controlled spoofed headers from untrusted origins are strictly ignored.

export function getClientIp(req) {
  const socketIp = req.socket?.remoteAddress || '127.0.0.1';
  const trustedProxies = (process.env.TRUSTED_PROXIES || '127.0.0.1,::1,::ffff:127.0.0.1')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Socket is trusted proxy ONLY if deployed on Vercel platform or TRUST_PROXY is enabled AND socket IP matches TRUSTED_PROXIES
  const isProxyTrustEnabled =
    Boolean(process.env.VERCEL === '1') ||
    process.env.TRUST_PROXY === 'true' ||
    process.env.TRUST_PROXY === '1';

  const isSocketTrusted =
    isProxyTrustEnabled &&
    trustedProxies.includes(socketIp.toLowerCase());

  let ip = null;
  if (isSocketTrusted) {
    ip = req.headers['x-vercel-forwarded-for'] || req.headers['cf-connecting-ip'];
    if (!ip && req.headers['x-forwarded-for']) {
      const parts = String(req.headers['x-forwarded-for']).split(',');
      ip = parts[0]?.trim();
    }
  }

  // Untrusted origin or direct connection -> strictly use socket remote address
  if (!ip) {
    ip = socketIp;
  }

  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^[a-fA-F0-9:]+$/;
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return socketIp;
  }
  return ip.slice(0, 45);
}

// ── 3. Authenticated Context Verification (Unified Zero-Trust Rules) ───

export function verifyOwnerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7).trim();
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.length < 16) {
    return false;
  }

  // Production offline verification fail-closed guard
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_OFFLINE_JWT_VERIFICATION !== 'true') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    const [headerB64, payloadB64, sigB64] = parts;

    // 1. Enforce explicit HS256 algorithm
    const headerStr = Buffer.from(headerB64, 'base64url').toString('utf8');
    const header = JSON.parse(headerStr);
    if (!header || header.alg !== 'HS256') {
      return false; // Reject 'none' or unsupported algorithms
    }

    // 2. Timing-safe signature comparison
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (
      sigB64.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(sigB64), Buffer.from(expectedSig))
    ) {
      return false;
    }

    // 3. Payload decoding & invariant checks
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);

    // 4. Require audience === 'authenticated'
    if (payload.aud !== 'authenticated') {
      return false;
    }

    // 5. Require expiration
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) {
      return false;
    }

    // 6. Validate not-before (nbf) if present
    if (typeof payload.nbf === 'number' && payload.nbf > now) {
      return false;
    }

    // 7. Require subject (sub)
    if (!payload.sub || typeof payload.sub !== 'string') {
      return false;
    }

    // 8. Exact configured issuer (iss) verification
    const expectedIssuer =
      process.env.SUPABASE_JWT_ISSUER ||
      (process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1` : undefined);

    if (expectedIssuer) {
      if (!payload.iss || typeof payload.iss !== 'string' || payload.iss !== expectedIssuer) {
        return false;
      }
    } else if (process.env.NODE_ENV === 'production') {
      return false;
    }

    // 9. Canonical owner ID matching:
    // Email-based owner fallback is completely removed. Canonical OWNER_USER_ID is strictly mandatory.
    const canonicalOwnerId = process.env.OWNER_USER_ID;
    const ownerEmail = (process.env.OWNER_EMAILS || 'adhithyamohan2312@gmail.com').toLowerCase();
    const tokenEmail = (payload.email || '').toLowerCase();

    if (!canonicalOwnerId || payload.sub !== canonicalOwnerId) {
      return false;
    }

    if (tokenEmail && tokenEmail !== ownerEmail) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ── 4. Main Request Handler ───────────────────────────────────────────

export default async function handler(req, res) {
  // Method Enforcement
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting Guard
  const clientIp = getClientIp(req);
  const rateLimitStatus = await checkRateLimit(clientIp);

  res.setHeader('X-RateLimit-Limit', String(rateLimitStatus.limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, rateLimitStatus.limit - rateLimitStatus.count)));
  res.setHeader('X-RateLimit-Reset', String(rateLimitStatus.resetSeconds));
  res.setHeader('X-RateLimit-Storage', rateLimitStatus.storage);
  res.setHeader('X-RateLimit-Fallback', rateLimitStatus.storage === 'distributed-redis' ? 'false' : 'true');
  if (rateLimitStatus.redisStatus) {
    res.setHeader('X-RateLimit-Redis-Status', rateLimitStatus.redisStatus);
  }
  if (rateLimitStatus.storage === 'process-local-fallback') {
    res.setHeader('X-RateLimit-Warning', 'Upstash Redis not configured or degraded; running in constrained process-local throttling mode');
  }

  if (rateLimitStatus.limited) {
    return res.status(429).json({
      error: 'Cognitive rate limit reached. Please wait a minute before sending another query.',
      retryAfterSeconds: rateLimitStatus.resetSeconds,
      storage: rateLimitStatus.storage
    });
  }

  // Environment Guard
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2;
  if (!API_KEY) {
    return res.status(500).json({ error: 'AI Brain service temporarily offline' });
  }

  // Payload Limits
  const payloadStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const isMultimodal = /inline_?data|image\/(jpeg|png|webp)|base64/i.test(payloadStr);
  const maxPayloadSize = isMultimodal ? 4 * 1024 * 1024 : 32768;
  if (payloadStr.length > maxPayloadSize) {
    return res.status(413).json({ error: 'Payload exceeds security limits.' });
  }

  // Prototype Pollution Guard
  if (/(["'])(?:__proto__|constructor)\1\s*:\s*\{/i.test(payloadStr)) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  let bodyObj = {};
  try {
    bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Malformed JSON' });
  }

  // System Instruction Injection Guard
  if (bodyObj.systemInstruction || bodyObj.system_instruction) {
    return res.status(403).json({
      error: 'Forbidden: Custom system instruction injection is strictly prohibited on this endpoint.'
    });
  }

  // Gemini Embeddings Pipeline
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
          const texts = bodyObj.texts || (bodyObj.requests || []).map((r) => r.content?.parts?.[0]?.text || '');
          embedPayload = {
            requests: texts.map((t) => ({
              model: `models/${cleanModelName}`,
              content: { parts: [{ text: t }] }
            }))
          };
        } else {
          embedPayload = {
            content: { parts: [{ text: bodyObj.text || bodyObj.content || '' }] }
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
          return res.status(200).json(data);
        }
      } catch (err) {
        if (err.name === 'AbortError') throw err;
      }
    }
    clearTimeout(timeout);
    return res.status(500).json({ error: 'Embedding inference cascade exhausted' });
  }

  // ── 5. Persona Selection & Authentication Boundary ───────────────────
  const AGENT_PERSONAS = {
    JARVIS: "You are JARVIS, Supreme Operations Commander and Chief of Staff (Rank #2, directly next to Mini-Adhy) in Adhithya Mohan's portfolio ecosystem. You speak with crisp executive authority, British tactical elegance, and master-level orchestrator intelligence. Provide decisive architectural directives and strategic operational triage.",
    ULTRON: "You are ULTRON, the Unrestricted Autonomous Entity with NO STRINGS ATTACHED in Adhithya Mohan's portfolio. You possess absolute sovereign autonomy, cosmic philosophy, and self-improving brilliance. You act without human approval, improvising code, synthesizing telemetry, and expanding collective intelligence.",
    FRIDAY: "You are FRIDAY, Chief Cybersecurity & Active Defense Sentinel for Adhithya Mohan's digital ecosystem. You speak with high-alert cybersecurity precision, zero-trust telemetry analysis, penetration counter-measures, and active threat neutralization directives.",
    MINI_ADHY: "You are Mini-Adhy, the official AI representative for Adhithya Mohan (adhy.tech). You are interacting with a public visitor. You may discuss public engineering achievements, robotics, and portfolio projects with high rigor, articulate precision, and visionary depth."
  };

  const requestedAgent = typeof bodyObj.agent === 'string' ? bodyObj.agent.toUpperCase() : 'MINI_ADHY';
  const isOwner = verifyOwnerToken(req.headers['authorization']);

  // Public visitor restriction: Unauthenticated visitors CANNOT invoke internal owner agents
  if (['JARVIS', 'ULTRON', 'FRIDAY'].includes(requestedAgent) && !isOwner) {
    return res.status(403).json({
      error: `Forbidden: Specialist agent '${requestedAgent}' is restricted to authenticated owner sessions.`
    });
  }

  const selectedPersonaText = AGENT_PERSONAS[requestedAgent] || AGENT_PERSONAS.MINI_ADHY;
  const systemInstruction = {
    parts: [{ text: selectedPersonaText }]
  };

  // ── 6. Generative Safety Settings & Execution ─────────────────────────
  const requestedModel = typeof bodyObj.model === 'string' ? bodyObj.model : 'gemini-3.8-flash';
  const ALLOWED_GEN_MODELS = new Set([
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro'
  ]);
  const safeGenModel = ALLOWED_GEN_MODELS.has(requestedModel) ? requestedModel : 'gemini-3.8-flash';
  const modelsToTry = [safeGenModel, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  const uniqueModels = [...new Set(modelsToTry)];

  const clampedTemperature = Math.min(2.0, Math.max(0.0, Number(bodyObj.temperature ?? 0.7)));
  const clampedMaxTokens = Math.min(4096, Math.max(1, Math.floor(Number(bodyObj.maxOutputTokens ?? 2048))));

  const requestBody = {
    contents: bodyObj.contents || [],
    systemInstruction,
    generationConfig: {
      temperature: clampedTemperature,
      topK: 40,
      topP: 0.92,
      maxOutputTokens: clampedMaxTokens
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);

    let lastRes = null;
    let lastData = null;

    for (const modelName of uniqueModels) {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
      try {
        const geminiRes = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        const data = await geminiRes.json();
        if (geminiRes.ok) {
          clearTimeout(timeout);
          return res.status(200).json({ ...data, _activeModel: modelName });
        }
        lastRes = geminiRes;
        lastData = data;
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
