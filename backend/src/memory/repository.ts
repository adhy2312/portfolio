import { SupabaseClient } from '@supabase/supabase-js';
import { IMemoryRepository, MemoryRecord, MemoryPrivacyClass, MemoryLifecycleStatus } from './types.js';

export class InMemoryMemoryRepository implements IMemoryRepository {
  private records = new Map<string, MemoryRecord>();

  async getRecord(id: string, ownerId?: string): Promise<MemoryRecord | null> {
    const r = this.records.get(id);
    if (!r || r.isTombstoned) return null;
    // Strict Owner Scoping: unowned legacy records or records belonging to another owner are never returned
    if (ownerId !== undefined && r.ownerId !== ownerId) return null;
    return { ...r };
  }

  async searchRecords(
    query: string,
    options?: {
      category?: string;
      limit?: number;
      privacyClass?: MemoryPrivacyClass;
      lifecycleStatus?: MemoryLifecycleStatus;
      ownerId?: string;
    }
  ): Promise<MemoryRecord[]> {
    const q = (query || '').toLowerCase().trim();
    const terms = q.split(/\s+/).filter((w) => w.length > 3);
    const limit = options?.limit || 10;
    const results: MemoryRecord[] = [];

    for (const record of this.records.values()) {
      if (record.isTombstoned) continue;
      // Strict Owner Scoping: If ownerId is specified, the record MUST have matching ownerId.
      // Unowned legacy records or records belonging to another owner are never returned in an owner-scoped query.
      if (options?.ownerId !== undefined && record.ownerId !== options.ownerId) continue;
      if (options?.category && record.category !== options.category) continue;
      if (options?.privacyClass && record.privacyClass !== options.privacyClass) continue;
      if (options?.lifecycleStatus && record.lifecycleStatus !== options.lifecycleStatus) continue;

      const lowerContent = record.content.toLowerCase();
      const matches = !q || lowerContent.includes(q) || terms.some((term) => lowerContent.includes(term));

      if (matches) {
        results.push({ ...record });
      }
      if (results.length >= limit) break;
    }
    return results;
  }

  async storeRecord(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): Promise<MemoryRecord> {
    const now = Date.now();

    // Trust & Verification Invariant:
    // Only records with provenance proving authenticated owner creation can default to approved/verified.
    // Unknown, imported, or legacy records MUST default to QUARANTINED and unverified.
    const isOwnerProvenance = (record.source === 'owner' || record.source === 'owner_authenticated') &&
      record.sourceType === 'USER_INPUT' &&
      Boolean(record.ownerId);

    const userApproved = record.userApproved !== undefined
      ? record.userApproved
      : (isOwnerProvenance ? true : false);

    const verified = record.verified !== undefined
      ? record.verified
      : (isOwnerProvenance ? true : false);

    const lifecycleStatus = record.lifecycleStatus !== undefined
      ? record.lifecycleStatus
      : (userApproved && verified ? 'APPROVED' : 'QUARANTINED');

    const full: MemoryRecord = {
      ...record,
      ownerId: record.ownerId,
      privacyClass: record.privacyClass || 'OWNER_ONLY',
      lifecycleStatus,
      sourceType: record.sourceType || 'USER_INPUT',
      userApproved,
      verified,
      createdAt: now,
      updatedAt: now
    };
    this.records.set(record.id, full);
    return { ...full };
  }

  async updateRecord(id: string, updates: Partial<Omit<MemoryRecord, 'id' | 'createdAt'>>, ownerId?: string): Promise<MemoryRecord | null> {
    const existing = this.records.get(id);
    if (!existing || existing.isTombstoned) return null;
    if (ownerId !== undefined && existing.ownerId !== ownerId) return null;

    const updated: MemoryRecord = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    this.records.set(id, updated);
    return { ...updated };
  }

  async supersedeRecord(oldId: string, newRecord: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>, ownerId?: string): Promise<MemoryRecord> {
    const existing = this.records.get(oldId);
    if (!existing || existing.isTombstoned) {
      throw new Error(`Record ${oldId} not found`);
    }
    if (ownerId !== undefined && existing.ownerId !== ownerId) {
      throw new Error(`Access Denied: Record ${oldId} does not belong to owner ${ownerId}`);
    }
    await this.archiveRecord(oldId, `Superseded by memory ${newRecord.id || 'new'}`, ownerId);
    const stored = await this.storeRecord({
      ...newRecord,
      ownerId: ownerId || newRecord.ownerId,
      supersedesMemoryId: oldId
    });
    return stored;
  }

  async archiveRecord(id: string, reason?: string, ownerId?: string): Promise<boolean> {
    const existing = this.records.get(id);
    if (!existing) return false;
    if (ownerId !== undefined && existing.ownerId !== ownerId) return false;
    existing.lifecycleStatus = 'ARCHIVED';
    existing.metadata = { ...existing.metadata, archiveReason: reason, archivedAt: Date.now() };
    existing.updatedAt = Date.now();
    return true;
  }

  async tombstoneRecord(id: string, reason?: string, ownerId?: string): Promise<boolean> {
    const existing = this.records.get(id);
    if (!existing) return false;
    if (ownerId !== undefined && existing.ownerId !== ownerId) return false;
    existing.isTombstoned = true;
    existing.metadata = { ...existing.metadata, tombstoneReason: reason };
    existing.updatedAt = Date.now();
    return true;
  }

  async getHealthStatus(): Promise<{ connected: boolean; provider: string; recordCount: number }> {
    return {
      connected: true,
      provider: 'in-memory-local-dev',
      recordCount: this.records.size
    };
  }
}

export class SupabaseMemoryRepository implements IMemoryRepository {
  constructor(private client: SupabaseClient) {}

  async getRecord(id: string, ownerId?: string): Promise<MemoryRecord | null> {
    let builder = this.client
      .from('memories')
      .select('*')
      .eq('id', id)
      .eq('is_tombstoned', false);

    if (ownerId) {
      builder = builder.eq('owner_id', ownerId);
    }

    const { data, error } = await builder.single();

    if (error || !data) return null;
    return this.mapFromRow(data);
  }

  async searchRecords(
    query: string,
    options?: {
      category?: string;
      limit?: number;
      privacyClass?: MemoryPrivacyClass;
      lifecycleStatus?: MemoryLifecycleStatus;
      ownerId?: string;
    }
  ): Promise<MemoryRecord[]> {
    let builder = this.client
      .from('memories')
      .select('*')
      .eq('is_tombstoned', false)
      .limit(options?.limit || 10);

    if (options?.ownerId) {
      builder = builder.eq('owner_id', options.ownerId);
    }
    if (query) {
      builder = builder.ilike('content', `%${query}%`);
    }
    if (options?.category) {
      builder = builder.eq('category', options.category);
    }
    if (options?.privacyClass) {
      builder = builder.eq('privacy_class', options.privacyClass);
    }
    if (options?.lifecycleStatus) {
      builder = builder.eq('lifecycle_status', options.lifecycleStatus);
    }

    const { data, error } = await builder;
    if (error || !data) return [];
    return data.map((r) => this.mapFromRow(r));
  }

  async storeRecord(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): Promise<MemoryRecord> {
    const now = new Date().toISOString();

    // Trust & Verification Invariant:
    // Only records with provenance proving authenticated owner creation can default to approved/verified.
    // Unknown, imported, or legacy records MUST default to QUARANTINED and unverified.
    const isOwnerProvenance = (record.source === 'owner' || record.source === 'owner_authenticated') &&
      record.sourceType === 'USER_INPUT' &&
      Boolean(record.ownerId);

    const userApproved = record.userApproved !== undefined
      ? record.userApproved
      : (isOwnerProvenance ? true : false);

    const verified = record.verified !== undefined
      ? record.verified
      : (isOwnerProvenance ? true : false);

    const lifecycleStatus = record.lifecycleStatus !== undefined
      ? record.lifecycleStatus
      : (userApproved && verified ? 'APPROVED' : 'QUARANTINED');

    const { data, error } = await this.client
      .from('memories')
      .upsert({
        id: record.id,
        owner_id: record.ownerId || null,
        category: record.category,
        content: record.content,
        confidence: record.confidence,
        provenance: record.provenance,
        source: record.source,
        source_type: record.sourceType || 'USER_INPUT',
        user_approved: userApproved,
        verified: verified,
        privacy_class: record.privacyClass || 'OWNER_ONLY',
        lifecycle_status: lifecycleStatus,
        supersedes_memory_id: record.supersedesMemoryId || null,
        metadata: record.metadata || {},
        is_tombstoned: Boolean(record.isTombstoned),
        updated_at: now
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Supabase memory persistence error: ${error?.message}`);
    }
    return this.mapFromRow(data);
  }

  async updateRecord(id: string, updates: Partial<Omit<MemoryRecord, 'id' | 'createdAt'>>, ownerId?: string): Promise<MemoryRecord | null> {
    const now = new Date().toISOString();
    const payload: any = { updated_at: now };
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.confidence !== undefined) payload.confidence = updates.confidence;
    if (updates.provenance !== undefined) payload.provenance = updates.provenance;
    if (updates.lifecycleStatus !== undefined) payload.lifecycle_status = updates.lifecycleStatus;
    if (updates.userApproved !== undefined) payload.user_approved = updates.userApproved;
    if (updates.verified !== undefined) payload.verified = updates.verified;
    if (updates.privacyClass !== undefined) payload.privacy_class = updates.privacyClass;
    if (updates.metadata !== undefined) payload.metadata = updates.metadata;

    let builder = this.client
      .from('memories')
      .update(payload)
      .eq('id', id);

    if (ownerId) {
      builder = builder.eq('owner_id', ownerId);
    }

    const { data, error } = await builder.select().single();
    if (error || !data) return null;
    return this.mapFromRow(data);
  }

  async supersedeRecord(oldId: string, newRecord: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>, ownerId?: string): Promise<MemoryRecord> {
    await this.archiveRecord(oldId, `Superseded by memory ${newRecord.id || 'new'}`, ownerId);
    return this.storeRecord({
      ...newRecord,
      supersedesMemoryId: oldId
    });
  }

  async archiveRecord(id: string, reason?: string, ownerId?: string): Promise<boolean> {
    let builder = this.client
      .from('memories')
      .update({
        lifecycle_status: 'ARCHIVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (ownerId) {
      builder = builder.eq('owner_id', ownerId);
    }

    const { error } = await builder;
    return !error;
  }

  async tombstoneRecord(id: string, reason?: string, ownerId?: string): Promise<boolean> {
    let builder = this.client
      .from('memories')
      .update({
        is_tombstoned: true,
        metadata: { tombstoneReason: reason, tombstonedAt: new Date().toISOString() }
      })
      .eq('id', id);

    if (ownerId) {
      builder = builder.eq('owner_id', ownerId);
    }

    const { error } = await builder;
    return !error;
  }

  async getHealthStatus(): Promise<{ connected: boolean; provider: string; recordCount: number }> {
    const { count, error } = await this.client
      .from('memories')
      .select('*', { count: 'exact', head: true });

    return {
      connected: !error,
      provider: 'supabase-postgresql',
      recordCount: count || 0
    };
  }

  private mapFromRow(row: any): MemoryRecord {
    return {
      id: row.id,
      ownerId: row.owner_id,
      category: row.category,
      content: row.content,
      confidence: Number(row.confidence),
      provenance: row.provenance || '',
      source: row.source || 'system',
      sourceType: row.source_type || 'USER_INPUT',
      userApproved: Boolean(row.user_approved ?? true),
      verified: Boolean(row.verified ?? true),
      privacyClass: row.privacy_class || 'OWNER_ONLY',
      lifecycleStatus: row.lifecycle_status || 'APPROVED',
      supersedesMemoryId: row.supersedes_memory_id,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at || Date.now()).getTime(),
      updatedAt: new Date(row.updated_at || Date.now()).getTime(),
      isTombstoned: Boolean(row.is_tombstoned)
    };
  }
}
