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
  const opacity = clamp01(1.15 - abs * 0.95);
  if (opacity <= 0) return { isVisible: false };
  const focus = clamp01(1 - abs * 1.1);
  return {
    isVisible: true,
    opacity,
    focus,
    transform:
      `translateX(${(off * 13).toFixed(2)}rem) ` +
      `rotateY(${(off * 38).toFixed(2)}deg) ` +
      `translateZ(${(-abs * 10).toFixed(2)}rem)`,
    filter: `brightness(${(1 - Math.min(0.45, abs * 0.4)).toFixed(3)})`,
    zIndex: 20 - Math.round(Math.min(9, abs * 10)),
  };
}
