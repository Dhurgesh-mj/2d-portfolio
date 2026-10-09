export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * 3D coverflow pose for a card whose focus window is centered at `center`
 * (absolute scroll progress) given the current section progress `sp`.
 * off = 0 → card centered (faces forward); |off| grows → card swings
 * aside, turns its edge to the camera, recedes and dims.
 */
export function calculateCoverflow(center, sp) {
  const off = (center - sp) / 0.33;
  const abs = Math.abs(off);

  // Solid until the card is genuinely off to the side, then fade.
  //
  // This was `1.15 - |off| * 0.95`, which is already 0.75 at |off| = 0.42 — a
  // card plainly on screen rendered at 75% opacity, so a quarter of the
  // artwork showed through the paper and the panel read as translucent glass
  // rather than a printed card. The 1.15 overshoot existed to keep the card
  // visible past its centre window, which the fade tail now handles.
  //
  // |off| >= 1 is a full card-spacing away: that is where a card should be gone.
  const HOLD = 0.62; // fully opaque out to here
  const FADE = 0.5; // then fades to nothing over this much more
  const opacity = abs <= HOLD ? 1 : clamp01(1 - (abs - HOLD) / FADE);
  if (opacity <= 0) return { isVisible: false };
  const focus = clamp01(1 - abs * 1.1);

  // Progress for the card's INNER reveals (badge, title, role, tech,
  // description, footer). Separate from `focus` on purpose.
  //
  // Those reveals are gated at 0.2 / 0.3 / 0.4 / 0.5 / 0.6 / 0.7 of `--p` and
  // complete at 0.7 + 1/3. Driving them from `focus` meant a card had to reach
  // dead-centre for its own text to finish arriving — so a card parked
  // slightly off-centre rendered as a blank box with a half-decoded title, and
  // that is exactly what a reader scrolling at an ordinary pace sees.
  //
  // Keyed to the SAME hold window as opacity, a card is fully written by the
  // time it is visible at all, and recedes as a complete card rather than an
  // incomplete one.
  const reveal = clamp01(1 - Math.max(0, abs - HOLD) / FADE);

  // rotateZ is signed off, like rotateY, so a card swings and leans into its
  // turn instead of pivoting on a perfectly vertical axis. That axis is what
  // makes hand-placed paper feel mechanical — real cards sit slightly askew.
  // Kept small on purpose: it is a lean, not a spin.
  const tiltZ = off * 1.4;

  // Side cards recede via opacity, not filter: brightness().
  //
  // `filter` promotes the element to its own compositing layer, which flattens
  // it against the parent's perspective and drops the panel's opaque background
  // — the artwork showed straight through the paper and the panel read as
  // translucent glass. brightness() can only ever darken anyway, so it was
  // never adding anything the opacity ramp below doesn't already do.
  return {
    isVisible: true,
    opacity,
    focus,
    reveal,
    transform:
      `translateX(${(off * 13).toFixed(2)}rem) ` +
      `rotateY(${(off * 38).toFixed(2)}deg) ` +
      `rotateZ(${tiltZ.toFixed(2)}deg) ` +
      `translateZ(${(-abs * 10).toFixed(2)}rem)`,
    zIndex: 20 - Math.round(Math.min(9, abs * 10)),
  };
}
