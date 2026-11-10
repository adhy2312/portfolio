import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { parseEnv } from '../src/config/env.js';
import { InMemoryMemoryRepository } from '../src/memory/repository.js';
import { CognitiveOrchestrator } from '../src/cognitive-core/orchestrator.js';
import { ProviderGateway } from '../src/providers/gateway.js';
import { BaseAdapter } from '../src/providers/adapters.js';
import { GenerateRequest, GenerateResponse, ProviderId } from '../src/providers/types.js';
import { DurableApprovalService, computeCanonicalPayloadHash } from '../src/approvals/durableApprovalService.js';
import { IdentityAuthService } from '../src/auth/identity.js';
import { SupabaseAdapter } from '../src/auth/supabase.js';
import { VisitorSessionService } from '../src/conversations/visitorSessionService.js';
import { AgentWorkerRegistry, AgentToolExecutor } from '../src/cognitive-core/agents.js';

class MockAIAdapter extends BaseAdapter {
  constructor(public readonly id: ProviderId, public readonly isLocal = true) {
    super();
  }
  isAvailable() { return true; }
  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    return {
      text: 'Mock AI Response',
      providerId: this.id,
      model: `${this.id}-model`,
      latencyMs: 5,
      isFallback: false,
      provenance: { source: 'mock', timestamp: Date.now() }
    };
  }
}

describe('SECOND-PASS P0 — 1. Owner Memory Isolation', () => {
  const memoryRepo = new InMemoryMemoryRepository();
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    ENCRYPTION_SECRET: 'test_encryption_secret_1234567890',
    ALLOW_OWNER_DATA_ON_CLOUD: true
  });
  const gateway = new ProviderGateway(testConfig);
  gateway.register(new MockAIAdapter('ollama', true));
  const orchestrator = new CognitiveOrchestrator(memoryRepo, gateway);

  test('Two-Owner Isolation: Neither owner can retrieve the other owner memories or unowned legacy memories', async () => {
    // 1. Store memory for Owner Alpha
    await memoryRepo.storeRecord({
      id: 'mem_alpha_01',
      ownerId: 'owner_alpha_uuid',
      category: 'finances',
      content: 'Alpha secret bank vault code: 771199',
      confidence: 1.0,
      provenance: 'alpha_device',
      source: 'owner',
      sourceType: 'USER_INPUT',
      userApproved: true,
      verified: true,
      privacyClass: 'OWNER_ONLY',
      lifecycleStatus: 'APPROVED'
    });

    // 2. Store memory for Owner Beta
    await memoryRepo.storeRecord({
      id: 'mem_beta_01',
      ownerId: 'owner_beta_uuid',
      category: 'finances',
      content: 'Beta secret safe combination: 224466',
      confidence: 1.0,
      provenance: 'beta_device',
      source: 'owner',
      sourceType: 'USER_INPUT',
      userApproved: true,
      verified: true,
      privacyClass: 'OWNER_ONLY',
      lifecycleStatus: 'APPROVED'
    });

    // 3. Store unowned legacy memory (ownerId is undefined)
    await memoryRepo.storeRecord({
      id: 'mem_legacy_unowned_01',
      ownerId: undefined,
      category: 'finances',
      content: 'Legacy unowned memo: 111111',
      confidence: 0.5,
      provenance: 'old_import',
      source: 'unknown',
      sourceType: 'EXTERNAL_IMPORT',
      userApproved: false,
      verified: false,
      privacyClass: 'OWNER_ONLY',
      lifecycleStatus: 'QUARANTINED'
    });

    // Query as Owner Alpha
    const alphaResults = await memoryRepo.searchRecords('secret', { ownerId: 'owner_alpha_uuid' });
    assert.equal(alphaResults.length, 1);
    assert.equal(alphaResults[0].id, 'mem_alpha_01');
    assert.match(alphaResults[0].content, /771199/);
    assert.doesNotMatch(alphaResults[0].content, /224466/);
    assert.doesNotMatch(alphaResults[0].content, /111111/);

    // Query as Owner Beta
    const betaResults = await memoryRepo.searchRecords('secret', { ownerId: 'owner_beta_uuid' });
    assert.equal(betaResults.length, 1);
    assert.equal(betaResults[0].id, 'mem_beta_01');
    assert.match(betaResults[0].content, /224466/);
    assert.doesNotMatch(betaResults[0].content, /771199/);
    assert.doesNotMatch(betaResults[0].content, /111111/);

    // GetRecord isolation
    assert.equal(await memoryRepo.getRecord('mem_beta_01', 'owner_alpha_uuid'), null);
    assert.equal(await memoryRepo.getRecord('mem_alpha_01', 'owner_beta_uuid'), null);
    assert.equal(await memoryRepo.getRecord('mem_legacy_unowned_01', 'owner_alpha_uuid'), null);

    // UpdateRecord isolation
    const alphaTamperAttempt = await memoryRepo.updateRecord('mem_beta_01', { content: 'Tampered by Alpha' }, 'owner_alpha_uuid');
    assert.equal(alphaTamperAttempt, null);

    // ArchiveRecord and TombstoneRecord isolation
    assert.equal(await memoryRepo.archiveRecord('mem_beta_01', 'archive attempt', 'owner_alpha_uuid'), false);
    assert.equal(await memoryRepo.tombstoneRecord('mem_beta_01', 'tombstone attempt', 'owner_alpha_uuid'), false);

    // SupersedeRecord isolation
    await assert.rejects(async () => {
      await memoryRepo.supersedeRecord('mem_beta_01', {
        id: 'mem_tamper_supersede',
        category: 'finances',
        content: 'Superseded by Alpha',
        confidence: 1.0,
        provenance: 'alpha',
        source: 'owner',
        sourceType: 'USER_INPUT',
        userApproved: true,
        verified: true,
        privacyClass: 'OWNER_ONLY',
        lifecycleStatus: 'APPROVED'
      }, 'owner_alpha_uuid');
    }, /Access Denied/);
  });

  test('CognitiveOrchestrator mandates verified ownerId on owner queries and scopes search strictly', async () => {
    // Calling handleRequest with isOwnerAuthenticated=true but missing ownerId must fail closed
    await assert.rejects(async () => {
      await orchestrator.handleRequest({
        message: 'What is my secret vault code?',
        isOwnerAuthenticated: true,
        ownerId: undefined
      });
    }, /Authenticated owner requests must supply a verified ownerId/);

    // Calling handleRequest with Owner Alpha returns only Alpha memories
    const alphaExec = await orchestrator.handleRequest({
      message: 'What is my secret bank vault code?',
      isOwnerAuthenticated: true,
      ownerId: 'owner_alpha_uuid'
    });
    assert.equal(alphaExec.domain, 'OWNER_AUTHENTICATED');
    assert.equal(alphaExec.provenance.memoriesConsulted, 1);
  });
});

describe('SECOND-PASS P0 — 2. Atomic Approval Consumption', () => {
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    APPROVAL_SIGNING_SECRET: 'test_dedicated_approval_signing_secret_32_bytes_len'
  });
  const dbAdapter = new SupabaseAdapter(testConfig);
  const approvalService = new DurableApprovalService(testConfig, dbAdapter);

  test('Atomically consumes pending approval request with matching token and payload', async () => {
    const payload = { targetPin: 14, state: 'HIGH' };
    const request = await approvalService.createApprovalRequest({
      actionType: 'gpio_actuation',
      targetService: 'hermes_hardware',
      ownerId: 'owner_adhithya',
      payload
    });

    const consumeResult = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      actionType: 'gpio_actuation',
      targetService: 'hermes_hardware',
      ownerId: 'owner_adhithya',
      payload
    });

    assert.equal(consumeResult.success, true);
    assert.equal(consumeResult.status, 'CONSUMED');

    // Replay attempt must be rejected atomically
    const replayResult = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      actionType: 'gpio_actuation',
      targetService: 'hermes_hardware',
      ownerId: 'owner_adhithya',
      payload
    });
    assert.equal(replayResult.success, false);
    assert.equal(replayResult.reason, 'TOKEN_ALREADY_USED');
  });

  test('Rejects consumption and prevents state transition when payload digest is tampered', async () => {
    const originalPayload = { action: 'power_off', duration: 10 };
    const request = await approvalService.createApprovalRequest({
      actionType: 'power_cycle',
      targetService: 'power_hub',
      ownerId: 'owner_adhithya',
      payload: originalPayload
    });

    // Attacker modifies payload to malicious action
    const tamperedPayload = { action: 'power_off', duration: 999999 };
    const result = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      actionType: 'power_cycle',
      targetService: 'power_hub',
      ownerId: 'owner_adhithya',
      payload: tamperedPayload
    });

    assert.equal(result.success, false);
    assert.equal(result.reason, 'PAYLOAD_HASH_MISMATCH_TAMPERED');

    // Original pending request should not have been consumed
    const pendingList = await approvalService.getPendingApprovals('owner_adhithya');
    assert.ok(pendingList.some((r) => r.approvalId === request.approvalId));
  });

  test('Concurrent consumption race: Exactly one caller succeeds, subsequent calls fail', async () => {
    const payload = { channel: 'servo_1', angle: 90 };
    const request = await approvalService.createApprovalRequest({
      actionType: 'servo_rotate',
      ownerId: 'owner_race_test',
      payload
    });

    // Simulate 5 simultaneous concurrent consume requests
    const promises = Array.from({ length: 5 }).map(() =>
      approvalService.consumeApprovalToken({
        approvalId: request.approvalId,
        token: request.token!,
        actionType: 'servo_rotate',
        ownerId: 'owner_race_test',
        payload
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success && r.reason === 'TOKEN_ALREADY_USED').length;

    assert.equal(successCount, 1, 'Exactly one concurrent request must succeed');
    assert.equal(failCount, 4, 'All four other concurrent requests must be rejected with TOKEN_ALREADY_USED');
  });
});

describe('SECOND-PASS P1 — 3. Authentication Revocation (No Silent Fallback)', () => {
  test('When Supabase is configured and auth.getUser rejects token, it fails closed and returns null', async () => {
    // Create mock Supabase client that simulates a revoked session
    const mockSupabaseClient: any = {
      auth: {
        async getUser(token: string) {
          // Simulating revoked session error from Supabase Auth
          return { data: { user: null }, error: { message: 'Session has been revoked by operator' } };
        }
      }
    };

    const mockDbAdapter: any = {
      getClient: () => mockSupabaseClient
    };

    const config = parseEnv({
      NODE_ENV: 'test',
      SUPABASE_JWT_SECRET: 'super_secret_jwt_key_that_is_32_chars_long',
      OWNER_EMAILS: 'owner@adhy.tech'
    });

    const authService = new IdentityAuthService(config, mockDbAdapter);

    // Create a cryptographically valid HS256 token that has not expired
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: 'owner_uuid_123',
      email: 'owner@adhy.tech',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const sig = crypto.createHmac('sha256', config.SUPABASE_JWT_SECRET!).update(`${header}.${payload}`).digest('base64url');
    const validLookingToken = `${header}.${payload}.${sig}`;

    // Because Supabase is configured and reported session revoked, verifyToken MUST return null!
    // It must NOT silently accept it through local HS256!
    const user = await authService.verifyToken(validLookingToken);
    assert.equal(user, null, 'Revoked session MUST be rejected and return null even if HS256 signature is valid');
  });
});

describe('SECOND-PASS P1 — 4. Dedicated APPROVAL_SIGNING_SECRET', () => {
  test('Fails startup in production mode if APPROVAL_SIGNING_SECRET is missing or < 32 characters', () => {
    assert.throws(
      () => {
        parseEnv({
          NODE_ENV: 'production',
          SUPABASE_URL: 'https://test.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'test_service_key_at_least_10_chars',
          ENCRYPTION_SECRET: 'test_encryption_secret_1234567890'
          // APPROVAL_SIGNING_SECRET missing!
        });
      },
      (err: Error) => {
        assert.match(err.message, /APPROVAL_SIGNING_SECRET is mandatory/);
        return true;
      }
    );

    assert.throws(
      () => {
        parseEnv({
          NODE_ENV: 'production',
          SUPABASE_URL: 'https://test.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'test_service_key_at_least_10_chars',
          APPROVAL_SIGNING_SECRET: 'short_key_123' // < 32 chars!
        });
      },
      (err: Error) => {
        assert.match(err.message, /at least 32 characters/);
        return true;
      }
    );
  });
});

describe('SECOND-PASS P1 — 5. Memory Trust Defaults & Provenance', () => {
  const memoryRepo = new InMemoryMemoryRepository();

  test('Non-owner and imported memory records default to QUARANTINED and unapproved/unverified', async () => {
    const imported = await memoryRepo.storeRecord({
      id: 'mem_import_external',
      category: 'research',
      content: 'Imported unverified thesis on robotics',
      confidence: 0.99, // High confidence must NOT auto-promote
      provenance: 'external_crawl',
      source: 'crawler',
      sourceType: 'EXTERNAL_IMPORT',
      privacyClass: 'OWNER_ONLY'
    });

    assert.equal(imported.userApproved, false, 'Imported memory must default userApproved to false');
    assert.equal(imported.verified, false, 'Imported memory must default verified to false');
    assert.equal(imported.lifecycleStatus, 'QUARANTINED', 'Imported memory must default lifecycleStatus to QUARANTINED');
  });

  test('Owner-created memories with explicit owner provenance default to APPROVED and verified', async () => {
    const ownerCreated = await memoryRepo.storeRecord({
      id: 'mem_owner_direct',
      ownerId: 'owner_adhithya_id',
      category: 'architecture',
      content: 'Direct owner architectural specification',
      confidence: 1.0,
      provenance: 'owner_input',
      source: 'owner',
      sourceType: 'USER_INPUT',
      privacyClass: 'OWNER_ONLY'
    });

    assert.equal(ownerCreated.userApproved, true);
    assert.equal(ownerCreated.verified, true);
    assert.equal(ownerCreated.lifecycleStatus, 'APPROVED');
  });
});

describe('SECOND-PASS P1 — 6. Public Visitor Sessions & Durable Isolation', () => {
  const config = parseEnv({
    NODE_ENV: 'test',
    APPROVAL_SIGNING_SECRET: 'visitor_session_secret_test_32_bytes_long_12345'
  });
  const dbAdapter = new SupabaseAdapter(config);
  const sessionService = new VisitorSessionService(config, dbAdapter);

  test('Generates cryptographically signed visitor session and rejects arbitrary/guessed tokens', async () => {
    const sessionToken = sessionService.generateSessionToken();
    assert.ok(sessionToken.startsWith('vissess_'));
    assert.equal(sessionService.verifySessionToken(sessionToken), true);

    // Guessed or forged token must be rejected
    const forgedToken = 'vissess_0123456789abcdef01234567.fake_forged_sig_12345';
    assert.equal(sessionService.verifySessionToken(forgedToken), false);
    assert.equal(sessionService.verifySessionToken('session_arbitrary_string'), false);
  });

  test('Cross-visitor isolation: Visitor B cannot read Visitor A conversation', async () => {
    const tokenA = sessionService.generateSessionToken();
    const tokenB = sessionService.generateSessionToken();

    const convA = await sessionService.createConversation(tokenA, 'Visitor A inquiry');
    await sessionService.appendMessage(convA.id, tokenA, 'user', 'Confidential project inquiry from visitor A');

    // Visitor A reads own conversation -> OK
    const readA = await sessionService.getConversation(convA.id, tokenA);
    assert.equal(readA.status, 'OK');
    assert.equal(readA.conversation?.messages.length, 1);

    // Visitor B attempts to read Visitor A conversation -> FORBIDDEN
    const readB = await sessionService.getConversation(convA.id, tokenB);
    assert.equal(readB.status, 'FORBIDDEN');
    assert.equal(readB.conversation, undefined);
  });

  test('Session Revocation: Revoked session tokens are immediately rejected', async () => {
    const sessionToken = sessionService.generateSessionToken();
    const conv = await sessionService.createConversation(sessionToken, 'Pre-revocation conversation');

    // Revoke session
    sessionService.revokeSessionToken(sessionToken);
    assert.equal(sessionService.verifySessionToken(sessionToken), false);

    // Access attempt with revoked token is forbidden
    const readAfterRevoke = await sessionService.getConversation(conv.id, sessionToken);
    assert.equal(readAfterRevoke.status, 'FORBIDDEN');
  });
});

describe('SECOND-PASS P1 — 8. Agent Capability Contracts & Tool Executor Boundary', () => {
  const registry = new AgentWorkerRegistry();
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    APPROVAL_SIGNING_SECRET: 'test_approval_secret_at_least_32_bytes_long_12345'
  });
  const dbAdapter = new SupabaseAdapter(testConfig);
  const approvalService = new DurableApprovalService(testConfig, dbAdapter);
  const toolExecutor = new AgentToolExecutor(registry, approvalService);

  test('Attempting to execute a tool not in worker capability contract is strictly REJECTED', async () => {
    // EDITH is tactical telemetry, not allowed to execute gpio_pulse or uart_write
    const result = await toolExecutor.executeTool({
      agentId: 'EDITH',
      toolName: 'gpio_pulse',
      input: { pin: 12, durationMs: 100 },
      principal: { id: 'owner_1', isOwner: true }
    });

    assert.equal(result.success, false);
    assert.equal(result.reason, 'TOOL_NOT_PERMITTED_FOR_AGENT');
  });

  test('Tool input schema validation: Invalid input arguments are strictly REJECTED', async () => {
    // JARVIS plan_task requires taskName (string) and steps (array of strings min 1)
    const result = await toolExecutor.executeTool({
      agentId: 'JARVIS',
      toolName: 'plan_task',
      input: { taskName: '', steps: [] }, // Invalid: empty string and empty array
      principal: { id: 'owner_1', isOwner: true }
    });

    assert.equal(result.success, false);
    assert.equal(result.reason, 'INVALID_TOOL_INPUT');
  });

  test('High-impact actuation tool without owner approval token is REJECTED with APPROVAL_REQUIRED', async () => {
    // HERMES gpio_pulse is HIGH_IMPACT and requires owner approval token
    const result = await toolExecutor.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input: { pin: 22, durationMs: 50 },
      principal: { id: 'owner_1', isOwner: true }
      // approvalToken missing!
    });

    assert.equal(result.success, false);
    assert.equal(result.requiresApproval, true);
    assert.equal(result.reason, 'APPROVAL_REQUIRED');
  });

  test('High-impact tool WITH valid approval token executes successfully and records audit event', async () => {
    const input = { pin: 22, durationMs: 50 };
    const approval = await approvalService.createApprovalRequest({
      actionType: 'gpio_pulse',
      ownerId: 'owner_1',
      payload: input
    });

    const result = await toolExecutor.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input,
      principal: { id: 'owner_1', isOwner: true },
      approvalToken: approval.token!,
      approvalId: approval.approvalId
    });

    assert.equal(result.success, true);
    assert.ok(result.auditId);

    // Verify audit log recorded
    const audits = toolExecutor.getAuditEvents();
    assert.ok(audits.some((a) => a.id === result.auditId && a.toolName === 'gpio_pulse'));
  });

  test('Sovereign ULTRON Autonomy: ULTRON executes strategic adversarial scan without requiring approval', async () => {
    const result = await toolExecutor.executeTool({
      agentId: 'ULTRON',
      toolName: 'adversarial_audit',
      input: { target: 'quantum_arc_reactor_boundary', depth: 'deep' },
      principal: { id: 'system_core', isOwner: true }
    });

    assert.equal(result.success, true);
    assert.equal(result.requiresApproval, undefined);
    assert.match((result.result as any).invariantSummary, /sovereign red-team assessment verified/i);
  });
});

