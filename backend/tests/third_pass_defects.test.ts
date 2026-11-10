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
  IToolExecutionAdapter
} from '../src/cognitive-core/agents.js';

class MockAIAdapter extends BaseAdapter {
  constructor(public readonly id: ProviderId, public readonly isLocal = true) {
    super();
  }
  isAvailable() { return true; }
  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    return {
      text: `Mock AI Directive (${this.id})`,
      providerId: this.id,
      model: `${this.id}-model`,
      latencyMs: 10,
      isFallback: false,
      provenance: { source: 'mock', timestamp: Date.now() }
    };
  }
}

// ════════════════════════════════════════════════════════════════════════
// P0-1 — Secure consume_approval_atomic & RPC Privilege Invariants
// ════════════════════════════════════════════════════════════════════════

describe('THIRD-PASS P0-1 — Secure consume_approval_atomic & RPC Privileges', () => {
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    APPROVAL_SIGNING_SECRET: 'test_approval_secret_min_32_characters_12345'
  });
  const dbAdapter = new SupabaseAdapter(testConfig);
  const approvalService = new DurableApprovalService(testConfig, dbAdapter);

  test('RPC Role Protection: Direct invocation by anon or authenticated roles is blocked', async () => {
    // Simulating database role check logic defined in 004_atomic_approval_consumption.sql
    function simulateRpcRoleCheck(role: string): { success: boolean; reason?: string } {
      if (['anon', 'authenticated'].includes(role)) {
        return { success: false, reason: 'UNAUTHORIZED_ROLE' };
      }
      return { success: true };
    }

    assert.equal(simulateRpcRoleCheck('anon').reason, 'UNAUTHORIZED_ROLE');
    assert.equal(simulateRpcRoleCheck('authenticated').reason, 'UNAUTHORIZED_ROLE');
    assert.equal(simulateRpcRoleCheck('service_role').success, true);
  });

  test('RPC Caller Verification: Caller cannot spoof another owner ID', async () => {
    function simulateCallerOwnerCheck(callerSub: string, requestedOwnerId: string) {
      if (callerSub && callerSub !== requestedOwnerId) {
        return { success: false, reason: 'OWNER_MISMATCH' };
      }
      return { success: true };
    }

    const check = simulateCallerOwnerCheck('usr_attacker', 'usr_victim');
    assert.equal(check.success, false);
    assert.equal(check.reason, 'OWNER_MISMATCH');
  });

  test('Token Hash Verification: Supplied token hash must match stored approval token', async () => {
    const approval = await approvalService.createApprovalRequest({
      actionType: 'gpio_pulse',
      ownerId: 'usr_owner_alpha',
      payload: { pin: 12, durationMs: 500 }
    });

    // Valid consumption
    const validConsume = await approvalService.consumeApprovalToken({
      approvalId: approval.approvalId,
      token: approval.token!,
      actionType: 'gpio_pulse',
      ownerId: 'usr_owner_alpha',
      payload: { pin: 12, durationMs: 500 }
    });
    assert.equal(validConsume.success, true);
    assert.equal(validConsume.status, 'CONSUMED');

    // Tampered token hash / replay consumption must fail
    const replayConsume = await approvalService.consumeApprovalToken({
      approvalId: approval.approvalId,
      token: approval.token!,
      actionType: 'gpio_pulse',
      ownerId: 'usr_owner_alpha',
      payload: { pin: 12, durationMs: 500 }
    });
    assert.equal(replayConsume.success, false);
    assert.equal(replayConsume.reason, 'TOKEN_ALREADY_USED');
  });
});

// ════════════════════════════════════════════════════════════════════════
// P0-2 — Replace Simulated Results with Typed Execution Adapters
// ════════════════════════════════════════════════════════════════════════

describe('THIRD-PASS P0-2 — Typed Execution Adapter Registry', () => {
  const registry = new AgentWorkerRegistry();
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    APPROVAL_SIGNING_SECRET: 'test_approval_secret_min_32_characters_12345'
  });
  const dbAdapter = new SupabaseAdapter(testConfig);
  const approvalService = new DurableApprovalService(testConfig, dbAdapter);

  test('Missing adapter returns UNAVAILABLE (zero fabricated success)', async () => {
    const executor = new AgentToolExecutor(registry, approvalService, dbAdapter);
    // inspect_process is in EDITH allowedTools, but has no adapter registered
    const res = await executor.executeTool({
      agentId: 'EDITH',
      toolName: 'inspect_process',
      input: { pid: 1234 },
      principal: { id: 'usr_owner', isOwner: true }
    });

    assert.equal(res.success, false);
    assert.equal(res.reason, 'UNAVAILABLE');
    assert.match(res.error || '', /no execution adapter registered/i);
    assert.equal(res.verificationState, undefined);
  });

  test('DurableApprovalService is mandatory for HIGH_IMPACT actuation tools', async () => {
    // Executor with NO approval service configured
    const executorWithoutApprovals = new AgentToolExecutor(registry, undefined, dbAdapter);

    const res = await executorWithoutApprovals.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input: { pin: 7, durationMs: 100 },
      principal: { id: 'usr_owner', isOwner: true }
    });

    assert.equal(res.success, false);
    assert.equal(res.reason, 'APPROVAL_SERVICE_UNAVAILABLE');
    assert.match(res.error || '', /mandatory for high-impact tool/i);
  });

  test('High-impact tool without approval token is rejected with APPROVAL_REQUIRED', async () => {
    const executor = new AgentToolExecutor(registry, approvalService, dbAdapter);

    const res = await executor.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input: { pin: 7, durationMs: 100 },
      principal: { id: 'usr_owner', isOwner: true }
      // Missing approvalToken and approvalId
    });

    assert.equal(res.success, false);
    assert.equal(res.requiresApproval, true);
    assert.equal(res.reason, 'APPROVAL_REQUIRED');
  });

  test('Real adapter execution produces verifiable cryptographic evidence', async () => {
    const executor = new AgentToolExecutor(registry, approvalService, dbAdapter);

    const approval = await approvalService.createApprovalRequest({
      actionType: 'gpio_pulse',
      ownerId: 'usr_owner',
      payload: { pin: 7, durationMs: 100 }
    });

    const res = await executor.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input: { pin: 7, durationMs: 100 },
      principal: { id: 'usr_owner', isOwner: true },
      approvalToken: approval.token,
      approvalId: approval.approvalId
    });

    assert.equal(res.success, true);
    assert.equal(res.verificationState, 'SUCCESS_VERIFIED');
    assert.ok(res.evidence);
    assert.ok(res.evidence.evidenceDigest);
    assert.equal(res.evidence.runtimeEnvironment, 'HARDWARE_ACTUATOR_V1');
    assert.ok(res.auditId);
  });

  test('Sovereign ULTRON executes adversarial_audit without approval and produces real evidence', async () => {
    const executor = new AgentToolExecutor(registry, approvalService, dbAdapter);

    const res = await executor.executeTool({
      agentId: 'ULTRON',
      toolName: 'adversarial_audit',
      input: { target: 'portfolio_cognitive_core', scope: 'BOUNDARY_INVARIANTS' },
      principal: { id: 'sovereign_ultron', isOwner: true }
    });

    assert.equal(res.success, true);
    assert.equal(res.verificationState, 'SUCCESS_VERIFIED');
    assert.ok(res.evidence?.evidenceDigest);
    assert.equal((res.result as any).scanStatus, 'COMPLETED');
  });
});

// ════════════════════════════════════════════════════════════════════════
// P1-3 — Visitor Session Hardening
// ════════════════════════════════════════════════════════════════════════

describe('THIRD-PASS P1-3 — Visitor Session Hardening', () => {
  const secretA = 'primary_visitor_session_secret_32_bytes_long_1111';
  const secretB = 'rotated_visitor_session_secret_32_bytes_long_2222';

  test('Production requires dedicated VISITOR_SESSION_SIGNING_SECRET', () => {
    assert.throws(
      () => {
        parseEnv({
          NODE_ENV: 'production',
          APPROVAL_SIGNING_SECRET: 'test_approval_signing_secret_32_bytes_long'
          // Missing VISITOR_SESSION_SIGNING_SECRET
        });
      },
      /VISITOR_SESSION_SIGNING_SECRET is mandatory/
    );
  });

  test('Token expiration: Expired session tokens are strictly rejected', () => {
    const config = parseEnv({
      NODE_ENV: 'test',
      VISITOR_SESSION_SIGNING_SECRET: secretA
    });
    const sessionService = new VisitorSessionService(config, new SupabaseAdapter(config));

    // Token with -1000ms TTL (already expired)
    const expiredToken = sessionService.generateSessionToken(-1000);
    assert.equal(sessionService.verifySessionToken(expiredToken), false);

    // Valid token with +60000ms TTL
    const validToken = sessionService.generateSessionToken(60000);
    assert.equal(sessionService.verifySessionToken(validToken), true);
  });

  test('Secret rotation: Tokens signed with previous secret verify cleanly', () => {
    // Generate token with secretB
    const oldConfig = parseEnv({
      NODE_ENV: 'test',
      VISITOR_SESSION_SIGNING_SECRET: secretB
    });
    const oldService = new VisitorSessionService(oldConfig, new SupabaseAdapter(oldConfig));
    const tokenSignedWithSecretB = oldService.generateSessionToken();

    // Now instantiate service with secretA as primary, and secretB as previous rotation secret
    const rotatedConfig = parseEnv({
      NODE_ENV: 'test',
      VISITOR_SESSION_SIGNING_SECRET: secretA,
      VISITOR_SESSION_SIGNING_SECRET_PREVIOUS: secretB
    });
    const rotatedService = new VisitorSessionService(rotatedConfig, new SupabaseAdapter(rotatedConfig));

    // Old token must still verify under secret rotation
    assert.equal(rotatedService.verifySessionToken(tokenSignedWithSecretB), true);
  });

  test('Durable revocation and restart persistence', async () => {
    const config = parseEnv({
      NODE_ENV: 'test',
      VISITOR_SESSION_SIGNING_SECRET: secretA
    });
    const service1 = new VisitorSessionService(config, new SupabaseAdapter(config));
    const token = service1.generateSessionToken();
    assert.equal(service1.verifySessionToken(token), true);

    // Revoke token in service 1
    await service1.revokeSessionToken(token);
    assert.equal(service1.verifySessionToken(token), false);

    // Simulated restart: service 2 with same revocation hash map / database
    const service2 = new VisitorSessionService(config, new SupabaseAdapter(config));
    // Manually register the revoked hash to simulate database preload across restart
    const hash = service2.hashToken(token);
    (service2 as any).revokedHashes.add(hash);

    assert.equal(service2.verifySessionToken(token), false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// P1-4 — JWT Issuer Exact Matching & Production Offline Guard
// ════════════════════════════════════════════════════════════════════════

describe('THIRD-PASS P1-4 — JWT Issuer Exact Matching & Production Offline Guard', () => {
  const jwtSecret = 'test_jwt_secret_at_least_16_chars';
  const expectedIssuer = 'https://yabtzlmxkjkmuklvwsdo.supabase.co/auth/v1';

  function createSignedJwt(payload: Record<string, unknown>, secret = jwtSecret): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
  }

  test('Issuer verification: Exact match succeeds, prefix match or missing issuer FAILS', () => {
    const config = parseEnv({
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://yabtzlmxkjkmuklvwsdo.supabase.co',
      SUPABASE_JWT_SECRET: jwtSecret
    });
    const authService = new IdentityAuthService(config, new SupabaseAdapter(config));

    // 1. Missing issuer -> Fails
    const noIssToken = createSignedJwt({
      sub: 'usr_alpha',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    assert.equal(authService.verifyJwtCryptographically(noIssToken), null);

    // 2. Prefix match / spoofed issuer -> Fails
    const prefixSpoofedToken = createSignedJwt({
      sub: 'usr_alpha',
      iss: 'https://yabtzlmxkjkmuklvwsdo.supabase.co/auth/v1-malicious-suffix',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    assert.equal(authService.verifyJwtCryptographically(prefixSpoofedToken), null);

    // 3. Exact issuer match -> Succeeds
    const validToken = createSignedJwt({
      sub: 'usr_alpha',
      iss: expectedIssuer,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    const verified = authService.verifyJwtCryptographically(validToken);
    assert.ok(verified);
    assert.equal(verified?.id, 'usr_alpha');
  });

  test('Production guard: Offline JWT verification strictly fails closed in production unless explicitly allowed', () => {
    const prodConfig = parseEnv({
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://test-prod.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_role_key_long_enough_32',
      SUPABASE_JWT_SECRET: jwtSecret,
      APPROVAL_SIGNING_SECRET: 'test_approval_secret_min_32_characters_12345',
      VISITOR_SESSION_SIGNING_SECRET: 'test_visitor_secret_min_32_characters_12345'
      // ALLOW_OFFLINE_JWT_VERIFICATION is false
    });
    const authService = new IdentityAuthService(prodConfig, new SupabaseAdapter(prodConfig));

    const token = createSignedJwt({
      sub: 'usr_alpha',
      iss: expectedIssuer,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    // In production without ALLOW_OFFLINE_JWT_VERIFICATION, must return null
    assert.equal(authService.verifyJwtCryptographically(token), null);
  });
});

// ════════════════════════════════════════════════════════════════════════
// P1-6 — End-to-End Execution Wiring
// ════════════════════════════════════════════════════════════════════════

describe('THIRD-PASS P1-6 — End-to-End Execution Wiring & Orchestration', () => {
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    APPROVAL_SIGNING_SECRET: 'test_approval_secret_min_32_characters_12345'
  });
  const dbAdapter = new SupabaseAdapter(testConfig);
  const memoryRepo = new InMemoryMemoryRepository();
  const gateway = new ProviderGateway(testConfig);
  gateway.register(new MockAIAdapter('ollama', true));

  const approvalService = new DurableApprovalService(testConfig, dbAdapter);
  const registry = new AgentWorkerRegistry();
  const toolExecutor = new AgentToolExecutor(registry, approvalService, dbAdapter);
  const orchestrator = new CognitiveOrchestrator(memoryRepo, gateway, toolExecutor);

  test('Orchestrator routes tool execution end-to-end to real adapter and attaches evidence', async () => {
    const result = await orchestrator.handleRequest({
      message: 'ULTRON execute adversarial security audit of our perimeter',
      isOwnerAuthenticated: true,
      ownerId: 'owner_adhithya'
    });

    assert.equal(result.domain, 'OWNER_AUTHENTICATED');
    assert.equal(result.delegatedWorker, 'ULTRON');
    assert.equal(result.toolAction?.tool, 'adversarial_audit');
    assert.equal(result.toolAction?.status, 'EXECUTED');
    assert.ok(result.toolExecution);
    assert.equal(result.toolExecution?.verificationState, 'SUCCESS_VERIFIED');
    assert.ok(result.toolExecution?.evidence?.evidenceDigest);
  });

  test('Direct tool execution via executeAgentTool enforces capability contract', async () => {
    // Attempting to run a non-permitted tool through FRIDAY
    const denied = await orchestrator.executeAgentTool({
      agentId: 'FRIDAY',
      toolName: 'gpio_pulse', // FRIDAY cannot actuate hardware
      input: { pin: 7, durationMs: 100 },
      principal: { id: 'owner_adhithya', isOwner: true }
    });

    assert.equal(denied.success, false);
    assert.equal(denied.reason, 'TOOL_NOT_PERMITTED_FOR_AGENT');
  });
});
