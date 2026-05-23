import React, { useState, useEffect, Suspense, lazy } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PageLoader from './components/PageLoader';
import EasterEggOverlay from './components/EasterEggOverlay';
import { StoryProvider } from './contexts/StoryContext';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Lazy load heavy components
const NowPlaying = lazy(() => import('./components/NowPlaying'));
const MiniAdhy   = lazy(() => import('./components/MiniAdhy'));

// Lazy load below-the-fold components
const About       = lazy(() => import('./components/About'));
const Skills      = lazy(() => import('./components/Skills'));
const Experience  = lazy(() => import('./components/Experience'));
const GitHubStats = lazy(() => import('./components/GitHubStats'));
const Photography = lazy(() => import('./components/Photography'));
const MyWorks     = lazy(() => import('./components/MyWorks'));
const Achievements = lazy(() => import('./components/Achievements'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const TrustedBy   = lazy(() => import('./components/TrustedBy'));
const Contact     = lazy(() => import('./components/Contact'));
const Footer      = lazy(() => import('./components/Footer'));
const CallToAction = lazy(() => import('./components/CallToAction'));
const QuoteCanvas = lazy(() => import('./components/QuoteCanvas'));
const CustomCursor = lazy(() => import('./components/CustomCursor'));
const ScrollProgress = lazy(() => import('./components/ScrollProgress'));
const ZipGame       = lazy(() => import('./components/ZipGame'));
const TicTacToe   = lazy(() => import('./components/TicTacToe'));

function LazySection({ children }) {
  const [inView, setInView] = useState(false);
  const ref = React.useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' } // Pre-load 600px before scroll
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="lazy-section-container" style={{ minHeight: inView ? 'auto' : '100vh' }}>
      {inView && <Suspense fallback={<div className="lazy-loading-skeleton" />}>{children}</Suspense>}
    </div>
  );
}

function App() {
  const [showGame, setShowGame]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [activeEgg, setActiveEgg] = useState(null);
  const [isMobile, setIsMobile]   = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    // launch-ttt event (from logo 5-click easter egg)
    const handleLaunch = () => setShowGame(true);
    window.addEventListener('launch-ttt', handleLaunch);

    // Konami code → barrel roll
    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let ki = 0;
    const keydownHandler = (e) => {
      if (e.key === konami[ki]) {
        ki++;
        if (ki === konami.length) {
          triggerEgg('barrelroll', 1800);
          ki = 0;
        }
      } else { ki = 0; }
    };
    window.addEventListener('keydown', keydownHandler);

    // Generic egg trigger — detail is { name, duration }
    const eggHandler = (e) => {
      const name = e.detail?.name ?? e.detail; // backwards-compat if detail is just a string
      const duration = e.detail?.duration ?? (name === 'matrix' ? 8000 : name === 'party' ? 6000 : name === 'barrelroll' ? 1800 : name === 'thanos' ? 15000 : 4000);
      triggerEgg(name, duration);
    };
    window.addEventListener('trigger-egg', eggHandler);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('launch-ttt', handleLaunch);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('trigger-egg', eggHandler);
    };
  }, []);

  const triggerEgg = (name, duration = 5000) => {
    setActiveEgg(name);
    setTimeout(() => setActiveEgg(null), duration);
  };

  return (
    <StoryProvider>
      <div className={`App ${activeEgg ? `egg-${activeEgg}` : ''}`}>

      <Suspense fallback={null}>
        <CustomCursor />
        <ScrollProgress />
      </Suspense>
      {loading && <PageLoader onDone={() => setLoading(false)} />}

      {/* Ambient background blobs — desktop only */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />

      <Navbar />
      <Hero />

      {/* Lazy load sections ONLY when near viewport to save LCP/FCP */}
      <LazySection><About /></LazySection>
      <LazySection><Skills /></LazySection>
      <LazySection><Experience /></LazySection>
      <LazySection><GitHubStats /></LazySection>
      <LazySection><TrustedBy /></LazySection>
      <LazySection><MyWorks /></LazySection>
      <LazySection><Photography /></LazySection>
      <LazySection><Achievements /></LazySection>
      <LazySection><Testimonials /></LazySection>
      <LazySection><CallToAction /></LazySection>
      <LazySection><Contact /></LazySection>
      <LazySection><QuoteCanvas /></LazySection>
      <LazySection><Footer /></LazySection>

      {/* Easter egg overlay — outside Suspense so it is never hidden by a fallback */}
      <EasterEggOverlay egg={activeEgg} />

      {/* Spotify & Chatbot — Lazy loaded to save Main Thread execution time */}
      <Suspense fallback={null}>
        <NowPlaying />
        <MiniAdhy />
      </Suspense>

      {/* Easter egg games — outside Suspense */}
      {showGame && (
        isMobile ? (
          <ZipGame onClose={() => setShowGame(false)} />
        ) : (
          <TicTacToe onClose={() => setShowGame(false)} />
        )
      )}

      <SpeedInsights />
      </div>
    </StoryProvider>
  );
}

export default App;
