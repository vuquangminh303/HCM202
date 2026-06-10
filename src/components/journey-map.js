import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

import { useStateValue } from '../state';

import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CAMERA = { center: [24, 20], zoom: 1.75 };

const VIETNAMESE_PLACE_LABELS = [
  ['Việt Nam', 108.2, 15.7, 'country'],
  ['Trung Quốc', 104.2, 35.4, 'country'],
  ['Thái Lan', 101, 15.4, 'country'],
  ['Ấn Độ', 79, 22.5, 'country'],
  ['Sri Lanka', 80.7, 7.5, 'country'],
  ['Ai Cập', 29.8, 27, 'country'],
  ['Pháp', 2.2, 46.3, 'country'],
  ['Anh', -2.5, 54.2, 'country'],
  ['Đức', 10.2, 51, 'country'],
  ['Nga', 63, 59, 'country'],
  ['Hoa Kỳ', -101, 39, 'country'],
  ['Canada', -107, 56, 'country'],
  ['Argentina', -64, -35, 'country'],
  ['Brazil', -52, -11, 'country'],
  ['Senegal', -14.5, 14.5, 'country'],
  ['Nam Phi', 24, -29, 'country'],
  ['Madagascar', 47, -19, 'country'],
  ['Indonesia', 118, -2, 'country'],
  ['Australia', 134, -25, 'country'],
  ['Paris', 2.35, 48.86, 'city'],
  ['Luân Đôn', -0.13, 51.51, 'city'],
  ['Mát-xcơ-va', 37.62, 55.75, 'city'],
  ['New York', -74, 40.71, 'city'],
  ['Băng Cốc', 100.5, 13.76, 'city'],
  ['Hồng Kông', 114.17, 22.32, 'city'],
  ['Quảng Châu', 113.26, 23.13, 'city'],
];

function makeVietnameseLabelCollection() {
  return {
    type: 'FeatureCollection',
    features: VIETNAMESE_PLACE_LABELS.map(([name, lng, lat, category]) => ({
      type: 'Feature',
      properties: { name, category },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    })),
  };
}

function eventToMarker(event) {
  return {
    ...event,
    city: event.location,
    value: event.phase || 1,
  };
}

function makeRouteCollection(events, currentIndex, isCompleted) {
  const features = events.slice(1).reduce((routeFeatures, event, index) => {
    const completed = currentIndex >= index + 1;
    if (completed !== isCompleted) return routeFeatures;

    const previousEvent = events[index];
    const fromLng = previousEvent.coordinates[1];
    let toLng = event.coordinates[1];

    if (toLng - fromLng > 180) toLng -= 360;
    if (toLng - fromLng < -180) toLng += 360;

    routeFeatures.push({
      type: 'Feature',
      properties: { from: previousEvent.id, to: event.id },
      geometry: {
        type: 'LineString',
        coordinates: [
          [fromLng, previousEvent.coordinates[0]],
          [toLng, event.coordinates[0]],
        ],
      },
    });

    return routeFeatures;
  }, []);

  return { type: 'FeatureCollection', features };
}

function localizeLabels(map) {
  const layers = map.getStyle()?.layers || [];
  const vietnameseName = [
    'coalesce',
    ['get', 'name:vi'],
    ['get', 'name:latin'],
    ['get', 'name_en'],
    ['get', 'name'],
  ];

  layers.forEach((layer) => {
    const textField = layer.layout?.['text-field'];
    if (layer.type !== 'symbol' || !textField) return;
    if (!JSON.stringify(textField).includes('name')) return;

    try {
      map.setLayoutProperty(layer.id, 'text-field', vietnameseName);
    } catch (error) {
      // Some icon-only symbol layers do not accept a text field override.
    }
  });
}

function addJourneyLayers(map, events) {
  const firstSymbolLayer = map
    .getStyle()
    .layers.find((layer) => layer.type === 'symbol')?.id;

  map.addSource('journey-upcoming', {
    type: 'geojson',
    data: makeRouteCollection(events, -1, false),
  });
  map.addSource('journey-completed', {
    type: 'geojson',
    data: makeRouteCollection(events, -1, true),
  });

  map.addLayer(
    {
      id: 'journey-route-shadow',
      type: 'line',
      source: 'journey-completed',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': 'rgba(77, 30, 20, 0.28)',
        'line-width': 8,
        'line-blur': 4,
      },
    },
    firstSymbolLayer
  );

  map.addLayer(
    {
      id: 'journey-route-upcoming',
      type: 'line',
      source: 'journey-upcoming',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#586565',
        'line-width': 2,
        'line-opacity': 0.52,
        'line-dasharray': [2, 3],
      },
    },
    firstSymbolLayer
  );

  map.addLayer(
    {
      id: 'journey-route-completed',
      type: 'line',
      source: 'journey-completed',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#a93624',
        'line-width': 4,
      },
    },
    firstSymbolLayer
  );

  map.addSource('vietnamese-place-labels', {
    type: 'geojson',
    data: makeVietnameseLabelCollection(),
  });

  map.addLayer({
    id: 'vietnamese-country-labels',
    type: 'symbol',
    source: 'vietnamese-place-labels',
    maxzoom: 5.5,
    filter: ['==', ['get', 'category'], 'country'],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Bold'],
      'text-letter-spacing': 0.08,
      'text-size': ['interpolate', ['linear'], ['zoom'], 1, 11, 5, 15],
      'text-transform': 'uppercase',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#5a5148',
      'text-halo-color': 'rgba(255, 252, 245, 0.9)',
      'text-halo-width': 1.5,
    },
  });

  map.addLayer({
    id: 'vietnamese-city-labels',
    type: 'symbol',
    source: 'vietnamese-place-labels',
    minzoom: 3.2,
    filter: ['==', ['get', 'category'], 'city'],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-offset': [0, 0.9],
      'text-size': 12,
    },
    paint: {
      'text-color': '#4b4037',
      'text-halo-color': '#fffaf1',
      'text-halo-width': 1.5,
    },
  });
}

export default function JourneyMap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const [{ events, focusedMarker, hasLoaded, markers }, dispatch] =
    useStateValue();
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => Number(a.id) - Number(b.id)),
    [events]
  );

  const currentIndex = useMemo(
    () =>
      focusedMarker
        ? sortedEvents.findIndex((event) => event.id === focusedMarker.id)
        : -1,
    [focusedMarker, sortedEvents]
  );

  const focusEvent = useCallback(
    (event) => dispatch({ type: 'FOCUS', payload: eventToMarker(event) }),
    [dispatch]
  );

  useEffect(() => {
    let cancelled = false;
    let journeyLayersAdded = false;

    const initializeMap = () => {
      if (cancelled || mapRef.current || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: DEFAULT_CAMERA.center,
        zoom: DEFAULT_CAMERA.zoom,
        minZoom: 1.2,
        maxZoom: 14,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });

      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      const handleStyleReady = () => {
        if (cancelled || journeyLayersAdded) return;
        journeyLayersAdded = true;
        localizeLabels(map);
        addJourneyLayers(map, sortedEvents);
        setMapReady(true);
        dispatch({ type: 'LOADED' });
      };

      map.on('style.load', handleStyleReady);
      map.on('load', handleStyleReady);

      map.on('error', (event) => {
        if (event?.error) setMapError(true);
      });
    };

    initializeMap();

    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [dispatch, sortedEvents]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    map.getSource('journey-upcoming')?.setData(
      makeRouteCollection(sortedEvents, currentIndex, false)
    );
    map.getSource('journey-completed')?.setData(
      makeRouteCollection(sortedEvents, currentIndex, true)
    );
  }, [currentIndex, mapReady, sortedEvents]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((marker) => {
      const element = document.createElement('button');
      const dot = document.createElement('span');
      const label = document.createElement('span');
      const markerEvents = marker.eventsAtLocation || [];
      const isVisited = markerEvents.some((event) => {
        const eventIndex = sortedEvents.findIndex((item) => item.id === event.id);
        return eventIndex >= 0 && eventIndex <= currentIndex;
      });
      const isFocused =
        focusedMarker?.coordinates?.[0] === marker.coordinates[0] &&
        focusedMarker?.coordinates?.[1] === marker.coordinates[1];

      element.type = 'button';
      element.className = `journey-marker ${isVisited ? 'visited' : ''} ${
        isFocused ? 'focused' : ''
      }`;
      element.title = `${marker.city} - ${marker.eventsCount} sự kiện`;
      dot.className = 'journey-marker-dot';
      label.className = 'journey-marker-label';
      label.textContent = marker.city;
      element.append(dot, label);

      if (marker.eventsCount > 1) {
        const count = document.createElement('span');
        count.className = 'journey-marker-count';
        count.textContent = marker.eventsCount;
        element.appendChild(count);
      }

      element.addEventListener('click', (event) => {
        event.stopPropagation();
        dispatch({ type: 'FOCUS', payload: marker });
      });

      return new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([marker.coordinates[1], marker.coordinates[0]])
        .addTo(map);
    });

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
    };
  }, [currentIndex, dispatch, focusedMarker, mapReady, markers, sortedEvents]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    if (focusedMarker?.coordinates?.length === 2) {
      map.easeTo({
        center: [focusedMarker.coordinates[1], focusedMarker.coordinates[0]],
        zoom: 5.3,
        duration: 1200,
        offset: [window.innerWidth > 768 ? 180 : 0, 0],
        essential: true,
      });
      return;
    }

    map.easeTo({
      ...DEFAULT_CAMERA,
      duration: 900,
      essential: true,
    });
  }, [focusedMarker?.coordinates, focusedMarker?.id, mapReady]);

  return (
    <div className={`journey-map ${focusedMarker ? 'has-focus' : ''}`}>
      <div ref={containerRef} className="map-canvas" />

      <div className="map-story-heading">
        <span className="map-eyebrow">BẢN ĐỒ TƯ LIỆU SỐ</span>
        <h1>Hành trình Hồ Chí Minh</h1>
        <p>
          Theo dấu những nơi Người đã sống, học tập và hoạt động cách mạng từ
          năm 1890 đến 1969.
        </p>
        {!focusedMarker && sortedEvents[0] && (
          <button type="button" onClick={() => focusEvent(sortedEvents[0])}>
            <span>Bắt đầu hành trình</span>
            <strong>1890</strong>
          </button>
        )}
      </div>

      <div className="map-legend">
        <span><i className="legend-completed" /> Chặng đã xem</span>
        <span><i className="legend-upcoming" /> Chặng tiếp theo</span>
      </div>

      <div className="map-zoom-controls">
        <button
          type="button"
          aria-label="Phóng to bản đồ"
          onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Thu nhỏ bản đồ"
          onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
        >
          −
        </button>
        <button
          type="button"
          className="map-reset-button"
          aria-label="Xem toàn bộ hành trình"
          onClick={() =>
            mapRef.current?.easeTo({
              ...DEFAULT_CAMERA,
              duration: 700,
              essential: true,
            })
          }
        >
          ◎
        </button>
      </div>

      {!hasLoaded && !mapError && (
        <div className="map-loading">Đang tải bản đồ tiếng Việt...</div>
      )}
      {mapError && !hasLoaded && (
        <div className="map-loading map-error">
          Không thể tải dữ liệu bản đồ. Vui lòng kiểm tra kết nối Internet.
        </div>
      )}
    </div>
  );
}
