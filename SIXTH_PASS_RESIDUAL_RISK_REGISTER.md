# MINI-ADHY — SIXTH-PASS RESIDUAL RISK REGISTER

**Document Version:** 6.0.0  
**Audit Baseline:** `f7c526e71bd76611aa146b6c607e539bf0e283d8`  
**Date:** 2026-11-10  
**Auditor Classification:** Red-Team Architecture & Security Remediation  

---

## 1. Residual Risk Matrix

| Risk ID | Title | Inherent Severity | Residual Severity | Mitigation In Place | Operational Requirement |
|---|---|---|---|---|---|
| **RR-01** | Physical Microcontroller Firmware Bug or Lockup | HIGH | LOW | Bounded timeout guards on serial/IPC transport; explicit failsafe safe-state check; watchdog ping in firmware. | Deploy hardware devices with hardware watchdog timer enabled. |
| **RR-02** | Distributed Multi-Instance Revocation Staleness | MEDIUM | VERY LOW | In-memory negative revocation caching capped at 60s; authoritative PostgreSQL lookup on access; fail-closed on outage. | Ensure PostgreSQL connection pool has low latency and sufficient replica capacity. |
| **RR-03** | Upstream Reverse Proxy Header Forgery | HIGH | LOW | Connecting socket IP strictly validated against `TRUSTED_PROXIES` allowlist; header parsing disabled if untrusted. | Configure `TRUSTED_PROXIES` in production environment to match actual Cloudflare/load balancer CIDR ranges. |
| **RR-04** | Redis Outage Impact on API Ingestion | MEDIUM | LOW | Configurable fail-closed policy (`RATE_LIMIT_FAIL_CLOSED=true`); local in-memory sliding-window backup with memory caps. | Monitor Upstash/Redis health; set appropriate alerts for fail-closed triggers. |
| **RR-05** | Offline Development JWT Verification Fallback | HIGH | VERY LOW | Offline JWT verification strictly fails closed in `NODE_ENV=production` unless `ALLOW_OFFLINE_JWT_VERIFICATION=true`. | Never set `ALLOW_OFFLINE_JWT_VERIFICATION=true` in production deployments. |
| **RR-06** | Database Migration Privilege Escalation | HIGH | VERY LOW | `consume_approval_atomic` revokes EXECUTE from PUBLIC, anon, and authenticated roles; restricted to `service_role`. | Apply migration 004 using Supabase dashboard SQL editor or migration runner with admin privileges. |

---

## 2. Risk Acceptance & Operator Attestation

1. **Physical Microcontroller Absence**: In environments without a physically wired USB microcontroller or COM port, physical actuation tools (`gpio_pulse`, `uart_write`) truthfully report `UNAVAILABLE`. This is intentional and desirable; physical actuation cannot be simulated in production.
2. **ULTRON Strategic Autonomy**: ULTRON's independence, dissent, and ability to execute unprompted red-team audits are deliberate operator requirements and are not classified as vulnerabilities.
3. **Fail-Closed Design**: Any failure in cryptographic verification, database connectivity, or hardware communication results in safe denial rather than degraded privilege or simulated success.
