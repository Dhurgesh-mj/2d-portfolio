import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ComicCanvas } from './components/ComicCanvas/ComicCanvas';
import { Atmosphere } from './components/Atmosphere/Atmosphere';
import { PixelCursor } from './components/PixelCursor/PixelCursor';
import { CameraRig } from './components/CameraRig/CameraRig';
import { rigState } from './components/CameraRig/rigState';
import { getCinePose } from './components/Camera/cineCam';
import { useMediaQuery } from './hooks/useMediaQuery';
import { Spotlight } from './components/Spotlight/Spotlight';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { useScrollProgress } from './hooks/useScrollProgress';
import Navigation from './components/Navigation/Navigation';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Skills from './components/sections/Skills';
import Achievements from './components/sections/Achievements';
import Projects from './components/sections/Projects';
import Contact from './components/sections/Contact';
import './App.css';

const SECTION_RANGES = [
  { id: 'hero', label: 'ORIGIN', start: 0, end: 0.15 },
  { id: 'about', label: 'IDENTITY', start: 0.15, end: 0.31 },
  { id: 'skills', label: 'ARSENAL', start: 0.31, end: 0.48 },
  { id: 'achievements', label: 'ACHIEVEMENTS', start: 0.48, end: 0.62 },
  { id: 'projects', label: 'PROJECTS', start: 0.62, end: 0.82 },
  { id: 'contact', label: 'NEXT CHAPTER', start: 0.82, end: 1.0 },
];

function App() {
  const scrollContainerRef = useRef(null);
  const stickyRef = useRef(null);
  const scrollData = useScrollProgress(scrollContainerRef);
  const { currentSection } = scrollData;

  const [frameReady, setFrameReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const rafRef = useRef(null);
  const [renderTick, setRenderTick] = useState(0);

  const scrollDataRef = useRef(scrollData);
  scrollDataRef.current = scrollData;

  // Stable getter so canvas layers can read progress without re-rendering
  const getProgress = useCallback(() => scrollDataRef.current.progress, []);

  // Update browser tab title per section
  useEffect(() => {
    const section = SECTION_RANGES.find(s => s.id === currentSection);
    if (section) {
      document.title = `${section.label} — Dhurgesh M J`;
    }
  }, [currentSection]);

  // Drive a render tick ONLY if the scroll progress actually changed
  useEffect(() => {
    let running = true;
    let lastProgress = -1;
    
    const tick = () => {
      if (!running) return;
      
      const current = scrollDataRef.current.progress; 
      
      if (Math.abs(current - lastProgress) > 0.0001) {
        setRenderTick(t => t + 1);
        lastProgress = current;
      }
      
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Read progress on each render tick
  const currentProgress = scrollData.progress;
  const currentSectionProgress = scrollData.sectionProgress;

  // Cine-cam: scroll-driven camera choreography per chapter (zoom +
  // focal point), replacing the old flat Ken Burns push. Velocity adds
  // a brief outward kick on fast flicks. Read live from the rig singleton.
  const isMobileCam = useMediaQuery('(max-width: 768px)');
  const cinePose = getCinePose(currentSection, currentSectionProgress, rigState.vel, isMobileCam);

  // Depth-of-field: art softens while panels hold focus (sharp on cuts)
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const dofBlur = 2 * clamp01((currentSectionProgress - 0.12) / 0.13) * clamp01((0.9 - currentSectionProgress) / 0.15);

  const getSectionState = useCallback((sectionId) => {
    const range = SECTION_RANGES.find(s => s.id === sectionId);
    if (!range) return { isActive: false, sectionProgress: 0 };

    const p = currentProgress;
    const isActive = p >= range.start && p <= range.end;
    const rangeSize = range.end - range.start;
    const sp = Math.min(1, Math.max(0, (p - range.start) / rangeSize));

    return { isActive, sectionProgress: sp };
  }, [currentProgress]);

  const currentSectionIndex = SECTION_RANGES.findIndex(s => s.id === currentSection);

  return (
    <>
      <PixelCursor />
      {/* Announce chapter changes to screen readers */}
      <div className="sr-only" aria-live="polite">
        {`Chapter ${currentSectionIndex + 1} of ${SECTION_RANGES.length}: ${SECTION_RANGES[currentSectionIndex]?.label ?? ''}`}
      </div>
      <LoadingScreen progress={loadingProgress} isReady={frameReady} />

      <div className={`comic-scroll${frameReady ? ' is-live' : ''}`} ref={scrollContainerRef}>
        <ErrorBoundary>
        <div ref={stickyRef} className="comic-sticky">
          <CameraRig targetRef={stickyRef} getProgress={getProgress} />
          <ComicCanvas
            scrollProgress={currentProgress}
            zoom={cinePose.zoom}
            focus={{ x: cinePose.fx, y: cinePose.fy }}
            dof={dofBlur}
            onReady={() => setFrameReady(true)}
            onLoadingProgress={setLoadingProgress}
          />

          <Atmosphere getProgress={getProgress} />
          <Spotlight getProgress={getProgress} />
          <div className="film-grain" aria-hidden="true" />
          <div className="vignette" aria-hidden="true" />

          <div className="comic-overlay">
            <Hero
              {...getSectionState('hero')}
            />
            <About
              {...getSectionState('about')}
            />
            <Skills
              {...getSectionState('skills')}
            />
            <Achievements
              {...getSectionState('achievements')}
            />
            <Projects
              {...getSectionState('projects')}
            />
            <Contact
              {...getSectionState('contact')}
            />
            
          </div>

          <Navigation
            currentSection={currentSectionIndex}
            progress={currentProgress}
            sections={SECTION_RANGES}
          />
        </div>
        </ErrorBoundary>
      </div>
    </>
  );
}

export default App;
