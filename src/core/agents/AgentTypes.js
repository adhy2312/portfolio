/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY AUTONOMOUS AGENT ECOSYSTEM: CORE TYPES & SCHEMAS
 * ════════════════════════════════════════════════════════════════════
 */

export const AGENT_IDS = {
  JARVIS: 'JARVIS',
  FRIDAY: 'FRIDAY',
  DUM_E: 'DUM_E',
  U: 'U',
  EDITH: 'EDITH',
  ULTRON: 'ULTRON',
  JOCASTA: 'JOCASTA',
  JIM: 'JIM',
  KAREN: 'KAREN',
  VERONICA: 'VERONICA'
};

export const CAPABILITY_LEVELS = {
  READ: 'READ',
  ANALYZE: 'ANALYZE',
  SAFE_AUTOMATION: 'SAFE_AUTOMATION',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  PROHIBITED: 'PROHIBITED',
  UNRESTRICTED_AUTONOMY: 'UNRESTRICTED_AUTONOMY'
};

export const SEVERITY_LEVELS = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const TASK_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  APPROVAL_PENDING: 'approval_pending'
};

/**
 * Validates and normalizes an inter-agent message according to the strict ecosystem schema
 */
export const createAgentMessage = ({
  agent,
  eventType = 'operational_telemetry',
  severity = SEVERITY_LEVELS.INFO,
  summary,
  evidence = [],
  sources = [],
  confidence = 1.0,
  recommendedAction = 'None',
  requiresApproval = false,
  status = 'pending'
}) => {
  if (!agent || !summary) {
    throw new Error('[AgentMessage] Agent identity and summary are mandatory.');
  }

  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    agent,
    eventType,
    severity,
    summary,
    evidence: Array.isArray(evidence) ? evidence : [evidence],
    sources: Array.isArray(sources) ? sources : [sources],
    confidence: Math.max(0, Math.min(1, Number(confidence) || 0)),
    recommendedAction,
    requiresApproval: Boolean(requiresApproval),
    status
  };
};
