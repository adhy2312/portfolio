import React, { useEffect, useState, useRef } from 'react';
import './NowPlaying.css';
import { getNowPlaying } from '../utils/spotify';

const POLL_INTERVAL = 6000;
const LS_KEY = 'np_minimized';
const CACHE_KEY = 'np_last_track';

const INITIAL_TRACK = {
  isPlaying: false,
  title: 'Barsaat Lagdi Ae',
  artist: 'Darshan Raval, Simran Choudhary',
  album: 'Barsaat Lagdi Ae',
  albumArt: 'https://i.scdn.co/image/ab67616d0000b2739362837aa3011d5c421f1e16',
  songUrl: 'https://open.spotify.com/track/7xbRQfVgKHGyp5grJErFop',
  previewUrl: null,
  progress: 0,
  duration: 186134,
};

const SpotifyIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.307a.748.748 0 01-1.03.25c-2.822-1.725-6.376-2.115-10.563-1.159a.748.748 0 11-.334-1.458c4.578-1.047 8.51-.596 11.678 1.339a.748.748 0 01.249 1.028zm1.472-3.275a.936.936 0 01-1.287.308c-3.228-1.983-8.151-2.558-11.974-1.4a.937.937 0 01-.574-1.786c4.365-1.325 9.795-.682 13.527 1.593a.937.937 0 01.308 1.285zm.127-3.407c-3.873-2.3-10.256-2.511-13.95-1.39a1.124 1.124 0 11-.652-2.15c4.244-1.29 11.3-1.04 15.762 1.607a1.124 1.124 0 11-1.16 1.933z" />
  </svg>
);

const WaveformBars = ({ isPlaying }) => (
  <div className={`sp-eq ${isPlaying ? 'sp-eq--active' : ''}`} aria-hidden="true">
    <span /><span /><span /><span />
  </div>
);

const formatTime = (ms) => {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const NowPlaying = () => {
  const [track, setTrack] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : INITIAL_TRACK;
    } catch {
      return INITIAL_TRACK;
    }
  });

  const [imgError, setImgError] = useState(false);
  const [minimized, setMinimized] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [liked, setLiked] = useState(true);

  const progressRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [track?.albumArt]);

  const fetchTrack = async () => {
    try {
      const data = await getNowPlaying();
      if (data && data.title) {
        setTrack(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch {}
  };

  useEffect(() => {
    fetchTrack();
    const interval = setInterval(fetchTrack, POLL_INTERVAL);
    const onVisibility = () => {
      if (!document.hidden) fetchTrack();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Smooth real-time progress interpolation
  useEffect(() => {
    if (!track?.isPlaying || !progressRef.current) return;
    let start = null;
    const startProgress = track.progress || 0;
    const duration = track.duration || 1;

    const tick = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const current = Math.min(startProgress + elapsed, duration);
      const pct = (current / duration) * 100;

      if (progressRef.current) {
        progressRef.current.style.width = `${pct}%`;
      }

      if (current < duration && track?.isPlaying) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [track?.isPlaying, track?.progress, track?.duration]);

  // Clean ambient light: STRICTLY active only when music is currently playing
  useEffect(() => {
    const isPlaying = track?.isPlaying === true;
    const body = document.body;

    if (!isPlaying) {
      body.classList.remove('spotify-ambient-active', 'spotify-playing');
      body.style.removeProperty('--spotify-ambient-accent');
      body.style.removeProperty('--spotify-ambient-glow-card');
      return;
    }

    body.classList.add('spotify-ambient-active', 'spotify-playing');
    body.style.setProperty('--spotify-ambient-accent', 'rgba(30, 215, 96, 0.4)');
    body.style.setProperty('--spotify-ambient-glow-card', 'rgba(30, 215, 96, 0.08)');

    return () => {
      body.classList.remove('spotify-ambient-active', 'spotify-playing');
      body.style.removeProperty('--spotify-ambient-accent');
      body.style.removeProperty('--spotify-ambient-glow-card');
    };
  }, [track?.isPlaying]);

  const toggleMinimized = () => {
    const next = !minimized;
    setMinimized(next);
    try {
      localStorage.setItem(LS_KEY, String(next));
    } catch {}
  };

  const currentTrack = track || INITIAL_TRACK;
  const progressPct = currentTrack.duration
    ? Math.min(100, Math.max(0, ((currentTrack.progress || 0) / currentTrack.duration) * 100))
    : 0;

  return (
    <>
      {/* ─── MINIMIZED DOCK PILL ─── */}
      {minimized ? (
        <button
          className="sp-dock-pill"
          onClick={toggleMinimized}
          aria-label="Expand Spotify player"
          title={`${currentTrack.title} — ${currentTrack.artist}`}
        >
          <div className="sp-dock-icon-wrap">
            <SpotifyIcon size={18} color="#1ed760" />
          </div>
          <div className="sp-dock-meta">
            <span className="sp-dock-title">{currentTrack.title}</span>
            <span className="sp-dock-artist">{currentTrack.artist}</span>
          </div>
          <WaveformBars isPlaying={currentTrack.isPlaying} />
        </button>
      ) : (
        /* ─── EXPANDED PRISTINE SPOTIFY PLAYER ─── */
        <div className="sp-player-wrapper">
          <div className="sp-player-glass">
            {/* Header: Brand & Live Indicator & Actions */}
            <div className="sp-header">
              <div className="sp-brand-badge">
                <SpotifyIcon size={15} color="#1ed760" />
                <span className="sp-brand-text">Spotify</span>
                <span className="sp-status-dot-wrap" title={currentTrack.isPlaying ? 'Now Playing on Spotify' : 'Playback Paused'}>
                  <span className={`sp-status-dot ${currentTrack.isPlaying ? 'sp-status-dot--live' : ''}`} />
                  <span className="sp-status-label">{currentTrack.isPlaying ? 'Active' : 'Offline'}</span>
                </span>
              </div>

              <div className="sp-header-actions">
                <a
                  href={currentTrack.songUrl || 'https://open.spotify.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sp-action-btn"
                  title="Open in Spotify App"
                  aria-label="Open track on Spotify"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>

                <button
                  type="button"
                  className="sp-action-btn"
                  onClick={toggleMinimized}
                  aria-label="Minimize player"
                  title="Minimize player"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content: Album Cover + Track Details + Like Heart */}
            <div className="sp-content">
              <div className="sp-cover-container">
                {currentTrack.albumArt && !imgError ? (
                  <img
                    src={currentTrack.albumArt}
                    alt={currentTrack.title}
                    className="sp-cover-img"
                    loading="lazy"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="sp-cover-fallback">
                    <SpotifyIcon size={24} color="#1ed760" />
                  </div>
                )}
                {currentTrack.isPlaying && (
                  <div className="sp-cover-badge">
                    <WaveformBars isPlaying />
                  </div>
                )}
              </div>

              <div className="sp-track-info">
                <a
                  href={currentTrack.songUrl || 'https://open.spotify.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sp-title"
                  title={currentTrack.title}
                >
                  {currentTrack.title}
                </a>
                <p className="sp-artist" title={currentTrack.artist}>
                  {currentTrack.artist}
                </p>
              </div>

              <button
                type="button"
                className={`sp-like-btn ${liked ? 'sp-like-btn--liked' : ''}`}
                onClick={() => setLiked(prev => !prev)}
                title={liked ? 'Saved to Your Library' : 'Save to Library'}
                aria-label="Save to library"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? '#1ed760' : 'none'} stroke={liked ? '#1ed760' : '#b3b3b3'} strokeWidth="1.8">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>

            {/* Pristine Modern Scrubber */}
            <div className="sp-scrubber-row">
              <span className="sp-time-label">{formatTime(currentTrack.progress || 0)}</span>
              <div className="sp-track-bar">
                <div
                  ref={progressRef}
                  className="sp-track-fill"
                  style={{ width: `${progressPct}%` }}
                >
                  <span className="sp-track-knob" />
                </div>
              </div>
              <span className="sp-time-label">{formatTime(currentTrack.duration || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NowPlaying;
