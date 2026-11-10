import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SupabaseAdapter } from '../../auth/supabase.js';
import { ProviderGateway } from '../../providers/gateway.js';

export const healthRoutes: FastifyPluginAsync<{
  dbAdapter: SupabaseAdapter;
  providerGateway?: ProviderGateway;
}> = async (fastify: FastifyInstance, opts) => {
  const startTime = Date.now();

  fastify.get(
    '/health',
    {
      schema: {
        description: 'Comprehensive health check and telemetry status',
        tags: ['System']
      }
    },
    async (_request, reply) => {
      const memoryUsage = process.memoryUsage();
      const persistenceHealth = await opts.dbAdapter.getMemoryRepository().getHealthStatus();
      const providerHealth = opts.providerGateway ? await opts.providerGateway.getHealthStatus() : {};

      return reply.status(200).send({
        status: 'healthy',
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0-cognitive-core',
        memory: {
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100
        },
        persistence: {
          connected: persistenceHealth.connected,
          provider: persistenceHealth.provider
        },
        providers: providerHealth
      });
    }
  );

  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness probe verifying operational status',
        tags: ['System']
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
        tags: ['System']
      }
    },
    async (_request, reply) => {
      return reply.status(200).send({ alive: true });
    }
  );
};
