export interface MemoryRecord {
  id: string;
  category: string;
  content: string;
  confidence: number;
  provenance: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  isTombstoned?: boolean;
}

export interface IMemoryRepository {
  getRecord(id: string): Promise<MemoryRecord | null>;
  searchRecords(query: string, options?: { category?: string; limit?: number }): Promise<MemoryRecord[]>;
  storeRecord(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): Promise<MemoryRecord>;
  tombstoneRecord(id: string, reason?: string): Promise<boolean>;
  getHealthStatus(): Promise<{ connected: boolean; provider: string; recordCount: number }>;
}

export interface IDatabaseAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  getMemoryRepository(): IMemoryRepository;
}
