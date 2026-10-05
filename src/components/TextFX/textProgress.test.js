import { describe, it, expect } from 'vitest';
import { letterProgress, typewriterCount, glyphAt, decodeCount, DECODE_GLYPHS } from './textProgress';

describe('letterProgress', () => {
  it('starts all letters at 0 and finishes all at 1', () => {
    for (let i = 0; i < 11; i++) {
      expect(letterProgress(0, i, 11)).toBe(0);
      expect(letterProgress(1, i, 11)).toBe(1);
    }
  });

  it('cascades in reading order at the midpoint', () => {
    const mid = [0, 1, 2, 3, 4].map((i) => letterProgress(0.4, i, 5));
    for (let i = 1; i < mid.length; i++) {
      expect(mid[i]).toBeLessThanOrEqual(mid[i - 1]);
    }
    expect(mid[0]).toBeGreaterThan(0);
  });

  it('never leaves 0..1', () => {
    for (let p = -0.5; p <= 1.5; p += 0.05) {
      expect(letterProgress(p, 2, 7)).toBeGreaterThanOrEqual(0);
      expect(letterProgress(p, 2, 7)).toBeLessThanOrEqual(1);
    }
  });
});

describe('typewriterCount', () => {
  it('reveals proportionally and completes at p = 1', () => {
    expect(typewriterCount('hello world', 0)).toBe(0);
    expect(typewriterCount('hello world', 1)).toBe(11);
    const half = typewriterCount('hello world', 0.5);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(11);
  });
});

describe('decoder helpers', () => {
  it('resolves nothing at 0 and everything at 1', () => {
    expect(decodeCount('DECEPTOR', 0)).toBe(0);
    expect(decodeCount('DECEPTOR', 1)).toBe(8);
  });

  it('snaps fully resolved at/above 0.9 (focus hovers near 1)', () => {
    expect(decodeCount('ZEROCOPY', 0.9)).toBe(8);
    expect(decodeCount('ZEROCOPY', 0.95)).toBe(8);
    expect(decodeCount('ZEROCOPY', 0.899)).toBeLessThan(8);
  });

  it('resolves monotonically with progress', () => {
    let prev = -1;
    for (let p = 0; p <= 1.001; p += 0.05) {
      const c = decodeCount('SUBDOMAINATOR', p);
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
  });

  it('emits deterministic glyphs from the scramble set', () => {
    for (let i = 0; i < 12; i++) {
      for (let t = 0; t < 4; t++) {
        expect(DECODE_GLYPHS).toContain(glyphAt(i, t));
      }
      // ticks advance the scramble
      expect(glyphAt(i, 0) === glyphAt(i, 1) && glyphAt(i, 1) === glyphAt(i, 2)).toBe(false);
    }
  });
});
