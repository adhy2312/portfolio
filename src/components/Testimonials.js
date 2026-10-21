import React, { useEffect, useState, useMemo, memo, useRef } from 'react';
import './Testimonials.css';
import { client, urlFor } from '../sanity';
import { FiMessageCircle } from 'react-icons/fi';
import { useStory } from '../contexts/StoryContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Helpers (module-level — never recreated) ── */
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

/* Memoized card — V200 with stars + verified badge */
const TestimonialCard = memo(({ item }) => {
  const stars = item.stars || 5;
  return (
    <div className="testimonial-card glass-card">
      <FiMessageCircle className="quote-icon" />

      {/* V200: Star rating row */}
      <div className="testimonial-stars" aria-label={`${stars} out of 5 stars`}>
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} className="star">★</span>
        ))}

      </div>

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
          <p className="user-role">
            {(item.designation && item.designation.trim() !== '-')
              ? item.designation
              : (item.role && item.role.trim() !== '-' ? item.role : '')}
          </p>
        </div>
      </div>
    </div>
  );
});

const defaultQuotes = [
  {
    name: 'Snith Shibu',
    designation: 'Mentor, ISTE SC MBCET',
    quote: 'Working with Adhithya has always been a pleasure. His enthusiasm, curiosity, and positive attitude are contagious, and he consistently brings fresh perspectives to any discussions. What truly sets him apart is his ability to quickly learn new skills, adapt to changing situations, and contribute meaningfully wherever he is placed.',
    stars: 5,
  },
  {
    name: 'Kiran Biju',
    designation: 'Mentor, ISTE SC MBCET',
    quote: 'Adhithya has been a highly dedicated and versatile contributor to ISTE activities. He has supported the team in various areas including data handling, documentation, poster designing, event coordination, and organizational tasks. What stands out about him is his creativity, responsibility, and willingness to take initiative whenever needed.',
    stars: 5,
  },
  {
    name: 'Sherry Varghese George',
    designation: 'Faculty Coordinator, FRAMES MBCET | Asst. Professor, ECE',
    quote: 'Adhithya is a member of our FRAMES – MBCET Photography Club and deserves special appreciation for his outstanding work during the coverage of institutional events. His sharp compositions, mastery of lighting, and ability to capture the moment were top-notch. Add to that his reliability, and you have someone every team would want behind the camera.',
    stars: 5,
  },
];

const Testimonials = () => {
  const [quotes, setQuotes] = useState([]);
  const headerRef = useRef(null);
  const sectionRef = useRef(null);

  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('testimonials');

  useEffect(() => {
    client
      .fetch('*[_type == "testimonial" && !(_id in path("drafts.**"))] | order(order asc, _createdAt asc)')
      .then((data) => {
        if (data && data.length > 0) {
          setQuotes(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load testimonials from Sanity:', err);
      });
  }, []);

  // GSAP header animation
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        const els = headerRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider');
        gsap.fromTo(els,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* Pre-compute image URLs once — not inside JSX on every render */
  const enriched = useMemo(() => {
    const base = quotes.length > 0 ? quotes : defaultQuotes;
    return base.map((q) => ({
      ...q,
      imgUrl: q.image ? urlFor(q.image).width(80).height(80).fit('crop').url() : null,
    }));
  }, [quotes]);

  /* Repeat the items multiple times to guarantee the track is wider than 4K/ultra-wide screens */
  const loop = useMemo(() => {
    // If there are very few quotes, we need more repeats to fill an ultrawide screen
    // 3 items * 5 repeats = 15 items per block. 15 * 400px = 6000px width.
    return [...enriched, ...enriched, ...enriched, ...enriched, ...enriched];
  }, [enriched]);

  return (
    <section className="testimonials" id="testimonials" ref={sectionRef}>
      <div className="container">
        <div className="testimonials-header" ref={headerRef}>
          <span className="section-label">{"// recommendations"}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Endorsements">
              <span className="section-title-inner">Testimonials</span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('testimonials')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
        </div>
      </div>

      {/* Full-width marquee outside the container so it can bleed edge-to-edge */}
      <div className="testi-marquee-container">
        <div className="testi-marquee-track">
          <div className="testi-marquee-content">
            {loop.map((item, i) => <TestimonialCard key={`a-${i}`} item={item} />)}
          </div>
          <div className="testi-marquee-content" aria-hidden="true">
            {loop.map((item, i) => <TestimonialCard key={`b-${i}`} item={item} />)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
