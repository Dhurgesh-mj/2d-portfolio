import { useState, useEffect, useRef, useCallback } from 'react';

const SECTIONS = [
  { id: 'hero', start: 0, end: 0.15 },
  { id: 'about', start: 0.15, end: 0.31 },
  { id: 'skills', start: 0.31, end: 0.48 },
  { id: 'achievements', start: 0.48, end: 0.62 },
  { id: 'projects', start: 0.62, end: 0.82 },
  { id: 'contact', start: 0.82, end: 1.0 },
];

export function useScrollProgress(containerRef) {
  const [currentSection, setCurrentSection] = useState('hero');
  const progressRef = useRef(0);
  const sectionProgressRef = useRef(0);
  const prevSectionRef = useRef('hero');
  const rafRef = useRef(null);
  const isRunning = useRef(false);

  const targetProgressRef = useRef(0);
  const lerpedProgressRef = useRef(0);

  const calculate = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    targetProgressRef.current = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
  }, []);

  const tick = useCallback(() => {
    calculate();
    
    // Lerp towards target progress (0.08 is the smoothing factor)
    // Lower = smoother but more delayed. Higher = snappier.
    lerpedProgressRef.current += (targetProgressRef.current - lerpedProgressRef.current) * 0.12;
    
    // Snap if very close
    if (Math.abs(targetProgressRef.current - lerpedProgressRef.current) < 0.001) {
      lerpedProgressRef.current = targetProgressRef.current;
    }

    const progress = lerpedProgressRef.current;

    let newSection = 'hero';
    let sectionProg = 0;

    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      const sec = SECTIONS[i];
      if (progress >= sec.start) {
        newSection = sec.id;
        const range = sec.end - sec.start;
        sectionProg = Math.min(1, Math.max(0, (progress - sec.start) / range));
        break;
      }
    }

    progressRef.current = progress;
    sectionProgressRef.current = sectionProg;

    if (newSection !== prevSectionRef.current) {
      prevSectionRef.current = newSection;
      setCurrentSection(newSection);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [calculate]);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReducedMotion) {
      const handler = () => {
        calculate();
        lerpedProgressRef.current = targetProgressRef.current; // No lerp for reduced motion
        // Force sync update
        progressRef.current = targetProgressRef.current;
        
        let newSection = 'hero';
        let sectionProg = 0;
        for (let i = SECTIONS.length - 1; i >= 0; i--) {
          const sec = SECTIONS[i];
          if (progressRef.current >= sec.start) {
            newSection = sec.id;
            const range = sec.end - sec.start;
            sectionProg = Math.min(1, Math.max(0, (progressRef.current - sec.start) / range));
            break;
          }
        }
        sectionProgressRef.current = sectionProg;
        if (newSection !== prevSectionRef.current) {
          prevSectionRef.current = newSection;
          setCurrentSection(newSection);
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
    get progress() { return progressRef.current; },
    currentSection,
    get sectionProgress() { return sectionProgressRef.current; },
    sections: SECTIONS,
  };
}
