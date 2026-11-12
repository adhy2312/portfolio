// In-memory sliding window rate limiter (Per-IP / Per-Client)
const rateLimitMap = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 25; // 25 queries per minute

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    rateLimitMap.set(ip, record);
    return false;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);
  return record.count > maxRequests;
};

// Periodic memory purge every 5 minutes
if (typeof setInterval !== 'undefined') {
  const purgeTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 300000);
  if (purgeTimer && typeof purgeTimer.unref === 'function') {
    purgeTimer.unref();
  }
}

// Curated mapping of model aliases and legacy identifiers to live, supported models
// on the modern Hugging Face Inference Providers Router (router.huggingface.co).
const MODEL_MAPPINGS = {
  // Qwen Family (Code & Architecture)
  'qwen-coder': 'Qwen/Qwen2.5-72B-Instruct',
  'qwen-72b': 'Qwen/Qwen2.5-72B-Instruct',
  'Qwen/Qwen2.5-Coder-7B-Instruct': 'Qwen/Qwen2.5-72B-Instruct',
  'Qwen/Qwen2.5-Coder-32B-Instruct': 'Qwen/Qwen2.5-72B-Instruct',

  // Llama Family (Reasoning, Security & Defense)
  'llama-3.1': 'meta-llama/Llama-3.1-8B-Instruct',
  'llama-3.2': 'meta-llama/Llama-3.1-8B-Instruct',
  'meta-llama/Llama-3.2-3B-Instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  'meta-llama/Llama-3.2-1B-Instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  'llama-3.3': 'meta-llama/Llama-3.3-70B-Instruct',
  'mistral-7b': 'meta-llama/Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3': 'meta-llama/Llama-3.1-8B-Instruct',

  // Gemma Family (Fast Neural Dialogue)
  'gemma-3': 'google/gemma-3-4b-it',
  'google/gemma-2-2b-it': 'google/gemma-3-4b-it',

  // DeepSeek & Specialized
  'deepseek-v3': 'deepseek-ai/DeepSeek-V3',
  'deepseek-r1': 'deepseek-ai/DeepSeek-R1',
  'phi-4': 'microsoft/phi-4',

  // Embeddings (Native Task Pipeline)
  'minilm-embed': 'sentence-transformers/all-MiniLM-L6-v2'
};

const resolveModelId = (inputModel) => {
  if (!inputModel) return 'Qwen/Qwen2.5-72B-Instruct';
  return MODEL_MAPPINGS[inputModel] || inputModel;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'HuggingFace inference rate limit reached. Please wait a moment before sending another query.'
    });
  }

  const API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  const payloadStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (payloadStr.length > 32768) {
    return res.status(413).json({ error: 'Payload exceeds security limits.' });
  }

  // Prototype Pollution Key Injection Guard (safely ignores conversational prose)
  if (/(["'])(?:__proto__|constructor)\1\s*:\s*\{/i.test(payloadStr)) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  let bodyData;
  try {
    bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  const { model = 'qwen-coder', prompt, systemPrompt, agentId = 'JARVIS', maxTokens = 512, temperature = 0.6 } = bodyData || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt must be a non-empty string' });
  }

  const resolvedModelId = resolveModelId(model);

  // If no HuggingFace token is set in environment, return a clean deterministic fallback response
  if (!API_KEY) {
    return res.status(200).json({
      success: true,
      model: resolvedModelId,
      agentId,
      fallbackMode: true,
      text: `[HuggingFace Router Bridge: Simulated Response - Model: ${resolvedModelId}]\nAgent ${agentId} processed query: "${prompt.slice(0, 80)}..."\nConfigure HUGGINGFACE_API_KEY or HF_TOKEN in Vercel to activate live remote inference.`,
      metrics: {
        latencyMs: 12,
        tokensGenerated: 42,
        costEstimateUSD: 0.000000
      }
    });
  }

  const startTime = Date.now();
  const FALLBACK_KEY = process.env.HUGGINGFACE_FALLBACK_KEY;
  let activeKey = API_KEY;
  let hfResponse = null;
  let generatedText = '';

  const isEmbeddingTask = resolvedModelId.includes('sentence-transformers') || resolvedModelId.includes('embed');

  try {
    // 1. Primary Route: Modern OpenAI-compatible Chat Completions on router.huggingface.co
    if (!isEmbeddingTask) {
      const chatEndpoint = 'https://router.huggingface.co/v1/chat/completions';
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const chatPayload = {
        model: resolvedModelId,
        messages,
        max_tokens: Math.min(maxTokens, 1500),
        temperature: Math.max(0.1, Math.min(temperature, 1.2))
      };

      try {
        hfResponse = await fetch(chatEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(chatPayload)
        });

        // Key fallback on auth/permission rejection if fallback key configured
        if ((hfResponse.status === 401 || hfResponse.status === 403) && FALLBACK_KEY && FALLBACK_KEY !== activeKey) {
          activeKey = FALLBACK_KEY;
          hfResponse = await fetch(chatEndpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatPayload)
          });
        }

        if (hfResponse.ok) {
          const chatData = await hfResponse.json();
          generatedText = chatData.choices?.[0]?.message?.content || '';
        }
      } catch (chatErr) {
        // Continue to secondary pipeline attempt
      }
    }

    // 2. Secondary Fallback: Pipeline endpoint on router.huggingface.co
    if (!generatedText && (!hfResponse || !hfResponse.ok)) {
      try {
        const formattedInput = systemPrompt
          ? `<s>[SYSTEM]\n${systemPrompt}\n[/SYSTEM]\n[USER]\n${prompt}\n[/USER]\n[ASSISTANT]\n`
          : prompt;

        const pipelineEndpoint = `https://router.huggingface.co/hf-inference/models/${resolvedModelId}`;
        const pipelineRes = await fetch(pipelineEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: formattedInput,
            parameters: {
              max_new_tokens: Math.min(maxTokens, 1500),
              temperature: Math.max(0.1, Math.min(temperature, 1.2)),
              return_full_text: false
            }
          })
        });

        if (pipelineRes.ok) {
          hfResponse = pipelineRes;
          const data = await pipelineRes.json();
          if (Array.isArray(data) && data[0]?.generated_text) {
            generatedText = data[0].generated_text;
          } else if (typeof data === 'string') {
            generatedText = data;
          } else if (data?.generated_text) {
            generatedText = data.generated_text;
          } else {
            generatedText = JSON.stringify(data);
          }
        } else if (!hfResponse) {
          hfResponse = pipelineRes;
        }
      } catch (pipelineErr) {
        // Fallback below
      }
    }

    const latencyMs = Date.now() - startTime;

    // 3. Fallback response if remote inference failed or returned non-ok
    if (!generatedText) {
      const status = hfResponse ? hfResponse.status : 503;
      let errText = '';
      try {
        errText = hfResponse ? await hfResponse.text() : 'Inference router unreachable';
      } catch {
        errText = 'Inference router unreachable';
      }

      const isPermissionErr = status === 403 || errText.includes('permissions') || errText.includes('Inference Providers');
      const guidance = isPermissionErr
        ? "Your Hugging Face token lacks 'Make calls to Inference Providers' scope. In huggingface.co -> Settings -> Access Tokens, create a fine-grained token with Inference enabled, or use Gemini Flash / Groq in the engine selector."
        : `Hugging Face inference returned (${status}): ${errText.slice(0, 100)}`;

      return res.status(200).json({
        success: false,
        fallbackMode: true,
        model: resolvedModelId,
        agentId,
        text: `[Hugging Face Provider Notice]\n${guidance}\n\nFalling back to local heuristic response for: "${prompt.slice(0, 80)}..."`,
        metrics: {
          latencyMs,
          tokensGenerated: 0,
          costEstimateUSD: 0.000000
        }
      });
    }

    return res.status(200).json({
      success: true,
      fallbackMode: false,
      model: resolvedModelId,
      agentId,
      text: generatedText.trim(),
      metrics: {
        latencyMs,
        tokensGenerated: Math.round(generatedText.length / 4),
        costEstimateUSD: 0.000000
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'HuggingFace inference failure',
      details: error.message
    });
  }
}
