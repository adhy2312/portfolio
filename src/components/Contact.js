// src/components/Contact.js
import React, { useRef } from 'react';
import './Contact.css';
import emailjs from 'emailjs-com';
import { motion } from 'framer-motion';

const Contact = () => {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      'service_nqcenfz', // 🔁 Replace this
      'template_hdpyibu', // 🔁 Replace this
      form.current,
      'dcGuY9_4lV1xSr5zN'   // 🔁 Replace this
    ).then(
      (result) => {
        alert('✅ Message sent!');
        form.current.reset();
      },
      (error) => {
        alert('❌ Failed to send message. Try again.');
      }
    );
  };

  return (
    <motion.section
      id="contact"
      className="contact-section"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2>Contact Me</h2>
      <form ref={form} onSubmit={sendEmail} className="contact-form">
        <input type="text" name="user_name" placeholder="Your Name" required />
        <input type="email" name="user_email" placeholder="Your Email" required />
        <textarea name="message" placeholder="Your Message" required />
        <button type="submit" className="neon-btn">Send</button>
      </form>
    </motion.section>
  );
};

export default Contact;
