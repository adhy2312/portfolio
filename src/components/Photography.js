import React from 'react';
import './Photography.css';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';

function Photography() {
  return (
    <section className="photography-section">
      <h2>📷 My Photography</h2>
      <p className="intro">
        Here's a glimpse of the world through my lens.
      </p>
      <div className="photo-gallery">
        <img src={photo1} alt="Photography 1" />
        <img src={photo2} alt="Photography 2" />
        <img src={photo3} alt="Photography 3" />
      </div>
    </section>
  );
}

export default Photography;
