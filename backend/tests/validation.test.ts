import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app/app.js';
import { parseEnv } from '../src/config/env.js';

describe('Backend Foundation — Schema & Payload Validation', () => {
  let app: FastifyInstance;

  before(async () => {
    const testConfig = parseEnv({
      NODE_ENV: 'test',
      PORT: 3004,
      LOG_LEVEL: 'silent'
    });
    app = await buildApp(testConfig);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('Valid chat payload returns 200 with structured response', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/chat',
      payload: {
        message: 'Tell me about Adhithya projects and background.',
        sessionId: 'test_session_123'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.reply.includes('Mini-Adhy'));
    assert.strictEqual(body.domain, 'PUBLIC_VISITOR_SANDBOX');
  });

  test('Empty message fails with 400 Bad Request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/chat',
      payload: {
        message: '   '
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.statusCode, 400);
    assert.ok(body.message.includes('cannot be empty'));
  });

  test('Message exceeding 2000 characters fails with 400 Bad Request', async () => {
    const longMessage = 'A'.repeat(2005);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/chat',
      payload: {
        message: longMessage
      }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.statusCode, 400);
    assert.ok(body.message.includes('2000'));
  });

  test('Prototype pollution payload fails with 400 Bad Request', async () => {
    const maliciousPayload = {
      constructor: { prototype: { polluted: true } },
      message: 'hello'
    };
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/chat',
      payload: maliciousPayload
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.payload);
    assert.ok(body.message.toLowerCase().includes('forbidden') || body.message.toLowerCase().includes('prototype'));
  });
});
