/**
 * ════════════════════════════════════════════════════════════════════
 *  PROVIDER-AGNOSTIC COGNITIVE CORE INTERFACES (PHASE 9)
 * ════════════════════════════════════════════════════════════════════
 * Stable, implementation-independent interface specifications that
 * decouple Mini-Adhy's cognitive identity and reasoning pipeline
 * from concrete LLM providers, model runtimes, and storage backends.
 * 
 * CORE PRINCIPLE:
 * AdhyModel and Mini-Adhy's reasoning cortex must never depend directly
 * on any proprietary API, vendor SDK, or specific infrastructure.
 */

/**
 * Interface contract for Reasoning / Generation Providers
 */
export class ReasoningProviderInterface {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.isLocal = Boolean(options.isLocal);
    this.isHosted = options.isHosted !== false;
    this.costTier = options.costTier || 'LOW'; // FREE | LOW | MEDIUM | HIGH
    this.maxContextTokens = options.maxContextTokens || 8192;
  }

  async generate(request, options = {}) {
    throw new Error(`ReasoningProviderInterface: Method 'generate' must be implemented by subclass ${this.constructor.name}`);
  }

  getCapabilities() {
    return {
      reasoning: true,
      code: true,
      vision: false,
      audio: false,
      streaming: false,
      functionCalling: false,
      contextWindow: this.maxContextTokens
    };
  }

  async healthCheck() {
    return { providerId: this.id, status: 'healthy', timestamp: new Date().toISOString() };
  }
}

/**
 * Interface contract for Embedding Providers
 */
export class EmbeddingProviderInterface {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.dimension = 768;
  }

  async embed(text, options = {}) {
    throw new Error(`EmbeddingProviderInterface: Method 'embed' must be implemented by subclass ${this.constructor.name}`);
  }
}

/**
 * Interface contract for Vision Providers
 */
export class VisionProviderInterface {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async analyzeImage(imagePayload, prompt = '', options = {}) {
    throw new Error(`VisionProviderInterface: Method 'analyzeImage' must be implemented by subclass ${this.constructor.name}`);
  }
}

/**
 * Interface contract for Audio Providers
 */
export class AudioProviderInterface {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async transcribe(audioBuffer, options = {}) {
    throw new Error(`AudioProviderInterface: Method 'transcribe' must be implemented by subclass ${this.constructor.name}`);
  }

  async synthesize(text, options = {}) {
    throw new Error(`AudioProviderInterface: Method 'synthesize' must be implemented by subclass ${this.constructor.name}`);
  }
}

/**
 * Interface contract for Tool Execution
 */
export class ToolExecutionInterface {
  constructor() {
    this.registeredTools = new Map();
  }

  async executeTool(toolName, params = {}, context = {}) {
    throw new Error(`ToolExecutionInterface: Method 'executeTool' must be implemented`);
  }
}

/**
 * Interface contract for Memory Storage
 */
export class MemoryStorageInterface {
  async get(key) {
    throw new Error('MemoryStorageInterface: Method get must be implemented');
  }

  async set(key, value) {
    throw new Error('MemoryStorageInterface: Method set must be implemented');
  }

  async remove(key) {
    throw new Error('MemoryStorageInterface: Method remove must be implemented');
  }

  async list(prefix = '') {
    throw new Error('MemoryStorageInterface: Method list must be implemented');
  }
}

/**
 * Interface contract for Distributed Agent Execution
 */
export class AgentExecutionInterface {
  constructor(id, capabilities = []) {
    this.id = id;
    this.capabilities = capabilities;
  }

  async execute(task, context = {}) {
    throw new Error(`AgentExecutionInterface: Method 'execute' must be implemented by ${this.id}`);
  }
}

