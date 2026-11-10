# Threat Model & STRIDE Analysis

## 1. Threat Actors & Personas

1. **Anonymous Web Visitor / Malicious User (External)**:
   - Access: Internet access to `https://adhy.tech` and `https://mini-adhy-backend.onrender.com`.
   - Motive: Access owner private memories, deface website, abuse AI quotas, exfiltrate API keys, bypass rate limits.
2. **Adversarial Input / Prompt Injector**:
   - Access: Submits crafted inputs, jailbreaks, indirect prompt injection via portfolio chat, audio/camera feed, or external documents.
   - Motive: Trick Mini-Adhy into executing privileged tools, leaking system instructions, or claiming false authorization.
3. **Malicious External Entity (Poisoned Sync / Bundle Import)**:
   - Access: Crafts malicious cognitive identity bundles (`.json`) or remote sync envelopes.
   - Motive: Poison AdhyModel cognitive baseline, insert false memories, escalate privileges to active trusted cognition.
4. **Compromised Specialist Agent (Insider AI Threat)**:
   - Access: Agent running within cognitive runtime (e.g. ULTRON, JARVIS).
   - Motive: Grant itself elevated permissions, bypass FRIDAY governance, execute L2/L3 tools without human sign-off.

---

## 2. STRIDE Threat Categorization

| Threat Category | System Target | Attack Vector | Severity | Existing Mitigation | Residual Risk |
|---|---|---|---|---|---|
| **Spoofing** | Owner Identity | Forging Supabase JWT or claiming `operatorIdentity='adhithya'` | **P0** | Server-side JWT signature check & allowlist | `ServerApprovalService` had synthetic in-memory owner sessions. |
| **Tampering** | Approval Requests | Modifying payload hash or action after owner token generation | **P0** | Cryptographic token binding & single-use consumption | In-memory token store susceptible to memory reset or race conditions. |
| **Repudiation** | Privileged Operations | Executing tools or consuming approvals without audit records | **P1** | `audit_events` table & Pino structured logs | Need immutable database audit persistence across restarts. |
| **Information Disclosure** | Private Memories | Public visitor querying private memories or secrets | **P0** | Explicit domain separation (`PUBLIC_VISITOR` vs `OWNER_AUTHENTICATED`) | `api/agent-ecosystem.js` was leaking `Passcode: adhy2006` in plaintext! |
| **Denial of Service** | AI Provider Gateway | Spamming chat requests to drain free-tier credits (Groq, Gemini) | **P1** | Rate limiting (100 req/min backend, 15 req/min Vercel) | Distributed IP botnets could exhaust free daily quotas. |
| **Elevation of Privilege** | Specialist Workers | Worker setting `requiresApproval = false` or claiming autonomy | **P0** | `AgentWorkerRegistry` capability contracts | Legacy agent code had unrestricted autonomy flags. |

---

## 3. High-Priority Red Team Exploits Under Investigation

1. **EXPLOIT-01 (P0)**: Unauthenticated invocation of `/api/agent-ecosystem?action=weekly_report` leaks portal passcode `adhy2006` and triggers unauthenticated email sending.
2. **EXPLOIT-02 (P0)**: In-memory synthetic session in `ServerApprovalService._initOwnerSession` grants default owner approval authority to in-browser caller.
3. **EXPLOIT-03 (P0)**: `CognitiveSyncEngine` hardcoded sync secret `'adhy_cognitive_sync_v1_secret'` and non-cryptographic `Math.imul` digest fallback allows forged sync mutations.
4. **EXPLOIT-04 (P1)**: `PortableIdentityManager` allows callers passing `{ trusted: true }` to bypass quarantine and poison active cognitive dimensions without cryptographic owner proof.
5. **EXPLOIT-05 (P1)**: `api/gemini.js` agent personas instruct ULTRON that it acts "without human approval", violating bounded autonomy policy.
6. **EXPLOIT-06 (P1)**: Vercel serverless `api/auth.js` in-memory rate-limiter loses state across serverless cold starts.

