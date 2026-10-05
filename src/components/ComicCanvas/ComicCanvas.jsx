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
    const ctx = canvas.getContext('2d');
    if (!ctx || !isReady) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targetIndex = Math.round(scrollProgress * (TOTAL_FRAMES - 1));
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

    const focusMoved =
      Math.abs(lastFocusRef.current.x - targetFocus.x) +
      Math.abs(lastFocusRef.current.y - targetFocus.y) > 0.004;

    if (currentFrameIndexRef.current === targetIndex && Math.abs(lastZoomRef.current - targetZoom) < 0.002 && !focusMoved && !fadeRef.current) return;

    const img = getFrame(targetIndex);
    if (!img) return;

    // Frame cut → open a short dissolve from the previously drawn image
    if (currentFrameIndexRef.current !== targetIndex) {
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

    const dpr = window.devicePixelRatio || 1;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();

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

    // Export dimensions to root so HTML overlays perfectly track the canvas image coordinates
    document.documentElement.style.setProperty('--img-w', `${renderWidth}px`);
    document.documentElement.style.setProperty('--img-h', `${renderHeight}px`);
    document.documentElement.style.setProperty('--img-x', `${offsetX}px`);
    document.documentElement.style.setProperty('--img-y', `${offsetY}px`);
    document.documentElement.style.setProperty('--img-scale', `${renderWidth / 1920}`);

    // Dissolve the new frame over the previous one (both share geometry)
    const fade = fadeRef.current;
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
    } else {
      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
    }

    if (!prefersReducedMotion && targetIndex % 5 === 0) {
      loadAroundFrame(targetIndex);
    }
  }, [getFrame, isReady, loadAroundFrame, scrollProgress, zoom, focus]);

  const tick = useCallback(() => {
    drawFrame();
    requestRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

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
