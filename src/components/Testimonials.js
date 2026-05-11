import React, { useEffect, useState } from 'react';
import './Testimonials.css';
import { motion } from 'framer-motion';
import { client, urlFor } from '../sanity';
import { FiMessageCircle } from 'react-icons/fi';

const Testimonials = () => {
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    const query = '*[_type == "testimonial"] | order(order asc)';
    client.fetch(query).then((data) => {
      if (data && data.length > 0) setQuotes(data);
    }).catch(console.error);
  }, []);

  const defaultQuotes = [
    { name: "Placeholder Client", role: "CEO, Tech Corp", quote: "Adhithya is a phenomenal developer who brings engineering precision to every project. Highly recommended!" },
    { name: "Design Lead", role: "Creative Studio", quote: "An amazing eye for detail. The UI/UX work produced was top-notch and exactly what we needed." }
  ];

  const displayQuotes = quotes.length > 0 ? quotes : defaultQuotes;

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <motion.div
          className="testimonials-header"
          initial={{ opacity: 1, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// recommendations</span>
          <h2 className="section-title" data-hover="Endorsements">
            <span className="section-title-inner">Kind <span>Words</span></span>
          </h2>
          <div className="section-divider" />
        </motion.div>

        <div className="testimonials-grid">
          {displayQuotes.map((item, i) => (
            <motion.div
              key={i}
              className="testimonial-card glass-card"
              initial={{ opacity: 1, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <FiMessageCircle className="quote-icon" />
              <p className="testimonial-quote">"{item.quote}"</p>
              <div className="testimonial-user">
                {item.image && (
                  <img src={urlFor(item.image).url()} alt={item.name} className="user-img" loading="lazy" decoding="async" />
                )}
                <div className="user-info">
                  <h4 className="user-name">{item.name}</h4>
                  <p className="user-role">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
