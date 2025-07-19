import React from 'react';
import './Navbar.css';

function Navbar({ darkMode, setDarkMode }) {
  return (
    <nav className="navbar">
      <ul>
        <li><a href="#about">About</a></li>
        <li><a href="#projects">Projects</a></li>
        <li><a href="#resume">Resume</a></li>
        <li><a href="#contact">Contact</a></li>
        <li>
          <button onClick={() => setDarkMode(!darkMode)} className="toggle">
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
