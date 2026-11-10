import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AppConfig } from '../config/env.js';
import { getFastifyLoggerConfig, generateRequestId } from '../observability/logger.js';
import { getCorsOptions } from '../security/cors.js';
import { sanitizationHook } from '../security/sanitization.js';
import { SupabaseAdapter } from '../auth/supabase.js';
import { IdentityAuthService } from '../auth/identity.js';
import { ProviderGateway } from '../providers/gateway.js';
import { CognitiveOrchestrator } from '../cognitive-core/orchestrator.js';
import { healthRoutes } from '../api/routes/health.routes.js';
import { publicRoutes } from '../api/routes/public.routes.js';
import { ownerRoutes } from '../api/routes/owner.routes.js';

export async function buildApp(appConfig: AppConfig): Promise<FastifyInstance> {
  const app = fastify({
    logger: getFastifyLoggerConfig(appConfig.LOG_LEVEL),
    genReqId: () => generateRequestId(),
    bodyLimit: 1048576, // 1MB payload limit
    connectionTimeout: 10000,
    requestTimeout: 15000
  });

  // 1. Helmet security headers
  await app.register(helmet, {
    contentSecurityPolicy: false // Handled at CDN / Gateway
  });

  // 2. CORS configuration
  await app.register(cors, getCorsOptions(appConfig.allowedOriginsList));

  // 3. Global Rate Limiter (Default: 100 requests per minute per IP)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`
    })
  });

  // 4. OpenAPI / Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Mini-Adhy Backend API',
        description: 'Dual-Domain Personal Intelligence & Cognitive Monolith API',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://${appConfig.HOST}:${appConfig.PORT}`,
          description: 'Development Server'
        }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // 5. Pre-validation sanitization hook (Prototype pollution protection)
  app.addHook('preValidation', sanitizationHook);

  // 6. Persistence & Core AI Services
  const dbAdapter = new SupabaseAdapter(appConfig);
  const authService = new IdentityAuthService(appConfig, dbAdapter);
  const providerGateway = new ProviderGateway(appConfig);
  const orchestrator = new CognitiveOrchestrator(dbAdapter.getMemoryRepository(), providerGateway);

  // 7. Register Route Modules
  await app.register(healthRoutes, { dbAdapter, providerGateway });
  await app.register(publicRoutes, { dbAdapter, orchestrator, providerGateway });
  await app.register(ownerRoutes, { dbAdapter, authService, orchestrator });

  // 8. Centralized Error Handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, reqId: request.id }, 'Request error occurred');

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name || 'Error',
        message: error.message
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message:
        appConfig.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : error.message
    });
  });

  // 9. 404 Handler
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route '${request.method} ${request.url}' not found.`
    });
  });

  return app;
}
