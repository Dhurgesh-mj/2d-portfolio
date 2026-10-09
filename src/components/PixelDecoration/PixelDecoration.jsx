import React from 'react';
import './pixelDecoration.css';

export const PixelCorner = ({ position = 'top-left', color = 'var(--ink)', size = 4 }) => {
  const style = {
    backgroundColor: color,
    width: `${size}px`,
    height: `${size}px`,
  };
  return <div className={`pixel-corner pixel-corner--${position}`} style={style} />;
};

export const PixelDivider = ({ color = 'var(--ink)', width = '100%' }) => {
  return (
    <div
      className="pixel-divider"
      style={{
        width,
        backgroundImage: `linear-gradient(to right, ${color} 50%, transparent 50%)`,
      }}
    />
  );
};

export const PixelMarker = ({ active = false, color = 'var(--ink)' }) => {
  return (
    <div
      className={`pixel-marker ${active ? 'pixel-marker--active' : ''}`}
      style={{
        borderColor: color,
        backgroundColor: active ? color : 'transparent',
      }}
    />
  );
};

export const PixelBurst = ({ size = 4 }) => {
  return (
    <div className="pixel-burst" style={{ '--burst-size': `${size}px` }}>
      <div className="pixel-burst__dot pixel-burst__dot--top" />
      <div className="pixel-burst__dot pixel-burst__dot--right" />
      <div className="pixel-burst__dot pixel-burst__dot--bottom" />
      <div className="pixel-burst__dot pixel-burst__dot--left" />
    </div>
  );
};
