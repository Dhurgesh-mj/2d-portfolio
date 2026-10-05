import { describe, it, expect } from 'vitest';
import { getClimateWeights, isStormChapter } from './climates';

describe('getClimateWeights', () => {
  it('opens on heavy rain and closes on warm dust', () => {
    const start = getClimateWeights(0);
    expect(start.rain).toBe(1);
    expect(start.dust).toBe(0);

    const end = getClimateWeights(1);
    expect(end.dust).toBe(1);
    expect(end.rain).toBe(0);
  });

  it('keeps every weight inside 0..1', () => {
    for (let p = 0; p <= 1.001; p += 0.01) {
      const w = getClimateWeights(p);
      for (const v of Object.values(w)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('blends continuously (no jumps between stops)', () => {
    let prev = getClimateWeights(0);
    for (let p = 0.005; p <= 1.001; p += 0.005) {
      const w = getClimateWeights(p);
      for (const k of Object.keys(w)) {
        expect(Math.abs(w[k] - prev[k])).toBeLessThan(0.08);
      }
      prev = w;
    }
  });

  it('clamps out-of-range progress', () => {
    expect(getClimateWeights(-0.5)).toEqual(getClimateWeights(0));
    expect(getClimateWeights(1.5)).toEqual(getClimateWeights(1));
  });

  it('peaks cyan motes through the terminal chapters', () => {
    expect(getClimateWeights(0.45).mote).toBe(1);
  });
});

describe('isStormChapter', () => {
  it('flags the rainy rooftop opening and the stormy projects stretch', () => {
    expect(isStormChapter(0)).toBe(true);
    expect(isStormChapter(0.3)).toBe(true);
    expect(isStormChapter(0.7)).toBe(true);
  });

  it('stays quiet through terminal glow and amber finale', () => {
    expect(isStormChapter(0.45)).toBe(false);
    expect(isStormChapter(0.9)).toBe(false);
  });
});
