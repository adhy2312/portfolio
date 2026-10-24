import React, { useEffect, useState, useRef } from 'react';
import './NowPlaying.css';
import { getNowPlaying } from '../utils/spotify';
import ns from '../core/NervousSystem';

const POLL_INTERVAL = 6000;
const LS_KEY = 'np_minimized';
const CACHE_KEY = 'np_last_track';

// Pre-seeded with Adhithya's actual last played Spotify track
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
  const [, setLoading]             = useState(true);
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
      if (data && data.title) {
        setTrack(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
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

    const onVisibility = () => {
      if (!document.hidden) {
        fetchTrack();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

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

  // ── Dynamic Song Theme & Album Artwork Color Palette Extractor ──
  // STRICT RULE: Only activate ambient lighting when music is ACTIVELY playing!
  useEffect(() => {
    const root = document.documentElement.style;

    const cleanupAmbient = () => {
      document.body.classList.remove('spotify-ambient-active');
      document.body.classList.remove('spotify-playing');
      root.removeProperty('--spotify-ambient-accent');
      root.removeProperty('--spotify-ambient-glow');
      root.removeProperty('--spotify-ambient-glow-card');
      root.removeProperty('--spotify-ambient-glow-card-deep');
      root.removeProperty('--spotify-ambient-text-glow');
      root.removeProperty('--spotify-ambient-border');
      root.removeProperty('--spotify-ambient-corner-glow');
    };

    if (track && track.title && track.isPlaying) {
      // 1. Perceptual Lyrical / Genre Theme Fallback
      const getThemePalette = (t = '', a = '') => {
        const text = `${t} ${a}`.toLowerCase();
        let h = 226, s = 84, l = 56;
        if (/barsaat|rain|monsoon|baarish|lagdi|safar|clouds|tears|night|dark|storm|sad/.test(text)) {
          h = 248; s = 86; l = 58;
        } else if (/love|ishq|dil|romance|sunset|warm|heart|sweet|acoustic|guitar|slow/.test(text)) {
          h = 345; s = 88; l = 60;
        } else if (/neon|synth|electro|club|dance|party|bass|future|cyber|trap/.test(text)) {
          h = 188; s = 96; l = 52;
        } else if (/chill|calm|peace|green|nature|forest|breeze|sky|ocean|fly|lo-fi|lofi/.test(text)) {
          h = 162; s = 82; l = 48;
        } else {
          let hash = 0;
          for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
          }
          h = Math.abs(hash) % 360;
          s = 82;
          l = 56;
        }

        return {
          accent: `hsl(${h}, ${s}%, ${l}%)`,
          glow: `hsla(${h}, ${s}%, ${l}%, 0.18)`,
          glowCard: `hsla(${h}, ${s}%, 52%, 0.09)`,
          glowCardDeep: `hsla(${h}, ${s}%, 52%, 0.16)`,
          textGlow: `hsla(${h}, ${s}%, 62%, 0.14)`,
          border: `hsla(${h}, ${s}%, 55%, 0.22)`,
          cornerGlow: `hsla(${h}, ${s}%, 55%, 0.10)`
        };
      };

      const applyPalette = (p) => {
        root.setProperty('--spotify-ambient-accent', p.accent);
        root.setProperty('--spotify-ambient-glow', p.glow);
        root.setProperty('--spotify-ambient-glow-card', p.glowCard);
        root.setProperty('--spotify-ambient-glow-card-deep', p.glowCardDeep);
        root.setProperty('--spotify-ambient-text-glow', p.textGlow);
        root.setProperty('--spotify-ambient-border', p.border);
        root.setProperty('--spotify-ambient-corner-glow', p.cornerGlow);

        document.body.classList.add('spotify-ambient-active');
        document.body.classList.add('spotify-playing');
      };

      // 2. Direct Canvas pixel extraction from album cover
      if (track.albumArt && typeof window !== 'undefined') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = track.albumArt;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 24;
            canvas.height = 24;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 24, 24);
            const imgData = ctx.getImageData(0, 0, 24, 24).data;
            const samples = [];
            for (let i = 0; i < imgData.length; i += 4) {
              const r = imgData[i];
              const g = imgData[i + 1];
              const b = imgData[i + 2];
              const a = imgData[i + 3];
              if (a < 128) continue;
              const max = Math.max(r, g, b) / 255;
              const min = Math.min(r, g, b) / 255;
              const l = (max + min) / 2;
              let h = 0, s = 0;
              if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                  case r / 255: h = (g / 255 - b / 255) / d + (g < b ? 6 : 0); break;
                  case g / 255: h = (b / 255 - r / 255) / d + 2; break;
                  case b / 255: h = (r / 255 - g / 255) / d + 4; break;
                  default: break;
                }
                h = Math.round(h * 60);
              }
              if (s > 0.22 && l > 0.18 && l < 0.85) {
                samples.push({ h, s: Math.round(s * 100), l: Math.round(l * 100) });
              }
            }
            if (samples.length >= 2) {
              samples.sort((a, b) => (b.s * 0.7 + b.l * 0.3) - (a.s * 0.7 + a.l * 0.3));
              const dom = samples[0];
              const h = dom.h;
              const s = Math.max(dom.s, 65);
              const l = Math.min(Math.max(dom.l, 45), 65);
              applyPalette({
                accent: `hsl(${h}, ${s}%, ${l}%)`,
                glow: `hsla(${h}, ${s}%, ${l}%, 0.18)`,
                glowCard: `hsla(${h}, ${s}%, 50%, 0.09)`,
                glowCardDeep: `hsla(${h}, ${s}%, 50%, 0.16)`,
                textGlow: `hsla(${h}, ${s}%, 62%, 0.14)`,
                border: `hsla(${h}, ${s}%, 55%, 0.22)`,
                cornerGlow: `hsla(${h}, ${s}%, 55%, 0.10)`
              });
              return;
            }
          } catch (e) {}
          applyPalette(getThemePalette(track.title, track.artist));
        };
        img.onerror = () => applyPalette(getThemePalette(track.title, track.artist));
      } else {
        applyPalette(getThemePalette(track.title, track.artist));
      }
    } else {
      // Music is paused, stopped, or not playing: ZERO ambient light
      cleanupAmbient();
    }

    return cleanupAmbient;
  }, [track?.isPlaying, track?.title, track?.artist, track?.albumArt]);

  const toggleMinimized = () => {
    const next = !minimized;
    setMinimized(next);
    localStorage.setItem(LS_KEY, String(next));
  };

  const currentTrack = track || INITIAL_TRACK;
  const progressPct = currentTrack.duration
    ? ((currentTrack.progress || 0) / currentTrack.duration) * 100
    : 0;

  return (
    <>
      {/* Docked pill on the screen edge when player is minimized */}
      {minimized ? (
        <button
          className="np-dock"
          onClick={toggleMinimized}
          aria-label="Expand Spotify widget"
          title="Show Spotify Player"
        >
          <SpotifyIcon size={16} />
          <Waveform isPlaying={currentTrack.isPlaying} />
        </button>
      ) : (
        <div className="np-wrapper">
          <div className="np-widget">
            {/* 1. Header: Status Tag + External Link + Minimize Button */}
            <div className="np-header">
              <div className="np-status-tag">
                <span className={`np-status-dot ${currentTrack.isPlaying ? 'np-status-dot--live' : ''}`} />
                <span className="np-status-text">
                  {currentTrack.isPlaying ? 'NOW PLAYING' : 'SPOTIFY PAUSED'}
                </span>
              </div>

              <div className="np-header-actions">
                <a
                  href={currentTrack.songUrl || 'https://open.spotify.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="np-spotify-link"
                  title="Open track on Spotify"
                  aria-label="Open track on Spotify"
                >
                  <SpotifyIcon size={14} />
                </a>

                <button
                  type="button"
                  className="np-btn-minimize"
                  onClick={toggleMinimized}
                  aria-label="Minimize Spotify player"
                  title="Minimize player"
                >
                  &minus;
                </button>
              </div>
            </div>

            {/* 2. Body: Artwork + Track Details */}
            <div className="np-body">
              <div className="np-art-wrap">
                {currentTrack.albumArt && !imgError ? (
                  <img
                    src={currentTrack.albumArt}
                    alt={currentTrack.album || currentTrack.title}
                    className={`np-art ${currentTrack.isPlaying ? 'np-art--playing' : ''}`}
                    loading="lazy"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="np-art np-art--placeholder">
                    <SpotifyIcon size={22} />
                  </div>
                )}
                {currentTrack.isPlaying && (
                  <div className="np-art-badge" title="Live audio active">
                    <Waveform isPlaying />
                  </div>
                )}
              </div>

              <div className="np-details">
                <a
                  href={currentTrack.songUrl || 'https://open.spotify.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="np-title"
                  title={`${currentTrack.title} on Spotify`}
                >
                  {currentTrack.title}
                </a>

                <p className="np-artist" title={currentTrack.artist}>
                  {currentTrack.artist}
                </p>

                {currentTrack.previewUrl && (
                  <button type="button" className="np-preview-btn" onClick={togglePreview} title="Listen to 30s sample">
                    {previewPlaying ? 'Pause Sample ⏸' : '30s Sample ▶'}
                  </button>
                )}
              </div>
            </div>

            {/* 3. Footer: Progress Track and Time Row */}
            <div className="np-progress-section">
              <div className="np-progress-track">
                <div
                  ref={progressRef}
                  className="np-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {currentTrack.duration > 0 && (
                <div className="np-time-row">
                  <span>{formatMs(currentTrack.progress || 0)}</span>
                  <span>{formatMs(currentTrack.duration)}</span>
                </div>
              )}
            </div>

            {currentTrack.previewUrl && (
              <audio ref={audioRef} src={currentTrack.previewUrl} onEnded={() => setPreviewPlaying(false)} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NowPlaying;
