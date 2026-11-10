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
  private revokedHashes = new Set<string>();
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

  /**
   * Initializes durable state such as loading revoked sessions from PostgreSQL across restarts
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('revoked_visitor_sessions')
          .select('token_hash');
        if (!error && Array.isArray(data)) {
          for (const row of data) {
            if (row.token_hash) {
              this.revokedHashes.add(row.token_hash);
            }
          }
        }
      } catch {
        if (this.config.NODE_ENV === 'production') {
          throw new Error('Failed to synchronize durable revoked visitor sessions from Supabase');
        }
      }
    }
    this.initialized = true;
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
   * Cryptographically verifies session token authenticity, expiration, and checks durable revocation
   */
  public verifySessionToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    // Check revocation cache
    const tokenHash = this.hashToken(token);
    if (this.revokedHashes.has(tokenHash)) {
      return false;
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
   * Durably revokes a visitor session token
   */
  public async revokeSessionToken(token: string): Promise<boolean> {
    if (!token) return false;
    const tokenHash = this.hashToken(token);
    this.revokedHashes.add(tokenHash);

    // Also extract raw entropy if available
    const rawEntropy = token.split('.')[0];
    if (rawEntropy) {
      this.revokedHashes.add(this.hashToken(rawEntropy));
    }

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
        if (error && this.config.NODE_ENV === 'production') {
          throw new Error('Failed to durably record revoked session: ' + error.message);
        }
      } catch (err: any) {
        if (this.config.NODE_ENV === 'production') {
          throw err;
        }
      }
    }
    return true;
  }

  /**
   * Creates a public conversation with durable visitor session binding
   */
  public async createConversation(sessionToken: string, title = 'Public Portfolio Inquiry'): Promise<PublicConversationRecord> {
    if (!this.verifySessionToken(sessionToken)) {
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
    if (!this.verifySessionToken(callerSessionToken)) {
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
