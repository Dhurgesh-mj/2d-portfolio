/**
 * Shared mutable camera-rig state (singleton).
 * Written by <CameraRig/> every frame, read by canvas layers (Atmosphere)
 * directly — no React re-renders involved.
 *
 * x, y  — lerped pointer position, -0.5 (left/top) .. +0.5 (right/bottom)
 * vel   — smoothed scroll velocity in progress-units per second (>= 0)
 * dir   — sign of the raw per-frame progress delta: -1 up, +1 down, 0 idle.
 *         Was previously discarded (CameraRig took Math.abs), so no layer could
 *         react to which way the reader was travelling.
 */
export const rigState = {
  x: 0,
  y: 0,
  vel: 0,
  dir: 0,
};

export function resetRigState() {
  rigState.x = 0;
  rigState.y = 0;
  rigState.vel = 0;
  rigState.dir = 0;
}