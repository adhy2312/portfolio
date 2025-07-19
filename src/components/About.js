import React from 'react';
import '../index.css';
import dp from '../assets/dp.jpg';

function About() {
  return (
    <section className="section" style={{ backgroundColor: '#f9f9f9' }}>
      <h2>🎯 About Me</h2>
      <div style={{
        maxWidth: '800px',
        margin: 'auto',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        textAlign: 'left',
        lineHeight: '1.7'
      }}>
        <img src={dp} alt="Adhithya DP" style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          objectFit: 'cover',
          float: 'right',
          marginLeft: '20px',
          boxShadow: '0 0 10px #ff00cc'
        }} />
        <p>
          Hello! I'm <strong>Adhithya Mohan</strong>, a passionate photographer with an eye for detail and emotion.
          Whether it's the serenity of landscapes, the chaos of urban streets, or the intimacy of portraits — I strive to tell stories through every frame.
        </p>
        <p>
          I started photography at a young age and have been capturing the world through my lens for the past few years.
          My work has been appreciated for its mood, emotion, and vibrant compositions.
        </p>
        <p>
          Apart from clicking pictures, I also love editing, experimenting with colors, and creating visual masterpieces.
          This portfolio is a small window into my world — hope you enjoy the view! 📸
        </p>
      </div>
    </section>
  );
}

export default About;
