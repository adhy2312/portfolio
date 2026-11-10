import { SupabaseClient } from '@supabase/supabase-js';
import { IMemoryRepository, MemoryRecord } from './types.js';

export class InMemoryMemoryRepository implements IMemoryRepository {
  private records = new Map<string, MemoryRecord>();

  async getRecord(id: string): Promise<MemoryRecord | null> {
    const r = this.records.get(id);
    if (!r || r.isTombstoned) return null;
    return { ...r };
  }

  async searchRecords(query: string, options?: { category?: string; limit?: number }): Promise<MemoryRecord[]> {
    const q = query.toLowerCase();
    const limit = options?.limit || 10;
    const results: MemoryRecord[] = [];

    for (const record of this.records.values()) {
      if (record.isTombstoned) continue;
      if (options?.category && record.category !== options.category) continue;
      if (record.content.toLowerCase().includes(q)) {
        results.push({ ...record });
      }
      if (results.length >= limit) break;
    }
    return results;
  }

  async storeRecord(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): Promise<MemoryRecord> {
    const now = Date.now();
    const full: MemoryRecord = {
      ...record,
      createdAt: now,
      updatedAt: now
    };
    this.records.set(record.id, full);
    return full;
  }

  async tombstoneRecord(id: string, reason?: string): Promise<boolean> {
    const existing = this.records.get(id);
    if (!existing) return false;
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

  async getRecord(id: string): Promise<MemoryRecord | null> {
    const { data, error } = await this.client
      .from('memories')
      .select('*')
      .eq('id', id)
      .eq('is_tombstoned', false)
      .single();

    if (error || !data) return null;
    return this.mapFromRow(data);
  }

  async searchRecords(query: string, options?: { category?: string; limit?: number }): Promise<MemoryRecord[]> {
    let builder = this.client
      .from('memories')
      .select('*')
      .eq('is_tombstoned', false)
      .ilike('content', `%${query}%`)
      .limit(options?.limit || 10);

    if (options?.category) {
      builder = builder.eq('category', options.category);
    }

    const { data, error } = await builder;
    if (error || !data) return [];
    return data.map(this.mapFromRow);
  }

  async storeRecord(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): Promise<MemoryRecord> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('memories')
      .upsert({
        id: record.id,
        category: record.category,
        content: record.content,
        confidence: record.confidence,
        provenance: record.provenance,
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

  async tombstoneRecord(id: string, reason?: string): Promise<boolean> {
    const { error } = await this.client
      .from('memories')
      .update({
        is_tombstoned: true,
        metadata: { tombstoneReason: reason, tombstonedAt: new Date().toISOString() }
      })
      .eq('id', id);

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
      category: row.category,
      content: row.content,
      confidence: Number(row.confidence),
      provenance: row.provenance,
      metadata: row.metadata,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
      isTombstoned: Boolean(row.is_tombstoned)
    };
  }
}
