import { useState, useEffect, useRef, useCallback } from 'react';

export function useFrameSequence(totalFrames = 240, basePath = '/comic/frame_', fileExtension = '.webp') {
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const cache = useRef(new Map());
  const loading = useRef(new Set());
  const queue = useRef([]);
  const activeCount = useRef(0);
  const MAX_CONCURRENT = 6; // urgent loads (user is scrubbing)
  const IDLE_CONCURRENT = 2; // background long-tail drain
  const urgentUntil = useRef(0);
  const isUnmounted = useRef(false);
  const initialPassComplete = useRef(false);
  const lastProgressSent = useRef(-1);

  const getFilename = (index) => {
    const padded = String(index + 1).padStart(4, '0');
    return `${basePath}${padded}${fileExtension}`;
  };

  const processQueue = useCallback(() => {
    if (isUnmounted.current) return;

    // Full speed while the user is interacting; trickle the long tail
    // on idle so scrubbing never fights background downloads.
    const limit = (initialPassComplete.current && Date.now() > urgentUntil.current)
      ? IDLE_CONCURRENT
      : MAX_CONCURRENT;

    while (activeCount.current < limit && queue.current.length > 0) {
      const index = queue.current.shift();
      
      if (cache.current.has(index) || loading.current.has(index)) {
        continue;
      }
      
      loading.current.add(index);
      activeCount.current++;
      
      const img = new Image();
      img.onload = () => {
        if (!isUnmounted.current) {
          cache.current.set(index, img);
          loading.current.delete(index);
          activeCount.current--;
          
          const loadedCount = cache.current.size;
          
          // Wait until at least the skeleton frames are loaded before ready
          if (!initialPassComplete.current && loadedCount >= 20) {
            initialPassComplete.current = true;
            setIsReady(true);
          }

          // Two-phase bar: opening the book (0→20 frames = 0→85%),
          // then sharpening pages (20→240 = 85→100%). Always moving.
          const phased = loadedCount < 20
            ? (loadedCount / 20) * 0.85
            : 0.85 + ((loadedCount - 20) / (totalFrames - 20)) * 0.15;
          if (phased - lastProgressSent.current > 0.01 || loadedCount === totalFrames) {
            lastProgressSent.current = phased;
            setLoadingProgress(Math.min(1, phased));
          }
          
          processQueue();
        }
      };
      
      img.onerror = () => {
        if (!isUnmounted.current) {
          loading.current.delete(index);
          activeCount.current--;
          processQueue();
        }
      };
      
      img.src = getFilename(index);
    }
  }, [basePath, fileExtension, totalFrames]);

  const loadAroundFrame = useCallback((centerIndex) => {
    // Mark the next 2.5s as urgent: neighborhood loads get full concurrency
    urgentUntil.current = Date.now() + 2500;
    const newQueue = [];
    
    // 1. Immediate neighborhood of current view
    for (let i = 0; i <= 5; i++) {
      if (centerIndex + i < totalFrames) newQueue.push(centerIndex + i);
      if (i > 0 && centerIndex - i >= 0) newQueue.push(centerIndex - i);
    }
    
    // 2. Skeleton frames (every 12th frame) so entire timeline is somewhat covered
    for (let i = 0; i < totalFrames; i += 12) {
      if (!newQueue.includes(i)) newQueue.push(i);
    }
    
    // 3. Secondary skeleton (every 4th frame)
    for (let i = 0; i < totalFrames; i += 4) {
      if (!newQueue.includes(i)) newQueue.push(i);
    }
    
    // 4. Fill the rest sequentially
    for (let i = 0; i < totalFrames; i++) {
      if (!newQueue.includes(i) && !cache.current.has(i) && !loading.current.has(i)) {
        newQueue.push(i);
      }
    }
    
    queue.current = newQueue;
    processQueue();
  }, [totalFrames, processQueue]);

  useEffect(() => {
    isUnmounted.current = false;
    
    // Initial priority load: first frame + a spread to guarantee 'isReady' safely
    const initialQueue = [0];
    for (let i = 12; i < totalFrames; i += 12) {
      initialQueue.push(i);
    }
    queue.current = initialQueue;
    processQueue();
    
    const timer = setTimeout(() => {
      loadAroundFrame(0);
    }, 100);

    return () => {
      isUnmounted.current = true;
      clearTimeout(timer);
    };
  }, [loadAroundFrame, processQueue, totalFrames]);

  const getFrame = useCallback((index) => {
    const clampedIndex = Math.max(0, Math.min(totalFrames - 1, Math.round(index)));
    
    if (cache.current.has(clampedIndex)) {
      return cache.current.get(clampedIndex);
    }
    
    // Fallback: find nearest cached frame
    let nearestDist = Infinity;
    let nearestFrame = null;
    
    for (const [cachedIdx, img] of cache.current.entries()) {
      const dist = Math.abs(cachedIdx - clampedIndex);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestFrame = img;
      }
    }
    
    return nearestFrame;
  }, [totalFrames]);

  return {
    getFrame,
    loadAroundFrame,
    loadingProgress,
    isReady
  };
}
