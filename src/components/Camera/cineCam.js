/**
 * Cine-cam: per-chapter camera choreography for the scroll journey.
 * Each chapter holds [sp, zoom, focusX, focusY] keyframes; progress
 * interpolates between them with smoothstep easing so moves arrive
 * and settle without jerks. Pure math — fully unit-tested.
 *
 * fx/fy are viewport fractions (0.5 = center). Zoom anchors on that point.
 */

const MOVES = {
  hero: [
    [0, 1.0, 0.36, 0.45],
    [1, 1.1, 0.34, 0.44],
  ],
  about: [
    [0, 1.04, 0.42, 0.5],
    [1, 1.04, 0.58, 0.5],
  ],
  skills: [
    [0, 1.05, 0.44, 0.5],
    [1, 1.14, 0.4, 0.48],
  ],
  achievements: [
    [0, 1.12, 0.5, 0.5],
    [1, 1.02, 0.5, 0.48],
  ],
  projects: [
    [0, 1.08, 0.55, 0.5],
    [1, 1.08, 0.62, 0.48],
  ],
  contact: [
    [0, 1.05, 0.5, 0.46],
    [1, 1.0, 0.5, 0.42],
  ],
};

export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** smoothstep: zero velocity at both ends of every move. */
export function ease(t) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * @param sectionId chapter id (unknown ids park on a neutral wide shot)
 * @param sp section progress 0..1
 * @param vel smoothed scroll velocity (progress-units/sec) — adds a brief
 *            zoom-out kick on fast flicks, bounded so it never distracts
 * @param mobile halve all amplitudes on small screens
 */
export function getCinePose(sectionId, sp, vel = 0, mobile = false) {
  const keys = MOVES[sectionId];
  if (!keys) return { zoom: 1, fx: 0.5, fy: 0.5 };

  const p = clamp01(sp);
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (p >= keys[i][0] && p <= keys[i + 1][0]) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }

  const span = b[0] - a[0] || 1;
  const t = ease((p - a[0]) / span);

  let zoom = lerp(a[1], b[1], t);
  let fx = lerp(a[2], b[2], t);
  let fy = lerp(a[3], b[3], t);

  // velocity kick: fast scrolls breathe outward, then settle
  zoom -= Math.min(0.025, Math.max(0, vel) * 0.01);

  if (mobile) {
    zoom = 1 + (zoom - 1) * 0.5;
    fx = 0.5 + (fx - 0.5) * 0.5;
    fy = 0.5 + (fy - 0.5) * 0.5;
  }

  return { zoom: Math.max(0.9, zoom), fx, fy };
}
