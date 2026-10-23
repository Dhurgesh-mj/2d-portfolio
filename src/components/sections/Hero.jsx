import React from 'react';
import './hero.css';
import ComicTextBox from '../ComicTextBox/ComicTextBox';
import { SplitText, Typewriter } from '../TextFX/TextFX';
import { portfolio } from '../../data/portfolio';
import { mapRange } from '../../lib/progress';

const Hero = ({ sectionProgress, isActive, openProgress = 0 }) => {
  const sp = sectionProgress || 0;

  // A3 handoff: the opening beat drives the reveals until the reader scrolls,
  // then real scroll progress takes over. max() keeps the handoff continuous.
  const reveal = Math.max(sp, openProgress);

  // Staggered cinematic reveals
  const pName    = mapRange(reveal, 0.20, 0.40);
  const pRole    = mapRange(reveal, 0.30, 0.50);
  const pTagline = mapRange(reveal, 0.45, 0.65);
  const pScroll  = mapRange(reveal, 0.65, 0.80);

  // Exit fade out at the very end — keyed to real scroll, not the beat, so
  // the hero doesn't fade while the reader is still at the top.
  const exitP = mapRange(sp, 0.85, 1.0);
  const globalOpacity = 1 - exitP;

  const { name, role, tagline } = portfolio.hero;

  return (
    <section
      className={`hero-section ${isActive ? 'is-active' : ''}`}
      aria-label="Introduction"
      inert={!isActive}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? globalOpacity : 0,
      }}
    >
      <div className="hero-content">

        <h1 className="hero-name" style={{ '--p': pName }}>
          <SplitText text={name} p={pName} />
        </h1>

        {/* A styled badge, not a section heading — it was an h2 sitting above
            h3 card titles in later chapters, inverting the outline. */}
        <p className="hero-role" style={{ '--p': pRole }}>
          <span className="mark">{role}</span>
        </p>

        <div className="hero-tagline" style={{ '--p': pTagline }}>
          <ComicTextBox variant="dark">
            <p><Typewriter text={tagline} p={pTagline} /></p>
          </ComicTextBox>
        </div>

        {/* Scroll indicator — reveals after tagline, fades with exit */}
        <div className="hero-scroll-hint" style={{ '--p': pScroll }}>
          <span className="scroll-hint__label">SCROLL</span>
          <span className="scroll-hint__arrow" aria-hidden="true">▼</span>
        </div>
      </div>
    </section>
  );
};

export default React.memo(Hero);
