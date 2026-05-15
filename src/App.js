import React, { useState, useEffect, Suspense, lazy } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';

// Lazy load below-the-fold components
const About = lazy(() => import('./components/About'));
const Skills = lazy(() => import('./components/Skills'));
const GitHubStats = lazy(() => import('./components/GitHubStats'));
const Photography = lazy(() => import('./components/Photography'));
const MyWorks = lazy(() => import('./components/MyWorks'));
const Achievements = lazy(() => import('./components/Achievements'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const TrustedBy = lazy(() => import('./components/TrustedBy'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const CallToAction = lazy(() => import('./components/CallToAction'));
const PingPongGame = lazy(() => import('./components/PingPongGame'));
const CustomCursor = lazy(() => import('./components/CustomCursor'));
const PageLoader = lazy(() => import('./components/PageLoader'));
const ScrollProgress = lazy(() => import('./components/ScrollProgress'));
const ZipGame = lazy(() => import('./components/ZipGame'));


function App() {
  const [showPong, setShowPong] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeEgg, setActiveEgg] = useState(null);



  useEffect(() => {
    const handler = () => setShowPong(true);
    window.addEventListener('launch-pong', handler);
    
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    const keydownHandler = (e) => {
      if (e.key === konami[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konami.length) {
          setSpin(true);
          setTimeout(() => setSpin(false), 3000);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };
    window.addEventListener('keydown', keydownHandler);
    
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    const eggHandler = (e) => {
      setActiveEgg(e.detail);
      setTimeout(() => setActiveEgg(null), e.detail === 'matrix' ? 8000 : 5000);
    };
    window.addEventListener('trigger-egg', eggHandler);
    
    return () => {
      window.removeEventListener('launch-pong', handler);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('trigger-egg', eggHandler);
    };
  }, []);



  return (
    <div className={`App ${spin ? 'spin-easter-egg' : ''} ${activeEgg ? `egg-${activeEgg}` : ''}`}>

      <Suspense fallback={null}>
        {/* Only render custom cursor on desktop */}
        {window.innerWidth > 768 && <CustomCursor />}
        <ScrollProgress />
        {loading && <PageLoader onDone={() => setLoading(false)} />}
        
        {/* Ambient background blobs */}
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />

        <Navbar />
        <Hero />
        
        {/* Below-fold sections wrapped for content-visibility optimization */}
        <div className="lazy-section">
          <About />
        </div>
        <div className="lazy-section">
          <Skills />
        </div>
        <div className="lazy-section">
          <GitHubStats />
        </div>
        <div className="lazy-section">
          <TrustedBy />
        </div>
        <div className="lazy-section">
          <MyWorks />
        </div>
        <div className="lazy-section">
          <Photography />
        </div>
        <div className="lazy-section">
          <Achievements />
        </div>
        <div className="lazy-section">
          <Testimonials />
        </div>
        <div className="lazy-section">
          <CallToAction />
        </div>
        <div className="lazy-section">
          <Contact />
        </div>
        <Footer />

        {/* Hidden Easter Egg */}
        {showPong && (
          isMobile ? (
            <ZipGame onClose={() => setShowPong(false)} />
          ) : (
            <PingPongGame onClose={() => setShowPong(false)} />
          )
        )}

      </Suspense>
    </div>
  );
}

export default App;
