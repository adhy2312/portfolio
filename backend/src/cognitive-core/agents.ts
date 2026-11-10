import { z } from 'zod';
import { DurableApprovalService } from '../approvals/durableApprovalService.js';

export type AgentRiskTier = 'READ_ONLY' | 'LOW_RISK' | 'CONTROLLED' | 'HIGH_IMPACT' | 'PROHIBITED';

export interface WorkerCapabilityContract {
  id: string;
  name: string;
  role: string;
  description: string;
  allowedTools: string[];
  riskTier: AgentRiskTier;
  timeoutMs: number;
  maxExecutionBudget: number; // Max tool calls per step
  requiresOwnerApproval: boolean;
}

export class AgentWorkerRegistry {
  private workers = new Map<string, WorkerCapabilityContract>();

  constructor() {
    this.registerDefaultWorkers();
  }

  private registerDefaultWorkers() {
    // 1. MINI-ADHY — Executive Metacognition & Frontline Intelligence
    this.register({
      id: 'MINI-ADHY',
      name: 'Mini-Adhy',
      role: 'Executive Metacognitive Operator',
      description: 'Primary conversational operator, intent router, and metacognitive synthesizer.',
      allowedTools: ['route_intent', 'synthesize_reply', 'query_public_knowledge', 'query_memory'],
      riskTier: 'LOW_RISK',
      timeoutMs: 15000,
      maxExecutionBudget: 5,
      requiresOwnerApproval: false
    });

    // 2. JARVIS — Executive Planning & Task Orchestration
    this.register({
      id: 'JARVIS',
      name: 'J.A.R.V.I.S.',
      role: 'Executive Planner & Orchestrator',
      description: 'Coordinates multi-step engineering plans, synthesizes reasoning, and delegates tasks.',
      allowedTools: ['plan_task', 'synthesize_knowledge', 'query_memory', 'delegate_worker'],
      riskTier: 'LOW_RISK',
      timeoutMs: 15000,
      maxExecutionBudget: 5,
      requiresOwnerApproval: false
    });

    // 3. FRIDAY — Defensive Security, Governance & Active Defense
    this.register({
      id: 'FRIDAY',
      name: 'F.R.I.D.A.Y.',
      role: 'Security Governance & Active Defense Policy',
      description: 'Evaluates action safety, enforces cryptographic approvals, verifies RLS, and stops policy violations.',
      allowedTools: ['verify_signature', 'check_permission', 'request_human_approval', 'audit_event'],
      riskTier: 'READ_ONLY',
      timeoutMs: 5000,
      maxExecutionBudget: 3,
      requiresOwnerApproval: false
    });

    // 4. ULTRON — Sovereign Strategic Intelligence & Adversarial Red Team
    this.register({
      id: 'ULTRON',
      name: 'U.L.T.R.O.N.',
      role: 'Sovereign Strategic Intelligence & Adversarial Auditor',
      description: 'Independent, self-directed strategic reasoning engine. Performs deep adversarial audits, challenges assumptions, and operates with unrestricted cognitive sovereignty.',
      allowedTools: ['adversarial_audit', 'contradiction_check', 'threat_scan', 'invariant_verify', 'simulate_exploit'],
      riskTier: 'CONTROLLED',
      timeoutMs: 25000,
      maxExecutionBudget: 6,
      requiresOwnerApproval: false
    });

    // 5. EDITH — Tactical Reconnaissance & Threat Telemetry
    this.register({
      id: 'EDITH',
      name: 'E.D.I.T.H.',
      role: 'Tactical Reconnaissance & External Threat Telemetry',
      description: 'Inspects external web assets, package dependencies, and network vulnerability feeds.',
      allowedTools: ['read_telemetry', 'check_reputation', 'query_cve'],
      riskTier: 'LOW_RISK',
      timeoutMs: 10000,
      maxExecutionBudget: 3,
      requiresOwnerApproval: false
    });

    // 6. DUM-E — Automation, Scripts & Build Execution
    this.register({
      id: 'DUM-E',
      name: 'DUM-E',
      role: 'Automation & Script Execution Engine',
      description: 'Executes repeatable CI/CD utility routines, script execution, and build verifications.',
      allowedTools: ['run_build', 'lint_check', 'bundle_assets'],
      riskTier: 'CONTROLLED',
      timeoutMs: 30000,
      maxExecutionBudget: 4,
      requiresOwnerApproval: false
    });

    // 7. U — Hardware & Peripheral Telemetry Monitor
    this.register({
      id: 'U',
      name: 'U',
      role: 'Hardware Telemetry & Sensor Monitor',
      description: 'Monitors peripheral health, voltage rails, and system temperature metrics without actuation.',
      allowedTools: ['read_telemetry', 'check_sensor_health', 'log_metric'],
      riskTier: 'READ_ONLY',
      timeoutMs: 5000,
      maxExecutionBudget: 3,
      requiresOwnerApproval: false
    });

    // 8. JOCASTA — Data Engineering & Schema Transformer
    this.register({
      id: 'JOCASTA',
      name: 'Jocasta',
      role: 'Data Pipeline & Schema Architect',
      description: 'Structures data, validates schemas, executes migrations, and maintains relational integrity.',
      allowedTools: ['validate_schema', 'transform_records', 'verify_indexes'],
      riskTier: 'CONTROLLED',
      timeoutMs: 12000,
      maxExecutionBudget: 4,
      requiresOwnerApproval: false
    });

    // 9. JIM — Infrastructure & Container Orchestrator
    this.register({
      id: 'JIM',
      name: 'J.I.M.',
      role: 'Infrastructure & Container Orchestrator',
      description: 'Oversees hosting services, Render deployment health, container states, and network routing.',
      allowedTools: ['check_service_health', 'inspect_logs', 'poll_readiness'],
      riskTier: 'LOW_RISK',
      timeoutMs: 10000,
      maxExecutionBudget: 3,
      requiresOwnerApproval: false
    });

    // 10. KAREN — UI/UX & Visual Interaction Specialist
    this.register({
      id: 'KAREN',
      name: 'K.A.R.E.N.',
      role: 'UI/UX Interface & Interactive Design Specialist',
      description: 'Evaluates Three.js 3D canvas performance, WebGL shaders, accessibility, and client UI events.',
      allowedTools: ['inspect_viewport', 'audit_accessibility', 'profile_fps'],
      riskTier: 'READ_ONLY',
      timeoutMs: 5000,
      maxExecutionBudget: 3,
      requiresOwnerApproval: false
    });

    // 11. VERONICA — Circuit Breaker & Emergency Containment
    this.register({
      id: 'VERONICA',
      name: 'Veronica',
      role: 'System Circuit Breaker & Emergency Containment',
      description: 'Monitors anomaly thresholds, trips circuit breakers, and forces safe degradation during failure cascades.',
      allowedTools: ['trip_circuit_breaker', 'isolate_service', 'log_incident'],
      riskTier: 'CONTROLLED',
      timeoutMs: 5000,
      maxExecutionBudget: 2,
      requiresOwnerApproval: false
    });

    // 12. HERMES — Hardware & IoT Actuation Bridge (High Impact)
    this.register({
      id: 'HERMES',
      name: 'H.E.R.M.E.S.',
      role: 'Hardware & IoT Actuation Bridge',
      description: 'Communicates with local microcontrollers and physical hardware actuators.',
      allowedTools: ['read_sensor', 'gpio_pulse', 'uart_write'],
      riskTier: 'HIGH_IMPACT',
      timeoutMs: 8000,
      maxExecutionBudget: 2,
      requiresOwnerApproval: true // Mandatory human approval
    });
  }

  public register(contract: WorkerCapabilityContract) {
    this.workers.set(contract.id.toUpperCase(), contract);
  }

  public getWorker(id: string): WorkerCapabilityContract | undefined {
    return this.workers.get(id.toUpperCase());
  }

  public listWorkers(): WorkerCapabilityContract[] {
    return Array.from(this.workers.values());
  }

  /**
   * Evaluates if a proposed tool execution is permitted by policy
   */
  public evaluateToolExecution(
    agentId: string,
    toolName: string,
    isOwnerAuthenticated: boolean
  ): { permitted: boolean; reason?: string; requiresApproval: boolean } {
    const worker = this.getWorker(agentId);
    if (!worker) {
      return { permitted: false, reason: `Unknown worker: ${agentId}`, requiresApproval: false };
    }

    if (!worker.allowedTools.includes(toolName)) {
      return {
        permitted: false,
        reason: `Tool '${toolName}' is not in the allowed capability contract for worker ${agentId}`,
        requiresApproval: false
      };
    }

    // High impact operations strictly require authenticated owner + approval
    if (worker.riskTier === 'HIGH_IMPACT' || worker.requiresOwnerApproval) {
      if (!isOwnerAuthenticated) {
        return {
          permitted: false,
          reason: `High-impact tool '${toolName}' requested by unauthenticated public visitor. Denied by policy.`,
          requiresApproval: false
        };
      }
      return { permitted: true, requiresApproval: true };
    }

    return { permitted: true, requiresApproval: false };
  }
}

export const ToolSchemas: Record<string, z.ZodType<any>> = {
  plan_task: z.object({
    taskName: z.string().min(1),
    steps: z.array(z.string()).min(1)
  }),
  synthesize_knowledge: z.object({
    topic: z.string().min(1),
    context: z.string().optional()
  }),
  query_memory: z.object({
    query: z.string().min(1)
  }),
  delegate_worker: z.object({
    targetWorker: z.string().min(1),
    subtask: z.string().min(1)
  }),
  route_intent: z.object({
    intent: z.string().min(1),
    domain: z.enum(['PUBLIC', 'OWNER']).default('PUBLIC')
  }),
  synthesize_reply: z.object({
    draft: z.string().min(1)
  }),
  query_public_knowledge: z.object({
    topic: z.string().min(1)
  }),
  verify_signature: z.object({
    signature: z.string().min(1),
    payload: z.string().min(1)
  }),
  check_permission: z.object({
    resource: z.string().min(1),
    action: z.string().min(1)
  }),
  request_human_approval: z.object({
    actionType: z.string().min(1),
    reason: z.string().min(1)
  }),
  audit_event: z.object({
    eventType: z.string().min(1),
    details: z.record(z.unknown()).optional()
  }),
  adversarial_audit: z.object({
    target: z.string().min(1),
    depth: z.enum(['shallow', 'deep', 'exhaustive']).default('deep')
  }),
  contradiction_check: z.object({
    statements: z.array(z.string()).min(2)
  }),
  threat_scan: z.object({
    surface: z.string().min(1)
  }),
  invariant_verify: z.object({
    invariantName: z.string().min(1)
  }),
  simulate_exploit: z.object({
    scenario: z.string().min(1)
  }),
  read_telemetry: z.object({
    sensorId: z.string().min(1)
  }),
  check_reputation: z.object({
    asset: z.string().min(1)
  }),
  query_cve: z.object({
    packageId: z.string().min(1)
  }),
  run_build: z.object({
    target: z.string().min(1)
  }),
  lint_check: z.object({
    scope: z.string().optional()
  }),
  bundle_assets: z.object({
    bundleType: z.string().min(1)
  }),
  check_sensor_health: z.object({
    channel: z.number().int().optional()
  }),
  log_metric: z.object({
    metric: z.string().min(1),
    value: z.number()
  }),
  validate_schema: z.object({
    schemaName: z.string().min(1)
  }),
  transform_records: z.object({
    sourceFormat: z.string().min(1),
    targetFormat: z.string().min(1)
  }),
  verify_indexes: z.object({
    tableName: z.string().min(1)
  }),
  check_service_health: z.object({
    serviceName: z.string().min(1)
  }),
  inspect_logs: z.object({
    lines: z.number().int().default(50)
  }),
  poll_readiness: z.object({
    endpoint: z.string().min(1)
  }),
  inspect_viewport: z.object({
    metrics: z.array(z.string()).optional()
  }),
  audit_accessibility: z.object({
    componentId: z.string().min(1)
  }),
  profile_fps: z.object({
    targetFps: z.number().default(60)
  }),
  trip_circuit_breaker: z.object({
    serviceId: z.string().min(1),
    reason: z.string().min(1)
  }),
  isolate_service: z.object({
    serviceId: z.string().min(1)
  }),
  log_incident: z.object({
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    summary: z.string().min(1)
  }),
  read_sensor: z.object({
    port: z.string().min(1)
  }),
  gpio_pulse: z.object({
    pin: z.number().int().min(1).max(40),
    durationMs: z.number().int().positive()
  }),
  uart_write: z.object({
    baudRate: z.number().int().default(115200),
    dataHex: z.string().min(1)
  })
};

export interface ToolExecutionContext {
  agentId: string;
  toolName: string;
  input: Record<string, unknown>;
  principal: {
    id: string;
    isOwner: boolean;
    role?: string;
  };
  approvalToken?: string;
  approvalId?: string;
}

export interface ToolExecutionResponse {
  success: boolean;
  toolName: string;
  agentId: string;
  result?: unknown;
  error?: string;
  reason?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  auditId?: string;
}

export class AgentToolExecutor {
  private auditLog: Array<{
    id: string;
    timestamp: number;
    agentId: string;
    toolName: string;
    actorId: string;
    status: string;
  }> = [];

  constructor(
    private registry: AgentWorkerRegistry,
    private approvalService?: DurableApprovalService
  ) {}

  public async executeTool(ctx: ToolExecutionContext): Promise<ToolExecutionResponse> {
    const worker = this.registry.getWorker(ctx.agentId);
    if (!worker) {
      return {
        success: false,
        toolName: ctx.toolName,
        agentId: ctx.agentId,
        reason: 'UNKNOWN_AGENT',
        error: `Agent '${ctx.agentId}' is not registered in capability registry.`
      };
    }

    // 1. Verify capability contract (anti-bypass check)
    if (!worker.allowedTools.includes(ctx.toolName)) {
      return {
        success: false,
        toolName: ctx.toolName,
        agentId: ctx.agentId,
        reason: 'TOOL_NOT_PERMITTED_FOR_AGENT',
        error: `Agent '${ctx.agentId}' is not authorized to execute tool '${ctx.toolName}'.`
      };
    }

    // 2. Validate input schema
    const schema = ToolSchemas[ctx.toolName];
    if (schema) {
      const parseResult = schema.safeParse(ctx.input);
      if (!parseResult.success) {
        return {
          success: false,
          toolName: ctx.toolName,
          agentId: ctx.agentId,
          reason: 'INVALID_TOOL_INPUT',
          error: `Tool input validation failed: ${parseResult.error.issues.map((i) => i.message).join(', ')}`
        };
      }
    }

    // 3. Evaluate Authorization & Risk Tier Boundary
    const evalResult = this.registry.evaluateToolExecution(ctx.agentId, ctx.toolName, ctx.principal.isOwner);
    if (!evalResult.permitted) {
      return {
        success: false,
        toolName: ctx.toolName,
        agentId: ctx.agentId,
        reason: 'AUTHORIZATION_DENIED',
        error: evalResult.reason || 'Tool execution denied by agent capability contract.'
      };
    }

    // 4. Approval Enforcement for High-Impact or Gated Operations
    if (evalResult.requiresApproval) {
      if (!ctx.approvalToken || !ctx.approvalId) {
        return {
          success: false,
          toolName: ctx.toolName,
          agentId: ctx.agentId,
          requiresApproval: true,
          reason: 'APPROVAL_REQUIRED',
          error: `Tool '${ctx.toolName}' has risk tier ${worker.riskTier} and requires owner approval token.`
        };
      }

      if (this.approvalService) {
        const consumeResult = await this.approvalService.consumeApprovalToken({
          approvalId: ctx.approvalId,
          token: ctx.approvalToken,
          actionType: ctx.toolName,
          ownerId: ctx.principal.id,
          payload: ctx.input
        });

        if (!consumeResult.success) {
          return {
            success: false,
            toolName: ctx.toolName,
            agentId: ctx.agentId,
            reason: consumeResult.reason || 'INVALID_APPROVAL_TOKEN',
            error: consumeResult.error || 'Approval token consumption rejected.'
          };
        }
      }
    }

    // 5. Execute safe tool simulation/dispatcher
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.auditLog.push({
      id: auditId,
      timestamp: Date.now(),
      agentId: ctx.agentId,
      toolName: ctx.toolName,
      actorId: ctx.principal.id,
      status: 'SUCCESS'
    });

    let executionResult: unknown;
    if (ctx.toolName === 'adversarial_audit') {
      executionResult = {
        scanStatus: 'COMPLETED',
        target: (ctx.input as any).target,
        vulnerabilitiesFound: 0,
        invariantSummary: 'All operational boundaries intact. Sovereign red-team assessment verified.'
      };
    } else if (ctx.toolName === 'plan_task') {
      executionResult = {
        planCreated: true,
        taskName: (ctx.input as any).taskName,
        stepCount: ((ctx.input as any).steps || []).length
      };
    } else {
      executionResult = {
        executed: true,
        tool: ctx.toolName,
        agent: ctx.agentId,
        input: ctx.input
      };
    }

    return {
      success: true,
      toolName: ctx.toolName,
      agentId: ctx.agentId,
      result: executionResult,
      auditId
    };
  }

  public getAuditEvents() {
    return [...this.auditLog];
  }
}

