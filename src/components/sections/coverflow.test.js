import { describe, it, expect } from 'vitest';
import { calculateCoverflow, clamp01 } from './coverflow';

describe('clamp01', () => {
  it('clamps both ends and passes the middle through', () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBeCloseTo(0.4);
  });
});

describe('calculateCoverflow', () => {
  it('faces forward at full focus when centered', () => {
    const s = calculateCoverflow(0.5, 0.5);
    expect(s.isVisible).toBe(true);
    expect(s.opacity).toBe(1);
    expect(s.focus).toBe(1);
    expect(s.transform).toContain('rotateY(0.00deg)');
    expect(s.zIndex).toBe(20);
  });

  it('hides cards far from the viewport', () => {
    expect(calculateCoverflow(0.17, 0.9).isVisible).toBe(false);
    expect(calculateCoverflow(0.83, 0.1).isVisible).toBe(false);
  });

  it('fans symmetrically: mirrored offsets mirror the pose', () => {
    const past = calculateCoverflow(0.5, 0.6); // card slipped left
    const upcoming = calculateCoverflow(0.5, 0.4); // card waiting right
    expect(past.isVisible).toBe(true);
    expect(upcoming.isVisible).toBe(true);
    expect(past.opacity).toBeCloseTo(upcoming.opacity);
    expect(past.focus).toBeCloseTo(upcoming.focus);
    expect(past.zIndex).toBe(upcoming.zIndex);
    // rotations oppose each other: left card turns -, right card turns +
    expect(past.transform).toContain('rotateY(-');
    expect(upcoming.transform).not.toContain('rotateY(-');
  });

  it('dims and recedes side cards', () => {
    const s = calculateCoverflow(0.5, 0.7);
    expect(s.opacity).toBeLessThan(1);
    expect(s.filter).toContain('brightness(0.');
    expect(s.zIndex).toBeLessThan(20);
    expect(s.transform).toContain('translateZ(-');
  });

  it('keeps opacity and focus inside 0..1 across the whole journey', () => {
    for (const center of [0.17, 0.5, 0.83]) {
      for (let sp = 0; sp <= 1.001; sp += 0.02) {
        const s = calculateCoverflow(center, sp);
        if (!s.isVisible) continue;
        expect(s.opacity).toBeGreaterThan(0);
        expect(s.opacity).toBeLessThanOrEqual(1);
        expect(s.focus).toBeGreaterThanOrEqual(0);
        expect(s.focus).toBeLessThanOrEqual(1);
      }
    }
  });
});
