/**
 * Shared mutable camera-rig state (singleton).
 * Written by <CameraRig/> every frame, read by canvas layers (Atmosphere)
 * directly — no React re-renders involved.
 *
 * x, y  — lerped pointer position, -0.5 (left/top) .. +0.5 (right/bottom)
 * vel   — smoothed scroll velocity in progress-units per second (>= 0)
 */
export const rigState = {
  x: 0,
  y: 0,
  vel: 0,
};

export function resetRigState() {
  rigState.x = 0;
  rigState.y = 0;
  rigState.vel = 0;
}
