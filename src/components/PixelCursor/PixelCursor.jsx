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

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const onOver = (e) => {
      if (e.target && e.target.closest && e.target.closest('a, button, .tilt, .magnetic')) {
        el.classList.add('pixel-cursor--hot');
      } else {
        el.classList.remove('pixel-cursor--hot');
      }
    };

    const tick = () => {
      if (!running) return;
      // Stepped follow — pixel-art motion, not smooth glide
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      if (Math.abs(tx - x) < 0.5) x = tx;
      if (Math.abs(ty - y) < 0.5) y = ty;
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pixel-cursor" ref={cursorRef} aria-hidden="true">
      <span className="pixel-cursor__h" />
      <span className="pixel-cursor__v" />
    </div>
  );
}
