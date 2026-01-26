import React from 'react';

import { useStateValue } from '../state';
import Button from './button';
import Fade from './fade';

function getSearchUrl(city, country, keyword) {
  const formattedQuery = `${encodeURIComponent(
    city || '',
  )}, ${encodeURIComponent(country || '')} ${encodeURIComponent(
    keyword || '',
  )}`.replace(/(%20| )/g, '+');
  return `https://www.google.com/search?q=${formattedQuery}`;
}

export function getRandomMarker({ focusedMarker, markers }) {
  if (!markers || !Array.isArray(markers)) return null;

  const filteredMarkers = markers.filter((marker) => {
    return marker?.id !== focusedMarker?.id;
  });
  return filteredMarkers[Math.floor(Math.random() * filteredMarkers.length)];
}

export default function Details() {
  const [{ config, focusedMarker, markers, events }, dispatch] =
    useStateValue();
  const randomMarker = getRandomMarker({ focusedMarker, markers });

  let content;
  if (focusedMarker) {
    const {
      city,
      countryCode,
      countryName,
      value,
      eventName,
      description,
      year,
      location,
      mediaUrl,
      sourceMedia,
      quoteSource,
      templateType,
    } = focusedMarker || {};

    // Use fallback values to prevent undefined errors
    const cityName = city || location || 'Unknown Location';
    const country = countryName || '';
    const displayValue = value || 0;
    const eventTitle = eventName || 'Historical Event';
    const eventDescription = description || 'No description available.';
    const eventYear = year || 'Unknown Year';

    // Since we removed relatedTopics, we'll skip that part
    const topics = []; // Empty array since we don't have related topics anymore

    content = (
      <>
        <div className="header">
          <Button
            label="Back to globe"
            onClick={() => dispatch({ type: 'FOCUS' })}
          />
          {randomMarker && (
            <Button
              label="Random Location"
              onClick={() => dispatch({ type: 'FOCUS', payload: randomMarker })}
            />
          )}
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
