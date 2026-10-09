import React from 'react';
import './achievements.css';
import { PixelMarker, PixelCorner } from '../PixelDecoration/PixelDecoration';
import { portfolio } from '../../data/portfolio';
import { mapRange, staggerRange } from '../../lib/progress';

// Achievements come from portfolio.js — this used to hardcode the list inline,
// the only section that ignored the data file.
const MILESTONES = portfolio.achievements;

/* CVE IDs get a marker-swipe highlight; all other text renders as-is */
const CVE_RE = /(CVE-\d+-\d+)/g;
const markCVEs = (text) =>
  String(text).split(CVE_RE).map((part, k) =>
    /^CVE-\d+-\d+$/.test(part)
      ? <span key={k} className="mark">{part}</span>
      : part
  );

const Achievements = ({ sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;

  // Draw the timeline rule once the city is established
  const pRule = mapRange(sp, 0.25, 0.85);

  // Cards deal in evenly across the second half of the chapter
  const stagger = staggerRange(MILESTONES.length, 0.28, 0.86);

  return (
    <section
      className={`achievements-section ${isActive ? 'is-active' : ''}`}
      aria-label="Achievements"
      inert={!isActive}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? 1 : 0,
      }}
    >
      {/* Milestone strip — editorial annotations (chapter title lives in nav) */}
      <div className="achievements-strip">
        <div className="achievements-rule" style={{ '--p-rule': pRule }} />

        {MILESTONES.map((m, i) => {
          // Even step across the whole strip; the last card finishes exactly on
          // 0.84 rather than wherever the old `0.30 + i * 0.13` landed.
          const pPip = mapRange(sp, stagger.start(i), stagger.start(i) + stagger.duration * 0.35);
          const pCard = mapRange(sp, stagger.start(i) + stagger.duration * 0.3, stagger.end(i));
          
          // Not a fallback — this class is what fires the `stamp-hit` impact animation
          // on .milestone-card the moment a milestone starts arriving.
          const isVisible = isActive && pCard > 0;

          return (
            <div
              key={i}
              className={`milestone ${isVisible ? 'milestone--visible' : ''}`}
              style={{
                '--p-pip': pPip,
                '--p-card': pCard,
                opacity: pCard > 0 ? 1 : 0
              }}
            >
              <div className="milestone-pip">
                <PixelMarker active={true} color="var(--accent)" />
              </div>

              {/* Annotation card */}
              <div className="milestone-card">
                <PixelCorner position="top-left" color="var(--ink)" size={4} />
                <PixelCorner position="bottom-right" color="var(--ink)" size={4} />

                <span className="milestone-marker">{m.marker}</span>
                <span className="milestone-label">{m.label}</span>
                <p className="milestone-caption">{markCVEs(m.caption)}</p>

                {/* Milestones carrying a `cves` array render them as real links
                    to their CVE records rather than leaving the IDs as text. A
                    CVE is the strongest verifiable claim on the page, so it
                    should be checkable by the reader, not asserted. */}
                {m.cves && (
                  <ul className="cve-list">
                    {m.cves.map((cve) => (
                      <li key={cve.id}>
                        <a
                          className="cve-link"
                          href={`https://www.cve.org/CVERecord?id=${cve.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${cve.id} — ${cve.summary} (${cve.cwe}, CVSS ${cve.cvss} ${cve.severity})`}
                        >
                          <span className="cve-link__id">{cve.id}</span>
                          <span className="cve-link__summary">{cve.summary}</span>
                          <span
                            className={`cve-sev cve-sev--${cve.severity.toLowerCase()}`}
                          >
                            {cve.cvss}
                            <span className="cve-sev__word">{cve.severity}</span>
                          </span>
                          <span className="cve-link__arrow" aria-hidden="true">
                            ↗
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                <span className="milestone-source">{m.source}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(Achievements);
