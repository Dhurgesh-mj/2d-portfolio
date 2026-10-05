/**
 * Chapter climate map — drives the Atmosphere particle layer.
 * Weights blend smoothly between stops so rain dissolves into
 * data-motes, then embers, then warm dust as the story progresses.
 * Mirrors the comic arc: rainy rooftop noir -> cyan terminal -> amber finale.
 */

const STOPS = [
  // hero + about: heavy rain over the rooftop
  { p: 0.0, rain: 1.0, mote: 0.0, ember: 0.0, dust: 0.0 },
  { p: 0.28, rain: 1.0, mote: 0.0, ember: 0.0, dust: 0.0 },
  // skills: rain gives way to cyan data-motes
  { p: 0.38, rain: 0.0, mote: 1.0, ember: 0.0, dust: 0.0 },
  // achievements: full terminal glow
  { p: 0.58, rain: 0.0, mote: 1.0, ember: 0.0, dust: 0.0 },
  // projects: storm returns, embers rise through it
  { p: 0.68, rain: 0.55, mote: 0.15, ember: 0.6, dust: 0.0 },
  { p: 0.78, rain: 0.35, mote: 0.0, ember: 0.7, dust: 0.15 },
  // contact: amber finale, warm dust in lamplight
  { p: 0.88, rain: 0.0, mote: 0.0, ember: 0.25, dust: 1.0 },
  { p: 1.0, rain: 0.0, mote: 0.0, ember: 0.2, dust: 1.0 },
];

export function getClimateWeights(progress) {
  const p = Math.min(1, Math.max(0, progress));

  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (p >= a.p && p <= b.p) {
      const span = b.p - a.p || 1;
      const t = (p - a.p) / span;
      return {
        rain: a.rain + (b.rain - a.rain) * t,
        mote: a.mote + (b.mote - a.mote) * t,
        ember: a.ember + (b.ember - a.ember) * t,
        dust: a.dust + (b.dust - a.dust) * t,
      };
    }
  }

  const last = STOPS[STOPS.length - 1];
  return { rain: last.rain, mote: last.mote, ember: last.ember, dust: last.dust };
}

/** Lightning only strikes during the rainy rooftop chapters. */
export function isStormChapter(progress) {
  return progress < 0.33 || (progress >= 0.62 && progress < 0.8);
}
