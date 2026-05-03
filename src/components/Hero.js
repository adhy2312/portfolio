// src/components/Hero.js
import React, { useEffect, useRef } from 'react';
import './Hero.css';
import { motion } from 'framer-motion';
import dpCutout from '../assets/dp-cutout.png'; // Updated to use the transparent cutout
import {
  FiGithub,
  FiLinkedin,
  FiInstagram,
  FiMail,
  FiArrowDown,
  FiZap,
  FiPenTool,
  FiCamera
} from 'react-icons/fi';
import { client, urlFor } from '../sanity';

const Hero = () => {
  const canvasRef = useRef(null);
  const [heroData, setHeroData] = React.useState(null);

  useEffect(() => {
    const query = '*[_type == "hero"][0]';
    client.fetch(query).then((data) => {
      if (data) setHeroData(data);
    }).catch(console.error);
  }, []);

  // Animated starfield canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      opacity: Math.random(),
      speed: Math.random() * 0.3 + 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.opacity += s.speed * 0.02;
        if (s.opacity >= 1 || s.opacity <= 0) s.speed *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 255, ${s.opacity * 0.7})`;
        ctx.fill();
      });
      animFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleScrollDown = () => {
    const el = document.getElementById('about');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const socials = [
    { icon: <FiLinkedin />, href: 'https://www.linkedin.com/in/adhithya-mohan-s', label: 'LinkedIn' },
    { icon: <FiGithub />, href: 'https://github.com/adhy2312', label: 'GitHub' },
    { icon: <FiInstagram />, href: 'https://instagram.com/zoomout_images', label: 'Instagram' },
    { icon: <FiMail />, href: 'mailto:adhithyamohan2312@gmail.com', label: 'Email' },
  ];

  const displayData = {
    greeting: heroData?.greeting || "Hello",
    name: heroData?.name || "Adhithya",
    role: heroData?.role || "ECE Student & Dev",
    resumeUrl: heroData?.resumeUrl || "/resume.pdf",
    image: heroData?.heroImage ? urlFor(heroData.heroImage).url() : dpCutout,
    techStack: heroData?.techStack || ['HTML5', 'CSS', 'Javascript', 'Node.js', 'React', 'Git', 'Github']
  };

  return (
    <section id="hero" className="hero">
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Floating geometric chevrons */}
      <motion.div
        className="hero-chevron chevron-left"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.3, x: 0 }}
        transition={{ delay: 1, duration: 1 }}
      >
        &lt;
      </motion.div>
      <motion.div
        className="hero-chevron chevron-right"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.3, x: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        &gt;
      </motion.div>

      <div className="hero-container">
        {/* Left: Text content */}
        <div className="hero-text">
          <motion.h1
            className="hero-greeting"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {displayData.greeting} <span className="red-dot">.</span>
          </motion.h1>

          <motion.h2
            className="hero-name-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="hero-line"></span>
            I'm {displayData.name}
          </motion.h2>

          <motion.h3
            className="hero-role-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {displayData.role}
          </motion.h3>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <a href="#contact" className="btn-solid-coral hero-btn"
               onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Got a project?
            </a>
            <a href={displayData.resumeUrl} download className="btn-outline-coral hero-btn">
              My resume
            </a>
          </motion.div>

          <motion.div
            className="hero-socials"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social-link"
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </motion.div>
        </div>

        {/* Right: Profile image with circle background */}
        <motion.div
          className="hero-image-wrap"
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
        >
          <div className="hero-circle-gradient">
            <div className="hero-circle-inner" />
          </div>
          <motion.img 
            src={displayData.image} 
            alt={displayData.name} 
            className="hero-img-cutout bw-contrast"
            initial={{ opacity: 0, y: 50, filter: 'grayscale(100%) contrast(150%) brightness(0.8) drop-shadow(0 20px 30px rgba(0, 0, 0, 0.6))' }}
            animate={{ opacity: 1, y: 0, filter: 'grayscale(100%) contrast(120%) brightness(1) drop-shadow(0 20px 30px rgba(0, 0, 0, 0.6))' }}
            transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      </div>

      {/* Bottom Tech Stack */}
      <motion.div
        className="hero-tech-stack"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        {displayData.techStack.map((tech) => (
          <span key={tech} className="tech-item">{tech}</span>
        ))}
      </motion.div>
    </section>
  );
};

export default Hero;
