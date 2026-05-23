export const getNowPlaying = async () => {
  try {
    const res = await fetch('/api/spotify');
    if (!res.ok) return { isPlaying: false };
    return await res.json();
  } catch (error) {
    return { isPlaying: false };
  }
};
