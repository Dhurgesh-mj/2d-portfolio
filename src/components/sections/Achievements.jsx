import React from 'react';
import './achievements.css';
import { PixelMarker, PixelCorner } from '../PixelDecoration/PixelDecoration';

/* 
 * Achievements are derived from REAL portfolio data only.
 * Each milestone is a factual statement about the person's journey.
 */
const MILESTONES = [
  {
    marker: '◆',
    label: 'HALL OF FAME',
    caption: 'Listed in bug bounty halls of fame — vulnerabilities responsibly disclosed, fixed, and credited.',
    source: 'Bug Bounty',
  },
  {
    marker: '◈',
    label: 'CVE TRIPLE',
    caption: 'Three assigned CVEs and counting: CVE-2026-103471, CVE-2026-103472, CVE-2026-102333.',
    source: 'CVE Program',
  },
  {
    marker: '★',
    label: 'HAT-TRICK',
    caption: 'Three 1st-place finishes on stage: Bugathon, Secure Tooling Competition, and Tool Expo.',
    source: 'Competitions',
  },
  {
    marker: '⬣',
    label: 'DISCLOSED',
    caption: 'Vulnerability responsibly reported to and acknowledged by CERT-In, India\u2019s national cybersecurity agency.',
    source: 'CERT-In',
  },
];

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const mapRange = (val, inMin, inMax) => clamp((val - inMin) / (inMax - inMin), 0, 1);

/* CVE IDs get a marker-swipe highlight; all other text renders as-is */
const CVE_RE = /(CVE-\d+-\d+)/g;
const markCVEs = (text) =>
  String(text).split(CVE_RE).map((part, k) =>
    /^CVE-\d+-\d+$/.test(part)
      ? <span key={k} className="mark">{part}</span>
      : part
  );

const Achievements = ({ progress, sectionProgress, isActive }) => {
  const sp = sectionProgress || 0;

  // Draw the timeline rule once the city is established
  const pRule = mapRange(sp, 0.25, 0.85);

  return (
    <section
      className={`achievements-section ${isActive ? 'is-active' : ''}`}
      aria-label="Achievements"
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? 1 : 0,
      }}
    >
      {/* Milestone strip — editorial annotations (chapter title lives in nav) */}
      <div className="achievements-strip">
        <div className="achievements-rule" style={{ '--p-rule': pRule }} />

        {MILESTONES.map((m, i) => {
          // Milestones wait for the city scene: first card lands ~frame 125
          const enterAt = 0.30 + i * 0.13;
          const pPip = mapRange(sp, enterAt, enterAt + 0.05);
          const pCard = mapRange(sp, enterAt + 0.04, enterAt + 0.15);
          
          // Legacy visibility logic for fallback
          const isVisible = isActive && sp >= enterAt;

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
