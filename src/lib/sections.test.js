import { describe, it, expect } from 'vitest';
import { SECTION_RANGES, resolveSection, sectionProgressFor } from './sections';

describe('SECTION_RANGES', () => {
  it('starts at 0, ends at 1, and is contiguous', () => {
    expect(SECTION_RANGES[0].start).toBe(0);
    expect(SECTION_RANGES[SECTION_RANGES.length - 1].end).toBe(1);
    for (let i = 1; i < SECTION_RANGES.length; i++) {
      expect(SECTION_RANGES[i].start).toBe(SECTION_RANGES[i - 1].end);
    }
  });

  it('gives every chapter a label and a nav contrast theme', () => {
    // The `theme` column replaced a `progress > 0.75` guess that was painting
    // paper text over light artwork at 1.3:1. Losing it silently would bring
    // that back, so assert its shape rather than its values.
    for (const s of SECTION_RANGES) {
      expect(s.label).toBeTruthy();
      expect(['dark', 'light']).toContain(s.theme);
    }
  });
});

describe('resolveSection', () => {
  it('maps absolute progress to the owning chapter', () => {
    expect(resolveSection(SECTION_RANGES, 0).id).toBe('hero');
    expect(resolveSection(SECTION_RANGES, 0.1).id).toBe('hero');
    expect(resolveSection(SECTION_RANGES, 0.15).id).toBe('about');
    expect(resolveSection(SECTION_RANGES, 0.72).id).toBe('projects');
    expect(resolveSection(SECTION_RANGES, 1).id).toBe('contact');
  });

  it('resolves to the chapter that OWNS the boundary, not the next one', () => {
    // Exactly on a boundary: progress 0.31 is the first frame of skills, so
    // skills must be active with sp 0 — not the tail of about with sp 1.
    const at = resolveSection(SECTION_RANGES, 0.31);
    expect(at.id).toBe('skills');
    expect(at.sectionProgress).toBe(0);
  });

  it('reports 0..1 progress within the owning chapter', () => {
    expect(resolveSection(SECTION_RANGES, 0.62).sectionProgress).toBe(0); // projects start
    expect(resolveSection(SECTION_RANGES, 0.72).sectionProgress).toBeCloseTo(0.5, 5);
  });

  it('never exceeds the chapter bounds', () => {
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const { sectionProgress } = resolveSection(SECTION_RANGES, p);
      expect(sectionProgress).toBeGreaterThanOrEqual(0);
      expect(sectionProgress).toBeLessThanOrEqual(1);
    }
  });
});

describe('sectionProgressFor', () => {
  const about = SECTION_RANGES.find((s) => s.id === 'about');

  it('gives a chapter its OWN progress, not the active chapter\'s', () => {
    // Regression guard: App.getSectionState hands every chapter its own value.
    // Resolving instead would make all six animate in lockstep.
    const p = 0.72; // inside projects
    expect(sectionProgressFor(SECTION_RANGES[4], p)).toBeCloseTo(0.5, 5);
    expect(sectionProgressFor(about, p)).toBe(1); // about is long finished
  });

  it('clamps outside the chapter range', () => {
    expect(sectionProgressFor(about, 0)).toBe(0);
    expect(sectionProgressFor(about, 0.10)).toBe(0); // before about starts
    expect(sectionProgressFor(about, 1)).toBe(1); // after about ends
  });

  it('does not divide by zero on a degenerate range', () => {
    expect(sectionProgressFor({ start: 0.5, end: 0.5 }, 0.7)).toBe(0);
  });
});