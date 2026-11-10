-- ════════════════════════════════════════════════════════════════════
-- MINI-ADHY DATABASE MIGRATION: 001_initial_schema.sql
-- ════════════════════════════════════════════════════════════════════
-- Supabase PostgreSQL Free Tier Schema with Row-Level Security (RLS)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Owner & Operator Metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'visitor',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Canonical Memories Table
CREATE TABLE IF NOT EXISTS public.memories (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  provenance TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_tombstoned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_category ON public.memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_tombstoned ON public.memories(is_tombstoned);

-- 4. Server Approval Requests Table (P0.1 Human Authorization Boundary)
CREATE TABLE IF NOT EXISTS public.approval_requests (
  approval_id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  target_service TEXT NOT NULL DEFAULT 'core',
  owner_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_approval_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_token ON public.approval_requests(token);

-- 5. Immutable Audit Events Table
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  payload_hash TEXT,
  risk_tier TEXT NOT NULL DEFAULT 'LOW_RISK',
  status TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created ON public.audit_events(created_at);

-- 6. Enable Row-Level Security (RLS) on all tables (Fail-Closed)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Idempotent):
-- Profiles: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Memories: Service role (backend) has full access; visitors have ZERO direct access
DROP POLICY IF EXISTS "Service role full memory access" ON public.memories;
CREATE POLICY "Service role full memory access" ON public.memories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Approval Requests: Service role full access
DROP POLICY IF EXISTS "Service role approval access" ON public.approval_requests;
CREATE POLICY "Service role approval access" ON public.approval_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit Events: Service role can insert and read; nobody can update or delete (Immutable)
DROP POLICY IF EXISTS "Service role append audit" ON public.audit_events;
CREATE POLICY "Service role append audit" ON public.audit_events
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role read audit" ON public.audit_events;
CREATE POLICY "Service role read audit" ON public.audit_events
  FOR SELECT TO service_role USING (true);

