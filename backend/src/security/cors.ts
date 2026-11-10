import { FastifyCorsOptions } from '@fastify/cors';

export function getCorsOptions(allowedOrigins: string[] = []): FastifyCorsOptions {
  const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [];
  return {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        cb(null, true);
        return;
      }

      const isAllowed = origins.some((allowed) => {
        if (allowed === '*') return true;
        if (allowed === origin) return true;
        // Support subdomain matching if needed
        try {
          const originUrl = new URL(origin);
          const allowedUrl = new URL(allowed);
          return originUrl.hostname === allowedUrl.hostname && originUrl.port === allowedUrl.port;
        } catch {
          return false;
        }
      });

      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error(`CORS Error: Origin '${origin}' is not in the allowed origins list.`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-ID', 'X-Request-ID']
  };
}

