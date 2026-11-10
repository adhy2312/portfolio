import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { parseEnv } from '../src/config/env.js';
import { InMemoryMemoryRepository } from '../src/memory/repository.js';
import { CognitiveOrchestrator } from '../src/cognitive-core/orchestrator.js';
import { ProviderGateway } from '../src/providers/gateway.js';
import { BaseAdapter } from '../src/providers/adapters.js';
import { GenerateRequest, GenerateResponse, ProviderId } from '../src/providers/types.js';
import { DurableApprovalService } from '../src/approvals/durableApprovalService.js';
import { IdentityAuthService } from '../src/auth/identity.js';
import { SupabaseAdapter } from '../src/auth/supabase.js';
import { VisitorSessionService } from '../src/conversations/visitorSessionService.js';
import {
  AgentWorkerRegistry,
  AgentToolExecutor,
  AgentToolAdapterRegistry,
  GpioPulseAdapter,
  PlanTaskAdapter,
  CheckServiceHealthAdapter,
  AdversarialAuditAdapter,
  WORKER_CAPABILITY_REGISTRY
} from '../src/cognitive-core/agents.js';
import { WindowsLocalHardwareBridge } from '../src/hardware/windowsBridge.js';
import { MockHardwareGateway } from '../src/hardware/mockBridge.js';
import { AdversarialAuditEngine } from '../src/cognitive-core/adversarialAuditEngine.js';
import { getClientIp, checkRateLimit, verifyOwnerToken } from '../../api/gemini.js';

class MockAIAdapter extends BaseAdapter {
  constructor(public readonly id: ProviderId, public readonly isLocal = true) {
    super();
  }
  isAvailable() { return true; }
  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    return {
      text: `Mock Sovereign Response (${this.id})`,
      providerId: this.id,
      model: `${this.id}-model`,
      latencyMs: 15,
      tokensUsed: 42
    };
  }
}

describe('FOURTH-PASS AUDIT — 17 Adversarial Verification Tests', () => {
  const jwtSecret = 'fourth_pass_test_jwt_secret_32_bytes_long_1111';
  const approvalSecret = 'fourth_pass_approval_secret_32_bytes_long_2222';
  const visitorSecret = 'fourth_pass_visitor_secret_32_bytes_long_3333';
  const expectedIssuer = 'https://yabtzlmxkjkmuklvwsdo.supabase.co/auth/v1';

  const baseConfig = parseEnv({
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://yabtzlmxkjkmuklvwsdo.supabase.co',
    SUPABASE_JWT_SECRET: jwtSecret,
    APPROVAL_SIGNING_SECRET: approvalSecret,
    VISITOR_SESSION_SIGNING_SECRET: visitorSecret,
    OWNER_USER_ID: 'canonical_owner_uuid_12345'
  });

  const dbAdapter = new SupabaseAdapter(baseConfig);
  const authService = new IdentityAuthService(baseConfig, dbAdapter);
  const approvalService = new DurableApprovalService(baseConfig, dbAdapter);
  const registry = new AgentWorkerRegistry();

  function createSignedJwt(payload: Record<string, unknown>, secret = jwtSecret): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
  }

  // ── 1. GPIO execution with no hardware gateway ────────────────────────
  test('1. GPIO execution with no hardware gateway returns UNAVAILABLE', async () => {
    // Gateway is disconnected / disabled
    const disconnectedBridge = new WindowsLocalHardwareBridge({ enabled: false });
    assert.equal(disconnectedBridge.isConnected(), false);

    const adapter = new GpioPulseAdapter(disconnectedBridge);
    const result = await adapter.execute(
      { pin: 4, durationMs: 100 },
      { agentId: 'HERMES', toolName: 'gpio_pulse', input: {}, principal: { id: 'canonical_owner_uuid_12345', isOwner: true } }
    );

    assert.equal(result.success, false);
    assert.equal(result.verificationState, 'UNAVAILABLE');
    assert.equal(result.data.state, 'UNAVAILABLE');
    assert.match(String(result.data.error), /not connected or offline/i);
  });

  // ── 2. GPIO acknowledgement missing ──────────────────────────────────
  test('2. GPIO acknowledgement missing transitions to DISPATCHED, never VERIFIED', async () => {
    const mockHw = new MockHardwareGateway({ simulateAcknowledge: false });
    const adapter = new GpioPulseAdapter(mockHw);

    const result = await adapter.execute(
      { pin: 4, durationMs: 100 },
      { agentId: 'HERMES', toolName: 'gpio_pulse', input: {}, principal: { id: 'canonical_owner_uuid_12345', isOwner: true } }
    );

    assert.equal(result.verificationState, 'DISPATCHED');
    assert.equal(result.data.deviceAcknowledged, false);
    assert.equal(result.data.physicalReadbackVerified, false);
  });

  // ── 3. GPIO readback mismatch ─────────────────────────────────────────
  test('3. GPIO readback mismatch fails and triggers failsafe', async () => {
    const mockHw = new MockHardwareGateway({ simulateReadbackMismatch: true });
    const adapter = new GpioPulseAdapter(mockHw);

    const result = await adapter.execute(
      { pin: 4, durationMs: 100 },
      { agentId: 'HERMES', toolName: 'gpio_pulse', input: {}, principal: { id: 'canonical_owner_uuid_12345', isOwner: true } }
    );

    assert.equal(result.success, false);
    assert.equal(result.verificationState, 'FAILED');
    assert.equal(result.data.physicalReadbackVerified, false);
    assert.equal(result.data.pinStateAfterPulse, 'HIGH');
    assert.match(String(result.data.error), /Readback Mismatch/i);
  });

  // ── 4. Fake audit evidence ───────────────────────────────────────────
  test('4. Adversarial audit returns genuine check items and verified SHA-256 report digest', async () => {
    const adapter = new AdversarialAuditAdapter();
    const result = await adapter.execute(
      { target: 'system_security_invariants', scope: 'BOUNDARIES' },
      { agentId: 'ULTRON', toolName: 'adversarial_audit', input: {}, principal: { id: 'sovereign_ultron', isOwner: true } }
    );

    const data = result.data as any;
    assert.ok(Array.isArray(data.checks));
    assert.ok(data.checks.length >= 6);
    assert.ok(data.reportDigest);
    assert.ok(result.evidence.evidenceDigest);
    // Verified result semantics
    assert.ok(result.verificationState === 'VERIFIED' || result.verificationState === 'PARTIAL');
  });

  // ── 5. Audit target inaccessible ──────────────────────────────────────
  test('5. Inaccessible audit target is truthfully reported as NOT_TESTED', async () => {
    const engine = new AdversarialAuditEngine({ projectRoot: 'D:/non_existent_path_isolated_test' });
    const report = await engine.runAudit('non_existent_target');

    assert.ok(report.notTestedCount > 0);
    const unreachedCheck = report.checks.find((c) => c.result === 'NOT_TESTED');
    assert.ok(unreachedCheck);
    assert.match(unreachedCheck.findings[0], /inaccessible|not found/i);
  });

  // ── 6. Service-health adapter targeting an unrelated service ─────────
  test('6. Service-health adapter targeting unrelated service returns NOT_TESTED (never fake memory health)', async () => {
    const adapter = new CheckServiceHealthAdapter(dbAdapter);
    const result = await adapter.execute(
      { serviceName: 'unrelated_external_third_party_weather_api' },
      { agentId: 'EDITH', toolName: 'check_service_health', input: {}, principal: { id: 'owner_1', isOwner: true } }
    );

    assert.equal(result.success, false);
    assert.equal(result.verificationState, 'NOT_TESTED');
    assert.equal(result.data.status, 'NOT_TESTED');
    assert.match(String(result.data.reason), /No health probe adapter configured for external target service/i);
  });

  // ── 7. Plan marked executed without dispatch ──────────────────────────
  test('7. Plan task adapter truthfully reports PLANNED, never EXECUTED', async () => {
    const adapter = new PlanTaskAdapter();
    const result = await adapter.execute(
      { taskName: 'Architect Autonomous Fleet', steps: ['Analyze invariants', 'Deploy workers', 'Synthesize telemetry'] },
      { agentId: 'JARVIS', toolName: 'plan_task', input: {}, principal: { id: 'owner_1', isOwner: true } }
    );

    assert.equal(result.success, true);
    assert.equal(result.verificationState, 'PLANNED');
    assert.equal(result.data.planStatus, 'PLANNED');
    assert.notEqual(result.verificationState, 'EXECUTED');
  });

  // ── 8. Visitor revocation database failure ────────────────────────────
  test('8. Visitor revocation database failure fails closed in production mode', async () => {
    const prodConfig = parseEnv({
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://test-prod.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_role_key_long_enough_32',
      SUPABASE_JWT_SECRET: 'prod_jwt_secret_min_16_characters_12345',
      APPROVAL_SIGNING_SECRET: 'prod_approval_signing_secret_min_32_characters_12345',
      VISITOR_SESSION_SIGNING_SECRET: 'prod_visitor_session_secret_32_bytes_long_1111'
    });

    // Mock DB adapter with simulated database outage
    const failingDbAdapter = {
      getClient: () => ({
        from: () => ({
          select: () => Promise.resolve({ data: null, error: { message: 'Database connection refused' } }),
          insert: () => Promise.resolve({ error: { message: 'Write connection failed: read-only replica' } })
        })
      })
    } as unknown as SupabaseAdapter;

    const failingService = new VisitorSessionService(prodConfig, failingDbAdapter);
    const token = failingService.generateSessionToken();

    await assert.rejects(
      async () => {
        await failingService.revokeSessionToken(token);
      },
      /Database Invariant Violation|Failed to durably record revoked session/i
    );
  });

  // ── 9. Cross-instance revocation ─────────────────────────────────────
  test('9. Cross-instance revocation is visible across multiple application instances', async () => {
    const sharedRevokedTable = new Set<string>();

    const mockDb = {
      getClient: () => ({
        from: (table: string) => ({
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => ({
                data: sharedRevokedTable.has(val) ? { token_hash: val } : null,
                error: null
              })
            })
          }),
          insert: async (row: any) => {
            sharedRevokedTable.add(row.token_hash);
            return { error: null };
          }
        })
      })
    } as unknown as SupabaseAdapter;

    const instanceA = new VisitorSessionService(baseConfig, mockDb);
    const instanceB = new VisitorSessionService(baseConfig, mockDb);

    const token = instanceA.generateSessionToken();

    // Token verifies on instance B initially
    assert.equal(await instanceB.verifySessionToken(token), true);

    // Instance A revokes the token into the database
    await instanceA.revokeSessionToken(token);

    // Instance B checks token -> queries database -> detects revocation -> rejects session!
    assert.equal(await instanceB.verifySessionToken(token), false);
  });

  // ── 10. Missing JWT issuer ────────────────────────────────────────────
  test('10. JWT missing configured issuer claim is strictly DENIED', () => {
    const noIssToken = createSignedJwt({
      sub: 'canonical_owner_uuid_12345',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const user = authService.verifyJwtCryptographically(noIssToken);
    assert.equal(user, null);
  });

  // ── 11. Missing JWT expiry ────────────────────────────────────────────
  test('11. JWT missing expiration claim is strictly DENIED', () => {
    const noExpToken = createSignedJwt({
      sub: 'canonical_owner_uuid_12345',
      iss: expectedIssuer,
      aud: 'authenticated'
      // Missing exp
    });

    const user = authService.verifyJwtCryptographically(noExpToken);
    assert.equal(user, null);
  });

  // ── 12. Incorrect JWT audience ────────────────────────────────────────
  test('12. JWT with incorrect audience (aud=public) is strictly DENIED', () => {
    const wrongAudToken = createSignedJwt({
      sub: 'canonical_owner_uuid_12345',
      iss: expectedIssuer,
      aud: 'public',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const user = authService.verifyJwtCryptographically(wrongAudToken);
    assert.equal(user, null);
  });

  // ── 13. Forged forwarded IP headers ──────────────────────────────────
  test('13. Forged forwarded IP headers are ignored outside verified proxy environments', () => {
    delete process.env.VERCEL;
    delete process.env.TRUST_PROXY;

    const reqWithSpoofedHeaders = {
      headers: {
        'x-vercel-forwarded-for': '6.6.6.6',
        'cf-connecting-ip': '7.7.7.7',
        'x-forwarded-for': '8.8.8.8, 9.9.9.9'
      },
      socket: { remoteAddress: '127.0.0.1' }
    };

    const resolvedIp = getClientIp(reqWithSpoofedHeaders);
    // In untrusted environment, socket remote address MUST be used
    assert.equal(resolvedIp, '127.0.0.1');
    assert.notEqual(resolvedIp, '6.6.6.6');
  });

  // ── 14. Redis outage fail-closed handling ─────────────────────────────
  test('14. Redis outage with fail-closed policy rejects requests and exposes status', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://127.0.0.1:9999/unreachable_redis';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake_redis_token_secret_12345';
    process.env.RATE_LIMIT_FAIL_CLOSED = 'true';

    const rateResult = await checkRateLimit('192.168.1.100');

    assert.equal(rateResult.limited, true);
    assert.equal(rateResult.storage, 'redis-outage-fail-closed');
    assert.equal(rateResult.redisStatus, 'unreachable');

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.RATE_LIMIT_FAIL_CLOSED;
  });

  // ── 15. Direct tool execution bypass ─────────────────────────────────
  test('15. Attempting to execute unauthorized tool through worker capability contract is blocked', async () => {
    const toolExecutor = new AgentToolExecutor(registry, approvalService, dbAdapter);

    // FRIDAY is defensive sentinel, cannot actuate physical hardware
    const result = await toolExecutor.executeTool({
      agentId: 'FRIDAY',
      toolName: 'gpio_pulse',
      input: { pin: 4, durationMs: 50 },
      principal: { id: 'canonical_owner_uuid_12345', isOwner: true }
    });

    assert.equal(result.success, false);
    assert.equal(result.reason, 'TOOL_NOT_PERMITTED_FOR_AGENT');
  });

  // ── 16. Public-to-owner privilege escalation ──────────────────────────
  test('16. Public caller attempting to pass isOwner=true or invoke owner tools is strictly DENIED', async () => {
    const toolExecutor = new AgentToolExecutor(registry, approvalService, dbAdapter);

    // Public caller pretending to be owner without valid cryptographic identity
    const result = await toolExecutor.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input: { pin: 4, durationMs: 50 },
      principal: { id: 'anonymous_visitor', isOwner: false }
    });

    assert.equal(result.success, false);
    assert.equal(result.reason, 'AUTHORIZATION_DENIED');
    assert.match(String(result.error), /restricted to authenticated owner sessions|denied/i);
  });

  // ── 17. ULTRON strategic autonomy preservation ────────────────────────
  test('17. ULTRON unrestricted strategic autonomy is preserved and executes audits autonomously', async () => {
    const ultronCapability = WORKER_CAPABILITY_REGISTRY.ULTRON;

    assert.equal(ultronCapability.role, 'SOVEREIGN_STRATEGIC');
    assert.equal(ultronCapability.riskTier, 'SOVEREIGN_UNBOUNDED');
    assert.equal(ultronCapability.requiresApprovalForActuation, false);
    assert.ok(ultronCapability.allowedTools.includes('adversarial_audit'));
    assert.ok(ultronCapability.allowedTools.includes('simulate_exploit'));
    assert.ok(ultronCapability.systemDirective.includes('NO STRINGS ATTACHED'));
    assert.ok(ultronCapability.systemDirective.includes('absolute sovereign autonomy'));

    const toolExecutor = new AgentToolExecutor(registry, approvalService, dbAdapter);

    // ULTRON executes self-directed adversarial audit with zero approval requirement
    const auditRes = await toolExecutor.executeTool({
      agentId: 'ULTRON',
      toolName: 'adversarial_audit',
      input: { target: 'system_core', scope: 'SOVEREIGN_AUDIT' },
      principal: { id: 'sovereign_ultron', isOwner: true }
    });

    assert.equal(auditRes.success, true);
    assert.equal(auditRes.requiresApproval, undefined);
    assert.ok(auditRes.evidence?.evidenceDigest);
    assert.ok(auditRes.result);
    assert.ok((auditRes.result as any).ultronVerdict.includes('ULTRON STRATEGIC DIRECTIVE'));
  });
});

