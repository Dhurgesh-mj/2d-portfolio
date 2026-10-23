import { useEffect, useRef } from 'react';
import { rigState, resetRigState } from './rigState';

/**
 * CameraRig — invisible director for the whole scene. Every frame it:
 *  1. lerps toward the pointer (parallax camera), and
 *  2. derives smoothed scroll velocity from the scroll-progress getter.
 *
 * Results are published two ways: CSS vars (--cam-x, --cam-y, --vel) on the
 * sticky viewport for DOM layers, and the `rigState` singleton for canvas
 * layers. Renders nothing.
 */
export function CameraRig({ targetRef, getProgress }) {
  const getProgressRef = useRef(getProgress);
  getProgressRef.current = getProgress;

  useEffect(() => {
    const el = targetRef ? targetRef.current : null;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) {
      resetRigState();
      return;
    }

    let tx = 0;
    let ty = 0;
    let raf = 0;
    let running = true;
    let lastT = performance.now();
    let lastP = getProgressRef.current ? getProgressRef.current() : 0;

    const onMove = (e) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };

    // Last-written values: setting a CSS var invalidates style every time,
    // even when identical — so only write on real change.
    let lx = Infinity, ly = Infinity, lv = Infinity, ld = null, lsx = null, lsy = null;

    const tick = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) {
        lastT = now;
        return;
      }

      // Pointer camera (slow cinematic lerp)
      rigState.x += (tx - rigState.x) * 0.06;
      rigState.y += (ty - rigState.y) * 0.06;

      // Scroll velocity in progress-units/sec, smoothed + decayed
      const dt = Math.max(1, now - lastT) / 1000;
      lastT = now;
      const p = getProgressRef.current ? getProgressRef.current() : lastP;
      const delta = p - lastP;
      const instant = Math.abs(delta) / dt;
      lastP = p;
      const target = Math.min(3, instant);
      rigState.vel += (target - rigState.vel) * (target > rigState.vel ? 0.35 : 0.08);
      // Keep the sign so layers can respond to travel direction, not just speed.
      rigState.dir = delta > 0.0001 ? 1 : delta < -0.0001 ? -1 : 0;

      if (Math.abs(rigState.x - lx) > 0.0005) {
        lx = rigState.x;
        el.style.setProperty('--cam-x', lx.toFixed(4));
        const sx = `${((lx + 0.5) * 100).toFixed(2)}%`;
        if (sx !== lsx) {
          lsx = sx;
          el.style.setProperty('--spot-x', sx);
        }
      }
      if (Math.abs(rigState.y - ly) > 0.0005) {
        ly = rigState.y;
        el.style.setProperty('--cam-y', ly.toFixed(4));
        const sy = `${((ly + 0.5) * 100).toFixed(2)}%`;
        if (sy !== lsy) {
          lsy = sy;
          el.style.setProperty('--spot-y', sy);
        }
      }
      if (Math.abs(rigState.vel - lv) > 0.002) {
        lv = rigState.vel;
        el.style.setProperty('--vel', lv.toFixed(4));
      }
      if (rigState.dir !== ld) {
        ld = rigState.dir;
        el.style.setProperty('--scroll-dir', String(ld));
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      resetRigState();
    };
  }, [targetRef]);

  return null;
}
