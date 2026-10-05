import { useEffect, useRef } from 'react';
import { getClimateWeights } from '../Atmosphere/climates';
import './spotlight.css';

/**
 * Spotlight — a pointer-tracked pool of light floating over the artwork
 * (below the content panels). Two tinted layers cross-fade with the chapter
 * climate: cyan in the terminal chapters, amber in the finale, neutral
 * white everywhere else. Position comes from --spot-x/--spot-y (CameraRig).
 */
export function Spotlight({ getProgress }) {
  const coolRef = useRef(null);
  const warmRef = useRef(null);
  const baseRef = useRef(null);
  const getProgressRef = useRef(getProgress);
  getProgressRef.current = getProgress;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const p = getProgressRef.current ? getProgressRef.current() : 0;
      const w = getClimateWeights(Math.min(1, Math.max(0, p)));
      if (coolRef.current) coolRef.current.style.opacity = Math.min(1, w.mote * 1.2).toFixed(3);
      if (warmRef.current) warmRef.current.style.opacity = Math.min(1, w.dust * 1.2 + w.ember * 0.5).toFixed(3);
      if (baseRef.current) baseRef.current.style.opacity = (0.55 + w.rain * 0.2).toFixed(3);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="spotlight" aria-hidden="true">
      <div className="spotlight__layer spotlight__layer--base" ref={baseRef} />
      <div className="spotlight__layer spotlight__layer--cool" ref={coolRef} />
      <div className="spotlight__layer spotlight__layer--warm" ref={warmRef} />
    </div>
  );
}
