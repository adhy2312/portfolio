const CLIENT_ID     = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REACT_APP_SPOTIFY_REFRESH_TOKEN;

const TOKEN_ENDPOINT   = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const LAST_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

const getAccessToken = async () => {
  const basic = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });
  return res.json();
};

export const getNowPlaying = async () => {
  const { access_token } = await getAccessToken();

  const res = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  // 204 = nothing playing
  if (res.status === 204 || res.status > 400) {
    // Fall back to last played
    const lastRes = await fetch(LAST_PLAYED_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!lastRes.ok) return { isPlaying: false };
    const lastData = await lastRes.json();
    const item = lastData?.items?.[0]?.track;
    if (!item) return { isPlaying: false };
    return {
      isPlaying: false,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      album: item.album.name,
      albumArt: item.album.images?.[0]?.url || null,
      songUrl: item.external_urls?.spotify,
      progress: 0,
      duration: item.duration_ms,
    };
  }

  const data = await res.json();
  const item = data?.item;
  if (!item) return { isPlaying: false };

  return {
    isPlaying: data.is_playing,
    title: item.name,
    artist: item.artists.map(a => a.name).join(', '),
    album: item.album.name,
    albumArt: item.album.images?.[0]?.url || null,
    songUrl: item.external_urls?.spotify,
    progress: data.progress_ms,
    duration: item.duration_ms,
  };
};
