import { SupabaseAdapter } from '../auth/supabase.js';

export class SupabaseKeepAliveService {
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;

  constructor(
    private dbAdapter: SupabaseAdapter,
    intervalMinutes: number = 14
  ) {
    this.intervalMs = intervalMinutes * 60 * 1000;
  }

  public start(logger?: { info: (msg: string) => void; error: (msg: string, err?: any) => void }) {
    if (this.timer) return;

    logger?.info(`[SupabaseKeepAlive] Starting automated heartbeat every 14 minutes.`);

    this.timer = setInterval(async () => {
      try {
        const client = this.dbAdapter.getClient();
        if (client) {
          // Lightweight pulse query to keep Supabase PostgreSQL connection pool alive
          await client.from('memories').select('id').limit(1);
          logger?.info(`[SupabaseKeepAlive] Heartbeat pulse succeeded. Database connection refreshed.`);
        }
      } catch (err: any) {
        logger?.error(`[SupabaseKeepAlive] Heartbeat probe encountered notice:`, err?.message);
      }
    }, this.intervalMs);

    // Prevent keep-alive timer from blocking clean process exit
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
