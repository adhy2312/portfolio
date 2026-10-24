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
  useEffect(() => {
    const root = document.documentElement.style;
    if (track && track.title) {
      // 1. Perceptual Lyrical / Genre Theme Fallback
      const getThemePalette = (t = '', a = '') => {
        const text = `${t} ${a}`.toLowerCase();
        if (/barsaat|rain|monsoon|baarish|lagdi|safar|clouds|tears|night|dark|storm|sad/.test(text)) {
          // Monsoon Twilight / Rain: Deep indigo, electric violet, cool rain teal, and amber shimmer
          return {
            c1: 'hsl(226, 84%, 54%)',
            c2: 'hsl(268, 80%, 62%)',
            c3: 'hsl(176, 82%, 40%)',
            c4: 'hsl(38, 95%, 58%)',
            accent: 'hsl(226, 84%, 58%)',
            glow: 'hsla(226, 84%, 58%, 0.28)',
            softGlow: 'hsla(268, 80%, 62%, 0.16)'
          };
        }
        if (/love|ishq|dil|romance|sunset|warm|heart|sweet|acoustic|guitar|slow/.test(text)) {
          return {
            c1: 'hsl(344, 85%, 56%)',
            c2: 'hsl(22, 92%, 56%)',
            c3: 'hsl(284, 76%, 62%)',
            c4: 'hsl(46, 96%, 62%)',
            accent: 'hsl(344, 85%, 60%)',
            glow: 'hsla(344, 85%, 60%, 0.28)',
            softGlow: 'hsla(284, 76%, 62%, 0.16)'
          };
        }
        if (/neon|synth|electro|club|dance|party|bass|future|cyber|trap/.test(text)) {
          return {
            c1: 'hsl(186, 95%, 50%)',
            c2: 'hsl(315, 92%, 58%)',
            c3: 'hsl(240, 88%, 64%)',
            c4: 'hsl(278, 90%, 65%)',
            accent: 'hsl(186, 95%, 52%)',
            glow: 'hsla(186, 95%, 52%, 0.28)',
            softGlow: 'hsla(315, 92%, 58%, 0.16)'
          };
        }
        if (/chill|calm|peace|green|nature|forest|breeze|sky|ocean|fly|lo-fi|lofi/.test(text)) {
          return {
            c1: 'hsl(164, 80%, 46%)',
            c2: 'hsl(198, 88%, 52%)',
            c3: 'hsl(268, 72%, 58%)',
            c4: 'hsl(140, 75%, 50%)',
            accent: 'hsl(164, 80%, 50%)',
            glow: 'hsla(164, 80%, 50%, 0.28)',
            softGlow: 'hsla(198, 88%, 52%, 0.16)'
          };
        }
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
          hash = (hash << 5) - hash + text.charCodeAt(i);
          hash |= 0;
        }
        const baseHue = Math.abs(hash) % 360;
        const h2 = (baseHue + 60) % 360;
        const h3 = (baseHue + 155) % 360;
        const h4 = (baseHue + 215) % 360;
        return {
          c1: `hsl(${baseHue}, 84%, 56%)`,
          c2: `hsl(${h2}, 86%, 60%)`,
          c3: `hsl(${h3}, 78%, 52%)`,
          c4: `hsl(${h4}, 90%, 62%)`,
          accent: `hsl(${baseHue}, 84%, 58%)`,
          glow: `hsla(${baseHue}, 84%, 58%, 0.28)`,
          softGlow: `hsla(${h2}, 86%, 60%, 0.16)`
        };
      };

      const applyPalette = (p) => {
        root.setProperty('--spotify-aurora-1', p.c1);
        root.setProperty('--spotify-aurora-2', p.c2);
        root.setProperty('--spotify-aurora-3', p.c3);
        root.setProperty('--spotify-aurora-4', p.c4);
        root.setProperty('--spotify-ambient-accent', p.accent);
        root.setProperty('--spotify-ambient-glow', p.glow);
        root.setProperty('--spotify-aurora-glow-soft', p.softGlow);

        document.body.classList.add('spotify-ambient-active');
        if (track.isPlaying) {
          document.body.classList.add('spotify-playing');
        } else {
          document.body.classList.remove('spotify-playing');
        }
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
            if (samples.length >= 3) {
              samples.sort((a, b) => (b.s * 0.7 + b.l * 0.3) - (a.s * 0.7 + a.l * 0.3));
              const c1 = samples[0];
              const c2 = samples.find(c => Math.abs(c.h - c1.h) > 35) || { h: (c1.h + 55) % 360, s: 80, l: 58 };
              const c3 = samples.find(c => Math.abs(c.h - c1.h) > 80 && Math.abs(c.h - c2.h) > 30) || { h: (c1.h + 150) % 360, s: 75, l: 50 };
              const c4 = { h: (c2.h + 60) % 360, s: 85, l: 62 };
              applyPalette({
                c1: `hsl(${c1.h}, ${Math.max(c1.s, 65)}%, ${Math.min(Math.max(c1.l, 42), 65)}%)`,
                c2: `hsl(${c2.h}, ${Math.max(c2.s, 60)}%, ${Math.min(Math.max(c2.l, 45), 65)}%)`,
                c3: `hsl(${c3.h}, ${Math.max(c3.s, 55)}%, ${Math.min(Math.max(c3.l, 40), 60)}%)`,
                c4: `hsl(${c4.h}, ${Math.max(c4.s, 70)}%, 58%)`,
                accent: `hsl(${c1.h}, ${c1.s}%, 55%)`,
                glow: `hsla(${c1.h}, ${c1.s}%, 55%, 0.28)`,
                softGlow: `hsla(${c2.h}, ${c2.s}%, 55%, 0.16)`
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
      document.body.classList.remove('spotify-ambient-active');
      document.body.classList.remove('spotify-playing');
      root.removeProperty('--spotify-aurora-1');
      root.removeProperty('--spotify-aurora-2');
      root.removeProperty('--spotify-aurora-3');
      root.removeProperty('--spotify-aurora-4');
      root.removeProperty('--spotify-ambient-accent');
      root.removeProperty('--spotify-ambient-glow');
      root.removeProperty('--spotify-aurora-glow-soft');
    }

    return () => {
      document.body.classList.remove('spotify-ambient-active');
      document.body.classList.remove('spotify-playing');
    };
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
      {/* Full-site Spotify Ambient Natural Colorshifting Aurora */}
      <div className={`spotify-ambient-aurora-canvas ${currentTrack.isPlaying ? 'spotify-playing' : ''}`} aria-hidden="true">
        <div className="aurora-beam aurora-beam--top" />
        <div className="aurora-beam aurora-beam--mid" />
        <div className="aurora-beam aurora-beam--bottom" />
        <div className="aurora-beam aurora-beam--shimmer" />
      </div>

      {minimized ? (
        <button
          className="np-dock"
          onClick={toggleMinimized}
          aria-label="Expand Spotify widget"
          title="Show Now Playing"
        >
          <SpotifyIcon size={16} />
          <Waveform isPlaying={currentTrack.isPlaying} />
        </button>
      ) : (
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

            {/* Album art */}
            <div className="np-art-wrap">
              {currentTrack.albumArt && !imgError ? (
                <img
                  src={currentTrack.albumArt}
                  alt={currentTrack.album || currentTrack.title}
                  className="np-art"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="np-art np-art--placeholder">
                  <SpotifyIcon size={24} />
                </div>
              )}
              {currentTrack.isPlaying && (
                <div className="np-art-overlay">
                  <Waveform isPlaying />
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="np-info">
              <div className="np-status-row">
                <span className={`np-status-dot ${currentTrack.isPlaying ? 'np-status-dot--live' : ''}`} />
                <span className="np-status-text">
                  {currentTrack.isPlaying ? 'NOW PLAYING' : 'LAST PLAYED'}
                </span>
                <span className="np-via">via Spotify</span>
                <button
                  className="np-btn-min"
                  onClick={toggleMinimized}
                  aria-label="Minimise Spotify widget"
                  title="Minimise"
                >
                  &minus;
                </button>
              </div>

              <a
                href={currentTrack.songUrl || 'https://open.spotify.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="np-title"
                title={`${currentTrack.title} on Spotify`}
              >
                {currentTrack.title}
              </a>

              <p className="np-artist">{currentTrack.artist}</p>

              {/* Progress bar */}
              <div className="np-progress-bar-wrap">
                <div className="np-progress-bar">
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

              {/* Preview Audio player if Spotify gives a 30s preview */}
              {currentTrack.previewUrl && (
                <div className="np-preview-wrap">
                  <audio ref={audioRef} src={currentTrack.previewUrl} onEnded={() => setPreviewPlaying(false)} />
                  <button className="np-preview-btn" onClick={togglePreview}>
                    {previewPlaying ? 'Pause Sample ⏸' : 'Listen Sample ▶'}
                  </button>
                </div>
              )}
            </div>

            {/* Spotify brand link */}
            <a
              href={currentTrack.songUrl || 'https://open.spotify.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="np-spotify-link"
              aria-label="Open on Spotify"
            >
              <SpotifyIcon size={20} />
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default NowPlaying;
