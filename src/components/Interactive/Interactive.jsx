import React, { useRef, useState } from 'react';
import './interactive.css';

// Pointer-driven effects need a fine pointer AND no reduced-motion preference.
// Reduced motion was checked before but pointer type was not — on touch the
// listeners fire on tap and leave the element stuck mid-transform.
const motionAllowed = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tilt — pointer-driven 3D tilt using CSS vars. Purely additive:
 * wraps content without touching its layout or existing transforms.
 */
export function Tilt({ children, max = 7, className = '' }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--ry', `${(px * max * 2).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * max * 2).toFixed(2)}deg`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchStart={handleLeave}
    >
      {children}
    </div>
  );
}

/**
 * Magnetic — element gravitates a few px toward the cursor while hovered,
 * then eases back. Subtle by design (comic panels shouldn't swim).
 */
export function Magnetic({ children, strength = 7, className = '' }) {
  const ref = useRef(null);
  const [pressed, setPressed] = useState(false);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const cx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
    const cy = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
    // Pulled further while held: the target offers, then commits. `--mp` is
    // consumed by the CSS so the press response stays in the stylesheet.
    const gain = pressed ? 1.35 : 1;
    el.style.setProperty('--mx', `${(cx * strength * gain).toFixed(1)}px`);
    el.style.setProperty('--my', `${(cy * strength * gain).toFixed(1)}px`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mx', '0px');
    el.style.setProperty('--my', '0px');
    setPressed(false);
  };

  return (
    <div
      ref={ref}
      className={`magnetic ${className}${pressed ? ' is-pressed' : ''}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchStart={handleLeave}
      onPointerDown={() => setPressed(true)}
      onPointerUp={handleLeave}
      onPointerCancel={handleLeave}
    >
      {children}
    </div>
  );
}
