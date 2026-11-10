import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SupabaseAdapter } from '../../auth/supabase.js';

const PublicChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message exceeds 2000 characters limit'),
  sessionId: z.string().min(5).max(100).optional(),
  language: z.string().max(10).optional()
});

const CreateConversationSchema = z.object({
  title: z.string().trim().max(100).optional()
});

const SendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000)
});

// In-memory store for visitor conversations (for local dev / testing parity)
const visitorConversations = new Map<string, {
  id: string;
  visitorSessionId: string;
  title: string;
  createdAt: string;
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
}>();

export const publicRoutes: FastifyPluginAsync<{ dbAdapter: SupabaseAdapter }> = async (
  fastify: FastifyInstance,
  _opts
) => {
  // 1. Read approved public portfolio knowledge
  fastify.get(
    '/api/v1/public/knowledge',
    {
      schema: {
        description: 'Read approved public portfolio knowledge (Domain A)',
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
          content: 'Dual-domain personal intelligence system featuring single shared cognitive core and 10 specialist agents (JARVIS, FRIDAY, ULTRON).'
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

  // 2. Start a public assistant conversation session
  fastify.post(
    '/api/v1/public/conversations',
    {
      schema: {
        description: 'Start public assistant conversation session with opaque visitor session scoping',
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

      const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const visitorSessionId = (request.headers['x-visitor-session-id'] as string) || 
                               `vses_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const newConv = {
        id: convId,
        visitorSessionId,
        title,
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: `msg_${Date.now()}_init`,
            role: 'assistant',
            content: 'Hello! I am Mini-Adhy. How can I assist you with Adhithya portfolio, skills, or projects today?',
            createdAt: new Date().toISOString()
          }
        ]
      };

      visitorConversations.set(convId, newConv);

      return reply.status(201).send({
        success: true,
        conversationId: convId,
        visitorSessionId,
        domain: 'PUBLIC',
        title
      });
    }
  );

  // 3. Read visitor conversation history (strictly scoped to visitor session token)
  fastify.get(
    '/api/v1/public/conversations/:id',
    {
      schema: {
        description: 'Read visitor conversation history (scanned strictly against caller session ID)',
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

      const conv = visitorConversations.get(id);
      if (!conv) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Conversation not found.'
        });
      }

      // Cross-visitor isolation: Visitor A cannot read Visitor B's conversation
      if (!sessionHeader || sessionHeader !== conv.visitorSessionId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Access denied: You do not own this public conversation session.'
        });
      }

      return reply.status(200).send({
        success: true,
        conversation: conv
      });
    }
  );

  // 4. Send message to public assistant conversation
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

      const conv = visitorConversations.get(id);
      if (!conv) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Conversation not found.'
        });
      }

      if (!sessionHeader || sessionHeader !== conv.visitorSessionId) {
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

      const userMsg = {
        id: `msg_${Date.now()}_u`,
        role: 'user',
        content: parseResult.data.content,
        createdAt: new Date().toISOString()
      };

      const assistantMsg = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: `I received your inquiry: "${parseResult.data.content}". Adhithya specializes in full-stack architecture, cognitive agent systems, and reactive UI design.`,
        createdAt: new Date().toISOString()
      };

      conv.messages.push(userMsg, assistantMsg);

      return reply.status(200).send({
        success: true,
        reply: assistantMsg.content,
        conversationId: conv.id
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

      return reply.status(200).send({
        success: true,
        reply: `Hello! I am Mini-Adhy, Adhithya's AI companion. You asked: "${message}". I am operating securely in public visitor mode with access to Adhithya's projects, experience, and technical portfolio.`,
        sessionId: activeSessionId,
        domain: 'PUBLIC_VISITOR_SANDBOX',
        timestamp: new Date().toISOString()
      });
    }
  );
};
