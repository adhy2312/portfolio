import React, { useState, useEffect, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PageLoader from './components/PageLoader';
import EasterEggOverlay from './components/EasterEggOverlay';
import DigitalTextures from './components/DigitalTextures';
import { StoryProvider } from './contexts/StoryContext';
import { ConsciousnessProvider, useConsciousness } from './contexts/ConsciousnessContext';
import AmbientThoughts from './components/AmbientThoughts';
import { useSolarLighting } from './hooks/useSolarLighting';
import DigitalSoul from './components/DigitalSoul';

// Lazy load heavy components
const NowPlaying = lazy(() => import('./components/NowPlaying'));
const MiniAdhy   = lazy(() => import('./components/MiniAdhy'));

// Lazy load below-the-fold components
const About       = lazy(() => import('./components/About'));
const Skills      = lazy(() => import('./components/Skills'));
const Experience  = lazy(() => import('./components/Experience'));
const NeuralMap   = lazy(() => import('./components/NeuralMap'));
const Timeline    = lazy(() => import('./components/Timeline'));
const DigitalScars= lazy(() => import('./components/DigitalScars'));
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

function LazySection({ name, children }) {
  const [inView, setInView] = useState(false);
  const ref = React.useRef();
  const { setActiveSection } = useConsciousness();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setActiveSection(name);
        }
      },
      { rootMargin: '-10% 0px -50% 0px' } // triggers when section is decently in view
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [name, setActiveSection]);

  // Keep original preloader observer for actual mounting
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

  return (
    <div ref={ref} className="lazy-section-container" style={{ minHeight: inView ? 'auto' : '100vh' }} data-xray="[SYSTEM: LAZY_LOADER]&#10;Strategy: IntersectionObserver&#10;RootMargin: 600px&#10;Fallback: Skeleton UI">
      {inView && <Suspense fallback={<div className="lazy-loading-skeleton" />}>{children}</Suspense>}
    </div>
  );
}

function App() {
  useSolarLighting(); // Active global lighting calculations
  const [showGame, setShowGame]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [activeEgg, setActiveEgg] = useState(null);
  const [isMobile, setIsMobile]   = useState(window.innerWidth <= 768);
  
  // Late Night Loneliness Mode
  const hour = new Date().getHours();
  const isLateNight = hour < 5 || hour >= 23;

  useEffect(() => {
    // Lenis Smooth Scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });
    
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

    // 1. Magnetic Buttons Physics
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    const handleMouseMove = (e) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    };
    const handleMouseLeave = (e) => {
      const btn = e.currentTarget;
      btn.style.transform = `translate(0px, 0px)`;
    };
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', handleMouseMove);
      btn.addEventListener('mouseleave', handleMouseLeave);
      // Ensure smooth return transition but snappy follow
      btn.style.transition = 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s ease, color 0.3s ease';
    });

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

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('launch-ttt', handleLaunch);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('trigger-egg', eggHandler);
      magneticBtns.forEach(btn => {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseleave', handleMouseLeave);
      });
      decodeObserver.disconnect();
    };
  }, []);

  const triggerEgg = (name, duration = 5000) => {
    setActiveEgg(name);
    setTimeout(() => setActiveEgg(null), duration);
  };

  return (
    <ConsciousnessProvider>
      <StoryProvider>
        <div className={`App ${activeEgg ? `egg-${activeEgg}` : ''} ${isLateNight ? 'late-night-mode' : ''}`}>

        <AmbientThoughts />
        <DigitalSoul />

        <Suspense fallback={null}>
        <CustomCursor />
        <ScrollProgress />
      </Suspense>
      {loading && <PageLoader onDone={() => setLoading(false)} />}

      {/* Ambient background blobs — desktop only */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="digital-breathing-overlay" />

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
      <LazySection name="Footer"><Footer /></LazySection>

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

      </div>
      </StoryProvider>
    </ConsciousnessProvider>
  );
}

export default App;
