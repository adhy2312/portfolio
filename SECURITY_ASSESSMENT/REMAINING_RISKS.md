# Residual Risk Assessment & Operational Guidance: `adhy2312/portfolio`

**Date**: November 2026  
**Status**: ACTIVE MONITORING  
**Branch**: `fix/mini-adhy-backend-remediation`  

---

## 1. Operational Observations: Supabase & Render Deployment

### Supabase "No repository connected" Status
- **Finding**: In the Supabase dashboard (`https://yabtzlmxkjkmuklvwsdo.supabase.co`), the repository status reports `No repository connected`.
- **Operational Reality**: Connecting a GitHub repository to Supabase is an **optional convenience feature** designed specifically for Supabase Branching (preview databases created per pull request).
- **Production Impact**: **Zero negative impact on functionality**. The backend connects via standard PostgreSQL protocols (`DATABASE_URL`) or Supabase HTTPS REST / PostgREST (`SUPABASE_URL` + keys). Database tables, Row-Level Security (RLS) policies, and queries operate directly on the primary database without requiring a connected GitHub repo.
- **Action**: You can leave it unconnected, or connect it at any time via the Supabase dashboard if you wish to use branch preview databases.

### Supabase & Render Keep-Alive Automation
- **Status**: Configured via GitHub Actions cron workflows (`.github/workflows/keepalive-supabase.yml` and `keepalive-render.yml`) running every 14 minutes (`*/14 * * * *`).
- **Hardening Applied**: Removed raw fallback credentials from workflow files. Workflows pull credentials from GitHub Actions secrets (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `RENDER_BACKEND_URL`) and fail with explicit error codes if the target returns non-200.
- **Activation Note**: Scheduled GitHub Actions only fire once the workflow files reside on the default branch (`main`).

---

## 2. Residual Risk Inventory

| Risk Area | Severity | Current Mitigation | Future Hardening Recommendation |
|---|---|---|---|
| **Serverless Ephemeral Memory (Vercel)** | Low | IP-based sliding window rate limiter resets on container cold-starts. High-risk endpoints are guarded by secret auth. | Deploy Redis / Upstash KV store for globally distributed, synchronized rate-limiting across edge regions. |
| **Supabase Free Tier Compute Pause** | Low | Keepalive GitHub Actions workflows execute every 14 minutes against Render and Supabase databases. | Ensure repository secrets (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) are set in GitHub repository settings. |
| **Client-Side Secret Redaction** | Low | `redactSensitiveObject` and `deepSanitizeSecrets` strip sensitive keys and bearer patterns. | Implement client-side Content Security Policy (CSP) headers restricting outbound network connections. |
| **Browser Offline IndexedDB Persistence** | Informational | Local cognitive state persisted to localStorage / IndexedDB. | Offer optional WebCrypto-based local password-derived AES-GCM encryption for client-side offline storage. |

---

## 3. Production Deployment & Security Guardrails

1. **Zero Production Secrets in Git**:
   - Confirmed via Git inspection: no live `SUPABASE_SECRET_KEY` or `GEMINI_API_KEY` exists in commits.
   - GitHub secret scanning and push protection remain active.
2. **Branch Isolation**:
   - All engineering remediations are committed locally to `fix/mini-adhy-backend-remediation`.
   - Never push to `main` without explicit operator authorization.
3. **Defense in Depth**:
   - Edge endpoints enforce input validation, parameter sanitization, and session token checks.
   - Core cognitive layers enforce single-use tokens, cryptographic HMAC bindings, and quarantine isolation.
