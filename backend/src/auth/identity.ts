import crypto from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AppConfig } from '../config/env.js';
import { SupabaseAdapter } from './supabase.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  isOwner: boolean;
  aud: string;
  exp: number;
}

export class IdentityAuthService {
  constructor(
    private config: AppConfig,
    private dbAdapter: SupabaseAdapter
  ) {}

  /**
   * Timing-safe string comparison
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Cryptographically decodes and verifies a JWT token
   * 1. Primary Authority: Supabase Auth auth.getUser(token)
   * 2. Secondary Cryptographic Verifier: strictly requires explicit SUPABASE_JWT_SECRET (HS256)
   * 3. NEVER uses SUPABASE_ANON_KEY as signing secret
   * 4. NEVER falls back to hardcoded default secrets
   * 5. Fails closed (returns null)
   */
  public async verifyToken(token: string): Promise<AuthenticatedUser | null> {
    if (!token || typeof token !== 'string') return null;

    // 1. If Supabase client is configured, verify via authoritative Supabase Auth
    const supabaseClient = this.dbAdapter.getClient();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.getUser(token);
        if (!error && data?.user) {
          const user = data.user;
          const email = (user.email || '').toLowerCase();
          const isOwner = this.isUserOwner(user.id, email);

          return {
            id: user.id,
            email,
            role: user.role || 'authenticated',
            isOwner,
            aud: user.aud || 'authenticated',
            exp: Math.floor(Date.now() / 1000) + 3600
          };
        }
      } catch {
        // Fall through to strict cryptographic verification if explicit secret is configured
      }
    }

    // 2. Strict cryptographic signature and claims verification (HS256)
    return this.verifyJwtCryptographically(token);
  }

  /**
   * Independent cryptographic signature and payload verification
   * Enforces algorithm, signature, issuer, audience, expiration, not-before, and subject.
   */
  public verifyJwtCryptographically(token: string): AuthenticatedUser | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Fail closed if no explicit JWT secret configured
    const secret = this.config.SUPABASE_JWT_SECRET;
    if (!secret || secret.length < 16) {
      return null;
    }

    // Decode header and enforce HS256 algorithm
    try {
      const headerStr = Buffer.from(headerB64, 'base64url').toString('utf8');
      const header = JSON.parse(headerStr);
      if (!header || header.alg !== 'HS256') {
        return null; // Reject 'none' or unsupported algorithms
      }
    } catch {
      return null;
    }

    // Verify HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    // Timing-safe signature comparison
    if (!this.timingSafeEqual(signatureB64, expectedSig)) {
      return null;
    }

    try {
      const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadStr);

      // Verify audience: must be 'authenticated'
      if (payload.aud !== 'authenticated') {
        return null;
      }

      // Verify expiration
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (typeof payload.exp !== 'number' || payload.exp < nowSeconds) {
        return null;
      }

      // Verify not-before (nbf) if present
      if (typeof payload.nbf === 'number' && payload.nbf > nowSeconds) {
        return null;
      }

      // Verify subject exists
      if (!payload.sub || typeof payload.sub !== 'string') {
        return null;
      }

      // Verify issuer (iss) if configured
      if (this.config.SUPABASE_URL && payload.iss) {
        const expectedPrefix = this.config.SUPABASE_URL;
        if (!payload.iss.startsWith(expectedPrefix)) {
          return null;
        }
      }

      const email = (payload.email || '').toLowerCase();
      const isOwner = this.isUserOwner(payload.sub, email);

      return {
        id: payload.sub,
        email,
        role: payload.role || 'authenticated',
        isOwner,
        aud: payload.aud,
        exp: payload.exp
      };
    } catch {
      return null;
    }
  }

  /**
   * Server-controlled owner authorization check (never trusts client bodies)
   */
  public isUserOwner(userId: string, email: string): boolean {
    if (this.config.OWNER_USER_ID && this.config.OWNER_USER_ID === userId) {
      return true;
    }
    if (email && this.config.ownerEmailsList && this.config.ownerEmailsList.length > 0) {
      return this.config.ownerEmailsList.includes(email.toLowerCase());
    }
    return false;
  }

  /**
   * Fastify Hook: Require Authenticated Owner (Deny-by-default)
   */
  public requireOwnerHook = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required. Missing or malformed Authorization header.'
      });
    }

    const token = authHeader.substring(7).trim();
    const user = await this.verifyToken(token);

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token.'
      });
    }

    // Explicit owner authorization check
    if (!user.isOwner) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Access denied: Caller is not authorized as the verified system owner.'
      });
    }

    // Attach authenticated owner to request context
    (request as any).user = user;
  };
}

