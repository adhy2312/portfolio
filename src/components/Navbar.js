// src/components/Navbar.js
import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar glass">
      <div className="logo">ADHY.</div>
      <ul className="nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#photography">Photography</a></li>
        <li><a href="#works">My Works</a></li>
        <li><a href="#testimonials">Testimonials</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
