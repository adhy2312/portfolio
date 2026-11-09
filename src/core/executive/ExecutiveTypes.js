/**
 * ════════════════════════════════════════════════════════════════════
 *  MINI-ADHY AUTONOMOUS EXECUTIVE SYSTEM: TYPES & SCHEMAS (PHASE 5)
 * ════════════════════════════════════════════════════════════════════
 * Structured types for task planning, risk tiers, execution lifecycles,
 * concrete verification criteria, and specialist capabilities.
 */

export const RISK_TIERS = Object.freeze({
  LOW_RISK: 'LOW_RISK',
  CONTROLLED: 'CONTROLLED',
  HIGH_IMPACT: 'HIGH_IMPACT',
  PROHIBITED: 'PROHIBITED'
});

export const TASK_EXECUTION_STATUS = Object.freeze({
  PLANNED: 'PLANNED',
  READY: 'READY',
  RUNNING: 'RUNNING',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  RECOVERING: 'RECOVERING',
  // Formal truthful lifecycle states (P1.8 audit remediation)
  PROPOSED: 'PROPOSED',
  PREPARED: 'PREPARED',
  AWAITING_APPROVAL: 'APPROVAL_REQUIRED',
  AUTHORIZED: 'AUTHORIZED',
  EXECUTING: 'RUNNING',
  EXECUTED: 'EXECUTED',
  VERIFIED: 'COMPLETED',
  SIMULATED: 'SIMULATED',
  UNAVAILABLE: 'UNAVAILABLE'
});

export const ACTION_TYPES = Object.freeze({
  RESEARCH: 'RESEARCH',
  FILE_ANALYSIS: 'FILE_ANALYSIS',
  CODE_GENERATION: 'CODE_GENERATION',
  APPLY_CODE_CHANGE: 'APPLY_CODE_CHANGE',
  TEST_EXECUTION: 'TEST_EXECUTION',
  DELEGATE_SPECIALIST: 'DELEGATE_SPECIALIST',
  EXTERNAL_INTEGRATION: 'EXTERNAL_INTEGRATION'
});

/**
 * Explicit capability taxonomy for specialist agent delegation
 */
export const SPECIALIST_CAPABILITIES = Object.freeze({
  JARVIS: {
    agentId: 'JARVIS',
    name: 'JARVIS',
    primaryDomain: 'Operations & Workflow Orchestration',
    capabilities: [
      'task_decomposition',
      'operations_planning',
      'multi_agent_coordination',
      'telemetry_aggregation',
      'workflow_scheduling'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  FRIDAY: {
    agentId: 'FRIDAY',
    name: 'FRIDAY',
    primaryDomain: 'Cybersecurity & Defensive Auditing',
    capabilities: [
      'security_audit',
      'csp_header_analysis',
      'vulnerability_scanning',
      'secret_leak_detection',
      'prototype_pollution_probe'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  ULTRON: {
    agentId: 'ULTRON',
    name: 'ULTRON',
    primaryDomain: 'First-Principles Architectural Critique & Stress Testing',
    capabilities: [
      'first_principles_critique',
      'architectural_stress_testing',
      'flaw_detection',
      'refactoring_proposals',
      'code_smell_deconstruction'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  EDITH: {
    agentId: 'EDITH',
    name: 'EDITH',
    primaryDomain: 'Infrastructure Health & Edge Routing',
    capabilities: [
      'edge_health_check',
      'dns_propagation_probe',
      'latency_benchmarking',
      'serverless_route_audit',
      'cdn_cache_validation'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  DUM_E: {
    agentId: 'DUM_E',
    name: 'DUM_E',
    primaryDomain: 'Data Integrity & Schema Validation',
    capabilities: [
      'schema_validation',
      'data_integrity_probe',
      'cms_dataset_audit',
      'mock_data_sync_check',
      'broken_link_detection'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  U: {
    agentId: 'U',
    name: 'U',
    primaryDomain: 'Zero-Knowledge Privacy & Secret Scrubbing',
    capabilities: [
      'secret_scrubbing',
      'pii_redaction',
      'credential_shielding',
      'storage_privacy_sweep',
      'token_isolation_audit'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  JOCASTA: {
    agentId: 'JOCASTA',
    name: 'JOCASTA',
    primaryDomain: 'Web Performance & Core Web Vitals',
    capabilities: [
      'core_web_vitals_audit',
      'fps_drawcall_profiling',
      'cls_shift_detection',
      'bundle_size_analysis',
      'css_reflow_optimization'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  JIM: {
    agentId: 'JIM',
    name: 'JIM',
    primaryDomain: 'Synthetic Browser QA & Touch Responsiveness',
    capabilities: [
      'synthetic_ui_test',
      'touch_responsiveness_simulation',
      'viewport_boundary_check',
      'click_target_audit',
      'accessibility_focus_check'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  KAREN: {
    agentId: 'KAREN',
    name: 'KAREN',
    primaryDomain: 'Technical SEO & Discovery',
    capabilities: [
      'seo_meta_audit',
      'json_ld_schema_validation',
      'open_graph_validation',
      'sitemap_indexing_check',
      'heading_hierarchy_audit'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  VERONICA: {
    agentId: 'VERONICA',
    name: 'VERONICA',
    primaryDomain: 'Emerging Technology & Graphics Horizons',
    capabilities: [
      'webgpu_shader_research',
      'client_wasm_benchmarking',
      'technology_horizon_scan',
      'vector_search_evaluation',
      'experimental_framework_probe'
    ],
    riskCeiling: RISK_TIERS.LOW_RISK
  },
  HERMES: {
    agentId: 'HERMES',
    name: 'HERMES',
    primaryDomain: 'Cross-Platform Dispatch & Hardware Telemetry',
    capabilities: [
      'cross_device_dispatch',
      'toast_notification_stream',
      'rf_packet_bridge',
      'inter_agent_messaging',
      'hardware_nexus_sync'
    ],
    riskCeiling: RISK_TIERS.CONTROLLED
  }
});

