import React from 'react';
import './skills.css';
import ComicPanel from '../ComicPanel/ComicPanel';
import { ChapterLabel } from '../PixelDecoration/PixelDecoration';
import { Decode } from '../TextFX/TextFX';
import { Tilt } from '../Interactive/Interactive';
import { portfolio } from '../../data/portfolio';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const mapRange = (val, inMin, inMax) => clamp((val - inMin) / (inMax - inMin), 0, 1);

// Derive toolchain from portfolio.skills — no more hardcoded JSX
const TOOLCHAIN_CATEGORIES = ['Security', 'Systems', 'Tools'];

const buildToolchainCols = (skills) => {
  const securitySkills = skills.filter(s => s.category === 'Security' || s.category === 'Systems');
  const toolSkills     = skills.filter(s => s.category === 'Tools' || s.category === 'Languages');
  const frontendSkills = skills.filter(s => s.category === 'Frontend');

  return [
    securitySkills.map(s => s.name.toUpperCase()),
    toolSkills.map(s => s.name.toUpperCase()),
    frontendSkills.map(s => s.name.toUpperCase()),
  ];
};

const Skills = ({ progress, sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;
  const skills = portfolio.skills || [];

  const pLabel = mapRange(sp, 0.10, 0.25);

  const exitOpacity = mapRange(sp, 0.84, 0.96);
  const globalOpacity = 1 - exitOpacity;

  const toolchainCols = buildToolchainCols(skills);

  // Stagger editorial words for the "BUILD // BREAK // ANALYZE // DEFEND" line
  const EDITORIAL_WORDS = ['BUILD', 'BREAK', 'ANALYZE', 'DEFEND'];

  return (
    <section
      className={`skills-section ${isActive ? 'is-active' : ''}`}
      style={{
        opacity: isActive ? globalOpacity : 0,
        pointerEvents: (isActive && globalOpacity > 0.1) ? 'auto' : 'none',
      }}
      aria-label="Skills Arsenal"
    >
      <div className="skills-content">

        <div className="skills-header" style={{ '--p': pLabel }}>
          <ChapterLabel number={3} title="ARSENAL" />
        </div>

        <div className="skills-grid">
          {skills.map((skill, index) => {
            const pItem = mapRange(sp, 0.15 + (index * 0.05), 0.30 + (index * 0.05));
            return (
              <div key={index} className="skill-item" style={{ '--p-item': pItem }}>
                <Tilt max={6}>
                  <ComicPanel variant="light">
                    <div className="skill-meta">{skill.category}</div>
                    <h3 className="skill-name"><Decode text={skill.name} p={pItem} /></h3>
                    <p className="skill-desc">{skill.description}</p>
                  </ComicPanel>
                </Tilt>
              </div>
            );
          })}
        </div>

        {/* Toolchain — derived from portfolio.skills */}
        <div className="skills-toolchain">
          <div className="toolchain-header">
            <span className="toolchain-label" style={{ '--p': mapRange(sp, 0.40, 0.50) }}>
              SECURITY TOOLCHAIN
            </span>
            <div className="toolchain-line" style={{ '--p': mapRange(sp, 0.45, 0.60) }} />
          </div>

          <div className="toolchain-grid">
            {toolchainCols.map((col, ci) => (
              <div key={ci} className="toolchain-col">
                {col.map((item, ii) => {
                  const baseDelay = 0.50 + ci * 0.02 + ii * 0.03;
                  return (
                    <span
                      key={ii}
                      className="tc-item"
                      style={{ '--p': mapRange(sp, baseDelay, baseDelay + 0.10) }}
                    >
                      {item}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Staggered editorial words */}
          <div className="toolchain-editorial">
            {EDITORIAL_WORDS.map((word, i) => {
              const pWord = mapRange(sp, 0.70 + i * 0.03, 0.78 + i * 0.03);
              return (
                <React.Fragment key={word}>
                  <span className="editorial-word" style={{ '--p': pWord }}>
                    {word}
                  </span>
                  {i < EDITORIAL_WORDS.length - 1 && (
                    <span className="editorial-sep" style={{ '--p': pWord }}> // </span>
                  )}
                </React.Fragment>
              );
            })}
            <div className="editorial-markers" style={{ '--p': mapRange(sp, 0.83, 0.90) }}>
              <span className="marker-square" />
              <span className="marker-line" />
              <span className="marker-square" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(Skills);
