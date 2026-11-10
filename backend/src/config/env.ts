import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config();
// Also attempt loading root .env if in dev
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3001),
  HOST: z.string().default('127.0.0.1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000,https://adhy.tech'),

  // Supabase (Server-side Only)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(10).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  DATABASE_URL: z.string().optional(),

  // AI Free Quota Keys (Optional - server will start gracefully without them)
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434')
});

export type AppConfig = z.infer<typeof EnvSchema> & {
  allowedOriginsList: string[];
};

export function parseEnv(customEnv?: Record<string, unknown>): AppConfig {
  const source = customEnv || process.env;
  const parsed = EnvSchema.safeParse(source);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[Configuration Error] Invalid environment variables:\n${errorDetails}`);
  }

  const allowedOriginsList = parsed.data.ALLOWED_ORIGINS
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    ...parsed.data,
    allowedOriginsList
  };
}

// Default export cached singleton
export const config = parseEnv();
