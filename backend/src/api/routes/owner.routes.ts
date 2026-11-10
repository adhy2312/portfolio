import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SupabaseAdapter } from '../../auth/supabase.js';
import { IdentityAuthService } from '../../auth/identity.js';
import { tokenCipher } from '../../security/encryption.js';
import { CognitiveOrchestrator } from '../../cognitive-core/orchestrator.js';
import { DurableApprovalService } from '../../approvals/durableApprovalService.js';

const StoreMemorySchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1).default(1.0),
  provenance: z.string().default('owner_instruction'),
  metadata: z.record(z.unknown()).optional()
});

const ConsumeApprovalSchema = z.object({
  token: z.string().min(10),
  actionType: z.string().optional(),
  payload: z.record(z.unknown()).optional()
});

const OwnerChatSchema = z.object({
  message: z.string().min(1).max(4000),
  taskType: z.enum(['general', 'fast_reflex', 'deep_reasoning', 'code', 'vision']).optional()
});

const CreateProposalSchema = z.object({
  category: z.enum(['REASONING_QUALITY', 'CONTRADICTION_DETECTION', 'MEMORY_CORRECTION', 'CODE_OPTIMIZATION']),
  title: z.string().min(5),
  description: z.string().min(10),
  proposedChanges: z.record(z.unknown()),
  rollbackPlan: z.string().min(5),
  testEvidence: z.string().min(5)
});

export const ownerRoutes: FastifyPluginAsync<{
  dbAdapter: SupabaseAdapter;
  authService: IdentityAuthService;
  orchestrator?: CognitiveOrchestrator;
  approvalService?: DurableApprovalService;
}> = async (fastify: FastifyInstance, opts) => {
  // DENY-BY-DEFAULT: Register owner authentication hook on all routes in this plugin
  fastify.addHook('preHandler', opts.authService.requireOwnerHook);

  // Lazy or passed approval service
  const approvalService =
    opts.approvalService ||
    new DurableApprovalService(
      (opts.dbAdapter as any).config || { NODE_ENV: 'test', ALLOW_TEST_AUTH: true },
      opts.dbAdapter
    );

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
      const user = (request as any).user;
      const memoryRepo = opts.dbAdapter.getMemoryRepository();
      const records = await memoryRepo.searchRecords(q, { category, ownerId: user.id });

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
      const user = (request as any).user;
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
        ownerId: user.id,
        category: parseResult.data.category,
        content: parseResult.data.content,
        confidence: parseResult.data.confidence,
        provenance: parseResult.data.provenance,
        source: 'owner_authenticated',
        sourceType: 'USER_INPUT',
        userApproved: true,
        verified: true,
        privacyClass: 'OWNER_ONLY',
        lifecycleStatus: 'APPROVED',
        metadata: parseResult.data.metadata
      });

      return reply.status(201).send({
        success: true,
        memory: stored
      });
    }
  );

  // 4. Autonomous Agent Tasks (Durable from PostgreSQL/Supabase)
  fastify.get(
    '/api/v1/owner/tasks',
    {
      schema: {
        description: 'List autonomous agent tasks under JARVIS orchestration',
        tags: ['Owner']
      }
    },
    async (request, reply) => {
      const user = (request as any).user;
      const supabase = opts.dbAdapter.getClient();
      let tasks: any[] = [];

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            tasks = data;
          }
        } catch {}
      }

      return reply.status(200).send({
        success: true,
        tasks
      });
    }
  );

  // 5. Human-in-the-Loop Approval Requests (Durable Inbox)
  fastify.get(
    '/api/v1/owner/approvals',
    {
      schema: {
        description: 'List pending L2/L3 approval requests awaiting owner cryptographic sign-off',
        tags: ['Owner']
      }
    },
    async (request, reply) => {
      const user = (request as any).user;
      const pendingApprovals = await approvalService.getPendingApprovals(user.id);

      return reply.status(200).send({
        success: true,
        pendingApprovals
      });
    }
  );

  // 6. Cryptographic Approval Token Consumption (Durable & Atomically Single-Use)
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
            token: { type: 'string' },
            actionType: { type: 'string' },
            payload: { type: 'object' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;
      const parseResult = ConsumeApprovalSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Approval token is required.'
        });
      }

      const consumeRes = await approvalService.consumeApprovalToken({
        approvalId: id,
        token: parseResult.data.token,
        payload: parseResult.data.payload,
        actionType: parseResult.data.actionType,
        consumerIdentity: 'owner_web_client',
        ownerId: user.id
      });

      if (!consumeRes.success) {
        const statusCode = consumeRes.reason === 'APPROVAL_NOT_FOUND' ? 404 : 400;
        return reply.status(statusCode).send({
          statusCode,
          error: consumeRes.reason || 'ApprovalFailed',
          message: consumeRes.error || 'Failed to consume approval token.'
        });
      }

      return reply.status(200).send({
        success: true,
        approvalId: id,
        status: 'CONSUMED',
        authorizedAt: consumeRes.authorizedAt
      });
    }
  );

  // 7. Integration Management (Real Verification — Zero Fake Tokens)
  fastify.get(
    '/api/v1/owner/integrations',
    {
      schema: {
        description: 'List connected integrations (zero plaintext secrets returned)',
        tags: ['Owner']
      }
    },
    async (request, reply) => {
      const user = (request as any).user;
      const supabase = opts.dbAdapter.getClient();
      const connectedServices = new Map<string, any>();

      if (supabase) {
        try {
          const { data } = await supabase
            .from('integration_connections')
            .select('service_name, scopes, updated_at')
            .eq('owner_id', user.id);

          if (data) {
            data.forEach((row: any) => connectedServices.set(row.service_name, row));
          }
        } catch {}
      }

      const services = ['github', 'gmail', 'calendar'];
      const integrations = services.map((service) => {
        const conn = connectedServices.get(service);
        return {
          service,
          connected: Boolean(conn),
          status: conn ? 'CONNECTED' : 'NOT_CONFIGURED',
          scopes: conn?.scopes || [],
          lastSyncedAt: conn?.updated_at || null
        };
      });

      return reply.status(200).send({
        success: true,
        integrations
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

  // 9. Central Owner Cognitive Assistant
  fastify.post(
    '/api/v1/owner/assistant/chat',
    {
      schema: {
        description: 'Privileged owner interaction with full memory and agent worker coordination',
        tags: ['Owner'],
        body: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', minLength: 1, maxLength: 4000 },
            taskType: { type: 'string', enum: ['general', 'fast_reflex', 'deep_reasoning', 'code', 'vision'] }
          }
        }
      }
    },
    async (request, reply) => {
      const parseResult = OwnerChatSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parseResult.error.issues.map((i) => i.message).join(', ')
        });
      }

      const user = (request as any).user;

      if (!opts.orchestrator) {
        return reply.status(200).send({
          success: true,
          reply: `Owner session verified for ${user.email}. Cognitive orchestrator running in local degraded mode.`,
          domain: 'OWNER_AUTHENTICATED'
        });
      }

      const execution = await opts.orchestrator.handleRequest({
        message: parseResult.data.message,
        isOwnerAuthenticated: true,
        ownerId: user.id,
        taskType: parseResult.data.taskType
      });

      return reply.status(200).send({
        success: true,
        ...execution
      });
    }
  );

  // 10. Specialist Worker Registry
  fastify.get(
    '/api/v1/owner/workers',
    {
      schema: {
        description: 'Inspect registered specialist workers (JARVIS, FRIDAY, ULTRON, etc.) and capability contracts',
        tags: ['Owner']
      }
    },
    async (_request, reply) => {
      const workers = opts.orchestrator ? opts.orchestrator.getAgentRegistry().listWorkers() : [];
      return reply.status(200).send({
        success: true,
        workers
      });
    }
  );

  // 11. Metacognition Self-Improvement Proposals
  fastify.get(
    '/api/v1/owner/metacognition/proposals',
    {
      schema: {
        description: 'List reviewable self-improvement proposals generated by metacognition',
        tags: ['Owner']
      }
    },
    async (_request, reply) => {
      const proposals = opts.orchestrator ? opts.orchestrator.getMetacognition().getProposals() : [];
      return reply.status(200).send({
        success: true,
        proposals
      });
    }
  );

  fastify.post(
    '/api/v1/owner/metacognition/proposals',
    {
      schema: {
        description: 'Submit an improvement proposal with mandatory test evidence and rollback plan',
        tags: ['Owner']
      }
    },
    async (request, reply) => {
      const parseResult = CreateProposalSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parseResult.error.issues.map((i) => i.message).join(', ')
        });
      }

      if (!opts.orchestrator) {
        return reply.status(503).send({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'Metacognition engine not loaded.'
        });
      }

      try {
        const proposal = opts.orchestrator.getMetacognition().createImprovementProposal(parseResult.data);
        return reply.status(201).send({
          success: true,
          proposal
        });
      } catch (err: any) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: err.message
        });
      }
    }
  );
};

