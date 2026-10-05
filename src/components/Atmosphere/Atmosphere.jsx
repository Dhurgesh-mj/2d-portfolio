import React, { useEffect, useRef } from 'react';
import { getClimateWeights, isStormChapter } from './climates';
import { rigState } from '../CameraRig/rigState';
import './atmosphere.css';

const BASE_PARTICLES = 220;
const MOBILE_PARTICLES = 110;

// Spawn rates (particles per second at full weight)
const SPAWN = { rain: 130, mote: 46, ember: 30, dust: 22 };
const MAX_AGE = { rain: 2.2, mote: 7, ember: 6, dust: 11, splash: 0.4 };

// Manga speed lines radiated on fast scrolls
const SPEED_LINES = 26;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeParticle(mode, w, h) {
  const p = { mode, age: 0, maxAge: 0, x: 0, y: 0, vx: 0, vy: 0, size: 2, seed: Math.random() * Math.PI * 2 };

  if (mode === 'rain') {
    p.x = rand(-40, w + 40);
    p.y = rand(-60, -10);
    p.vx = rand(-60, -20); // wind slant
    p.vy = rand(700, 1100);
    p.size = rand(1, 2.4);
    p.maxAge = MAX_AGE.rain;
    p.len = rand(9, 18);
  } else if (mode === 'mote') {
    p.x = rand(0, w);
    p.y = rand(h * 0.3, h + 20);
    p.vx = rand(-14, 14);
    p.vy = rand(-70, -28);
    p.size = rand(2, 4.5);
    p.maxAge = MAX_AGE.mote;
    p.z = Math.random(); // depth: 0 far .. 1 near (perspective warp)
  } else if (mode === 'ember') {
    p.x = rand(0, w);
    p.y = rand(h * 0.5, h + 20);
    p.vx = rand(-30, 30);
    p.vy = rand(-110, -45);
    p.size = rand(2, 4);
    p.maxAge = MAX_AGE.ember;
  } else {
    // dust — slow lamplight drift
    p.x = rand(0, w);
    p.y = rand(0, h);
    p.vx = rand(-12, 12);
    p.vy = rand(-16, -4);
    p.size = rand(1.5, 3.5);
    p.maxAge = MAX_AGE.dust;
  }

  return p;
}

/** Impact tick where a raindrop lands — spawned on rain death, not by climate. */
function makeSplash(x, y) {
  return {
    mode: 'splash', age: 0, maxAge: MAX_AGE.splash,
    x: x + rand(-3, 3), y, vx: 0, vy: 0,
    size: rand(2, 4), seed: Math.random() * Math.PI * 2,
  };
}

/**
 * Atmosphere — a pixel-styled particle canvas floating between the comic
 * art (z 1) and the content overlay (z 10). Reads scroll progress through a
 * getter so it never triggers React re-renders.
 */
export function Atmosphere({ getProgress }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const getProgressRef = useRef(getProgress);
  getProgressRef.current = getProgress;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mobile = window.innerWidth < 768;
    let maxParticles = mobile ? MOBILE_PARTICLES : BASE_PARTICLES;
    const hardCap = maxParticles;

    let W = 0;
    let H = 0;
    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const spawnDebt = { rain: 0, mote: 0, ember: 0, dust: 0 };

    // Fog banks — normalized anchors, drift on time + pointer parallax
    const fogBanks = [
      { u: 0.22, v: 0.62, r: 0.42, speed: 0.05, phase: 0.0, depth: 0.4 },
      { u: 0.72, v: 0.38, r: 0.36, speed: 0.07, phase: 2.1, depth: 0.7 },
      { u: 0.5, v: 0.82, r: 0.5, speed: 0.04, phase: 4.2, depth: 0.25 },
    ];

    // Speed-line seeds (fixed angles, lengths breathe with velocity)
    const speedSeeds = Array.from({ length: SPEED_LINES }, (_, i) => ({
      angle: (i / SPEED_LINES) * Math.PI * 2 + rand(-0.12, 0.12),
      offset: rand(0.25, 0.75),
      width: rand(1, 2.5),
    }));

    // Lightning state (storm chapters only)
    let flashTimer = rand(3, 6);
    let flashActive = 0; // seconds remaining in a strike
    let flashSeed = 0;

    let raf = 0;
    let last = performance.now();
    let dtEma = 16;
    let frameCount = 0;
    let running = true;

    const tick = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1; // tab-switch clamp
      dtEma += (dt * 1000 - dtEma) * 0.05;

      // Adaptive quality: shed particles if the frame budget slips
      frameCount++;
      if (frameCount % 60 === 0) {
        if (dtEma > 26 && maxParticles > 60) maxParticles = Math.floor(maxParticles * 0.85);
        else if (dtEma < 17 && maxParticles < hardCap) maxParticles = Math.min(hardCap, Math.ceil(maxParticles * 1.05));
      }

      const progress = Math.min(1, Math.max(0, getProgressRef.current ? getProgressRef.current() : 0));
      const weights = getClimateWeights(progress);

      // --- spawn ---
      for (const mode of ['rain', 'mote', 'ember', 'dust']) {
        spawnDebt[mode] += SPAWN[mode] * (weights[mode] || 0) * dt;
        while (spawnDebt[mode] >= 1) {
          spawnDebt[mode] -= 1;
          if (particles.length < maxParticles) particles.push(makeParticle(mode, W, H));
          else break;
        }
      }

      // --- lightning ---
      let flashAlpha = 0;
      if (isStormChapter(progress)) {
        flashTimer -= dt;
        if (flashTimer <= 0) {
          flashActive = rand(0.12, 0.22);
          flashSeed = Math.random();
          flashTimer = rand(3.5, 9);
        }
      }
      if (flashActive > 0) {
        flashActive -= dt;
        const t = Math.max(0, flashActive / 0.22);
        // double-flicker strike profile
        flashAlpha = t * (0.10 + 0.08 * Math.abs(Math.sin(flashSeed * 40 + t * 25)));
      }

      ctx.clearRect(0, 0, W, H);

      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(190, 215, 245, ${flashAlpha.toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      // --- fog banks + finale light shafts (behind particles) ---
      const fogWeight = Math.max(weights.mote * 0.55, weights.dust);
      if (fogWeight > 0.03) {
        const t = now / 1000;
        const cool = weights.mote >= weights.dust;
        for (const f of fogBanks) {
          const fx = f.u * W + Math.sin(t * f.speed + f.phase) * 60 + rigState.x * -50 * f.depth;
          const fy = f.v * H + Math.cos(t * f.speed * 0.8 + f.phase) * 30;
          const fr = f.r * Math.max(W, H);
          const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
          const tint = cool ? '74, 144, 184' : '232, 205, 155';
          g.addColorStop(0, `rgba(${tint}, ${(0.13 * fogWeight).toFixed(3)})`);
          g.addColorStop(1, `rgba(${tint}, 0)`);
          ctx.fillStyle = g;
          ctx.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
        }
      }

      // Slanted lamplight shafts in the amber finale
      if (weights.dust > 0.05) {
        ctx.save();
        ctx.translate(W * 0.68, 0);
        ctx.rotate(0.32);
        const shaftA = Math.min(0.12, weights.dust * 0.12);
        for (const [sx, sw] of [[-70, 90], [60, 46]]) {
          const grad = ctx.createLinearGradient(0, 0, 0, H * 1.2);
          grad.addColorStop(0, `rgba(255, 225, 170, ${shaftA.toFixed(3)})`);
          grad.addColorStop(1, 'rgba(255, 225, 170, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sx, -40, sw, H * 1.2);
        }
        ctx.restore();
      }

      // --- update + draw (pixel rects, no smoothing) ---
      const rainBoost = 1 + flashAlpha * 4;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.maxAge) {
          // recycle rain from the top to avoid pop-in
          if (p.mode === 'rain' && weights.rain > 0.05 && particles.length < maxParticles) {
            Object.assign(p, makeParticle('rain', W, H));
            continue;
          }
          particles.splice(i, 1);
          continue;
        }

        const lifeT = p.age / p.maxAge;
        const fade = lifeT < 0.12 ? lifeT / 0.12 : 1 - Math.max(0, (lifeT - 0.7) / 0.3);

        if (p.mode === 'rain') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y > H + 20) {
            // impact tick where the drop lands
            if (particles.length < maxParticles && weights.rain > 0.05 && Math.random() < 0.45) {
              particles.push(makeSplash(p.x, H - rand(2, 10)));
            }
            if (weights.rain > 0.05) Object.assign(p, makeParticle('rain', W, H));
            else particles.splice(i, 1);
            continue;
          }
          const a = (0.28 + 0.3 * (p.size / 2.4)) * fade * Math.min(1, weights.rain * 2) * rainBoost;
          ctx.fillStyle = `rgba(168, 190, 222, ${Math.min(0.75, a).toFixed(3)})`;
          // slanted streak: offset x by streak length for wind shear
          ctx.fillRect(p.x, p.y, p.size, p.len);
          ctx.fillRect(p.x - p.len * 0.18, p.y - 1, p.size * 0.7, 2);
        } else if (p.mode === 'mote') {
          // perspective warp: near motes fall faster and render larger
          const warp = 1 + (p.z || 0) * 2.2;
          p.x += (p.vx + Math.sin(now / 700 + p.seed) * 12) * dt * warp;
          p.y += p.vy * dt * warp;
          const moteSize = p.size * (0.6 + (p.z || 0) * 1.4);
          const flicker = 0.55 + 0.45 * Math.sin(now / 260 + p.seed * 3);
          const a = 0.75 * fade * flicker * Math.min(1, weights.mote * 2);
          ctx.fillStyle = `rgba(141, 243, 255, ${(a * 0.25).toFixed(3)})`;
          ctx.fillRect(p.x - moteSize, p.y - moteSize, moteSize * 3, moteSize * 3);
          ctx.fillStyle = `rgba(200, 250, 255, ${Math.min(1, a).toFixed(3)})`;
          ctx.fillRect(p.x, p.y, moteSize, moteSize);
        } else if (p.mode === 'splash') {
          const a = (1 - lifeT) * 0.6 * Math.min(1, weights.rain * 2);
          ctx.fillStyle = `rgba(190, 205, 230, ${Math.max(0, a).toFixed(3)})`;
          ctx.fillRect(p.x - p.size, p.y, p.size * 2, 1.5);
        } else if (p.mode === 'ember') {
          p.x += (p.vx + Math.sin(now / 450 + p.seed) * 26) * dt;
          p.y += p.vy * dt;
          const flicker = 0.5 + 0.5 * Math.sin(now / 180 + p.seed * 5);
          const a = 0.8 * fade * flicker * Math.min(1, weights.ember * 2);
          ctx.fillStyle = `rgba(255, 150, 60, ${(a * 0.3).toFixed(3)})`;
          ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 3, p.size * 3);
          ctx.fillStyle = `rgba(255, 190, 110, ${Math.min(1, a).toFixed(3)})`;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else {
          // dust
          p.x += (p.vx + Math.sin(now / 900 + p.seed) * 8) * dt;
          p.y += p.vy * dt;
          const a = 0.5 * fade * Math.min(1, weights.dust * 2);
          ctx.fillStyle = `rgba(230, 211, 163, ${Math.min(0.6, a).toFixed(3)})`;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      // --- manga speed lines, intensity follows scroll velocity ---
      const vel = Math.min(1.5, rigState.vel);
      if (vel > 0.12 && W > 0) {
        const lineAlpha = Math.min(0.4, (vel - 0.12) * 0.45);
        const cx = W / 2 + rigState.x * -60;
        const cy = H / 2 + rigState.y * -40;
        const maxR = Math.max(W, H);
        const tint = weights.mote > 0.4 ? '141, 243, 255'
          : weights.ember > 0.4 ? '255, 190, 110'
          : '244, 240, 231';
        ctx.fillStyle = `rgba(${tint}, ${lineAlpha.toFixed(3)})`;
        for (const s of speedSeeds) {
          const r0 = maxR * (0.18 + s.offset * 0.2);
          const len = maxR * (0.12 + vel * 0.22);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(s.angle);
          ctx.fillRect(r0, -s.width / 2, len, s.width);
          ctx.restore();
        }
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="atmosphere-wrapper" ref={wrapperRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
