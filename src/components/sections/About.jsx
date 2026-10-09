import React from 'react';
import './about.css';
import ComicTextBox from '../ComicTextBox/ComicTextBox';
import { PixelMarker } from '../PixelDecoration/PixelDecoration';
import { Typewriter } from '../TextFX/TextFX';
import { portfolio } from '../../data/portfolio';
import { mapRange, staggerRange } from '../../lib/progress';

const About = ({ progress, sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;

  const pBio = mapRange(sp, 0.15, 0.35);
  const pInterests = mapRange(sp, 0.40, 0.60);
  const pExperience = mapRange(sp, 0.62, 0.78);
  // Must complete before exitP starts fading at 0.90 — otherwise the location
  // wipes in while the chapter is already dimming and never reads at full
  // opacity.
  const pLocation = mapRange(sp, 0.78, 0.89);
  
  const exitP = mapRange(sp, 0.90, 1.0);
  const globalOpacity = 1 - exitP;

  const { bio, interests, experience, location } = portfolio.about;

  // Even steps that land every list on the same finish line
  const interestStagger = staggerRange(interests.length, 0.40, 0.62);
  const experienceStagger = staggerRange(experience.length, 0.62, 0.80);

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
        
        <div className="about-bio" style={{ '--p': pBio }}>
          <ComicTextBox variant="dark">
            <p><Typewriter text={bio} p={pBio} /></p>
          </ComicTextBox>
        </div>

        <div className="about-interests" style={{ '--p': pInterests }}>
          <h2 className="interests-title">Interests</h2>
          <ul className="interests-list">
            {interests.map((interest, i) => {
              const pItem = mapRange(
                pInterests,
                interestStagger.start(i),
                interestStagger.end(i)
              );
              return (
                <li key={i} className="interest-item" style={{ '--p-item': pItem }}>
                  <PixelMarker active /> <span>{interest}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Real engagements — the credibility the rest of the page argues for */}
        <div className="about-experience" style={{ '--p': pExperience }}>
          <h2 className="experience-title">Experience</h2>
          <ul className="experience-list">
            {experience.map((role, i) => {
              const pItem = mapRange(
                pExperience,
                experienceStagger.start(i),
                experienceStagger.end(i)
              );
              return (
                <li key={role.organization} className="experience-item" style={{ '--p-item': pItem }}>
                  <span className="experience-role">{role.role}</span>
                  <span className="experience-org">{role.organization}</span>
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
