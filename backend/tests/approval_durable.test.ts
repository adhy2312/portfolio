import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app/app.js';
import { parseEnv } from '../src/config/env.js';
import { DurableApprovalService } from '../src/approvals/durableApprovalService.js';
import { SupabaseAdapter } from '../src/auth/supabase.js';

describe('PRIORITY ZERO — Durable Approval Lifecycle & Cryptographic Verification', () => {
  let app: FastifyInstance;
  let approvalService: DurableApprovalService;
  const testSecret = 'test_jwt_secret_key_super_secure_32_bytes!';
  const ownerId = 'usr_owner_verified_123';
  const ownerEmail = 'adhithyamohan2312@gmail.com';

  function createSignedJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', testSecret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  const validOwnerJwt = createSignedJwt({
    sub: ownerId,
    email: ownerEmail,
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600
  });

  before(async () => {
    const testConfig = parseEnv({
      NODE_ENV: 'test',
      PORT: 3020,
      LOG_LEVEL: 'silent',
      SUPABASE_JWT_SECRET: testSecret,
      OWNER_USER_ID: ownerId,
      OWNER_EMAILS: ownerEmail,
      ENCRYPTION_SECRET: 'test_encryption_secret_32_bytes_len!'
    });
    const dbAdapter = new SupabaseAdapter(testConfig);
    approvalService = new DurableApprovalService(testConfig, dbAdapter);

    app = await buildApp(testConfig);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('Valid approval request is created, bound to payload hash and owner', async () => {
    const payload = { target: 'production', release: 'v2.0.0', allowReboot: false };
    const request = await approvalService.createApprovalRequest({
      actionType: 'RESTRICTED_DEPLOY',
      ownerId,
      payload
    });

    assert.ok(request.approvalId.startsWith('appr_'));
    assert.ok(request.token);
    assert.ok(request.token.startsWith('sat.') || request.token.startsWith('sat_'));
    assert.strictEqual(request.status, 'PENDING_OWNER_APPROVAL');
    assert.strictEqual(request.ownerId, ownerId);
    assert.strictEqual(request.payloadHash.length, 64);
  });

  test('Consumer with valid token, matching payload and matching owner succeeds atomically', async () => {
    const payload = { op: 'reboot_cluster', clusterId: 'c1' };
    const request = await approvalService.createApprovalRequest({
      actionType: 'CLUSTER_REBOOT',
      ownerId,
      payload
    });

    const result = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      actionType: 'CLUSTER_REBOOT',
      payload,
      ownerId
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'CONSUMED');
  });

  test('Modified / tampered payload is strictly REJECTED (PAYLOAD_HASH_MISMATCH_TAMPERED)', async () => {
    const originalPayload = { op: 'grant_access', userId: 'user_42', role: 'viewer' };
    const request = await approvalService.createApprovalRequest({
      actionType: 'GRANT_ROLE',
      ownerId,
      payload: originalPayload
    });

    // Attacker modifies payload to gain admin
    const tamperedPayload = { op: 'grant_access', userId: 'user_42', role: 'admin' };
    const result = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      actionType: 'GRANT_ROLE',
      payload: tamperedPayload,
      ownerId
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'PAYLOAD_HASH_MISMATCH_TAMPERED');
  });

  test('Replayed token is strictly REJECTED (TOKEN_ALREADY_USED)', async () => {
    const payload = { command: 'flush_cache' };
    const request = await approvalService.createApprovalRequest({
      actionType: 'FLUSH_CACHE',
      ownerId,
      payload
    });

    // First consumption: Success
    const firstUse = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      payload,
      ownerId
    });
    assert.strictEqual(firstUse.success, true);

    // Second consumption (Replay): Strictly Rejected
    const secondUse = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      payload,
      ownerId
    });
    assert.strictEqual(secondUse.success, false);
    assert.strictEqual(secondUse.reason, 'TOKEN_ALREADY_USED');
  });

  test('Wrong owner identity attempting to consume token is REJECTED', async () => {
    const payload = { target: 'database' };
    const request = await approvalService.createApprovalRequest({
      actionType: 'MIGRATE_DB',
      ownerId,
      payload
    });

    const result = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      payload,
      ownerId: 'usr_different_attacker_999'
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'OWNER_MISMATCH');
  });

  test('Expired approval token is strictly REJECTED (TOKEN_EXPIRED)', async () => {
    const payload = { op: 'short_lived_action' };
    const request = await approvalService.createApprovalRequest({
      actionType: 'TIMED_ACTION',
      ownerId,
      payload,
      ttlMs: -1000 // Already expired
    });

    const result = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: request.token!,
      payload,
      ownerId
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'TOKEN_EXPIRED');
  });

  test('Forged token with invalid HMAC signature is REJECTED (INVALID_TOKEN_SIGNATURE)', async () => {
    const payload = { target: 'host' };
    const request = await approvalService.createApprovalRequest({
      actionType: 'EXEC_HOST',
      ownerId,
      payload
    });

    // Tamper with the signature bytes in token
    const forgedToken = request.token!.substring(0, request.token!.length - 8) + 'abcdef01';
    const result = await approvalService.consumeApprovalToken({
      approvalId: request.approvalId,
      token: forgedToken,
      payload,
      ownerId
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'INVALID_TOKEN_SIGNATURE');
  });
});
