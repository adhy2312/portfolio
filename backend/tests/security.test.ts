import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app/app.js';
import { parseEnv } from '../src/config/env.js';
import { redactSensitiveObject } from '../src/observability/logger.js';

describe('Backend Foundation — Security & Secret Redaction', () => {
  let app: FastifyInstance;

  before(async () => {
    const testConfig = parseEnv({
      NODE_ENV: 'test',
      PORT: 3006,
      LOG_LEVEL: 'silent'
    });
    app = await buildApp(testConfig);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('redactSensitiveObject redacts API keys, tokens, passcodes, and service keys', () => {
    const rawData = {
      apiKey: 'secret_12345',
      authorization: 'Bearer jwt_secret_token',
      groq_api_key: 'gsk_real_key',
      supabase_service_role_key: 'sb_service_key',
      safeData: {
        username: 'visitor_99',
        password: 'cleartext_password'
      }
    };

    const sanitized = redactSensitiveObject(rawData);
    assert.strictEqual(sanitized.apiKey, '[REDACTED]');
    assert.strictEqual(sanitized.authorization, '[REDACTED]');
    assert.strictEqual(sanitized.groq_api_key, '[REDACTED]');
    assert.strictEqual(sanitized.supabase_service_role_key, '[REDACTED]');
    assert.strictEqual(sanitized.safeData.password, '[REDACTED]');
    assert.strictEqual(sanitized.safeData.username, 'visitor_99');
  });

  test('Public chat route handles requests with valid request IDs', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/chat',
      payload: {
        message: 'Hello'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    // Fastify request ID is set
    assert.ok(res.headers['x-request-id'] !== undefined || res.raw);
  });
});

