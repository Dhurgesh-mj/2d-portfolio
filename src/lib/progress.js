/**
 * Scroll-progress helpers.
 *
 * Every reveal on this site is driven by scroll position, not wall-clock time,
 * so "stagger by 40ms" is not a meaningful instruction — the same 0.05 of
 * chapter progress takes a different amount of real time on every flick.
 *
 * What IS meaningful is that the step between related items is even, and that
 * the whole sequence lands on the same finish line. That is what these helpers
 * express. The ms-valued --stagger-* tokens were removed from variables.css for
 * exactly this reason: they implied a timing the system cannot honour.
 */

export const clamp = (val, min = 0, max = 1) => Math.min(max, Math.max(min, val));

/** Normalise `val` from [inMin, inMax] onto [0, 1], clamped. */
export const mapRange = (val, inMin, inMax) => {
  if (inMax === inMin) return val >= inMax ? 1 : 0;
  return clamp((val - inMin) / (inMax - inMin));
};

/**
 * Evenly stagger `count` items so the first starts at `from` and the LAST one
 * finishes exactly at `to`. Every item gets an identical step and an identical
 * duration — no list hand-rolls its own arithmetic.
 *
 *   staggerRange(4, 0.30, 0.85)
 *   -> step 0.1375, duration 0.1375, starts 0.30 / 0.4375 / 0.575 / 0.7125
 *
 * @param {object} out      optional object to write `start` / `end` onto
 * @returns {{step:number, duration:number}}
 */
export function staggerRange(count, from, to) {
  const n = Math.max(1, count);
  const span = (to - from) / n;
  return {
    step: span,
    duration: span,
    start: (i) => from + i * span,
    end: (i) => from + (i + 1) * span,
  };
}