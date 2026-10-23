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
    let frame = 0;
    let lc = null, lw = null, lb = null;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      // Climate weights change on scroll, not per frame — 20Hz + epsilon
      // writes. Every-frame opacity writes repainted three fullscreen
      // gradient layers 60x/sec.
      frame++;
      if (frame % 3 !== 0 || document.hidden) return;
      const p = getProgressRef.current ? getProgressRef.current() : 0;
      const w = getClimateWeights(Math.min(1, Math.max(0, p)));
      const c = Math.min(1, w.mote * 1.2).toFixed(3);
      const wa = Math.min(1, w.dust * 1.2 + w.ember * 0.5).toFixed(3);
      const b = (0.55 + w.rain * 0.2).toFixed(3);
      if (c !== lc && coolRef.current) {
        lc = c;
        coolRef.current.style.opacity = c;
      }
      if (wa !== lw && warmRef.current) {
        lw = wa;
        warmRef.current.style.opacity = wa;
      }
      if (b !== lb && baseRef.current) {
        lb = b;
        baseRef.current.style.opacity = b;
      }
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
