// src/components/Contact.js — V200
import React, { useRef, useState, useEffect } from 'react';
import './Contact.css';
import emailjs from 'emailjs-com';
import { FiSend, FiMail, FiMapPin, FiLinkedin, FiCheckCircle, FiXCircle, FiCheck, FiCopy } from 'react-icons/fi';
import { client } from '../sanity';
import { useStory } from '../contexts/StoryContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Live Kerala Clock ── */
const useKeralaTime = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => {
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const h = ist.getHours().toString().padStart(2,'0');
      const m = ist.getMinutes().toString().padStart(2,'0');
      setTime(`${h}:${m} IST`);
    };
    fmt();
    const id = setInterval(fmt, 30000);
    return () => clearInterval(id);
  }, []);
  return time;
};


// ── Click-to-copy email component ──────────────────
const CopyEmail = ({ email }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <button
      className={`copy-email-btn ${copied ? 'copy-email-btn--copied' : ''}`}
      onClick={handleCopy}
      aria-label={copied ? 'Email copied!' : 'Click to copy email'}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      <span className="copy-email-text">{email}</span>
      <span className="copy-email-hint">
        {copied
          ? <><FiCheck size={11} /> Copied!</>
          : <><FiCopy size={11} /> Click to copy</>}
      </span>
    </button>
  );
};

const defaultContactInfo = [
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
  const sectionRef  = useRef(null);
  const headerRef   = useRef(null);
  const infoRef     = useRef(null);
  const formWrapRef = useRef(null);
  const keralaTime  = useKeralaTime();
  
  const { getStoryForSection, openStory } = useStory();
  const hasStory = !!getStoryForSection('contact');
  const [contactData, setContactData] = useState(null);

  useEffect(() => {
    const query = '*[_type == "contact"][0]';
    client.fetch(query).then((data) => {
      if (data) setContactData(data);
    }).catch(console.error);
  }, []);

  // GSAP Scroll Animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider, .section-desc');
        gsap.fromTo(headerEls,
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

      // Info panel: slide from left
      if (infoRef.current) {
        gsap.fromTo(infoRef.current,
          { x: -60, opacity: 0 },
          {
            x: 0, opacity: 1,
            duration: 1,
            ease: 'power4.out',
            scrollTrigger: { trigger: infoRef.current, start: 'top 85%', once: true }
          }
        );
      }

      // Form: slide from right
      if (formWrapRef.current) {
        gsap.fromTo(formWrapRef.current,
          { x: 60, opacity: 0 },
          {
            x: 0, opacity: 1,
            duration: 1,
            delay: 0.15,
            ease: 'power4.out',
            scrollTrigger: { trigger: formWrapRef.current, start: 'top 85%', once: true }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const sendEmail = (e) => {
    e.preventDefault();
    setStatus('sending');

    emailjs
      .sendForm(
        'service_25wh03l',
        'template_hdpyibu',
        form.current,
        'dcGuY9_4lV1xSr5zN'
      )
      .then(
        (response) => {
          console.log('SUCCESS!', response.status, response.text);
          setStatus('success');
          form.current.reset();
          setTimeout(() => setStatus('idle'), 5000);
        },
        (error) => {
          console.error('FAILED...', error);
          setStatus('error');
          setTimeout(() => setStatus('idle'), 5000);
        }
      );
  };

  return (
    <section id="contact" className="contact" ref={sectionRef}>
      <div className="container">
        <div className="contact-header" ref={headerRef}>
          <span className="section-label">{'// say hello'}</span>
          <div className="section-title-wrapper">
            <h2 className="section-title" data-hover="Get in Touch">
              <span className="section-title-inner">Let's <span>Connect</span></span>
            </h2>
            {hasStory && (
              <button className="story-btn" onClick={() => openStory('contact')} aria-label="Read story behind this section">
                <span>✦</span> See Story
              </button>
            )}
          </div>
          <div className="section-divider" />
          <p className="section-desc">
            Whether you have a project in mind, a collaboration idea, or just want to say hi —
            my inbox is always open.
          </p>
        </div>

        <div className="contact-grid">
          {/* Info panel */}
          <div className="contact-info" ref={infoRef}>
            <div className="contact-info-card glass-card">
              {/* V200: Local time strip */}
              {keralaTime && (
                <div className="contact-time-strip">
                  <span className="contact-time-strip-dot" />
                  <span className="contact-time-strip-label">My local time —</span>
                  <span className="contact-time-strip-value">{keralaTime}, Kerala, India</span>
                </div>
              )}

              <h3 className="contact-info-title">Get in touch</h3>
              <p className="contact-info-text">
                I'm currently open to full-time roles, freelance projects, and interesting
                collaborations. Let's build something great together.
              </p>

              {/* V200: Response time promise */}
              <div className="contact-response-badge">
                Usually replies within 24 hours
              </div>

              <div className="contact-info-list">
                {(contactData?.contactMethods || defaultContactInfo).map((item, i) => (
                  <div key={i} className="contact-info-item">
                    <span className="contact-info-icon">{item.icon}</span>
                    <div>
                      <span className="contact-info-label">{item.label}</span>
                      {item.label === 'Email' ? (
                        <CopyEmail email={item.value} />
                      ) : item.href ? (
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
          </div>

          {/* Form */}
          <div className="contact-form-wrap" ref={formWrapRef}>
            <form ref={form} onSubmit={sendEmail} className="contact-form glass-card">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    name="user_name"
                    placeholder="What's your name?"
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
                className={`btn-primary form-submit magnetic-btn ${status === 'sending' ? 'submitting' : ''}`}
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
