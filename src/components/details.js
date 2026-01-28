import React from 'react';

import { useStateValue } from '../state';
import Button from './button';
import Fade from './fade';

export function getRandomMarker({ focusedMarker, markers }) {
  if (!markers || !Array.isArray(markers)) return null;

  const filteredMarkers = markers.filter((marker) => {
    return marker?.id !== focusedMarker?.id;
  });
  return filteredMarkers[Math.floor(Math.random() * filteredMarkers.length)];
}

export default function Details() {
  const [{ focusedMarker, markers }, dispatch] =
    useStateValue();
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
                  <strong>Media:</strong> {sourceMedia || 'Historical Archive'}
                </p>
              </div>
            )}
            {quoteSource && (
              <p>
                <em>Source: {quoteSource}</em>
              </p>
            )}
          </div>
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
