import React, { useEffect, useRef, useState } from 'react';
import './pixelCursor.css';

/**
 * PixelCursor — a crosshair reticle that trails the pointer with a
 * stepped (pixel-style) follow. Expands into an X over interactive
 * elements. Desktop fine-pointers only; native cursor stays everywhere else.
 */
export function PixelCursor() {
  const cursorRef = useRef(null);
  const [enabled] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (!enabled) return;
    const el = cursorRef.current;
    if (!el) return;

    let tx = -100;
    let ty = -100;
    let x = -100;
    let y = -100;
    let raf = 0;
    let running = true;
    let lastT = '';

    const write = () => {
      const t = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      if (t !== lastT) {
        lastT = t;
        el.style.transform = t;
      }
    };

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      x = tx;
      y = ty;
      write();
    };

    const onOver = (e) => {
      if (e.target && e.target.closest && e.target.closest('a, button, .tilt, .magnetic')) {
        el.classList.add('pixel-cursor--hot');
      } else {
        el.classList.remove('pixel-cursor--hot');
      }
    };

    const onDown = () => {
      // ink-splat ripple: re-trigger the animation each press
      el.classList.remove('pixel-cursor--ink');
      // force reflow so the animation restarts
      void el.offsetWidth;
      el.classList.add('pixel-cursor--ink');
    };

    const onInkEnd = (e) => {
      if (e.target === el || (e.target && e.target.classList && e.target.classList.contains('pixel-cursor__ink'))) {
        el.classList.remove('pixel-cursor--ink');
      }
    };

    const tick = () => {
      if (!running) return;
      x = tx;
      y = ty;
      write();
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    el.addEventListener('animationend', onInkEnd);

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      el.removeEventListener('animationend', onInkEnd);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pixel-cursor" ref={cursorRef} aria-hidden="true">
      <span className="pixel-cursor__h" />
      <span className="pixel-cursor__v" />
      <span className="pixel-cursor__ink" />
    </div>
  );
}
