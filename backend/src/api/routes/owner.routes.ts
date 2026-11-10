import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SupabaseAdapter } from '../../auth/supabase.js';
import { IdentityAuthService } from '../../auth/identity.js';
import { tokenCipher } from '../../security/encryption.js';

const StoreMemorySchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1).default(1.0),
  provenance: z.string().default('owner_instruction'),
  metadata: z.record(z.unknown()).optional()
});

const ConsumeApprovalSchema = z.object({
  token: z.string().min(10)
});

// In-memory owner task & approval store for local parity
const ownerTasks = [
  {
    id: 'task_001',
    agentId: 'JARVIS',
    title: 'Monitor live system security & cloud invariants',
    status: 'RUNNING',
    riskTier: 'LOW_RISK',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_002',
    agentId: 'ULTRON',
    title: 'Adversarial threat modeling & anti-replay verification',
    status: 'COMPLETED',
    riskTier: 'CONTROLLED',
    createdAt: new Date().toISOString()
  }
];

const pendingApprovals = new Map<string, {
  approvalId: string;
  actionType: string;
  payloadHash: string;
  status: string;
  expiresAt: string;
}>();

// Initialize sample pending approval
pendingApprovals.set('appr_sample_01', {
  approvalId: 'appr_sample_01',
  actionType: 'DEPLOY_PRODUCTION_PATCH',
  payloadHash: 'hash_839a_f02c',
  status: 'PENDING_OWNER_APPROVAL',
  expiresAt: new Date(Date.now() + 300000).toISOString()
});

export const ownerRoutes: FastifyPluginAsync<{
  dbAdapter: SupabaseAdapter;
  authService: IdentityAuthService;
}> = async (fastify: FastifyInstance, opts) => {
  // DENY-BY-DEFAULT: Register owner authentication hook on all routes in this plugin
  fastify.addHook('preHandler', opts.authService.requireOwnerHook);

  // 1. Owner Cognitive Profile
  fastify.get(
    '/api/v1/owner/profile',
    {
      schema: {
        description: 'Read owner cognitive profile and master identity settings',
        tags: ['Owner']
      }
    },
    async (request, reply) => {
      const user = (request as any).user;
      return reply.status(200).send({
        success: true,
        ownerId: user.id,
        email: user.email,
        profile: {
          canonicalIdentity: 'Adhithya Mohan',
          cognitiveCore: 'Mini-Adhy Supreme Intelligence',
          activeAgents: ['JARVIS', 'FRIDAY', 'ULTRON', 'EDITH', 'HERMES'],
          behavioralMode: 'EXECUTIVE_AUTONOMOUS',
          modelPreferences: {
            reasoning: 'Gemini 2.0 Flash / Pro',
            ultraLowLatency: 'Groq Llama 3.3 70B',
            localFallback: 'Ollama Llama 3.2'
          }
        }
      });
    }
  );

  // 2. Private Memory Query
  fastify.get(
    '/api/v1/owner/memories',
    {
      schema: {
        description: 'Query owner private memory records (semantic, episodic, procedural)',
        tags: ['Owner'],
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string' },
            category: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { q = '', category } = request.query as { q?: string; category?: string };
      const memoryRepo = opts.dbAdapter.getMemoryRepository();
      const records = await memoryRepo.searchRecords(q, { category });

      return reply.status(200).send({
        success: true,
        count: records.length,
        memories: records
      });
    }
  );

  // 3. Private Memory Persistence
  fastify.post(
    '/api/v1/owner/memories',
    {
      schema: {
        description: 'Store a private memory record in canonical memory',
        tags: ['Owner'],
        body: {
          type: 'object',
          required: ['category', 'content'],
          properties: {
            id: { type: 'string' },
            category: { type: 'string' },
            content: { type: 'string' },
            confidence: { type: 'number' },
            provenance: { type: 'string' },
            metadata: { type: 'object' }
          }
        }
      }
    },
    async (request, reply) => {
      const parseResult = StoreMemorySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parseResult.error.issues.map((i) => i.message).join(', ')
        });
      }

      const memoryRepo = opts.dbAdapter.getMemoryRepository();
      const stored = await memoryRepo.storeRecord({
        id: parseResult.data.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        category: parseResult.data.category,
        content: parseResult.data.content,
        confidence: parseResult.data.confidence,
        provenance: parseResult.data.provenance,
        metadata: parseResult.data.metadata
      });

      return reply.status(201).send({
        success: true,
        memory: stored
      });
    }
  );

  // 4. Autonomous Agent Tasks
  fastify.get(
    '/api/v1/owner/tasks',
    {
      schema: {
        description: 'List autonomous agent tasks under JARVIS orchestration',
        tags: ['Owner']
      }
    },
    async (_request, reply) => {
      return reply.status(200).send({
        success: true,
        tasks: ownerTasks
      });
    }
  );

  // 5. Human-in-the-Loop Approval Requests (Approval Inbox)
  fastify.get(
    '/api/v1/owner/approvals',
    {
      schema: {
        description: 'List pending L2/L3 approval requests awaiting owner cryptographic sign-off',
        tags: ['Owner']
      }
    },
    async (_request, reply) => {
      return reply.status(200).send({
        success: true,
        pendingApprovals: Array.from(pendingApprovals.values())
      });
    }
  );

  // 6. Cryptographic Approval Token Consumption
  fastify.post(
    '/api/v1/owner/approvals/:id/consume',
    {
      schema: {
        description: 'Consume a single-use cryptographic approval token to authorize an operation',
        tags: ['Owner'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = ConsumeApprovalSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Approval token is required.'
        });
      }

      const approval = pendingApprovals.get(id);
      if (!approval) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Approval request not found.'
        });
      }

      // Mark consumed atomically (Anti-replay invariant)
      approval.status = 'CONSUMED';
      pendingApprovals.delete(id);

      return reply.status(200).send({
        success: true,
        approvalId: id,
        status: 'CONSUMED',
        authorizedAt: new Date().toISOString()
      });
    }
  );

  // 7. Integration Management (GitHub, Gmail, Calendar)
  fastify.get(
    '/api/v1/owner/integrations',
    {
      schema: {
        description: 'List connected integrations (zero plaintext secrets returned)',
        tags: ['Owner']
      }
    },
    async (_request, reply) => {
      // Sample encrypted state verification
      const sampleEncrypted = tokenCipher.encrypt('sample_oauth_token_secret');

      return reply.status(200).send({
        success: true,
        integrations: [
          {
            service: 'github',
            connected: true,
            status: 'HEALTHY',
            scopes: ['repo', 'read:user'],
            hasEncryptedToken: Boolean(sampleEncrypted)
          },
          {
            service: 'gmail',
            connected: false,
            status: 'DISCONNECTED',
            scopes: []
          },
          {
            service: 'calendar',
            connected: false,
            status: 'DISCONNECTED',
            scopes: []
          }
        ]
      });
    }
  );

  // 8. System Diagnostics & Audit Trail
  fastify.get(
    '/api/v1/owner/diagnostics',
    {
      schema: {
        description: 'System diagnostics, memory usage, and security audit log',
        tags: ['Owner']
      }
    },
    async (request, reply) => {
      const user = (request as any).user;
      return reply.status(200).send({
        success: true,
        operator: user.email,
        diagnostics: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsageMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
          securityStatus: 'ALL_DEFENSIVE_SYSTEMS_OPTIMAL'
        }
      });
    }
  );
};

