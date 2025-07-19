import React, { useState, useEffect } from 'react';
import './index.css';
import dp from './assets/dp.jpg';
import About from './components/About';
import Contact from './components/Contact';
import Resume from './components/Resume';
import Photography from './components/Photography';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  return (
    <div className="App">
      <div className="parallax">
        <img src={dp} alt="Adhithya Mohan" className="dp" />
        <h1 className="typewriter">Adhithya Mohan</h1>
        <button
          className="glow-button"
          onClick={() => setDarkMode(!darkMode)}
        >
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      <About />
      <Photography />
      <Resume />
      <Contact />
    </div>
  );
}

export default App;
