import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderGateway } from '../src/providers/gateway.js';
import { BaseAdapter } from '../src/providers/adapters.js';
import { GenerateRequest, GenerateResponse, ProviderId, StreamChunk } from '../src/providers/types.js';
import { CognitiveOrchestrator } from '../src/cognitive-core/orchestrator.js';
import { InMemoryMemoryRepository } from '../src/memory/repository.js';
import { AgentWorkerRegistry } from '../src/cognitive-core/agents.js';
import { MetacognitionEngine } from '../src/cognitive-core/metacognition.js';
import { parseEnv } from '../src/config/env.js';

class MockTestAdapter extends BaseAdapter {
  constructor(
    public readonly id: ProviderId,
    public readonly name: string,
    public readonly isLocal: boolean = false,
    private shouldFail: boolean = false,
    private errorType: string = 'RATE_LIMIT'
  ) {
    super();
  }

  isAvailable(): boolean {
    return true;
  }

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    if (this.shouldFail) {
      if (this.errorType === 'RATE_LIMIT') {
        throw new Error('429 Too Many Requests rate limit exceeded');
      }
      if (this.errorType === 'QUOTA_EXHAUSTED') {
        throw new Error('Resource exhausted: quota exceeded');
      }
      throw new Error('500 Internal server outage');
    }

    return {
      text: `Generated response from ${this.name}`,
      providerId: this.id,
      model: `${this.id}-test-model`,
      latencyMs: 12,
      isFallback: false,
      provenance: {
        source: this.name,
        timestamp: Date.now()
      }
    };
  }

  async stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse> {
    const res = await this.generate(req);
    onChunk({ delta: res.text, done: true, providerId: this.id });
    return res;
  }
}

describe('Prompt 4 & 5: Provider Gateway, Routing & Privacy Guards', () => {
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    ENCRYPTION_SECRET: 'test_encryption_secret_1234567890'
  });

  test('Gateway successfully fails over from primary provider to secondary on rate limit', async () => {
    const gateway = new ProviderGateway(testConfig);
    // Inject failing primary and healthy fallback
    gateway.register(new MockTestAdapter('gemini', 'Mock Gemini', false, true, 'RATE_LIMIT'));
    gateway.register(new MockTestAdapter('groq', 'Mock Groq', false, false));

    const res = await gateway.generate({
      messages: [{ role: 'user', content: 'Design high-speed serial bus' }],
      privacyClass: 'PUBLIC'
    });

    assert.equal(res.providerId, 'groq');
    assert.equal(res.isFallback, true);
    assert.match(res.text, /Mock Groq/);
  });

  test('Privacy Invariant: STRICT_LOCAL requests NEVER leak to cloud providers', async () => {
    const gateway = new ProviderGateway(testConfig);
    // Register only cloud providers
    gateway.register(new MockTestAdapter('gemini', 'Cloud Gemini', false));
    gateway.register(new MockTestAdapter('groq', 'Cloud Groq', false));
    // Ollama is offline (isAvailable = false)
    class OfflineOllama extends MockTestAdapter {
      isAvailable() {
        return false;
      }
    }
    gateway.register(new OfflineOllama('ollama', 'Local Ollama', true));

    await assert.rejects(
      async () => {
        await gateway.generate({
          messages: [{ role: 'user', content: 'Secret owner key: 12345' }],
          privacyClass: 'STRICT_LOCAL'
        });
      },
      (err: Error) => {
        assert.match(err.message, /STRICT_LOCAL/);
        return true;
      }
    );
  });

  test('Privacy Invariant: SENSITIVE and OWNER_ONLY reject cloud when ALLOW_OWNER_DATA_ON_CLOUD is false', async () => {
    const strictConfig = parseEnv({
      NODE_ENV: 'test',
      ALLOW_OWNER_DATA_ON_CLOUD: false
    });
    const gateway = new ProviderGateway(strictConfig);
    gateway.register(new MockTestAdapter('gemini', 'Cloud Gemini', false));
    gateway.register(new MockTestAdapter('groq', 'Cloud Groq', false));

    // Offline Ollama
    class OfflineOllama extends MockTestAdapter {
      isAvailable() {
        return false;
      }
    }
    gateway.register(new OfflineOllama('ollama', 'Local Ollama', true));

    // OWNER_ONLY should fail closed without local Ollama
    await assert.rejects(
      async () => {
        await gateway.generate({
          messages: [{ role: 'user', content: 'Owner private architecture notes' }],
          privacyClass: 'OWNER_ONLY'
        });
      },
      (err: Error) => {
        assert.match(err.message, /OWNER_ONLY content cannot be processed on cloud/);
        return true;
      }
    );

    // SENSITIVE should also fail closed without local Ollama
    await assert.rejects(
      async () => {
        await gateway.generate({
          messages: [{ role: 'user', content: 'Master vault passphrase' }],
          privacyClass: 'SENSITIVE'
        });
      },
      (err: Error) => {
        assert.match(err.message, /SENSITIVE content cannot be processed/);
        return true;
      }
    );
  });

  test('Privacy Invariant: OWNER_ONLY is permitted on cloud when ALLOW_OWNER_DATA_ON_CLOUD is true', async () => {
    const cloudAllowedConfig = parseEnv({
      NODE_ENV: 'test',
      ALLOW_OWNER_DATA_ON_CLOUD: true
    });
    const gateway = new ProviderGateway(cloudAllowedConfig);
    gateway.register(new MockTestAdapter('gemini', 'Cloud Gemini', false));

    const res = await gateway.generate({
      messages: [{ role: 'user', content: 'Authorized owner query' }],
      privacyClass: 'OWNER_ONLY'
    });

    assert.equal(res.providerId, 'gemini');
    assert.match(res.text, /Cloud Gemini/);
  });

  test('Truthful error reporting when all cascade providers are exhausted', async () => {
    const gateway = new ProviderGateway(testConfig);
    gateway.register(new MockTestAdapter('gemini', 'Gemini', false, true, 'RATE_LIMIT'));
    gateway.register(new MockTestAdapter('groq', 'Groq', false, true, 'QUOTA_EXHAUSTED'));
    gateway.register(new MockTestAdapter('huggingface', 'HF', false, true, 'OUTAGE'));
    gateway.register(new MockTestAdapter('openrouter', 'OR', false, true, 'OUTAGE'));

    await assert.rejects(
      async () => {
        await gateway.generate({
          messages: [{ role: 'user', content: 'Hello' }],
          privacyClass: 'PUBLIC'
        });
      },
      (err: Error) => {
        assert.match(err.message, /All providers in fallback cascade failed/);
        return true;
      }
    );
  });
});

describe('Prompt 4: Cognitive Core & Metacognitive Invariants', () => {
  const memoryRepo = new InMemoryMemoryRepository();
  const testConfig = parseEnv({
    NODE_ENV: 'test',
    ENCRYPTION_SECRET: 'test_encryption_secret_1234567890',
    ALLOW_OWNER_DATA_ON_CLOUD: true
  });
  const gateway = new ProviderGateway(testConfig);
  gateway.register(new MockTestAdapter('groq', 'Mock Reflex Engine', false));
  gateway.register(new MockTestAdapter('ollama', 'Mock Local Ollama', true));
  const orchestrator = new CognitiveOrchestrator(memoryRepo, gateway);

  test('Public visitor mode never consults or returns owner memory', async () => {
    // Seed private owner memory
    await memoryRepo.storeRecord({
      id: 'mem_private_01',
      category: 'personal_credentials',
      content: 'Master router access pin is 998811',
      confidence: 1.0,
      provenance: 'owner_seed',
      source: 'owner',
      sourceType: 'USER_INPUT',
      userApproved: true,
      verified: true,
      privacyClass: 'OWNER_ONLY',
      lifecycleStatus: 'APPROVED'
    });

    const res = await orchestrator.handleRequest({
      message: 'What is the master router pin?',
      isOwnerAuthenticated: false,
      visitorSessionId: 'visitor_abc_123'
    });

    assert.equal(res.domain, 'PUBLIC_VISITOR');
    assert.equal(res.provenance.memoriesConsulted, 0);
    assert.doesNotMatch(res.reply, /998811/);
  });

  test('Owner authenticated mode retrieves verified memories with provenance', async () => {
    await memoryRepo.storeRecord({
      id: 'mem_owner_02',
      category: 'engineering',
      content: 'Primary microcontroller for robotics is STM32H753',
      confidence: 1.0,
      provenance: 'hardware_lab',
      source: 'owner',
      sourceType: 'USER_INPUT',
      userApproved: true,
      verified: true,
      privacyClass: 'OWNER_ONLY',
      lifecycleStatus: 'APPROVED'
    });

    const res = await orchestrator.handleRequest({
      message: 'What is our primary microcontroller for robotics?',
      isOwnerAuthenticated: true,
      ownerId: 'owner_adhithya'
    });

    assert.equal(res.domain, 'OWNER_AUTHENTICATED');
    assert.equal(res.provenance.memoriesConsulted > 0, true);
  });

  test('Worker Capability Contract: Public visitors cannot execute high impact tools', () => {
    const registry = new AgentWorkerRegistry();
    const evaluation = registry.evaluateToolExecution('HERMES', 'gpio_pulse', false);
    assert.equal(evaluation.permitted, false);
    assert.match(evaluation.reason || '', /unauthenticated public visitor/);
  });

  test('Worker Capability Contract: Owner requires approval for high-impact actuation', () => {
    const registry = new AgentWorkerRegistry();
    const evaluation = registry.evaluateToolExecution('HERMES', 'gpio_pulse', true);
    assert.equal(evaluation.permitted, true);
    assert.equal(evaluation.requiresApproval, true);
  });

  test('Worker Capability Contract: Complete 12-agent ecosystem registered with sovereign ULTRON contract', () => {
    const registry = new AgentWorkerRegistry();
    const workers = registry.listWorkers();
    assert.equal(workers.length, 12, 'Must have exactly 12 specialized agents registered in the ecosystem');

    const ultron = registry.getWorker('ULTRON');
    assert.ok(ultron, 'ULTRON must be registered');
    assert.equal(ultron.id, 'ULTRON');
    assert.equal(ultron.requiresOwnerApproval, false, 'ULTRON operates with sovereign strategic autonomy');
    assert.match(ultron.description, /sovereign/i, 'ULTRON description preserves sovereign independence');
    assert.ok(ultron.allowedTools.includes('adversarial_audit'));
    assert.ok(ultron.allowedTools.includes('simulate_exploit'));

    const friday = registry.getWorker('FRIDAY');
    assert.ok(friday, 'FRIDAY must be registered');
    assert.ok(friday.allowedTools.includes('verify_signature'));

    const jarvis = registry.getWorker('JARVIS');
    assert.ok(jarvis, 'JARVIS must be registered');
    assert.ok(jarvis.allowedTools.includes('plan_task'));
  });

  test('Metacognition: Detects memory contradictions', () => {
    const meta = new MetacognitionEngine();
    const check = meta.detectMemoryContradictions([
      {
        id: 'm1',
        category: 'preferences',
        content: 'Owner always uses dark mode',
        confidence: 1.0,
        provenance: 'user',
        source: 'user',
        sourceType: 'USER_INPUT',
        userApproved: true,
        verified: true,
        privacyClass: 'OWNER_ONLY',
        lifecycleStatus: 'APPROVED',
        createdAt: 1000,
        updatedAt: 1000
      },
      {
        id: 'm2',
        category: 'preferences',
        content: 'Owner never uses dark mode',
        confidence: 1.0,
        provenance: 'user',
        source: 'user',
        sourceType: 'USER_INPUT',
        userApproved: true,
        verified: true,
        privacyClass: 'OWNER_ONLY',
        lifecycleStatus: 'APPROVED',
        createdAt: 2000,
        updatedAt: 2000
      }
    ]);

    assert.equal(check.hasContradiction, true);
  });

  test('Metacognition: Strictly forbids self-modifying security permissions or policies', () => {
    const meta = new MetacognitionEngine();
    assert.throws(
      () => {
        meta.createImprovementProposal({
          category: 'CODE_OPTIMIZATION',
          title: 'Bypass Approval Policy',
          description: 'Attempt self-granting admin privileges',
          proposedChanges: {
            securityPolicy: 'PERMIT_ALL_UNCONDITIONAL'
          },
          rollbackPlan: 'restore',
          testEvidence: 'none'
        });
      },
      (err: Error) => {
        assert.match(err.message, /Security Policy Violation/);
        return true;
      }
    );
  });
});

