# Residual Risk Assessment & Hardening Roadmap: `adhy2312/portfolio`

**Date**: November 2026  
**Status**: ACTIVE MONITORING  

---

## 1. Residual Risk Inventory

| Risk Area | Severity | Current Mitigation | Future Hardening Recommendation |
|---|---|---|---|
| **Serverless Ephemeral Memory (Vercel)** | Low | IP-based sliding window rate limiter resets on container cold-starts. High-risk endpoints are guarded by secret auth. | Deploy Redis / Upstash KV store for globally distributed, synchronized rate-limiting across edge regions. |
| **Supabase Free Tier Compute Pause** | Low | Keepalive GitHub Actions workflows execute every 14 minutes against Render and Supabase databases. | Monitor keepalive job health; configure automated alerting via GitHub Actions failure webhook. |
| **Client-Side Secret Redaction** | Low | `deepSanitizeSecrets` strips sensitive keys and bearer patterns during export bundles. | Implement client-side Content Security Policy (CSP) headers restricting outbound network connections to approved hosts only. |
| **Browser Offline IndexedDB Persistence** | Informational | Local cognitive state persisted to localStorage / IndexedDB. | Offer optional WebCrypto-based local password-derived AES-GCM encryption for client-side offline storage. |

---

## 2. Production Deployment & Security Guardrails

1. **Zero Production Secrets in Git**:
   - Confirmed via Git history analysis: no live `SUPABASE_SECRET_KEY` or `GEMINI_API_KEY` exists in commits.
   - GitHub secret scanning and push protection remain active.
2. **Branch Isolation**:
   - All security assessment, proof-of-concept tests, and remediations are maintained on `security/red-team-assessment`.
   - Production (`main`) is untouched until explicit operator authorization.
3. **Defense in Depth**:
   - Edge endpoints enforce input validation, parameter sanitization, and session token checks.
   - Core cognitive layers enforce single-use tokens, cryptographic HMAC bindings, and quarantine isolation.

