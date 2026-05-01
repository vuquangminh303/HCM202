import React, { createContext, useContext, useReducer } from 'react';

import config from './config';
import hcmData from './data/hcm_data.json';

const { lastUpdated, events } = hcmData;

// Group events by location to count events at each location
const locationMap = {};
events.forEach((event) => {
  const coordKey = `${event.coordinates[0]},${event.coordinates[1]}`;
  if (!locationMap[coordKey]) {
    locationMap[coordKey] = [];
  }
  locationMap[coordKey].push(event);
});

// Transform the events data to match the expected marker format
// Each unique location gets one marker with the count of events at that location
const transformedMarkers = Object.entries(locationMap).map(
  ([, eventsAtLocation]) => {
    // Use the first event's details for the marker, but aggregate information
    const firstEvent = eventsAtLocation[0];
    return {
      id: firstEvent.id,
      phase: firstEvent.phase,
      year: firstEvent.year,
      city: firstEvent.location, // Using location as city for compatibility
      coordinates: firstEvent.coordinates,
      eventName: firstEvent.eventName,
      description: firstEvent.description,
      mediaUrl: firstEvent.mediaUrl,
      sourceMedia: firstEvent.sourceMedia,
      quoteSource: firstEvent.quoteSource,
      templateType: firstEvent.templateType,
      references: firstEvent.references,
      value: eventsAtLocation.length, // Number of events at this location
      eventsCount: eventsAtLocation.length,
      eventsAtLocation: eventsAtLocation, // Store all events at this location
    };
  }
);

export const initialState = {
  config,
  focusedMarker: null,
  hasLoaded: false,
  lastUpdated,
  markers: transformedMarkers,
  events: events, // Keep original events data for detailed info
  start: false,
};

export function reducer(state, action) {
  const { payload, type } = action;
  switch (type) {
    case 'LOADED':
      return {
        ...state,
        hasLoaded: true,
      };
    case 'START':
      return {
        ...state,
        start: true,
      };
    case 'FOCUS':
      return {
        ...state,
        focusedMarker: payload,
      };
    case 'UNFOCUS':
      return {
        ...state,
        focusedMarker: null,
      };
    default:
      return state;
  }
}

const StateContext = createContext(null);

export function StateProvider({ children, initialState, reducer }) {
  return (
    <StateContext.Provider value={useReducer(reducer, initialState)}>
      {children}
    </StateContext.Provider>
  );
}

export function useStateValue() {
  return useContext(StateContext);
}
