import React, { useState, useEffect, useRef } from 'react';
import './loadingScreen.css';

const SKIP_AFTER_MS = 5000; // show skip button after 5s
const FORCE_READY_MS = 10000; // force complete after 10s

// Terminal boot log — lines unlock as the frame sequence loads
const BOOT_LINES = [
  { at: 0.0, text: 'INKING PANELS' },
  { at: 0.25, text: 'LOADING FRAME SEQUENCE [240]' },
  { at: 0.5, text: 'MIXING INK :: CYAN / MAGENTA' },
  { at: 0.75, text: 'BINDING STORY ARC' },
];

const LoadingScreen = ({ progress = 0, isReady = false }) => {
  const [mounted, setMounted] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [forceReady, setForceReady] = useState(false);
  const skipTimerRef = useRef(null);
  const forceTimerRef = useRef(null);

  // Start stall timers on mount
  useEffect(() => {
    skipTimerRef.current = setTimeout(() => setShowSkip(true), SKIP_AFTER_MS);
    forceTimerRef.current = setTimeout(() => setForceReady(true), FORCE_READY_MS);
    return () => {
      clearTimeout(skipTimerRef.current);
      clearTimeout(forceTimerRef.current);
    };
  }, []);

  // Begin fade-out when ready (from prop or force)
  useEffect(() => {
    if (isReady || forceReady) {
      clearTimeout(skipTimerRef.current);
      clearTimeout(forceTimerRef.current);
      setFadingOut(true);
      const timer = setTimeout(() => setMounted(false), 700);
      return () => clearTimeout(timer);
    }
  }, [isReady, forceReady]);

  if (!mounted) return null;

  const widthPercentage = `${Math.min(Math.max(progress * 100, 0), 100)}%`;
  const visibleLines = BOOT_LINES.filter((l) => progress >= l.at);
  const storyReady = isReady || forceReady;

  return (
    <div className={`comic-loading-screen ${fadingOut ? 'comic-loading-screen--fade-out' : ''}`}>
      <div className="comic-loading-screen__texture" />
      <div className="comic-loading-screen__content">
        <h1 className="comic-loading-screen__text">LOADING THE STORY...</h1>
        <div className="comic-loading-screen__progress-wrapper">
          <div
            className="comic-loading-screen__progress-bar"
            style={{ width: widthPercentage }}
          />
        </div>
        <span className="comic-loading-screen__percent">{Math.round(progress * 100)}%</span>

        {/* Boot log */}
        <div className="comic-loading-screen__boot" aria-hidden="true">
          {visibleLines.map((l) => (
            <div key={l.text} className="boot-line">
              <span className="boot-line__prompt">&gt;</span> {l.text}
            </div>
          ))}
          {storyReady ? (
            <div className="boot-line boot-line--ready">
              <span className="boot-line__prompt">&gt;</span> STORY READY — OPENING PAGE 01
            </div>
          ) : (
            <div className="boot-line">
              <span className="boot-line__prompt">&gt;</span>
              <span className="boot-line__cursor" />
            </div>
          )}
        </div>
      </div>

      {/* Skip button — appears after SKIP_AFTER_MS of waiting */}
      {showSkip && !fadingOut && (
        <button
          className="comic-loading-screen__skip"
          onClick={() => setForceReady(true)}
          aria-label="Skip loading and enter"
        >
          SKIP →
        </button>
      )}
    </div>
  );
};

export default LoadingScreen;
