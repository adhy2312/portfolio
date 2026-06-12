import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Photography.css';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiInstagram, FiZoomIn, FiCamera, FiAperture, FiClock, FiSun, FiPenTool } from 'react-icons/fi';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';
import { client, urlFor } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import ExpertDoc from './ExpertDoc';

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_PHOTOS = [
  { src: photo1, alt: 'Urban Landscape', caption: 'City Geometry', category: 'Photography' },
  { src: photo2, alt: 'Portrait Shot',   caption: 'Golden Portrait', category: 'Photography' },
  { src: photo3, alt: 'Brand Identity',  caption: 'Minimalist Branding', category: 'Design' },
  { src: photo1, alt: 'App UI',          caption: 'Fintech Dashboard', category: 'UI/UX' },
  { src: photo2, alt: 'Web Design',      caption: 'E-commerce Redesign', category: 'Web Design' },
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
  // 2x duplication is the minimum needed for seamless loop — was 4x causing 80+ DOM nodes
  const tiles = [...photos, ...photos];
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
      className="marquee-card viewfinder-target"
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

/* ─── Glass Toggle Component ─── */
const GlassToggle = ({ activeTab, setActiveTab }) => {
  const toggleRef = useRef(null);
  const pillRef = useRef(null);
  const photoTextRef = useRef(null);
  const designTextRef = useRef(null);

  const handleToggle = (tab) => {
    if (tab === activeTab) return;
    
    // Smooth liquid squeeze down
    gsap.timeline()
      .to(toggleRef.current, { scale: 0.97, duration: 0.15, ease: "power2.in" })
      .to(toggleRef.current, { scale: 1, duration: 0.5, ease: "power4.out" });
    
    // Smooth Pill sliding
    gsap.to(pillRef.current, {
      x: tab === 'photography' ? 0 : '100%',
      duration: 0.5,
      ease: "power4.inOut"
    });

    // Icon pop
    if (tab === 'photography') {
       gsap.fromTo(photoTextRef.current, { scale: 0.85, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.2)", delay: 0.1 });
       gsap.to(designTextRef.current, { scale: 0.9, opacity: 0.5, duration: 0.3 });
    } else {
       gsap.fromTo(designTextRef.current, { scale: 0.85, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.2)", delay: 0.1 });
       gsap.to(photoTextRef.current, { scale: 0.9, opacity: 0.5, duration: 0.3 });
    }
    
    setActiveTab(tab);
  };

  useEffect(() => {
    // Initial state setup for text refs
    if (activeTab === 'photography') {
      gsap.set(photoTextRef.current, { scale: 1, opacity: 1 });
      gsap.set(designTextRef.current, { scale: 0.9, opacity: 0.5 });
      gsap.set(pillRef.current, { x: 0 });
    } else {
      gsap.set(designTextRef.current, { scale: 1, opacity: 1 });
      gsap.set(photoTextRef.current, { scale: 0.9, opacity: 0.5 });
      gsap.set(pillRef.current, { x: '100%' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="glass-toggle-container">
      <div 
        className="glass-toggle-wrapper" 
        ref={toggleRef}
      >
        <div className="glass-toggle">
          
          <div className="glass-toggle-pill-container">
            <div 
              className={`glass-toggle-pill ${activeTab === 'photography' ? 'photo-active' : 'design-active'}`}
              ref={pillRef}
            >
              <div className="pill-inner-glow" />
            </div>
          </div>

          <div className="glass-toggle-divider" />

          <button 
            className={`glass-toggle-btn ${activeTab === 'photography' ? 'active' : ''}`}
            onClick={() => handleToggle('photography')}
          >
            <div className="btn-content" ref={photoTextRef}>
              <FiCamera className="glass-toggle-icon" />
              <span>Photography</span>
            </div>
          </button>

          <button 
            className={`glass-toggle-btn ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => handleToggle('design')}
          >
            <div className="btn-content" ref={designTextRef}>
              <FiPenTool className="glass-toggle-icon" />
              <span>Design</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Photography Section ─── */
const Photography = () => {
  const [activeTab, setActiveTab] = useState('photography'); // 'photography' | 'design'
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
            src:      item.image ? urlFor(item.image).width(800).quality(90).auto('format').url() : photo1,
            fullSrc:  item.image ? urlFor(item.image).width(2000).quality(100).auto('format').url() : photo1,
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

  const currentPhotos = useMemo(() => {
    return all.filter(p => {
      const cat = p.category?.toLowerCase() || '';
      // Due to the DB value inversion to fix previous data entry mixup:
      // Value 'design' actually means Photography.
      // Value 'photography' actually means Design.
      const isActuallyPhoto = cat.includes('design');
      return activeTab === 'photography' ? isActuallyPhoto : !isActuallyPhoto;
    });
  }, [all, activeTab]);

  const displayPhotos = currentPhotos.length > 0 ? currentPhotos : all;

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
      
      // The Darkroom Cinematic Scroll Effect
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 40%",
        end: "bottom 60%",
        onEnter: () => document.body.classList.add('darkroom-active'),
        onLeave: () => document.body.classList.remove('darkroom-active'),
        onEnterBack: () => document.body.classList.add('darkroom-active'),
        onLeaveBack: () => document.body.classList.remove('darkroom-active'),
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Dominant color extraction for Lightbox
  const [lightboxGlow, setLightboxGlow] = useState('rgba(0,0,0,0.5)');

  useEffect(() => {
    if (!lightbox) {
      setLightboxGlow('rgba(0,0,0,0.5)');
      return;
    }
    
    // Tiny fast color extractor
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = lightbox.src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const pixels = data.length / 4;
        setLightboxGlow(`rgba(${~~(r / pixels)}, ${~~(g / pixels)}, ${~~(b / pixels)}, 0.4)`);
      } catch (e) {
        setLightboxGlow('rgba(0,0,0,0.5)');
      }
    };
  }, [lightbox]);

  return (
    <section className="photography" id="photography" ref={sectionRef}>
      <ExpertDoc 
        title="Photography.js"
        notes="Cinematic visual rendering engine."
        data={{
          'componentLayout': 'Neo-Brutalist CSS Grid',
          'exifEngine': 'exifr (lazy loaded)',
          'colorExtraction': 'Custom Canvas Pixel Averaging',
          'scrollFX': 'GSAP Darkroom Vignette',
          'performance': 'CSS Transforms + Auto-throttling'
        }}
      />
      <div className="container">
        <div className="photo-header" ref={headerRef}>
          <span className="section-label">{"// visual & creative"}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Lens & Canvas">
              <span className="section-title-inner">Photography & <span>Design</span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('photography')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            Capturing the world through my lens and crafting digital experiences through design.
          </p>
          <GlassToggle activeTab={activeTab} setActiveTab={setActiveTab} />
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
            <MarqueeTrack photos={displayPhotos} reverse={false} onPhotoClick={setLightbox} />
            <MarqueeTrack photos={displayPhotos} reverse={true}  onPhotoClick={setLightbox} />
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
              style={{ '--lightbox-glow': lightboxGlow }}
            >
              <div className="lightbox-content viewfinder-target">
                <motion.img
                  src={lightbox.fullSrc || lightbox.src}
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
