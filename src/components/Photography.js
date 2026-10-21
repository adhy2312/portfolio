import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './Photography.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCamera, 
  FiPenTool, 
  FiChevronLeft, 
  FiChevronRight, 
  FiGrid, 
  FiMaximize2, 
  FiMinimize2, 
  FiVolume2, 
  FiVolumeX, 
  FiInstagram, 
  FiCheck,
  FiArrowUpRight,
  FiExternalLink
} from 'react-icons/fi';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import { client, urlFor } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import ExpertDoc from './ExpertDoc';

/* ── Fallback items if Sanity is offline ── */
const FALLBACK_PHOTOS = [
  { 
    src: photo1, 
    alt: 'Urban Landscape', 
    title: 'City Geometry', 
    category: 'Photography',
    rawCategory: 'Portraits',
    specs: { camera: 'Leica M11', lens: '35mm Summicron-M f/2', shutter: '1/1000s', aperture: 'f/2.8', iso: 'ISO 100', ev: '+0.3' }
  },
  { 
    src: photo2, 
    alt: 'Portrait Shot', 
    title: 'Golden Portrait', 
    category: 'Photography',
    rawCategory: 'Portraits',
    specs: { camera: 'Canon EOS R', lens: '85mm f/1.4L USM', shutter: '1/320s', aperture: 'f/1.4', iso: 'ISO 200', ev: '0.0' }
  }
];

/* ── Mechanical Shutter Sound Generator via Web Audio API (0 externals, ~0 weight) ── */
const playMechanicalShutter = (soundEnabled) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    // 1. Shutter blade snap (fast pitch drop)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);

    // 2. High-precision mechanical curtain noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime + 0.005);
  } catch (e) {
    // Audio autoplay restrictions silently caught
  }
};

/* ── Film Simulation LUT Presets (pure CSS filter transforms) ── */
const FILM_SIMULATIONS = [
  { id: 'standard', name: 'Standard Raw', filter: 'none', temp: '5500K' },
  { id: 'portra', name: 'Portra 400', filter: 'contrast(1.08) saturate(1.15) sepia(0.08) brightness(1.02)', temp: '5200K' },
  { id: 'monochrom', name: 'Leica Monochrom', filter: 'grayscale(1) contrast(1.35) brightness(0.96)', temp: 'B&W' },
  { id: 'cinestill', name: 'CineStill 800T', filter: 'contrast(1.12) saturate(1.22) hue-rotate(-8deg) brightness(1.03)', temp: '3200K' },
  { id: 'velvia', name: 'Velvia 50', filter: 'contrast(1.2) saturate(1.35) brightness(1.01)', temp: '5600K' },
];

/* ── Photography & Design Viewfinder Component ── */
const Photography = () => {
  const [activeTab, setActiveTab] = useState('photography'); // 'photography' | 'design'
  const [fetchedPhotos, setFetchedPhotos] = useState([]);
  const [fetchedDesigns, setFetchedDesigns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeFilmSim, setActiveFilmSim] = useState('standard');
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [copiedHex, setCopiedHex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShutterFiring, setIsShutterFiring] = useState(false);

  const viewfinderRef = useRef(null);
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('photography');

  // Fetch real images from Sanity for both photo and design
  useEffect(() => {
    // 1. Fetch photography from Sanity 'photo' schema
    client
      .fetch('*[_type == "photo" && !(_id in path("drafts.**")) && defined(image)] | order(order asc, _createdAt desc)')
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((item, idx) => {
            const rawCat = (item.category || '').toLowerCase();

            // Optical EXIF specs: use direct Sanity values or realistic genre heuristics
            let specs = {
              camera: item.camera || 'Canon EOS R',
              lens: item.lens || '50mm f/1.8 STM',
              shutter: item.shutter || '1/500s',
              aperture: item.aperture || 'f/2.0',
              iso: item.iso || 'ISO 200',
              ev: '+0.0'
            };
            if (!item.camera && rawCat.includes('portrait')) {
              specs = { camera: 'Canon EOS R', lens: '85mm f/1.4L USM', shutter: '1/320s', aperture: 'f/1.4', iso: 'ISO 100', ev: '+0.3' };
            } else if (!item.camera && (rawCat.includes('auto') || rawCat.includes('offroad') || rawCat.includes('street'))) {
              specs = { camera: 'Canon EOS R', lens: '35mm f/1.8 IS Macro', shutter: '1/1250s', aperture: 'f/2.8', iso: 'ISO 400', ev: '-0.3' };
            } else if (!item.camera && (rawCat.includes('nature') || rawCat.includes('wildlife'))) {
              specs = { camera: 'Canon EOS R', lens: '70-200mm f/2.8L', shutter: '1/800s', aperture: 'f/2.8', iso: 'ISO 320', ev: '+0.0' };
            } else if (!item.camera && rawCat.includes('event')) {
              specs = { camera: 'Canon EOS R', lens: '24-70mm f/2.8L II', shutter: '1/250s', aperture: 'f/2.8', iso: 'ISO 800', ev: '+0.0' };
            }

            return {
              _id: item._id,
              src: urlFor(item.image).width(1600).quality(92).auto('format').url(),
              thumb: urlFor(item.image).width(160).height(120).fit('crop').quality(75).auto('format').url(),
              fullSrc: urlFor(item.image).width(2400).quality(98).auto('format').url(),
              title: item.title || `Visual Frame #${idx + 1}`,
              category: 'Photography',
              rawCategory: item.category || 'Portraits',
              specs
            };
          });
          setFetchedPhotos(mapped);
        }
      })
      .catch((err) => console.error('Failed to load photos from Sanity:', err));

    // 2. Fetch designs from Sanity 'design' schema (newly decoupled)
    client
      .fetch('*[_type == "design" && !(_id in path("drafts.**")) && defined(image)] | order(order asc, _createdAt desc)')
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((item, idx) => ({
            _id: item._id,
            src: urlFor(item.image).width(1600).quality(92).auto('format').url(),
            thumb: urlFor(item.image).width(160).height(120).fit('crop').quality(75).auto('format').url(),
            fullSrc: urlFor(item.image).width(2400).quality(98).auto('format').url(),
            title: item.title || `Design Artboard #${idx + 1}`,
            subtitle: item.subtitle || '',
            category: 'Design',
            rawCategory: item.category || 'Mobile UI/UX',
            figmaLink: item.figmaLink || null,
            caseStudy: item.caseStudy || null,
            designSpecs: {
              artboard: item.artboard || '1920 × 1080px',
              tool: item.tool || 'Figma',
              colors: (Array.isArray(item.colors) && item.colors.length > 0) ? item.colors : ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#f8fafc'],
              typography: item.typography || 'Inter / Modern Sans',
              type: item.category || 'Digital Product Design'
            }
          }));
          setFetchedDesigns(mapped);
        }
      })
      .catch((err) => console.error('Failed to load designs from Sanity:', err));
  }, []);

  // Items based on active tab:
  // - photography: fetchedPhotos (or fallback if offline)
  // - design: fetchedDesigns (returns empty array if no designs uploaded yet)
  const items = useMemo(() => {
    if (activeTab === 'photography') {
      return fetchedPhotos.length > 0 ? fetchedPhotos : FALLBACK_PHOTOS;
    } else {
      return fetchedDesigns;
    }
  }, [fetchedPhotos, fetchedDesigns, activeTab]);

  // Reset index when switching tabs
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  const activeItem = items[currentIndex] || items[0] || null;

  // Navigation handlers with mechanical shutter animation
  const handleNext = useCallback(() => {
    playMechanicalShutter(soundEnabled);
    setIsShutterFiring(true);
    setTimeout(() => setIsShutterFiring(false), 80);
    if (items.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  }, [items.length, soundEnabled]);

  const handlePrev = useCallback(() => {
    playMechanicalShutter(soundEnabled);
    setIsShutterFiring(true);
    setTimeout(() => setIsShutterFiring(false), 80);
    if (items.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }
  }, [items.length, soundEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only capture when viewfinder is in viewport or focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // 3D Optical Lens Tilt & Parallax (Pure GPU CSS variables, 0 React re-renders)
  const handleMouseMove = useCallback((e) => {
    if (!viewfinderRef.current) return;
    const rect = viewfinderRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    viewfinderRef.current.style.setProperty('--lens-tilt-x', `${(-y * 6).toFixed(2)}deg`);
    viewfinderRef.current.style.setProperty('--lens-tilt-y', `${(x * 6).toFixed(2)}deg`);
    viewfinderRef.current.style.setProperty('--glare-x', `${(45 + x * 35).toFixed(1)}%`);
    viewfinderRef.current.style.setProperty('--glare-y', `${(35 + y * 35).toFixed(1)}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!viewfinderRef.current) return;
    viewfinderRef.current.style.setProperty('--lens-tilt-x', '0deg');
    viewfinderRef.current.style.setProperty('--lens-tilt-y', '0deg');
    viewfinderRef.current.style.setProperty('--glare-x', '35%');
    viewfinderRef.current.style.setProperty('--glare-y', '25%');
  }, []);

  // Copy hex swatch
  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!viewfinderRef.current) return;
    if (!document.fullscreenElement) {
      viewfinderRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <section className="photography-section" id="photography">
      <ExpertDoc 
        title="Photography.js"
        notes="Ultra-Low-Load Interactive Leica/Hasselblad Viewfinder HUD & Artboard Inspector. Single-active DOM frame with zero infinite marquee GPU tax."
        data={{
          'DOM Footprint': '1 active master frame + thumbstrip',
          'Optics HUD': 'Rangefinder reticle + Live EXIF meter',
          'Color Engine': 'CSS LUT Film Simulations (Portra, Monochrom, CineStill)',
          'Sound Architecture': 'Procedural Web Audio API mechanical shutter (<1ms)',
          'Memory Management': 'Predictive Single Buffer'
        }}
      />

      <div className="container">
        {/* Section Header */}
        <div className="photo-viewfinder-header">
          <span className="section-label">{"// visual & creative optics"}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Rangefinder HUD">
              <span className="section-title-inner">
                {activeTab === 'photography' ? 'Photography ' : 'Design '}
                <span>Viewfinder</span>
              </span>
            </h2>
            {hasStory && (
              <button 
                className="story-btn" 
                onClick={() => openStory('photography')} 
                aria-label="Read story behind this section"
              >
                <span>✦</span> Behind The Lens
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            An ultra-light, tactile rangefinder interface showcasing visual storytelling with zero browser bloat.
          </p>

          {/* Mode Switcher Pills (Photography vs Design) */}
          <div className="viewfinder-mode-pills">
            <button
              className={`mode-pill ${activeTab === 'photography' ? 'active' : ''}`}
              onClick={() => setActiveTab('photography')}
              aria-label="Switch to Photography Rangefinder"
            >
              <FiCamera className="pill-icon" />
              <span>Camera Rangefinder</span>
              <span className="pill-count">
                {fetchedPhotos.length > 0 ? `${fetchedPhotos.length} frames` : 'Film Vault'}
              </span>
            </button>
            <button
              className={`mode-pill ${activeTab === 'design' ? 'active' : ''}`}
              onClick={() => setActiveTab('design')}
              aria-label="Switch to Design Artboard Inspector"
            >
              <FiPenTool className="pill-icon" />
              <span>Artboard Inspector</span>
              <span className="pill-count">
                {fetchedDesigns.length > 0 ? `${fetchedDesigns.length} artboards` : 'In Curation'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Main Camera Body / Viewfinder Console (with Interactive 3D Optical Glass Depth) ── */}
        <div 
          className={`rangefinder-console ${isFullscreen ? 'console-fullscreen' : ''}`} 
          ref={viewfinderRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Top Camera Status Strip */}
          <div className="camera-top-bar">
            <div className="camera-brand">
              <span className="leica-red-dot">●</span>
              <span className="brand-text">
                {activeTab === 'photography' ? 'LEICA M11-OPTICS' : 'FIGMA CANVAS STUDIO'}
              </span>
              <span className="shutter-mode-tag">
                {activeTab === 'photography' 
                  ? 'M [MANUAL]' 
                  : (items.length > 0 ? '2X RETINA' : 'AWAITING UPLOADS')}
              </span>
            </div>

            {/* Middle Quick Actions (Film Sim / Grid / Sound / Fullscreen) */}
            <div className="camera-quick-tools">
              {activeTab === 'photography' ? (
                <div className="film-sim-selector">
                  <span className="tool-label">FILM:</span>
                  {FILM_SIMULATIONS.map((sim) => (
                    <button
                      key={sim.id}
                      className={`film-sim-btn ${activeFilmSim === sim.id ? 'active' : ''}`}
                      onClick={() => setActiveFilmSim(sim.id)}
                      title={`${sim.name} (${sim.temp})`}
                    >
                      {sim.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="design-quick-meta">
                  <span className="design-badge">{activeItem?.designSpecs?.tool || 'Figma'}</span>
                  <span className="design-badge">{activeItem?.designSpecs?.artboard || 'Sanity Studio Ready'}</span>
                </div>
              )}

              <button
                className={`tool-btn ${showGridOverlay ? 'active' : ''}`}
                onClick={() => setShowGridOverlay(!showGridOverlay)}
                title="Toggle Viewfinder Grid Overlay"
                aria-label="Toggle Grid"
              >
                <FiGrid />
              </button>

              <button
                className={`tool-btn ${soundEnabled ? 'active' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Mechanical Shutter' : 'Enable Mechanical Shutter Sound'}
                aria-label="Toggle Sound"
              >
                {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
              </button>

              <button
                className="tool-btn"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen Optical View"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
            </div>

            {/* Frame Counter Display */}
            <div className="camera-counter">
              <span className="counter-icon">{activeTab === 'photography' ? 'EXP' : 'ART'}</span>
              <span className="counter-digits">
                {items.length > 0
                  ? `${String(currentIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`
                  : '00 / 00'}
              </span>
            </div>
          </div>

          {/* ── Optical Viewfinder Glass Frame (Single Rendered Image or Curated Empty State) ── */}
          <div className="viewfinder-optical-stage">
            {/* Multi-coated Optical Lens Glare & Chromatic Edge Reflection */}
            <div className="optical-lens-coating" />

            {/* Darkroom Shutter Blade Wipe Animation Layer */}
            <div className={`shutter-blade-overlay ${isShutterFiring ? 'blade-fire' : ''}`} />

            {/* Corner Rangefinder Frameline Reticles */}
            <div className="frameline top-left" />
            <div className="frameline top-right" />
            <div className="frameline bottom-left" />
            <div className="frameline bottom-right" />

            {/* Center Rangefinder Split-Prism Focus Marker */}
            <div className="rangefinder-center-reticle">
              <div className="reticle-circle" />
              <div className="reticle-cross" />
            </div>

            {/* Optional 3x3 Composition Grid */}
            {showGridOverlay && (
              <div className="rule-of-thirds-grid">
                <div className="grid-line horizontal h1" />
                <div className="grid-line horizontal h2" />
                <div className="grid-line vertical v1" />
                <div className="grid-line vertical v2" />
              </div>
            )}

            {/* Empty State for Design when no designs in Sanity yet */}
            {activeTab === 'design' && items.length === 0 ? (
              <div className="design-empty-state">
                <div className="empty-blueprint-grid" />
                <div className="empty-state-content">
                  <div className="empty-beacon-badge">
                    <span className="beacon-dot-pulse" />
                    <span className="beacon-text">STUDIO STATUS: CURATING NEW ARTBOARDS &amp; CASE STUDIES</span>
                  </div>

                  <div className="empty-icon-cluster">
                    <div className="empty-icon-box">
                      <FiPenTool className="main-empty-icon" />
                    </div>
                  </div>

                  <h3 className="empty-title">Digital Products &amp; Visual Systems</h3>
                  
                  <p className="empty-desc">
                    High-fidelity Figma prototypes, mobile UI flows, and tokenized design systems are currently being formatted and curated for live inspection.
                  </p>

                  <div className="design-pillars">
                    <span className="pillar-chip">✦ Mobile App UI/UX</span>
                    <span className="pillar-chip">✦ Design Systems</span>
                    <span className="pillar-chip">✦ Web Architecture</span>
                    <span className="pillar-chip">✦ Brand &amp; Identity</span>
                    <span className="pillar-chip">✦ 3D &amp; Motion</span>
                  </div>

                  <div className="empty-actions">
                    <a href="#projects" className="empty-action-primary">
                      <span>Explore Live Implementations</span>
                      <FiArrowUpRight />
                    </a>
                    <a href="#contact" className="empty-action-secondary">
                      <span>Request Figma Walkthrough</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : activeItem ? (
              /* The Active High-Res Image Frame (Only ONE in DOM at a time) */
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeTab}-${currentIndex}-${activeItem.src}`}
                    className="active-frame-wrapper"
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.015 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    <img
                      src={activeItem.src}
                      alt={activeItem.title || 'Portfolio Work'}
                      className="active-viewfinder-img"
                      style={{
                        filter: FILM_SIMULATIONS.find((s) => s.id === activeFilmSim)?.filter || 'none'
                      }}
                      loading="eager"
                      decoding="async"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Frame Caption Tag (Floating Glass Label) */}
                <div className="optical-frame-label">
                  <span className="label-category">{activeItem.rawCategory || activeItem.category}</span>
                  <span className="label-title">{activeItem.title}</span>
                  {activeItem.figmaLink && (
                    <a
                      href={activeItem.figmaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label-figma-link"
                      title="Open Live Figma / Prototype"
                    >
                      <FiExternalLink /> Live Link
                    </a>
                  )}
                </div>
              </>
            ) : null}

            {/* Left / Right Tactile Controls */}
            {items.length > 1 && (
              <>
                <button
                  className="viewfinder-nav-arrow arrow-prev"
                  onClick={handlePrev}
                  aria-label="Previous Frame (Arrow Left)"
                >
                  <FiChevronLeft size={24} />
                </button>
                <button
                  className="viewfinder-nav-arrow arrow-next"
                  onClick={handleNext}
                  aria-label="Next Frame (Arrow Right)"
                >
                  <FiChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* ── Bottom Rangefinder Instrument Readout Cluster ── */}
          <div className="camera-instrument-cluster">
            {activeTab === 'photography' ? (
              <>
                {/* Live Exposure Metering Scale */}
                <div className="exposure-meter-group">
                  <div className="meter-label">EXPOSURE COMP</div>
                  <div className="exposure-scale">
                    <span>-2</span>
                    <span className="dot">•</span>
                    <span>-1</span>
                    <span className="dot">•</span>
                    <span className="center-zero">0</span>
                    <span className="dot">•</span>
                    <span>+1</span>
                    <span className="dot">•</span>
                    <span>+2</span>
                    <div 
                      className="meter-needle-pip" 
                      style={{ 
                        left: activeItem?.specs?.ev === '+0.3' ? '58%' : activeItem?.specs?.ev === '-0.3' ? '42%' : '50%' 
                      }} 
                    />
                  </div>
                </div>

                {/* Tactical HUD Optical Readouts */}
                <div className="optical-readouts">
                  <div className="readout-item">
                    <span className="readout-key">SHUTTER</span>
                    <span className="readout-val">{activeItem?.specs?.shutter || '1/500s'}</span>
                  </div>
                  <div className="readout-item">
                    <span className="readout-key">APERTURE</span>
                    <span className="readout-val">{activeItem?.specs?.aperture || 'f/2.0'}</span>
                  </div>
                  <div className="readout-item">
                    <span className="readout-key">ISO</span>
                    <span className="readout-val">{activeItem?.specs?.iso || 'ISO 200'}</span>
                  </div>
                  <div className="readout-item hide-mobile">
                    <span className="readout-key">OPTICS</span>
                    <span className="readout-val">{activeItem?.specs?.lens || '50mm Prime'}</span>
                  </div>
                  <div className="readout-item hide-mobile">
                    <span className="readout-key">FOCUS PLANE</span>
                    <span className="readout-val" style={{ color: '#38bdf8' }}>
                      {activeItem?.rawCategory?.toLowerCase().includes('portrait')
                        ? '1.8m (Shallow)'
                        : activeItem?.rawCategory?.toLowerCase().includes('auto')
                        ? '4.2m (Zone)'
                        : activeItem?.rawCategory?.toLowerCase().includes('event')
                        ? '2.5m (Zone)'
                        : '∞ (Hyperfocal)'}
                    </span>
                  </div>
                </div>
              </>
            ) : items.length > 0 && activeItem ? (
              /* Design Studio Inspector Readout Cluster with active item */
              <div className="design-inspector-cluster">
                <div className="inspector-column">
                  <span className="readout-key">SPECS &amp; RESOLUTION</span>
                  <span className="readout-val">{activeItem.designSpecs?.artboard} • {activeItem.designSpecs?.type}</span>
                </div>
                <div className="inspector-column hide-mobile">
                  <span className="readout-key">TYPOGRAPHY SYSTEM</span>
                  <span className="readout-val">{activeItem.designSpecs?.typography}</span>
                </div>
                {/* Extracted Swatch Palette */}
                <div className="inspector-swatches">
                  <span className="readout-key">SWATCHES:</span>
                  <div className="swatch-list">
                    {(activeItem.designSpecs?.colors || ['#1e293b', '#6366f1', '#06b6d4']).map((hex) => (
                      <button
                        key={hex}
                        className="swatch-chip"
                        style={{ backgroundColor: hex }}
                        onClick={() => handleCopyHex(hex)}
                        title={`Copy ${hex}`}
                      >
                        {copiedHex === hex && <FiCheck className="swatch-check" />}
                      </button>
                    ))}
                  </div>
                  {copiedHex && <span className="copied-toast">Copied {copiedHex}!</span>}
                </div>
              </div>
            ) : (
              /* Design Studio Status Readout when awaiting uploads */
              <div className="design-inspector-cluster empty-inspector">
                <div className="inspector-column">
                  <span className="readout-key">STUDIO SCHEMA</span>
                  <span className="readout-val text-accent">sanity[_type == &quot;design&quot;]</span>
                </div>
                <div className="inspector-column hide-mobile">
                  <span className="readout-key">STACK / SUITE</span>
                  <span className="readout-val">Figma • Illustrator • Spline 3D</span>
                </div>
                <div className="inspector-column hide-mobile">
                  <span className="readout-key">PIPELINE STATUS</span>
                  <span className="readout-val text-amber">✦ Ready for Studio Upload</span>
                </div>
              </div>
            )}

            {/* Physical Shutter Release Trigger Button */}
            <div className="shutter-trigger-wrapper">
              <button
                className="mechanical-shutter-btn"
                onClick={handleNext}
                title="Trip Mechanical Shutter (Space / Click)"
              >
                <div className="shutter-inner-crown" />
              </button>
              <span className="shutter-legend">SHUTTER</span>
            </div>
          </div>

          {/* ── Minimal Film Contact Strip ── */}
          <div className="film-contact-strip">
            <div className="sprocket-holes-bar top" />
            {items.length > 0 ? (
              <div className="film-strip-track">
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    className={`film-frame-thumb ${idx === currentIndex ? 'active-frame' : ''}`}
                    onClick={() => {
                      setIsShutterFiring(true);
                      playMechanicalShutter(soundEnabled);
                      setTimeout(() => setIsShutterFiring(false), 80);
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Jump to Frame #${idx + 1}: ${item.title}`}
                  >
                    <span className="frame-num">{String(idx + 1).padStart(2, '0')}</span>
                    <img
                      src={item.thumb || item.src}
                      alt={item.title}
                      className="thumb-img"
                      loading="lazy"
                      decoding="async"
                    />
                    {idx === currentIndex && <div className="thumb-cursor-bracket" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="film-strip-empty">
                <span className="empty-strip-hint">
                  ✦ Ready for artboard uploads in Sanity Studio [schema: <code>design</code>]
                </span>
              </div>
            )}
            <div className="sprocket-holes-bar bottom" />
          </div>
        </div>

        {/* Instagram Link CTA */}
        <div className="photo-footer-cta">
          <a
            href="https://instagram.com/zoomout_frames"
            target="_blank"
            rel="noopener noreferrer"
            className="instagram-direct-btn"
          >
            <FiInstagram size={18} />
            <span>Curated Film Archive &amp; Behind The Scenes on @zoomout_frames</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Photography;
