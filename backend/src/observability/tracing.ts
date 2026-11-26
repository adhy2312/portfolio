import crypto from 'crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, any>;
}

export interface SpanStatus {
  code: 'OK' | 'ERROR' | 'UNSET';
  message?: string;
}

export class Span {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;
  endTime?: number;
  durationMs?: number;
  status: SpanStatus = { code: 'UNSET' };
  attributes: Record<string, any> = {};
  events: SpanEvent[] = [];

  constructor(name: string, traceId: string, parentSpanId?: string) {
    this.name = name;
    this.traceId = traceId;
    this.spanId = crypto.randomBytes(8).toString('hex');
    this.parentSpanId = parentSpanId;
    this.startTime = Date.now();
  }

  setAttribute(key: string, value: any): this {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attrs: Record<string, any>): this {
    Object.assign(this.attributes, attrs);
    return this;
  }

  addEvent(name: string, attributes?: Record<string, any>): this {
    this.events.push({
      name,
      timestamp: Date.now(),
      attributes
    });
    return this;
  }

  setStatus(code: 'OK' | 'ERROR' | 'UNSET', message?: string): this {
    this.status = { code, message };
    return this;
  }

  recordException(err: any): this {
    this.status = { code: 'ERROR', message: err?.message || String(err) };
    this.addEvent('exception', {
      'exception.type': err?.name || 'Error',
      'exception.message': err?.message,
      'exception.stacktrace': err?.stack
    });
    return this;
  }

  end(): void {
    if (this.endTime) return;
    this.endTime = Date.now();
    this.durationMs = this.endTime - this.startTime;
    if (this.status.code === 'UNSET') {
      this.status.code = 'OK';
    }
    telemetryBuffer.recordSpan(this);
  }

  toW3CHeader(): string {
    return `00-${this.traceId}-${this.spanId}-01`;
  }

  toOTLP(): Record<string, any> {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      kind: 1, // SPAN_KIND_INTERNAL
      startTimeUnixNano: this.startTime * 1_000_000,
      endTimeUnixNano: (this.endTime || Date.now()) * 1_000_000,
      attributes: Object.entries(this.attributes).map(([key, value]) => ({
        key,
        value: { stringValue: String(value) }
      })),
      status: {
        code: this.status.code === 'ERROR' ? 2 : 1,
        message: this.status.message
      },
      events: this.events.map((e) => ({
        timeUnixNano: e.timestamp * 1_000_000,
        name: e.name,
        attributes: Object.entries(e.attributes || {}).map(([k, v]) => ({
          key: k,
          value: { stringValue: String(v) }
        }))
      }))
    };
  }
}

class TelemetryRingBuffer {
  private readonly maxSize: number = 1000;
  private spans: Span[] = [];

  recordSpan(span: Span): void {
    if (this.spans.length >= this.maxSize) {
      this.spans.shift();
    }
    this.spans.push(span);
  }

  getRecentSpans(limit: number = 50): Span[] {
    return this.spans.slice(-Math.min(limit, this.spans.length));
  }

  clear(): void {
    this.spans = [];
  }
}

export const telemetryBuffer = new TelemetryRingBuffer();

export class OpenTelemetryTracer {
  private serviceName: string;

  constructor(serviceName: string = 'mini-adhy-backend') {
    this.serviceName = serviceName;
  }

  parseTraceParent(header?: string | string[]): SpanContext | null {
    if (!header || typeof header !== 'string') return null;
    const parts = header.trim().split('-');
    if (parts.length === 4 && parts[0] === '00' && parts[1].length === 32 && parts[2].length === 16) {
      return {
        traceId: parts[1],
        spanId: parts[2],
        traceFlags: parts[3]
      };
    }
    return null;
  }

  startSpan(name: string, options?: { parent?: SpanContext | Span; attributes?: Record<string, any> }): Span {
    let traceId: string;
    let parentSpanId: string | undefined;

    if (options?.parent instanceof Span) {
      traceId = options.parent.traceId;
      parentSpanId = options.parent.spanId;
    } else if (options?.parent?.traceId) {
      traceId = options.parent.traceId;
      parentSpanId = options.parent.spanId;
    } else {
      traceId = crypto.randomBytes(16).toString('hex');
    }

    const span = new Span(name, traceId, parentSpanId);
    span.setAttribute('service.name', this.serviceName);
    if (options?.attributes) {
      span.setAttributes(options.attributes);
    }
    return span;
  }
}

export const tracer = new OpenTelemetryTracer('mini-adhy-backend');

export async function fastifyTracingPlugin(app: FastifyInstance): Promise<void> {
  app.decorateRequest('span', null);
  app.decorateRequest('traceId', '');

  app.addHook('onRequest', async (req: FastifyRequest) => {
    const traceParentHeader = req.headers['traceparent'] as string | undefined;
    const parentContext = tracer.parseTraceParent(traceParentHeader);
    const span = tracer.startSpan(`HTTP ${req.method} ${req.routerPath || req.url}`, {
      parent: parentContext || undefined,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.route': req.routerPath || req.url,
        'http.user_agent': req.headers['user-agent'] || '',
        'client.ip': req.ip
      }
    });

    (req as any).span = span;
    (req as any).traceId = span.traceId;
  });

  app.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    const span = (req as any).span as Span | undefined;
    if (span) {
      span.setAttribute('http.status_code', reply.statusCode);
      if (reply.statusCode >= 500) {
        span.setStatus('ERROR', `HTTP status ${reply.statusCode}`);
      } else {
        span.setStatus('OK');
      }
      span.end();
      reply.header('traceparent', span.toW3CHeader());
    }
  });

  app.addHook('onError', async (req: FastifyRequest, _reply: FastifyReply, error: any) => {
    const span = (req as any).span as Span | undefined;
    if (span) {
      span.recordException(error);
    }
  });
}
