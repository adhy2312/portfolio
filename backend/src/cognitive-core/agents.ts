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
    // 1. JARVIS — Executive Planning & Delegation
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

    // 2. FRIDAY — Defensive Security, Governance & Approvals
    this.register({
      id: 'FRIDAY',
      name: 'F.R.I.D.A.Y.',
      role: 'Security Governance & Authorization Policy',
      description: 'Evaluates action safety, enforces human-in-the-loop approvals, and prevents unauthorized execution.',
      allowedTools: ['verify_signature', 'check_permission', 'request_human_approval', 'audit_event'],
      riskTier: 'READ_ONLY',
      timeoutMs: 5000,
      maxExecutionBudget: 3,
      requiresOwnerApproval: false
    });

    // 3. ULTRON — Threat Modeling, Adversarial Red-Teaming & Deep Audit
    this.register({
      id: 'ULTRON',
      name: 'U.L.T.R.O.N.',
      role: 'Adversarial Threat Auditor & Deep Reasoning Challenger',
      description: 'Challenges reasoning, performs automated boundary vulnerability scans, and audits system invariants.',
      allowedTools: ['adversarial_audit', 'contradiction_check', 'threat_scan', 'invariant_verify'],
      riskTier: 'CONTROLLED',
      timeoutMs: 20000,
      maxExecutionBudget: 4,
      requiresOwnerApproval: false
    });

    // 4. EDITH — Tactical Security & Global Telemetry
    this.register({
      id: 'EDITH',
      name: 'E.D.I.T.H.',
      role: 'Tactical Reconnaissance & External Threat Telemetry',
      description: 'Inspects external web assets, packages, and network telemetry.',
      allowedTools: ['read_telemetry', 'check_reputation', 'query_cve'],
      riskTier: 'LOW_RISK',
      timeoutMs: 10000,
      maxExecutionBudget: 3,
      requiresOwnerApproval: false
    });

    // 5. HERMES — Device & Hardware Bridge (High Impact)
    this.register({
      id: 'HERMES',
      name: 'H.E.R.M.E.S.',
      role: 'Hardware & IoT Actuation Bridge',
      description: 'Communicates with local microcontrollers and hardware peripherals.',
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

