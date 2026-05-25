import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { client } from '../sanity';
import DecryptedText from './DecryptedText';
import './Timeline.css';

const timelineData = [
  { id: 1, year: '2024', title: 'Completed 12th std', description: 'Graduated higher secondary education.' },
  { id: 2, year: '2024', title: 'Started Engineering at MBCET', description: 'Embarked on my B.Tech journey in Electronics and Communication.' },
  { id: 3, year: '2024', title: 'Joined FRAMES MBCET', description: 'Became a member of the official photography club.' },
  { id: 4, year: '2025', title: 'Completed 1st semester', description: 'Successfully finished the first semester.' },
  { id: 5, year: '2025', title: 'Joined ISTE SC MBCET', description: 'Selected as PR and Media Junior Execom member.' },
  { id: 6, year: '2025', title: 'Completed 2nd semester', description: 'Finished freshman year of engineering.' },
  { id: 7, year: '2025', title: 'Promoted as Creative Curator', description: 'Elevated to Creative Curator at FRAMES MBCET.' },
  { id: 8, year: '2025', title: 'Promoted as PR & Media Head', description: 'Elevated to PR and Media Head at ISTE SC MBCET.' },
  { id: 9, year: '2026', title: 'Media Head & Core Coordinator', description: 'Led media for NEXORA 26\' - 24th All Kerala ISTE Annual Student State Convention.' },
  { id: 10, year: 'Present', title: 'Learning Full Stack & Design', description: 'Currently mastering Full Stack Development and UI/UX designing in Figma.' },
];

const Timeline = () => {
  const containerRef = useRef(null);
  const [milestones, setMilestones] = useState(timelineData);
  const { scrollXProgress } = useScroll({ container: containerRef });
  
  useEffect(() => {
    const query = '*[_type == "milestone"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) {
        setMilestones(data);
      }
    }).catch(console.error);
  }, []);

  // Use scroll progress to draw the active line
  const scaleX = useTransform(scrollXProgress, [0, 1], [0, 1]);

  // Emotional background shift: Time passing from crisp morning to golden hour
  const backgroundColor = useTransform(scrollXProgress, [0, 1], ["#ffffff", "#fff0e5"]);

  return (
    <motion.section className="timeline-section" id="timeline" style={{ backgroundColor }}>
      <div className="container">
        <motion.div
          className="timeline-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">{"// my journey"}</span>
          <h2 className="section-title">
            The <span>Timeline</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            A visual roadmap of my academic and professional milestones. Scroll horizontally to explore the graph.
          </p>
        </motion.div>
      </div>

      <div className="timeline-scroll-wrapper" ref={containerRef}>
        <div className="timeline-track-container">
          {/* The background track line */}
          <div className="timeline-line-bg" />
          
          {/* The active track line that fills as you scroll */}
          <motion.div className="timeline-line-active" style={{ scaleX, transformOrigin: 'left' }} />

          {/* The Nodes */}
          <div className="timeline-nodes">
            {milestones.map((item, index) => {
              const isTop = index % 2 === 0;
              return (
                <motion.div
                  key={item._id || item.id}
                  className={`timeline-node-wrapper ${isTop ? 'node-top' : 'node-bottom'}`}
                  initial={{ opacity: 0, y: isTop ? 20 : -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ root: containerRef, margin: '0px 100px 0px 0px', once: true }}
                >
                  <div className="timeline-content glass-card">
                    <span className="timeline-year">
                      <DecryptedText text={item.year} speed={60} />
                    </span>
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-desc">{item.description}</p>
                  </div>
                  <div className="timeline-point">
                    <div className="timeline-point-inner heartbeat-pulse" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Timeline;
