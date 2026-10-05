import React from 'react';
import './about.css';
import ComicTextBox from '../ComicTextBox/ComicTextBox';
import { ChapterLabel, PixelMarker } from '../PixelDecoration/PixelDecoration';
import { Typewriter } from '../TextFX/TextFX';
import { portfolio } from '../../data/portfolio';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const mapRange = (val, inMin, inMax) => clamp((val - inMin) / (inMax - inMin), 0, 1);

const About = ({ progress, sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;

  const pLabel = mapRange(sp, 0.10, 0.25);
  const pBio = mapRange(sp, 0.20, 0.40);
  const pInterests = mapRange(sp, 0.45, 0.65);
  const pLocation = mapRange(sp, 0.70, 0.85);
  
  const exitP = mapRange(sp, 0.85, 1.0);
  const globalOpacity = 1 - exitP;

  const { bio, interests, location } = portfolio.about;

  return (
    <section
      className={`about-section ${isActive ? 'is-active' : ''}`}
      aria-label="Identity and Background"
      style={{ 
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? globalOpacity : 0
      }}
    >
      <div className="about-content">
        
        <div className="about-reveal" style={{ '--p': pLabel }}>
          <ChapterLabel number={2} title="IDENTITY" />
        </div>

        <div className="about-bio" style={{ '--p': pBio }}>
          <ComicTextBox variant="dark">
            <p><Typewriter text={bio} p={pBio} /></p>
          </ComicTextBox>
        </div>

        <div className="about-interests" style={{ '--p': pInterests }}>
          <h3 className="interests-title">Interests</h3>
          <ul className="interests-list">
            {interests.map((interest, i) => {
              // Ensure the stagger completely finishes before pInterests reaches 1.0
              const staggerStart = (i / (interests.length - 1)) * 0.5;
              const pItem = mapRange(pInterests, staggerStart, staggerStart + 0.5);
              return (
                <li key={i} className="interest-item" style={{ '--p-item': pItem }}>
                  <PixelMarker active /> <span>{interest}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="about-location" style={{ '--p': pLocation }}>
          <span className="location-text">LOC: {location}</span>
        </div>
      </div>
    </section>
  );
};

export default React.memo(About);
