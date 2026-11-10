import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SupabaseAdapter } from '../../auth/supabase.js';

const PublicChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message exceeds 2000 characters limit'),
  sessionId: z.string().min(5).max(100).optional(),
  language: z.string().max(10).optional()
});

export const publicRoutes: FastifyPluginAsync<{ dbAdapter: SupabaseAdapter }> = async (
  fastify: FastifyInstance,
  _opts
) => {
  // Public capabilities overview
  fastify.get(
    '/api/v1/public/capabilities',
    {
      schema: {
        description: 'Returns available public AI capabilities and identity overview',
        tags: ['Public'],
        response: {
          200: {
            type: 'object',
            properties: {
              identity: { type: 'string' },
              domain: { type: 'string' },
              availableAgents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              },
              features: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      return reply.status(200).send({
        identity: 'Mini-Adhy Public Companion',
        domain: 'Domain A (Public Visitor Sandbox)',
        availableAgents: [
          { id: 'JARVIS', role: 'Portfolio Ambassador & Skills Navigator' },
          { id: 'FRIDAY', role: 'Public Security & Integrity Sentinel' },
          { id: 'ULTRON', role: 'Technical Architecture & Project Inspector' },
          { id: 'EDITH', role: 'System Telemetry & Reliability Explorer' }
        ],
        features: [
          'Portfolio Navigation',
          'Technical Skills Explanations',
          'Project Insights & Architecture Q&A',
          'Public Contact & Inquiry Routing'
        ]
      });
    }
  );

  // Sandboxed public visitor conversation
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
        description: 'Send conversational inquiry to Mini-Adhy as a public visitor',
        tags: ['Public'],
        body: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', minLength: 1, maxLength: 2000 },
            sessionId: { type: 'string' },
            language: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              reply: { type: 'string' },
              sessionId: { type: 'string' },
              domain: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
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

      // Foundation response: Sandboxed public response acknowledging message
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
