import React from 'react';
import { Link } from 'react-scroll';

export default () => (
  <nav style={{ position: 'sticky', top:0, background:'transparent', zIndex:1000, padding:'1rem'}}>
    <Link to="hero" smooth duration={600}>Home</Link>{" • "}
    <Link to="about" smooth duration={600}>About</Link>{" • "}
    <Link to="gallery" smooth duration={600}>Gallery</Link>{" • "}
    <Link to="resume" smooth duration={600}>Resume</Link>{" • "}
    <Link to="contact" smooth duration={600}>Contact</Link>
  </nav>
);
