import React, { useState, useEffect, Suspense, lazy } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PageLoader from './components/PageLoader';
import EasterEggOverlay from './components/EasterEggOverlay';

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
const CustomCursor = lazy(() => import('./components/CustomCursor'));
const ScrollProgress = lazy(() => import('./components/ScrollProgress'));
const TicTacToe   = lazy(() => import('./components/TicTacToe'));

function App() {
  const [showGame, setShowGame]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [activeEgg, setActiveEgg] = useState(null);

  useEffect(() => {
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
    <div className={`App ${activeEgg ? `egg-${activeEgg}` : ''}`}>

      <Suspense fallback={null}>
        <CustomCursor />
        <ScrollProgress />
        {loading && <PageLoader onDone={() => setLoading(false)} />}

        {/* Ambient background blobs — desktop only */}
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />

        <Navbar />
        <Hero />

        <div className="lazy-section"><About /></div>
        <div className="lazy-section"><Skills /></div>
        <div className="lazy-section"><Experience /></div>
        <div className="lazy-section"><GitHubStats /></div>
        <div className="lazy-section"><TrustedBy /></div>
        <div className="lazy-section"><MyWorks /></div>
        <div className="lazy-section"><Photography /></div>
        <div className="lazy-section"><Achievements /></div>
        <div className="lazy-section"><Testimonials /></div>
        <div className="lazy-section"><CallToAction /></div>
        <div className="lazy-section"><Contact /></div>
        <Footer />

      </Suspense>

      {/* Easter egg overlay — outside Suspense so it is never hidden by a fallback */}
      <EasterEggOverlay egg={activeEgg} />

      {/* TicTacToe game — outside Suspense */}
      {showGame && <TicTacToe onClose={() => setShowGame(false)} />}

    </div>
  );
}

export default App;
