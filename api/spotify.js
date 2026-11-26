export default async function handler(req, res) {
  // Prevent all browser & edge CDN caching for live real-time sync
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || process.env.REACT_APP_SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return res.status(500).json({ error: 'Spotify API secrets are missing.', isPlaying: false });
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
  const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode';
  const LAST_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

  const fetchWithTimeout = (url, options = {}, ms = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
  };

  const formatSpotifyItem = (item, isPlaying = false, progress = 0) => {
    const isEpisode = item?.type === 'episode';
    return {
      isPlaying: Boolean(isPlaying),
      title: item.name,
      artist: isEpisode
        ? (item.show?.publisher || item.show?.name || 'Podcast')
        : (item.artists ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist'),
      album: isEpisode ? (item.show?.name || '') : (item.album ? item.album.name : ''),
      albumArt: item.album?.images?.[0]?.url || item.images?.[0]?.url || null,
      songUrl: item.external_urls?.spotify || '',
      previewUrl: item.preview_url || item.audio_preview_url || null,
      progress: progress || 0,
      duration: item.duration_ms || 0,
    };
  };

  try {
    const tokenRes = await fetchWithTimeout(TOKEN_ENDPOINT, {
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
    
    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return res.status(tokenRes.status).json({ error: 'Spotify token refresh failed', details: errBody, isPlaying: false });
    }

    const { access_token } = await tokenRes.json();
    if (!access_token) {
      return res.status(500).json({ error: 'No access token provided by Spotify', isPlaying: false });
    }

    const nowPlayingRes = await fetchWithTimeout(NOW_PLAYING_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    let data = null;
    if (nowPlayingRes.status === 200) {
      try {
        const text = await nowPlayingRes.text();
        if (text) data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    // 1. If user has an active track or episode in currently-playing (playing OR paused)
    if (data && data.item && data.item.name) {
      return res.status(200).json(formatSpotifyItem(data.item, data.is_playing, data.progress_ms));
    }

    // 2. If nothing currently in player, fallback to true last played track from history
    const lastRes = await fetchWithTimeout(LAST_PLAYED_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (lastRes.ok) {
      const lastData = await lastRes.json();
      const item = lastData?.items?.[0]?.track;
      if (item && item.name) {
        return res.status(200).json(formatSpotifyItem(item, false, 0));
      }
    }

    return res.status(200).json({ isPlaying: false });
  } catch (error) {
    return res.status(500).json({ error: 'Spotify API error: ' + (error?.message || error), isPlaying: false });
  }
}
