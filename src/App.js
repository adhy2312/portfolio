import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import GitHubStats from './components/GitHubStats';
import Photography from './components/Photography';
import MyWorks from './components/MyWorks';
import Achievements from './components/Achievements';
import Testimonials from './components/Testimonials';
import TrustedBy from './components/TrustedBy';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CallToAction from './components/CallToAction';
import PingPongGame from './components/PingPongGame';
import CustomCursor from './components/CustomCursor';
import PageLoader from './components/PageLoader';
import ScrollProgress from './components/ScrollProgress';
import './index.css';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [showPong, setShowPong] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => setShowPong(true);
    window.addEventListener('launch-pong', handler);
    return () => window.removeEventListener('launch-pong', handler);
  }, []);

  return (
    <div className="App">
      <CustomCursor />
      <ScrollProgress />
      {loading && <PageLoader onDone={() => setLoading(false)} />}
      
      {/* Ambient background blobs */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />

      <Navbar />
      <Hero />
      <About />
      <Skills />
      <GitHubStats />
      <TrustedBy />
      <MyWorks />
      <Photography />
      <Achievements />
      <Testimonials />
      <CallToAction />
      <Contact />
      <Footer />

      {/* Hidden Easter Egg */}
      {showPong && <PingPongGame onClose={() => setShowPong(false)} />}
    </div>
  );
}

export default App;
