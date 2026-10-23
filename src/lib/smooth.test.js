import { describe, it, expect } from 'vitest';
import { settleLerp, FRAME_REF_MS } from './smooth';

describe('settleLerp', () => {
  it('matches the old fixed per-frame factor at exactly one reference frame', () => {
    // dt of one 60fps frame must reproduce the hook's old `+ (t - c) * 0.12`.
    expect(settleLerp(0.0, 1.0, FRAME_REF_MS)).toBeCloseTo(0.12);
  });

  it('is frame-rate invariant over the same elapsed time (60Hz vs 144Hz)', () => {
    // The whole point of the fix: the same 250ms of scrolling must produce the
    // same value whether it arrived as 15 coarse ticks or 36 fine ones.
    let coarse = 0;
    for (let i = 0; i < 15; i++) coarse = settleLerp(coarse, 1, 250 / 15);

    let fine = 0;
    for (let i = 0; i < 36; i++) fine = settleLerp(fine, 1, 250 / 36);

    expect(fine).toBeCloseTo(coarse, 4);
  });

  it('converges identically in one big step or many small ones', () => {
    let many = 0;
    for (let i = 0; i < 4; i++) many = settleLerp(many, 0.8, 25);
    expect(settleLerp(0, 0.8, 100)).toBeCloseTo(many, 4);
  });

  it('never overshoots and never reverses direction', () => {
    let c = 0;
    for (let i = 0; i < 24; i++) {
      const next = settleLerp(c, 1.0, 16.67);
      expect(next).toBeGreaterThan(c);
      expect(next).toBeLessThanOrEqual(1.0);
      c = next;
    }
  });

  it('snaps to the target once the residual is inside epsilon', () => {
    expect(settleLerp(0.9995, 1.0, FRAME_REF_MS)).toBe(1.0);
  });

  it('does nothing when dt is 0 (first tick of the session)', () => {
    expect(settleLerp(0.3, 0.9, 0)).toBe(0.3);
  });

  it('does nothing when already at the target', () => {
    expect(settleLerp(0.7, 0.7, 33)).toBe(0.7);
  });

  it('clamps a hidden-tab dt so returning does not teleport', () => {
    // rAF pauses while the tab is hidden; the first visible tick carries a
    // huge dt. The clamp bounds it to a fast settle, not an instant jump.
    const out = settleLerp(0.0, 1.0, 60000);
    expect(out).toBeGreaterThan(0.4);
    expect(out).toBeLessThan(1.0);
  });

  it('approaches downward targets with the same feel', () => {
    // Scrolling UP lerps down; rate symmetry keeps the feel identical.
    expect(settleLerp(0.5, 0.1, FRAME_REF_MS)).toBeCloseTo(0.5 - 0.4 * 0.12);
  });
});
