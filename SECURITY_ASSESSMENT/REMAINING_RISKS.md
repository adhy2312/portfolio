# Residual Risk Assessment & Operational Guidance: `adhy2312/portfolio`

**Date**: November 2026  
**Status**: ACTIVE MONITORING  
**Branch**: `fix/third-pass-execution-and-rpc-security`  
**Baseline Commit**: `7415927cb2f01cc07afdf6f96ab3bd302d71b3c6`  

---

## 1. Third-Pass Closed Risks

1. **RPC Privilege Escalation (Closed)**:
   - Previously, `consume_approval_atomic` had execute granted to `PUBLIC` by PostgreSQL default.
   - Now explicitly revoked from `PUBLIC`, `anon`, and `authenticated`. Granted solely to `service_role`.
   - Added `SET search_path = public, pg_temp;` to prevent search path hijacking.
   - Added caller identity checks preventing any spoofing of `p_owner_id`.

2. **Fabricated Execution Results (Closed)**:
   - Replaced placeholder simulation returns in `AgentToolExecutor` with `AgentToolAdapterRegistry`.
   - Implemented real adapters with cryptographic evidence digests, verification states, and timeouts.
   - Returns `UNAVAILABLE` if no adapter exists (never fabricates success).
   - Mandatory `DurableApprovalService` enforcement for `HIGH_IMPACT` tools.

3. **Visitor Session Ephemeral Revocation & Secret Exposure (Closed)**:
   - Dedicated `VISITOR_SESSION_SIGNING_SECRET` enforced in production.
   - Token expiry timestamps verified on every request.
   - Revocation stored durably in `public.revoked_visitor_sessions` across service restarts.
   - Session tokens hashed in storage (`sha256`) to avoid plaintext exposure.
   - Production mode fails closed without local Map fallback.

4. **JWT Issuer Validation Loopholes (Closed)**:
   - Replaced prefix comparison with exact string equality against expected issuer (`${SUPABASE_URL}/auth/v1` or `SUPABASE_JWT_ISSUER`).
   - Offline JWT verification in production strictly fails closed unless explicitly enabled via `ALLOW_OFFLINE_JWT_VERIFICATION === true`.

5. **Gemini Public Persona Privilege Abuse (Closed)**:
   - Public requests requesting internal agents (`ULTRON`, `JARVIS`, `FRIDAY`) receive `403 Forbidden`.
   - Only verified owner sessions can invoke internal agents.
   - Distributed rate-limiting via Upstash Redis REST with constrained local fallback emitting explanatory headers.

---

## 2. Residual Risk Register

| Risk Area | Severity | Current Mitigation | Future Hardening Recommendation |
|---|---|---|---|
| **Upstash Redis Configuration** | Low | Constrained process-local sliding window rate limiting is active with rate limit response headers. | Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production environment for global multi-region edge synchronization. |
| **Supabase Free Tier Compute Pause** | Low | GitHub Actions keepalive cron workflows execute every 14 minutes against Render and Supabase REST endpoints. | Verify `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` secrets exist in GitHub repository settings. |
| **Hardware Actuation Sandbox** | Low | `HERMES` hardware tools (`gpio_pulse`, `uart_write`) require verified single-use approval tokens and execute within bounded adapters. | When deploying to physical Raspberry Pi / STM32 hardware, enforce OS-level udev permissions and hardware watchdog timers. |

---

## 3. Strict Non-Merge Policy
- The branch `fix/third-pass-execution-and-rpc-security` contains all third-pass fixes and verified tests.
- Do not merge to `main` or deploy without explicit operator authorization.
