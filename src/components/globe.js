import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactGlobe, { tween } from "react-globe";
import * as THREE from "three";

import { useStateValue } from "../state";
import Fade from "./fade";

import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

// Limit marker colors to red and green only
const MARKER_COLORS = [
  "#ff6b6b", // Red
  "#2ecc71", // Green
];

const MARKER_COMPANION_COLOR = "#ffffff";

function random(scaleFactor) {
  return Math.random() > 0.5
    ? scaleFactor * Math.random()
    : -scaleFactor * Math.random();
}

// Pre-create materials to avoid recreating them repeatedly
const markerMaterials = {
  1: new THREE.MeshBasicMaterial({
    color: new THREE.Color("#FFD700"),
    side: THREE.DoubleSide,
  }), // Gold - for single events
  2: new THREE.MeshBasicMaterial({
    color: new THREE.Color("#FF4500"),
    side: THREE.DoubleSide,
  }), // Orange-red - for 2 events
  3: new THREE.MeshBasicMaterial({
    color: new THREE.Color("#DC143C"),
    side: THREE.DoubleSide,
  }), // Crimson - for 3 events
  4: new THREE.MeshBasicMaterial({
    color: new THREE.Color("#9932CC"),
    side: THREE.DoubleSide,
  }), // Dark Orchid - for 4 events
  5: new THREE.MeshBasicMaterial({
    color: new THREE.Color("#FF1493"),
    side: THREE.DoubleSide,
  }), // Deep Pink - for 5+ events
};

function markerRenderer(marker) {
  // Use the eventsCount property from the marker
  const eventsAtLocation = marker.eventsCount || 1;

  // Calculate size based on number of events at this location - significantly increased overall size
  const baseSize = 2.0; // Doubled from 1.0 to make markers more visible
  const size = Math.min(baseSize + eventsAtLocation * 1.0, 6.0); // Increased multiplier and max size for better visibility

  // Determine the event count category for material selection
  const eventCategory = eventsAtLocation > 4 ? 5 : eventsAtLocation;

  // Get the appropriate material based on event count
  const material = markerMaterials[eventCategory];

  // Create a solid sphere marker
  const geometry = new THREE.SphereGeometry(size, 16, 16);

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
  const [textureLoadError, setTextureLoadError] = useState(false);
  const [{ config, focusedMarker, hasLoaded, markers, start }, dispatch] =
    useStateValue();

  useEffect(() => {
    if (
      hasGlobeBackgroundTextureLoaded &&
      hasGlobeCloudsTextureLoaded &&
      hasGlobeTextureLoaded
    ) {
      dispatch({ type: "LOADED" });
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

  const options = {
    ...config.options,
    enableGlobeGlow: !isFocusing,
    enableCameraRotate: start && !isFocusing,
    enableCameraZoom: start && !isFocusing, // Disable zoom when detail page is open
    markerTooltipRenderer: (marker) => {
      // Return plain text without HTML tags
      const eventName =
        marker.eventName || marker.eventMeta || "Historical Event";
      const year = marker.year || "";
      return `${eventName} (${year})`;
    },
    markerRenderer,
    markerLabel: (marker) => marker.city, // Show location name next to markers
  };

  // Handle texture loading errors gracefully
  const handleTextureError = () => {
    setTextureLoadError(true);
    // Still dispatch loaded to allow the app to continue functioning
    dispatch({ type: "LOADED" });
  };

  return (
    <>
      <div className={hasLoaded ? undefined : "hidden"}>
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
            // Dispatch focus action to show details panel
            dispatch({ type: "FOCUS", payload: marker });
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
      {!hasLoaded && !textureLoadError && (
        <Fade animationDuration={3000} className="cover" show={!hasLoaded} />
      )}
      {textureLoadError && (
        <div
          className="error-message"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "18px",
            textAlign: "center",
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
