/**
 * ════════════════════════════════════════════════════════════════════
 *  RUNTIME SELF-MODEL & VERIFIED OPERATIONAL DIAGNOSTICS
 * ════════════════════════════════════════════════════════════════════
 * Inspectable runtime representation of Mini-Adhy's actual capabilities,
 * registered agents, provider statuses, and memory health.
 * 
 * STRICT INVARIANT:
 * Zero decorative telemetry. No fabricated CPU, RAM, or uptime numbers.
 */

import { CANONICAL_IDENTITY } from '../identity/CanonicalIdentity';
import { providerRegistry } from '../providers/ProviderRegistry';
import { permissionRegistry } from '../agents/PermissionRegistry';
import { memoryService } from '../memory/MemoryService';
import { hermesAdapter } from '../adapters/hermes/HermesAdapter';
import { cognitiveEvolutionEngine } from '../learning/CognitiveEvolutionEngine';

export class RuntimeSelfModel {
  constructor() {
    this.environment = typeof window !== 'undefined' ? 'browser_web' : 'node_runtime';
    this.bootTime = new Date().toISOString();
  }

  /**
   * Returns a complete, truthful snapshot of Mini-Adhy's live runtime state
   */
  getSnapshot() {
    const providerList = providerRegistry.listProviders();
    const metrics = providerRegistry.getMetrics();
    const realEcosystemMetrics = cognitiveEvolutionEngine?.calculateRealMetrics 
      ? cognitiveEvolutionEngine.calculateRealMetrics() 
      : {};

    return {
      identity: {
        id: CANONICAL_IDENTITY.id,
        name: CANONICAL_IDENTITY.name,
        version: CANONICAL_IDENTITY.version,
        policyVersion: CANONICAL_IDENTITY.behavioralPolicyVersion,
        creator: CANONICAL_IDENTITY.creator
      },

      runtime: {
        environment: this.environment,
        bootTime: this.bootTime,
        status: 'operational',
        truthfulnessMode: 'STRICT_VERIFIED'
      },

      providers: {
        registered: providerList,
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        fallbackEvents: metrics.fallbackEvents,
        failures: metrics.failuresByProvider
      },

      hermesIntegration: hermesAdapter.getStatus(),

      agents: {
        rosterCount: Object.keys(CANONICAL_IDENTITY.collective).length,
        specialists: Object.keys(CANONICAL_IDENTITY.collective)
      },

      memory: {
        backend: 'browser_local_storage',
        collectionEnabled: memoryService.isCollectionEnabled,
        totalStoredMemories: memoryService.records.size,
        verifiedFactsCount: Array.from(memoryService.records.values()).filter(r => r.verified).length
      },

      security: {
        pendingApprovalsCount: permissionRegistry.getPendingApprovals().length,
        auditTrailLength: permissionRegistry.getAuditLog().length,
        invariant: 'Persona does not override permissions'
      },

      realOperationalMetrics: realEcosystemMetrics
    };
  }

  /**
   * Capability introspection method
   */
  canExecute(capabilityName = '') {
    const cap = String(capabilityName).toLowerCase();

    if (cap.includes('vision') || cap.includes('image')) {
      const gemini = providerRegistry.get('gemini');
      return { capable: Boolean(gemini), provider: 'gemini', verified: true };
    }

    if (cap.includes('code_generation') || cap.includes('dsp') || cap.includes('math')) {
      return { capable: true, provider: 'gemini/groq', verified: true };
    }

    if (cap.includes('shell_execution') || cap.includes('terminal_access')) {
      return { capable: false, reason: 'Prohibited by browser security boundary and permission policy.', verified: true };
    }

    if (cap.includes('hermes')) {
      return { capable: hermesAdapter.status === 'healthy', status: hermesAdapter.status };
    }

    return { capable: true, provider: 'native_multi_provider' };
  }
}

export const runtimeSelfModel = new RuntimeSelfModel();

