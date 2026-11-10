-- ════════════════════════════════════════════════════════════════════
-- MINI-ADHY DATABASE MIGRATION: 003_memory_and_approvals_durable.sql
-- ════════════════════════════════════════════════════════════════════
-- Completes schema alignment for Memory Lifecycle and Durable Approvals:
-- 1. Adds missing columns to public.memories (owner_id, source, source_type,
--    user_approved, verified, privacy_class, lifecycle_status, supersedes_memory_id).
-- 2. Adds missing columns to public.approval_requests (requesting_agent, payload, nonce).
-- 3. Implements strict owner-isolated Row-Level Security (RLS) on memories.
-- 4. Creates composite indexes for high-performance owner memory querying.

-- 1. Upgrade public.memories table schema with safe defaults (Fail-Closed)
ALTER TABLE public.memories 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'EXTERNAL_IMPORT',
  ADD COLUMN IF NOT EXISTS user_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS privacy_class TEXT DEFAULT 'OWNER_ONLY',
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'QUARANTINED',
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

-- 4. Update Row-Level Security (RLS) Policies on memories for strict owner isolation (Idempotent)

DROP POLICY IF EXISTS "Owner read own memories" ON public.memories;
CREATE POLICY "Owner read own memories" ON public.memories
  FOR SELECT TO authenticated 
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner insert own memories" ON public.memories;
CREATE POLICY "Owner insert own memories" ON public.memories
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner update own memories" ON public.memories;
CREATE POLICY "Owner update own memories" ON public.memories
  FOR UPDATE TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner delete own memories" ON public.memories;
CREATE POLICY "Owner delete own memories" ON public.memories
  FOR DELETE TO authenticated 
  USING (auth.uid() = owner_id);

-- 5. Safe Backfill for Existing / Legacy Memories:
-- Only records with verified owner provenance (source in 'owner', 'owner_authenticated' AND source_type = 'USER_INPUT' AND owner_id IS NOT NULL) are retained as APPROVED.
-- All unknown, imported, unowned, or legacy records MUST be set to QUARANTINED and unverified.
UPDATE public.memories
SET
  user_approved = FALSE,
  verified = FALSE,
  lifecycle_status = 'QUARANTINED'
WHERE owner_id IS NULL
   OR source NOT IN ('owner', 'owner_authenticated')
   OR source_type <> 'USER_INPUT';

-- Retain verified owner-created memories with explicit provenance
UPDATE public.memories
SET
  user_approved = TRUE,
  verified = TRUE,
  lifecycle_status = 'APPROVED'
WHERE owner_id IS NOT NULL
  AND source IN ('owner', 'owner_authenticated')
  AND source_type = 'USER_INPUT';

-- Public / Anonymous users have ZERO access to memories (RLS default deny)
-- Note: Service role retains trusted backend access via existing policy in 001_initial_schema.sql

