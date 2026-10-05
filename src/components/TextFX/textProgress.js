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

/** How many leading characters of the decoder have resolved at progress `p`.
 *  Snaps to fully resolved at/above 0.9 — scroll-driven drivers (coverflow
 *  focus, lerped progress) hover near 1 without ever landing on it exactly,
 *  which used to leave the final glyph flickering forever. */
export function decodeCount(text, p) {
  if (p >= 0.9) return text.length;
  return Math.floor(p * text.length + 0.0001);
}
