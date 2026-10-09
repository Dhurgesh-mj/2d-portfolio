import React, { useState, useCallback } from 'react';
import './contact.css';
import { Magnetic } from '../Interactive/Interactive';
import { portfolio } from '../../data/portfolio';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const mapRange = (val, inMin, inMax) => clamp((val - inMin) / (inMax - inMin), 0, 1);

const Contact = ({ progress, sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;
  const [copied, setCopied] = useState(false);

  const pTitle   = mapRange(sp, 0.20, 0.40);
  const pTagline = mapRange(sp, 0.35, 0.55);
  const pLinks   = mapRange(sp, 0.50, 0.70);

  const { email, github, linkedin, tagline } = portfolio.contact;

  const handleEmailClick = useCallback((e) => {
    e.preventDefault();
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Fallback: open mailto if clipboard fails
        window.location.href = `mailto:${email}`;
      });
  }, [email]);

  return (
    <section
      className={`contact-section ${isActive ? 'is-active' : ''}`}
      aria-label="Contact and Next Chapter"
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? 1 : 0,
      }}
    >
      <div className="contact-content">

        <h2 className="contact-title" style={{ '--p': pTitle }}>
          THE NEXT CHAPTER
        </h2>

        <div className="contact-tagline" style={{ '--p': pTagline }}>
          <span className="mark">{tagline}</span>
        </div>

        <div className="contact-links" style={{ '--p': pLinks }}>
          {email && (
            <Magnetic strength={6} className="magnetic--block">
              <button
                className="contact-link contact-link--email"
                onClick={handleEmailClick}
                title={copied ? 'Copied!' : `Copy ${email}`}
                aria-label={copied ? 'Email copied to clipboard' : `Copy email address: ${email}`}
              >
                <span className="contact-link__text">
                  {copied ? 'COPIED ✓' : 'EMAIL'}
                </span>
                <span className="contact-link__arrow">{copied ? '' : '→'}</span>
              </button>
            </Magnetic>
          )}

          {github && (
            <Magnetic strength={6} className="magnetic--block">
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <span className="contact-link__text">GITHUB</span>
                <span className="contact-link__arrow">→</span>
              </a>
            </Magnetic>
          )}

          {linkedin && (
            <Magnetic strength={6} className="magnetic--block">
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <span className="contact-link__text">LINKEDIN</span>
                <span className="contact-link__arrow">→</span>
              </a>
            </Magnetic>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(Contact);
