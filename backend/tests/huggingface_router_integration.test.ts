import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import hfHandler from '../../api/huggingface.js';

describe('Hugging Face Router & Serverless Fallback Remediation', () => {
  const originalEnv = { ...process.env };

  const createMockRes = () => {
    const res: any = {
      statusCode: 200,
      headers: {},
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      setHeader(k: string, v: string) {
        this.headers[k] = v;
        return this;
      },
      json(data: any) {
        this.body = data;
        return this;
      }
    };
    return res;
  };

  test('Rejects non-POST HTTP methods with 405 Method Not Allowed', async () => {
    const req: any = { method: 'GET', headers: {} };
    const res = createMockRes();
    await hfHandler(req, res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.body.error, 'Method Not Allowed');
  });

  test('Guards against prototype pollution injection', async () => {
    const req: any = {
      method: 'POST',
      headers: {},
      body: '{"__proto__": {"polluted": true}, "prompt": "hello"}'
    };
    const res = createMockRes();
    await hfHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Invalid payload structure');
  });

  test('Returns clean deterministic fallback when no API key is present in environment', async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.HF_TOKEN;

    const req: any = {
      method: 'POST',
      headers: {},
      body: { prompt: 'hi portfolio', model: 'qwen-coder' }
    };
    const res = createMockRes();
    await hfHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.fallbackMode, true);
    assert.equal(res.body.model, 'Qwen/Qwen2.5-72B-Instruct');
    assert.match(res.body.text, /Simulated Response/);
  });

  test('Maps legacy and alias models to live router.huggingface.co models', async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.HF_TOKEN;

    const testCases = [
      { input: 'qwen-coder', expected: 'Qwen/Qwen2.5-72B-Instruct' },
      { input: 'Qwen/Qwen2.5-Coder-7B-Instruct', expected: 'Qwen/Qwen2.5-72B-Instruct' },
      { input: 'llama-3.2', expected: 'meta-llama/Llama-3.1-8B-Instruct' },
      { input: 'meta-llama/Llama-3.2-3B-Instruct', expected: 'meta-llama/Llama-3.1-8B-Instruct' },
      { input: 'mistral-7b', expected: 'meta-llama/Llama-3.1-8B-Instruct' },
      { input: 'mistralai/Mistral-7B-Instruct-v0.3', expected: 'meta-llama/Llama-3.1-8B-Instruct' },
      { input: 'gemma-3', expected: 'google/gemma-3-4b-it' }
    ];

    for (const tc of testCases) {
      const req: any = {
        method: 'POST',
        headers: {},
        body: { prompt: 'model mapping check', model: tc.input }
      };
      const res = createMockRes();
      await hfHandler(req, res);
      assert.equal(res.body.model, tc.expected, `Expected ${tc.input} to map to ${tc.expected}`);
    }
  });

  test('Dispatches OpenAI-compatible chat completion and extracts generated text correctly', async () => {
    process.env.HUGGINGFACE_API_KEY = 'hf_mock_valid_token_test';

    const originalFetch = globalThis.fetch;
    let interceptedUrl = '';
    let interceptedBody: any = null;

    globalThis.fetch = (async (url: any, init: any) => {
      interceptedUrl = String(url);
      interceptedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Greetings from live Hugging Face Inference Providers!'
              }
            }
          ]
        })
      };
    }) as any;

    try {
      const req: any = {
        method: 'POST',
        headers: {},
        body: {
          prompt: 'Hello AI assistant',
          systemPrompt: 'You are JARVIS',
          model: 'qwen-coder',
          agentId: 'JARVIS'
        }
      };
      const res = createMockRes();
      await hfHandler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.fallbackMode, false);
      assert.equal(res.body.text, 'Greetings from live Hugging Face Inference Providers!');
      assert.equal(interceptedUrl, 'https://router.huggingface.co/v1/chat/completions');
      assert.equal(interceptedBody.model, 'Qwen/Qwen2.5-72B-Instruct');
      assert.equal(interceptedBody.messages.length, 2);
      assert.equal(interceptedBody.messages[0].role, 'system');
      assert.equal(interceptedBody.messages[1].role, 'user');
    } finally {
      globalThis.fetch = originalFetch;
      process.env = { ...originalEnv };
    }
  });

  test('When router rejects or fails, sets success=false and fallbackMode=true without throwing', async () => {
    process.env.HUGGINGFACE_API_KEY = 'hf_mock_failing_token_test';

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      return {
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Model not supported by provider hf-inference' })
      };
    }) as any;

    try {
      const req: any = {
        method: 'POST',
        headers: {},
        body: { prompt: 'hi...', model: 'qwen-coder' }
      };
      const res = createMockRes();
      await hfHandler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, false);
      assert.equal(res.body.fallbackMode, true);
      assert.match(res.body.text, /\[Hugging Face Provider Notice\]/);
      assert.match(res.body.text, /Falling back to local heuristic response/);
    } finally {
      globalThis.fetch = originalFetch;
      process.env = { ...originalEnv };
    }
  });
});
