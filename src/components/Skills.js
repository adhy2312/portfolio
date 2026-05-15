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
    color: 'var(--accent-primary)',
    skills: [
      { name: 'React.js', level: 85 },
      { name: 'HTML5 & CSS3', level: 80 },
      { name: 'JavaScript (ES6+)', level: 70 },
      { name: 'Responsive Design', level: 70 },
      { name: 'Framer Motion', level: 75 },
    ],
  },
  {
    category: 'Backend & Databases',
    icon: <FiSettings />,
    color: 'var(--accent-cyan)',
    skills: [
      { name: 'Node.js & Express', level: 50 },
      { name: 'REST APIs', level: 40 },
      { name: 'MongoDB', level: 30 },
      { name: 'MySQL / SQLite', level: 40 },
      { name: 'Firebase', level: 60 },
    ],
  },
  {
    category: 'UI/UX & Design',
    icon: <FiPenTool />,
    color: 'var(--accent-gold)',
    skills: [
      { name: 'Figma', level: 88 },
      { name: 'Prototyping', level: 82 },
      { name: 'Design Systems', level: 78 },
      { name: 'Adobe Photoshop', level: 50 },
      { name: 'Lightroom (Photo Edit)', level: 90 },
    ],
  },
  {
    category: 'Electronics & IoT',
    icon: <FiZap />,
    color: 'var(--accent-green)',
    skills: [
      { name: 'Arduino', level: 50 },
      { name: 'STM32', level: 50 },
      { name: 'Circuit Design', level: 75 },
      { name: 'C', level: 72 },
      { name: 'Circuit Simulation', level: 78 },
    ],
  },
];

// Tool chip metadata: group color + micro snippet for tooltip
const toolMeta = {
  'React': { group: 'frontend', snippet: 'UI Library', emoji: '⚛️' },
  'Node.js': { group: 'backend', snippet: 'Runtime Engine', emoji: '🟢' },
  'Figma': { group: 'design', snippet: 'Design Tool', emoji: '🎨' },
  '8051 MC': { group: 'iot', snippet: 'Microcontroller', emoji: '🔌' },
  'ESP32': { group: 'iot', snippet: 'IoT Board', emoji: '📡' },
  'MongoDB': { group: 'backend', snippet: 'NoSQL Database', emoji: '🍃' },
  'Git': { group: 'tools', snippet: 'Version Control', emoji: '🔀' },
  'Firebase': { group: 'backend', snippet: 'Cloud Platform', emoji: '🔥' },
  'Photoshop': { group: 'design', snippet: 'Image Editor', emoji: '🖼️' },
  'Lightroom': { group: 'design', snippet: 'Photo Editor', emoji: '📸' },
  'JavaScript & TypeScript': { group: 'frontend', snippet: 'Core Language', emoji: '⚡' },
  'CSS': { group: 'frontend', snippet: 'Styling', emoji: '🎭' },
  'HTML': { group: 'frontend', snippet: 'Markup', emoji: '🏗️' },
  'Express.js': { group: 'backend', snippet: 'Web Framework', emoji: '🚂' },
  'APIs': { group: 'backend', snippet: 'API Design', emoji: '🔗' },
  'Python': { group: 'tools', snippet: 'Programming Language', emoji: '🐍' },
};

const groupColors = {
  frontend: { border: 'var(--accent-primary)', glow: 'rgba(108, 99, 255, 0.35)' },
  backend: { border: 'var(--accent-cyan)', glow: 'rgba(79, 195, 247, 0.35)' },
  design: { border: 'var(--accent-gold)', glow: 'rgba(245, 166, 35, 0.35)' },
  iot: { border: 'var(--accent-green)', glow: 'rgba(0, 229, 160, 0.35)' },
  tools: { border: '#CBA6F7', glow: 'rgba(203, 166, 247, 0.35)' },
};

const tools = [
  'React', 'Node.js', 'Figma', '8051 MC', 'ESP32', 'MongoDB',
  'Git', 'Firebase', 'Photoshop', 'Lightroom', 'JavaScript', 'CSS',
  'HTML', 'Express.js', 'APIs', 'Python',
];

const Skills = () => {
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [hoveredTool, setHoveredTool] = useState(null);

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
          <h2 className="section-title" data-hover="My Arsenal">
            <span className="section-title-inner">Skills & <span>Expertise</span></span>
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
                <h3 className="skill-card-title" style={{ color: cat.color || 'var(--accent-primary)' }}>
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
                        style={{ '--bar-color': cat.color || 'var(--accent-primary)' }}
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
            {tools.map((tool, i) => {
              const meta = toolMeta[tool] || { group: 'tools', snippet: tool, emoji: '🔧' };
              const colors = groupColors[meta.group] || groupColors.tools;
              return (
                <motion.span
                  key={i}
                  className={`tech-tag tools-chip tools-chip-interactive ${hoveredTool === tool ? 'tools-chip-active' : ''}`}
                  style={{
                    '--chip-border': colors.border,
                    '--chip-glow': colors.glow,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.12, y: -4 }}
                  onMouseEnter={() => setHoveredTool(tool)}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <span className="chip-emoji">{meta.emoji}</span>
                  {tool}
                  {/* Tooltip */}
                  <span className="chip-tooltip">
                    <span className="chip-tooltip-title">{meta.emoji} {tool}</span>
                    <span className="chip-tooltip-desc">{meta.snippet}</span>
                  </span>
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;
