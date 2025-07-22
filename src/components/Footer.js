import React from 'react';
import './Footer.css';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
    >
      {/* Stars Background */}
      <div className="footer-stars"></div>

      {/* Embedded SVG Wave */}
      <div className="footer-wave"></div>

      <div className="footer-content">

        <div className="footer-signature">
          <svg viewBox="0 0 200 60" className="footer-signature-svg" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
              fill="none" stroke="#00f0ff" strokeWidth="1.5"
              fontFamily="Sterion, sans-serif" fontSize="36">
              ADHY
              <animate attributeName="stroke-dasharray" from="0,200" to="200,0" dur="3s" repeatCount="indefinite" />
            </text>
          </svg>
        </div>

        <div className="footer-connect">
          <p>Liked my works?<br />Let’s connect via <strong>WhatsApp!</strong></p>
          <a href="https://wa.me/919539066643" target="_blank" rel="noopener noreferrer">
            <div className="footer-button">
              <span>↗</span>
            </div>
          </a>
        </div>

        <div className="footer-socials">
          <h3>My Socials</h3>
          <ul>
            <li><i className="fab fa-linkedin-in"></i> www.linkedin.com/in/adhithya-mohan-s</li>
            <li><i className="fab fa-instagram"></i> @zoomout_images</li>
            <li><i className="fab fa-discord"></i> @adhithya_mohan</li>
            <li><i className="fas fa-envelope"></i> adhithyamohan2312@gmail.com</li>
          </ul>
        </div>

        <div className="footer-bottom">
          <p>All Rights Reserved © <strong>Adhithya</strong> 2025</p>
          <p>Designed with 💙 · Built with ⚛ React</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
