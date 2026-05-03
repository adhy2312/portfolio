// src/components/Contact.js
import React, { useRef, useState } from 'react';
import './Contact.css';
import emailjs from 'emailjs-com';
import { motion } from 'framer-motion';
import { FiSend, FiMail, FiMapPin, FiLinkedin, FiGithub, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const contactInfo = [
  {
    icon: <FiMail />,
    label: 'Email',
    value: 'adhithyamohan2312@gmail.com',
    href: 'mailto:adhithyamohan2312@gmail.com',
  },
  {
    icon: <FiLinkedin />,
    label: 'LinkedIn',
    value: 'linkedin.com/in/adhithya-mohan-s',
    href: 'https://www.linkedin.com/in/adhithya-mohan-s',
  },
  {
    icon: <FiMapPin />,
    label: 'Location',
    value: 'Kerala, India',
    href: null,
  },
];

const Contact = () => {
  const form = useRef();
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const sendEmail = (e) => {
    e.preventDefault();
    setStatus('sending');

    emailjs
      .sendForm(
        'service_nqcenfz',
        'template_hdpyibu',
        form.current,
        'dcGuY9_4lV1xSr5zN'
      )
      .then(
        () => {
          setStatus('success');
          form.current.reset();
          setTimeout(() => setStatus('idle'), 5000);
        },
        () => {
          setStatus('error');
          setTimeout(() => setStatus('idle'), 5000);
        }
      );
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <motion.div
          className="contact-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="section-label">// say hello</span>
          <h2 className="section-title">
            Let's <span>Connect</span>
          </h2>
          <div className="section-divider" />
          <p className="section-desc">
            Whether you have a project in mind, a collaboration idea, or just want to say hi —
            my inbox is always open.
          </p>
        </motion.div>

        <div className="contact-grid">
          {/* Info panel */}
          <motion.div
            className="contact-info"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="contact-info-card glass-card">
              <h3 className="contact-info-title">Get in touch</h3>
              <p className="contact-info-text">
                I'm currently open to full-time roles, freelance projects, and interesting
                collaborations. Let's build something great together.
              </p>

              <div className="contact-info-list">
                {contactInfo.map((item, i) => (
                  <div key={i} className="contact-info-item">
                    <span className="contact-info-icon">{item.icon}</span>
                    <div>
                      <span className="contact-info-label">{item.label}</span>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="contact-info-value link">
                          {item.value}
                        </a>
                      ) : (
                        <span className="contact-info-value">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="contact-availability">
                <span className="avail-dot" />
                <span>Available for opportunities</span>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            className="contact-form-wrap"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <form ref={form} onSubmit={sendEmail} className="contact-form glass-card">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    name="user_name"
                    placeholder="John Doe"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Email</label>
                  <input
                    type="email"
                    name="user_email"
                    placeholder="john@example.com"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Project collaboration..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  name="message"
                  placeholder="Tell me about your project..."
                  className="form-input form-textarea"
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn-primary form-submit ${status === 'sending' ? 'submitting' : ''}`}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? (
                  <>
                    <span className="spinner" />
                    Sending...
                  </>
                ) : status === 'success' ? (
                  <><FiCheckCircle style={{ marginRight: '6px' }} /> Message Sent!</>
                ) : status === 'error' ? (
                  <><FiXCircle style={{ marginRight: '6px' }} /> Failed — try again</>
                ) : (
                  <>
                    <FiSend />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
