import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app/app.js';
import { parseEnv } from '../src/config/env.js';

describe('Backend Foundation — Health, Readiness & OpenAPI Spec', () => {
  let app: FastifyInstance;

  before(async () => {
    const testConfig = parseEnv({
      NODE_ENV: 'test',
      PORT: 3002,
      LOG_LEVEL: 'silent'
    });
    app = await buildApp(testConfig);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /health responds with 200 and healthy telemetry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.status, 'healthy');
    assert.strictEqual(typeof body.uptimeSeconds, 'number');
    assert.strictEqual(typeof body.memory, 'object');
    assert.strictEqual(typeof body.persistence, 'object');
    assert.strictEqual(body.persistence.connected, true);
  });

  test('GET /ready responds with 200 and ready: true', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ready'
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.ready, true);
  });

  test('GET /live responds with 200 and alive: true', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/live'
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.alive, true);
  });

  test('GET /docs loads OpenAPI Swagger UI documentation', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/docs'
    });

    // Swagger UI either returns 200 or 302 redirect to /docs/
    assert.ok(res.statusCode === 200 || res.statusCode === 302);
  });

  test('GET /unknown-route returns clean 404 JSON', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/non-existent'
    });

    assert.strictEqual(res.statusCode, 404);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.statusCode, 404);
    assert.strictEqual(body.error, 'Not Found');
  });
});
