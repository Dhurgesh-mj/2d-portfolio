import React from 'react';
import './navigation.css';

// Representative comic frame per chapter — the filmstrip scrubber
const CHAPTER_FRAMES = [8, 55, 95, 130, 175, 230];
const frameSrc = (n) => `/comic/frame_${String(n).padStart(4, '0')}.webp`;

const Navigation = ({ currentSection = 0, progress = 0, sections = [] }) => {
  // Theme comes from the section definition (measured against the artwork),
  // not from a progress guess — see SECTION_RANGES in App.jsx.
  const activeSection = sections[currentSection] || {};
  const isLightBg = activeSection.theme === 'light';

  const navClasses = `comic-nav ${isLightBg ? 'comic-nav--on-light' : 'comic-nav--on-dark'}`;

  const chapterNum = currentSection + 1 < 10 ? `0${currentSection + 1}` : currentSection + 1;

  // Jump-cut to a chapter (smooth scroll to its range start)
  const scrollToSection = (i) => {
    const s = sections[i];
    if (!s) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, s.start * max - 2), behavior: 'smooth' });
  };
  const sectionFraction = (() => {
    const s = sections[currentSection];
    if (!s) return 0;
    const rangeSize = s.end - s.start;
    if (rangeSize <= 0) return 0;
    return Math.min(1, Math.max(0, (progress - s.start) / rangeSize));
  })();

  return (
    <nav className={navClasses} aria-label="Portfolio navigation">
      {/* Monogram — top left */}
      <div className="comic-nav__monogram">DMJ</div>

      {/* Chapter + section label — top right */}
      {activeSection.label && (
        <div className="comic-nav__header">
          <span className="comic-nav__chapter">{chapterNum}</span>
          <span className="comic-nav__section-label">// {activeSection.label}</span>
        </div>
      )}

      {/* Section progress strip — bottom of screen */}
      <div className="comic-nav__progress-track" role="progressbar" aria-valuenow={Math.round(sectionFraction * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${activeSection.label || 'Section'} progress`}>
        <div
          className="comic-nav__progress-fill"
          style={{ width: `${sectionFraction * 100}%` }}
        />
      </div>

      {/* Chapter filmstrip — clickable thumbnails, bottom center */}
      <div className="comic-nav__filmstrip" role="navigation" aria-label="Chapters">
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`comic-nav__frame ${i === currentSection ? 'comic-nav__frame--active' : ''} ${i < currentSection ? 'comic-nav__frame--done' : ''}`}
            onClick={() => scrollToSection(i)}
            title={`${s.label}`}
            aria-label={`Go to chapter ${i + 1}: ${s.label}`}
            aria-current={i === currentSection ? 'true' : undefined}
          >
            <img src={frameSrc(CHAPTER_FRAMES[i] ?? 1)} alt="" loading="lazy" draggable={false} />
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
