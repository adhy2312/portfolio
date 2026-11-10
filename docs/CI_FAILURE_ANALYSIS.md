# CI Failure Root Cause Analysis & Production Reliability Report

**Target Repository**: `adhy2312/portfolio`  
**Run Investigated**: Run 42659035148 on commit `01e27ca`  
**Status**: Repaired & Verified  
**Runtime**: Node.js 22 (LTS) | npm 10+

---

## 1. Executive Summary & Root Cause Analysis

An in-depth investigation into GitHub Actions workflow failures on the `adhy2312/portfolio` repository revealed three compounding defects across test execution, dependency locking, and test harness mocks.

### Failure 1: JSDOM `crypto` & `webcrypto` Absence in Headless Node 20
* **Symptom**: `Process completed with exit code 1` during `Verify Cognitive Security, Approvals & Distributed Invariants`.
* **Root Cause**: In headless Linux environments under Node 20, Jest's `jsdom` test environment does not natively map `window.crypto.getRandomValues` or `window.crypto.subtle` to Node's internal `webcrypto`. When security and cognitive synchronization suites (`ServerApprovalService`, `CognitiveSyncEngine`, `TokenCipher`) invoked cryptographic functions, runtime exceptions were triggered.
* **Resolution**:
  - Upgraded GitHub Actions runtime from Node 20 to Node 22 in `.github/workflows/ci.yml`.
  - Added robust polyfills in `src/setupTests.js` mapping `window.crypto` and `global.crypto` to `node:crypto.webcrypto`.

### Failure 2: Studio `package-lock.json` Desynchronization & Install Anti-Pattern
* **Symptom**: Dependency step required `npm ci || npm install --legacy-peer-deps` fallback; running `npm ci` in `studio` crashed with `npm error code EUSAGE: Missing ts-toolbelt@9.6.0 and @types/react@19.3.0 from lock file`.
* **Root Cause**: The legacy build script ran an in-place `npm install` inside `studio` during `npm run build`, causing `studio/package.json` and `studio/package-lock.json` to fall out of sync. This necessitated fragile fallback flags (`--legacy-peer-deps`) that masked install errors.
* **Resolution**:
  - Synchronized `studio/package-lock.json` deterministically via `npm install --package-lock-only`.
  - Separated build pipelines into `build:web`, `build:studio`, and `build:all`.
  - Eliminated `|| npm install --legacy-peer-deps` across all CI steps, strictly enforcing clean `npm ci`.

### Failure 3: Broad Mock Fetch Hiding Real System Failures
* **Symptom**: Global test harness in `src/setupTests.js` intercepted all `/api/` calls and returned fake `{ status: 'healthy', mock: true }` 200 responses.
* **Root Cause**: Overbroad test mock masked genuine 404/500 errors and prevented testing of actual backend communication and fallback logic.
* **Resolution**:
  - Removed global wildcard fetch mocks from `src/setupTests.js`.
  - Enforced explicit, scoped mocks within individual test files where network isolation is required.

---

## 2. CI Workflow Architecture (`ci.yml`)

The workflow is now structured into five decoupled, deterministic stages:

```mermaid
flowchart TD
    deps["Job 1: Deterministic Dependency Sync (npm ci)"]
    core["Job 2: Core Cognitive & Security Invariants (372 Tests)"]
    backend["Job 3: Fastify Monolith Test & Build (36 Tests + tsc)"]
    web_build["Job 4: Production Web Application Build"]
    studio_build["Job 5: Production Sanity Studio Build"]

    deps --> core
    deps --> backend
    core --> web_build
    backend --> web_build
    core --> studio_build
    backend --> studio_build
```

### Deterministic Invariants Enforced:
1. **Zero Install Fallbacks**: Every job runs strict `npm ci`. Any lockfile drift fails fast.
2. **Pinned Node Runtime**: Node.js 22 LTS across all runners.
3. **No Hidden Installs**: `npm run build:web` and `npm run build:studio` rely strictly on pre-installed dependencies.
4. **Comprehensive Test Coverage**: All 372 frontend/core tests and 36 backend tests run on every pull request and push to `main`.

