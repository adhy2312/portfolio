export default async function handler(req, res) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || process.env.REACT_APP_SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return res.status(500).json({ error: 'Spotify API secrets are missing.', isPlaying: false });
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
  const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
  const LAST_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
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
    
    const { access_token } = await tokenRes.json();

    const nowPlayingRes = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (nowPlayingRes.status === 204 || nowPlayingRes.status > 400) {
      const lastRes = await fetch(LAST_PLAYED_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!lastRes.ok) return res.status(200).json({ isPlaying: false });
      
      const lastData = await lastRes.json();
      const item = lastData?.items?.[0]?.track;
      if (!item) return res.status(200).json({ isPlaying: false });
      
      return res.status(200).json({
        isPlaying: false,
        title: item.name,
        artist: item.artists.map(a => a.name).join(', '),
        album: item.album.name,
        albumArt: item.album.images?.[0]?.url || null,
        songUrl: item.external_urls?.spotify,
        previewUrl: item.preview_url || null,
        progress: 0,
        duration: item.duration_ms,
      });
    }

    const data = await nowPlayingRes.json();
    const item = data?.item;
    if (!item) return res.status(200).json({ isPlaying: false });

    return res.status(200).json({
      isPlaying: data.is_playing,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      album: item.album.name,
      albumArt: item.album.images?.[0]?.url || null,
      songUrl: item.external_urls?.spotify,
      previewUrl: item.preview_url || null,
      progress: data.progress_ms,
      duration: item.duration_ms,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Spotify API error', isPlaying: false });
  }
}
