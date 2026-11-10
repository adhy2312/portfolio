# Database Architecture & Row-Level Security (RLS)

## 1. PostgreSQL Schema Overview

The database persistence layer runs on Supabase PostgreSQL (Free Tier) with versioned migrations and Row-Level Security (RLS).

### Versioned Migrations
1. `backend/migrations/001_initial_schema.sql`:
   - `profiles`: User roles and metadata.
   - `memories`: Canonical memory records with confidence, provenance, and tombstone state.
   - `approval_requests`: Human-in-the-loop authorization tokens.
   - `audit_events`: Immutable security and operation audit trail.
2. `backend/migrations/002_domain_separation_schema.sql`:
   - `public_knowledge`: Published portfolio content accessible by visitors.
   - `conversations`: Scoped conversation metadata (`PUBLIC` with `visitor_session_id`, `PRIVATE` with `owner_id`).
   - `messages`: Scoped conversation turns.
   - `cognitive_profile`: Private owner cognitive settings.
   - `tasks` & `task_events`: Autonomous agent jobs under JARVIS orchestration.
   - `approval_consumptions`: Anti-replay single-use token consumption records.
   - `integration_credentials`: AES-256-GCM encrypted external OAuth tokens.

## 2. Row-Level Security (RLS) Policies

All tables have RLS enabled by default (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

| Table | Policy | Role / Context | Condition |
|---|---|---|---|
| `public_knowledge` | `Public Read Published Knowledge` | `anon`, `authenticated` | `is_published = true` |
| `conversations` (Public) | `Visitors Access Own Conversations` | `anon` | `visitor_session_id = current_setting('request.headers')::json->>'x-visitor-session-id'` |
| `conversations` (Private) | `Owners Access Own Conversations` | `authenticated` | `owner_id = auth.uid()` |
| `memories` | `Owner Access Only` | `authenticated` | `auth.uid() = owner_id` |
| `cognitive_profile` | `Owner Access Only` | `authenticated` | `auth.uid() = owner_id` |
| `tasks` | `Owner Access Only` | `authenticated` | `auth.uid() = owner_id` |
| `integration_credentials`| `Owner Access Only` | `authenticated` | `auth.uid() = owner_id` |

## 3. Database Indexes

- `idx_memories_category` ON `memories(category)`
- `idx_memories_tombstoned` ON `memories(is_tombstoned)`
- `idx_conversations_domain` ON `conversations(domain)`
- `idx_conversations_visitor` ON `conversations(visitor_session_id)`
- `idx_conversations_owner` ON `conversations(owner_id)`
- `idx_messages_conversation` ON `messages(conversation_id)`
- `idx_approval_token` ON `approval_requests(token)`

