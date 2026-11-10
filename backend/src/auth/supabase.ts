import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../config/env.js';
import { IDatabaseAdapter, IMemoryRepository } from '../memory/types.js';
import { InMemoryMemoryRepository, SupabaseMemoryRepository } from '../memory/repository.js';

export class SupabaseAdapter implements IDatabaseAdapter {
  public readonly name = 'SupabasePostgreSQL';
  private client: SupabaseClient | null = null;
  private memoryRepo: IMemoryRepository;

  constructor(private config: AppConfig) {
    if (config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)) {
      // Use service-role key for backend operations if present, otherwise anon key
      const key = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY!;
      this.client = createClient(config.SUPABASE_URL, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      this.memoryRepo = new SupabaseMemoryRepository(this.client);
    } else if (config.NODE_ENV === 'production') {
      // Strict Invariant: Production must NEVER silently fall back to ephemeral in-memory storage
      throw new Error(
        '[Production Persistence Guard] In production mode, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) are mandatory. Volatile in-memory storage is prohibited in production.'
      );
    } else {
      // Explicit fallback to in-memory repository strictly for offline/local test/dev
      this.client = null;
      this.memoryRepo = new InMemoryMemoryRepository();
    }
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const { error } = await this.client.from('memories').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public getMemoryRepository(): IMemoryRepository {
    return this.memoryRepo;
  }
}

