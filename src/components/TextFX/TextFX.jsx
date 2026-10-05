import React, { useState, useEffect } from 'react';
import { letterProgress, typewriterCount, glyphAt, decodeCount } from './textProgress';
import './textfx.css';

/**
 * SplitText — scroll-driven per-letter cascade. Each letter rises into
 * place as the parent progress `p` (0-1) sweeps across the string.
 */
export function SplitText({ text, p = 0, className = '' }) {
  const chars = text.split('');
  const n = Math.max(1, chars.length);
  return (
    <span className={`split-text ${className}`} aria-label={text}>
      {chars.map((ch, i) => {
        const lp = letterProgress(p, i, n);
        return (
          <span key={i} className="split-letter" aria-hidden="true" style={{ '--lp': lp }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Decode — terminal-style scramble that resolves left-to-right as `p`
 * goes 0→1. Unresolved tail cycles glyphs on a throttled ticker that only
 * runs while decoding is in flight.
 */
export function Decode({ text, p = 0 }) {
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [tick, setTick] = useState(0);
  const resolved = reduced ? text.length : decodeCount(text, p);
  const decoding = !reduced && p > 0 && resolved < text.length;

  useEffect(() => {
    if (!decoding) return;
    const id = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, [decoding]);

  if (reduced) return <span className="decode">{text}</span>;

  return (
    <span className="decode" aria-label={text}>
      {text.split('').map((ch, i) =>
        i < resolved || ch === ' ' ? (
          <span key={i}>{ch}</span>
        ) : (
          <span key={i} className="decode__glyph" aria-hidden="true">
            {glyphAt(i, tick)}
          </span>
        )
      )}
    </span>
  );
}
/**
 * Typewriter — terminal-style scroll-driven typing with a block cursor.
 * Respects reduced motion by revealing the full text immediately.
 */
export function Typewriter({ text, p = 0 }) {
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const count = reduced ? text.length : typewriterCount(text, p);
  const started = reduced || p > 0;
  const done = reduced || p >= 1;

  return (
    <span className="typewriter">
      <span>{text.slice(0, count)}</span>
      {started && !done && <span className="typewriter__cursor" aria-hidden="true" />}
    </span>
  );
}
