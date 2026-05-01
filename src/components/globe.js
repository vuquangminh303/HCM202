import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import ReactGlobe from 'react-globe';
import * as THREE from 'three';

import { useStateValue } from '../state';
import Fade from './fade';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

// Globe radius in react-globe (from library internals) - used for marker size scaling
const GLOBE_RADIUS = 300;

// Pre-create materials to avoid recreating them repeatedly
const markerMaterials = {
  1: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FFD700'),
    side: THREE.DoubleSide,
  }), // Gold - for single events
  2: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FF4500'),
    side: THREE.DoubleSide,
  }), // Orange-red - for 2 events
  3: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#DC143C'),
    side: THREE.DoubleSide,
  }), // Crimson - for 3 events
  4: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#9932CC'),
    side: THREE.DoubleSide,
  }), // Dark Orchid - for 4 events
  5: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FF1493'),
    side: THREE.DoubleSide,
  }), // Deep Pink - for 5+ events
};

// High-contrast color for focused marker (stands out vs blues + warm marker palette)
const focusedMarkerMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#00BF19'), // neon cyan
  side: THREE.DoubleSide,
});

function createSphereMarker(marker) {
  // Use the eventsCount property from the marker for non-focused markers
  const eventsAtLocation = marker.eventsCount || 1;

  // Calculate size based on number of events - scale relative to globe (2-4% of globe radius for visibility)
  const baseScale = 0.004; // ~6 units at radius 300
  const sizeScale = baseScale + eventsAtLocation * 0.002;
  const size = Math.min(GLOBE_RADIUS * sizeScale, GLOBE_RADIUS * 0.04); // Max ~4% of globe radius

  // Determine the event count category for material selection
  const eventCategory = eventsAtLocation > 4 ? 5 : eventsAtLocation;

  // Get the appropriate material based on event count,
  // but override with focused style when needed
  const material = marker?.__isFocused
    ? focusedMarkerMaterial
    : markerMaterials[eventCategory];

  // Create a solid sphere marker
  const geometry = new THREE.SphereGeometry(size, 16, 16);

  const sphere = new THREE.Mesh(geometry, material);

  return sphere;
}

function markerRenderer(marker) {
  return createSphereMarker(marker);
}

export default function Globe() {
  const globeEl = useRef();
  const [hasGlobeBackgroundTextureLoaded, setHasGlobeBackgroundTextureLoaded] =
    useState(false);
  const [hasGlobeCloudsTextureLoaded, setHasGlobeCloudsTextureLoaded] =
    useState(false);
  const [hasGlobeTextureLoaded, setHasGlobeTextureLoaded] = useState(false);
  const [textureLoadError, setTextureLoadError] = useState(false);
  const [{ config, focusedMarker, hasLoaded, markers, start }, dispatch] =
    useStateValue();

  // Debounce focus updates to ReactGlobe to prevent rapid focus changes from
  // overwhelming internal camera tweening (can cause "stuck" focus when user
  // switches events quickly). We only want the latest focus to win.
  const [globeFocus, setGlobeFocus] = useState(null);
  const focusDebounceTimerRef = useRef(null);

  useEffect(() => {
    if (
      hasGlobeBackgroundTextureLoaded &&
      hasGlobeCloudsTextureLoaded &&
      hasGlobeTextureLoaded
    ) {
      dispatch({ type: 'LOADED' });
    }
  }, [
    dispatch,
    hasGlobeBackgroundTextureLoaded,
    hasGlobeCloudsTextureLoaded,
    hasGlobeTextureLoaded,
  ]);

  // Removed global marker storage as it's not needed for the current implementation

  const { globeBackgroundTexture, globeCloudsTexture, globeTexture } = config;

  const isFocusing = focusedMarker;

  const coordinatesEqual = useCallback((a, b) => {
    if (!a || !b || a.length !== 2 || b.length !== 2) return false;
    return a[0] === b[0] && a[1] === b[1];
  }, []);

  const focusedTooltipText = useCallback(() => {
    if (!focusedMarker) return '';
    const city = focusedMarker.city || focusedMarker.location || '';
    return city;
  }, [focusedMarker]);

  const focusedLat = focusedMarker?.coordinates?.[0];
  const focusedLng = focusedMarker?.coordinates?.[1];

  useEffect(() => {
    // Clear any pending focus update.
    if (focusDebounceTimerRef.current) {
      clearTimeout(focusDebounceTimerRef.current);
      focusDebounceTimerRef.current = null;
    }

    // Unfocus should apply immediately.
    if (focusedLat == null || focusedLng == null) {
      setGlobeFocus(null);
      return;
    }

    // Small debounce so rapid event switching collapses to the latest focus.
    focusDebounceTimerRef.current = setTimeout(() => {
      setGlobeFocus([focusedLat, focusedLng]);
      focusDebounceTimerRef.current = null;
    }, 120);

    return () => {
      if (focusDebounceTimerRef.current) {
        clearTimeout(focusDebounceTimerRef.current);
        focusDebounceTimerRef.current = null;
      }
    };
  }, [focusedLat, focusedLng]);

  // react-globe only applies `markerRenderer` when markers are created.
  // Force recreate the focused-location marker by swapping its id.
  const renderMarkers = useMemo(() => {
    if (!start) return [];
    if (!markers || !Array.isArray(markers)) return [];
    if (!globeFocus) return markers;

    const focusedCoords = globeFocus;

    let swapped = false;
    const next = markers.map((m) => {
      if (swapped) return m;
      if (!coordinatesEqual(m.coordinates, focusedCoords)) return m;
      swapped = true;
      return {
        ...m,
        __isFocused: true,
        __originalId: m.id,
        id: `__focused__${m.id}`,
      };
    });

    // If no aggregated marker matched by coordinates, fall back to original markers.
    return swapped ? next : markers;
  }, [start, markers, globeFocus, coordinatesEqual]);

  const options = useMemo(() => {
    return {
      ...config.options,
      // Restore default clouds opacity so clouds are visible again
      globeCloudsOpacity: config.options?.globeCloudsOpacity,
      enableGlobeGlow: !isFocusing,
      enableCameraAutoRotate: start && !isFocusing,
      enableCameraRotate: start && !isFocusing,
      enableCameraZoom: start && !isFocusing, // Disable zoom when detail page is open
      enableDefocus: !isFocusing,
      enableMarkerTooltip: !isFocusing,
      // markerOffsetRadiusScale: offset from surface as fraction of globe radius (react-globe uses this, NOT markerAltitude)
      // 0 = exactly on surface, negative = slightly inside (e.g. -0.02 = ~2% inside)
      markerOffsetRadiusScale: -0.00001, // Slightly inside globe so markers sit flush with surface
      markerTooltipRenderer: (marker) => {
        // Return plain text without HTML tags
        const eventName =
          marker.eventName || marker.eventMeta || 'Historical Event';
        const city = marker.city || '';
        return `${eventName} (${city})`;
      },
      markerRenderer: (marker) => markerRenderer(marker),
      markerLabel: (marker) => (isFocusing ? '' : marker.city), // Hide labels when focusing
    };
  }, [config.options, isFocusing, start]);

  // Handle texture loading errors gracefully
  const handleTextureError = () => {
    setTextureLoadError(true);
    // Still dispatch loaded to allow the app to continue functioning
    dispatch({ type: 'LOADED' });
  };

  return (
    <>
      <div className={hasLoaded ? undefined : 'hidden'}>
        <div style={{ pointerEvents: isFocusing ? 'none' : 'auto' }}>
          <ReactGlobe
            ref={globeEl}
            globeBackgroundTexture={globeBackgroundTexture}
            globeCloudsTexture={globeCloudsTexture}
            globeTexture={globeTexture}
            height="100vh"
            focus={globeFocus}
            markers={renderMarkers}
            width="100vw"
            options={options}
            onClickMarker={(marker) => {
              if (isFocusing) return;
              // Dispatch focus action to show details panel
              dispatch({ type: 'FOCUS', payload: marker });
            }}
            onGlobeTextureLoaded={() => setHasGlobeTextureLoaded(true)}
            onGlobeBackgroundTextureLoaded={() =>
              setHasGlobeBackgroundTextureLoaded(true)
            }
            onGlobeCloudsTextureLoaded={() =>
              setHasGlobeCloudsTextureLoaded(true)
            }
            onGlobeTextureError={handleTextureError}
            onGlobeBackgroundTextureError={handleTextureError}
            onGlobeCloudsTextureError={handleTextureError}
          />
        </div>
      </div>
      {focusedMarker && hasLoaded && (
        <div
          style={{
            position: 'fixed',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            borderRadius: 8,
            fontSize: 14,
            zIndex: 10001,
            pointerEvents: 'none',
            maxWidth: '90vw',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={focusedTooltipText()}
        >
          {focusedTooltipText()}
        </div>
      )}
      {!hasLoaded && !textureLoadError && (
        <Fade animationDuration={3000} className="cover" show={!hasLoaded} />
      )}
      {textureLoadError && (
        <div
          className="error-message"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '18px',
            textAlign: 'center',
            zIndex: 10000,
          }}
        >
          <p>
            Loading globe textures failed. Showing application with limited
            functionality.
          </p>
        </div>
      )}
    </>
  );
}
