export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Per-letter progress for the SplitText cascade: letter `i` of `n`
 * animates 0→1 as the parent progress `p` sweeps past its slot,
 * overlapping slightly with its neighbors. The stagger is solved so the
 * final letter lands exactly at p = 1 (no hanging tail).
 */
export function letterProgress(p, i, n) {
  const count = Math.max(1, n);
  const stagger = 1 / (count + 0.6);
  const duration = 1.6 * stagger;
  const raw = (p - i * stagger) / duration;
  // snap float dust at the boundaries so end states land exactly
  if (raw >= 0.9999995) return 1;
  if (raw <= 0.0000005) return 0;
  return clamp01(raw);
}

/** Visible character count for the scroll-driven Typewriter. */
export function typewriterCount(text, p) {
  return Math.floor(p * text.length + 0.0001);
}

export const DECODE_GLYPHS = '▓#%&@?/\\|<>+=';

/** Deterministic scrambling glyph for position `i` at animation `tick`. */
export function glyphAt(i, tick) {
  const set = DECODE_GLYPHS;
  return set[(i * 7 + tick * 3) % set.length];
}

/** Fraction of progress after which the text is treated as fully resolved.
 *  Early enough that a card at rest always reads clean. */
const DECODE_SETTLE_AT = 0.85;

/** How many leading characters of the decoder have resolved at progress `p`.
 *
 *  Resolves the tail slightly early and continuously, so a card that has come to
 *  rest never shows a glyph still scrambling.
 *
 *  This used to snap via a hard `p >= 0.9` shortcut on the assumption that
 *  scroll-driven drivers "hover near 1". They don't: coverflow's
 *  `focus = 1 - |off| * 1.1` routinely settles at ~0.89, which fell *under* the
 *  threshold and left the project's final character permanently scrambled —
 *  a card parked on screen looking broken rather than mid-decode. A hard
 *  threshold also makes the count jump discontinuously, so the last glyph pops
 *  instead of settling. */
export function decodeCount(text, p) {
  if (p <= 0) return 0;
  const settled = Math.min(1, p / DECODE_SETTLE_AT);
  return Math.min(text.length, Math.ceil(settled * text.length));
}
