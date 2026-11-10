import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Checks for prototype pollution attack payloads (__proto__, constructor, prototype)
 */
export function checkPrototypePollution(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;

  // Direct prototype inspection
  if (Object.prototype.hasOwnProperty.call(payload, '__proto__') ||
      Object.prototype.hasOwnProperty.call(payload, 'constructor') ||
      Object.prototype.hasOwnProperty.call(payload, 'prototype')) {
    return true;
  }

  // Check object prototype tampering
  const proto = Object.getPrototypeOf(payload);
  if (proto !== Object.prototype && proto !== null && !Array.isArray(payload)) {
    // If someone polluted or altered the prototype
    if ((proto as any).polluted !== undefined) {
      return true;
    }
  }

  // Recursive inspection for nested objects
  for (const [key, val] of Object.entries(payload)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (val && typeof val === 'object') {
      if (checkPrototypePollution(val)) return true;
    }
  }

  return false;
}

/**
 * Fastify preValidation hook to fail-fast on malformed or malicious structures
 */
export async function sanitizationHook(request: FastifyRequest, reply: FastifyReply) {
  if (request.body && checkPrototypePollution(request.body)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid payload structure: Forbidden object properties detected.'
    });
  }
}
