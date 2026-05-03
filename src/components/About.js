import React, { useEffect, useState } from 'react';
import './About.css';
import { motion } from 'framer-motion';
import dp from '../assets/dp.jpg';
import { FiDownload, FiMapPin, FiCalendar, FiAward } from 'react-icons/fi';
import { client, urlFor } from '../sanity';

const iconMap = {
  FiCalendar: <FiCalendar />,
  FiAward: <FiAward />,
};

const defaultStats = [
  { value: '3+', label: 'Years Learning', iconName: 'FiCalendar' },
  { value: '15+', label: 'Projects Built', iconName: 'FiAward' },
  { value: '10+', label: 'Tech Stacks', iconName: 'FiAward' },
];

const About = () => {
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    const query = '*[_type == "about"][0]';
    client.fetch(query).then((data) => {
      if (data) setAboutData(data);
    }).catch(console.error);
  }, []);

  const displayData = {
    location: aboutData?.location || "Kerala, India · Open to Remote & Relocation",
    bioParagraphs: aboutData?.bioParagraphs || [
      "I'm Adhithya Mohan, an Electronics and Communication Engineering (ECE) student and full-stack developer passionate about building impactful digital products. I blend engineering precision with creative design — from responsive web apps to embedded electronics systems.",
      "My skill set spans the full product lifecycle — ideating in Figma, building with React & Node.js, and extending to hardware with ESP32 & Arduino. I also bring a photographer's eye for detail to every UI I design.",
      "I'm driven by curiosity, constantly exploring new technologies, contributing to open source, and building things that matter."
    ],
    stats: aboutData?.stats || defaultStats,
    profileImage: aboutData?.profileImage ? urlFor(aboutData.profileImage).url() : dp,
    experienceYears: aboutData?.experienceYears || "2+"
  };

  if (!displayData.profileImage && !dp) {
    // Fallback if both Sanity and local import fail (shouldn't happen)
    displayData.profileImage = "https://via.placeholder.com/400";
  }

  return (
    <section className="about" id="about">
      <div className="container">
        <motion.div
          className="about-grid"
          initial={{ opacity: 1, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Image side */}
          <div className="about-image-col">
            <div className="about-img-wrapper">
              <img src={displayData.profileImage} alt="Adhithya Mohan" className="about-img" />
              <div className="about-img-glow" />
              {/* Experience badge */}
              <motion.div
                className="about-exp-badge"
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <span className="exp-number">{displayData.experienceYears}</span>
                <span className="exp-label">Years of<br/>Experience</span>
              </motion.div>
            </div>
          </div>

          {/* Text side */}
          <div className="about-text-col">
            <span className="section-label">// who I am</span>
            <h2 className="section-title about-title">
              About <span>Me</span>
            </h2>
            <div className="section-divider" />

            <div className="about-location">
              <FiMapPin size={14} />
              <span>{displayData.location}</span>
            </div>

            {displayData.bioParagraphs.map((p, i) => (
              <p key={i} className="about-p">{p}</p>
            ))}

            {/* Stats */}
            <div className="about-stats">
              {displayData.stats.map((s, i) => (
                <motion.div
                  key={i}
                  className="about-stat"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </motion.div>
              ))}
            </div>

            <a href="/resume.pdf" download className="btn-primary about-cta">
              <FiDownload />
              Download Resume
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
