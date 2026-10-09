/**
 * Chapter boundaries — the single source of truth.
 *
 * This table used to be declared twice: once in App.jsx (with labels and
 * themes) and once in useScrollProgress.js (bare id/start/end), with App's
 * getSectionState() computing section progress a third time by hand. Three
 * copies of the same boundaries means a range edited in one place silently
 * desyncs the other two — and the `theme` column already had to be documented
 * at length because a `progress > 0.75` guess had been picking paper text over
 * light artwork, failing contrast at 1.3:1.
 *
 * `theme` is the art backdrop the nav text sits against, measured from the
 * frames themselves (mean luminance of the nav's top-left and top-right
 * regions, sampled across each chapter).
 *
 *   theme: 'dark'  -> artwork is dark  -> nav text is paper
 *   theme: 'light' -> artwork is light -> nav text is ink
 *
 * Re-measure and update these if the art sequence changes.
 */
export const SECTION_RANGES = [
  { id: 'hero', label: 'ORIGIN', start: 0, end: 0.15, theme: 'dark' },
  { id: 'about', label: 'IDENTITY', start: 0.15, end: 0.31, theme: 'dark' },
  { id: 'skills', label: 'ARSENAL', start: 0.31, end: 0.48, theme: 'light' },
  { id: 'achievements', label: 'ACHIEVEMENTS', start: 0.48, end: 0.62, theme: 'light' },
  { id: 'projects', label: 'PROJECTS', start: 0.62, end: 0.82, theme: 'light' },
  { id: 'contact', label: 'NEXT CHAPTER', start: 0.82, end: 1.0, theme: 'light' },
];

/**
 * How far through one given chapter an absolute progress value is, clamped 0..1.
 *
 * Distinct from resolveSection(): a chapter component needs ITS OWN progress,
 * not the active chapter's, because every reveal is keyed off it. Values
 * outside the chapter's range clamp to 0 or 1.
 *
 * @param {{start:number,end:number}} section
 * @param {number} progress 0..1
 */
export function sectionProgressFor(section, progress) {
  const range = section.end - section.start;
  if (range === 0) return 0;
  return Math.min(1, Math.max(0, (progress - section.start) / range));
}

/**
 * Which chapter an absolute progress value falls in, and how far through it is.
 *
 * Returns the LAST chapter whose `start` the progress has reached, so progress
 * lands on the chapter that owns it rather than the next one. Exported as a
 * pure function because it is the piece most worth unit-testing — the whole
 * site's reveal choreography is keyed off its output.
 *
 * @param {Array<{id:string,start:number,end:number}>} sections ordered by start
 * @param {number} progress 0..1
 * @returns {{id:string, sectionProgress:number}}
 */
export function resolveSection(sections, progress) {
  let found = { id: sections[0]?.id ?? 'hero', sectionProgress: 0 };
  for (let i = sections.length - 1; i >= 0; i--) {
    const sec = sections[i];
    if (progress >= sec.start) {
      found = { id: sec.id, sectionProgress: sectionProgressFor(sec, progress) };
      break;
    }
  }
  return found;
}