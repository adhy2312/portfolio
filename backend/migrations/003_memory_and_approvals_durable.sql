-- ════════════════════════════════════════════════════════════════════
-- MINI-ADHY DATABASE MIGRATION: 003_memory_and_approvals_durable.sql
-- ════════════════════════════════════════════════════════════════════
-- Completes schema alignment for Memory Lifecycle and Durable Approvals:
-- 1. Adds missing columns to public.memories (owner_id, source, source_type,
--    user_approved, verified, privacy_class, lifecycle_status, supersedes_memory_id).
-- 2. Adds missing columns to public.approval_requests (requesting_agent, payload, nonce).
-- 3. Implements strict owner-isolated Row-Level Security (RLS) on memories.
-- 4. Creates composite indexes for high-performance owner memory querying.

-- 1. Upgrade public.memories table schema
ALTER TABLE public.memories 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'USER_INPUT',
  ADD COLUMN IF NOT EXISTS user_approved BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS privacy_class TEXT DEFAULT 'OWNER_ONLY',
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS supersedes_memory_id TEXT;

-- 2. Create performance & search indexes on memories
CREATE INDEX IF NOT EXISTS idx_memories_owner_id ON public.memories(owner_id);
CREATE INDEX IF NOT EXISTS idx_memories_privacy_class ON public.memories(privacy_class);
CREATE INDEX IF NOT EXISTS idx_memories_lifecycle_status ON public.memories(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_memories_superseded ON public.memories(supersedes_memory_id);
CREATE INDEX IF NOT EXISTS idx_memories_owner_category ON public.memories(owner_id, category);

-- 3. Upgrade public.approval_requests table schema
ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS requesting_agent TEXT DEFAULT 'JARVIS',
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nonce TEXT;

CREATE INDEX IF NOT EXISTS idx_approval_owner ON public.approval_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_approval_nonce ON public.approval_requests(nonce);

-- 4. Update Row-Level Security (RLS) Policies on memories for strict owner isolation

-- Authenticated owner can SELECT only their own memories
CREATE POLICY "Owner read own memories" ON public.memories
  FOR SELECT TO authenticated 
  USING (auth.uid() = owner_id);

-- Authenticated owner can INSERT only with their own owner_id
CREATE POLICY "Owner insert own memories" ON public.memories
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = owner_id);

-- Authenticated owner can UPDATE only their own memories
CREATE POLICY "Owner update own memories" ON public.memories
  FOR UPDATE TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Authenticated owner can DELETE (or tombstone) only their own memories
CREATE POLICY "Owner delete own memories" ON public.memories
  FOR DELETE TO authenticated 
  USING (auth.uid() = owner_id);

-- Public / Anonymous users have ZERO access to memories (RLS default deny)
-- Note: Service role retains trusted backend access via existing policy in 001_initial_schema.sql

