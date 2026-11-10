export type ProviderId = 'gemini' | 'groq' | 'huggingface' | 'openrouter' | 'ollama';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type TaskType = 'general' | 'fast_reflex' | 'deep_reasoning' | 'code' | 'vision';
export type PrivacyClass = 'PUBLIC' | 'OWNER_ONLY' | 'SENSITIVE' | 'STRICT_LOCAL';

export interface GenerateRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  taskType?: TaskType;
  privacyClass?: PrivacyClass;
  visitorSessionId?: string;
  ownerId?: string;
}

export interface GenerateResponse {
  text: string;
  providerId: ProviderId;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
  isFallback: boolean;
  provenance: {
    source: string;
    timestamp: number;
  };
}

export interface StreamChunk {
  delta: string;
  done: boolean;
  providerId: ProviderId;
}

export type ProviderErrorCode =
  | 'RATE_LIMIT'
  | 'QUOTA_EXHAUSTED'
  | 'AUTH_FAILURE'
  | 'OUTAGE'
  | 'TIMEOUT'
  | 'PRIVACY_VIOLATION'
  | 'NOT_CONFIGURED'
  | 'UNKNOWN';

export interface ClassifiedError {
  code: ProviderErrorCode;
  message: string;
  retryable: boolean;
  providerId: ProviderId;
}

export interface IProviderAdapter {
  readonly id: ProviderId;
  readonly name: string;
  readonly isLocal: boolean;
  isAvailable(): boolean;
  generate(req: GenerateRequest): Promise<GenerateResponse>;
  stream(req: GenerateRequest, onChunk: (chunk: StreamChunk) => void): Promise<GenerateResponse>;
  healthCheck(): Promise<{ providerId: ProviderId; status: 'healthy' | 'degraded' | 'unavailable' | 'not_configured'; message?: string }>;
  estimateUsage(req: GenerateRequest): { estimatedTokens: number };
  classifyError(err: unknown): ClassifiedError;
  supportsVision(): boolean;
  supportsAudio(): boolean;
  supportsTools(): boolean;
}

