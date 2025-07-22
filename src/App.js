import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Photography from './components/Photography';
import MyWorks from './components/MyWorks';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './index.css';
import { AnimatePresence } from 'framer-motion';
import CallToAction from './components/CallToAction';
import ParticlesBackground from './components/ParticlesBackground';

function App() {
  return (
    <AnimatePresence mode="wait">
      <div className="App">
        <ParticlesBackground />
        <Navbar />
        <Hero />
        <About />
        <Photography />
        <MyWorks />
        <Testimonials />
        <CallToAction />
        <Contact />
        <Footer />
      </div>
    </AnimatePresence>
  );
}

export default App;
