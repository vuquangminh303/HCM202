import React from 'react';

import { useStateValue } from '../state';
import Button from './button';
import Fade from './fade';

export function getRandomMarker({ focusedMarker, markers }) {
  if (!markers || !Array.isArray(markers) || markers.length === 0) return null;

  const filteredMarkers = markers.filter((marker) => {
    return marker?.id && focusedMarker?.id && marker.id !== focusedMarker.id;
  });

  if (filteredMarkers.length === 0) return null;

  return filteredMarkers[Math.floor(Math.random() * filteredMarkers.length)];
}

export default function Details() {
  const [{ focusedMarker, markers }, dispatch] = useStateValue();
  const randomMarker = getRandomMarker({ focusedMarker, markers });

  let content;
  if (focusedMarker) {
    const {
      city,
      countryName,
      value,
      eventName,
      description,
      year,
      location,
      mediaUrl,
      sourceMedia,
      quoteSource,
      eventsAtLocation,
    } = focusedMarker || {};

    // Use fallback values to prevent undefined errors
    const cityName = city || location || 'Unknown Location';
    const country = countryName || '';
    const displayValue = value || 0;
    const eventTitle = eventName || 'Historical Event';
    const eventDescription = description || 'No description available.';
    const eventYear = year || 'Unknown Year';

    content = (
      <>
        <div className="header">
          <Button
            label="Back to globe"
            onClick={() => dispatch({ type: 'FOCUS' })}
          />
        </div>
        <div className="content">
          {eventsAtLocation && eventsAtLocation.length > 1 ? (
            // If multiple events at this location, show a list
            <>
              <h2>Events at {cityName}</h2>
              <p>
                <strong>Number of events:</strong> {eventsAtLocation.length}
              </p>
              <div className="multiple-events-list">
                {eventsAtLocation.map((event, index) => (
                  <div
                    key={event.id}
                    className="event-item"
                    onClick={() => {
                      // Create a temporary marker with this specific event's data
                      const tempMarker = {
                        id: event.id,
                        phase: event.phase,
                        year: event.year,
                        city: event.location,
                        coordinates: focusedMarker.coordinates,
                        eventName: event.eventName,
                        description: event.description,
                        mediaUrl: event.mediaUrl,
                        sourceMedia: event.sourceMedia,
                        quoteSource: event.quoteSource,
                        templateType: event.templateType,
                        value: focusedMarker.value,
                      };
                      dispatch({ type: 'FOCUS', payload: tempMarker });
                    }}>
                    <h3>
                      {event.eventName} ({event.year})
                    </h3>
                    <p>{event.description}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // If single event, show normally
            <>
              <h2>
                {eventTitle} ({eventYear})
              </h2>
              <p>
                <strong>Location:</strong> {cityName}
                {country ? `, ${country}` : ''}
              </p>
              <p>
                <strong>Phase:</strong> {displayValue}
              </p>
              <div className="details-content">
                <p>{eventDescription}</p>
                {mediaUrl && (
                  <div>
                    <p>
                      <strong>Media:</strong>{' '}
                      {sourceMedia || 'Historical Archive'}
                    </p>
                  </div>
                )}
                {quoteSource && (
                  <p>
                    <em>Source: {quoteSource}</em>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <Fade className="details" show={!!focusedMarker}>
      {content}
    </Fade>
  );
}
