import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Photography.css';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiInstagram, FiZoomIn, FiCamera, FiAperture, FiClock, FiSun } from 'react-icons/fi';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';
import { client, urlFor } from '../sanity';
import { useStory } from '../contexts/StoryContext';

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_PHOTOS = [
  { src: photo1, alt: 'Urban Landscape', caption: 'City Geometry', category: 'Urban' },
  { src: photo2, alt: 'Portrait Shot',   caption: 'Golden Portrait', category: 'Portrait' },
  { src: photo3, alt: 'Nature Capture',  caption: 'Nature Silence', category: 'Nature' },
];

/* Duration (seconds) for one full marquee loop */
const MARQUEE_DURATION = 22;

/* ─── EXIF formatter helpers ─── */
const fmt = {
  aperture:    (v) => v ? `f/${Number(v).toFixed(1)}` : null,
  shutter:     (v) => {
    if (!v) return null;
    if (v >= 1) return `${v}s`;
    const denom = Math.round(1 / v);
    return `1/${denom}s`;
  },
  iso:         (v) => v ? `ISO ${v}` : null,
  focal:       (v) => v ? `${Math.round(v)}mm` : null,
  camera:      (make, model) => {
    if (!make && !model) return null;
    // Avoid duplicating brand name (e.g. "Canon Canon EOS R")
    const m = model || '';
    return make && !m.startsWith(make) ? `${make} ${m}`.trim() : m.trim();
  },
  date:        (v) => {
    if (!v) return null;
    try {
      return new Date(v).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    } catch { return null; }
  },
};

/* Lazily import exifr only when needed */
let exifrModule = null;
const getExifr = async () => {
  if (!exifrModule) exifrModule = (await import('exifr')).default;
  return exifrModule;
};

/* Parse EXIF from a URL, return a clean object */
const parseExif = async (src) => {
  try {
    const exifr = await getExifr();
    const raw = await exifr.parse(src, {
      tiff: true, exif: true, gps: true,
      translateValues: true, translateKeys: true,
    });
    if (!raw) return null;
    return {
      camera:   fmt.camera(raw.Make, raw.Model),
      aperture: fmt.aperture(raw.FNumber),
      shutter:  fmt.shutter(raw.ExposureTime),
      iso:      fmt.iso(raw.ISO),
      focal:    fmt.focal(raw.FocalLength),
      date:     fmt.date(raw.DateTimeOriginal || raw.DateTime),
      lensModel: raw.LensModel || null,
    };
  } catch (e) {
    return null;
  }
};

/* ─── Single marquee track ─── */
const MarqueeTrack = ({ photos, reverse = false, onPhotoClick }) => {
  const tiles = [...photos, ...photos, ...photos, ...photos];
  return (
    <div className="marquee-viewport">
      <div
        className={`marquee-track ${reverse ? 'marquee-reverse' : ''}`}
        style={{ animationDuration: `${MARQUEE_DURATION}s` }}
      >
        {tiles.map((photo, i) => (
          <MarqueeCard key={i} photo={photo} onClick={() => onPhotoClick(photo)} />
        ))}
      </div>
    </div>
  );
};

/* ─── Individual card with lazy EXIF snippet ─── */
const MarqueeCard = ({ photo, onClick }) => {
  const [exif, setExif] = useState(null);
  const [hovered, setHovered] = useState(false);

  /* Only fetch EXIF on first hover to avoid hammering on load */
  const handleEnter = useCallback(async () => {
    setHovered(true);
    if (!exif && photo.src) {
      const data = await parseExif(photo.src);
      setExif(data);
    }
  }, [exif, photo.src]);

  return (
    <div
      className="marquee-card"
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
      <div className="marquee-overlay">
        <span className="marquee-category">{photo.category}</span>
        <span className="marquee-caption">{photo.caption}</span>

        {/* Mini EXIF strip on hover */}
        {hovered && exif && (
          <div className="marquee-exif-strip">
            {exif.aperture && <span>{exif.aperture}</span>}
            {exif.shutter  && <span>{exif.shutter}</span>}
            {exif.iso      && <span>{exif.iso}</span>}
            {exif.focal    && <span>{exif.focal}</span>}
          </div>
        )}

        <FiZoomIn className="marquee-zoom" size={18} />
      </div>
    </div>
  );
};

/* ─── Full EXIF panel inside Lightbox ─── */
const ExifPanel = ({ src }) => {
  const [exif, setExif] = useState(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    parseExif(src).then(data => { if (!cancelled) setExif(data); });
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    if (exif) {
      gsap.fromTo('.exif-panel', 
        { opacity: 0, y: 12 }, 
        { opacity: 1, y: 0, duration: 0.35, delay: 0.2, ease: 'power2.out' }
      );
    }
  }, [exif]);

  if (exif === undefined) return <div className="exif-loading">Reading EXIF…</div>;
  if (!exif) return null;

  const rows = [
    { icon: <FiCamera />,   label: 'Camera',   value: exif.camera },
    { icon: <FiAperture />, label: 'Aperture', value: exif.aperture },
    { icon: <FiClock />,    label: 'Shutter',  value: exif.shutter },
    { icon: <FiSun />,      label: 'ISO',      value: exif.iso },
    { icon: <FiCamera />,   label: 'Focal',    value: exif.focal },
    { icon: <FiCamera />,   label: 'Lens',     value: exif.lensModel },
    { icon: <FiClock />,    label: 'Date',     value: exif.date },
  ].filter(r => r.value);

  if (rows.length === 0) return null;

  return (
    <div className="exif-panel">
      {rows.map(r => (
        <div key={r.label} className="exif-row">
          <span className="exif-icon">{r.icon}</span>
          <span className="exif-label">{r.label}</span>
          <span className="exif-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Main Photography Section ─── */
const Photography = () => {
  const [lightbox,      setLightbox]      = useState(null);
  const [fetchedPhotos, setFetchedPhotos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('photography');

  useEffect(() => {
    client.fetch('*[_type == "photo"] | order(order asc)')
      .then(data => {
        if (data && data.length > 0) {
          setFetchedPhotos(data.map(item => ({
            src:      item.image ? urlFor(item.image).url() : photo1,
            alt:      item.title    || 'Photography',
            caption:  item.title    || 'Story',
            category: item.category || 'Visual',
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  const all = fetchedPhotos.length > 0 ? fetchedPhotos : FALLBACK_PHOTOS;

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(headerRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true } }
        );
      }
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out', scrollTrigger: { trigger: ctaRef.current, start: 'top 90%', once: true } }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="photography" id="photography" ref={sectionRef}>
      <div className="container">
        <div className="photo-header" ref={headerRef}>
          <span className="section-label">// through the lens</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Lens Work">
              <span className="section-title-inner">Visual <span>Stories</span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('photography')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            Photography is how I slow down and see the world differently — one frame at a time.
          </p>
        </div>
      </div>

      {/* Full-bleed marquee strips */}
      <div className="marquee-section">
        {loadingData ? (
          <div className="marquee-skeleton">
            {Array(6).fill(null).map((_, i) => <div key={i} className="marquee-skeleton-card" />)}
          </div>
        ) : (
          <>
            <MarqueeTrack photos={all} reverse={false} onPhotoClick={setLightbox} />
            <MarqueeTrack photos={all} reverse={true}  onPhotoClick={setLightbox} />
          </>
        )}
      </div>

      <div className="container">
        <div className="photo-ig-cta" ref={ctaRef}>
          <a href="https://instagram.com/zoomout_frames" target="_blank" rel="noopener noreferrer" className="btn-outline">
            <FiInstagram style={{ marginRight: '6px' }} /> See More on Instagram
          </a>
        </div>
      </div>

      {/* Lightbox rendered in Portal to escape stacking context */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {lightbox && (
            <motion.div
              className="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightbox(null)}
            >
              <div className="lightbox-content">
                <motion.img
                  src={lightbox.src}
                  alt={lightbox.alt}
                  className="lightbox-img"
                  onClick={e => e.stopPropagation()}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.32 }}
                />

                <div className="lightbox-footer" onClick={e => e.stopPropagation()}>
                  <div className="lightbox-meta">
                    <span className="lightbox-category">{lightbox.category}</span>
                    <span className="lightbox-caption">{lightbox.caption}</span>
                  </div>
                  <ExifPanel src={lightbox.src} />
                </div>
              </div>

              <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
};

export default Photography;
