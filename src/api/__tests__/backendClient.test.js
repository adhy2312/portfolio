import { BackendClient, BACKEND_STATUS } from '../backendClient.js';

describe('Frontend Compatibility — BackendClient Abstraction', () => {
  const originalFetch = window.fetch;

  afterEach(() => {
    window.fetch = originalFetch;
  });

  test('Initializes with default baseUrl and CHECKING status', () => {
    const client = new BackendClient({ baseUrl: 'http://127.0.0.1:3001' });
    expect(client.baseUrl).toBe('http://127.0.0.1:3001');
    expect(client.status).toBe(BACKEND_STATUS.CHECKING);
  });

  test('checkHealth reports ONLINE and telemetry when backend responds with 200', async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        status: 'healthy',
        uptimeSeconds: 42,
        persistence: { connected: true, provider: 'supabase' }
      })
    });

    const client = new BackendClient({ baseUrl: 'http://127.0.0.1:3001' });
    const res = await client.checkHealth();

    expect(res.available).toBe(true);
    expect(res.status).toBe(BACKEND_STATUS.ONLINE);
    expect(res.telemetry.status).toBe('healthy');
  });

  test('checkHealth reports OFFLINE and degraded mode when backend is unreachable', async () => {
    window.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

    const client = new BackendClient({ baseUrl: 'http://127.0.0.1:3001' });
    const res = await client.checkHealth();

    expect(res.available).toBe(false);
    expect(res.status).toBe(BACKEND_STATUS.OFFLINE);
    expect(res.degraded).toBe(true);
    expect(res.reason).toBe('Connection refused');
  });

  test('queryPublicChat returns structured response on 200', async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        reply: 'Hello from Mini-Adhy backend',
        sessionId: 'sess_1',
        domain: 'PUBLIC_VISITOR_SANDBOX',
        timestamp: '2026-11-10T00:00:00Z'
      })
    });

    const client = new BackendClient({ baseUrl: 'http://127.0.0.1:3001' });
    const res = await client.queryPublicChat({ message: 'What projects do you have?' });

    expect(res.success).toBe(true);
    expect(res.degraded).toBe(false);
    expect(res.reply).toBe('Hello from Mini-Adhy backend');
    expect(res.domain).toBe('PUBLIC_VISITOR_SANDBOX');
  });

  test('queryPublicChat honestly marks degraded state if backend fails, never faking success', async () => {
    window.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    const client = new BackendClient({ baseUrl: 'http://127.0.0.1:3001' });
    const res = await client.queryPublicChat({ message: 'Hello' });

    expect(res.success).toBe(false);
    expect(res.degraded).toBe(true);
    expect(res.reply).toBeNull();
    expect(res.error).toContain('Mini-Adhy Backend is currently unreachable');
  });
});
