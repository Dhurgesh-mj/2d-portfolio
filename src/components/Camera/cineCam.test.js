import { describe, it, expect } from 'vitest';
import { getCinePose, ease } from './cineCam';

describe('ease', () => {
  it('pins both ends and passes through the middle', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5);
  });

  it('eases (slower than linear near the ends)', () => {
    expect(ease(0.1)).toBeLessThan(0.1);
    expect(ease(0.9)).toBeGreaterThan(0.9);
  });
});

describe('getCinePose', () => {
  it('hits keyframes exactly at the chapter edges', () => {
    const start = getCinePose('hero', 0);
    expect(start.zoom).toBeCloseTo(1);
    expect(start.fx).toBeCloseTo(0.36);
    expect(start.fy).toBeCloseTo(0.45);
    const end = getCinePose('hero', 1);
    expect(end.zoom).toBeCloseTo(1.1);
    expect(end.fx).toBeCloseTo(0.34);
    expect(end.fy).toBeCloseTo(0.44);
  });

  it('interpolates smoothly mid-chapter', () => {
    const mid = getCinePose('skills', 0.5);
    expect(mid.zoom).toBeGreaterThan(1.05);
    expect(mid.zoom).toBeLessThan(1.14);
    expect(mid.fx).toBeGreaterThan(0.4);
    expect(mid.fx).toBeLessThan(0.44);
  });

  it('clamps out-of-range progress', () => {
    expect(getCinePose('about', -1)).toEqual(getCinePose('about', 0));
    expect(getCinePose('about', 2)).toEqual(getCinePose('about', 1));
  });

  it('parks unknown chapters on a neutral wide shot', () => {
    expect(getCinePose('nope', 0.5)).toEqual({ zoom: 1, fx: 0.5, fy: 0.5 });
  });

  it('adds a bounded zoom-out kick on fast scrolls', () => {
    const calm = getCinePose('projects', 0.5, 0);
    const fast = getCinePose('projects', 0.5, 3);
    expect(fast.zoom).toBeLessThan(calm.zoom);
    expect(calm.zoom - fast.zoom).toBeLessThanOrEqual(0.025 + 1e-9);
    // never dives below the floor, even at absurd velocity
    expect(getCinePose('projects', 0.5, 99).zoom).toBeGreaterThanOrEqual(0.9);
  });

  it('halves amplitudes on mobile', () => {
    const desk = getCinePose('skills', 1, 0, false);
    const mob = getCinePose('skills', 1, 0, true);
    expect(mob.zoom).toBeCloseTo(1 + (desk.zoom - 1) * 0.5);
    expect(mob.fx).toBeCloseTo(0.5 + (desk.fx - 0.5) * 0.5);
  });

  it('keeps every chapter continuous across its whole range', () => {
    for (const id of ['hero', 'about', 'skills', 'achievements', 'projects', 'contact']) {
      let prev = getCinePose(id, 0);
      for (let sp = 0.02; sp <= 1.001; sp += 0.02) {
        const cur = getCinePose(id, sp);
        expect(Math.abs(cur.zoom - prev.zoom)).toBeLessThan(0.02);
        expect(Math.abs(cur.fx - prev.fx)).toBeLessThan(0.02);
        prev = cur;
      }
    }
  });
});
