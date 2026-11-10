import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SupabaseAdapter } from '../../auth/supabase.js';
import { CognitiveOrchestrator } from '../../cognitive-core/orchestrator.js';
import { ProviderGateway } from '../../providers/gateway.js';
import { VisitorSessionService } from '../../conversations/visitorSessionService.js';
import { AppConfig } from '../../config/env.js';

const CreateConversationSchema = z.object({
  title: z.string().max(100).optional()
});

const SendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000)
});

const PublicChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(2000),
  sessionId: z.string().optional()
});

export const publicRoutes: FastifyPluginAsync<{
  dbAdapter: SupabaseAdapter;
  orchestrator?: CognitiveOrchestrator;
  providerGateway?: ProviderGateway;
  visitorSessionService?: VisitorSessionService;
  config?: AppConfig;
}> = async (fastify: FastifyInstance, opts) => {
  const visitorService =
    opts.visitorSessionService ||
    new VisitorSessionService(opts.config || ({} as any), opts.dbAdapter);
  // 1. Read approved public portfolio knowledge (Domain A)
  fastify.get(
    '/api/v1/public/knowledge',
    {
      schema: {
        description: 'Read approved public portfolio knowledge items (Domain A)',
        tags: ['Public'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              knowledge: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    topic: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      const defaultKnowledge = [
        {
          id: 'k1',
          topic: 'Identity',
          title: 'Adhithya Mohan',
          content: 'Full-stack software architect, hardware engineer, and creator of Mini-Adhy AI Ecosystem.'
        },
        {
          id: 'k2',
          topic: 'Architecture',
          title: 'Mini-Adhy Architecture',
          content: 'Dual-domain personal intelligence system featuring single shared cognitive core and specialist agents (JARVIS, FRIDAY, ULTRON).'
        },
        {
          id: 'k3',
          topic: 'Portfolio',
          title: 'Projects & Experience',
          content: 'Interactive 3D Quantum Arc-Reactor visualizer, React Three Fiber, Sanity CMS Studio, Fastify backend, and Supabase PostgreSQL persistence.'
        }
      ];

      return reply.status(200).send({
        success: true,
        knowledge: defaultKnowledge
      });
    }
  );

  // 2. Start a public assistant conversation session with cryptographically secure visitor session token
  fastify.post(
    '/api/v1/public/conversations',
    {
      schema: {
        description: 'Start public assistant conversation session with cryptographically bound visitor session scoping',
        tags: ['Public'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const parseResult = CreateConversationSchema.safeParse(request.body || {});
      const title = parseResult.success && parseResult.data.title ? parseResult.data.title : 'Public Portfolio Inquiry';

      const sessionHeader = request.headers['x-visitor-session-id'] as string;
      let visitorSessionId = sessionHeader;

      // Cryptographic session verification: Do not trust arbitrary unverified tokens
      if (!sessionHeader || !visitorService.verifySessionToken(sessionHeader)) {
        visitorSessionId = visitorService.generateSessionToken();
      }

      const conv = await visitorService.createConversation(visitorSessionId, title);

      return reply.status(201).send({
        success: true,
        conversationId: conv.id,
        visitorSessionId,
        visitorSessionToken: visitorSessionId,
        title: conv.title
      });
    }
  );

  // 3. Read visitor conversation history (strictly scoped to verified visitor session token)
  fastify.get(
    '/api/v1/public/conversations/:id',
    {
      schema: {
        description: 'Read visitor conversation history (strictly authenticated against caller session token)',
        tags: ['Public'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const sessionHeader = request.headers['x-visitor-session-id'] as string;

      // Unverified or missing session token is rejected
      if (!sessionHeader || !visitorService.verifySessionToken(sessionHeader)) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid, missing, or revoked visitor session token.'
        });
      }

      const access = await visitorService.getConversation(id, sessionHeader);
      if (access.status === 'NOT_FOUND') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Conversation not found.'
        });
      }

      if (access.status === 'FORBIDDEN') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Access denied: You do not own this public conversation session.'
        });
      }

      return reply.status(200).send({
        success: true,
        conversation: access.conversation
      });
    }
  );

  // 4. Send message to public assistant conversation (Durable storage)
  fastify.post(
    '/api/v1/public/conversations/:id/messages',
    {
      schema: {
        description: 'Send message to public assistant conversation',
        tags: ['Public'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', minLength: 1, maxLength: 2000 }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const sessionHeader = request.headers['x-visitor-session-id'] as string;

      if (!sessionHeader || !visitorService.verifySessionToken(sessionHeader)) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid, missing, or revoked visitor session token.'
        });
      }

      const access = await visitorService.getConversation(id, sessionHeader);
      if (access.status === 'NOT_FOUND') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Conversation not found.'
        });
      }

      if (access.status === 'FORBIDDEN') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Access denied: You do not own this public conversation session.'
        });
      }

      const parseResult = SendMessageSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parseResult.error.issues.map((i) => i.message).join(', ')
        });
      }

      // Append user message
      await visitorService.appendMessage(id, sessionHeader, 'user', parseResult.data.content);

      let assistantReply = `I received your inquiry: "${parseResult.data.content}". Adhithya specializes in full-stack architecture, cognitive agent systems, and reactive UI design.`;
      let providerName = 'public-knowledge-baseline';
      let modelName = 'mini-adhy-v1';

      if (opts.orchestrator) {
        try {
          const res = await opts.orchestrator.handleRequest({
            message: parseResult.data.content,
            isOwnerAuthenticated: false,
            visitorSessionId: sessionHeader,
            conversationId: id,
            history: (access.conversation?.messages || []).map((m) => ({ role: m.role as any, content: m.content }))
          });
          assistantReply = res.reply;
          providerName = res.provider;
          modelName = res.model;
        } catch {
          // Graceful fallback preserves truthfulness without crash
        }
      }

      // Append assistant message
      await visitorService.appendMessage(id, sessionHeader, 'assistant', assistantReply, {
        provider: providerName,
        model: modelName
      });

      return reply.status(200).send({
        success: true,
        reply: assistantReply,
        conversationId: id,
        provider: providerName,
        model: modelName
      });
    }
  );

  // 4b. Explicit Visitor Session Revocation
  fastify.post(
    '/api/v1/public/sessions/revoke',
    {
      schema: {
        description: 'Revoke an active visitor session token',
        tags: ['Public']
      }
    },
    async (request, reply) => {
      const sessionHeader = request.headers['x-visitor-session-id'] as string;
      if (!sessionHeader) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing x-visitor-session-id header.'
        });
      }

      visitorService.revokeSessionToken(sessionHeader);
      return reply.status(200).send({
        success: true,
        message: 'Visitor session revoked successfully.'
      });
    }
  );

  // 5. Backwards-compatible single turn chat
  fastify.post(
    '/api/v1/public/chat',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      schema: {
        description: 'Single turn inquiry to public assistant',
        tags: ['Public'],
        body: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', minLength: 1, maxLength: 2000 },
            sessionId: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const parseResult = PublicChatSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parseResult.error.issues.map((i) => i.message).join(', ')
        });
      }

      const { message, sessionId } = parseResult.data;
      const activeSessionId = sessionId || `pub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      let replyContent = `Hello! I am Mini-Adhy, Adhithya's AI companion. You asked: "${message}". I am operating securely in public visitor mode with access to Adhithya's projects, experience, and technical portfolio.`;
      let providerName = 'public-knowledge-baseline';
      let modelName = 'mini-adhy-v1';

      if (opts.orchestrator) {
        try {
          const res = await opts.orchestrator.handleRequest({
            message,
            isOwnerAuthenticated: false,
            visitorSessionId: activeSessionId
          });
          replyContent = res.reply;
          providerName = res.provider;
          modelName = res.model;
        } catch {
          // Graceful fallback
        }
      }

      return reply.status(200).send({
        success: true,
        reply: replyContent,
        sessionId: activeSessionId,
        provider: providerName,
        model: modelName,
        domain: 'PUBLIC_VISITOR_SANDBOX',
        timestamp: new Date().toISOString()
      });
    }
  );

  // 6. Server-Sent Events (SSE) Streaming endpoint
  fastify.get(
    '/api/v1/public/chat/stream',
    {
      schema: {
        description: 'SSE Streaming chat response for real-time frontend rendering',
        tags: ['Public'],
        querystring: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', minLength: 1, maxLength: 1000 }
          }
        }
      }
    },
    async (request, reply) => {
      const { message } = request.query as { message: string };

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no');

      if (!opts.providerGateway) {
        reply.raw.write(`data: ${JSON.stringify({ text: `Echo: ${message}`, done: true })}\n\n`);
        return reply.raw.end();
      }

      try {
        await opts.providerGateway.stream(
          {
            messages: [{ role: 'user', content: message }],
            privacyClass: 'PUBLIC'
          },
          (chunk) => {
            reply.raw.write(`data: ${JSON.stringify({ delta: chunk.delta, done: chunk.done })}\n\n`);
          }
        );
      } catch (err: any) {
        reply.raw.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
      } finally {
        reply.raw.end();
      }
    }
  );
};
