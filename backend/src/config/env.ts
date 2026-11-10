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
  SUPABASE_PUBLISHABLE_KEY: z.string().min(10).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  SUPABASE_SECRET_KEY: z.string().min(10).optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  SUPABASE_JWT_SECRET: z.string().min(16).optional(),
  SUPABASE_JWT_ISSUER: z.string().optional(),
  ALLOW_OFFLINE_JWT_VERIFICATION: z.coerce.boolean().default(false),
  DATABASE_URL: z.string().optional(),

  // Owner Authorization & Security (Server-controlled allowlist)
  OWNER_USER_ID: z.string().optional(),
  OWNER_EMAILS: z.string().optional(),
  ENCRYPTION_SECRET: z.string().min(16).optional(),
  APPROVAL_SIGNING_SECRET: z.string().min(32, 'APPROVAL_SIGNING_SECRET must be at least 32 characters').optional(),
  VISITOR_SESSION_SIGNING_SECRET: z.string().min(32, 'VISITOR_SESSION_SIGNING_SECRET must be at least 32 characters').optional(),
  VISITOR_SESSION_SIGNING_SECRET_PREVIOUS: z.string().min(32).optional(),
  ALLOW_TEST_AUTH: z.boolean().default(false),
  ALLOW_OWNER_DATA_ON_CLOUD: z.coerce.boolean().default(false),

  // Rate Limiting & Distributed Redis Cache
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RATE_LIMIT_FAIL_CLOSED: z.coerce.boolean().default(false),
  TRUSTED_PROXIES: z.string().default('127.0.0.1,::1,::ffff:127.0.0.1'),
  TRUST_PROXY: z.string().optional(),

  // AI Free Quota Keys (Optional - server will start gracefully without them)
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434')
});

export type AppConfig = z.infer<typeof EnvSchema> & {
  allowedOriginsList: string[];
  ownerEmailsList: string[];
  trustedProxiesList: string[];
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

  const ownerEmailsList = (parsed.data.OWNER_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const trustedProxiesList = (parsed.data.TRUSTED_PROXIES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const anonKey = parsed.data.SUPABASE_ANON_KEY || parsed.data.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = parsed.data.SUPABASE_SERVICE_ROLE_KEY || parsed.data.SUPABASE_SECRET_KEY;

  if (parsed.data.NODE_ENV === 'production' && !parsed.data.APPROVAL_SIGNING_SECRET) {
    throw new Error(
      '[Security Invariant Violation] In production mode, APPROVAL_SIGNING_SECRET is mandatory and must be at least 32 characters long. Silently generating random keys or reusing other secrets is strictly prohibited.'
    );
  }

  if (parsed.data.NODE_ENV === 'production' && !parsed.data.VISITOR_SESSION_SIGNING_SECRET) {
    throw new Error(
      '[Security Invariant Violation] In production mode, VISITOR_SESSION_SIGNING_SECRET is mandatory and must be at least 32 characters long. Hardcoding or generating fallback keys is strictly prohibited.'
    );
  }

  return {
    ...parsed.data,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    allowedOriginsList,
    ownerEmailsList,
    trustedProxiesList
  };
}

// Default export cached singleton
export const config = parseEnv();

