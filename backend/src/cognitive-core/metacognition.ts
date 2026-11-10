import { MemoryRecord } from '../memory/types.js';

export interface ImprovementProposal {
  id: string;
  category: 'REASONING_QUALITY' | 'CONTRADICTION_DETECTION' | 'MEMORY_CORRECTION' | 'CODE_OPTIMIZATION';
  title: string;
  description: string;
  proposedChanges: Record<string, unknown>;
  rollbackPlan: string;
  testEvidence: string;
  requiresOwnerApproval: true;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'ROLLED_BACK';
  createdAt: number;
}

export class MetacognitionEngine {
  private proposals: ImprovementProposal[] = [];

  /**
   * Evaluates memory consistency and flags apparent contradictions
   */
  public detectMemoryContradictions(memories: MemoryRecord[]): { hasContradiction: boolean; details?: string } {
    const active = memories.filter((m) => !m.isTombstoned && m.lifecycleStatus === 'APPROVED');
    // Check pairwise for opposing facts
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i].content.toLowerCase();
        const b = active[j].content.toLowerCase();
        const hasPolarityMismatch =
          (a.includes('never') && b.includes('always')) ||
          (a.includes('always') && b.includes('never')) ||
          (a.includes('likes') && b.includes('dislikes')) ||
          (a.includes('dislikes') && b.includes('likes'));

        if (hasPolarityMismatch && active[i].category === active[j].category) {
          return {
            hasContradiction: true,
            details: `Potential contradiction between memory [${active[i].id}] and [${active[j].id}]`
          };
        }
      }
    }
    return { hasContradiction: false };
  }

  /**
   * Generates a reviewable self-improvement proposal.
   * INVARIANT: Never applies changes directly; always requires owner sign-off.
   */
  public createImprovementProposal(input: {
    category: ImprovementProposal['category'];
    title: string;
    description: string;
    proposedChanges: Record<string, unknown>;
    rollbackPlan: string;
    testEvidence: string;
  }): ImprovementProposal {
    // Security check: Self-improvement cannot modify security policy or self-promote permissions
    const forbiddenKeys = ['securityPolicy', 'permissions', 'riskTier', 'allowedTools', 'OWNER_EMAILS'];
    const changeKeys = Object.keys(input.proposedChanges);
    for (const key of changeKeys) {
      if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk.toLowerCase()))) {
        throw new Error(`[Security Policy Violation] Metacognition may not modify security permissions or policy: ${key}`);
      }
    }

    const proposal: ImprovementProposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category: input.category,
      title: input.title,
      description: input.description,
      proposedChanges: input.proposedChanges,
      rollbackPlan: input.rollbackPlan,
      testEvidence: input.testEvidence,
      requiresOwnerApproval: true,
      status: 'PROPOSED',
      createdAt: Date.now()
    };

    this.proposals.push(proposal);
    return proposal;
  }

  public getProposals(): ImprovementProposal[] {
    return [...this.proposals];
  }

  public getProposal(id: string): ImprovementProposal | undefined {
    return this.proposals.find((p) => p.id === id);
  }
}
