import React, { useEffect, useState, useMemo, memo } from 'react';
import './Testimonials.css';
import { motion } from 'framer-motion';
import { client, urlFor } from '../sanity';
import { FiMessageCircle } from 'react-icons/fi';
import { useStory } from '../contexts/StoryContext';

/* ── Helpers (module-level — never recreated) ── */
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

/* Memoized card so marquee re-render doesn't repaint every card */
const TestimonialCard = memo(({ item }) => (
  <div className="testimonial-card glass-card">
    <FiMessageCircle className="quote-icon" />
    <p className="testimonial-quote">"{item.quote}"</p>

    <div className="testimonial-user">
      <div className="avatar-wrapper">
        {item.imgUrl ? (
          <img
            src={item.imgUrl}
            alt={item.name}
            className="user-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {getInitials(item.name)}
          </div>
        )}
        <span className="avatar-ring" />
      </div>

      <div className="user-info">
        <h4 className="user-name">{item.name}</h4>
        <p className="user-role">{item.designation || item.role}</p>
      </div>
    </div>
  </div>
));

const defaultQuotes = [
  { name: 'Placeholder Client', role: 'CEO, Tech Corp',     quote: 'Adhithya is a phenomenal developer who brings engineering precision to every project. Highly recommended!' },
  { name: 'Design Lead',        role: 'Creative Studio',    quote: 'An amazing eye for detail. The UI/UX work produced was top-notch and exactly what we needed.' },
  { name: 'Tech Lead',          role: 'Startup Inc',        quote: 'Delivered beyond expectations. The system architecture is robust, scalable, and extremely well-documented.' },
];

const Testimonials = () => {
  const [quotes, setQuotes] = useState([]);
  
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('testimonials');

  useEffect(() => {
    client
      .fetch('*[_type == "testimonial"] | order(order asc)')
      .then((data) => { if (data?.length) setQuotes(data); })
      .catch(console.error);
  }, []);

  /* Pre-compute image URLs once — not inside JSX on every render */
  const enriched = useMemo(() => {
    const base = quotes.length > 0 ? quotes : defaultQuotes;
    return base.map((q) => ({
      ...q,
      imgUrl: q.image ? urlFor(q.image).width(80).height(80).fit('crop').url() : null,
    }));
  }, [quotes]);

  /* Only duplicate — 2 groups in JSX handle the seamless loop */
  const loop = useMemo(() => [...enriched, ...enriched], [enriched]);

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <motion.div
          className="testimonials-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">{"// recommendations"}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Endorsements">
              <span className="section-title-inner">Kind <span>Words</span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('testimonials')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
        </motion.div>
      </div>

      {/* Full-width marquee outside the container so it can bleed edge-to-edge */}
      <div className="marquee-container">
        <div className="marquee-track">
          <div className="marquee-content">
            {loop.map((item, i) => <TestimonialCard key={`a-${i}`} item={item} />)}
          </div>
          <div className="marquee-content" aria-hidden="true">
            {loop.map((item, i) => <TestimonialCard key={`b-${i}`} item={item} />)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
