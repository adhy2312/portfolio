# MINI-ADHY BACKEND — LOCAL DEVELOPMENT & OPERATIONAL GUIDE
════════════════════════════════════════════════════════════════════
**Architecture:** Dual-Domain Modular Monolith (Fastify + TypeScript + Supabase PostgreSQL)  
**Budget:** ₹0/month (Supabase Free Tier + Local Parity / In-Memory Fallback)

---

## 1. Quick Start

### 1.1 Prerequisites
- Node.js `v20.x` or `v22.x` (LTS recommended)
- npm `v10+` or `v11+`
- (Optional) Free Supabase project from [supabase.com](https://supabase.com)

### 1.2 Installing Dependencies

From the root repository directory:
```bash
# 1. Install frontend dependencies
npm install --legacy-peer-deps

# 2. Install backend dependencies
cd backend && npm install && cd ..
```

---

## 2. Running Local Development

### 2.1 Starting the Fastify Backend
The backend runs on `127.0.0.1:3001` by default:
```bash
# From repository root:
npm run backend:dev

# Or directly from backend/:
cd backend
npm run dev
```

When started, Fastify will output:
```
Mini-Adhy Backend Monolith online at http://127.0.0.1:3001
OpenAPI documentation accessible at http://127.0.0.1:3001/docs
```

### 2.2 Starting the React Frontend
In a separate terminal:
```bash
npm start
```
The React frontend starts at `http://localhost:3000`. It automatically connects to the backend at `http://127.0.0.1:3001` via `REACT_APP_BACKEND_URL`.

---

## 3. Configuring Supabase (Free Tier) & Database Parity

### 3.1 Zero-Cost Cloud Supabase Setup
1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project (select any free region e.g. `ap-south-1` or `us-east-1`).
3. Under **Project Settings → API**:
   - Copy **Project URL** -> `SUPABASE_URL`
   - Copy **anon / public key** -> `SUPABASE_ANON_KEY`
   - Copy **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY` (Keep strictly backend-only!)
4. Under **SQL Editor**, run the migration file:
   - Copy contents of [`backend/migrations/001_initial_schema.sql`](file:///d:/portfolio/portfolio/backend/migrations/001_initial_schema.sql) and execute.
5. Create `backend/.env` with your credentials:
   ```env
   NODE_ENV=development
   PORT=3001
   HOST=127.0.0.1
   LOG_LEVEL=info
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://adhy.tech
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 3.2 Operating Without Supabase (Offline Local Development)
If `SUPABASE_URL` is omitted or unconfigured, the backend **automatically and gracefully falls back to the in-memory repository** (`InMemoryMemoryRepository`).
- Full local development parity without paid or cloud services.
- Health probe `/health` honestly reports `persistence.provider: 'in-memory-local-dev'`.
- Zero database lock-in and zero mandatory cloud services.

### 3.3 Operating Without Cloud AI Keys
The server starts immediately and passes all health probes even if `GEMINI_API_KEY`, `GROQ_API_KEY`, or `HF_TOKEN` are not provided.
Optional local Ollama inference can be targeted via `OLLAMA_BASE_URL=http://127.0.0.1:11434`.

---

## 4. Running Tests

### 4.1 Backend Test Suite (Fastify Injection & Security Verification)
```bash
# From repository root:
npm run backend:test

# Or inside backend/:
cd backend && npm test
```
**Test Coverage (17/17 passed):**
- System health, readiness, liveness, and OpenAPI specification.
- Configuration validation (valid defaults, invalid port/URL rejection).
- CORS policy enforcement (rejection of unapproved cross-origins).
- Schema validation (rejection of empty/excessive messages, prototype pollution protection).
- Secret redaction (API keys, authorization tokens, passcodes scrubbed from logs).

### 4.2 Frontend Compatibility Test Suite
```bash
# Run frontend backend-client adapter tests
node ./node_modules/react-scripts/scripts/test.js --watchAll=false src/api/__tests__/backendClient.test.js

# Run full portfolio test suite (all 21 suites)
npm test -- --watchAll=false src/
```

### 4.3 Compiling Backend TypeScript
```bash
npm run backend:build
```
Produces optimized JavaScript in `backend/dist/`.

---

## 5. Endpoints & API Reference

| Method | Endpoint | Access Domain | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Telemetry, uptime, memory, persistence provider |
| `GET` | `/ready` | Public | Readiness probe for deployment gate |
| `GET` | `/live` | Public | Liveness probe for process supervisors |
| `GET` | `/docs` | Public | Interactive OpenAPI (Swagger UI) documentation |
| `GET` | `/api/v1/public/capabilities` | Public (Domain A) | Directory of public agents & capabilities |
| `POST` | `/api/v1/public/chat` | Public (Domain A) | Rate-limited visitor chat Q&A |
