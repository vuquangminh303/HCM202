import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactGlobe, { tween } from 'react-globe';
import * as THREE from 'three';

import { useStateValue } from '../state';
import Fade from './fade';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

// Limit marker colors to red and green only
const MARKER_COLORS = [
  '#ff6b6b', // Red
  '#2ecc71', // Green
];

const MARKER_COMPANION_COLOR = '#ffffff';

function random(scaleFactor) {
  return Math.random() > 0.5
    ? scaleFactor * Math.random()
    : -scaleFactor * Math.random();
}

function markerRenderer(marker) {
  const size = Math.max(marker.value / 2, 2.5); // Increased size significantly for better visibility

  // Select a color based on marker properties to ensure consistent coloring
  const colorIndex = marker.id
    ? marker.id % MARKER_COLORS.length
    : Math.abs(marker.eventName.charCodeAt(0)) % MARKER_COLORS.length;
  const selectedColor = MARKER_COLORS[colorIndex];

  // Use a 3D triangle (flat pyramid) geometry
  const geometry = new THREE.ConeGeometry(size * 0.6, size * 1.2, 3); // 3 sides creates a triangle/pyramid

  // Position the triangle to point outward from the globe surface
  geometry.translate(0, 0, size * 0.6); // Move the triangle so it extends outward from the surface

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(selectedColor),
    side: THREE.DoubleSide, // Show both sides of the triangle
  });

  const mesh = new THREE.Mesh(geometry, material);
  const light = new THREE.PointLight(selectedColor, 1.2, 0, 0);
  mesh.children = [];
  mesh.add(light);

  const companions = [];
  for (let i = 0; i < 3; i++) {
    // Fewer companions to reduce clutter
    const companionGeometry = new THREE.SphereGeometry(
      Math.min((size * Math.random()) / 3, 0.6), // Smaller companions
      6,
      6,
    );
    const companionMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(MARKER_COMPANION_COLOR),
    });
    const companion = new THREE.Mesh(companionGeometry, companionMaterial);
    companion.lookAt(new THREE.Vector3(0, 0, 0));
    companions.push(companion);
    mesh.add(companion);
  }

  companions.forEach((companion, i) => {
    function animate() {
      const from = {
        opacity: 0.1,
        position: companion.position.clone().toArray(),
        scale: Math.max(0.5, Math.random()),
      };
      const to = {
        opacity: 0.5,
        position: [random(size * 3), random(size * 3), random(size)],
        scale: 0.01,
      };
      tween({
        from,
        to,
        animationDuration: 4000,
        easingFunction: ['Quadratic', 'InOut'],
        onUpdate: () => {
          const [x, y, z] = from.position;
          const companionMaterial = companion.material;
          const intensityChange = random(0.05);
          if (
            light.intensity + intensityChange > 0 &&
            light.intensity + intensityChange < 1.5
          ) {
            light.intensity += intensityChange;
          }
          companionMaterial.opacity = from.opacity;
          companion.scale.x = from.scale;
          companion.scale.y = from.scale;
          companion.scale.z = from.scale;
          companion.position.set(x, y, z);
        },
        onEnd: animate,
        delay: i * 200,
      });
    }
    animate();
  });
  return mesh;
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

  const { globeBackgroundTexture, globeCloudsTexture, globeTexture } = config;

  const isFocusing = focusedMarker;

  // Zoom functions with limits - using focus/unfocus functionality
  const handleZoomIn = useCallback(() => {
    // For zooming in, we'll refocus on the same marker to potentially trigger deeper zoom
    if (focusedMarker) {
      // Dispatch focus action again to potentially trigger deeper zoom
      setTimeout(() => {
        dispatch({ type: 'FOCUS', payload: focusedMarker });
      }, 10);
    }
  }, [focusedMarker, dispatch]);

  const handleZoomOut = useCallback(() => {
    // For zooming out, we'll unfocus to return to the global view
    if (focusedMarker) {
      dispatch({ type: 'UNFOCUS' });
    }
  }, [focusedMarker, dispatch]);

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
