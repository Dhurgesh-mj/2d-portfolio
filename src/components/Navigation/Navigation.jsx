import React, { useCallback, useEffect } from 'react';
import './navigation.css';

// Representative comic frame per chapter — the filmstrip scrubber
const CHAPTER_FRAMES = [8, 55, 95, 130, 175, 230];
const frameSrc = (n) => `/comic/frame_${String(n).padStart(4, '0')}.webp`;

/** Scroll to the first / last chapter. */
export function scrollToIndex(i, sections) {
  const s = sections[i];
  if (!s) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, s.start * max - 2), behavior: 'smooth' });
}

/**
 * Chapter keyboard shortcuts.
 *
 * Deliberately does NOT bind ArrowUp/ArrowDown or PageUp/PageDown. This page is
 * 2200vh tall, so those keys are the reader's primary way to scroll gradually;
 * hijacking them for a 3-4 viewport chapter jump would be hostile. Home/End are
 * safe because "top of page" and "bottom of page" already mean chapter 1 and
 * chapter 6 here.
 *
 * The visible jump affordance is the filmstrip (now with labels and tooltips);
 * this just gives keyboard users a way to reach the ends quickly.
 */
export function useChapterKeys(sections) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      )
        return;

      if (e.key === 'Home') {
        e.preventDefault();
        scrollToIndex(0, sections);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToIndex(sections.length - 1, sections);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sections]);
}

const Navigation = ({ currentSection = 0, progress = 0, sections = [] }) => {
  // Theme comes from the section definition (measured against the artwork),
  // not from a progress guess — see SECTION_RANGES in App.jsx.
  const activeSection = sections[currentSection] || {};
  const isLightBg = activeSection.theme === 'light';

  const navClasses = `comic-nav ${isLightBg ? 'comic-nav--on-light' : 'comic-nav--on-dark'}`;

  const chapterNum = currentSection + 1 < 10 ? `0${currentSection + 1}` : currentSection + 1;

  // Jump-cut to a chapter (smooth scroll to its range start)
  const scrollToSection = useCallback(
    (i) => scrollToIndex(i, sections),
    [sections]
  );

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
            title={`${String(i + 1).padStart(2, '0')} — ${s.label}`}
            aria-label={`Go to chapter ${i + 1}: ${s.label}`}
            aria-current={i === currentSection ? 'true' : undefined}
          >
            <img src={frameSrc(CHAPTER_FRAMES[i] ?? 1)} alt="" loading="lazy" draggable={false} />
            <span className="comic-nav__frame-tip" aria-hidden="true">
              {String(i + 1).padStart(2, '0')} {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Chapter counter — reads at a glance where you are in a 2200vh scroll */}
      <p className="comic-nav__counter" aria-hidden="true">
        <span className="comic-nav__counter-num">{chapterNum}</span>
        <span className="comic-nav__counter-sep">/</span>
        <span className="comic-nav__counter-total">{String(sections.length).padStart(2, '0')}</span>
      </p>

      <p className="comic-nav__hint" aria-hidden="true">
        Home / End — jump chapter
      </p>
    </nav>
  );
};

export default Navigation;
