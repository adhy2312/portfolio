import React, { useState, useEffect, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import { initGSAPScrollProxy, ScrollTrigger } from './hooks/useGSAPAnimations';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PageLoader from './components/PageLoader';
import EasterEggOverlay from './components/EasterEggOverlay';
import DigitalTextures from './components/DigitalTextures';
import { StoryProvider } from './contexts/StoryContext';
import { ConsciousnessProvider, useConsciousness } from './contexts/ConsciousnessContext';
import { SiteModeProvider, useSiteMode } from './contexts/SiteModeContext';
import AmbientThoughts from './components/AmbientThoughts';
import { useSolarLighting } from './hooks/useSolarLighting';
import DigitalSoul from './components/DigitalSoul';
import SiteModeSwitcher from './components/SiteModeSwitcher';
import RainDroplets from './components/RainDroplets';
import { SystemOrchestratorProvider } from './contexts/SystemOrchestrator';

// Lazy load heavy components
const NowPlaying = lazy(() => import('./components/NowPlaying'));
const MiniAdhy = lazy(() => import('./components/MiniAdhy'));

// Lazy load below-the-fold components
const About = lazy(() => import('./components/About'));
const Skills = lazy(() => import('./components/Skills'));
const Experience = lazy(() => import('./components/Experience'));
const NeuralMap = lazy(() => import('./components/NeuralMap'));
const Timeline = lazy(() => import('./components/Timeline'));
const DigitalScars = lazy(() => import('./components/DigitalScars'));
const Photography = lazy(() => import('./components/Photography'));
const MyWorks = lazy(() => import('./components/MyWorks'));
const Achievements = lazy(() => import('./components/Achievements'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const TrustedBy = lazy(() => import('./components/TrustedBy'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const CallToAction = lazy(() => import('./components/CallToAction'));
const QuoteCanvas = lazy(() => import('./components/QuoteCanvas'));
const CustomCursor = lazy(() => import('./components/CustomCursor'));
const ScrollProgress = lazy(() => import('./components/ScrollProgress'));
const ZipGame = lazy(() => import('./components/ZipGame'));
const TicTacToe = lazy(() => import('./components/TicTacToe'));
const StackVisualizer = lazy(() => import('./components/StackVisualizer'));
const GravityWell = lazy(() => import('./components/GravityWell'));
const DigitalSeed = lazy(() => import('./components/DigitalSeed'));

function LazySection({ name, children }) {
  const [inView, setInView] = useState(false);
  const ref = React.useRef();
  const { setActiveSection } = useConsciousness();
  const { isSectionVisible } = useSiteMode();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setActiveSection(name);
        }
      },
      { rootMargin: '-10% 0px -50% 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [name, setActiveSection]);

  useEffect(() => {
    const preloader = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          preloader.disconnect();
        }
      },
      { rootMargin: '600px' }
    );
    if (ref.current) preloader.observe(ref.current);
    return () => preloader.disconnect();
  }, []);

  // Mode-aware: hide sections not relevant to current mode
  if (!isSectionVisible(name)) return null;

  return (
    <div ref={ref} className="lazy-section-container" style={{ minHeight: inView ? 'auto' : '100vh' }} data-xray="[SYSTEM: LAZY_LOADER]&#10;Strategy: IntersectionObserver&#10;RootMargin: 600px&#10;Fallback: Skeleton UI">
      {inView && <Suspense fallback={<div className="lazy-loading-skeleton" />}>{children}</Suspense>}
    </div>
  );
}

// AppContent needs to be wrapped in Context providers so it can use hooks
function AppContent() {
  useSolarLighting();
  const { weatherData } = useConsciousness();
  const [showGame, setShowGame] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeEgg, setActiveEgg] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loadWidgets, setLoadWidgets] = useState(false);
  const [tranceMode, setTranceMode] = useState(false);

  // Late Night Loneliness Mode
  const hour = new Date().getHours();
  const isLateNight = hour < 5 || hour >= 23;

  useEffect(() => {
    // Lenis Premium Smooth Scrolling
    const lenis = new Lenis({
      lerp: 0.08,           // Premium buttery interpolation
      wheelMultiplier: 0.8, // Slightly resistant wheel for luxurious feel
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    // GSAP + Lenis Synchronization (butter-smooth scroll-triggered animations)
    initGSAPScrollProxy(lenis);

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    // launch-ttt event (from logo 5-click easter egg)
    const handleLaunch = () => setShowGame(true);
    window.addEventListener('launch-ttt', handleLaunch);

    // Konami code → barrel roll
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
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
      const name = e.detail?.name ?? e.detail;
      const duration = e.detail?.duration ?? (name === 'matrix' ? 8000 : name === 'party' ? 6000 : name === 'barrelroll' ? 1800 : name === 'thanos' ? 15000 : 4000);
      triggerEgg(name, duration);
    };
    window.addEventListener('trigger-egg', eggHandler);

    // Trance Mode listener
    const tranceHandler = () => {
      setTranceMode(prev => !prev);
    };
    window.addEventListener('trigger-trance', tranceHandler);


    // 2. Hacker Decode Reveal
    const hackerTexts = document.querySelectorAll('.section-title span, .section-label, .hacker-decode');
    const chars = "!<>-_\\\\/[]{}—=+*^?#________";
    const decodeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el.dataset.decoded) return;
          el.dataset.decoded = "true";

          const originalText = el.innerText || el.dataset.value;
          if (!el.dataset.value) el.dataset.value = originalText;

          let iteration = 0;
          const interval = setInterval(() => {
            el.innerText = originalText.split("").map((letter, index) => {
              if (index < iteration) return originalText[index];
              return chars[Math.floor(Math.random() * 26)] || "_";
            }).join("");
            if (iteration >= originalText.length) {
              clearInterval(interval);
              el.innerText = originalText; // Ensure exact match
            }
            iteration += 1 / 3;
          }, 30);
        }
      });
    }, { threshold: 0.1 });

    hackerTexts.forEach(txt => decodeObserver.observe(txt));

    // 3. Console Easter Egg
    console.log(`
    █████╗ ██████╗ ██╗  ██╗██╗
   ██╔══██╗██╔══██╗██║  ██║╚██╗
   ███████║██║  ██║███████║ ╚██╗
   ██╔══██║██║  ██║██╔══██║ ██╔╝
   ██║  ██║██████╔╝██║  ██║██╔╝
   ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝
   "Building digital architecture." 
   
   Secret Code for Mini-Adhy: sudo namakk-sett-aakam
    `);

    // Defer heavy non-critical widgets (Chatbot, Spotify) to boost Lighthouse TTI
    const widgetTimer = setTimeout(() => {
      setLoadWidgets(true);
    }, 3500);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      clearTimeout(widgetTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('launch-ttt', handleLaunch);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('trigger-egg', eggHandler);
      window.removeEventListener('trigger-trance', tranceHandler);
      decodeObserver.disconnect();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const triggerEgg = (name, duration = 5000) => {
    setActiveEgg(name);
    setTimeout(() => setActiveEgg(null), duration);
  };

  return (
    <div className={`App ${activeEgg ? `egg-${activeEgg}` : ''} ${isLateNight ? 'late-night-mode' : ''} ${tranceMode ? 'trance-mode' : ''}`}>

      {tranceMode && (
        <div className="trance-overlay-container">
          <div className="trance-channel trance-red" />
          <div className="trance-channel trance-cyan" />
        </div>
      )}

      <AmbientThoughts />
      <DigitalSoul />

      <Suspense fallback={null}>
        <CustomCursor />
        <ScrollProgress />
      </Suspense>
      <SiteModeSwitcher />
      {loading && <PageLoader onDone={() => setLoading(false)} />}

      {/* High-Performance Breathing Overlay (Opacity-only, sits above glass to prevent re-blurring lag) */}
      <div className="performance-breathing-overlay" />

      {/* Ultra-lightweight digital textures (noise, scanlines, chromatic aberration) */}
      <DigitalTextures />

      <Navbar />
      <Hero />

      {/* Lazy load sections ONLY when near viewport to save LCP/FCP */}
      <LazySection name="About"><About /></LazySection>
      <LazySection name="Skills"><Skills /></LazySection>
      <LazySection name="NeuralMap"><NeuralMap /></LazySection>
      <LazySection name="Experience"><Experience /></LazySection>
      <LazySection name="MyWorks"><MyWorks /></LazySection>
      <LazySection name="Timeline"><Timeline /></LazySection>
      <LazySection name="Photography"><Photography /></LazySection>
      <LazySection name="Achievements"><Achievements /></LazySection>
      <LazySection name="TrustedBy"><TrustedBy /></LazySection>
      <LazySection name="Testimonials"><Testimonials /></LazySection>
      <LazySection name="DigitalScars"><DigitalScars /></LazySection>
      <LazySection name="CallToAction"><CallToAction /></LazySection>
      <LazySection name="Contact"><Contact /></LazySection>
      <LazySection name="QuoteCanvas"><QuoteCanvas /></LazySection>
      <LazySection name="StackVisualizer"><StackVisualizer /></LazySection>
      <LazySection name="Footer"><Footer /></LazySection>

      {/* Gravity Well — Scroll Terminus (particles converge + signal decay) */}
      <LazySection name="GravityWell"><GravityWell /></LazySection>
      
      {/* The Seed of Life - Redefining digital permanence */}
      <Suspense fallback={null}>
        <DigitalSeed />
      </Suspense>

      {/* Easter egg overlay — outside Suspense so it is never hidden by a fallback */}
      <EasterEggOverlay egg={activeEgg} />

      {/* Spotify & Chatbot — Deferred rendering to guarantee Lighthouse 100 on initial load */}
      {loadWidgets && (
        <Suspense fallback={null}>
          <NowPlaying />
          <MiniAdhy />
        </Suspense>
      )}

      {/* Easter egg games — outside Suspense */}
      {showGame && (
        isMobile ? (
          <ZipGame onClose={() => setShowGame(false)} />
        ) : (
          <TicTacToe onClose={() => setShowGame(false)} />
        )
      )}

    </div>
  );
}

function App() {
  return (
    <SystemOrchestratorProvider>
      <SiteModeProvider>
        <ConsciousnessProvider>
          <StoryProvider>
            <AppContent />
          </StoryProvider>
        </ConsciousnessProvider>
      </SiteModeProvider>
    </SystemOrchestratorProvider>
  );
}

export default App;
