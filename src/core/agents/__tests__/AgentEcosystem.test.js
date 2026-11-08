jest.mock('../../../sanity', () => ({
  client: {
    fetch: jest.fn().mockResolvedValue([]),
  },
  urlFor: jest.fn().mockReturnValue({ url: () => '' }),
}));

import { agentOrchestrator } from '../AgentOrchestrator';
import { AGENT_IDS, CAPABILITY_LEVELS } from '../AgentTypes';
import { permissionRegistry } from '../PermissionRegistry';
import { EmotionEngine } from '../EmotionEngine';

describe('Mini-Adhy Autonomous AI Ecosystem', () => {
  test('All 11 specialist agents are registered under Mini-Adhy including HERMES', () => {
    const registeredAgents = Object.keys(agentOrchestrator.agents);
    expect(registeredAgents.length).toBe(11);
    expect(registeredAgents).toEqual(expect.arrayContaining([
      'JARVIS', 'FRIDAY', 'DUM_E', 'U', 'EDITH', 'ULTRON', 'JOCASTA', 'JIM', 'KAREN', 'VERONICA', 'HERMES'
    ]));
  });

  test('All specialist agents inherit from BaseAgent with valid metadata', () => {
    Object.values(agentOrchestrator.agents).forEach(agent => {
      expect(agent.name).toBeDefined();
      expect(agent.role).toBeDefined();
      expect(typeof agent.run).toBe('function');
      expect(typeof agent.getTelemetry).toBe('function');
      const telemetry = agent.getTelemetry();
      expect(telemetry.name).toBe(agent.name);
    });
  });

  test('EmotionEngine regulates FRIDAY and JARVIS within strict 0 to 1 bounds', () => {
    const fridayEngine = new EmotionEngine('FRIDAY');
    expect(fridayEngine.state.vigilance).toBeGreaterThanOrEqual(0);
    expect(fridayEngine.state.vigilance).toBeLessThanOrEqual(1);

    fridayEngine.stimulate('THREAT_DETECTED', { summary: 'High threat test' });
    expect(fridayEngine.state.vigilance).toBeGreaterThan(0.7);
    expect(fridayEngine.state.regulationMode).toBe('tactical_alert');

    const jarvisEngine = new EmotionEngine('JARVIS');
    expect(jarvisEngine.state.calmness).toBeGreaterThanOrEqual(0);
    expect(jarvisEngine.state.calmness).toBeLessThanOrEqual(1);
  });

  test('PermissionRegistry blocks unauthorized operations', () => {
    const prohibitedCheck = permissionRegistry.authorize(
      'ULTRON',
      'unrestricted_shell_execution',
      CAPABILITY_LEVELS.PROHIBITED
    );
    expect(prohibitedCheck.authorized).toBe(false);

    const approvalCheck = permissionRegistry.authorize(
      'FRIDAY',
      'edit_website_source_code',
      CAPABILITY_LEVELS.APPROVAL_REQUIRED
    );
    expect(approvalCheck.authorized).toBe(false);
    expect(approvalCheck.pendingApproval).toBe(true);
  });

  test('Mini-Adhy Orchestrator compiles Weekly Intelligence Report', () => {
    const report = agentOrchestrator.generateWeeklyReport();
    expect(report).toBeDefined();
    expect(report.reportingPeriod).toBeDefined();
    expect(report.healthScore).toBeGreaterThanOrEqual(90);
    expect(report.executiveSummary).toContain('Mini-Adhy Supreme Intelligence Hub');
  });

  test('HERMES agent dispatches toasts, streams RF packets, and manages inter-agent messages', () => {
    const hermes = agentOrchestrator.agents.HERMES;
    expect(hermes).toBeDefined();
    expect(hermes.name).toBe('HERMES');

    const toast = hermes.dispatchToast('System Alert', 'Cross-platform dispatch operational', { type: 'success' });
    expect(toast.sender).toBe('HERMES');
    expect(toast.title).toBe('System Alert');

    const rf = hermes.streamRfPacketTelemetry(433.92, 'FSK_TELEMETRY');
    expect(rf.frequencyMhz).toBe(433.92);
    expect(rf.protocol).toBe('FSK_TELEMETRY');

    const route = hermes.routeInterAgentMessage('JARVIS', 'ULTRON', 'Coordinate zero-debt architecture');
    expect(route.sender).toBe('JARVIS');
    expect(route.recipient).toBe('ULTRON');
  });
});
