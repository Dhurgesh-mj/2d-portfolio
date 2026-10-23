/**
 * Frame-rate-independent exponential smoothing.
 *
 * useScrollProgress lerped toward the scroll target with a fixed per-frame
 * factor (0.12). On a 144Hz display that factor is applied 2.4x more often
 * than on a 60Hz one, so the same flick read as ~40% snappier and a full
 * settle took less than half the wall-clock time. Fixing it in the hook by
 * handrolling the exponent every frame is exactly the kind of math that wants
 * to be a pure, unit-tested function.
 *
 * The old per-frame lerp was `c += (t - c) * 0.12`. Once-per-frame at ~60fps
 * is expressed as a rate per reference frame; the effective factor for a
 * given delta of real time is 1 - (1 - rate)^(dt / frameRefMs), so the summed
 * exponent over N smaller steps equals the exponent over their summed dt and
 * the motion is identical regardless of display refresh rate.
 */

/** One rate unit = "per 60fps frame", matching the original fixed-factor feel. */
export const FRAME_REF_MS = 1000 / 60;

/**
 * Move `current` toward `target` by whatever a `dt`-ms frame is worth of the
 * smoothing rate. At dt = FRAME_REF_MS the behaviour is identical to the old
 * fixed `* 0.12` per frame.
 *
 * @param {number} current  current lerped value
 * @param {number} target   value to approach
 * @param {number} dt       real elapsed milliseconds since the last tick
 * @param {object} [opts]
 * @param {number} [opts.rate]     per-reference-frame lerp factor (0..1)
 * @param {number} [opts.epsilon]  snap threshold — call it done when this close
 * @param {number} [opts.maxDt]    dt upper clamp; a background tab pauses rAF,
 *                                 and this stops the next visible tick from
 *                                 teleporting the value across the whole gap
 * @returns {number}
 */
export function settleLerp(current, target, dt, { rate = 0.12, epsilon = 0.001, maxDt = 200 } = {}) {
  if (dt <= 0 || current === target) return current;

  const clamped = Math.min(Math.max(dt, 0), maxDt);
  let next = current + (target - current) * (1 - Math.pow(1 - rate, clamped / FRAME_REF_MS));

  // Same converge rule the hook had before: don't asymptote forever.
  if (Math.abs(target - next) < epsilon) next = target;
  return next;
}
