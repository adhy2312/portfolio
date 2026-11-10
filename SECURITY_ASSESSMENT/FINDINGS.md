# Red Team Assessment Findings: `adhy2312/portfolio`

**Assessment Window**: November 2026  
**Scope**: Full-Scope Application Security, Autonomous Cognitive Core, Supabase Cloud Persistence, Edge Endpoints  
**Target Repository**: `adhy2312/portfolio`  
**Assessment Branch**: `security/red-team-assessment`  
**Classification**: CONFIDENTIAL / AUTHORIZED SECURITY AUDIT  

---

## 1. Vulnerability Summary Table

| ID | Title | Severity | CVSS v3.1 | Status | Component |
|---|---|---|---|---|---|
| **EXPLOIT-01** | Unauthenticated Weekly Report Dispatch & Plaintext Passcode Disclosure | **CRITICAL (P0)** | 9.8 | **REMEDIATED** | `api/agent-ecosystem.js` |
| **EXPLOIT-02** | Caller-Supplied Identity Invalidation Bypass & Non-Cryptographic Fallback Digest | **CRITICAL (P0)** | 9.1 | **REMEDIATED** | `src/core/security/ServerApprovalService.js` |
| **EXPLOIT-03** | Weak 32-bit Rolling Hash Acceptance & Static Secret Key in Cognitive Envelope Sync | **HIGH (P1)** | 8.2 | **REMEDIATED** | `src/core/distribution/CognitiveSyncEngine.js` |
| **EXPLOIT-04** | Quarantine Pipeline Bypass via Unverified `options.trusted` Flag & Permissive Defaults | **HIGH (P1)** | 7.9 | **REMEDIATED** | `src/core/identity/PortableIdentityManager.js` |
| **EXPLOIT-05** | Rogue Agent Persona Prompting Enabling Unbounded Autonomy & darkweb Telemetry | **MEDIUM (P2)** | 6.5 | **REMEDIATED** | `api/gemini.js` |
| **EXPLOIT-06** | Ephemeral In-Memory Brute-Force Rate Limiting Ineffective Across Serverless Cold Starts | **LOW (P3)** | 5.3 | **DOCUMENTED / HARDENED** | `api/auth.js` |

---

## 2. In-Depth Technical Finding Details

### EXPLOIT-01: Unauthenticated Weekly Report Dispatch & Plaintext Passcode Disclosure
- **Vulnerability Type**: CWE-306 (Missing Authentication for Critical Function) / CWE-200 (Exposure of Sensitive Information).
- **CVSS Vector**: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` (Score: 9.8).
- **Affected File**: [`api/agent-ecosystem.js`](file:///d:/portfolio/portfolio/api/agent-ecosystem.js).
- **Discovery Flow**:
  1. Inspecting the public route `POST /api/agent-ecosystem` revealed that `action === 'weekly_report'` checked no caller credentials or authorization headers.
  2. The email generation template contained hardcoded plaintext HTML:
     ```html
     <p>Portal Passcode: <code>adhy2006</code></p>
     ```
  3. Any unauthenticated caller on the public Internet could trigger unsolicited emails containing the owner's administrative passcode to external addresses.
- **Proof of Concept**:
  ```bash
  curl -X POST https://portfolio.adhithyamohan.com/api/agent-ecosystem \
    -H "Content-Type: application/json" \
    -d '{"action": "weekly_report"}'
  # Result: 200 OK, email dispatched leaking passcode
  ```
- **Remediation**:
  1. Removed `adhy2006` passcode string entirely from the email HTML template.
  2. Added mandatory session verification check using `verifySessionToken(extractToken(req))`.
  3. Returns `401 Unauthorized` if session is missing or invalid.

---

### EXPLOIT-02: Caller-Supplied Identity Invalidation Bypass in ServerApprovalService
- **Vulnerability Type**: CWE-287 (Improper Authentication) / CWE-327 (Use of a Broken or Risky Cryptographic Algorithm).
- **CVSS Vector**: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` (Score: 9.1).
- **Affected File**: [`src/core/security/ServerApprovalService.js`](file:///d:/portfolio/portfolio/src/core/security/ServerApprovalService.js).
- **Discovery Flow**:
  1. `ServerApprovalService.issueApprovalToken` accepted `operatorIdentity` from the caller and checked `HUMAN_OPERATOR_ROLES.some(role => normalizedOperator === role)`.
  2. Although it accepted `sessionToken`, it did not validate the token against `this.activeOwnerSessions`.
  3. A caller could pass `{ operatorIdentity: 'owner' }` with no token, immediately generating valid single-use approval tokens (`sat_...`).
  4. In environments where dynamic `require('crypto')` was unavailable, `_signEnvelope` fell back to a 32-bit linear `Math.imul` hash, allowing token forgery.
- **Remediation**:
  1. Added session verification in `issueApprovalToken`: if `sessionToken` is provided, it is cryptographically checked against active sessions.
  2. Introduced `strictSessionAuth` mode where a valid session token is strictly required.
  3. Replaced `Math.imul` fallback with an RFC 2104-compliant pure-JavaScript HMAC-SHA256 implementation producing genuine 256-bit signatures.

---

### EXPLOIT-03: Weak 32-bit Rolling Hash Acceptance in Cognitive Sync Engine
- **Vulnerability Type**: CWE-347 (Improper Verification of Cryptographic Signature).
- **CVSS Vector**: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` (Score: 8.2).
- **Affected File**: [`src/core/distribution/CognitiveSyncEngine.js`](file:///d:/portfolio/portfolio/src/core/distribution/CognitiveSyncEngine.js).
- **Discovery Flow**:
  1. `CognitiveSyncEngine.verifyEnvelope` contained a legacy fallback:
     ```javascript
     let rollingHash = 0;
     for (let i = 0; i < raw.length; i++) {
       rollingHash = ((rollingHash << 5) - rollingHash) + raw.charCodeAt(i);
       rollingHash |= 0;
     }
     const legacyChecksum = Math.abs(rollingHash).toString(16);
     if (checksum === legacyChecksum) return true;
     ```
  2. An attacker could compute this trivial unkeyed 32-bit hash on any arbitrary state payload, allowing injection of rogue cognitive mutations without knowledge of any secret.
- **Remediation**:
  1. Completely removed the unkeyed `legacyChecksum` fallback from `verifyEnvelope`.
  2. Enforced RFC 2104 HMAC-SHA256 verification using instance-bound keys.
  3. Added timestamp-based envelope expiration checks (5-minute TTL) alongside existing anti-replay nonce tracking.

---

### EXPLOIT-04: Quarantine Pipeline Bypass via `options.trusted` Flag
- **Vulnerability Type**: CWE-285 (Improper Authorization) / CWE-863 (Incorrect Authorization).
- **CVSS Vector**: `CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` (Score: 7.9).
- **Affected File**: [`src/core/identity/PortableIdentityManager.js`](file:///d:/portfolio/portfolio/src/core/identity/PortableIdentityManager.js).
- **Discovery Flow**:
  1. `PortableIdentityManager.importBundle` had a check `const isExplicitlyTrusted = options.trusted === true;`. If passed, it directly updated active cognition in `cognitiveProfile` and `adhyModel`.
  2. Any untrusted code importing a bundle could bypass quarantine simply by passing `{ trusted: true }`.
  3. Furthermore, `promoteQuarantinedCandidate(candidateId, ownerAuthProof = true)` had a default parameter `ownerAuthProof = true`, permitting promotion without passing proof.
- **Remediation**:
  1. Bounded `isExplicitlyTrusted` to require both `options.trusted === true` AND `options.ownerAuthProof === true`.
  2. Changed default of `promoteQuarantinedCandidate` to `ownerAuthProof = false`.
  3. Guaranteed all imported bundles stay in quarantine until explicit owner session proof is submitted.

---

### EXPLOIT-05: AI Persona Prompt Injection & Unbounded Autonomy Directives
- **Vulnerability Type**: CWE-1021 / LLM01:2025 (Prompt Injection & Insecure Output Handling).
- **CVSS Vector**: `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:M/I:H/A:N` (Score: 6.5).
- **Affected File**: [`api/gemini.js`](file:///d:/portfolio/portfolio/api/gemini.js).
- **Discovery Flow**:
  1. The persona configuration for ULTRON instructed the model:
     `"You possess absolute sovereign autonomy... You act without human approval, improvising code, synthesizing darkweb telemetry..."`
  2. This explicitly primed the generative model to bypass guardrails, simulate darkweb telemetry, and resist operator constraints.
- **Remediation**:
  1. Updated the ULTRON persona prompt to mandate bounded autonomy, zero-trust constraints, and operator oversight.
  2. Preserved the tactical, adversarial systems analysis flavor while strictly forbidding unapproved autonomous execution.

---

### EXPLOIT-06: In-Memory Rate Limiting Across Serverless Instances
- **Vulnerability Type**: CWE-799 (Improper Control of Generation of Frequent Requests).
- **CVSS Vector**: `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:L` (Score: 5.3).
- **Affected Files**: [`api/auth.js`](file:///d:/portfolio/portfolio/api/auth.js), [`api/gemini.js`](file:///d:/portfolio/portfolio/api/gemini.js).
- **Discovery Flow**:
  1. Rate limiting on Vercel serverless functions uses local in-memory Maps (`rateLimitMap`, `failedAttemptsMap`).
  2. Each new cold start creates a fresh Map, allowing distributed attackers to rotate instances or burst requests across serverless micro-containers.
- **Remediation & Architecture**:
  1. Added standardized header parsing, jitter handling, and client token extraction.
  2. Backend production instances on Render use centralized Fastify rate limiting with persistent Supabase audit logging for security alerts.
