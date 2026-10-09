import React, { useState, useCallback } from 'react';
import './contact.css';
import { Magnetic } from '../Interactive/Interactive';
import { portfolio } from '../../data/portfolio';
import { mapRange } from '../../lib/progress';

const Contact = ({ sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const pTitle   = mapRange(sp, 0.20, 0.40);
  const pTagline = mapRange(sp, 0.35, 0.55);
  const pLinks   = mapRange(sp, 0.50, 0.70);

  const { email, github, linkedin, tagline, cv } = portfolio.contact;

  const handleEmailClick = useCallback((e) => {
    e.preventDefault();
    setCopyFailed(false);
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2600);
      })
      .catch(() => {
        // Fallback: open mailto so the visitor still has a route out
        setCopyFailed(true);
        window.location.href = `mailto:${email}`;
      });
  }, [email]);

  return (
    <section
      className={`contact-section ${isActive ? 'is-active' : ''}`}
      aria-label="Contact and Next Chapter"
      inert={!isActive}
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
                className={`contact-link contact-link--email contact-link--primary${copied ? ' is-confirmed' : ''}${copyFailed ? ' is-failed' : ''}`}
                onClick={handleEmailClick}
                title={copied ? 'Copied to clipboard' : copyFailed ? 'Opening your mail app' : `Copy ${email}`}
                aria-live="polite"
                aria-label={copied ? 'Email address copied to clipboard' : copyFailed ? 'Could not copy, opening your mail app' : `Copy email address: ${email}`}
              >
                <span className="contact-link__text">
                  {copied ? 'COPIED' : copyFailed ? 'OPENING MAIL' : 'EMAIL'}
                </span>
                <span className="contact-link__arrow">{copied ? '✓' : copyFailed ? '' : '→'}</span>
              </button>
            </Magnetic>
          )}

          {github && (
            <Magnetic strength={6} className="magnetic--block">
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link contact-link--secondary"
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
                className="contact-link contact-link--secondary"
              >
                <span className="contact-link__text">LINKEDIN</span>
                <span className="contact-link__arrow">→</span>
              </a>
            </Magnetic>
          )}

          {cv && (
            <a
              href={cv}
              download
              className="contact-link contact-link--secondary"
            >
              <span className="contact-link__text">DOWNLOAD CV</span>
              <span className="contact-link__arrow" aria-hidden="true">↓</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(Contact);
