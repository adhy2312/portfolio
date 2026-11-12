/**
 * HuggingFace Open-Weight Neural Inference Bridge
 * Connects the Adhithya Portfolio Multi-Agent Squad to high-performance open-weight models
 * via Hugging Face Inference Providers (router.huggingface.co):
 * - Qwen/Qwen2.5-72B-Instruct (Code & Structural Architecture)
 * - meta-llama/Llama-3.1-8B-Instruct (Reasoning & DEFCON Analysis)
 * - google/gemma-3-4b-it (Ultra-Fast Neural Dialogue)
 * - sentence-transformers/all-MiniLM-L6-v2 (Zero-cost Local Vector Embeddings)
 */

export const HF_SUPPORTED_MODELS = [
  {
    id: 'qwen-coder',
    fullName: 'Qwen/Qwen2.5-72B-Instruct',
    label: 'Qwen 2.5 72B (Code Specialist)',
    bestFor: 'Code audits, AST inspection, performance tuning, architecture',
    cost: '$0.00 / Serverless Tier',
    contextLength: '32k'
  },
  {
    id: 'llama-3.1',
    fullName: 'meta-llama/Llama-3.1-8B-Instruct',
    label: 'Llama 3.1 8B Instruct (Reasoning & Defense)',
    bestFor: 'DEFCON intrusion defense, security scans, agent deliberation',
    cost: '$0.00 / Serverless Tier',
    contextLength: '128k'
  },
  {
    id: 'gemma-3',
    fullName: 'google/gemma-3-4b-it',
    label: 'Gemma 3 4B Instruct (Ultra-Fast Response)',
    bestFor: 'Real-time conversational streaming, mobile clients, fast triage',
    cost: '$0.00 / Serverless Tier',
    contextLength: '128k'
  },
  {
    id: 'mistral-7b',
    fullName: 'meta-llama/Llama-3.1-8B-Instruct',
    label: 'Mistral 7B (Alias -> Llama 3.1 8B)',
    bestFor: 'Reasoning and system evaluation',
    cost: '$0.00 / Serverless Tier',
    contextLength: '128k'
  },
  {
    id: 'llama-3.2',
    fullName: 'meta-llama/Llama-3.1-8B-Instruct',
    label: 'Llama 3.2 (Alias -> Llama 3.1 8B)',
    bestFor: 'Low-latency dialog',
    cost: '$0.00 / Serverless Tier',
    contextLength: '128k'
  }
];

export async function queryHuggingFace(agentId, prompt, options = {}) {
  const model = options.model || (agentId === 'JARVIS' ? 'qwen-coder' : agentId === 'FRIDAY' || agentId === 'ULTRON' ? 'llama-3.1' : 'gemma-3');
  const systemPrompt = options.systemPrompt || `You are ${agentId}, a high-clearance autonomous cyber-agent embedded within Adhithya Mohan's portfolio ecosystem. Respond with high precision, technical rigor, and concise intelligence.`;

  try {
    const res = await fetch('/api/huggingface', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId,
        model,
        prompt,
        systemPrompt,
        maxTokens: options.maxTokens || 600,
        temperature: options.temperature || 0.6
      })
    });

    if (res && res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const isFallback = Boolean(data.fallbackMode || !data.success);
        return {
          success: !isFallback && Boolean(data.success),
          fallbackMode: isFallback,
          isFallback,
          text: data.text,
          model: data.model,
          agentId: data.agentId,
          engine: 'HUGGINGFACE_OPEN_WEIGHTS',
          metrics: data.metrics || { latencyMs: 180, tokensGenerated: 80, costEstimateUSD: 0 }
        };
      }
    }

    const err = (res && (res.headers.get('content-type') || '').includes('application/json'))
      ? await res.json().catch(() => ({ error: 'Inference request failed' }))
      : { error: 'Inference serverless endpoint unavailable' };
    return {
      success: false,
      fallbackMode: true,
      isFallback: true,
      error: err.error || 'HuggingFace inference failed',
      fallbackText: `[Agent ${agentId} - Offline Cognitive Standby]: Unable to route through remote open-weight model (${model}). Local heuristics engaged.`
    };
  } catch (error) {
    return {
      success: false,
      fallbackMode: true,
      isFallback: true,
      error: error.message,
      fallbackText: `[Agent ${agentId} - Network Isolation]: HuggingFace bridge could not connect to endpoint. Heuristic baseline active.`
    };
  }
}
