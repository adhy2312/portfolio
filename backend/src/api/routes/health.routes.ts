import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SupabaseAdapter } from '../../auth/supabase.js';

export const healthRoutes: FastifyPluginAsync<{ dbAdapter: SupabaseAdapter }> = async (
  fastify: FastifyInstance,
  opts
) => {
  const startTime = Date.now();

  fastify.get(
    '/health',
    {
      schema: {
        description: 'Comprehensive health check and telemetry status',
        tags: ['System'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              uptimeSeconds: { type: 'number' },
              timestamp: { type: 'string' },
              environment: { type: 'string' },
              version: { type: 'string' },
              memory: {
                type: 'object',
                properties: {
                  heapUsedMb: { type: 'number' },
                  rssMb: { type: 'number' }
                }
              },
              persistence: {
                type: 'object',
                properties: {
                  connected: { type: 'boolean' },
                  provider: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      const memoryUsage = process.memoryUsage();
      const persistenceHealth = await opts.dbAdapter.getMemoryRepository().getHealthStatus();

      return reply.status(200).send({
        status: 'healthy',
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0-foundation',
        memory: {
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100
        },
        persistence: {
          connected: persistenceHealth.connected,
          provider: persistenceHealth.provider
        }
      });
    }
  );

  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness probe verifying operational status',
        tags: ['System'],
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      return reply.status(200).send({
        ready: true,
        timestamp: new Date().toISOString()
      });
    }
  );

  fastify.get(
    '/live',
    {
      schema: {
        description: 'Liveness probe for process supervision',
        tags: ['System'],
        response: {
          200: {
            type: 'object',
            properties: {
              alive: { type: 'boolean' }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      return reply.status(200).send({ alive: true });
    }
  );
};

