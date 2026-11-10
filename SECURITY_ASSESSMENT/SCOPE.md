# Security Assessment Scope & Rules of Engagement

**Target Repository**: `adhy2312/portfolio`  
**Assessment Branch**: `security/red-team-assessment`  
**Base Commit (HEAD)**: `9a11003a3f834c6de0e56cdc72992650db377318`  
**Assessment Date**: 2026-11-10  
**Engagement Type**: Full-Scope White-Box Red Team Attack, Security Architecture Audit, and Remediation Verification  

---

## 1. Objectives & Boundaries

### In-Scope Systems
1. **Frontend Web Application (SPA)**:
   - React 19 + React Three Fiber 3D Arc-Reactor visualizer (`src/`).
   - Mini-Adhy conversational interface, HUD overlays, Live Mode (audio/vision).
   - Client-side state, local storage, session management.
2. **Serverless API Layer (Vercel Functions)**:
   - `api/auth.js`: Session creation, passcode authentication, token verification, rate limiting.
   - `api/agent-ecosystem.js`: Autonomous agent coordinator, weekly reports, email dispatch.
   - `api/gemini.js`, `api/groq.js`, `api/huggingface.js`, `api/omniroute.js`, `api/openrouter.js`, `api/spotify.js`: Provider endpoints.
3. **Backend Monolith Runtime (Fastify + TypeScript)**:
   - Fastify v4 server (`backend/src/`).
   - Public visitor endpoints (`/api/v1/public/*`).
   - Authenticated owner endpoints (`/api/v1/owner/*`).
   - Cognitive Orchestrator & Specialist Worker Registry (`JARVIS`, `FRIDAY`, `ULTRON`, etc.).
   - AI Provider Gateway & Streaming SSE endpoints.
   - Supabase Keep-Alive service and background health monitors.
4. **Database & Persistence Layer (Supabase PostgreSQL)**:
   - Versioned migrations (`backend/migrations/001_initial_schema.sql`, `002_domain_separation_schema.sql`).
   - Row-Level Security (RLS) policies, indexes, and connection security.
5. **Cognitive Core & Agent Governance (`src/core/`)**:
   - `ServerApprovalService.js`: Privileged execution authority & human-in-the-loop sign-off.
   - `CognitiveSyncEngine.js`: Cross-environment distributed synchronization.
   - `PortableIdentityManager.js`: Identity bundle import/export, quarantine lifecycle.
   - `ExecutionEngine.js`, `ResilientTaskManager.js`: Tool execution safety boundaries.
6. **CI/CD & Deployment Configurations**:
   - `.github/workflows/ci.yml`, `keepalive-render.yml`, `keepalive-supabase.yml`.
   - `render.yaml` Blueprint specification.
   - Sanity CMS Studio (`studio/`).

---

## 2. Rules of Engagement & Authorization Rules

- **Authorized Boundary**: Self-hosted testing and safe simulation within `adhy2312/portfolio`.
- **Prohibited Actions**:
  - No denial-of-service or volumetric stress attacks against production endpoints (`adhy.tech`, `supabase.co`).
  - No destruction or modification of live production data.
  - No real emails or SMS sent to external recipients during testing.
  - Zero leakage of real API credentials or tokens in test outputs or git commits.
- **Branching Policy**: All findings, exploits, and remediations are maintained strictly on branch `security/red-team-assessment`. No push to `main` without explicit owner approval.
