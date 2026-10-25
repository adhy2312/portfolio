export const getNowPlaying = async () => {
  try {
    const res = await fetch(`/api/spotify?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res && res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.title) return data;
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  try {
    const fallbackRes = await fetch(`/api/spotify.json?_t=${Date.now()}`);
    if (fallbackRes && fallbackRes.ok) {
      const contentType = fallbackRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await fallbackRes.json();
      }
    }
  } catch {}

  return { isPlaying: false };
};

