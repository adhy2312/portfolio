# Mini-Adhy Test Evidence & Verification Logs

**Date**: November 2026  
**Active Branch**: `fix/second-pass-security-closure`  
**Target Repository**: `adhy2312/portfolio`  

---

## 1. Backend Automated Verification Suite

Run command: `npm --prefix backend test`

```tap
TAP version 13
# Subtest: PROMPT 2 — Access Separation & Owner Identity Boundary
    ok 1 - Public visitor can read approved portfolio knowledge
    ok 2 - Public visitor can create conversation session and read own history
    ok 3 - Public visitor B is DENIED (403) when trying to access Visitor A conversation
    ok 4 - Unauthenticated public visitor is strictly DENIED (401) on owner routes
    ok 5 - Caller attempting to pass role=owner or isOwner=true in body without valid JWT is rejected (401)
    ok 6 - Attacker with forged/tampered JWT signature is strictly DENIED (401)
    ok 7 - Attacker with expired JWT is strictly DENIED (401)
    ok 8 - Authenticated non-owner user is DENIED (403) from accessing owner capabilities
    ok 9 - Verified authenticated owner is GRANTED (200) access to private capabilities
    ok 10 - TokenCipher: AES-256-GCM round-trip encryption and anti-tampering verification
    ok 11 - Attacker with alg=none JWT is strictly DENIED (401)
    ok 12 - Attacker with unsupported algorithm (RS256) without matching key is DENIED (401)
    ok 13 - JWT with invalid audience (aud=public) is strictly DENIED (401)
    ok 14 - Production configuration without SUPABASE_JWT_SECRET fails closed
ok 1 - PROMPT 2 — Access Separation & Owner Identity Boundary

# Subtest: PRIORITY ZERO — Durable Approval Lifecycle & Cryptographic Verification
    ok 1 - Valid approval request is created, bound to payload hash and owner
    ok 2 - Consumer with valid token, matching payload and matching owner succeeds atomically
    ok 3 - Modified / tampered payload is strictly REJECTED (PAYLOAD_HASH_MISMATCH_TAMPERED)
    ok 4 - Replayed token is strictly REJECTED (TOKEN_ALREADY_USED)
    ok 5 - Wrong owner identity attempting to consume token is REJECTED
    ok 6 - Expired approval token is strictly REJECTED (TOKEN_EXPIRED)
    ok 7 - Forged token with invalid HMAC signature is REJECTED (INVALID_TOKEN_SIGNATURE)
ok 2 - PRIORITY ZERO — Durable Approval Lifecycle & Cryptographic Verification

# Subtest: Prompt 4 & 5: Provider Gateway, Routing & Privacy Guards
    ok 1 - Gateway successfully fails over from primary provider to secondary on rate limit
    ok 2 - Privacy Invariant: STRICT_LOCAL requests NEVER leak to cloud providers
    ok 3 - Privacy Invariant: SENSITIVE and OWNER_ONLY reject cloud when ALLOW_OWNER_DATA_ON_CLOUD is false
    ok 4 - Privacy Invariant: OWNER_ONLY is permitted on cloud when ALLOW_OWNER_DATA_ON_CLOUD is true
    ok 5 - Truthful error reporting when all cascade providers are exhausted
ok 3 - Prompt 4 & 5: Provider Gateway, Routing & Privacy Guards

# Subtest: Prompt 4: Cognitive Core & Metacognitive Invariants
    ok 1 - Public visitor mode never consults or returns owner memory
    ok 2 - Owner authenticated mode retrieves verified memories with provenance
    ok 3 - Worker Capability Contract: Public visitors cannot execute high impact tools
    ok 4 - Worker Capability Contract: Owner requires approval for high-impact actuation
    ok 5 - Worker Capability Contract: Complete 12-agent ecosystem registered with sovereign ULTRON contract
ok 4 - Prompt 4: Cognitive Core & Metacognitive Invariants

# Subtest: SECOND-PASS P0 — 1. Owner Memory Scoping & Isolation
    ok 1 - Owner memory search strictly excludes records belonging to another owner
    ok 2 - Owner memory search strictly excludes unowned legacy records
    ok 3 - Single record retrieval by ID strictly rejects cross-owner and unowned access
    ok 4 - Memory lifecycle mutations reject unowned and cross-owner records
    ok 5 - CognitiveOrchestrator strictly throws if ownerId is missing in OWNER_AUTHENTICATED mode
ok 9 - SECOND-PASS P0 — 1. Owner Memory Scoping & Isolation

# Subtest: SECOND-PASS P0 — 2. Atomic Approval Consumption & Anti-Replay
    ok 1 - Successful consumption transitions status and records unique consumption atomically
    ok 2 - Replay attack: Consuming the exact same approval token a second time strictly FAILS
    ok 3 - Concurrency safety: First concurrent consumer succeeds; second concurrent consumer FAILS
ok 10 - SECOND-PASS P0 — 2. Atomic Approval Consumption & Anti-Replay

# Subtest: SECOND-PASS P1 — 3 & 4. Explicit Auth Revocation & Dedicated Approval Secret
    ok 1 - Auth Revocation: Supabase user lookup error fails closed without HS256 fallback
    ok 2 - Production validation strictly fails closed if APPROVAL_SIGNING_SECRET is missing or < 32 chars
ok 11 - SECOND-PASS P1 — 3 & 4. Explicit Auth Revocation & Dedicated Approval Secret

# Subtest: SECOND-PASS P1 — 5. Memory Trust Defaults & Provenance
    ok 1 - Non-owner and imported memory records default to QUARANTINED and unapproved/unverified
    ok 2 - Owner-created memories with explicit owner provenance default to APPROVED and verified
ok 12 - SECOND-PASS P1 — 5. Memory Trust Defaults & Provenance

# Subtest: SECOND-PASS P1 — 6. Public Visitor Sessions & Durable Isolation
    ok 1 - Generates cryptographically signed visitor session and rejects arbitrary/guessed tokens
    ok 2 - Cross-visitor isolation: Visitor B cannot read Visitor A conversation
    ok 3 - Session Revocation: Revoked session tokens are immediately rejected
ok 13 - SECOND-PASS P1 — 6. Public Visitor Sessions & Durable Isolation

# Subtest: SECOND-PASS P1 — 8. Agent Capability Contracts & Tool Executor Boundary
    ok 1 - Attempting to execute a tool not in worker capability contract is strictly REJECTED
    ok 2 - Tool input schema validation: Invalid input arguments are strictly REJECTED
    ok 3 - High-impact actuation tool without owner approval token is REJECTED with APPROVAL_REQUIRED
    ok 4 - High-impact tool WITH valid approval token executes successfully and records audit event
    ok 5 - Sovereign ULTRON Autonomy: ULTRON executes strategic adversarial scan without requiring approval
ok 14 - SECOND-PASS P1 — 8. Agent Capability Contracts & Tool Executor Boundary

1..16
# tests 67
# suites 16
# pass 67
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

---

## 2. Backend TypeScript Compilation

Command: `npm --prefix backend run build`

Output:
```
> portfolio-backend@1.0.0 build
> tsc
(Clean exit with code 0 - 0 errors)
```

---

## 3. Web Production Build

Command: `npm run build:web`

Output:
```
Creating an optimized production build...
Compiled successfully.
File sizes after gzip:
  351.04 kB  build\static\js\main.a322901f.js
  252.44 kB  build\static\js\762.ebb8c73a.chunk.js
...
The build folder is ready to be deployed.
```
