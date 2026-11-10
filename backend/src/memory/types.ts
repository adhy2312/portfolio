export type MemorySourceType = 'USER_INPUT' | 'MODEL_INFERENCE' | 'EXTERNAL_IMPORT' | 'CODEBASE' | 'SENSOR';
export type MemoryPrivacyClass = 'PUBLIC' | 'OWNER_ONLY' | 'SENSITIVE' | 'STRICT_LOCAL';
export type MemoryLifecycleStatus = 'IMPORTED' | 'QUARANTINED' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface MemoryRecord {
  id: string;
  ownerId?: string;
  category: string;
  content: string;
  provenance: string;
  source: string;
  sourceType: MemorySourceType;
  confidence: number;
  userApproved: boolean;
  verified: boolean;
  privacyClass: MemoryPrivacyClass;
  lifecycleStatus: MemoryLifecycleStatus;
  supersedesMemoryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  isTombstoned?: boolean;
}

export interface IMemoryRepository {
  getRecord(id: string, ownerId?: string): Promise<MemoryRecord | null>;
  searchRecords(
    query: string,
    options?: {
      category?: string;
      limit?: number;
      privacyClass?: MemoryPrivacyClass;
      lifecycleStatus?: MemoryLifecycleStatus;
      ownerId?: string;
    }
  ): Promise<MemoryRecord[]>;
  storeRecord(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): Promise<MemoryRecord>;
  updateRecord(id: string, updates: Partial<Omit<MemoryRecord, 'id' | 'createdAt'>>, ownerId?: string): Promise<MemoryRecord | null>;
  supersedeRecord(oldId: string, newRecord: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>, ownerId?: string): Promise<MemoryRecord>;
  archiveRecord(id: string, reason?: string, ownerId?: string): Promise<boolean>;
  tombstoneRecord(id: string, reason?: string, ownerId?: string): Promise<boolean>;
  getHealthStatus(): Promise<{ connected: boolean; provider: string; recordCount: number }>;
}

export interface IDatabaseAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  getMemoryRepository(): IMemoryRepository;
}
