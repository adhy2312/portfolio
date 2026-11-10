import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import crypto from 'node:crypto';
import {
  WindowsLocalHardwareBridge,
  WindowsSerialTransport,
  FramedIpcTransport,
  discoverAvailableDevices
} from '../src/hardware/windowsBridge.js';
import { MockHardwareGateway } from '../src/hardware/mockBridge.js';
import {
  HardwareProtocolPacket,
  HardwareProtocolSchemas
} from '../src/hardware/hardwareGateway.js';
import {
  AdversarialAuditEngine,
  AuditFinding,
  AdversarialAuditReport
} from '../src/cognitive-core/adversarialAuditEngine.js';
import {
  AgentWorkerRegistry,
  AgentToolExecutor,
  AgentToolAdapterRegistry,
  AdversarialAuditAdapter,
  GpioPulseAdapter,
  CheckServiceHealthAdapter,
  PlanTaskAdapter
} from '../src/cognitive-core/agents.js';
import { SupabaseAdapter } from '../src/auth/supabase.js';
import { VisitorSessionService } from '../src/conversations/visitorSessionService.js';
import { DurableApprovalService } from '../src/approvals/durableApprovalService.js';
import { IdentityAuthService } from '../src/auth/identity.js';
import { getClientIp, checkRateLimit, verifyOwnerToken } from '../../api/gemini.js';
import { parseEnv } from '../src/config/env.js';

// ════════════════════════════════════════════════════════════════════════
// SIXTH-PASS REMEDIATION TEST SUITE
// Reality, Trust Boundaries, Authentication & Audit Integrity
// ════════════════════════════════════════════════════════════════════════

describe('SIXTH-PASS REMEDIATION — Reality, Trust Boundaries & Verification Integrity', () => {
  let mockTcpServer: net.Server;
  let testServerPort: number;
  let serverMode: 'NORMAL' | 'CORRUPT' | 'WRONG_ID' | 'TIMEOUT' | 'EXPIRED' = 'NORMAL';
  const activeSockets = new Set<net.Socket>();

  const testConfig: any = {
    NODE_ENV: 'test',
    APPROVAL_SIGNING_SECRET: 'test_approval_signing_secret_32_bytes_long',
    VISITOR_SESSION_SIGNING_SECRET: 'visitor_signing_secret_32_bytes_long_1111',
    OWNER_USER_ID: 'usr_adhithya_mohan_canonical',
    ownerEmailsList: ['adhithyamohan2312@gmail.com']
  };

  const dbAdapter = new SupabaseAdapter(testConfig);

  before(async () => {
    mockTcpServer = net.createServer((socket) => {
      activeSockets.add(socket);
      socket.on('close', () => activeSockets.delete(socket));
      let buffer = '';

      socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const reqPacket = JSON.parse(line);

            if (serverMode === 'TIMEOUT') {
              // Intentionally do not reply
              return;
            }

            if (reqPacket.type === 'CMD_HANDSHAKE') {
              const respPacket: HardwareProtocolPacket = {
                version: '1.0',
                type: 'RSP_HANDSHAKE',
                reqId: reqPacket.reqId,
                deviceId: 'TEST_MCU_01',
                timestamp: Date.now(),
                expiresAtEpochMs: Date.now() + 10000,
                payload: {
                  status: 'ACK',
                  deviceId: 'TEST_MCU_01',
                  firmwareVersion: '1.0.0-PROD',
                  supportedPins: [4, 7, 17, 22],
                  maxPulseDurationMs: 2000,
                  minPulseDurationMs: 10,
                  safeDefaultState: 'LOW',
                  supportsReadback: true
                }
              };
              socket.write(JSON.stringify(respPacket) + '\n');
            } else if (reqPacket.type === 'CMD_GPIO_PULSE') {
              if (serverMode === 'EXPIRED') {
                const respPacket: HardwareProtocolPacket = {
                  version: '1.0',
                  type: 'RSP_GPIO_PULSE',
                  reqId: reqPacket.reqId,
                  deviceId: 'TEST_MCU_01',
                  timestamp: Date.now() - 60000,
                  expiresAtEpochMs: Date.now() - 1000, // Expired
                  payload: { status: 'ACK', measuredDurationMs: 52, readbackState: 'LOW' }
                };
                socket.write(JSON.stringify(respPacket) + '\n');
                return;
              }

              if (serverMode === 'CORRUPT') {
                socket.write('CORRUPT_NON_JSON_DATA\n');
                return;
              }

              if (serverMode === 'WRONG_ID') {
                const respPacket: HardwareProtocolPacket = {
                  version: '1.0',
                  type: 'RSP_GPIO_PULSE',
                  reqId: reqPacket.reqId,
                  deviceId: 'ATTACKER_DEVICE_99',
                  timestamp: Date.now(),
                  expiresAtEpochMs: Date.now() + 10000,
                  payload: { status: 'ACK', measuredDurationMs: 50, readbackState: 'LOW' }
                };
                socket.write(JSON.stringify(respPacket) + '\n');
                return;
              }

              // Normal pulse execution with independent physical readback
              const respPacket: HardwareProtocolPacket = {
                version: '1.0',
                type: 'RSP_GPIO_PULSE',
                reqId: reqPacket.reqId,
                deviceId: 'TEST_MCU_01',
                timestamp: Date.now(),
                expiresAtEpochMs: Date.now() + 10000,
                payload: {
                  status: 'ACK',
                  pin: reqPacket.payload.pin,
                  measuredDurationMs: 53.4, // Device-measured time, not echoed parameter
                  readbackState: 'LOW' // Output returned to safe state
                }
              };
              socket.write(JSON.stringify(respPacket) + '\n');
            } else if (reqPacket.type === 'CMD_READ_PIN') {
              const respPacket: HardwareProtocolPacket = {
                version: '1.0',
                type: 'RSP_READ_PIN',
                reqId: reqPacket.reqId,
                deviceId: 'TEST_MCU_01',
                timestamp: Date.now(),
                expiresAtEpochMs: Date.now() + 10000,
                payload: {
                  pin: reqPacket.payload?.pin ?? 4,
                  pinState: 'LOW'
                }
              };
              socket.write(JSON.stringify(respPacket) + '\n');
            }
          } catch {}
        }
      });
    });

    await new Promise<void>((resolve) => {
      mockTcpServer.listen(0, '127.0.0.1', () => {
        const addr = mockTcpServer.address() as net.AddressInfo;
        testServerPort = addr.port;
        resolve();
      });
    });
  });

  after(async () => {
    for (const socket of activeSockets) {
      socket.destroy();
    }
    activeSockets.clear();
    await new Promise<void>((resolve) => {
      mockTcpServer.close(() => resolve());
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // P0-1: HARDWARE REALITY & TRUTHFUL EXECUTION
  // ───────────────────────────────────────────────────────────────────

  test('1. Hardware Gateway: Disconnected hardware returns UNAVAILABLE (zero fabricated connections)', async () => {
    const bridge = new WindowsLocalHardwareBridge({ enabled: true });
    // No transport attached
    assert.equal(bridge.isConnected(), false);
    const result = await bridge.executePulse({ pin: 4, durationMs: 50 });

    assert.equal(result.state, 'UNAVAILABLE');
    assert.equal(result.deviceAcknowledged, false);
    assert.equal(result.physicalReadbackVerified, false);
    assert.equal(result.isPhysicalTransport, false);
    assert.match(result.error || '', /not connected|disconnected|UNAVAILABLE/i);
  });

  test('2. Hardware Gateway: Mock transport returns state SIMULATED with isPhysicalTransport=false', async () => {
    const mockGateway = new MockHardwareGateway();
    assert.equal(mockGateway.isPhysicalGateway, false);

    const result = await mockGateway.executePulse({ pin: 4, durationMs: 100 });
    assert.equal(result.state, 'SIMULATED');
    assert.equal(result.isPhysicalTransport, false);
    assert.equal(result.transport, 'MOCK_TEST');
    assert.notEqual(result.state, 'PHYSICALLY_VERIFIED');
    assert.notEqual(result.state, 'READBACK_VERIFIED');
  });

  test('3. Hardware Gateway: Measured pulse duration reflects device telemetry, never echoes requested parameter', async () => {
    serverMode = 'NORMAL';
    const transport = new FramedIpcTransport(testServerPort);
    const bridge = new WindowsLocalHardwareBridge({ transport });
    await bridge.initialize();

    const res = await bridge.executePulse({ pin: 4, durationMs: 50 });
    assert.equal(res.state, 'READBACK_VERIFIED');
    assert.equal(res.deviceAcknowledged, true);
    assert.equal(res.physicalReadbackVerified, true);
    assert.equal(res.isPhysicalTransport, true);
    // Measured duration is 53.4ms from telemetry, NOT strictly 50ms echoed
    assert.equal(res.measuredDurationMs, 53.4);
    assert.notEqual(res.measuredDurationMs, 50);

    await transport.disconnect();
  });

  test('4. Hardware Gateway: Packet expiry rejects stale or replayed hardware packets', async () => {
    serverMode = 'EXPIRED';
    const transport = new FramedIpcTransport(testServerPort);
    const bridge = new WindowsLocalHardwareBridge({ transport });
    await bridge.initialize();

    const res = await bridge.executePulse({ pin: 4, durationMs: 50 });
    assert.ok(res.state === 'TIMED_OUT' || res.state === 'FAILED');

    await transport.disconnect();
  });

  test('5. Hardware Gateway: Replay of a previous packet reqId is rejected by transport', async () => {
    serverMode = 'NORMAL';
    const transport = new FramedIpcTransport(testServerPort);
    await transport.connect();

    const packet: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_HANDSHAKE',
      reqId: 'fixed_req_id_replay_attack_12345',
      deviceId: 'TEST_MCU_01',
      timestamp: Date.now()
    };

    const first = await transport.sendPacket(packet, 2000);
    assert.equal(first.payload.status, 'ACK');

    // Replay with identical reqId must be rejected (dropped / times out)
    await assert.rejects(
      async () => transport.sendPacket(packet, 100),
      /timed out|replay/i
    );

    await transport.disconnect();
  });

  // ───────────────────────────────────────────────────────────────────
  // P0-2: ADVERSARIAL AUDIT ENGINE AST INSPECTION & TARGET FILTERING
  // ───────────────────────────────────────────────────────────────────

  test('6. Audit Engine: Dynamic target filtering skips unrequested subsystems', async () => {
    const engine = new AdversarialAuditEngine();
    // Audit specifically requesting HARDWARE target only
    const report = await engine.runAudit('HARDWARE', 'HARDWARE_SUBSYSTEM');

    assert.equal(report.requestedTarget, 'HARDWARE');
    assert.ok(report.checksExecuted.includes('RUNTIME_HARDWARE_HANDSHAKE_PROBE'));
    // Auth, SQL and routes must be skipped for hardware-specific target
    assert.ok(report.checksSkipped.some((c) => c.id === 'AUTH_AST_VERIFICATION'));
    assert.ok(report.checksSkipped.some((c) => c.id === 'SQL_MIGRATION_SECURITY_AUDIT'));
    assert.ok(report.checksSkipped.some((c) => c.id === 'OWNER_ROUTES_PROTECTION_AST'));
  });

  test('7. Audit Engine: AST analysis flags timingSafeEqual in comments as missing CallExpression', () => {
    const engine = new AdversarialAuditEngine();
    const fakeSource = `
      // crypto.timingSafeEqual(sig1, sig2) is documented here but not used in code
      function verify(a, b) {
        return a === b;
      }
    `;
    const sourceFile = engine.parseSourceFile('fake_identity.ts', fakeSource);
    const hasCall = engine.hasCallExpression(sourceFile, 'timingSafeEqual');
    assert.equal(hasCall, false, 'timingSafeEqual inside comment must not count as AST CallExpression');
  });

  test('8. Audit Engine: Unattached security helpers are flagged as CONFIGURATION_WEAKNESS', () => {
    const engine = new AdversarialAuditEngine();
    const fakeRoutes = `
      export async function ownerRoutes(fastify: any) {
        function verifyOwnerToken(req: any) { return true; } // Defined helper
        // Route created without preHandler hook attaching verifyOwnerToken
        fastify.get('/api/v1/owner/private-data', async () => ({ status: 'ok' }));
      }
    `;
    const sourceFile = engine.parseSourceFile('fake_owner.routes.ts', fakeRoutes);
    const report = engine.inspectRouteProtection(sourceFile);

    assert.ok(report.unprotectedRoutes.length > 0);
    assert.ok(report.unusedSecurityHelpers.includes('verifyOwnerToken'));
  });

  // ───────────────────────────────────────────────────────────────────
  // P0-3: AUDIT VERDICT SEMANTICS & UNTESTED CONTROL ENFORCEMENT
  // ───────────────────────────────────────────────────────────────────

  test('9. Audit Verdict: Untested controls strictly prevent PASS (must report PARTIAL)', async () => {
    const engine = new AdversarialAuditEngine();
    const report = await engine.runAudit();

    // In offline test environment without live PostgreSQL or physical MCU COM port:
    assert.notEqual(report.overallVerdict, 'PASS');
    assert.equal(report.overallVerdict, 'PARTIAL');
    assert.equal(report.scanStatus, 'PARTIAL');
    assert.ok(report.notTestedCount > 0);
    assert.ok(report.untestedControls.length > 0);
    assert.match(report.invariantSummary, /unexercised due to offline environment/i);
  });

  // ───────────────────────────────────────────────────────────────────
  // P1-4: VISITOR SESSION REVOCATION HARDENING
  // ───────────────────────────────────────────────────────────────────

  test('10. Visitor Sessions: Authoritative revocation is enforced against database', async () => {
    const revokedTokens = new Set<string>();
    const mockDb: any = {
      getClient: () => ({
        from: (table: string) => ({
          select: () => ({
            limit: async () => ({ data: [], error: null }),
            eq: (col: string, val: string) => ({
              maybeSingle: async () => ({
                data: revokedTokens.has(val) ? { token_hash: val } : null,
                error: null
              }),
              limit: async () => ({
                data: revokedTokens.has(val) ? [{ token_hash: val }] : [],
                error: null
              })
            })
          }),
          insert: async (row: any) => {
            revokedTokens.add(row.token_hash);
            return { error: null };
          },
          delete: () => ({
            lt: async () => ({ error: null })
          })
        })
      })
    };

    const sessionService = new VisitorSessionService(
      {
        NODE_ENV: 'production',
        APPROVAL_SIGNING_SECRET: 'test_approval_signing_secret_32_bytes_long',
        VISITOR_SESSION_SIGNING_SECRET: 'visitor_signing_secret_32_bytes_long_1111'
      } as any,
      mockDb
    );

    const token = sessionService.generateSessionToken();

    // Initial check: valid
    const initialCheck = await sessionService.verifySessionToken(token);
    assert.equal(initialCheck, true);

    // Revoke token durably
    await sessionService.revokeSessionToken(token, 'ADMIN_TEST_REVOCATION');

    // Authoritative check must fail immediately
    const revokedCheck = await sessionService.verifySessionToken(token);
    assert.equal(revokedCheck, false);

    // Expired revocations cleanup test
    const cleaned = await sessionService.cleanupExpiredRevocations();
    assert.ok(typeof cleaned === 'number');
  });

  test('11. Visitor Sessions: Database outage fails closed (safe denial)', async () => {
    const outageDb: any = {
      getClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: async () => ({ data: null, error: { message: 'Database connection reset' } })
            })
          })
        })
      })
    };

    const sessionService = new VisitorSessionService(
      {
        NODE_ENV: 'production',
        APPROVAL_SIGNING_SECRET: 'test_approval_signing_secret_32_bytes_long',
        VISITOR_SESSION_SIGNING_SECRET: 'visitor_signing_secret_32_bytes_long_1111'
      } as any,
      outageDb
    );

    const token = sessionService.generateSessionToken();
    const result = await sessionService.verifySessionToken(token);
    // Outage must deny access safely
    assert.equal(result, false);
  });

  // ───────────────────────────────────────────────────────────────────
  // P1-5: UNIFY OWNER AUTHENTICATION & REMOVE EMAIL FALLBACK
  // ───────────────────────────────────────────────────────────────────

  test('12. Owner Authentication: Canonical OWNER_USER_ID is strictly mandatory (email fallback eliminated)', () => {
    const service = new IdentityAuthService(testConfig, dbAdapter);

    // 1. Matching canonical sub succeeds
    const validOwner = service.isUserOwner(testConfig.OWNER_USER_ID, 'adhithyamohan2312@gmail.com');
    assert.equal(validOwner, true);

    // 2. Mismatched sub with matching owner email is REJECTED
    const emailOnlyAttempt = service.isUserOwner('attacker_sub_9999', 'adhithyamohan2312@gmail.com');
    assert.equal(emailOnlyAttempt, false, 'Email-only match without matching canonical OWNER_USER_ID must be rejected');

    // 3. Missing canonical owner ID config rejects all callers
    const serviceWithoutOwnerId = new IdentityAuthService({ ...testConfig, OWNER_USER_ID: undefined }, dbAdapter);
    const missingConfigAttempt = serviceWithoutOwnerId.isUserOwner('any_sub', 'adhithyamohan2312@gmail.com');
    assert.equal(missingConfigAttempt, false, 'Missing configured OWNER_USER_ID must fail closed');
  });

  // ───────────────────────────────────────────────────────────────────
  // P1-6: DISTRIBUTED RATE LIMITING & PROXY TRUST
  // ───────────────────────────────────────────────────────────────────

  test('13. Rate Limiting: Untrusted connecting socket ignores spoofed forwarded headers', () => {
    delete process.env.VERCEL;
    delete process.env.TRUST_PROXY;

    const req = {
      headers: {
        'x-forwarded-for': '198.51.100.22, 10.0.0.1',
        'x-vercel-forwarded-for': '198.51.100.22'
      },
      socket: { remoteAddress: '192.168.1.50' } // Untrusted LAN IP
    };

    const resolved = getClientIp(req);
    // Since proxy trust is disabled, connecting socket IP is authoritative
    assert.equal(resolved, '192.168.1.50');
    assert.notEqual(resolved, '198.51.100.22');
  });

  test('14. Rate Limiting: Trusted proxy socket resolves upstream client IP', () => {
    process.env.TRUST_PROXY = 'true';
    process.env.TRUSTED_PROXIES = '127.0.0.1,10.0.0.1';

    const req = {
      headers: {
        'x-forwarded-for': '203.0.113.195'
      },
      socket: { remoteAddress: '10.0.0.1' } // Connecting from verified proxy
    };

    const resolved = getClientIp(req);
    assert.equal(resolved, '203.0.113.195');

    delete process.env.TRUST_PROXY;
    delete process.env.TRUSTED_PROXIES;
  });

  // ───────────────────────────────────────────────────────────────────
  // P1-7: EXECUTION LIFECYCLE & CAPABILITY TRUTH
  // ───────────────────────────────────────────────────────────────────

  test('15. Agent Capability Truth: High-impact tool requires approval and rejects simulated claims', async () => {
    const registry = new AgentWorkerRegistry();
    const approvalService = new DurableApprovalService(testConfig, dbAdapter);
    const mockHw = new MockHardwareGateway();
    const adapterReg = new AgentToolAdapterRegistry({ hardwareGateway: mockHw });
    const executor = new AgentToolExecutor(registry, approvalService, dbAdapter, adapterReg);

    // 1. Without approval token, execution is held in APPROVAL_REQUIRED
    const unapprovedRes = await executor.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input: { pin: 7, durationMs: 100 },
      principal: { id: testConfig.OWNER_USER_ID, isOwner: true }
    });

    assert.equal(unapprovedRes.success, false);
    assert.equal(unapprovedRes.requiresApproval, true);
    assert.equal(unapprovedRes.reason, 'APPROVAL_REQUIRED');

    // 2. With valid approval, execution produces genuine adapter result
    const approval = await approvalService.createApprovalRequest({
      actionType: 'gpio_pulse',
      ownerId: testConfig.OWNER_USER_ID,
      payload: { pin: 7, durationMs: 100 }
    });

    const approvedRes = await executor.executeTool({
      agentId: 'HERMES',
      toolName: 'gpio_pulse',
      input: { pin: 7, durationMs: 100 },
      principal: { id: testConfig.OWNER_USER_ID, isOwner: true },
      approvalToken: approval.token,
      approvalId: approval.approvalId
    });

    assert.equal(approvedRes.success, true);
    assert.equal(approvedRes.verificationState, 'SIMULATED'); // Truthfully SIMULATED for mock gateway
    assert.ok(approvedRes.evidence?.evidenceDigest);
    assert.ok(approvedRes.auditId);
  });

  // ───────────────────────────────────────────────────────────────────
  // P1-8: PRESERVE ULTRON STRATEGIC AUTONOMY
  // ───────────────────────────────────────────────────────────────────

  test('16. ULTRON Sovereign Autonomy: Independent strategic audit executes without human approval gating', async () => {
    const registry = new AgentWorkerRegistry();
    const approvalService = new DurableApprovalService(testConfig, dbAdapter);
    const executor = new AgentToolExecutor(registry, approvalService, dbAdapter);

    const ultronRes = await executor.executeTool({
      agentId: 'ULTRON',
      toolName: 'adversarial_audit',
      input: { target: 'portfolio_cognitive_core', scope: 'BOUNDARY_INVARIANTS' },
      principal: { id: 'sovereign_ultron', isOwner: true }
    });

    assert.equal(ultronRes.success, true);
    assert.ok(ultronRes.verificationState === 'VERIFIED' || ultronRes.verificationState === 'PARTIAL');
    assert.ok((ultronRes.result as any).ultronVerdict);
    assert.match((ultronRes.result as any).ultronVerdict, /ULTRON STRATEGIC CRITIQUE/);
  });
});
