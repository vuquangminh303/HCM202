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

function makeMarkerCollection(markers, events, currentIndex, focusedMarker) {
  return {
    type: 'FeatureCollection',
    features: markers.map((marker) => {
      const markerEvents = marker.eventsAtLocation || [];
      const isVisited = markerEvents.some((event) => {
        const eventIndex = events.findIndex((item) => item.id === event.id);
        return eventIndex >= 0 && eventIndex <= currentIndex;
      });
      const isFocused =
        focusedMarker?.coordinates?.[0] === marker.coordinates[0] &&
        focusedMarker?.coordinates?.[1] === marker.coordinates[1];

      return {
        type: 'Feature',
        id: marker.id,
        properties: {
          markerId: String(marker.id),
          city: marker.city,
          count: marker.eventsCount || 1,
          isVisited,
          isFocused,
        },
        geometry: {
          type: 'Point',
          coordinates: [marker.coordinates[1], marker.coordinates[0]],
        },
      };
    }),
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

// Biến map style phố thị hiện đại thành "atlas cổ": ẩn đường/POI, nhuộm tone giấy cũ
function applyAntiqueStyle(map) {
  const PAPER = '#e9dec3';
  const PAPER_DARK = '#ddcfae';
  const SEA = '#c3c9b4';
  const INK = '#5c4a32';
  const HALO = 'rgba(247, 241, 226, 0.92)';
  const BORDER = '#9a8358';

  const layers = map.getStyle()?.layers || [];

  const set = (id, prop, value) => {
    try {
      map.setPaintProperty(id, prop, value);
    } catch (e) {
      /* layer may not support this prop */
    }
  };
  const hide = (id) => {
    try {
      map.setLayoutProperty(id, 'visibility', 'none');
    } catch (e) {
      /* ignore */
    }
  };

  layers.forEach((layer) => {
    const id = layer.id.toLowerCase();
    const type = layer.type;

    // Ẩn hạ tầng hiện đại gây rối cho cảm giác lịch sử
    if (/(poi|transit|aeroway|ferry|airport|rail|bridge|tunnel|building)/.test(id)) {
      hide(id);
      return;
    }

    if (type === 'background') {
      set(id, 'background-color', PAPER);
    } else if (/water|ocean|sea|bathymetry/.test(id) && type === 'fill') {
      set(id, 'fill-color', SEA);
      set(id, 'fill-opacity', 1);
    } else if (/waterway|river|stream|canal/.test(id)) {
      set(id, 'line-color', '#b3bca6');
      set(id, 'line-opacity', 0.6);
    } else if (/(wood|forest|park|grass|wetland|landcover|landuse|vegetation)/.test(id) && type === 'fill') {
      set(id, 'fill-color', '#dcd1ab');
      set(id, 'fill-opacity', 0.55);
    } else if (/(road|highway|transportation|street|motorway|path|track)/.test(id)) {
      // Giữ lại nét đường rất mờ như đường vẽ tay, ẩn loại nhỏ
      if (/(motorway|trunk|primary)/.test(id) && type === 'line') {
        set(id, 'line-color', '#cdbd99');
        set(id, 'line-opacity', 0.5);
        set(id, 'line-width', 0.6);
      } else {
        hide(id);
      }
    } else if (/(boundary|admin|border)/.test(id) && type === 'line') {
      set(id, 'line-color', BORDER);
      set(id, 'line-opacity', 0.45);
      set(id, 'line-dasharray', [3, 2]);
    } else if (type === 'fill' && /(landuse|residential|earth|land)/.test(id)) {
      set(id, 'fill-color', PAPER_DARK);
      set(id, 'fill-opacity', 0.5);
    }

    // Nhuộm mọi nhãn chữ sẵn có thành mực sepia trên nền giấy
    if (type === 'symbol' && layer.layout?.['text-field']) {
      set(id, 'text-color', INK);
      set(id, 'text-halo-color', HALO);
      set(id, 'text-halo-width', 1.4);
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

  map.addSource('journey-markers', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'journey-marker-shadow',
    type: 'circle',
    source: 'journey-markers',
    paint: {
      'circle-radius': [
        'case',
        ['get', 'isFocused'],
        14,
        ['>', ['get', 'count'], 1],
        11,
        9,
      ],
      'circle-color': 'rgba(38, 27, 20, 0.24)',
      'circle-blur': 0.65,
      'circle-translate': [0, 3],
    },
  });

  // Vòng sáng lan toả quanh marker đang được chọn (animate bằng RAF trong component)
  map.addLayer({
    id: 'journey-marker-pulse',
    type: 'circle',
    source: 'journey-markers',
    filter: ['==', ['get', 'isFocused'], true],
    paint: {
      'circle-radius': 10,
      'circle-color': 'rgba(232, 175, 66, 0.28)',
      'circle-opacity': 0.6,
      'circle-stroke-color': 'rgba(232, 175, 66, 0.9)',
      'circle-stroke-width': 1.4,
    },
  });

  map.addLayer({
    id: 'journey-marker-points',
    type: 'circle',
    source: 'journey-markers',
    paint: {
      'circle-radius': [
        'case',
        ['get', 'isFocused'],
        9,
        ['>', ['get', 'count'], 1],
        7,
        5,
      ],
      'circle-color': [
        'case',
        ['get', 'isFocused'],
        '#e8af42',
        ['get', 'isVisited'],
        '#a93624',
        ['>', ['get', 'count'], 1],
        '#344447',
        '#fffaf0',
      ],
      'circle-stroke-color': [
        'case',
        ['get', 'isFocused'],
        '#7f241a',
        ['get', 'isVisited'],
        '#fff4df',
        ['>', ['get', 'count'], 1],
        '#fffaf0',
        '#344447',
      ],
      'circle-stroke-width': 3,
    },
  });

  map.addLayer({
    id: 'journey-marker-counts',
    type: 'symbol',
    source: 'journey-markers',
    filter: ['>', ['get', 'count'], 1],
    layout: {
      'text-field': ['to-string', ['get', 'count']],
      'text-font': ['Noto Sans Bold'],
      'text-size': 9,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': [
        'case',
        ['get', 'isFocused'],
        '#4f2018',
        '#ffffff',
      ],
    },
  });

  map.addLayer({
    id: 'journey-marker-hover-label',
    type: 'symbol',
    source: 'journey-markers',
    layout: {
      'text-field': ['get', 'city'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 11,
      'text-anchor': 'left',
      'text-offset': [1.3, 0],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#312820',
      'text-halo-color': '#fffaf0',
      'text-halo-width': 2,
      'text-halo-blur': 0.5,
      'text-opacity': [
        'case',
        ['get', 'isFocused'],
        0,
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0,
      ],
    },
  });

  map.addLayer({
    id: 'journey-marker-focused-label',
    type: 'symbol',
    source: 'journey-markers',
    filter: ['==', ['get', 'isFocused'], true],
    layout: {
      'text-field': ['get', 'city'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 11,
      'text-anchor': 'left',
      'text-offset': [1.3, 0],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#312820',
      'text-halo-color': '#fffaf0',
      'text-halo-width': 2,
      'text-halo-blur': 0.5,
    },
  });
}

export default function JourneyMap() {
  const [{ events, focusedMarker, hasLoaded, markers }, dispatch] =
    useStateValue();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(markers);
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
    markersRef.current = markers;
  }, [markers]);

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
        applyAntiqueStyle(map);
        addJourneyLayers(map, sortedEvents);
        let hoveredMarkerId = null;

        const handleMarkerClick = (event) => {
          const markerId = event.features?.[0]?.properties?.markerId;
          const marker = markersRef.current.find(
            (item) => String(item.id) === String(markerId)
          );
          if (marker) dispatch({ type: 'FOCUS', payload: marker });
        };

        map.on('click', 'journey-marker-points', handleMarkerClick);
        map.on('mouseenter', 'journey-marker-points', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mousemove', 'journey-marker-points', (event) => {
          const nextMarkerId = event.features?.[0]?.id;
          if (nextMarkerId === hoveredMarkerId) return;

          if (hoveredMarkerId != null) {
            map.setFeatureState(
              { source: 'journey-markers', id: hoveredMarkerId },
              { hover: false }
            );
          }
          if (nextMarkerId != null) {
            map.setFeatureState(
              { source: 'journey-markers', id: nextMarkerId },
              { hover: true }
            );
          }
          hoveredMarkerId = nextMarkerId;
        });
        map.on('mouseleave', 'journey-marker-points', () => {
          map.getCanvas().style.cursor = '';
          if (hoveredMarkerId != null) {
            map.setFeatureState(
              { source: 'journey-markers', id: hoveredMarkerId },
              { hover: false }
            );
            hoveredMarkerId = null;
          }
        });
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

    map.getSource('journey-markers')?.setData(
      makeMarkerCollection(markers, sortedEvents, currentIndex, focusedMarker)
    );
  }, [currentIndex, focusedMarker, mapReady, markers, sortedEvents]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    if (focusedMarker?.coordinates?.length === 2) {
      map.flyTo({
        center: [focusedMarker.coordinates[1], focusedMarker.coordinates[0]],
        zoom: 5.3,
        duration: 1800,
        curve: 1.5,
        speed: 0.9,
        offset: [window.innerWidth > 768 ? 180 : 0, 0],
        essential: true,
      });
      return;
    }

    map.flyTo({
      ...DEFAULT_CAMERA,
      duration: 1400,
      curve: 1.4,
      essential: true,
    });
  }, [focusedMarker?.coordinates, focusedMarker?.id, mapReady]);

  // Vòng sáng lan toả quanh marker đang chọn
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !focusedMarker) return;

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const phase = ((now - start) % 1700) / 1700; // 0 → 1 lặp lại
      if (map.getLayer('journey-marker-pulse')) {
        map.setPaintProperty('journey-marker-pulse', 'circle-radius', 10 + phase * 28);
        map.setPaintProperty('journey-marker-pulse', 'circle-opacity', 0.45 * (1 - phase));
        map.setPaintProperty('journey-marker-pulse', 'circle-stroke-opacity', 0.9 * (1 - phase));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mapReady, focusedMarker?.id, focusedMarker]);

  return (
    <div className={`journey-map ${focusedMarker ? 'has-focus' : ''}`}>
      <div ref={containerRef} className="map-canvas" />

      <div className="map-story-heading">
        <svg className="vietnam-emblem" viewBox="0 0 100 100" width="48" height="48" style={{ display: 'block', margin: '0 auto 12px 0' }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#d09a3c" strokeWidth="2" strokeDasharray="3, 3" />
          <circle cx="50" cy="50" r="41" fill="none" stroke="#d09a3c" strokeWidth="1" />
          <path d="M50,25 C53,38 53,52 50,75 C47,52 47,38 50,25 Z" fill="#d09a3c" />
          <path d="M50,35 C42,42 40,55 50,75 C36,58 42,42 50,35 Z" fill="#d09a3c" opacity="0.9" />
          <path d="M50,35 C58,42 60,55 50,75 C64,58 58,42 50,35 Z" fill="#d09a3c" opacity="0.9" />
          <path d="M50,45 C30,50 32,65 50,75 C26,60 30,50 50,45 Z" fill="#d09a3c" opacity="0.8" />
          <path d="M50,45 C70,50 68,65 50,75 C74,60 70,50 50,45 Z" fill="#d09a3c" opacity="0.8" />
          <path d="M30,75 C40,80 60,80 70,75 C60,73 40,73 30,75 Z" fill="#d09a3c" />
        </svg>
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
