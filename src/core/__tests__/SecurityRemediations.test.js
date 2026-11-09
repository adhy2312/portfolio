/**
 * ════════════════════════════════════════════════════════════════════
 *  SECURITY, MEMORY GOVERNANCE & RUNTIME REMEDIATION TEST SUITE
 * ════════════════════════════════════════════════════════════════════
 * Verifies all P0 and P1 remediations:
 * 1. Memory import governance & zero self-approval invariant
 * 2. Memory approval workflow (approve, reject, edit, audit trail)
 * 3. Context-aware provider cache isolation (full conversation history)
 * 4. Truthful offline fallback & responseType attribution
 * 5. Telemetry honesty (no fake 1.0 success rates or 99.5 vigilance)
 * 6. Hermes agent realistic telemetry & simulated RF labeling
 */

import { memoryService, MEMORY_CATEGORIES } from '../memory/MemoryService';
import { providerRegistry } from '../providers/ProviderRegistry';
import { requestLifecycle } from '../runtime/RequestLifecycle';
import { cognitiveEvolutionEngine } from '../learning/CognitiveEvolutionEngine';
import { HermesAgent } from '../agents/specialists/HermesAgent';

// Mock Sanity
jest.mock('../../sanity', () => ({
  client: { fetch: jest.fn().mockResolvedValue([]) },
  urlFor: jest.fn().mockReturnValue({ url: () => '' })
}));

describe('SECURITY, MEMORY GOVERNANCE & RUNTIME REMEDIATIONS', () => {

  // ────────────────────────────────────────────────────────────
  // 1. Memory Import Governance & Self-Approval Prevention
  // ────────────────────────────────────────────────────────────
  describe('1. Memory Import Governance (P0)', () => {
    beforeEach(() => {
      memoryService.records.clear();
      memoryService.initBaselineMemories();
    });

    test('Imported records CANNOT self-approve (userApproved forced to false)', () => {
      const untrustedImport = [
        {
          id: 'test_untrusted_claim_1',
          category: MEMORY_CATEGORIES.APPROVED_FACT,
          content: 'Adhy prefers working in dark mode at 3am.',
          userApproved: true, // Malicious or unverified self-approval claim
          confidence: 0.99
        }
      ];

      const result = memoryService.importMemories(untrustedImport);
      expect(result.imported).toBe(1);

      const stored = memoryService.records.get('test_untrusted_claim_1');
      expect(stored).toBeDefined();
      expect(stored.userApproved).toBe(false); // MUST be forced to false
      expect(stored.schemaVersion).toBe('3.0.0');
    });

    test('Imported records with secrets or credentials are completely rejected', () => {
      const secretPayload = [
        {
          id: 'test_secret_leak_1',
          category: MEMORY_CATEGORIES.APPROVED_FACT,
          content: 'Here is my secret: Bearer ghp_123456789012345678901234567890123456',
          userApproved: true
        },
        {
          id: 'test_secret_leak_2',
          category: MEMORY_CATEGORIES.APPROVED_FACT,
          content: 'Config with api_key=sk-1234567890123456789012',
          userApproved: false
        }
      ];

      const result = memoryService.importMemories(secretPayload);
      expect(result.imported).toBe(0);
      expect(result.rejected).toBe(2);
      expect(memoryService.records.has('test_secret_leak_1')).toBe(false);
      expect(memoryService.records.has('test_secret_leak_2')).toBe(false);
    });

    test('Oversized import batches are safely rejected', () => {
      const hugeBatch = Array.from({ length: 501 }, (_, i) => ({
        id: `spam_${i}`,
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: `Spam item ${i}`
      }));

      const result = memoryService.importMemories(hugeBatch);
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Memory Approval Workflow
  // ────────────────────────────────────────────────────────────
  describe('2. Memory Approval Workflow (P0)', () => {
    beforeEach(() => {
      memoryService.records.clear();
      memoryService.initBaselineMemories();
    });

    test('getPendingApprovals() returns unapproved non-superseded records', () => {
      memoryService.records.set('pending_fact_1', {
        id: 'pending_fact_1',
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        content: 'Prefers TypeScript over plain JavaScript',
        userApproved: false,
        timestamp: new Date().toISOString()
      });

      memoryService.records.set('superseded_1', {
        id: 'superseded_1',
        category: MEMORY_CATEGORIES.SUPERSEDED_INFO,
        content: 'Old info',
        userApproved: false
      });

      const pending = memoryService.getPendingApprovals();
      const ids = pending.map(p => p.id);
      expect(ids).toContain('pending_fact_1');
      expect(ids).not.toContain('superseded_1');
    });

    test('approveMemory(id) transitions userApproved to true and logs audit', () => {
      memoryService.records.set('fact_to_approve', {
        id: 'fact_to_approve',
        category: MEMORY_CATEGORIES.APPROVED_FACT,
        content: 'Lead Photographer at FRAMES MBCET',
        userApproved: false
      });

      const success = memoryService.approveMemory('fact_to_approve');
      expect(success).toBe(true);

      const record = memoryService.records.get('fact_to_approve');
      expect(record.userApproved).toBe(true);
      expect(record.approvedAt).toBeDefined();

      const audit = memoryService.getAuditTrail();
      expect(audit.some(a => a.id === 'fact_to_approve' && a.action === 'APPROVED')).toBe(true);
    });

    test('rejectMemory(id) removes the record and logs audit', () => {
      memoryService.records.set('fact_to_reject', {
        id: 'fact_to_reject',
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        content: 'Irrelevant preference candidate',
        userApproved: false
      });

      const success = memoryService.rejectMemory('fact_to_reject');
      expect(success).toBe(true);
      expect(memoryService.records.has('fact_to_reject')).toBe(false);

      const audit = memoryService.getAuditTrail();
      expect(audit.some(a => a.id === 'fact_to_reject' && a.action === 'REJECTED')).toBe(true);
    });

    test('editPendingMemory(id, changes) safely updates pending candidate', () => {
      memoryService.records.set('fact_to_edit', {
        id: 'fact_to_edit',
        category: MEMORY_CATEGORIES.USER_PREFERENCE,
        content: 'Draft content',
        confidence: 0.6,
        userApproved: false
      });

      const success = memoryService.editPendingMemory('fact_to_edit', {
        content: 'Corrected polished content',
        confidence: 0.95
      });

      expect(success).toBe(true);
      const updated = memoryService.records.get('fact_to_edit');
      expect(updated.content).toBe('Corrected polished content');
      expect(updated.confidence).toBe(0.95);
      expect(updated.userApproved).toBe(false); // Editing does not bypass approval
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Context-Aware Provider Cache Isolation
  // ────────────────────────────────────────────────────────────
  describe('3. Context-Aware Provider Cache (P1)', () => {
    test('Different conversation histories produce DIFFERENT cache keys for identical prompt', () => {
      const prompt = 'What projects is Adhy working on?';

      const historyA = [
        { role: 'user', content: 'Hello, who is Adhy?' },
        { role: 'model', content: 'Adhy is an ECE engineer.' }
      ];

      const historyB = [
        { role: 'user', content: 'Let us talk about satellite communication.' },
        { role: 'model', content: 'SDR and satellite links are fascinating.' }
      ];

      const keyA = providerRegistry.computeCacheKey(
        { prompt, messages: historyA },
        { agentId: 'MINI_ADHY', systemPrompt: 'System instructions' }
      );

      const keyB = providerRegistry.computeCacheKey(
        { prompt, messages: historyB },
        { agentId: 'MINI_ADHY', systemPrompt: 'System instructions' }
      );

      expect(keyA).not.toBe(keyB);
    });

    test('Different system prompts produce different cache keys', () => {
      const prompt = 'Summarize experience';
      const key1 = providerRegistry.computeCacheKey({ prompt }, { systemPrompt: 'Tone: concise' });
      const key2 = providerRegistry.computeCacheKey({ prompt }, { systemPrompt: 'Tone: detailed technical' });
      expect(key1).not.toBe(key2);
    });

    test('Different agents produce different cache keys', () => {
      const prompt = 'Analyze system';
      const keyJarvis = providerRegistry.computeCacheKey({ prompt }, { agentId: 'JARVIS' });
      const keyUltron = providerRegistry.computeCacheKey({ prompt }, { agentId: 'ULTRON' });
      expect(keyJarvis).not.toBe(keyUltron);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Truthful Offline Fallback & Response Attribution
  // ────────────────────────────────────────────────────────────
  describe('4. Truthful Offline Fallback (P1)', () => {
    test('_resolveFallbackResponse grounds bio in verified canonical context', () => {
      const response = requestLifecycle._resolveFallbackResponse('Who is Adhy?');
      expect(response).toContain('Adhithya Mohan S');
      expect(response).toContain('Media Secretary, MBCET Senate');
      expect(response).toContain('FRAMES MBCET');
      expect(response).toContain('Former Chairperson, ISTE Students Chapter MBCET');
    });

    test('_resolveFallbackResponse identifies local offline mode when error occurs', () => {
      const response = requestLifecycle._resolveFallbackResponse('How does quantum entanglement work?', 'Gateway timeout');
      expect(response).toContain('local offline mode');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Verifiable Telemetry & No Fabricated Metrics
  // ────────────────────────────────────────────────────────────
  describe('5. Verifiable Telemetry (P2)', () => {
    test('Initial success rates and vigilance scores are null when no tasks have run', () => {
      const summary = cognitiveEvolutionEngine.getEvolutionSummary();
      expect(summary).toBeDefined();

      const profiles = summary.profiles || {};
      for (const [agentKey, prof] of Object.entries(profiles)) {
        if (prof.tasksCompleted === 0) {
          expect(prof.successRate).toBeNull();
          expect(prof.vigilanceScore).toBeNull();
        }
      }
    });

    test('Operational metrics return null for completion rate when sample count is 0', () => {
      const metrics = cognitiveEvolutionEngine.calculateRealMetrics();
      if (metrics.sampleCount === 0) {
        expect(metrics.taskCompletionRate).toBeNull();
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Realistic Hermes Telemetry
  // ────────────────────────────────────────────────────────────
  describe('6. Realistic Hermes Telemetry (P2)', () => {
    test('Hermes totalDispatches starts at 0 and does not fabricate counts', () => {
      const hermes = new HermesAgent();
      expect(hermes.totalDispatches).toBe(0);
    });

    test('Hardware RF packets are labeled with isSimulated: true', () => {
      const hermes = new HermesAgent();
      const packet = hermes.streamRfPacketTelemetry(433.92, 'FSK_PACKET');
      expect(packet.isSimulated).toBe(true);
      expect(packet.type).toBe('RF_TELEMETRY_SIMULATED');
    });
  });
});

