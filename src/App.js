import React, { useState, useEffect, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import { initGSAPScrollProxy, ScrollTrigger, applyGlobalEluteEffect } from './hooks/useGSAPAnimations';
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
import DigitalSoul from './components/DigitalSoul';
import { useSolarLighting } from './hooks/useSolarLighting';
import SiteModeSwitcher from './components/SiteModeSwitcher';
import { SystemOrchestratorProvider } from './contexts/SystemOrchestrator';
import DeveloperModeOS from './components/DeveloperModeOS';

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
const HowIThink = lazy(() => import('./components/HowIThink'));
const MyWorks = lazy(() => import('./components/MyWorks'));
const Achievements = lazy(() => import('./components/Achievements'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const TrustedBy = lazy(() => import('./components/TrustedBy'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const CallToAction = lazy(() => import('./components/CallToAction'));
const QuoteCanvas = lazy(() => import('./components/QuoteCanvas'));
const ScrollProgress = lazy(() => import('./components/ScrollProgress'));
const ZipGame = lazy(() => import('./components/ZipGame'));
const TicTacToe = lazy(() => import('./components/TicTacToe'));
const SnakeGame = lazy(() => import('./components/SnakeGame'));
const GamesHub = lazy(() => import('./components/GamesHub'));
const StackVisualizer = lazy(() => import('./components/StackVisualizer'));
const GravityWell = lazy(() => import('./components/GravityWell'));
const DigitalSeed = lazy(() => import('./components/DigitalSeed'));

function LazySection({ name, children }) {
  const ref = React.useRef();
  const { setActiveSection } = useConsciousness();
  const { isSectionVisible } = useSiteMode();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection(name);
        }
      },
      { rootMargin: '-10% 0px -50% 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [name, setActiveSection]);

  // Mode-aware: hide sections not relevant to current mode
  if (!isSectionVisible(name)) return null;

  return (
    <div ref={ref} className="section-container" data-xray="[SYSTEM: RENDERED]">
      <Suspense fallback={<div className="lazy-loading-skeleton" style={{ height: '100vh' }} />}>
        {children}
      </Suspense>
    </div>
  );
}

function AppContent() {
  useSolarLighting();
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEgg, setActiveEgg] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loadWidgets, setLoadWidgets] = useState(false);
  const [tranceMode, setTranceMode] = useState(false);
  const [devConsoleOpen, setDevConsoleOpen] = useState(false);

  // Late Night Loneliness Mode
  const hour = new Date().getHours();
  const isLateNight = hour < 5 || hour >= 23;

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,           // Premium buttery interpolation
      wheelMultiplier: 0.8, // Slightly resistant wheel for luxurious feel
      autoResize: true,
    });

    // Dedicated native RAF loop for flawless 144Hz scrolling unblocked by GSAP autoSleep
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // GSAP + Lenis Synchronization
    initGSAPScrollProxy(lenis);

    // Apply the requested strong GSAP Elute Effect globally across the website
    const eluteEffectKiller = applyGlobalEluteEffect();

    // Spotlight Engine: Removed for performance. 
    // Global document.body.style.setProperty triggers massive layout thrashing.

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    // launch-ttt event (from logo 3-click easter egg)
    const handleLaunch = () => setActiveGame('gameshub');
    window.addEventListener('launch-ttt', handleLaunch);

    // ML Predictive Pre-fetching listener
    const handlePrefetch = (e) => {
      const { target } = e.detail || {};
      if (!target) return;
      
      // If the model predicts the user will need heavy lazy-loaded components, fetch their chunks early.
      if (target === 'Photography' || target === 'GamesHub') {
        import('./components/GamesHub');
        import('./components/SnakeGame');
      } else if (target === 'Contact' || target === 'Hero') {
        import('./components/DigitalSeed');
        import('./components/GravityWell');
      }
    };
    window.addEventListener('ml-prefetch', handlePrefetch);

    // ML Persona-driven Behavioral Adaptation
    const handlePersona = (e) => {
      const { persona } = e.detail || {};
      if (persona === 'Developer') {
        import('./components/StackVisualizer');
        import('./components/DeveloperModeOS');
      } else if (persona === 'Creator') {
        import('./components/Photography');
      }
      document.body.setAttribute('data-persona', persona);
    };
    window.addEventListener('persona-shift', handlePersona);

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

    // Secret 'adhy' trigger for Developer Mode OS
    let adhyKeyIndex = 0;
    const adhySequence = ['a', 'd', 'h', 'y'];
    const adhyHandler = (e) => {
      if (e.key.toLowerCase() === adhySequence[adhyKeyIndex]) {
        adhyKeyIndex++;
        if (adhyKeyIndex === adhySequence.length) {
          setDevConsoleOpen(true);
          adhyKeyIndex = 0;
        }
      } else {
        adhyKeyIndex = 0;
      }
    };
    window.addEventListener('keydown', adhyHandler);

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

    // Dev Console Listener
    const devConsoleHandler = () => {
      setDevConsoleOpen(prev => !prev);
    };
    window.addEventListener('trigger-dev-console', devConsoleHandler);


    // 2. Hacker Decode Reveal (Removed: setInterval causing layout thrashing)

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
      cancelAnimationFrame(rafId);
      lenis.destroy();
      clearTimeout(widgetTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('launch-ttt', handleLaunch);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('trigger-egg', eggHandler);
      window.removeEventListener('trigger-trance', tranceHandler);
      window.removeEventListener('trigger-dev-console', devConsoleHandler);
      window.removeEventListener('keydown', adhyHandler);
      eluteEffectKiller && eluteEffectKiller();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      window.dispatchEvent(new CustomEvent('system-boot'));
      setTimeout(() => ScrollTrigger.refresh(), 100);
    }
  }, [loading]);

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
        <ScrollProgress />
      </Suspense>
      <SiteModeSwitcher />
      {loading && <PageLoader onDone={() => setLoading(false)} />}

      {/* High-Performance Breathing Overlay Removed for Performance */}

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
      <LazySection name="HowIThink"><HowIThink /></LazySection>
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
      {activeGame === 'gameshub' && <GamesHub onClose={() => setActiveGame(null)} />}
      {activeGame === 'tictactoe' && !isMobile && <TicTacToe onClose={() => setActiveGame(null)} />}
      {activeGame === 'zip' && isMobile && <ZipGame onClose={() => setActiveGame(null)} />}
      {activeGame === 'snake' && <SnakeGame onClose={() => setActiveGame(null)} />}

      {/* Developer Mode OS (Zero overhead when closed) */}
      {devConsoleOpen && <DeveloperModeOS onClose={() => setDevConsoleOpen(false)} onLaunchGame={(game) => {
        // Enforce device constraints
        if (game === 'tictactoe' && isMobile) return;
        if (game === 'zip' && !isMobile) return;
        setActiveGame(game);
      }} />}

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
