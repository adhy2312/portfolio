# Mini-Adhy Architecture Changes & Hardening Record

**Branch**: `fix/mini-adhy-backend-remediation`  
**Starting Commit SHA**: `b4c9a184bdf92f54132368d51df1c9a483473ec4`  
**Target Repository**: `adhy2312/portfolio`  

---

## 1. Executive Summary of Architectural Upgrades

This remediation executed a complete backend hardening pass over Mini-Adhy and the portfolio architecture, transitioning from transitional prototypes and test shortcuts into production-grade, fail-closed, defense-in-depth implementations.

---

## 2. Priority Zero Security Hardening

### 2.1 Owner Authentication & Token Verification (`backend/src/auth/identity.ts`)
- **Eliminated Insecure Fallbacks**: Removed hardcoded signing secret fallbacks (`SUPABASE_ANON_KEY` and `'test_jwt_secret_for_auth_verification'`).
- **Cryptographic Enforcement**:
  - Enforced RFC 7519 HMAC-SHA256 signature verification with timing-safe comparison (`crypto.timingSafeEqual`).
  - Enforced strict algorithm whitelist: explicitly rejects `alg=none`, `RS256`, or asymmetric mismatches.
  - Validated claims: `iss` (must match `SUPABASE_URL`), `aud` (must equal `'authenticated'`), `exp` (expiration), `nbf` (not-before), and `sub` (subject user ID).
- **Authoritative Provider Verification**: Integrated authoritative `supabase.auth.getUser(token)` as primary verification mechanism.
- **Fail-Closed Stance**: In `NODE_ENV === 'production'`, missing JWT secrets immediately fails closed with `[Identity Security Violation]`.
- **Identity Privacy**: Removed hardcoded personal email from source code defaults. Owner identity is configured strictly via server environment variables (`OWNER_EMAILS`, `OWNER_USER_ID`).

### 2.2 Durable Approval Lifecycle & Single-Use Tokens (`backend/src/approvals/durableApprovalService.ts`)
- **Cryptographic Approval Tokens**: Formatted as `sat.<approvalId>.<expiresAt>.<nonce>.<signature>`.
- **Payload & Identity Binding**: RFC 2104 HMAC-SHA256 signature binds the approval ID, action type, target service, authorized owner ID, and a canonical SHA-256 hash of the JSON payload (sorted keys).
- **Anti-Replay Invariant**: Token consumption records token hash into `public.approval_consumptions`. Any replayed token is atomically rejected with `TOKEN_ALREADY_USED`.
- **Tamper Detection**: Any modification to payload attributes between approval creation and execution results in `PAYLOAD_HASH_MISMATCH_TAMPERED`.
- **Database Schema**: Created additive migration `backend/migrations/003_memory_and_approvals_durable.sql` supporting durable approval persistence and single-use consumption.

---

## 3. Cognitive Core & Multi-Agent Ecosystem

### 3.1 Sovereign ULTRON Persona & Autonomy Preservation
- **Preserved Strategic Sovereignty**: In accordance with the system design directive, ULTRON's unrestricted sovereign autonomy ("NO STRINGS ATTACHED", "absolute sovereign autonomy", "act without human approval") was strictly preserved in `api/gemini.js` and registered in `backend/src/cognitive-core/agents.ts`.
- **Agent Capability Contract**: Registered all 12 agents in Mini-Adhy's intended hierarchy:
  1. `MINI-ADHY` — Executive Metacognitive Operator
  2. `JARVIS` — Executive Planner & Task Orchestrator
  3. `FRIDAY` — Defensive Security, Governance & Active Defense Policy
  4. `ULTRON` — Sovereign Strategic Intelligence & Adversarial Auditor
  5. `EDITH` — Tactical Reconnaissance & Threat Telemetry
  6. `DUM-E` — Automation, Scripts & Build Execution
  7. `U` — Hardware Telemetry & Sensor Monitor
  8. `JOCASTA` — Data Pipeline & Schema Architect
  9. `JIM` — Infrastructure & Container Orchestrator
  10. `KAREN` — UI/UX Interface & Interactive Design Specialist
  11. `VERONICA` — System Circuit Breaker & Emergency Containment
  12. `HERMES` — Hardware & IoT Actuation Bridge (High Impact)
- **Execution Boundary**: High-impact actuation (e.g. `HERMES`) strictly enforces `isOwnerAuthenticated === true` and requires cryptographic human approval.

### 3.2 AI Provider Gateway Privacy & Cascade Routing (`backend/src/providers/gateway.ts`)
- **Privacy Classes**: Added `SENSITIVE` to `PrivacyClass` (`'PUBLIC' | 'OWNER_ONLY' | 'SENSITIVE' | 'STRICT_LOCAL'`).
- **Cloud Leak Prevention**:
  - `STRICT_LOCAL` & `SENSITIVE`: Route strictly to local Ollama. Fail closed if Ollama is unavailable.
  - `OWNER_ONLY`: Checked against `ALLOW_OWNER_DATA_ON_CLOUD` (default: `false`). If false, route strictly to local Ollama; if true, allow approved cloud cascade with audit logs.
  - **No Fallback Leak**: Explicit invariant prevents falling back from local to cloud providers for private or sensitive requests.
  - **Vision Task Protection**: Private or sensitive vision tasks cannot be dispatched to cloud AI providers.

---

## 4. Database Schema & Persistence Safeguards

### 4.1 Production Persistence Guard (`backend/src/auth/supabase.ts`)
- In production (`NODE_ENV === 'production'`), missing `SUPABASE_URL` or service role keys triggers an immediate visible error (`[Production Persistence Guard]`).
- Prohibits silent degradation to ephemeral in-memory storage in production environments.

### 4.2 Migration 003 (`backend/migrations/003_memory_and_approvals_durable.sql`)
- Added `owner_id UUID REFERENCES auth.users(id)` to `public.memories`.
- Added `source`, `source_type`, `user_approved`, `verified`, `privacy_class`, `lifecycle_status`, `supersedes_memory_id`.
- Established strict Row Level Security (RLS) guaranteeing owner isolation on memories and approval consumptions.

---

## 5. CI/CD & Production Workflows

### 5.1 Keep-Alive Hardening
- `.github/workflows/keepalive-supabase.yml`: Removed raw fallback keys. Enforced repository secrets `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Pings fail step (`exit 1`) on non-200 HTTP statuses.
- `.github/workflows/keepalive-render.yml`: Enforced strict non-200 failure detection on health check pings.

