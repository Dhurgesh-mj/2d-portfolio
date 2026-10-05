import React from 'react';
import './errorBoundary.css';

/**
 * ErrorBoundary — if any chapter of the story crashes, show a styled
 * "torn page" fallback with a reload action instead of a blank screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Story crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-fallback" role="alert">
          <div className="error-fallback__panel">
            <div className="error-fallback__eyebrow">PAGE TORN</div>
            <h1 className="error-fallback__title">THE STORY RIPPED HERE</h1>
            <p className="error-fallback__body">
              Something broke while inking this chapter. A fresh page usually fixes it.
            </p>
            <button
              type="button"
              className="error-fallback__reload"
              onClick={() => window.location.reload()}
            >
              RELOAD THE STORY →
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
