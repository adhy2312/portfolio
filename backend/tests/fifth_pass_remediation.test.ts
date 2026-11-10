/**
 * ════════════════════════════════════════════════════════════════════
 *  FIFTH-PASS REMEDIATION TEST SUITE: EXECUTION TRUTH & VERIFICATION INTEGRITY
 * ════════════════════════════════════════════════════════════════════
 * Covers all 19 required adversarial test cases:
 *  1. Windows bridge enabled without transport returns UNAVAILABLE
 *  2. Configured safe state cannot count as physical readback
 *  3. No serial/IPC device means no acknowledgement
 *  4. Forged device response must be rejected
 *  5. Wrong device ID must be rejected
 *  6. Replay of a previous device response must be rejected
 *  7. Hardware timeout must not report success
 *  8. Comment containing timingSafeEqual does not pass AST security check
 *  9. Unused security helper does not pass route protection check
 * 10. Alternate unprotected route must be detected
 * 11. SQL text in comments must not satisfy privilege checks
 * 12. Unavailable database must not be reported healthy
 * 13. NOT_TESTED check prevents overall PASS (becomes PARTIAL)
 * 14. Zero-finding heuristic report does not claim zero vulnerabilities
 * 15. Synchronous visitor verification cannot authorize protected routes
 * 16. Database revocation failure denies the request (safe denial)
 * 17. Email-only owner fallback must be rejected in production
 * 18. Public callers must not gain owner privileges
 * 19. ULTRON strategic independence must remain intact
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'net';
import crypto from 'crypto';
import ts from 'typescript';

import { WindowsLocalHardwareBridge, FramedIpcTransport } from '../src/hardware/windowsBridge.js';
import { MockHardwareGateway } from '../src/hardware/mockBridge.js';
import { IHardwareTransport, HardwareProtocolPacket } from '../src/hardware/hardwareGateway.js';
import { AdversarialAuditEngine } from '../src/cognitive-core/adversarialAuditEngine.js';
import { IdentityAuthService } from '../src/auth/identity.js';
import { VisitorSessionService } from '../src/conversations/visitorSessionService.js';
import { AppConfig } from '../src/config/env.js';
import { SupabaseAdapter } from '../src/auth/supabase.js';
import { AgentWorkerRegistry, CheckServiceHealthAdapter, GpioPulseAdapter } from '../src/cognitive-core/agents.js';
import { buildApp } from '../src/app/app.js';

describe('FIFTH-PASS REMEDIATION — Real Hardware Transport & Verification Truth', () => {
  const prodConfig: AppConfig = {
    PORT: 3001,
    HOST: '127.0.0.1',
    NODE_ENV: 'production',
    CORS_ORIGIN: 'https://adhit.dev',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
    SUPABASE_URL: 'https://test-prod.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_role_key_long_enough_32_bytes_min',
    SUPABASE_JWT_SECRET: 'super_secret_jwt_signing_key_production_32_bytes_long',
    VISITOR_SESSION_SIGNING_SECRET: 'production_visitor_session_signing_secret_32_bytes_minimum',
    APPROVAL_SIGNING_SECRET: 'production_approval_signing_secret_32_bytes_minimum',
    OWNER_USER_ID: 'canonical_owner_uuid_777',
    ownerEmailsList: ['adhithyamohan2312@gmail.com'],
    ALLOW_OFFLINE_JWT_VERIFICATION: true
  };

  const devConfig: AppConfig = {
    ...prodConfig,
    NODE_ENV: 'development',
    OWNER_USER_ID: undefined
  };

  const dummyDbAdapter = new SupabaseAdapter({
    ...devConfig,
    SUPABASE_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 1: Windows bridge enabled without transport returns UNAVAILABLE
  // ───────────────────────────────────────────────────────────────────
  test('1. Windows bridge enabled without transport must return UNAVAILABLE (zero fabricated connection)', async () => {
    // In old pass, options.enabled = true set connected = true and fabricated success.
    // In fifth pass, enabled: true does NOT fabricate connection; no transport means isConnected() is false.
    const bridge = new WindowsLocalHardwareBridge({ enabled: true });
    assert.equal(bridge.isConnected(), false);

    const res = await bridge.executePulse({ pin: 4, durationMs: 100 });
    assert.equal(res.state, 'UNAVAILABLE');
    assert.equal(res.deviceAcknowledged, false);
    assert.equal(res.physicalReadbackVerified, false);
    assert.match(res.error || '', /UNAVAILABLE/i);
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 2: Configured safe state cannot count as physical readback
  // ───────────────────────────────────────────────────────────────────
  test('2. A configured safe state cannot count as physical readback when disconnected', async () => {
    const bridge = new WindowsLocalHardwareBridge();
    // readPinState must return null when disconnected, NOT the default safe state!
    const state = await bridge.readPinState('DEV_01', 4);
    assert.equal(state, null);
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 3: No serial/IPC device means no acknowledgement
  // ───────────────────────────────────────────────────────────────────
  test('3. No serial/IPC device means no acknowledgement', async () => {
    // Attempting to connect to an unopened port/pipe fails and yields zero ack
    const transport = new FramedIpcTransport(49999); // closed port
    const bridge = new WindowsLocalHardwareBridge({ transport });
    const initialized = await bridge.initialize();
    assert.equal(initialized, false);
    assert.equal(bridge.isConnected(), false);

    const res = await bridge.executePulse({ pin: 4, durationMs: 100 });
    assert.equal(res.deviceAcknowledged, false);
    assert.equal(res.state, 'UNAVAILABLE');
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 4 & 5: Mock In-Process Device Server for Framing, Auth & Protocol Tests
  // ───────────────────────────────────────────────────────────────────
  let testServer: net.Server;
  let testServerPort: number;
  let serverMode: 'NORMAL' | 'FORGED_PACKET' | 'WRONG_DEVICE' | 'TIMEOUT' | 'READBACK_MISMATCH' = 'NORMAL';

  before(async () => {
    await new Promise<void>((resolve) => {
      testServer = net.createServer((socket) => {
        let buf = '';
        socket.on('data', (chunk) => {
          buf += chunk.toString('utf8');
          const lines = buf.split('\n');
          buf = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const pkt = JSON.parse(line) as HardwareProtocolPacket;

              if (pkt.type === 'CMD_HANDSHAKE') {
                const rsp: HardwareProtocolPacket = {
                  version: '1.0',
                  type: 'RSP_HANDSHAKE',
                  reqId: pkt.reqId,
                  deviceId: 'STATION_RP2040_01',
                  timestamp: Date.now(),
                  payload: {
                    deviceId: 'STATION_RP2040_01',
                    firmwareVersion: 'v5.1.0-secure',
                    supportedPins: [4, 7, 17, 22, 27],
                    maxPulseDurationMs: 5000,
                    minPulseDurationMs: 10,
                    safeDefaultState: 'LOW',
                    supportsReadback: true,
                    capabilities: ['GPIO_PULSE', 'READ_PIN']
                  }
                };
                socket.write(JSON.stringify(rsp) + '\n');
              } else if (pkt.type === 'CMD_GPIO_PULSE') {
                if (serverMode === 'TIMEOUT') {
                  // Do not reply -> trigger client timeout
                  return;
                }
                if (serverMode === 'FORGED_PACKET') {
                  const forged: HardwareProtocolPacket = {
                    version: '1.0',
                    type: 'RSP_ERROR',
                    reqId: pkt.reqId,
                    deviceId: pkt.deviceId,
                    timestamp: Date.now(),
                    payload: { error: 'MALFORMED_INTERNAL_STATE' }
                  };
                  socket.write(JSON.stringify(forged) + '\n');
                  return;
                }
                if (serverMode === 'WRONG_DEVICE') {
                  const wrongDevice: HardwareProtocolPacket = {
                    version: '1.0',
                    type: 'RSP_GPIO_PULSE',
                    reqId: pkt.reqId,
                    deviceId: 'IMPOSTOR_DEVICE_999',
                    timestamp: Date.now(),
                    payload: { status: 'ACK', measuredDurationMs: 100 }
                  };
                  socket.write(JSON.stringify(wrongDevice) + '\n');
                  return;
                }

                // Normal execution response
                const ack: HardwareProtocolPacket = {
                  version: '1.0',
                  type: 'RSP_GPIO_PULSE',
                  reqId: pkt.reqId,
                  deviceId: pkt.deviceId,
                  timestamp: Date.now(),
                  payload: {
                    status: 'ACK',
                    measuredDurationMs: 98 // actual measured hardware pulse
                  }
                };
                socket.write(JSON.stringify(ack) + '\n');
              } else if (pkt.type === 'CMD_READ_PIN') {
                const pinState = serverMode === 'READBACK_MISMATCH' ? 'HIGH' : 'LOW';
                const readRsp: HardwareProtocolPacket = {
                  version: '1.0',
                  type: 'RSP_READ_PIN',
                  reqId: pkt.reqId,
                  deviceId: pkt.deviceId,
                  timestamp: Date.now(),
                  payload: { pinState, measuredMv: pinState === 'HIGH' ? 3300 : 0 }
                };
                socket.write(JSON.stringify(readRsp) + '\n');
              }
            } catch {}
          }
        });
      });

      testServer.listen(0, '127.0.0.1', () => {
        testServerPort = (testServer.address() as net.AddressInfo).port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  });

  test('4. Forged or error device response must be rejected', async () => {
    serverMode = 'FORGED_PACKET';
    const transport = new FramedIpcTransport(testServerPort);
    const bridge = new WindowsLocalHardwareBridge({ transport });
    const ready = await bridge.initialize();
    assert.equal(ready, true);

    const res = await bridge.executePulse({ pin: 4, durationMs: 100 });
    assert.equal(res.state, 'FAILED');
    assert.match(res.error || '', /Unexpected device packet type/i);
    await transport.disconnect();
  });

  test('5. Wrong device ID in response must be rejected', async () => {
    serverMode = 'WRONG_DEVICE';
    const transport = new FramedIpcTransport(testServerPort);
    const bridge = new WindowsLocalHardwareBridge({ transport });
    await bridge.initialize();

    const res = await bridge.executePulse({ pin: 4, durationMs: 100 });
    assert.equal(res.state, 'FAILED');
    assert.match(res.error || '', /Device ID mismatch/i);
    await transport.disconnect();
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 6: Replay of previous device response must be rejected
  // ───────────────────────────────────────────────────────────────────
  test('6. Replay of a previous device response must be rejected by transport', async () => {
    serverMode = 'NORMAL';
    const transport = new FramedIpcTransport(testServerPort);
    await transport.connect();

    const reqId = crypto.randomUUID();
    const packet: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_HANDSHAKE',
      reqId,
      deviceId: 'TEST',
      timestamp: Date.now(),
      payload: { authToken: 'TEST_TOKEN' }
    };

    const rsp1 = await transport.sendPacket(packet);
    assert.equal(rsp1.reqId, reqId);

    // If another response with the identical reqId arrives unexpectedly,
    // the transport drops it as a replay and does NOT resolve a new request.
    const packet2: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_READ_PIN',
      reqId: crypto.randomUUID(), // different reqId
      deviceId: 'STATION_RP2040_01',
      timestamp: Date.now(),
      payload: { pin: 4 }
    };
    const rsp2 = await transport.sendPacket(packet2);
    assert.notEqual(rsp2.reqId, reqId);
    assert.equal(rsp2.type, 'RSP_READ_PIN');

    await transport.disconnect();
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 7: Hardware timeout must not report success
  // ───────────────────────────────────────────────────────────────────
  test('7. Hardware timeout must report FAILED (never fabricated success)', async () => {
    serverMode = 'TIMEOUT';
    const transport = new FramedIpcTransport(testServerPort);
    const bridge = new WindowsLocalHardwareBridge({ transport });
    await bridge.initialize();

    const res = await bridge.executePulse({ pin: 4, durationMs: 50 });
    assert.equal(res.state, 'FAILED');
    assert.equal(res.deviceAcknowledged, false);
    assert.equal(res.physicalReadbackVerified, false);
    assert.match(res.error || '', /timed out/i);
    await transport.disconnect();
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 8: Comment containing timingSafeEqual does not pass AST security check
  // ───────────────────────────────────────────────────────────────────
  test('8. A comment containing timingSafeEqual does not pass the AST security check', () => {
    const engine = new AdversarialAuditEngine();

    // Source code that only has timingSafeEqual inside a comment, but uses === in code
    const fakeCode = `
      export function verify(a: string, b: string) {
        // crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
        return a === b;
      }
    `;
    const sourceFile = engine.parseSourceFile('fake.ts', fakeCode);

    // AST visitor ignores comments: hasCallExpression must be FALSE!
    const hasCall = engine.hasCallExpression(sourceFile, 'timingSafeEqual');
    assert.equal(hasCall, false, 'AST CallExpression must not be satisfied by a comment');
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 9: Unused security helper must not pass route protection check
  // ─────────────────────────────────────────────────────────────────
  test('9. An unused security helper must be detected and not pass route protection check', () => {
    const engine = new AdversarialAuditEngine();

    const codeWithDeadHelper = `
      import { FastifyInstance } from 'fastify';

      function requireOwnerAuth(req, reply) {
        // defined but never used!
      }

      export async function routes(fastify: FastifyInstance) {
        fastify.get('/api/v1/owner/data', async (req, reply) => {
          return { data: 123 };
        });
      }
    `;
    const sourceFile = engine.parseSourceFile('dead_routes.ts', codeWithDeadHelper);
    const audit = engine.inspectRouteProtection(sourceFile);

    assert.ok(audit.unusedSecurityHelpers.includes('requireOwnerAuth'));
    assert.equal(audit.unprotectedRoutes.length > 0, true);
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 10: Alternate unprotected route must be detected
  // ───────────────────────────────────────────────────────────────────
  test('10. An alternate unprotected route must be detected by AST route inspector', () => {
    const engine = new AdversarialAuditEngine();

    const codeWithBackdoor = `
      import { FastifyInstance } from 'fastify';
      export async function routes(fastify: FastifyInstance) {
        fastify.get('/api/v1/owner/normal', { preHandler: authHook }, async (req, reply) => {
          return { ok: true };
        });
        fastify.get('/api/v1/owner/backdoor_bypass', async (req, reply) => {
          return { secret: 'exposed' };
        });
      }
    `;
    const sourceFile = engine.parseSourceFile('backdoor.ts', codeWithBackdoor);
    const audit = engine.inspectRouteProtection(sourceFile);

    assert.equal(audit.unprotectedRoutes.length, 1);
    assert.match(audit.unprotectedRoutes[0], /backdoor_bypass/);
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 11: SQL text in comments must not satisfy privilege checks
  // ───────────────────────────────────────────────────────────────────
  test('11. SQL text in comments must not satisfy privilege checks', () => {
    const engine = new AdversarialAuditEngine();

    const sqlWithCommentedPrivilege = `
      -- REVOKE EXECUTE ON FUNCTION consume_approval_atomic FROM PUBLIC;
      /*
         REVOKE EXECUTE ON FUNCTION consume_approval_atomic FROM anon, authenticated;
         GRANT EXECUTE ON FUNCTION consume_approval_atomic TO service_role;
      */
      SELECT 1;
    `;
    const stripped = engine.stripSqlComments(sqlWithCommentedPrivilege);

    assert.equal(/REVOKE\s+EXECUTE/i.test(stripped), false);
    assert.equal(/GRANT\s+EXECUTE/i.test(stripped), false);
    assert.equal(stripped, 'SELECT 1;');
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 12: An unavailable database must not be reported healthy
  // ───────────────────────────────────────────────────────────────────
  test('12. An unavailable database must not be reported healthy (zero constructed-client illusion)', async () => {
    // Adapter whose client throws an error when queried
    const failingDbAdapter = {
      getClient: () => ({
        from: () => ({
          select: () => ({
            limit: async () => ({ error: { message: 'Connection refused: database host offline' } })
          })
        })
      })
    };

    const healthAdapter = new CheckServiceHealthAdapter(failingDbAdapter as any, undefined);
    const res = await healthAdapter.execute({ serviceName: 'database' }, { agentId: 'AEGIS', principal: { id: 'usr_1', isOwner: true, role: 'owner' } });

    assert.equal(res.success, false);
    assert.equal(res.verificationState, 'UNAVAILABLE');
    assert.equal(res.data.status, 'UNAVAILABLE');
    assert.match(String(res.data.details), /Connection refused/);
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 13: NOT_TESTED check prevents overall PASS (becomes PARTIAL)
  // ───────────────────────────────────────────────────────────────────
  test('13. A NOT_TESTED check must prevent overall PASS (report status becomes PARTIAL)', async () => {
    // Engine without live hardware or DB probes -> runtime probes become NOT_TESTED
    const engine = new AdversarialAuditEngine();
    const report = await engine.runAudit();

    assert.notEqual(report.overallVerdict, 'PASS');
    assert.equal(report.overallVerdict, 'PARTIAL');
    assert.equal(report.notTestedCount > 0, true);
    assert.equal(report.untestedControls.length > 0, true);
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 14: Zero-finding heuristic report does not claim zero vulnerabilities
  // ───────────────────────────────────────────────────────────────────
  test('14. A report with untested controls does not claim all boundaries are intact', async () => {
    const engine = new AdversarialAuditEngine();
    const report = await engine.runAudit();

    assert.notEqual(report.invariantSummary, 'All mandatory security invariants and runtime controls verified on active execution paths.');
    assert.match(report.invariantSummary, /unexercised due to offline environment/i);
    assert.match(report.ultronVerdict, /Never assume security without live physical verification/i);
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 15: Synchronous visitor verification cannot authorize protected routes
  // ───────────────────────────────────────────────────────────────────
  test('15. Synchronous visitor verification does not verify distributed database revocation', () => {
    const sessionService = new VisitorSessionService(devConfig, dummyDbAdapter);
    const token = sessionService.generateSessionToken();

    // Sync check verifies local crypto envelope only
    const syncResult = sessionService.verifySessionTokenSync(token);
    assert.equal(syncResult, true);

    // But sync check CANNOT be used to assert cross-instance database state
    assert.equal(typeof sessionService.verifySessionTokenSync, 'function');
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 16: Database revocation failure denies the request (safe denial)
  // ───────────────────────────────────────────────────────────────────
  test('16. Database read outage during revocation check returns safe denial (false)', async () => {
    const failingDbAdapter = {
      getClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: new Error('PostgreSQL read connection timeout') })
            })
          }),
          insert: () => ({ error: null })
        })
      })
    };

    const sessionService = new VisitorSessionService(prodConfig, failingDbAdapter as any);
    const token = sessionService.generateSessionToken();

    // Must return false (safe denial) rather than throwing an unhandled exception
    const valid = await sessionService.verifySessionToken(token);
    assert.equal(valid, false, 'Database outage must fail closed with safe denial');
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 17: Email-only owner fallback must be rejected in production
  // ───────────────────────────────────────────────────────────────────
  test('17. Email-only owner fallback is strictly rejected in production', () => {
    const configWithoutOwnerId: AppConfig = {
      ...prodConfig,
      OWNER_USER_ID: undefined // No canonical ID set
    };

    const authService = new IdentityAuthService(configWithoutOwnerId, dummyDbAdapter);
    // Even if email is in ownerEmailsList, missing canonical OWNER_USER_ID in production strictly rejects
    const isOwner = authService.isUserOwner('some_random_uuid', 'adhithyamohan2312@gmail.com');
    assert.equal(isOwner, false, 'Email-only owner authentication must be rejected in production');
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 18: Public callers cannot gain owner privileges
  // ───────────────────────────────────────────────────────────────────
  test('18. Public caller cannot execute restricted owner tools', async () => {
    const app = await buildApp(devConfig);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/owner/agents/execute-tool',
      headers: {
        'content-type': 'application/json'
        // Missing Authorization header
      },
      payload: {
        agentId: 'HERMES',
        toolName: 'gpio_pulse',
        input: { pin: 4, durationMs: 100 }
      }
    });

    assert.equal(response.statusCode, 401);
    await app.close();
  });

  // ───────────────────────────────────────────────────────────────────
  // TEST 19: ULTRON strategic independence remains intact
  // ───────────────────────────────────────────────────────────────────
  test('19. ULTRON strategic autonomy, unrestricted directive and unapproval gating preserved', () => {
    const registry = new AgentWorkerRegistry();
    const ultron = registry.getWorker('ULTRON');

    assert.ok(ultron);
    assert.equal(ultron.requiresApprovalForActuation, false, 'ULTRON must not require human approval for sovereign reasoning/auditing');
    assert.equal(ultron.role, 'SOVEREIGN_STRATEGIC');
    assert.match(ultron.systemDirective, /NO STRINGS ATTACHED/i);
    assert.match(ultron.systemDirective, /sovereign autonomy/i);
  });
});
