import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app/app.js';
import { parseEnv } from '../src/config/env.js';
import { tokenCipher } from '../src/security/encryption.js';

describe('PROMPT 2 — Access Separation & Owner Identity Boundary', () => {
  let app: FastifyInstance;
  const testSecret = 'test_jwt_secret_key_super_secure_32_bytes!';
  const ownerEmail = 'adhithyamohan2312@gmail.com';
  const strangerEmail = 'stranger_attacker@example.com';

  // Helper to generate test JWTs signed with HMAC-SHA256
  function createSignedJwt(payload: Record<string, unknown>, secret = testSecret): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  before(async () => {
    const testConfig = parseEnv({
      NODE_ENV: 'test',
      PORT: 3010,
      LOG_LEVEL: 'silent',
      SUPABASE_JWT_SECRET: testSecret,
      OWNER_EMAILS: ownerEmail
    });
    app = await buildApp(testConfig);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  // ── Public Access (Domain A) ─────────────────────────────────────────

  test('Public visitor can read approved portfolio knowledge', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/knowledge'
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.knowledge));
    assert.ok(body.knowledge.length >= 2);
  });

  test('Public visitor can create conversation session and read own history', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/public/conversations',
      payload: { title: 'Visitor Inquiry' }
    });

    assert.strictEqual(createRes.statusCode, 201);
    const createBody = JSON.parse(createRes.payload);
    const convId = createBody.conversationId;
    const sessionToken = createBody.visitorSessionToken;
    assert.ok(convId);
    assert.ok(sessionToken);

    // Read with matching session header
    const readRes = await app.inject({
      method: 'GET',
      url: `/api/v1/public/conversations/${convId}`,
      headers: { 'x-visitor-session-id': sessionToken }
    });

    assert.strictEqual(readRes.statusCode, 200);
    const readBody = JSON.parse(readRes.payload);
    assert.strictEqual(readBody.conversation.id, convId);
  });

  test('Public visitor B is DENIED (403) when trying to access Visitor A conversation', async () => {
    // Visitor A creates conversation
    const createResA = await app.inject({
      method: 'POST',
      url: '/api/v1/public/conversations',
      payload: { title: 'Victim Private Session' }
    });
    const bodyA = JSON.parse(createResA.payload);
    const convIdA = bodyA.conversationId;

    // Visitor B creates separate conversation
    const createResB = await app.inject({
      method: 'POST',
      url: '/api/v1/public/conversations',
      payload: { title: 'Attacker Private Session' }
    });
    const bodyB = JSON.parse(createResB.payload);
    const sessionTokenB = bodyB.visitorSessionToken;

    // Attacker Visitor B attempts access to Visitor A's conversation
    const crossRes = await app.inject({
      method: 'GET',
      url: `/api/v1/public/conversations/${convIdA}`,
      headers: { 'x-visitor-session-id': sessionTokenB }
    });

    assert.strictEqual(crossRes.statusCode, 403);
    const body = JSON.parse(crossRes.payload);
    assert.strictEqual(body.error, 'Forbidden');
    assert.ok(body.message.includes('do not own this public conversation'));
  });

  // ── Owner Boundary Deny-By-Default ───────────────────────────────────

  test('Unauthenticated public visitor is strictly DENIED (401) on owner routes', async () => {
    const routes = [
      '/api/v1/owner/profile',
      '/api/v1/owner/memories',
      '/api/v1/owner/tasks',
      '/api/v1/owner/approvals',
      '/api/v1/owner/integrations',
      '/api/v1/owner/diagnostics'
    ];

    for (const url of routes) {
      const res = await app.inject({
        method: 'GET',
        url
      });
      assert.strictEqual(res.statusCode, 401, `Route ${url} should reject unauthenticated visitor`);
      const body = JSON.parse(res.payload);
      assert.strictEqual(body.error, 'Unauthorized');
    }
  });

  test('Caller attempting to pass role=owner or isOwner=true in body without valid JWT is rejected (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/owner/memories',
      payload: {
        role: 'owner',
        isOwner: true,
        operatorIdentity: 'adhithya',
        category: 'FACT',
        content: 'Tampered injected memory'
      }
    });

    assert.strictEqual(res.statusCode, 401);
  });

  test('Attacker with forged/tampered JWT signature is strictly DENIED (401)', async () => {
    // Sign with WRONG secret
    const forgedToken = createSignedJwt({
      sub: 'usr_attacker',
      email: ownerEmail,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    }, 'attacker_rogue_secret_key');

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/profile',
      headers: {
        authorization: `Bearer ${forgedToken}`
      }
    });

    assert.strictEqual(res.statusCode, 401);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.message, 'Invalid or expired authentication token.');
  });

  test('Attacker with expired JWT is strictly DENIED (401)', async () => {
    const expiredToken = createSignedJwt({
      sub: 'usr_owner',
      email: ownerEmail,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) - 100 // Expired 100 seconds ago
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/profile',
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    });

    assert.strictEqual(res.statusCode, 401);
  });

  test('Authenticated non-owner user is DENIED (403) from accessing owner capabilities', async () => {
    // Valid signature, valid aud and exp, but non-owner email
    const nonOwnerToken = createSignedJwt({
      sub: 'usr_stranger_123',
      email: strangerEmail,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/profile',
      headers: {
        authorization: `Bearer ${nonOwnerToken}`
      }
    });

    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.error, 'Forbidden');
    assert.ok(body.message.includes('not authorized as the verified system owner'));
  });

  // ── Verified Owner Access (Domain B) ─────────────────────────────────

  test('Verified authenticated owner is GRANTED (200) access to private capabilities', async () => {
    const validOwnerToken = createSignedJwt({
      sub: 'usr_adhithya_mohan_verified',
      email: ownerEmail,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    // 1. Profile
    const profileRes = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/profile',
      headers: { authorization: `Bearer ${validOwnerToken}` }
    });
    assert.strictEqual(profileRes.statusCode, 200);
    assert.strictEqual(JSON.parse(profileRes.payload).email, ownerEmail);

    // 2. Private Memory Store & Query
    const storeRes = await app.inject({
      method: 'POST',
      url: '/api/v1/owner/memories',
      headers: { authorization: `Bearer ${validOwnerToken}` },
      payload: {
        category: 'SEMANTIC_MEMORY',
        content: 'Project Neural Architecture Specification v2',
        confidence: 0.99
      }
    });
    assert.strictEqual(storeRes.statusCode, 201);
    const memId = JSON.parse(storeRes.payload).memory.id;
    assert.ok(memId);

    const queryRes = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/memories?q=Neural',
      headers: { authorization: `Bearer ${validOwnerToken}` }
    });
    assert.strictEqual(queryRes.statusCode, 200);
    const queryBody = JSON.parse(queryRes.payload);
    assert.ok(queryBody.count >= 1);

    // 3. Approvals inbox & atomic consumption
    const appReq = await (app as any).approvalService.createApprovalRequest({
      actionType: 'DEPLOY_PRODUCTION_PATCH',
      ownerId: 'usr_adhithya_mohan_verified',
      payload: { patch: 'v2' }
    });

    const approvalsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/approvals',
      headers: { authorization: `Bearer ${validOwnerToken}` }
    });
    assert.strictEqual(approvalsRes.statusCode, 200);

    const consumeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/owner/approvals/${appReq.approvalId}/consume`,
      headers: { authorization: `Bearer ${validOwnerToken}` },
      payload: { token: appReq.token }
    });
    assert.strictEqual(consumeRes.statusCode, 200);
    assert.strictEqual(JSON.parse(consumeRes.payload).status, 'CONSUMED');

    // 4. Integrations overview (Zero plaintext secrets)
    const intRes = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/integrations',
      headers: { authorization: `Bearer ${validOwnerToken}` }
    });
    assert.strictEqual(intRes.statusCode, 200);
    const intBody = JSON.parse(intRes.payload);
    assert.ok(intBody.integrations.length >= 2);
    // Ensure no raw token secrets leaked
    assert.strictEqual(JSON.stringify(intBody).includes('sample_oauth_token_secret'), false);
  });

  // ── Integration Token Encryption ─────────────────────────────────────

  test('TokenCipher: AES-256-GCM round-trip encryption and anti-tampering verification', () => {
    const rawSecret = 'gho_secret_github_personal_access_token_999';
    const encrypted = tokenCipher.encrypt(rawSecret);

    assert.ok(encrypted.includes(':'));
    assert.notStrictEqual(encrypted, rawSecret);

    const decrypted = tokenCipher.decrypt(encrypted);
    assert.strictEqual(decrypted, rawSecret);

    // Tampered ciphertext fails
    const tampered = encrypted.substring(0, encrypted.length - 4) + '0000';
    assert.throws(() => {
      tokenCipher.decrypt(tampered);
    });
  });

  // ── Strict JWT Claims & Algorithm Verification ───────────────────────

  test('Attacker with alg=none JWT is strictly DENIED (401)', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({
      sub: 'usr_hacker',
      email: ownerEmail,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const unsignedJwt = `${header}.${body}.`;

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/profile',
      headers: { authorization: `Bearer ${unsignedJwt}` }
    });
    assert.strictEqual(res.statusCode, 401);
  });

  test('Attacker with unsupported algorithm (RS256) without matching key is DENIED (401)', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({
      sub: 'usr_hacker',
      email: ownerEmail,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const fakeSig = Buffer.from('fake_rsa_signature').toString('base64url');
    const badAlgJwt = `${header}.${body}.${fakeSig}`;

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/profile',
      headers: { authorization: `Bearer ${badAlgJwt}` }
    });
    assert.strictEqual(res.statusCode, 401);
  });

  test('JWT with invalid audience (aud=public) is strictly DENIED (401)', async () => {
    const badAudJwt = createSignedJwt({
      sub: 'usr_adhithya',
      email: ownerEmail,
      aud: 'public', // Must be 'authenticated'
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/owner/profile',
      headers: { authorization: `Bearer ${badAudJwt}` }
    });
    assert.strictEqual(res.statusCode, 401);
  });

  test('Production configuration without SUPABASE_JWT_SECRET fails closed', () => {
    const prodConfig = parseEnv({
      NODE_ENV: 'production',
      PORT: 3010,
      LOG_LEVEL: 'silent',
      SUPABASE_URL: 'https://test-prod.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_role_key_long_enough_32',
      APPROVAL_SIGNING_SECRET: 'test_approval_signing_secret_32_bytes_long',
      VISITOR_SESSION_SIGNING_SECRET: 'test_visitor_secret_min_32_chars_12345'
      // No SUPABASE_JWT_SECRET
    });
    const { IdentityAuthService } = require('../src/auth/identity.js');
    const { SupabaseAdapter } = require('../src/auth/supabase.js');
    const dbAdapter = new SupabaseAdapter(prodConfig);
    const authService = new IdentityAuthService(prodConfig, dbAdapter);

    // Any cryptographic JWT verification must fail closed
    const validOwnerToken = createSignedJwt({
      sub: 'usr_adhithya_mohan_verified',
      email: ownerEmail,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    const verified = authService.verifyJwtCryptographically(validOwnerToken);
    assert.strictEqual(verified, null);
  });
});

