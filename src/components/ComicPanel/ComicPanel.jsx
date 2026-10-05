import React from 'react';
import './comicPanel.css';
import ComicTextBox from '../ComicTextBox/ComicTextBox';
import { ChapterLabel } from '../PixelDecoration/PixelDecoration';

const ComicPanel = ({
  children,
  size = 'md',
  variant = 'light',
  className = '',
  style = {},
  caption,
  chapterNumber,
}) => {
  const panelClasses = `comic-panel comic-panel--${size} comic-panel--${variant} ${className}`.trim();

  return (
    <div className={panelClasses} style={style}>
      <div className="comic-panel__inner">
        {chapterNumber && (
          <div className="comic-panel__chapter">
            <ChapterLabel number={chapterNumber} title="" />
          </div>
        )}
        <div className="comic-panel__content">
          {children}
        </div>
      </div>
      {caption && (
        <div className="comic-panel__caption-wrapper">
          <ComicTextBox variant={variant === 'dark' ? 'dark' : 'paper'} className="comic-panel__caption">
            {caption}
          </ComicTextBox>
        </div>
      )}
    </div>
  );
};

export default ComicPanel;
