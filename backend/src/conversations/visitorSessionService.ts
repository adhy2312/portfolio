import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
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
  private signingSecret: string;
  private revokedSessions = new Set<string>();
  // Local store for dev/testing when live PostgreSQL is offline
  private localConversations = new Map<string, PublicConversationRecord>();

  constructor(
    private config: AppConfig,
    private dbAdapter: SupabaseAdapter
  ) {
    this.signingSecret =
      config.APPROVAL_SIGNING_SECRET ||
      config.ENCRYPTION_SECRET ||
      'default_secure_visitor_session_secret_32_bytes_long';
  }

  /**
   * Generates a cryptographically bound visitor session token:
   * vissess_<random_24_bytes_hex>.<hmac_sha256_signature>
   */
  public generateSessionToken(): string {
    const rawEntropy = 'vissess_' + crypto.randomBytes(24).toString('hex');
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(rawEntropy)
      .digest('base64url');
    return `${rawEntropy}.${signature}`;
  }

  /**
   * Cryptographically verifies session token authenticity and checks revocation status
   */
  public verifySessionToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [rawEntropy, signature] = parts;
    if (!rawEntropy.startsWith('vissess_')) return false;

    if (this.revokedSessions.has(token) || this.revokedSessions.has(rawEntropy)) {
      return false; // Revoked session
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(rawEntropy)
      .digest('base64url');

    if (signature.length !== expectedSignature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Explicitly revokes a visitor session token
   */
  public revokeSessionToken(token: string): boolean {
    if (!token) return false;
    this.revokedSessions.add(token);
    const rawEntropy = token.split('.')[0];
    if (rawEntropy) {
      this.revokedSessions.add(rawEntropy);
    }
    return true;
  }

  /**
   * Creates and persists a durable conversation
   */
  public async createConversation(sessionToken: string, title = 'Public Portfolio Inquiry'): Promise<PublicConversationRecord> {
    const convId = `conv_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
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
      try {
        await supabase.from('conversations').insert({
          id: convId,
          domain: 'PUBLIC',
          visitor_session_id: sessionToken,
          title,
          created_at: nowIso,
          updated_at: nowIso
        });
      } catch {}
    }

    this.localConversations.set(convId, record);
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
          // Check local fallback
          const local = this.localConversations.get(conversationId);
          if (!local) return { status: 'NOT_FOUND' };
          if (local.visitorSessionId !== callerSessionToken) return { status: 'FORBIDDEN' };
          return { status: 'OK', conversation: local };
        }

        // Ownership invariant: Caller must own this conversation
        if (convRow.visitor_session_id !== callerSessionToken) {
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
            visitorSessionId: convRow.visitor_session_id,
            domain: 'PUBLIC',
            title: convRow.title,
            createdAt: convRow.created_at,
            updatedAt: convRow.updated_at,
            messages
          }
        };
      } catch {}
    }

    const local = this.localConversations.get(conversationId);
    if (!local) return { status: 'NOT_FOUND' };
    if (local.visitorSessionId !== callerSessionToken) return { status: 'FORBIDDEN' };
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

    const msgId = `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const newMsg = {
      id: msgId,
      role,
      content,
      createdAt: nowIso,
      provider: meta?.provider,
      model: meta?.model
    };

    const supabase = this.dbAdapter.getClient();
    if (supabase) {
      try {
        await supabase.from('messages').insert({
          id: msgId,
          conversation_id: conversationId,
          sender_role: role,
          content,
          metadata: meta || {},
          created_at: nowIso
        });
      } catch {}
    }

    access.conversation.messages.push(newMsg);
    access.conversation.updatedAt = nowIso;
    this.localConversations.set(conversationId, access.conversation);
    return true;
  }
}
