import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app/app.js';
import { parseEnv } from '../src/config/env.js';

describe('Backend Foundation — CORS Policy Enforcement', () => {
  let app: FastifyInstance;

  before(async () => {
    const testConfig = parseEnv({
      NODE_ENV: 'test',
      PORT: 3003,
      LOG_LEVEL: 'silent',
      ALLOWED_ORIGINS: 'http://localhost:3000,https://adhy.tech'
    });
    app = await buildApp(testConfig);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('CORS allows requests from approved origin (https://adhy.tech)', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'https://adhy.tech',
        'access-control-request-method': 'GET'
      }
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://adhy.tech');
  });

  test('CORS rejects unapproved origin with 500 error', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'https://unauthorized-malicious-site.com',
        'access-control-request-method': 'GET'
      }
    });

    // Fastify CORS throws an error when origin callback returns false
    assert.notStrictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
  });
});

