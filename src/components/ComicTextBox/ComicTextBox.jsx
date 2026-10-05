import React from 'react';
import './comicTextBox.css';

const ComicTextBox = ({
  children,
  variant = 'paper',
  className = '',
  style = {},
  as: Component = 'div',
}) => {
  const baseClass = `comic-text-box comic-text-box--${variant}`;
  const classes = `${baseClass} ${className}`.trim();

  return (
    <Component className={classes} style={style}>
      <div className="comic-text-box__content">
        {children}
      </div>
    </Component>
  );
};

export default ComicTextBox;
