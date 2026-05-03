import React, { useEffect, useState } from 'react';
import './Achievements.css';
import { motion } from 'framer-motion';
import { FiAward, FiZap, FiPenTool, FiCamera, FiGlobe, FiBookOpen } from 'react-icons/fi';
import { client } from '../sanity';

const iconMap = {
  FiAward: <FiAward />,
  FiZap: <FiZap />,
  FiPenTool: <FiPenTool />,
  FiCamera: <FiCamera />,
  FiGlobe: <FiGlobe />,
  FiBookOpen: <FiBookOpen />,
};

const defaultAchievements = [
  { iconName: 'FiAward', title: 'PR & Media Head, ISTE', desc: 'PR and Media Head, and lead web developer for the ISTE MBCET chapter — driving digital presence and building the official portal.', accent: '#6C63FF' },
  { iconName: 'FiZap', title: 'IoT Projects', desc: 'Designed and shipped multiple embedded systems projects using ESP32 and Arduino for real-world problems.', accent: '#00E5A0' },
  { iconName: 'FiPenTool', title: 'Figma Designer', desc: 'Built polished design systems and prototypes for web apps — from wireframes to production-ready UI.', accent: '#F5A623' },
  { iconName: 'FiCamera', title: 'Photographer', desc: 'Running @zoomout_images on Instagram — passionate street, portrait, and nature photographer.', accent: '#4FC3F7' },
  { iconName: 'FiGlobe', title: 'Full-Stack Dev', desc: 'Built end-to-end web apps with React, Node.js, and MongoDB — from database design to pixel-perfect UIs.', accent: '#a78bfa' },
  { iconName: 'FiBookOpen', title: 'ECE Student', desc: 'Pursuing Electronics and Communication Engineering (ECE) with a passion for blending hardware design with modern software.', accent: '#ff6b9d' },
];

const Achievements = () => {
  const [fetchedAchievements, setFetchedAchievements] = useState([]);

  useEffect(() => {
    const query = '*[_type == "achievement"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) setFetchedAchievements(data);
    }).catch(console.error);
  }, []);

  const displayAchievements = fetchedAchievements.length > 0 ? fetchedAchievements : defaultAchievements;

  return (
    <section className="achievements" id="achievements">
      <div className="container">
        <motion.div
          className="ach-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// highlights</span>
          <h2 className="section-title">
            What I <span>Bring</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            A diverse toolkit spanning software, hardware, design, and creative arts — I don't just write code, I create experiences.
          </p>
        </motion.div>

        <div className="ach-grid">
          {displayAchievements.map((item, i) => (
            <motion.div
              key={i}
              className="ach-card glass-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              style={{ '--ach-accent': item.accent }}
            >
              <div className="ach-icon-wrap">
                <span className="ach-emoji" style={{ color: item.accent }}>
                  {iconMap[item.iconName] || <FiAward />}
                </span>
                <div className="ach-icon-glow" />
              </div>
              <h3 className="ach-title">{item.title}</h3>
              <p className="ach-desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievements;
