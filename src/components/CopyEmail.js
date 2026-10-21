import React, { useState } from 'react';
import './CopyEmail.css';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { playCopySuccessChime } from '../utils/sound';

/**
 * Interactive CopyEmail component with dynamic tactile feedback,
 * smooth spring transitions, and native haptic chime.
 */
const CopyEmail = ({ email, variant = 'default' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        playCopySuccessChime();
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {
        // Fallback
        window.location.href = `mailto:${email}`;
      });
    } else {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <div 
      className={`copy-email-wrapper copy-email--${variant} ${copied ? 'is-copied' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        className="copy-email-trigger"
        onClick={handleCopy}
        aria-label={copied ? 'Email copied to clipboard' : `Copy email ${email}`}
        title={copied ? 'Copied to clipboard!' : 'Click to copy email'}
      >
        <span className="copy-email-address">{email}</span>

        <span className="copy-email-icon-box" aria-hidden="true">
          {copied ? (
            <FiCheck className="copy-icon-check" size={13} />
          ) : (
            <FiCopy className="copy-icon-idle" size={13} />
          )}
        </span>
      </button>

      {/* Dynamic tactile feedback pill */}
      <div className={`copy-email-feedback ${copied ? 'feedback--active' : ''}`} aria-live="polite">
        <span className="feedback-dot" />
        <span className="feedback-text">
          {copied ? 'Copied to clipboard ✓' : 'Click to copy'}
        </span>
      </div>
    </div>
  );
};

export default CopyEmail;
