export const getNowPlaying = async () => {
  try {
    const res = await fetch(`/api/spotify?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return { isPlaying: false };
    return await res.json();
  } catch (error) {
    return { isPlaying: false };
  }
};
