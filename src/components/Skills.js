import React, { useEffect, useState } from 'react';
import './Skills.css';
import { motion } from 'framer-motion';
import { FiMonitor, FiSettings, FiPenTool, FiZap } from 'react-icons/fi';
import { client } from '../sanity';

const iconMap = {
  FiMonitor: <FiMonitor />,
  FiSettings: <FiSettings />,
  FiPenTool: <FiPenTool />,
  FiZap: <FiZap />,
};

const skillCategories = [
  {
    category: 'Frontend Development',
    icon: <FiMonitor />,
    color: '#6C63FF',
    skills: [
      { name: 'React.js', level: 85 },
      { name: 'HTML5 & CSS3', level: 92 },
      { name: 'JavaScript (ES6+)', level: 83 },
      { name: 'Responsive Design', level: 88 },
      { name: 'Framer Motion', level: 75 },
    ],
  },
  {
    category: 'Backend & Databases',
    icon: <FiSettings />,
    color: '#4FC3F7',
    skills: [
      { name: 'Node.js & Express', level: 76 },
      { name: 'REST APIs', level: 80 },
      { name: 'MongoDB', level: 70 },
      { name: 'MySQL / SQLite', level: 72 },
      { name: 'Firebase', level: 68 },
    ],
  },
  {
    category: 'UI/UX & Design',
    icon: <FiPenTool />,
    color: '#F5A623',
    skills: [
      { name: 'Figma', level: 88 },
      { name: 'Prototyping', level: 82 },
      { name: 'Design Systems', level: 78 },
      { name: 'Adobe Photoshop', level: 74 },
      { name: 'Lightroom (Photo Edit)', level: 90 },
    ],
  },
  {
    category: 'Electronics & IoT',
    icon: <FiZap />,
    color: '#00E5A0',
    skills: [
      { name: 'Arduino', level: 85 },
      { name: 'ESP32 / ESP8266', level: 80 },
      { name: 'Circuit Design', level: 75 },
      { name: 'Embedded C', level: 72 },
      { name: 'Sensor Integration', level: 78 },
    ],
  },
];

const tools = [
  'React', 'Node.js', 'Figma', 'Arduino', 'ESP32', 'MongoDB',
  'Git', 'Firebase', 'Photoshop', 'Lightroom', 'JavaScript', 'CSS3',
  'HTML5', 'Express.js', 'REST APIs', 'Linux',
];

const Skills = () => {
  const [fetchedCategories, setFetchedCategories] = useState([]);

  useEffect(() => {
    const query = '*[_type == "skillCategory"]';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) setFetchedCategories(data);
    }).catch(console.error);
  }, []);

  const displayCategories = fetchedCategories.length > 0 ? fetchedCategories : skillCategories;

  return (
    <section className="skills" id="skills">
      <div className="container">
        <motion.div
          className="skills-header"
          initial={{ opacity: 1, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// what I know</span>
          <h2 className="section-title">
            Skills & <span>Expertise</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            From building full-stack web applications and crafting pixel-perfect designs in Figma,
            to programming microcontrollers — I thrive across the full technology spectrum.
          </p>
        </motion.div>

        {/* Skill category cards */}
        <div className="skills-grid">
          {displayCategories.map((cat, catIdx) => (
            <motion.div
              key={catIdx}
              className="skill-card glass-card"
              initial={{ opacity: 1, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: catIdx * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="skill-card-header">
                <span className="skill-card-icon">{iconMap[cat.iconName] || <FiMonitor />}</span>
                <h3 className="skill-card-title" style={{ color: cat.color || '#6C63FF' }}>
                  {cat.title || cat.category}
                </h3>
              </div>

              <div className="skill-bars">
                {(cat.skills || []).map((skill, skillIdx) => (
                  <div key={skillIdx} className="skill-bar-item">
                    <div className="skill-bar-label">
                      <span>{skill.name}</span>
                      <span className="skill-bar-percent">{skill.level}%</span>
                    </div>
                    <div className="skill-bar-track">
                      <motion.div
                        className="skill-bar-fill"
                        style={{ '--bar-color': cat.color || '#6C63FF' }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, delay: 0.3 + skillIdx * 0.1, ease: 'easeOut' }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tools & Technologies cloud */}
        <motion.div
          className="tools-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className="tools-title">Tools & Technologies</h3>
          <div className="tools-cloud">
            {tools.map((tool, i) => (
              <motion.span
                key={i}
                className="tech-tag tools-chip"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1 }}
              >
                {tool}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;
