import React, { createContext, useContext, useReducer } from 'react';

import config from './config';
import hcmData from './data/hcm_data.json';

const { lastUpdated, events } = hcmData;

// Transform the events data to match the expected marker format
const transformedMarkers = events.map((event) => ({
  id: event.id,
  phase: event.phase,
  year: event.year,
  city: event.location, // Using location as city for compatibility
  coordinates: event.coordinates,
  eventName: event.eventName,
  description: event.description,
  mediaUrl: event.mediaUrl,
  sourceMedia: event.sourceMedia,
  quoteSource: event.quoteSource,
  templateType: event.templateType,
  value: event.phase || 1, // Using phase as value for sizing purposes
}));

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
