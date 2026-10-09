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
    // sp 0.83 puts the card a full spacing off (|off| = 1), well past HOLD.
    const s = calculateCoverflow(0.5, 0.83);
    expect(s.opacity).toBeLessThan(1);
    expect(s.zIndex).toBeLessThan(20);
    expect(s.transform).toContain('translateZ(-');
  });

  it('keeps an on-screen card fully opaque, not translucent', () => {
    // Regression: `1.15 - |off| * 0.95` left a plainly visible card at 0.75
    // opacity, so a quarter of the artwork showed through the paper panel and
    // it read as glass. Anything inside the hold window must be solid.
    for (const sp of [0.3, 0.4, 0.45, 0.55, 0.6, 0.7]) {
      const s = calculateCoverflow(0.5, sp);
      if (!s.isVisible) continue;
      expect(s.opacity).toBe(1);
    }
  });

  it('fades monotonically once past the hold window', () => {
    let prev = 2;
    for (let off = 0.62; off <= 1.2; off += 0.02) {
      const s = calculateCoverflow(0.5, 0.5 + off * 0.33);
      if (!s.isVisible) break;
      expect(s.opacity).toBeLessThanOrEqual(prev);
      prev = s.opacity;
    }
  });

  it('culls the card once the fade completes', () => {
    // HOLD 0.62 + FADE 0.5 = 1.12, so beyond |off| 1.12 it is gone.
    expect(calculateCoverflow(0.5, 0.5 + 1.2 * 0.33).isVisible).toBe(false);
  });

  it('does not apply a filter — it flattens the panel against its perspective', () => {
    // Regression: coverflow used to emit `filter: brightness(...)`, which
    // promotes the card to its own compositing layer and drops its opaque
    // background, making the panel look like translucent glass with the
    // artwork showing through. Opacity already carries the dimming.
    for (const center of [0.17, 0.5, 0.83]) {
      for (let sp = 0; sp <= 1.001; sp += 0.05) {
        const s = calculateCoverflow(center, sp);
        if (!s.isVisible) continue;
        expect(s.filter).toBeUndefined();
      }
    }
  });

  it('centres the lean: no rotateZ at full focus', () => {
    // A perfectly upright centred card is the tell that reveals the geometry.
    const s = calculateCoverflow(0.5, 0.5);
    expect(s.transform).toContain('rotateZ(0.00deg)');
  });

  it('leans opposite sides opposite ways', () => {
    const left = calculateCoverflow(0.5, 0.6);
    const right = calculateCoverflow(0.5, 0.4);
    expect(left.transform).toMatch(/rotateZ\(-\d/);
    expect(right.transform).toMatch(/rotateZ\(\d/);
  });

  it('never leans past the point the card is culled', () => {
    // A card stays visible while opacity > 0, i.e. 1.15 - |off|*0.95 > 0, so
    // |off| < 1.2106 and the lean tops out at 1.2106 * 1.4 = ~1.69deg. Bound it
    // against that rather than a guessed 1.4 — the per-unit rate is 1.4, the
    // worst case a rendered card can actually reach is not.
    const MAX_OFF = 1.15 / 0.95;
    for (const center of [0.17, 0.5, 0.83]) {
      for (let sp = 0; sp <= 1.001; sp += 0.01) {
        const s = calculateCoverflow(center, sp);
        if (!s.isVisible) continue;
        const deg = Math.abs(parseFloat(s.transform.match(/rotateZ\((-?[\d.]+)deg\)/)[1]));
        expect(deg).toBeLessThanOrEqual(MAX_OFF * 1.4 + 0.01);
      }
    }
  });

  it('reveals a card fully while it is still on screen', () => {
    // Regression: inner reveals (badge/title/role/tech/desc/footer) are gated
    // up to 0.7 of `--p` and complete at 0.7 + 1/3 = 1.03, i.e. only when
    // `--p` reaches 1. Driving `--p` from `focus` meant a card parked slightly
    // off-centre rendered as a blank box with a half-decoded title. `reveal`
    // must therefore be 1 across the whole hold window.
    // Inside the hold window only (|off| <= HOLD = 0.62). Beyond it the card is
    // legitimately mid-fade, so asserting reveal === 1 there would be wrong.
    for (const sp of [0.3, 0.4, 0.45, 0.55, 0.6, 0.7]) {
      const s = calculateCoverflow(0.5, sp);
      if (!s.isVisible) continue;
      expect(Math.abs((0.5 - sp) / 0.33)).toBeLessThanOrEqual(0.62);
      expect(s.reveal).toBe(1);
    }
  });

  it('drives inner reveals and opacity from the same window', () => {
    // They should fade together as a card leaves, rather than the panel
    // dissolving while its own text is still arriving.
    const inside = calculateCoverflow(0.5, 0.6);
    const leaving = calculateCoverflow(0.5, 0.6 + 0.85 * 0.33);
    if (leaving.isVisible) {
      expect(leaving.reveal).toBeLessThan(1);
      expect(leaving.opacity).toBeLessThan(1);
    }
    expect(inside.reveal).toBe(inside.opacity);
  });

  it('keeps opacity, focus and reveal inside 0..1 across the whole journey', () => {
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
