# Mini-Adhy Operational Runbook & Observability

## 1. Health & Liveness Endpoints

| Endpoint | Method | Scope | Description |
|---|---|---|---|
| `/health` | GET | Public | Full system health, uptime, memory, and persistence state |
| `/ready` | GET | Public | Kubernetes/Docker readiness probe |
| `/live` | GET | Public | Process supervisor liveness probe |
| `/docs` | GET | Public | Swagger UI OpenAPI interactive documentation |

## 2. Structured Logging Guidelines

All logs are emitted as JSON lines via Pino logger:
- **Correlation ID**: Every HTTP request receives an `X-Request-ID` (`req_<timestamp>_<random>`) propagated across all child log messages.
- **Redaction**: Passwords, tokens, API keys, and authorization headers are automatically redacted by `redactSensitiveObject`.
- **Level**: Configurable via `LOG_LEVEL` (`debug`, `info`, `warn`, `error`).

## 3. Incident Response & Failure Modes

1. **AI Provider Quota Exhaustion**:
   - The provider gateway automatically fails over across the candidate chain (Gemini -> Groq -> HuggingFace -> OpenRouter).
   - If all cloud providers fail, the backend degrades gracefully to cached portfolio responses without crashing.
2. **Circuit Breakers**:
   - 3 consecutive failures on any provider triggers a 60-second cooldown period, preventing retry storms.
3. **Database Unavailable**:
   - The memory adapter falls back to in-memory local caching, preserving public conversation flow while logging a high-priority warning.

