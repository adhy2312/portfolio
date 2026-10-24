import React, { useEffect, useState, useRef } from 'react';
import './NowPlaying.css';
import { getNowPlaying } from '../utils/spotify';
import ns from '../core/NervousSystem';

const POLL_INTERVAL = 30000;
const LS_KEY = 'np_minimized';
const CACHE_KEY = 'np_last_track';

// Pre-seeded with Adhithya's actual last played Spotify track
const INITIAL_TRACK = {
  isPlaying: false,
  title: 'Nafrat',
  artist: 'Darshan Raval',
  album: 'I Loved You',
  albumArt: 'https://i.scdn.co/image/ab67616d0000b2730295f44c90127ce4c40d3a60',
  songUrl: 'https://open.spotify.com/track/0NLOLiHF6Ti0QtX5P7gziI',
  previewUrl: null,
  progress: 0,
  duration: 214264,
};

const SpotifyIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.307a.748.748 0 01-1.03.25c-2.822-1.725-6.376-2.115-10.563-1.159a.748.748 0 11-.334-1.458c4.578-1.047 8.51-.596 11.678 1.339a.748.748 0 01.249 1.028zm1.472-3.275a.936.936 0 01-1.287.308c-3.228-1.983-8.151-2.558-11.974-1.4a.937.937 0 01-.574-1.786c4.365-1.325 9.795-.682 13.527 1.593a.937.937 0 01.308 1.285zm.127-3.407c-3.873-2.3-10.256-2.511-13.95-1.39a1.124 1.124 0 11-.652-2.15c4.244-1.29 11.3-1.04 15.762 1.607a1.124 1.124 0 11-1.16 1.933z" />
  </svg>
);

const Waveform = ({ isPlaying }) => (
  <div className={`np-waveform ${isPlaying ? 'np-waveform--playing' : ''}`}>
    <span /><span /><span /><span />
  </div>
);

const formatMs = (ms) => {
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
  const [loading, setLoading]       = useState(true);
  const [imgError, setImgError]     = useState(false);
  const [minimized, setMinimized]   = useState(
    () => localStorage.getItem(LS_KEY) === 'true'
  );
  const intervalRef  = useRef(null);
  const progressRef  = useRef(null);
  const audioRef     = useRef(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  // Reset image error state whenever track album art changes
  useEffect(() => {
    setImgError(false);
  }, [track?.albumArt]);

  // Sync audio with track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewPlaying(false);
    }
  }, [track?.songUrl]);

  const togglePreview = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (previewPlaying) {
      audioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      audioRef.current.volume = 0.4;
      audioRef.current.play().then(() => setPreviewPlaying(true)).catch(() => {});
    }
  };

  const fetchTrack = async () => {
    try {
      const data = await getNowPlaying();
      if (data) {
        if (data.title) {
          setTrack(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } else if (data.isPlaying === false) {
          setTrack(prev => {
            if (prev && prev.title) {
              const updated = { ...prev, isPlaying: false };
              localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
              return updated;
            }
            return prev || INITIAL_TRACK;
          });
        }
      }
    } catch {
      // Keep existing track on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrack();
    intervalRef.current = setInterval(fetchTrack, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line

  // Smooth real-time progress interpolation between API polls
  useEffect(() => {
    if (!track?.isPlaying || !progressRef.current) return;
    let start = null;
    const startProgress = track.progress || 0;
    const duration      = track.duration || 1;

    const animate = (time) => {
      if (!start) start = time;
      const elapsed = time - start;
      const current = Math.min(startProgress + elapsed, duration);
      if (progressRef.current) {
        progressRef.current.style.width = `${(current / duration) * 100}%`;
      }
      if (current >= duration) {
        ns.unregister('spotify-progress');
      }
    };

    ns.register('spotify-progress', animate, { priority: 'CRITICAL' });
    return () => ns.unregister('spotify-progress');
  }, [track]);

  // Ambient Chroma Lighting System across entire website
  useEffect(() => {
    const root = document.documentElement.style;
    if (track?.isPlaying && track?.title) {
      const str = (track.title || '') + (track.artist || '');
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      const hue = Math.abs(hash) % 360;
      const secHue = (hue + 55) % 360;

      root.setProperty('--spotify-ambient-accent', `hsl(${hue}, 88%, 62%)`);
      root.setProperty('--spotify-ambient-sec', `hsl(${secHue}, 80%, 55%)`);
      root.setProperty('--spotify-ambient-glow', `hsla(${hue}, 88%, 62%, 0.22)`);
      root.setProperty('--spotify-ambient-bg', `radial-gradient(circle at 10% 90%, hsla(${hue}, 85%, 55%, 0.16) 0%, transparent 60%), radial-gradient(circle at 90% 10%, hsla(${secHue}, 85%, 55%, 0.14) 0%, transparent 55%)`);

      document.body.classList.add('spotify-ambient-active');
    } else {
      document.body.classList.remove('spotify-ambient-active');
      root.removeProperty('--spotify-ambient-accent');
      root.removeProperty('--spotify-ambient-sec');
      root.removeProperty('--spotify-ambient-glow');
      root.removeProperty('--spotify-ambient-bg');
    }

    return () => {
      document.body.classList.remove('spotify-ambient-active');
    };
  }, [track?.isPlaying, track?.title, track?.artist]);

  const toggleMinimized = () => {
    const next = !minimized;
    setMinimized(next);
    localStorage.setItem(LS_KEY, String(next));
  };

  const currentTrack = track || INITIAL_TRACK;

  if (loading && !currentTrack) return null;

  const progressPct = currentTrack.duration
    ? ((currentTrack.progress || 0) / currentTrack.duration) * 100
    : 0;

  /* ── Docked / minimized state ───────────────────────── */
  if (minimized) {
    return (
      <button
        className="np-dock"
        onClick={toggleMinimized}
        aria-label="Expand Spotify widget"
        title="Show Now Playing"
      >
        <SpotifyIcon size={16} />
        <Waveform isPlaying={currentTrack.isPlaying} />
      </button>
    );
  }

  /* ── Full widget ─────────────────────────────────────── */
  return (
    <div className="np-wrapper">
      {/* Dynamic ambient chroma glow behind widget */}
      {currentTrack.albumArt && !imgError && (
        <div
          className={`np-ambient-glow ${currentTrack.isPlaying ? 'np-ambient-glow--active' : ''}`}
          style={{ backgroundImage: `url(${currentTrack.albumArt})` }}
          aria-hidden="true"
        />
      )}

      <div className="np-widget">
        {/* Subtle inner ambient color aura from album artwork */}
        {currentTrack.albumArt && !imgError && (
          <div
            className="np-inner-glow"
            style={{ backgroundImage: `url(${currentTrack.albumArt})` }}
            aria-hidden="true"
          />
        )}

        {/* Close → minimise to dock */}
        <button
          className="np-close"
          onClick={toggleMinimized}
          aria-label="Minimise Spotify widget"
          title="Minimise"
        >
          ✕
        </button>

        {/* Audio Element for Preview */}
        {currentTrack.previewUrl && (
          <audio 
            ref={audioRef} 
            src={currentTrack.previewUrl} 
            onEnded={() => setPreviewPlaying(false)} 
          />
        )}

        {/* Album art of currently playing or last played track */}
        <div 
          className="np-art-wrap" 
          onClick={currentTrack.previewUrl ? togglePreview : undefined} 
          style={{ cursor: currentTrack.previewUrl ? 'pointer' : 'default' }}
        >
          {currentTrack.albumArt && !imgError ? (
            <>
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.album || currentTrack.title}
                className={`np-art ${currentTrack.isPlaying ? 'np-art--spinning' : ''}`}
                onError={() => setImgError(true)}
                loading="lazy"
              />
              {currentTrack.previewUrl && (
                <div className={`np-play-overlay ${previewPlaying ? 'playing' : ''}`}>
                  {previewPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`np-art np-art--placeholder ${currentTrack.isPlaying ? 'np-art--spinning' : ''}`}>
              <SpotifyIcon size={20} />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="np-info">
          <div className="np-label">
            <SpotifyIcon />
            <span>{currentTrack.isPlaying ? 'Now Playing' : 'Last Played'}</span>
          </div>

          {currentTrack.songUrl ? (
            <a
              href={currentTrack.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="np-title"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </a>
          ) : (
            <span className="np-title">{currentTrack.title}</span>
          )}

          <div className="np-artist">{currentTrack.artist}</div>

          {currentTrack.duration > 0 && (
            <>
              <div className="np-progress-track">
                <div
                  className="np-progress-fill"
                  ref={progressRef}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="np-timestamps">
                <span>{formatMs(currentTrack.progress || 0)}</span>
                <span>{formatMs(currentTrack.duration)}</span>
              </div>
            </>
          )}
        </div>

        {/* Waveform */}
        <div className="np-status">
          <Waveform isPlaying={currentTrack.isPlaying} />
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
