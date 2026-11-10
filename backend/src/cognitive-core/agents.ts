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

