import { IMemoryRepository, MemoryRecord } from '../memory/types.js';
import { ProviderGateway } from '../providers/gateway.js';
import { AgentWorkerRegistry, AgentToolExecutor, ToolExecutionContext, ToolExecutionResponse } from './agents.js';
import { MetacognitionEngine } from './metacognition.js';
import { GenerateRequest, GenerateResponse, ChatMessage, TaskType, PrivacyClass } from '../providers/types.js';

export interface CognitiveRequest {
  message: string;
  isOwnerAuthenticated: boolean;
  ownerId?: string;
  visitorSessionId?: string;
  conversationId?: string;
  taskType?: TaskType;
  history?: ChatMessage[];
  requestedTool?: {
    agentId: string;
    toolName: string;
    input: Record<string, unknown>;
    approvalToken?: string;
    approvalId?: string;
  };
}

export interface CognitiveExecutionResult {
  reply: string;
  domain: 'PUBLIC_VISITOR' | 'OWNER_AUTHENTICATED';
  provider: string;
  model: string;
  latencyMs: number;
  isFallback: boolean;
  delegatedWorker?: string;
  toolAction?: {
    tool: string;
    status:
      | 'PLANNED'
      | 'DISPATCHED'
      | 'EXECUTED'
      | 'ACKNOWLEDGED'
      | 'VERIFIED'
      | 'APPROVAL_REQUIRED'
      | 'DENIED'
      | 'UNAVAILABLE'
      | 'NOT_TESTED'
      | 'INCONCLUSIVE';
    approvalId?: string;
  };
  toolExecution?: ToolExecutionResponse;
  provenance: {
    source: string;
    timestamp: number;
    memoriesConsulted: number;
  };
}

export class CognitiveOrchestrator {
  private agentRegistry: AgentWorkerRegistry;
  private metacognition: MetacognitionEngine;

  constructor(
    private memoryRepo: IMemoryRepository,
    private providerGateway: ProviderGateway,
    private toolExecutor?: AgentToolExecutor,
    sharedRegistry?: AgentWorkerRegistry // Injected from app.ts — avoids duplicate registry
  ) {
    // Use the injected shared registry when provided; fall back to own instance for tests
    this.agentRegistry = sharedRegistry ?? new AgentWorkerRegistry();
    this.metacognition = new MetacognitionEngine();
  }

  public getAgentRegistry(): AgentWorkerRegistry {
    return this.agentRegistry;
  }

  public getMetacognition(): MetacognitionEngine {
    return this.metacognition;
  }

  public getToolExecutor(): AgentToolExecutor | undefined {
    return this.toolExecutor;
  }

  public async executeAgentTool(ctx: ToolExecutionContext): Promise<ToolExecutionResponse> {
    if (!this.toolExecutor) {
      return {
        success: false,
        toolName: ctx.toolName,
        agentId: ctx.agentId,
        reason: 'UNAVAILABLE',
        error: 'AgentToolExecutor is not configured on CognitiveOrchestrator.'
      };
    }
    return this.toolExecutor.executeTool(ctx);
  }

  /**
   * Central backend Mini-Adhy request lifecycle
   */
  public async handleRequest(req: CognitiveRequest): Promise<CognitiveExecutionResult> {
    const startTime = Date.now();
    const domain = req.isOwnerAuthenticated ? 'OWNER_AUTHENTICATED' : 'PUBLIC_VISITOR';

    // 1. Determine privacy class and load permitted memory
    let systemPrompt = '';
    let memoriesConsulted = 0;
    let privacyClass: PrivacyClass = req.isOwnerAuthenticated ? 'OWNER_ONLY' : 'PUBLIC';

    if (domain === 'PUBLIC_VISITOR') {
      // DOMAIN A: Strict public visitor isolation
      // NEVER retrieve owner memory or private cognitive notes
      systemPrompt = [
        'You are Mini-Adhy, the official AI representative for Adhithya Mohan (adhy.tech).',
        'You are interacting with a PUBLIC VISITOR.',
        'Knowledge boundary:',
        '- You may only discuss public engineering achievements, software, robotics, and published portfolio projects.',
        '- You MUST NEVER disclose private credentials, personal owner conversations, or internal security tokens.',
        '- Maintain a professional, articulate, visionary persona inspired by high-precision engineering.',
        '- If asked about private owner systems or administrative actions, politely explain that owner authentication is required.'
      ].join('\n');
    } else {
      // DOMAIN B: Authenticated owner
      if (!req.ownerId) {
        throw new Error('[Security Invariant Violation] Authenticated owner requests must supply a verified ownerId');
      }

      // Retrieve authorized owner memory explicitly scoped to ownerId (only APPROVED lifecycle status)
      const relevantMemories = await this.memoryRepo.searchRecords(req.message, {
        limit: 5,
        lifecycleStatus: 'APPROVED',
        ownerId: req.ownerId
      });
      memoriesConsulted = relevantMemories.length;

      // Escalate privacy class if any memory requires SENSITIVE or STRICT_LOCAL protection
      for (const m of relevantMemories) {
        const memPrivacy = m.privacyClass || (m as any).privacy_class;
        if (memPrivacy === 'STRICT_LOCAL') {
          privacyClass = 'STRICT_LOCAL';
          break;
        }
        if (memPrivacy === 'SENSITIVE') {
          privacyClass = 'SENSITIVE';
        }
      }

      const memoryContext = relevantMemories
        .map((m) => `[Category: ${m.category}] ${m.content} (Confidence: ${m.confidence})`)
        .join('\n');

      systemPrompt = [
        'You are Mini-Adhy, the personal intelligence operating system for Adhithya Mohan.',
        'You are in AUTHENTICATED OWNER MODE.',
        'You have full access to verified owner memory and the specialist worker ecosystem (JARVIS, FRIDAY, ULTRON).',
        memoryContext ? `\nVerified Memories:\n${memoryContext}\n` : '',
        'Operate with high rigor, truthfulness, and architectural precision.'
      ].join('\n');
    }

    // 2. Format conversation context
    const messages: ChatMessage[] = [];
    if (req.history && req.history.length > 0) {
      // Bounded history window: last 8 messages
      messages.push(...req.history.slice(-8));
    }
    messages.push({ role: 'user', content: req.message });

    // 3. Delegate to specialist workers via intent classification
    // Uses pattern scoring rather than naive includes() to prevent false triggers.
    // e.g. "I don't feel threatened" should NOT route to ULTRON.
    let delegatedWorker: string | undefined = undefined;
    const lowerMsg = req.message.toLowerCase();

    const intentScore = {
      ULTRON: 0,
      FRIDAY: 0,
      JARVIS: 0,
    };

    // ULTRON — adversarial / audit focus (requires explicit adversarial intent)
    if (/\brun\s+(an?\s+)?audit\b/i.test(req.message)) intentScore.ULTRON += 3;
    if (/\b(adversarial|exploit|vulnerability|red[\s-]?team)\b/i.test(req.message)) intentScore.ULTRON += 2;
    if (/\b(attack\s+surface|pentest|hack|breach)\b/i.test(req.message)) intentScore.ULTRON += 2;

    // FRIDAY — security / policy focus
    if (/\b(verify|inspect|check)\s+(token|auth|permission)\b/i.test(req.message)) intentScore.FRIDAY += 3;
    if (/\b(security\s+policy|access\s+control|zero[\s-]?trust)\b/i.test(req.message)) intentScore.FRIDAY += 2;
    if (/\b(rate\s+limit|firewall|quarantine)\b/i.test(req.message)) intentScore.FRIDAY += 2;

    // JARVIS — planning / orchestration (owner only)
    if (req.isOwnerAuthenticated) {
      if (/\b(plan|orchestrate|schedule|decompose)\s+(this|the|a|an)?\s*(task|project|workflow)\b/i.test(req.message)) intentScore.JARVIS += 3;
      if (/\b(dispatch|assign|delegate)\s+(worker|agent|specialist)\b/i.test(req.message)) intentScore.JARVIS += 2;
    }

    const topScore = Math.max(...Object.values(intentScore));
    if (topScore >= 2) {
      delegatedWorker = (Object.keys(intentScore) as Array<keyof typeof intentScore>)
        .find((k) => intentScore[k] === topScore);
    }

    // 3b. Execute tool if requested or triggered by specialist worker
    let toolAction: CognitiveExecutionResult['toolAction'] | undefined = undefined;
    let toolExecution: ToolExecutionResponse | undefined = undefined;

    if (this.toolExecutor) {
      if (req.requestedTool) {
        toolExecution = await this.toolExecutor.executeTool({
          agentId: req.requestedTool.agentId,
          toolName: req.requestedTool.toolName,
          input: req.requestedTool.input,
          principal: { id: req.ownerId || req.visitorSessionId || 'anonymous', isOwner: req.isOwnerAuthenticated },
          approvalToken: req.requestedTool.approvalToken,
          approvalId: req.requestedTool.approvalId
        });
      } else if (delegatedWorker === 'ULTRON' && (lowerMsg.includes('adversarial') || lowerMsg.includes('audit'))) {
        toolExecution = await this.toolExecutor.executeTool({
          agentId: 'ULTRON',
          toolName: 'adversarial_audit',
          input: { target: req.message, scope: 'COGNITIVE_CORE' },
          principal: { id: req.ownerId || 'sovereign_ultron', isOwner: true }
        });
      } else if (delegatedWorker === 'JARVIS' && req.isOwnerAuthenticated && lowerMsg.includes('plan')) {
        toolExecution = await this.toolExecutor.executeTool({
          agentId: 'JARVIS',
          toolName: 'plan_task',
          input: { taskName: req.message.slice(0, 50), steps: ['Analyze scope', 'Allocate specialists', 'Execute milestones'] },
          principal: { id: req.ownerId!, isOwner: true }
        });
      }

      if (toolExecution) {
        let status: NonNullable<CognitiveExecutionResult['toolAction']>['status'] = 'DENIED';
        if (toolExecution.requiresApproval) {
          status = 'APPROVAL_REQUIRED';
        } else if (toolExecution.verificationState === 'PLANNED') {
          status = 'PLANNED';
        } else if (toolExecution.verificationState === 'ACKNOWLEDGED') {
          status = 'ACKNOWLEDGED';
        } else if (toolExecution.verificationState === 'VERIFIED') {
          status = 'VERIFIED';
        } else if (toolExecution.verificationState === 'UNAVAILABLE' || toolExecution.reason === 'UNAVAILABLE') {
          status = 'UNAVAILABLE';
        } else if (toolExecution.verificationState === 'NOT_TESTED') {
          status = 'NOT_TESTED';
        } else if (toolExecution.verificationState === 'INCONCLUSIVE') {
          status = 'INCONCLUSIVE';
        } else if (toolExecution.success) {
          status = 'EXECUTED';
        }

        toolAction = {
          tool: toolExecution.toolName,
          status,
          approvalId: toolExecution.approvalId
        };
      }
    }

    // 4. Construct AI request
    const genRequest: GenerateRequest = {
      messages,
      systemPrompt,
      taskType: req.taskType || (delegatedWorker === 'ULTRON' ? 'deep_reasoning' : 'general'),
      privacyClass,
      visitorSessionId: req.visitorSessionId,
      ownerId: req.ownerId
    };

    // 5. Invoke AI Gateway
    const response = await this.providerGateway.generate(genRequest);

    return {
      reply: response.text,
      domain,
      provider: response.providerId,
      model: response.model,
      latencyMs: Date.now() - startTime,
      isFallback: response.isFallback,
      delegatedWorker,
      toolAction,
      toolExecution,
      provenance: {
        source: response.provenance.source,
        timestamp: response.provenance.timestamp,
        memoriesConsulted
      }
    };
  }
}

