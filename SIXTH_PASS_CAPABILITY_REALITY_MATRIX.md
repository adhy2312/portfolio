# MINI-ADHY — SIXTH-PASS CAPABILITY REALITY MATRIX

**Architecture Reference:** Cognitive Core & Hardware Reality Matrix  
**Status:** FULLY OPERATIONAL WITH TRUTHFUL STATE REPORTING  
**Effective Date:** 2026-11-10  

---

## 1. Capability & Execution Truth Taxonomy

| Capability / Subsystem | Claimed Level | Actual Implementation Level | Permitted Lifecycle States | Verification Evidence |
|---|---|---|---|---|
| **Windows Serial Hardware Transport** | Physical Serial Actuation | Genuine Node.js `serialport` transport with delimiter parsing, request correlation, bounded timeouts, and packet expiry. | `UNAVAILABLE`, `CONNECTED`, `COMMAND_SENT`, `DEVICE_ACKNOWLEDGED`, `READBACK_VERIFIED`, `FAILED`, `TIMED_OUT` | Genuine SerialPort frame transmission and handshake response. |
| **Windows Named-Pipe / TCP IPC Transport** | Local Hardware IPC | Node.js `net.Socket` framed IPC transport with JSON packets, CRC/reqId correlation, and replay rejection. | `UNAVAILABLE`, `CONNECTED`, `COMMAND_SENT`, `DEVICE_ACKNOWLEDGED`, `READBACK_VERIFIED`, `FAILED`, `TIMED_OUT` | Real TCP/Named-Pipe framing and handshake verification. |
| **Mock Hardware Gateway** | Simulation / Test Stub | In-memory mock for automated unit and CI tests. | `SIMULATED`, `UNAVAILABLE`, `FAILED`, `DISPATCHED` | Explicitly marked `isPhysicalGateway: false` and `transport: 'MOCK_TEST'`. Never returns `VERIFIED`. |
| **Adversarial Red-Team Audit Engine** | Real AST Security Inspection | TypeScript Compiler API (`ts.createSourceFile`) AST traversal, CallExpression analysis, route hook verification, and SQL parser. | `PASS`, `FAIL`, `PARTIAL`, `INCONCLUSIVE` | Cryptographic SHA-256 report digest, AST node evidence, stable finding IDs. |
| **Cognitive Memory Isolation** | Multi-Tenant Scoped Memory | Two-owner query separation in `CognitiveOrchestrator`, verified `ownerId` binding on search vectors. | `VERIFIED`, `UNAVAILABLE` | SHA-256 payload digest, owner UUID match on memory queries. |
| **Visitor Session Service** | Multi-Instance Revocation | HMAC-SHA256 session token with TTL, persistent PostgreSQL table `revoked_visitor_sessions`, and cleanup routine. | `ACTIVE`, `REVOKED`, `EXPIRED`, `UNAVAILABLE` | Database table check, bounded negative cache, safe fail-closed denial. |
| **Owner Authentication** | Canonical Zero-Trust Access | Mandatory canonical `OWNER_USER_ID` check across Fastify hooks and Vercel edge routes. | `AUTHORIZED`, `DENIED` | Exact JWT `sub` matching canonical owner UUID; email fallback completely removed. |
| **Proxy Rate Limiting** | Edge-Aware Distributed Throttling | Connecting socket IP verification against `TRUSTED_PROXIES` allowlist; Upstash Redis integration with fail-closed policy. | `PERMITTED`, `LIMITED`, `FAIL_CLOSED` | Socket remoteAddress check; headers ignored from untrusted origins. |
| **Sovereign ULTRON Agent** | Strategic Independence & Autonomy | Unprompted red-team critique, independent tool execution without operator approval token gating. | `EXECUTING`, `VERIFIED`, `COMPLETED` | Autonomous tool dispatch, cryptographic audit digest, unrestrained critique. |

---

## 2. Invariant Rules for All Future Passes

1. **No Simulated Verification**: Never label a mock or simulated output as `VERIFIED` or `PHYSICALLY_VERIFIED`.
2. **Truthful Telemetry**: Measured duration must come from microcontroller timers, never from caller request parameters.
3. **No String Heuristics for Security**: AST analysis must inspect syntax tree nodes, not substring matches that can be deceived by comments.
4. **Strict Canonical Owner Identity**: Never fall back to email matching for owner authorization.
5. **Fail-Closed on Unknown**: When external dependencies or hardware are unavailable, safely deny access and return `UNAVAILABLE`.

