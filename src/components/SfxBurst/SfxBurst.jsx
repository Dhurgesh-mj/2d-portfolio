import React, { useEffect, useState, useRef, useCallback } from 'react';
import './sfxBurst.css';

// Restrained palette — one burst per click, short-lived. The word is picked
// from the element's `data-sfx` (defaults to 'POW!') so copy matches intent.
const WORDS = ['POW!', 'BAM!', 'ZAP!', 'THWAK!'];

let nextId = 1;

/**
 * Global click-burst layer. Mount once in App. Listens for clicks on any
 * element carrying `data-sfx` (or a `data-sfx` ancestor) and spawns an
 * onomatopoeia sprite at the click point. Animationend cleans up.
 *
 * Purely visual: no sound, no haptics. Reduced-motion / coarse pointers skip.
 */
export function SfxBurst() {
  const [bursts, setBursts] = useState([]);
  const enabledRef = useRef(false);

  useEffect(() => {
    const enabled =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    enabledRef.current = enabled;
    if (!enabled) return;

    const onClick = (e) => {
      const host = e.target && e.target.closest && e.target.closest('[data-sfx]');
      if (!host) return;
      const word = (host.getAttribute('data-sfx') || '').trim() || WORDS[Math.floor(Math.random() * WORDS.length)];
      const id = nextId++;
      const burst = { id, x: e.clientX, y: e.clientY, word };
      setBursts((b) => [...b, burst]);
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  const remove = useCallback((id) => {
    setBursts((b) => b.filter((x) => x.id !== id));
  }, []);

  if (!enabledRef.current) return null;

  return (
    <div className="sfx-layer" aria-hidden="true">
      {bursts.map((b) => (
        <span
          key={b.id}
          className="sfx-burst"
          style={{ left: b.x, top: b.y }}
          onAnimationEnd={() => remove(b.id)}
        >
          {b.word}
        </span>
      ))}
    </div>
  );
}
