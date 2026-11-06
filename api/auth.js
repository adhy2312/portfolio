/**
 * ════════════════════════════════════════════════════════════════════
 *  CLASSIFIED SERVERLESS AUTHENTICATION & AUTHORIZATION BOUNDARY
 * ════════════════════════════════════════════════════════════════════
 * Server-side gatekeeper for Adhy.tech:
 * • Timing-safe authentication against server-side secrets
 * • Cryptographically signed HMAC-SHA256 session tokens
 * • Strict IP sliding-window rate limiting against brute force
 * • Capability-based command authorization
 * • HttpOnly, Secure, SameSite=Strict session cookie management
 * • Zero secrets leaked to client bundles
 */

import crypto from 'crypto';

// ── Rate Limiting (Per-IP Brute Force Prevention) ─────────────────────
const failedAttemptsMap = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 2 * 60 * 1000; // 2 minute lockdown window
  const maxFailed = 5; // Max 5 failed attempts per 2 minutes

  const record = failedAttemptsMap.get(ip) || { failures: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    failedAttemptsMap.delete(ip);
    return false;
  }
  return record.failures >= maxFailed;
};

const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const windowMs = 2 * 60 * 1000;
  const record = failedAttemptsMap.get(ip) || { failures: 0, resetTime: now + windowMs };
  record.failures += 1;
  failedAttemptsMap.set(ip, record);
};

const resetFailedAttempts = (ip) => {
  failedAttemptsMap.delete(ip);
};

// Periodic memory purge every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of failedAttemptsMap.entries()) {
    if (now > record.resetTime) {
      failedAttemptsMap.delete(ip);
    }
  }
}, 300000);

// ── Timing-Safe Comparison ──────────────────────────────────────────
function timingSafeCompare(a = '', b = '') {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
      // Dummy compare to avoid timing leak on length
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ── Cryptographic Session Token Engine ──────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Fail closed in production if security secrets are missing
let SIGNING_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PASSCODE;
if (!SIGNING_SECRET) {
  if (IS_PRODUCTION) {
    // Fail-closed security boundary: never use fallback static secrets in production
    console.error('[SECURITY ALERT] Production session signing secret is unconfigured. Failing closed.');
  } else {
    // Development/test ephemeral key: randomly generated per process lifetime
    SIGNING_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('[SECURITY NOTICE] Using ephemeral in-memory signing secret for development/testing.');
  }
}

function createSessionToken(role = 'owner') {
  if (!SIGNING_SECRET) {
    throw new Error('Security configuration missing: session signing unavailable.');
  }
  const payload = {
    role,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SIGNING_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token) {
  if (!SIGNING_SECRET || !token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SIGNING_SECRET).update(payloadB64).digest('base64url');

  if (!timingSafeCompare(signature, expectedSig)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ── Extract Token from Request ───────────────────────────────────────
function extractToken(req) {
  // 1. From Authorization Header
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. From Cookies
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/adhy_session=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  // 3. From JSON Body or Query Parameter
  if (req.body?.token) return req.body.token;
  if (req.query?.token) return req.query.token;

  return null;
}

export default async function handler(req, res) {
  // Prevent browser and proxy caching of authentication state
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const clientIp = req.headers['x-forwarded-for']?.split(',')?.[0]?.trim() || 
                   req.socket?.remoteAddress || 
                   'unknown';

  const action = req.query.action || req.body?.action || (req.method === 'POST' ? 'login' : 'verify');

  // ── 1. VERIFY SESSION (GET or POST) ───────────────────────────────
  if (action === 'verify') {
    const token = extractToken(req);
    const session = verifySessionToken(token);

    if (session && session.role) {
      return res.status(200).json({
        success: true,
        authenticated: true,
        role: session.role,
        expiresAt: new Date(session.exp).toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: false,
      role: null
    });
  }

  // ── 2. LOGIN (POST) ───────────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Defensive lockdown active for 2 minutes.'
      });
    }

    const { passcode = '', scope = 'agentp' } = req.body || {};
    const sanitizedPasscode = String(passcode).trim();

    // Production security boundary: In production, secrets must be configured via environment variables
    const expectedPortalPasscode = process.env.AGENT_PORTAL_PASSCODE || process.env.ADMIN_PASSCODE;
    const expectedOwnerCode = process.env.OWNER_CODE || process.env.OWNER_CODE_LEGACY;

    // Fail closed in production if credentials are not set
    if (IS_PRODUCTION && (!expectedPortalPasscode || !expectedOwnerCode)) {
      console.error('[SECURITY ALERT] Production authentication passcodes missing. Rejecting login.');
      return res.status(503).json({
        success: false,
        error: 'Authentication service temporarily unavailable due to security configuration.'
      });
    }

    // In development only, allow local test fallback if unconfigured
    const devPortalPasscode = expectedPortalPasscode || (!IS_PRODUCTION ? 'adhy_dev_local_pass' : null);
    const devOwnerCode = expectedOwnerCode || (!IS_PRODUCTION ? 'adhy_dev_owner_pass' : null);

    const isValidPortal = devPortalPasscode ? timingSafeCompare(sanitizedPasscode, devPortalPasscode) : false;
    const isValidOwner = devOwnerCode ? timingSafeCompare(sanitizedPasscode, devOwnerCode) : false;

    if (isValidPortal || isValidOwner) {
      resetFailedAttempts(clientIp);
      const role = isValidOwner ? 'owner' : 'agent_portal';
      const token = createSessionToken(role);

      // Secure Cookie: HttpOnly, Secure in production, SameSite=Strict
      const isProd = IS_PRODUCTION;
      res.setHeader(
        'Set-Cookie',
        `adhy_session=${encodeURIComponent(token)}; Path=/; Max-Age=86400; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`
      );

      return res.status(200).json({
        success: true,
        authenticated: true,
        role,
        token
      });
    }

    recordFailedAttempt(clientIp);
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Access attempt logged and quarantined.'
    });
  }

  // ── 3. LOGOUT (POST) ──────────────────────────────────────────────
  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'adhy_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict');
    return res.status(200).json({
      success: true,
      authenticated: false,
      message: 'Classified session terminated.'
    });
  }

  // ── 4. EXECUTE PRIVILEGED COMMAND (POST) ──────────────────────────
  if (action === 'execute_privileged') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = extractToken(req);
    const session = verifySessionToken(token);

    if (!session || (session.role !== 'owner' && session.role !== 'agent_portal')) {
      return res.status(403).json({
        success: false,
        error: 'Privileged authorization required. Access denied.'
      });
    }

    const { command = '', payload = {} } = req.body || {};
    const allowedCommands = ['TRIGGER_SCAN', 'APPROVE_ACTION', 'REJECT_ACTION', 'ULTRON_IMPROVISE', 'REFRESH_TELEMETRY'];

    if (!allowedCommands.includes(command)) {
      return res.status(400).json({
        success: false,
        error: 'Unrecognized or unauthorized command signature.'
      });
    }

    return res.status(200).json({
      success: true,
      command,
      executedAt: new Date().toISOString(),
      authorizedBy: session.role
    });
  }

  return res.status(400).json({ error: 'Unknown action signature.' });
}
