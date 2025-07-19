// src/components/Resume.js
import React from 'react';
import './Resume.css';

const Resume = () => {
  return (
    <section className="resume-section">
      <h2 className="section-title">Resume</h2>
      <p className="resume-text">Click the button below to download my resume as PDF.</p>
      <a href="/resume.pdf" download className="download-btn">Download CV</a>
    </section>
  );
};

export default Resume;
