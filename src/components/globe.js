import React, { useEffect, useState, useRef } from 'react';
import ReactGlobe from 'react-globe';
import * as THREE from 'three';

import { useStateValue } from '../state';
import Fade from './fade';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

// Limit marker colors to red and green only
// const MARKER_COLORS = [
//   '#ff6b6b', // Red
//   '#2ecc71', // Green
// ];

// const MARKER_COMPANION_COLOR = '#ffffff';

// function random(scaleFactor) {
//   return Math.random() > 0.5
//     ? scaleFactor * Math.random()
//     : -scaleFactor * Math.random();
// }

function markerRenderer(marker) {
  // Use the eventsCount property from the marker
  const eventsAtLocation = marker.eventsCount || 1;

  // Calculate size based on number of events at this location - increased overall size
  const baseSize = 1.0; // Increased from 0.5 to 1.0
  const size = Math.min(baseSize + eventsAtLocation * 0.6, 4.0); // Increased multiplier and max size

  // Define contrasting colors based on event count
  let color;
  if (eventsAtLocation === 1) {
    color = new THREE.Color('#FFD700'); // Gold - for single events
  } else if (eventsAtLocation === 2) {
    color = new THREE.Color('#FF4500'); // Orange-red - for 2 events
  } else if (eventsAtLocation === 3) {
    color = new THREE.Color('#DC143C'); // Crimson - for 3 events
  } else if (eventsAtLocation === 4) {
    color = new THREE.Color('#9932CC'); // Dark Orchid - for 4 events
  } else {
    color = new THREE.Color('#FF1493'); // Deep Pink - for 5+ events
  }

  // Create a solid sphere marker
  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
  });

  const sphere = new THREE.Mesh(geometry, material);

  return sphere;
}

export default function Globe() {
  const globeEl = useRef();
  const [hasGlobeBackgroundTextureLoaded, setHasGlobeBackgroundTextureLoaded] =
    useState(false);
  const [hasGlobeCloudsTextureLoaded, setHasGlobeCloudsTextureLoaded] =
    useState(false);
  const [hasGlobeTextureLoaded, setHasGlobeTextureLoaded] = useState(false);
  const [{ config, focusedMarker, hasLoaded, markers, start }, dispatch] =
    useStateValue();

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

  // Store markers globally so the markerRenderer can access them
  useEffect(() => {
    if (markers && markers.length > 0) {
      window.allMarkers = markers;
    }
  }, [markers]);

  const { globeBackgroundTexture, globeCloudsTexture, globeTexture } = config;

  const isFocusing = focusedMarker;

  const options = {
    ...config.options,
    enableGlobeGlow: !isFocusing,
    enableCameraRotate: start && !isFocusing,
    markerTooltipRenderer: (marker) => `${marker.eventName} (${marker.year})`,
    markerRenderer,
  };

  return (
    <>
      <div className={hasLoaded ? undefined : 'hidden'}>
        <ReactGlobe
          ref={globeEl}
          globeBackgroundTexture={globeBackgroundTexture}
          globeCloudsTexture={globeCloudsTexture}
          globeTexture={globeTexture}
          height="100vh"
          focus={focusedMarker?.coordinates}
          markers={start ? markers : []}
          width="100vw"
          options={options}
          onClickMarker={(marker) => {
            dispatch({ type: 'FOCUS', payload: marker });
          }}
          onGlobeTextureLoaded={() => setHasGlobeTextureLoaded(true)}
          onGlobeBackgroundTextureLoaded={() =>
            setHasGlobeBackgroundTextureLoaded(true)
          }
          onGlobeCloudsTextureLoaded={() =>
            setHasGlobeCloudsTextureLoaded(true)
          }
        />
      </div>
      <Fade animationDuration={3000} className="cover" show={!hasLoaded} />
    </>
  );
}
