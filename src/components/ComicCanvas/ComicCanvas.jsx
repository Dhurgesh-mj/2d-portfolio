import React, { useEffect, useRef, useCallback } from 'react';
import { useFrameSequence } from './useFrameSequence';
import './comicCanvas.css';

export function ComicCanvas({ scrollProgress = 0, zoom = 1, focus = null, dof = 0, onReady, onLoadingProgress }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const requestRef = useRef(null);
  const currentFrameIndexRef = useRef(-1);
  const lastZoomRef = useRef(1);
  const lastFocusRef = useRef({ x: 0.5, y: 0.5 });
  // Crossfade state: { from, start } — `to` is always the current index image
  const fadeRef = useRef(null);
  const lastDrawnImgRef = useRef(null);
  // Latest props via refs so the rAF loop mounts once instead of tearing
  // down + restarting on every React render.
  const latestRef = useRef({ scrollProgress, zoom, focus });
  latestRef.current = { scrollProgress, zoom, focus };
  const cachedRectRef = useRef(null);
  const lastExportedRef = useRef({ w: 0, h: 0, x: 0, y: 0, s: 0 });
  const lastFracRef = useRef(0);
  const FADE_MS = 120;
  const TOTAL_FRAMES = 240;

  const { getFrame, loadAroundFrame, isReady, loadingProgress } = useFrameSequence(TOTAL_FRAMES, '/comic/frame_', '.webp');

  // Notify parent about ready state
  useEffect(() => {
    if (isReady && onReady) onReady();
  }, [isReady, onReady]);

  // Notify parent about loading progress
  useEffect(() => {
    if (onLoadingProgress) onLoadingProgress(loadingProgress);
  }, [loadingProgress, onLoadingProgress]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx = canvas._ctx;
    if (!ctx) {
      ctx = canvas.getContext('2d');
      canvas._ctx = ctx;
    }
    if (!ctx || !isReady) return;
    if (document.hidden) return;

    const { scrollProgress: sp, zoom, focus } = latestRef.current;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targetIndex = Math.round(sp * (TOTAL_FRAMES - 1));
    targetIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetIndex));

    // Ken Burns push-in per chapter; frozen when reduced motion is preferred
    const targetZoom = prefersReducedMotion ? 1 : zoom;
    // Focal point the zoom anchors on (0.5 = center); locked center on RM.
    // Non-finite values fall back to center — NaN geometry would silently
    // blank the canvas AND the overlay (which tracks the exported rect).
    const rawFocus = focus || { x: 0.5, y: 0.5 };
    const safeFocus = {
      x: Number.isFinite(rawFocus.x) ? rawFocus.x : 0.5,
      y: Number.isFinite(rawFocus.y) ? rawFocus.y : 0.5,
    };
    const targetFocus = prefersReducedMotion
      ? { x: 0.5, y: 0.5 }
      : {
          x: Math.min(0.7, Math.max(0.3, safeFocus.x)),
          y: Math.min(0.7, Math.max(0.3, safeFocus.y)),
        };

    if (prefersReducedMotion) {
      targetIndex = 90;
    }

    // Fractional position between frames: blending floor+ceil by this weight
    // makes the background glide instead of stepping every ~9vh of scroll.
    // No extra downloads — it reuses the same 240 frames.
    const exact = sp * (TOTAL_FRAMES - 1);
    const i0 = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(exact)));
    const frac = Math.max(0, Math.min(1, exact - i0));
    const blending =
      !prefersReducedMotion && frac > 0.02 && frac < 0.98 && i0 + 1 < TOTAL_FRAMES;

    const focusMoved =
      Math.abs(lastFocusRef.current.x - targetFocus.x) +
      Math.abs(lastFocusRef.current.y - targetFocus.y) > 0.004;

    if (
      currentFrameIndexRef.current === targetIndex &&
      Math.abs(lastZoomRef.current - targetZoom) < 0.002 &&
      !focusMoved &&
      !fadeRef.current &&
      (!blending || Math.abs(lastFracRef.current - frac) < 0.01)
    )
      return;

    const img = getFrame(blending ? i0 : targetIndex);
    if (!img) return;

    // Frame cut → open a short dissolve from the previously drawn image.
    // Hard-cut when scrubbing fast (jumped >2 frames): a 120ms dissolve is
    // invisible mid-flick and costs a second fullscreen drawImage per frame.
    // Blending replaces the dissolve outright — it already is a crossfade.
    const indexJump = Math.abs(targetIndex - currentFrameIndexRef.current);
    if (blending) {
      fadeRef.current = null;
      lastDrawnImgRef.current = img;
    } else if (currentFrameIndexRef.current !== targetIndex && indexJump <= 2) {
      const prevImg = lastDrawnImgRef.current;
      if (!prefersReducedMotion && prevImg && prevImg !== img) {
        fadeRef.current = { from: prevImg, start: performance.now() };
      } else {
        fadeRef.current = null;
      }
      lastDrawnImgRef.current = img;
    }
    currentFrameIndexRef.current = targetIndex;
    lastZoomRef.current = targetZoom;
    lastFocusRef.current = targetFocus;
    lastFracRef.current = frac;

    // DPR capped at 1.5: full 2x/3x retina quadruples fill-rate on a
    // fullscreen drawImage for zero visible gain on pixel-art frames.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // getBoundingClientRect forces layout; the wrapper is fullscreen-stable
    // so cache it, re-measuring only on resize (or if cached zero-sized).
    let rect = cachedRectRef.current;
    if (!rect || rect.width < 2 || rect.height < 2) {
      rect = wrapper.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      cachedRectRef.current = rect;
    }

    const needsResize = canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr);
    if (needsResize) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, rect.width, rect.height);

    const imgRatio = img.naturalWidth / img.naturalHeight || 16 / 9;
    const canvasRatio = rect.width / rect.height;

    let renderWidth, renderHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      renderWidth = rect.width;
      renderHeight = rect.width / imgRatio;
      offsetX = 0;
      offsetY = (rect.height - renderHeight) / 2;
    } else {
      renderWidth = rect.height * imgRatio;
      renderHeight = rect.height;

      const isPortrait = rect.height > rect.width;
      if (isPortrait) {
        offsetX = -((renderWidth - rect.width) * 0.2);
      } else {
        offsetX = (rect.width - renderWidth) / 2;
      }
      offsetY = 0;
    }

    // Cine-cam: scale toward the focal point, then export the scaled
    // rect so HTML overlays keep tracking the artwork exactly
    const scaledWidth = renderWidth * targetZoom;
    const scaledHeight = renderHeight * targetZoom;
    offsetX -= (scaledWidth - renderWidth) * targetFocus.x;
    offsetY -= (scaledHeight - renderHeight) * targetFocus.y;
    renderWidth = scaledWidth;
    renderHeight = scaledHeight;

    // Export dimensions to root so HTML overlays perfectly track the canvas
    // image coordinates. Writing CSS vars forces style recalc tree-wide, so
    // only write when something actually moved.
    const prev = lastExportedRef.current;
    const scale = renderWidth / 1920;
    if (
      Math.abs(prev.w - renderWidth) > 0.5 ||
      Math.abs(prev.h - renderHeight) > 0.5 ||
      Math.abs(prev.x - offsetX) > 0.5 ||
      Math.abs(prev.y - offsetY) > 0.5 ||
      Math.abs(prev.s - scale) > 0.0005
    ) {
      const root = document.documentElement.style;
      root.setProperty('--img-w', `${renderWidth}px`);
      root.setProperty('--img-h', `${renderHeight}px`);
      root.setProperty('--img-x', `${offsetX}px`);
      root.setProperty('--img-y', `${offsetY}px`);
      root.setProperty('--img-scale', `${scale}`);
      lastExportedRef.current = { w: renderWidth, h: renderHeight, x: offsetX, y: offsetY, s: scale };
    }

    // Fractional blend between adjacent frames (both share geometry).
    // Takes precedence over the cut-dissolve below — it already is one.
    if (blending) {
      const img1 = getFrame(i0 + 1);
      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
      if (img1 && img1 !== img) {
        ctx.globalAlpha = frac;
        ctx.drawImage(img1, offsetX, offsetY, renderWidth, renderHeight);
        ctx.globalAlpha = 1;
        lastDrawnImgRef.current = img1;
      }
    }

    // Dissolve the new frame over the previous one (both share geometry)
    const fade = !blending ? fadeRef.current : null;
    if (fade) {
      const t = (performance.now() - fade.start) / FADE_MS;
      if (t >= 1) {
        fadeRef.current = null;
        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(fade.from, offsetX, offsetY, renderWidth, renderHeight);
        ctx.globalAlpha = Math.max(0, Math.min(1, t));
        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
        ctx.globalAlpha = 1;
      }
    } else if (!blending) {
      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
    }

    if (!prefersReducedMotion && targetIndex % 5 === 0) {
      loadAroundFrame(targetIndex);
    }
  }, [getFrame, isReady, loadAroundFrame]);

  // Stable loop mounted once: routes through a ref to the latest drawFrame
  // (which closes over isReady/getFrame). Re-subscribing per render caused
  // rAF churn 60x/sec during scrolls.
  const drawFrameRef = useRef(drawFrame);
  drawFrameRef.current = drawFrame;
  const tick = useCallback(() => {
    drawFrameRef.current();
    requestRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  useEffect(() => {
    const handleResize = () => {
      currentFrameIndexRef.current = -1;
      fadeRef.current = null;
      cachedRectRef.current = null;
      drawFrame();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawFrame]);

  return (
    <div className="comic-canvas-wrapper" ref={wrapperRef} style={{ '--dof': `${dof}px` }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  );
}
