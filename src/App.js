import React, { useState, useEffect, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import { initGSAPScrollProxy, ScrollTrigger } from './hooks/useGSAPAnimations';
import './index.css';
import './modes/RecruiterMode.css';
import './modes/ExperimentalMode.css';
import './modes/ExpertMode.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PageLoader from './components/PageLoader';
import DreamStateLoader from './components/DreamStateLoader';
import EasterEggOverlay from './components/EasterEggOverlay';
import DigitalTextures from './components/DigitalTextures';
import FluidCanvas from './components/FluidCanvas';
import { StoryProvider } from './contexts/StoryContext';
import { ConsciousnessProvider, useConsciousness } from './contexts/ConsciousnessContext';
import { SiteModeProvider, useSiteMode } from './contexts/SiteModeContext';
import AmbientThoughts from './components/AmbientThoughts';
import DigitalSoul from './components/DigitalSoul';
// LiquidFilterDef removed — SVG displacement map was causing global hover distortion & GPU drain
import { useSolarLighting } from './hooks/useSolarLighting';
import SiteModeSwitcher from './components/SiteModeSwitcher';
import { SystemOrchestratorProvider } from './contexts/SystemOrchestrator';
import DeveloperModeOS from './components/DeveloperModeOS';
import ErrorBoundary from './components/ErrorBoundary';
import ns from './core/NervousSystem';
import pipeline from './core/WorkerPipeline';
import { useHybridMotion } from './hooks/useHybridMotion';

// Initialize core pipelining
pipeline.init();

// Lazy load heavy components
const NowPlaying = lazy(() => import('./components/NowPlaying'));
const MiniAdhy = lazy(() => import('./components/MiniAdhy'));

// Export dictionary of imports for ML Prefetching
const dynamicImports = {
  About: () => import('./components/About'),
  Skills: () => import('./components/Skills'),
  Experience: () => import('./components/Experience'),
  NeuralMap: () => import('./components/NeuralMap'),
  Timeline: () => import('./components/Timeline'),
  DigitalScars: () => import('./components/DigitalScars'),
  Photography: () => import('./components/Photography'),
  MyWorks: () => import('./components/MyWorks'),
  Achievements: () => import('./components/Achievements'),
  Testimonials: () => import('./components/Testimonials'),
  TrustedBy: () => import('./components/TrustedBy'),
  Contact: () => import('./components/Contact'),
  Footer: () => import('./components/Footer'),
  CallToAction: () => import('./components/CallToAction'),
  ScrollProgress: () => import('./components/ScrollProgress'),
  ZipGame: () => import('./components/ZipGame'),
  TicTacToe: () => import('./components/TicTacToe'),
  SnakeGame: () => import('./components/SnakeGame'),
  GamesHub: () => import('./components/GamesHub'),
  StackVisualizer: () => import('./components/StackVisualizer'),
  DigitalSeed: () => import('./components/DigitalSeed'),
  KineticMarquee: () => import('./components/motion/KineticMarquee'),
  CustomCursor: () => import('./components/motion/CustomCursor'),
  ZAxisTunnel: () => import('./components/motion/ZAxisTunnel')
};

// Wrap dictionary into React.lazy
const About = lazy(dynamicImports.About);
const Skills = lazy(dynamicImports.Skills);
const Experience = lazy(dynamicImports.Experience);
const NeuralMap = lazy(dynamicImports.NeuralMap);
const Timeline = lazy(dynamicImports.Timeline);
const DigitalScars = lazy(dynamicImports.DigitalScars);
const Photography = lazy(dynamicImports.Photography);
const MyWorks = lazy(dynamicImports.MyWorks);
const Achievements = lazy(dynamicImports.Achievements);
const TrustedBy = lazy(dynamicImports.TrustedBy);
const Testimonials = lazy(dynamicImports.Testimonials);
const Contact = lazy(dynamicImports.Contact);
const Footer = lazy(dynamicImports.Footer);
const CallToAction = lazy(dynamicImports.CallToAction);
const ScrollProgress = lazy(dynamicImports.ScrollProgress);
const ZipGame = lazy(dynamicImports.ZipGame);
const TicTacToe = lazy(dynamicImports.TicTacToe);
const SnakeGame = lazy(dynamicImports.SnakeGame);
const GamesHub = lazy(dynamicImports.GamesHub);
const StackVisualizer = lazy(dynamicImports.StackVisualizer);
const DigitalSeed = lazy(dynamicImports.DigitalSeed);
const KineticMarquee = lazy(dynamicImports.KineticMarquee);
const CustomCursor = lazy(dynamicImports.CustomCursor);
const ZAxisTunnel = lazy(dynamicImports.ZAxisTunnel);

// ML Prefetch Listener (Predictive Pre-Computation)
if (typeof window !== 'undefined') {
  window.addEventListener('ml-prefetch', (e) => {
    const target = e.detail?.target;
    if (target && dynamicImports[target]) {
      // Proactively call the import() promise to load the bundle 
      // into browser cache before React Suspense hits it.
      dynamicImports[target]();
    }
  });
}

function LazySection({ name, className = "section-container", children }) {
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
    <div ref={ref} className={className} data-xray="[SYSTEM: RENDERED]">
      <Suspense fallback={<div className="lazy-loading-skeleton" style={{ minHeight: '200px', height: 'auto' }} />}>
        {children}
      </Suspense>
    </div>
  );
}

function AppContent() {
  useSolarLighting();
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dreamState, setDreamState] = useState(() => {
    try {
      const memory = JSON.parse(localStorage.getItem('adhy_digital_echoes')) || {};
      const last = memory.lastInteraction || Date.now();
      return (Date.now() - last > 3600000); // 1 hour offline
    } catch { return false; }
  });
  const [activeEgg, setActiveEgg] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loadWidgets, setLoadWidgets] = useState(false);
  const [tranceMode, setTranceMode] = useState(false);
  const [devConsoleOpen, setDevConsoleOpen] = useState(false);

  // Initialize unified physics engine
  useHybridMotion();

  // Late Night Loneliness Mode
  const hour = new Date().getHours();
  const isLateNight = hour < 5 || hour >= 23;

  useEffect(() => {
    // applyGlobalEluteEffect removed — was causing layout thrash and SVG filter GPU drain
    const eluteEffectKiller = null;

    // Spotlight Engine: Removed for performance. 
    // Global document.body.style.setProperty triggers massive layout thrashing.

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    // launch-ttt event (from logo 3-click easter egg)
    const handleLaunch = () => setActiveGame('gameshub');
    window.addEventListener('launch-ttt', handleLaunch);

    // V20 Quantum Prefetching Listener
    const handlePrefetch = (e) => {
      const { target } = e.detail || {};
      if (!target) return;
      
      const injectPrefetch = (componentName) => {
        if (!document.querySelector(`link[data-prefetch="${componentName}"]`)) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'script';
          link.href = `/${componentName.toLowerCase()}.chunk.js`; // Simulated chunk name for V20 
          link.setAttribute('data-prefetch', componentName);
          document.head.appendChild(link);
        }
      };

      // Prefetch specific top-level components
      injectPrefetch(target);
      
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
      const { persona, confidence } = e.detail || {};
      if (persona === 'Developer') {
        import('./components/StackVisualizer');
        import('./components/DeveloperModeOS');
        // Snappy, fast transitions for developers
        document.documentElement.style.setProperty('--transition-bounce', '0.2s cubic-bezier(0.2, 0, 0, 1)');
      } else if (persona === 'Creator') {
        import('./components/Photography');
        // Cinematic, slow transitions for creators
        document.documentElement.style.setProperty('--transition-bounce', '0.6s cubic-bezier(0.4, 0, 0.2, 1)');
      }
      document.documentElement.setAttribute('data-persona', persona);
      console.log(`[ML_ENGINE] Persona identified: ${persona} (Confidence: ${confidence})`);
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
      {dreamState && <DreamStateLoader onAwake={() => setDreamState(false)} />}

      {tranceMode && (
        <div className="trance-overlay-container">
          <div className="trance-channel trance-red" />
          <div className="trance-channel trance-cyan" />
        </div>
      )}

      <AmbientThoughts />
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>
      <DigitalSoul />
      <FluidCanvas />

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
      <LazySection name="Achievements"><Achievements /></LazySection>
      <LazySection name="TrustedBy"><TrustedBy /></LazySection>
      <LazySection name="Testimonials"><Testimonials /></LazySection>
      <LazySection name="DigitalScars"><DigitalScars /></LazySection>
      <LazySection name="CallToAction"><CallToAction /></LazySection>
      <LazySection name="Contact"><Contact /></LazySection>
      <LazySection name="StackVisualizer"><StackVisualizer /></LazySection>
      <LazySection name="KineticMarquee" className="lazy-section-auto"><KineticMarquee /></LazySection>
      <LazySection name="Footer" className="lazy-section-auto"><Footer /></LazySection>

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
    <ErrorBoundary>
      <SystemOrchestratorProvider>
        <SiteModeProvider>
          <ConsciousnessProvider>
            <StoryProvider>
              <AppContent />
            </StoryProvider>
          </ConsciousnessProvider>
        </SiteModeProvider>
      </SystemOrchestratorProvider>
    </ErrorBoundary>
  );
}

export default App;
