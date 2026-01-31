import React, { useCallback } from 'react';
import './zoom-controls.scss';

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  disabled = false,
}) {
  const handleZoomIn = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onZoomIn();
      }
    },
    [onZoomIn, disabled]
  );

  const handleZoomOut = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onZoomOut();
      }
    },
    [onZoomOut, disabled]
  );

  return (
    <div className="zoom-controls">
      <button
        className="zoom-button zoom-in"
        onClick={handleZoomIn}
        disabled={disabled}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        className="zoom-button zoom-out"
        onClick={handleZoomOut}
        disabled={disabled}
        aria-label="Zoom out"
      >
        -
      </button>
    </div>
  );
}
