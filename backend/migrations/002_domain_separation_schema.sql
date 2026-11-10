-- ════════════════════════════════════════════════════════════════════
-- MINI-ADHY DATABASE MIGRATION: 002_domain_separation_schema.sql
-- ════════════════════════════════════════════════════════════════════
-- Establishes strict Public Visitor vs Authenticated Owner isolation,
-- conversation scoping, encrypted integration tokens, and granular RLS.

-- 1. Public Knowledge Table (Domain A - Visitor Accessible)
CREATE TABLE IF NOT EXISTS public.public_knowledge (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_knowledge_topic ON public.public_knowledge(topic);
CREATE INDEX IF NOT EXISTS idx_public_knowledge_published ON public.public_knowledge(is_published);

-- 2. Conversations Table (Domain A & B Scoped)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN ('PUBLIC', 'PRIVATE')),
  visitor_session_id TEXT, -- Scoped for public visitors
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Scoped for owner
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_domain ON public.conversations(domain);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON public.conversations(visitor_session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_id);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- 4. Cognitive Profile Table (Domain B - Owner Only)
CREATE TABLE IF NOT EXISTS public.cognitive_profile (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Autonomous Agent Tasks & Events (Domain B - Owner Only)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  risk_tier TEXT NOT NULL DEFAULT 'LOW_RISK' CHECK (risk_tier IN ('LOW_RISK', 'CONTROLLED', 'HIGH_IMPACT', 'PROHIBITED')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Approval Consumptions Table (Anti-Replay Invariant)
CREATE TABLE IF NOT EXISTS public.approval_consumptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  approval_id TEXT NOT NULL REFERENCES public.approval_requests(approval_id) ON DELETE CASCADE,
  consumed_by TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  consumed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Provider Usage & Quota Tracking Table
CREATE TABLE IF NOT EXISTS public.provider_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INT NOT NULL DEFAULT 0,
  cost_estimate NUMERIC(8, 4) DEFAULT 0.0000,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_usage_provider ON public.provider_usage(provider);

-- 8. Integration Connections (Domain B - Authenticated Owner Only)
-- Zero raw plaintext credentials or OAuth refresh tokens
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL CHECK (service_name IN ('github', 'gmail', 'calendar')),
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  scopes TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, service_name)
);

-- 9. Enable Row-Level Security (RLS) on all new tables
ALTER TABLE public.public_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies:

-- A. Public Knowledge: Anyone can read published knowledge; only service_role can modify
CREATE POLICY "Public read published knowledge" ON public.public_knowledge
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Service role full public knowledge access" ON public.public_knowledge
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- B. Conversations:
-- Owner can see own conversations
CREATE POLICY "Owner read own conversations" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Owner insert own conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner update own conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Backend service role has full access (for public visitor sessions managed server-side)
CREATE POLICY "Service role full conversations access" ON public.conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- C. Messages:
-- Authenticated users can read messages from their own conversations
CREATE POLICY "Owner read conversation messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role full messages access" ON public.messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- D. Cognitive Profile: Strictly owner only
CREATE POLICY "Owner read own cognitive profile" ON public.cognitive_profile
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Service role full cognitive profile access" ON public.cognitive_profile
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- E. Tasks & Task Events: Strictly owner only
CREATE POLICY "Owner read own tasks" ON public.tasks
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Service role full tasks access" ON public.tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Owner read own task events" ON public.task_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tasks t 
      WHERE t.id = task_events.task_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role full task events access" ON public.task_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- F. Integrations: Strictly owner only
CREATE POLICY "Owner read own integration metadata" ON public.integration_connections
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Service role full integration access" ON public.integration_connections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- G. Approval Consumptions: Service role only
CREATE POLICY "Service role approval consumptions access" ON public.approval_consumptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- H. Provider Usage: Service role only
CREATE POLICY "Service role provider usage access" ON public.provider_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);
