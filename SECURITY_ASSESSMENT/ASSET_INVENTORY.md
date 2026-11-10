# Asset Inventory & Component Mapping

## 1. Codebase Assets

| Asset Name | Tech Stack | Location | Role / Boundary |
|---|---|---|---|
| **Portfolio Frontend** | React 19, R3F, Framer Motion | `src/` | Public SPA deployed to Vercel (`adhy.tech`). Runs in visitor browser. |
| **Mini-Adhy Core** | JavaScript ES Modules | `src/core/` | In-browser cognitive engines (AdhyModel, MemoryService, Specialist Agents). |
| **Backend Monolith** | Fastify 4, TypeScript, Zod | `backend/src/` | Headless API service deployed to Render (`port 3001` / `10000`). Handles auth, DB, LLM gateway. |
| **Serverless Endpoints** | Node.js Serverless Functions | `api/` | Legacy & proxy endpoints hosted on Vercel Edge (`/api/*`). |
| **Sanity CMS Studio** | Sanity v5, React 19 | `studio/` | CMS Studio for portfolio project and experience content. |
| **Supabase PostgreSQL** | PostgreSQL 15 (Supabase) | Cloud (Seoul `ap-northeast-2`) | Persistent relational database with RLS. |
| **CI/CD Pipelines** | GitHub Actions | `.github/workflows/` | Production CI, test suites, Render & Supabase keep-alive crons. |

---

## 2. Environment Secrets & External Interfaces

| Secret / Config Key | Used By | Sensitivity | Exposure Risk |
|---|---|---|---|
| `SUPABASE_SECRET_KEY` | Backend, Supabase Client | **CRITICAL** | Bypasses all RLS if leaked. Server-side only. |
| `SUPABASE_PUBLISHABLE_KEY` | Backend, KeepAlive, Client | **MEDIUM** | Publicly safe if RLS is strictly enforced. |
| `SUPABASE_URL` | Backend, KeepAlive | **LOW** | Project endpoint URL. |
| `SESSION_SECRET` | Backend, Serverless Auth | **CRITICAL** | Used for HMAC signing of session tokens. |
| `ENCRYPTION_SECRET` | Backend (`TokenCipher`) | **CRITICAL** | Master AES-256-GCM key for third-party token encryption. |
| `GEMINI_API_KEY` | Backend Provider Gateway | **HIGH** | Google AI inference access. |
| `GROQ_API_KEY` | Backend Provider Gateway | **HIGH** | Groq LPU inference access. |
| `HF_TOKEN` | Backend Provider Gateway | **HIGH** | Hugging Face Router access. |
| `OPENROUTER_API_KEY` | Backend Provider Gateway | **HIGH** | OpenRouter inference access. |
| `RESEND_API_KEY` | `api/agent-ecosystem.js` | **HIGH** | External email dispatch service. |
| `SANITY_API_TOKEN` | Build / CMS scripts | **HIGH** | Sanity dataset write token. |
| `SPOTIFY_*` | `api/spotify.js` | **MEDIUM** | Spotify music playback widget. |
| `ADMIN_PASSCODE` / `AGENT_PORTAL_PASSCODE` | `api/auth.js` | **HIGH** | Passcodes for `/agentp` command portal. |

---

## 3. Data Classification

- **PUBLIC**: Portfolio projects, skills, biography, published knowledge, public visitor messages.
- **RESTRICTED (OWNER ONLY)**: Private memory records, personal preferences, owner conversation history, approval requests, task queues, connected integration metadata.
- **CLASSIFIED (CONFIDENTIAL)**: OAuth tokens, API secrets, session signing keys, database passwords, master encryption keys.
- **STRICT_LOCAL**: Highly sensitive owner notes, local computer commands, hardware actuation, private identity dimensions (never permitted to reach cloud providers).

