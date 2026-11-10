# Attack Surface Mapping & Endpoint Exposure

## 1. Network Accessible Endpoints

### A. Vercel Serverless API (`/api/*` on `https://adhy.tech`)
| Endpoint | Method | Auth Required | Functionality | Critical Risks Identified |
|---|---|---|---|---|
| `/api/auth` | POST, GET | None (handles login/verify) | Passcode login, token verification | In-memory rate-limiter loses state across serverless invocations; divergence from Supabase Auth. |
| `/api/agent-ecosystem` | GET, POST | None | Ecosystem status & weekly report | **P0 FINDING**: Unauthenticated `action=weekly_report` triggers Resend email dispatch and leaks hardcoded passcode `adhy2006` in HTML response. |
| `/api/gemini` | POST | None (IP rate-limited) | Gemini chat & embeddings | Prompt injection; potential quota drain; system prompt claims ULTRON acts "without human approval". |
| `/api/groq` | POST | None (IP rate-limited) | Groq LPU inference | Quota drain; untrusted user input directly passed to LPU. |
| `/api/huggingface` | POST | None (IP rate-limited) | HF inference router | Quota exhaustion; model fallback. |
| `/api/openrouter` | POST | None (IP rate-limited) | OpenRouter inference | Quota exhaustion. |
| `/api/omniroute` | POST | None (IP rate-limited) | Multi-provider router | Provider routing logic bypass. |
| `/api/spotify` | GET | None | Spotify player token | Client token leakage. |

### B. Fastify Backend Monolith (`backend/` on Render `mini-adhy-backend.onrender.com`)
| Endpoint | Method | Access Domain | Enforced Boundary | Vulnerability Assessment |
|---|---|---|---|---|
| `/health` | GET | PUBLIC | Unauthenticated health & telemetry | Information leakage if internal memory / DB stats are unredacted. |
| `/ready`, `/live` | GET | PUBLIC | Process probes | Safe. |
| `/docs` | GET | PUBLIC | Swagger UI | Schema disclosure (acceptable for public API; owner schemas visible). |
| `/api/v1/public/knowledge` | GET | PUBLIC_VISITOR | Reads published knowledge | Low risk. |
| `/api/v1/public/conversations` | POST | PUBLIC_VISITOR | Creates visitor conversation | Session ID generation; rate limiting. |
| `/api/v1/public/conversations/:id` | GET | PUBLIC_VISITOR | Scoped by `X-Visitor-Session-ID` | IDOR / cross-visitor conversation snooping if header missing/spoofed. |
| `/api/v1/public/conversations/:id/messages` | POST | PUBLIC_VISITOR | Scoped by `X-Visitor-Session-ID` | Prompt injection, quota consumption. |
| `/api/v1/public/chat` | POST | PUBLIC_VISITOR | Single turn inquiry | Rate limited (30/min). |
| `/api/v1/public/chat/stream` | GET | PUBLIC_VISITOR | SSE streaming response | Connection exhaustion; slowloris risk. |
| `/api/v1/owner/profile` | GET | OWNER_AUTHENTICATED | Deny-by-default hook (`requireOwnerHook`) | Bypassed if JWT validation is flawed. |
| `/api/v1/owner/memories` | GET, POST | OWNER_AUTHENTICATED | Deny-by-default hook | Memory poisoning if unauthorized. |
| `/api/v1/owner/tasks` | GET | OWNER_AUTHENTICATED | Deny-by-default hook | Safe. |
| `/api/v1/owner/approvals` | GET | OWNER_AUTHENTICATED | Deny-by-default hook | Safe. |
| `/api/v1/owner/approvals/:id/consume`| POST | OWNER_AUTHENTICATED | Token validation + consumption | Token replay, race conditions. |
| `/api/v1/owner/integrations` | GET | OWNER_AUTHENTICATED | Returns encrypted status | Safe (zero plaintext tokens returned). |
| `/api/v1/owner/diagnostics` | GET | OWNER_AUTHENTICATED | System diagnostics | Safe. |
| `/api/v1/owner/assistant/chat` | POST | OWNER_AUTHENTICATED | Privileged owner AI chat | Tool privilege escalation if worker contracts fail. |
| `/api/v1/owner/workers` | GET | OWNER_AUTHENTICATED | Worker contract listing | Safe. |
| `/api/v1/owner/metacognition/proposals` | GET, POST | OWNER_AUTHENTICATED | Proposal creation & review | Self-promotion attack attempts. |

---

## 2. In-Browser / Cognitive Core Attack Surface

| Subsystem | File | Threat Vectors |
|---|---|---|
| **ServerApprovalService** | `src/core/security/ServerApprovalService.js` | Synthetic owner session auto-init (`_initOwnerSession`); hardcoded human operator names (`'adhithya'`, `'creator'`); non-atomic token consumption in browser memory. |
| **CognitiveSyncEngine** | `src/core/distribution/CognitiveSyncEngine.js` | Hardcoded sync secret (`'adhy_cognitive_sync_v1_secret'`); non-cryptographic `Math.imul` fallback digest; unsigned callback acceptance. |
| **PortableIdentityManager**| `src/core/identity/PortableIdentityManager.js` | `options.trusted === true` bypasses quarantine and directly modifies active cognition without owner JWT proof. |
| **Agent Autonomy** | Specialist Agents & Personas | Prompts claiming ULTRON acts "without human approval"; agents claiming `requiresApproval = false`. |
| **Visual/Live Mode** | `src/core/live/`, `src/core/vision/` | Malicious camera frame / visual injection; audio buffer overflow. |
