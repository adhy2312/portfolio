import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Photography from './components/Photography';
import MyWorks from './components/MyWorks';
import Achievements from './components/Achievements';
import Testimonials from './components/Testimonials';
import TrustedBy from './components/TrustedBy';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CallToAction from './components/CallToAction';
import './index.css';
import { AnimatePresence } from 'framer-motion';

function App() {
  return (
    <div className="App">
      {/* Ambient background blobs */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />

      <Navbar />
      <Hero />
      <About />
      <Skills />
      <TrustedBy />
      <MyWorks />
      <Photography />
      <Achievements />
      <Testimonials />
      <CallToAction />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;
