import { useState, useEffect, useRef, useCallback } from 'react';
import { SECTION_RANGES, resolveSection } from '../lib/sections';
import { settleLerp } from '../lib/smooth';

/**
 * Tracks absolute scroll progress across the page and which chapter it is in.
 *
 * Returns `progress` / `sectionProgress` through getters backed by refs, so
 * reading them from inside a rAF loop does not re-render React. Callers that
 * need to re-render subscribe to `currentSection` instead.
 *
 * @param {Array} sections chapter boundaries; defaults to the shared table.
 */
export function useScrollProgress(sections = SECTION_RANGES) {
  const [currentSection, setCurrentSection] = useState(sections[0]?.id ?? 'hero');
  const progressRef = useRef(0);
  const sectionProgressRef = useRef(0);
  const prevSectionRef = useRef(sections[0]?.id ?? 'hero');
  const rafRef = useRef(null);

  const targetProgressRef = useRef(0);
  const lerpedProgressRef = useRef(0);
  const lastTRef = useRef(0);

  // `sections` is a module-level constant in practice, but keep it in a ref so
  // a caller passing a fresh array literal doesn't restart the loop each render.
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const calculate = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    targetProgressRef.current = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
  }, []);

  const tick = useCallback((now) => {
    calculate();

    // The old lerp applied a fixed * 0.12 every frame — a 144Hz display ran
    // it 2.4x more often than 60Hz, so the flick felt snappier and settled
    // faster purely as a side-effect of refresh rate. settleLerp expresses
    // the same rate per real millisecond instead.
    let dt = 0;
    if (lastTRef.current !== 0) dt = now - lastTRef.current;
    lastTRef.current = now;
    lerpedProgressRef.current = settleLerp(
      lerpedProgressRef.current,
      targetProgressRef.current,
      dt
    );

    const progress = lerpedProgressRef.current;
    const { id, sectionProgress } = resolveSection(sectionsRef.current, progress);

    progressRef.current = progress;
    sectionProgressRef.current = sectionProgress;

    if (id !== prevSectionRef.current) {
      prevSectionRef.current = id;
      setCurrentSection(id);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [calculate]);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReducedMotion) {
      // No rAF and no lerp — scroll events already arrive coalesced, and the
      // smoothing itself is the motion we are removing.
      const handler = () => {
        calculate();
        const progress = targetProgressRef.current;
        const { id, sectionProgress } = resolveSection(sectionsRef.current, progress);
        progressRef.current = progress;
        sectionProgressRef.current = sectionProgress;
        if (id !== prevSectionRef.current) {
          prevSectionRef.current = id;
          setCurrentSection(id);
        }
      };
      window.addEventListener('scroll', handler, { passive: true });
      handler();
      return () => window.removeEventListener('scroll', handler);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick, calculate]);

  return {
    get progress() {
      return progressRef.current;
    },
    currentSection,
    get sectionProgress() {
      return sectionProgressRef.current;
    },
  };
}