import { FastifyServerOptions } from 'fastify';
import crypto from 'crypto';

// Redacted key paths for privacy & security
export const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'passcode',
  'token',
  'apikey',
  'api_key',
  'gemini_api_key',
  'groq_api_key',
  'supabase_service_role_key',
  'secret',
  'service_role'
];

export function getFastifyLoggerConfig(logLevel: string = 'info'): FastifyServerOptions['logger'] {
  return {
    level: logLevel,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          path: request.routerPath,
          parameters: request.params,
          // Redact headers
          headers: redactSensitiveObject(request.headers)
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode
        };
      }
    },
    redact: {
      paths: SENSITIVE_KEYS.map((k) => `req.headers.${k}`).concat(
        SENSITIVE_KEYS.map((k) => `body.${k}`)
      ),
      censor: '[REDACTED]'
    }
  };
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

export function redactSensitiveObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveObject) as unknown as T;

  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((s) => keyLower.includes(s.toLowerCase()));
    if (isSensitive) {
      clone[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clone[key] = redactSensitiveObject(value);
    } else {
      clone[key] = value;
    }
  }
  return clone as T;
}
