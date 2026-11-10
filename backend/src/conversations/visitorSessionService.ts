import crypto from 'crypto';
import { AppConfig } from '../config/env.js';
import { SupabaseAdapter } from '../auth/supabase.js';

export interface PublicConversationRecord {
  id: string;
  visitorSessionId: string;
  domain: 'PUBLIC';
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
    provider?: string;
    model?: string;
  }>;
}

export class VisitorSessionService {
  private primarySigningSecret: string;
  private previousSigningSecret?: string;
  private defaultTtlMs = 24 * 60 * 60 * 1000; // 24-hour default expiration
  // Bounded revocation cache (max 5000 entries) with TTL to avoid unbounded memory growth
  private revocationCache = new Map<string, { revoked: boolean; cachedAt: number }>();
  private readonly MAX_CACHE_ENTRIES = 5000;
  private readonly CACHE_TTL_MS = 60000; // 1 minute
  // Local store strictly for development and unit testing
  private localConversations = new Map<string, PublicConversationRecord>();
  private initialized = false;

  constructor(
    private config: AppConfig,
    private dbAdapter: SupabaseAdapter
  ) {
    if (config.NODE_ENV === 'production') {
      if (!config.VISITOR_SESSION_SIGNING_SECRET || config.VISITOR_SESSION_SIGNING_SECRET.length < 32) {
        throw new Error(
          '[Security Invariant Violation] In production mode, VISITOR_SESSION_SIGNING_SECRET is mandatory and must be at least 32 characters long.'
        );
      }
      this.primarySigningSecret = config.VISITOR_SESSION_SIGNING_SECRET;
    } else {
      this.primarySigningSecret =
        config.VISITOR_SESSION_SIGNING_SECRET ||
        config.APPROVAL_SIGNING_SECRET ||
        'dev_test_visitor_session_signing_secret_32_bytes_long';
    }

    if (config.VISITOR_SESSION_SIGNING_SECRET_PREVIOUS && config.VISITOR_SESSION_SIGNING_SECRET_PREVIOUS.length >= 32) {
      this.previousSigningSecret = config.VISITOR_SESSION_SIGNING_SECRET_PREVIOUS;
    }
  }

  private setCachedRevocation(tokenHash: string, revoked: boolean): void {
    if (this.revocationCache.size >= this.MAX_CACHE_ENTRIES) {
      const oldestKey = this.revocationCache.keys().next().value;
      if (oldestKey) this.revocationCache.delete(oldestKey);
    }
    this.revocationCache.set(tokenHash, { revoked, cachedAt: Date.now() });
  }

  private isCachedRevoked(tokenHash: string): boolean | null {
    const entry = this.revocationCache.get(tokenHash);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.CACHE_TTL_MS) {
      this.revocationCache.delete(tokenHash);
      return null;
    }
    return entry.revoked;
  }

  // Backward compatibility alias for test harnesses simulating durable preload
  public get revokedHashes(): { add: (tokenHash: string) => void; has: (tokenHash: string) => boolean; size: number } {
    return {
      add: (tokenHash: string) => this.setCachedRevocation(tokenHash, true),
      has: (tokenHash: string) => this.isCachedRevoked(tokenHash) === true,
      size: this.revocationCache.size
    };
  }

  /**
   * Initializes durable state: verifies PostgreSQL connectivity without unbounded table loads
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('revoked_visitor_sessions')
          .select('token_hash')
          .limit(1);
        if (error && this.config.NODE_ENV === 'production') {
          throw new Error('[Database Invariant Violation] Failed to reach revoked_visitor_sessions table in Supabase: ' + error.message);
        }
      } catch (err: any) {
        if (this.config.NODE_ENV === 'production') {
          throw err;
        }
      }
    } else if (this.config.NODE_ENV === 'production') {
      throw new Error('[Security Invariant Violation] Database client is required for visitor session service in production');
    }
    this.initialized = true;
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Deterministic SHA-256 hash of token to prevent storing raw plaintext credentials
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private computeHmac(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  }

  /**
   * Generates a cryptographically signed visitor session token:
   * vissess_<random_24_bytes_hex>.<expiresAtEpochMs>.<hmac_signature>
   */
  public generateSessionToken(ttlMs?: number): string {
    const rawEntropy = 'vissess_' + crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);
    const envelope = `${rawEntropy}.${expiresAt}`;
    const signature = this.computeHmac(envelope, this.primarySigningSecret);
    return `${envelope}.${signature}`;
  }

  /**
   * RESTRICTED: Synchronous cryptographic signature and expiration verification ONLY.
   * INSECURE FOR AUTHORIZATION — does not probe distributed database revocation.
   * CANNOT be used to authorize protected routes.
   */
  public verifySessionTokenSync(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    // Check bounded local cache
    const tokenHash = this.hashToken(token);
    const cachedState = this.isCachedRevoked(tokenHash);
    if (cachedState === true) {
      return false; // Confirmed revoked in cache
    }

    const parts = token.split('.');
    if (parts.length === 3) {
      // Format: rawEntropy.expiresAt.signature
      const [rawEntropy, expiresAtStr, signature] = parts;
      if (!rawEntropy.startsWith('vissess_')) return false;

      // Verify expiration
      const expiresAt = Number(expiresAtStr);
      if (isNaN(expiresAt) || expiresAt < Date.now()) {
        return false; // Expired token
      }

      const envelope = `${rawEntropy}.${expiresAtStr}`;
      // Verify with primary secret
      const expectedPrimary = this.computeHmac(envelope, this.primarySigningSecret);
      if (
        signature.length === expectedPrimary.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedPrimary))
      ) {
        return true;
      }

      // Secret rotation support: check previous secret if configured
      if (this.previousSigningSecret) {
        const expectedPrevious = this.computeHmac(envelope, this.previousSigningSecret);
        if (
          signature.length === expectedPrevious.length &&
          crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedPrevious))
        ) {
          return true;
        }
      }
      return false;
    } else if (parts.length === 2) {
      // Legacy 2-part format: rawEntropy.signature
      const [rawEntropy, signature] = parts;
      if (!rawEntropy.startsWith('vissess_')) return false;

      const expectedPrimary = this.computeHmac(rawEntropy, this.primarySigningSecret);
      if (
        signature.length === expectedPrimary.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedPrimary))
      ) {
        return true;
      }

      if (this.previousSigningSecret) {
        const expectedPrevious = this.computeHmac(rawEntropy, this.previousSigningSecret);
        if (
          signature.length === expectedPrevious.length &&
          crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedPrevious))
        ) {
          return true;
        }
      }
      return false;
    }

    return false;
  }

  /**
   * Authoritative multi-instance session verification:
   * 1. Awaits initialization
   * 2. Cryptographically verifies format, expiration, and signature
   * 3. Probes PostgreSQL table 'revoked_visitor_sessions' for multi-instance revocation visibility
   * 4. Fails closed with safe denial (false) on database errors, preventing middleware bypass or crashes
   */
  public async verifySessionToken(token: string): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;

    // Fast cryptographic & expiration validation
    if (!this.verifySessionTokenSync(token)) {
      return false;
    }

    try {
      await this.ensureInitialized();
    } catch {
      // Fail closed with safe denial if initialization fails
      return false;
    }

    const tokenHash = this.hashToken(token);

    // Bounded cache check
    const cachedState = this.isCachedRevoked(tokenHash);
    if (cachedState === true) {
      return false; // Revoked
    }

    // Authoritative multi-instance database verification
    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('revoked_visitor_sessions')
          .select('token_hash')
          .eq('token_hash', tokenHash)
          .maybeSingle();

        if (error) {
          // Safe denial response: database read failure denies access, does not throw unhandled exception
          console.error('[VisitorSession] Database read error during revocation check:', error.message);
          return false;
        }

        if (data && data.token_hash) {
          this.setCachedRevocation(tokenHash, true);
          return false; // Revoked across instances
        }

        // Cache confirmed valid state
        this.setCachedRevocation(tokenHash, false);
      } catch (err: any) {
        console.error('[VisitorSession] Exception during database verification:', err.message);
        return false;
      }
    } else if (this.config.NODE_ENV === 'production') {
      return false;
    }

    return true;
  }

  /**
   * Durably revokes a visitor session token across all application instances
   */
  public async revokeSessionToken(token: string): Promise<boolean> {
    if (!token) return false;
    try {
      await this.ensureInitialized();
    } catch {
      return false;
    }

    const tokenHash = this.hashToken(token);
    this.setCachedRevocation(tokenHash, true);

    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      try {
        const parts = token.split('.');
        const expiresAt = parts.length === 3 ? new Date(Number(parts[1])).toISOString() : null;
        const { error } = await supabase.from('revoked_visitor_sessions').insert({
          token_hash: tokenHash,
          revoked_at: new Date().toISOString(),
          expires_at: expiresAt
        });
        if (error) {
          console.error('[VisitorSession] Database write error during revocation:', error.message);
          return false;
        }
      } catch (err: any) {
        console.error('[VisitorSession] Exception during revocation insert:', err.message);
        return false;
      }
    } else if (this.config.NODE_ENV === 'production') {
      return false;
    }

    return true;
  }

  /**
   * Maintenance: prunes expired revoked session records older than 24h
   */
  public async cleanupExpiredRevocations(): Promise<number> {
    const supabase = this.dbAdapter.getClient();
    if (!supabase) return 0;
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('revoked_visitor_sessions')
        .delete()
        .lt('expires_at', nowIso)
        .select('token_hash');
      if (error) return 0;
      return data ? data.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Creates a public conversation with durable visitor session binding
   */
  public async createConversation(sessionToken: string, title = 'Public Portfolio Inquiry'): Promise<PublicConversationRecord> {
    await this.ensureInitialized();
    if (!(await this.verifySessionToken(sessionToken))) {
      throw new Error('[Security Invariant Violation] Cannot create conversation with unverified or revoked session token');
    }

    const convId = 'conv_' + crypto.randomUUID();
    const tokenHash = this.hashToken(sessionToken);
    const nowIso = new Date().toISOString();

    const record: PublicConversationRecord = {
      id: convId,
      visitorSessionId: sessionToken,
      domain: 'PUBLIC',
      title,
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: []
    };

    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      const { error } = await supabase.from('conversations').insert({
        id: convId,
        domain: 'PUBLIC',
        visitor_session_id: tokenHash,
        title,
        created_at: nowIso,
        updated_at: nowIso
      });

      if (error) {
        if (this.config.NODE_ENV === 'production') {
          throw new Error(`[Database Invariant Violation] Failed to persist conversation durably: ${error.message}`);
        }
      }
    } else if (this.config.NODE_ENV === 'production') {
      throw new Error('[Security Invariant Violation] Database client is required for conversation persistence in production');
    }

    // In development and testing, keep local Map copy
    if (this.config.NODE_ENV !== 'production') {
      this.localConversations.set(convId, record);
    }

    return record;
  }

  /**
   * Retrieves conversation with strict visitor session ownership verification
   */
  public async getConversation(
    conversationId: string,
    callerSessionToken: string
  ): Promise<{ status: 'OK' | 'NOT_FOUND' | 'FORBIDDEN'; conversation?: PublicConversationRecord }> {
    await this.ensureInitialized();
    if (!(await this.verifySessionToken(callerSessionToken))) {
      return { status: 'FORBIDDEN' };
    }

    const callerTokenHash = this.hashToken(callerSessionToken);
    const supabase = this.dbAdapter.getClient();

    if (supabase) {
      try {
        const { data: convRow, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('domain', 'PUBLIC')
          .single();

        if (error || !convRow) {
          if (this.config.NODE_ENV === 'production') {
            return { status: 'NOT_FOUND' };
          }
          // Test/dev fallback
          const local = this.localConversations.get(conversationId);
          if (!local) return { status: 'NOT_FOUND' };
          if (local.visitorSessionId !== callerSessionToken && local.visitorSessionId !== callerTokenHash) {
            return { status: 'FORBIDDEN' };
          }
          return { status: 'OK', conversation: local };
        }

        // Ownership invariant: caller token hash must match stored visitor_session_id
        if (convRow.visitor_session_id !== callerTokenHash && convRow.visitor_session_id !== callerSessionToken) {
          return { status: 'FORBIDDEN' };
        }

        const { data: messageRows } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        const messages = (messageRows || []).map((m: any) => ({
          id: m.id,
          role: m.sender_role,
          content: m.content,
          createdAt: m.created_at,
          provider: m.metadata?.provider,
          model: m.metadata?.model
        }));

        return {
          status: 'OK',
          conversation: {
            id: convRow.id,
            visitorSessionId: callerSessionToken,
            domain: 'PUBLIC',
            title: convRow.title,
            createdAt: convRow.created_at,
            updatedAt: convRow.updated_at,
            messages
          }
        };
      } catch (err: any) {
        if (this.config.NODE_ENV === 'production') {
          throw err;
        }
      }
    }

    if (this.config.NODE_ENV === 'production') {
      throw new Error('[Security Invariant Violation] Database client required for session retrieval in production');
    }

    const local = this.localConversations.get(conversationId);
    if (!local) return { status: 'NOT_FOUND' };
    if (local.visitorSessionId !== callerSessionToken && local.visitorSessionId !== callerTokenHash) {
      return { status: 'FORBIDDEN' };
    }
    return { status: 'OK', conversation: local };
  }

  /**
   * Appends user or assistant message to durable storage
   */
  public async appendMessage(
    conversationId: string,
    callerSessionToken: string,
    role: 'user' | 'assistant',
    content: string,
    meta?: { provider?: string; model?: string }
  ): Promise<boolean> {
    const access = await this.getConversation(conversationId, callerSessionToken);
    if (access.status !== 'OK' || !access.conversation) {
      return false;
    }

    const msgId = 'msg_' + crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const messageItem = {
      id: msgId,
      role,
      content,
      createdAt: nowIso,
      provider: meta?.provider,
      model: meta?.model
    };

    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      const { error } = await supabase.from('messages').insert({
        id: msgId,
        conversation_id: conversationId,
        sender_role: role,
        content,
        created_at: nowIso,
        metadata: meta || {}
      });

      if (error) {
        if (this.config.NODE_ENV === 'production') {
          throw new Error(`[Database Invariant Violation] Failed to append message durably: ${error.message}`);
        }
      }
    } else if (this.config.NODE_ENV === 'production') {
      throw new Error('[Security Invariant Violation] Database client is required to append message in production');
    }

    if (this.config.NODE_ENV !== 'production') {
      const local = this.localConversations.get(conversationId);
      if (local) {
        local.messages.push(messageItem);
        local.updatedAt = nowIso;
      }
    }

    return true;
  }
}
