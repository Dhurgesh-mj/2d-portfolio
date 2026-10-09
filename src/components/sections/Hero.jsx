import React from 'react';
import './hero.css';
import ComicTextBox from '../ComicTextBox/ComicTextBox';
import { ChapterLabel } from '../PixelDecoration/PixelDecoration';
import { SplitText, Typewriter } from '../TextFX/TextFX';
import { portfolio } from '../../data/portfolio';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const mapRange = (val, inMin, inMax) => clamp((val - inMin) / (inMax - inMin), 0, 1);

const Hero = ({ progress, sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;

  // Staggered cinematic reveals
  const pLabel   = mapRange(sp, 0.10, 0.25);
  const pName    = mapRange(sp, 0.20, 0.40);
  const pRole    = mapRange(sp, 0.30, 0.50);
  const pTagline = mapRange(sp, 0.45, 0.65);
  const pScroll  = mapRange(sp, 0.65, 0.80);

  // Exit fade out at the very end
  const exitP = mapRange(sp, 0.85, 1.0);
  const globalOpacity = 1 - exitP;

  const { name, role, tagline } = portfolio.hero;

  return (
    <section
      className={`hero-section ${isActive ? 'is-active' : ''}`}
      aria-label="Introduction"
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? globalOpacity : 0,
      }}
    >
      <div className="hero-content">

        <div className="hero-reveal" style={{ '--p': pLabel }}>
          <ChapterLabel number={1} title="ORIGIN" />
        </div>

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
