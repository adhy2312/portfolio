import React, { useEffect, useState, useRef } from 'react';
import './NowPlaying.css';
import { getNowPlaying } from '../utils/spotify';

const POLL_INTERVAL = 30000;
const LS_KEY = 'np_minimized';
const CACHE_KEY = 'np_last_track';

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
  const [track, setTrack]           = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading]       = useState(true);
  const [minimized, setMinimized]   = useState(
    () => localStorage.getItem(LS_KEY) === 'true'
  );
  const intervalRef  = useRef(null);
  const progressRef  = useRef(null);

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
            return data;
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
    const startProgress = track.progress;
    const duration      = track.duration;

    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const current = Math.min(startProgress + elapsed, duration);
      if (progressRef.current) {
        progressRef.current.style.width = `${(current / duration) * 100}%`;
      }
      if (current < duration) requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [track]);

  const toggleMinimized = () => {
    const next = !minimized;
    setMinimized(next);
    localStorage.setItem(LS_KEY, String(next));
  };

  if (loading && !track) return null;

  const progressPct = track?.duration
    ? (track.progress / track.duration) * 100
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
        <Waveform isPlaying={track?.isPlaying} />
      </button>
    );
  }

  /* ── Full widget ─────────────────────────────────────── */
  return (
    <div className="np-widget">
      {/* Close → minimise to dock */}
      <button
        className="np-close"
        onClick={toggleMinimized}
        aria-label="Minimise Spotify widget"
        title="Minimise"
      >
        ✕
      </button>

      {/* Album art */}
      <div className="np-art-wrap">
        {track?.albumArt ? (
          <img
            src={track.albumArt}
            alt={track?.album}
            className={`np-art ${track?.isPlaying ? 'np-art--spinning' : ''}`}
          />
        ) : (
          <div className="np-art np-art--placeholder">
            <SpotifyIcon size={20} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="np-info">
        <div className="np-label">
          <SpotifyIcon />
          <span>{track?.isPlaying ? 'Now Playing' : 'Last Played'}</span>
        </div>

        {track?.songUrl ? (
          <a
            href={track.songUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="np-title"
            title={track?.title}
          >
            {track?.title || '—'}
          </a>
        ) : (
          <span className="np-title">{track?.title || '—'}</span>
        )}

        <div className="np-artist">{track?.artist || '—'}</div>

        {track?.duration > 0 && (
          <>
            <div className="np-progress-track">
              <div
                className="np-progress-fill"
                ref={progressRef}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="np-timestamps">
              <span>{formatMs(track.progress)}</span>
              <span>{formatMs(track.duration)}</span>
            </div>
          </>
        )}
      </div>

      {/* Waveform */}
      <div className="np-status">
        <Waveform isPlaying={track?.isPlaying} />
      </div>
    </div>
  );
};

export default NowPlaying;
