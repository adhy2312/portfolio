import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Prompt injection patterns that could hijack LLM instructions.
 * Covers role-switching, instruction override, and jailbreak vectors.
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /disregard\s+(all\s+)?(previous|prior|your)\s+/i,
  /forget\s+(everything|all)\s+(you\s+)?(know|were|have)/i,
  /act\s+as\s+(if\s+you\s+are|a|an)\s+/i,
  /new\s+persona[:\s]/i,
  /system\s*prompt[:\s]/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<\|system\|>/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode\s+enabled/i,
];

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
 * Checks a string for prompt injection attack patterns.
 * Returns the matching pattern description if found, null otherwise.
 */
export function detectPromptInjection(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return `Potential prompt injection detected: matched pattern ${pattern.source}`;
    }
  }
  return null;
}

/**
 * Recursively extracts all string values from an object for injection scanning.
 */
function extractStrings(val: unknown, depth = 0): string[] {
  if (depth > 5) return [];
  if (typeof val === 'string') return [val];
  if (Array.isArray(val)) return val.flatMap((v) => extractStrings(v, depth + 1));
  if (val && typeof val === 'object') {
    return Object.values(val as object).flatMap((v) => extractStrings(v, depth + 1));
  }
  return [];
}

/**
 * Fastify preValidation hook to fail-fast on:
 * 1. Prototype pollution payloads
 * 2. Prompt injection attempts in message fields
 */
export async function sanitizationHook(request: FastifyRequest, reply: FastifyReply) {
  if (request.body && checkPrototypePollution(request.body)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid payload structure: Forbidden object properties detected.'
    });
  }

  // Scan all string fields in the body for prompt injection
  if (request.body) {
    const strings = extractStrings(request.body);
    for (const str of strings) {
      const injectionResult = detectPromptInjection(str);
      if (injectionResult) {
        request.log.warn({ url: request.url, reason: injectionResult }, 'Prompt injection attempt blocked');
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Payload contains disallowed content patterns.'
        });
      }
    }
  }
}
