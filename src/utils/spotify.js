export const getNowPlaying = async () => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
  try {
    const res = await fetch(`/api/spotify?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller ? controller.signal : undefined,
    });
    if (res) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data && data.title) return data;
        if (!res.ok && data?.error) {
          return {
            isPlaying: false,
            authError: Boolean(data.tokenRevoked || res.status === 400 || res.status === 401),
            errorReason: data.details || data.error
          };
        }
      }
    }
  } catch (error) {
    // Continue to fallback
  } finally {
    if (timer) clearTimeout(timer);
  }

  return { isPlaying: false };
};

