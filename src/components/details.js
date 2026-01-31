import React from "react";

import { useStateValue } from "../state";
import Button from "./button";
import Fade from "./fade";
import { extractYouTubeVideoId, isYouTubeUrl } from "../utils/youtubeUtils";

export function getRandomMarker({ focusedMarker, markers }) {
  if (!markers || !Array.isArray(markers) || markers.length === 0) return null;

  const filteredMarkers = markers.filter((marker) => {
    return marker?.id && focusedMarker?.id && marker.id !== focusedMarker.id;
  });

  if (filteredMarkers.length === 0) return null;

  return filteredMarkers[Math.floor(Math.random() * filteredMarkers.length)];
}

// MediaDisplay component to handle both images and YouTube videos
function MediaDisplay({ mediaUrl, eventName, currentIndex = 0, onError }) {
  // Check if mediaUrl is a YouTube URL
  if (isYouTubeUrl(mediaUrl)) {
    const videoId = extractYouTubeVideoId(mediaUrl);

    if (videoId) {
      return (
        <iframe
          className="event-media youtube-video"
          width="100%"
          height="auto"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`${eventName || "YouTube Video"} - ${currentIndex + 1}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    }
  }

  // Check if mediaUrl is a video file
  if (
    typeof mediaUrl === "string" &&
    (mediaUrl.endsWith(".mp4") ||
      mediaUrl.endsWith(".mov") ||
      mediaUrl.endsWith(".avi"))
  ) {
    return (
      <video controls src={mediaUrl} className="event-media" onError={onError}>
        Your browser does not support the video tag.
      </video>
    );
  }

  // Default to image
  return (
    <img
      src={mediaUrl}
      alt={`${eventName || "Historical media"} - Item ${currentIndex + 1}`}
      className="event-media"
      onError={onError}
    />
  );
}

export default function Details() {
  const [{ focusedMarker, markers, events }, dispatch] = useStateValue();
  const randomMarker = getRandomMarker({ focusedMarker, markers });

  // Component to handle story scroll template with shared state
  const StoryScrollContent = ({ focusedMarker, dispatch }) => {
    const { eventName, mediaUrl, sourceMedia, description, references } =
      focusedMarker;
    const mediaArray = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    const descArray = Array.isArray(description) ? description : [description];
    const [currentIndex, setCurrentIndex] = React.useState(0);

    return (
      <>
        <div className="header">
          <Button
            label="Back to globe"
            onClick={() => dispatch({ type: "FOCUS" })}
          />
        </div>
        <div className="detail-content">
          {/* Title from eventName */}
          <h2 className="event-title">{eventName || "Historical Event"}</h2>

          {/* Media (image/video) from mediaUrl - story_scroll template */}
          {mediaArray.length > 0 && (
            <div className="media-container">
              <div className="story-scroll-container">
                <div className="story-nav-buttons">
                  <button
                    className="nav-btn prev-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex((prev) =>
                        prev > 0 ? prev - 1 : mediaArray.length - 1
                      );
                    }}
                  >
                    &#8249;
                  </button>

                  <div className="media-display">
                    <MediaDisplay
                      mediaUrl={mediaArray[currentIndex]}
                      eventName={eventName}
                      currentIndex={currentIndex}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />

                    {/* Source media caption */}
                    {sourceMedia && (
                      <div className="media-caption">
                        {typeof sourceMedia === "string"
                          ? sourceMedia
                          : Array.isArray(sourceMedia)
                          ? Array.isArray(sourceMedia) &&
                            sourceMedia[currentIndex]
                            ? sourceMedia[currentIndex]
                            : sourceMedia[0] || "Source"
                          : "Source"}
                      </div>
                    )}
                  </div>

                  <button
                    className="nav-btn next-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex((prev) =>
                        prev < mediaArray.length - 1 ? prev + 1 : 0
                      );
                    }}
                  >
                    &#8250;
                  </button>
                </div>

                {/* Story scroll tabs */}
                <div className="story-tabs">
                  {mediaArray.map((_, idx) => (
                    <div
                      key={idx}
                      className={`story-tab ${
                        currentIndex === idx ? "active" : ""
                      }`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed description for story_scroll - synchronized with media */}
          <div className="event-description">
            {descArray.length > 0 && (
              <p>
                {descArray[currentIndex] ||
                  descArray[0] ||
                  "No description available."}
              </p>
            )}
          </div>

          {/* Original references section removed - using dropdown instead */}

          {/* Container for both next button and references dropdown */}
          <div className="navigation-container">
            {/* References Dropdown */}
            {references &&
              Array.isArray(references) &&
              references.length > 0 && (
                <div className="references-dropdown">
                  <button className="references-dropdown-button">
                    References ▼
                  </button>
                  <div className="references-dropdown-content">
                    {references.map((reference, index) => (
                      <a
                        key={index}
                        href={
                          reference.startsWith("http")
                            ? reference
                            : `https://${reference}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="reference-link-item"
                      >
                        {reference}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {/* Next Event Button - navigate by ID order */}
            {(() => {
              // Sort all events by ID
              const sortedEvents = [...events].sort((a, b) => a.id - b.id);
              const currentIndex = sortedEvents.findIndex(
                (event) => event.id === focusedMarker.id
              );
              const hasNextEvent =
                currentIndex >= 0 && currentIndex < sortedEvents.length - 1;

              return hasNextEvent ? (
                <div className="next-event-button-container">
                  <button
                    className="next-event-button"
                    onClick={() => {
                      const nextEvent = sortedEvents[currentIndex + 1];

                      if (nextEvent) {
                        // Find the marker for this event
                        const nextMarker = markers.find((m) => {
                          if (m.id === nextEvent.id) return true;
                          if (m.eventsAtLocation) {
                            return m.eventsAtLocation.some(
                              (e) => e.id === nextEvent.id
                            );
                          }
                          return false;
                        });

                        if (nextMarker) {
                          // Create marker with event data
                          const tempMarker = {
                            ...nextMarker,
                            id: nextEvent.id,
                            phase: nextEvent.phase,
                            year: nextEvent.year,
                            city: nextEvent.location,
                            eventName: nextEvent.eventName,
                            description: nextEvent.description,
                            mediaUrl: nextEvent.mediaUrl,
                            sourceMedia: nextEvent.sourceMedia,
                            templateType: nextEvent.templateType,
                          };
                          dispatch({ type: "FOCUS", payload: tempMarker });
                        }
                      }
                    }}
                  >
                    Next Event →
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </>
    );
  };

  // Component to handle grid template with shared state
  const GridTemplateContent = ({ focusedMarker, dispatch }) => {
    const { eventName, mediaUrl, sourceMedia, description, references } =
      focusedMarker;
    const mediaArray = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    const [currentIndex, setCurrentIndex] = React.useState(0);

    return (
      <>
        <div className="header">
          <Button
            label="Back to globe"
            onClick={() => dispatch({ type: "FOCUS" })}
          />
        </div>
        <div className="detail-content">
          {/* Title from eventName */}
          <h2 className="event-title">{eventName || "Historical Event"}</h2>

          {/* Media (image/video) from mediaUrl - grid template with navigation */}
          {mediaArray.length > 0 && (
            <div className="media-container">
              <div className="grid-media-container">
                <div className="grid-nav-buttons">
                  <button
                    className="nav-btn prev-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex((prev) =>
                        prev > 0 ? prev - 1 : mediaArray.length - 1
                      );
                    }}
                  >
                    &#8249;
                  </button>

                  <div className="media-display">
                    <MediaDisplay
                      mediaUrl={mediaArray[currentIndex]}
                      eventName={eventName}
                      currentIndex={currentIndex}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />

                    {/* Source media caption */}
                    {sourceMedia && (
                      <div className="media-caption">
                        {typeof sourceMedia === "string"
                          ? sourceMedia
                          : Array.isArray(sourceMedia)
                          ? Array.isArray(sourceMedia) &&
                            sourceMedia[currentIndex]
                            ? sourceMedia[currentIndex]
                            : sourceMedia[0] || "Source"
                          : "Source"}
                      </div>
                    )}
                  </div>

                  <button
                    className="nav-btn next-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex((prev) =>
                        prev < mediaArray.length - 1 ? prev + 1 : 0
                      );
                    }}
                  >
                    &#8250;
                  </button>
                </div>

                {/* Grid tabs */}
                <div className="grid-tabs">
                  {mediaArray.map((_, idx) => (
                    <div
                      key={idx}
                      className={`grid-tab ${
                        currentIndex === idx ? "active" : ""
                      }`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed description */}
          <div className="event-description">
            {description &&
              (typeof description === "string" ? (
                <p>{description}</p>
              ) : Array.isArray(description) ? (
                // If description is an array (for other templates), show the first item
                <p>{description[0]}</p>
              ) : (
                <p>No description available.</p>
              ))}
          </div>

          {/* Original references section removed - using dropdown instead */}

          {/* Container for both next button and references dropdown */}
          <div className="navigation-container">
            {/* References Dropdown */}
            {references &&
              Array.isArray(references) &&
              references.length > 0 && (
                <div className="references-dropdown">
                  <button className="references-dropdown-button">
                    References ▼
                  </button>
                  <div className="references-dropdown-content">
                    {references.map((reference, index) => (
                      <a
                        key={index}
                        href={
                          reference.startsWith("http")
                            ? reference
                            : `https://${reference}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="reference-link-item"
                      >
                        {reference}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {/* Next Event Button - navigate by ID order */}
            {(() => {
              // Sort all events by ID
              const sortedEvents = [...events].sort((a, b) => a.id - b.id);
              const currentIndex = sortedEvents.findIndex(
                (event) => event.id === focusedMarker.id
              );
              const hasNextEvent =
                currentIndex >= 0 && currentIndex < sortedEvents.length - 1;

              return hasNextEvent ? (
                <div className="next-event-button-container">
                  <button
                    className="next-event-button"
                    onClick={() => {
                      const nextEvent = sortedEvents[currentIndex + 1];

                      if (nextEvent) {
                        // Find the marker for this event
                        const nextMarker = markers.find((m) => {
                          if (m.id === nextEvent.id) return true;
                          if (m.eventsAtLocation) {
                            return m.eventsAtLocation.some(
                              (e) => e.id === nextEvent.id
                            );
                          }
                          return false;
                        });

                        if (nextMarker) {
                          // Create marker with event data
                          const tempMarker = {
                            ...nextMarker,
                            id: nextEvent.id,
                            phase: nextEvent.phase,
                            year: nextEvent.year,
                            city: nextEvent.location,
                            eventName: nextEvent.eventName,
                            description: nextEvent.description,
                            mediaUrl: nextEvent.mediaUrl,
                            sourceMedia: nextEvent.sourceMedia,
                            templateType: nextEvent.templateType,
                          };
                          dispatch({ type: "FOCUS", payload: tempMarker });
                        }
                      }
                    }}
                  >
                    Next Event →
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </>
    );
  };

  let content;
  if (focusedMarker) {
    const {
      eventName,
      mediaUrl,
      sourceMedia,
      description,
      references,
      eventsAtLocation,
    } = focusedMarker || {};

    // Handle multiple events at location
    if (eventsAtLocation && eventsAtLocation.length > 1) {
      // If multiple events at this location, show a list
      content = (
        <>
          <div className="header">
            <Button
              label="Back to globe"
              onClick={() => dispatch({ type: "FOCUS" })}
            />
          </div>
          <div className="content">
            <h2>
              Các sự kiện tại:{" "}
              {eventsAtLocation[0]?.location || focusedMarker.city}
            </h2>
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
                    dispatch({ type: "FOCUS", payload: tempMarker });
                  }}
                >
                  <h3>
                    {event.eventName} ({event.year})
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    } else {
      // Handle different template types
      const templateType = focusedMarker.templateType || "normal";

      if (templateType === "story_scroll") {
        // Render story scroll template with shared state
        return (
          <Fade className="details" show={!!focusedMarker}>
            <StoryScrollContent
              focusedMarker={focusedMarker}
              dispatch={dispatch}
            />
          </Fade>
        );
      } else if (templateType === "grid") {
        // Render grid template with shared state
        return (
          <Fade className="details" show={!!focusedMarker}>
            <GridTemplateContent
              focusedMarker={focusedMarker}
              dispatch={dispatch}
            />
          </Fade>
        );
      } else {
        // Normal template: single media item
        content = (
          <>
            <div className="header">
              <Button
                label="Back to globe"
                onClick={() => dispatch({ type: "FOCUS" })}
              />
            </div>
            <div className="detail-content">
              {/* Title from eventName */}
              <h2 className="event-title">{eventName || "Historical Event"}</h2>

              {/* Media (image/video) from mediaUrl - normal template */}
              {mediaUrl && (
                <div className="media-container">
                  {Array.isArray(mediaUrl) ? (
                    // If mediaUrl is an array (fallback for normal template), show the first item
                    <MediaDisplay
                      mediaUrl={mediaUrl[0]}
                      eventName={eventName}
                      currentIndex={0}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : typeof mediaUrl === "string" ? (
                    // If mediaUrl is a single string
                    <MediaDisplay
                      mediaUrl={mediaUrl}
                      eventName={eventName}
                      currentIndex={0}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : null}

                  {/* Source media caption */}
                  {sourceMedia && (
                    <div className="media-caption">
                      {typeof sourceMedia === "string"
                        ? sourceMedia
                        : Array.isArray(sourceMedia)
                        ? sourceMedia[0] || "Source"
                        : "Source"}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed description */}
              <div className="event-description">
                {description &&
                  (typeof description === "string" ? (
                    <p>{description}</p>
                  ) : Array.isArray(description) ? (
                    // If description is an array (for other templates), show the first item
                    <p>{description[0]}</p>
                  ) : (
                    <p>No description available.</p>
                  ))}
              </div>

              {/* Original references section removed - using dropdown instead */}

              {/* Container for both next button and references dropdown */}
              <div className="navigation-container">
                {/* References Dropdown */}
                {references &&
                  Array.isArray(references) &&
                  references.length > 0 && (
                    <div className="references-dropdown">
                      <button className="references-dropdown-button">
                        References ▼
                      </button>
                      <div className="references-dropdown-content">
                        {references.map((reference, index) => (
                          <a
                            key={index}
                            href={
                              reference.startsWith("http")
                                ? reference
                                : `https://${reference}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="reference-link-item"
                          >
                            {reference}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Next Event Button - navigate by ID order */}
                {(() => {
                  // Sort all events by ID
                  const sortedEvents = [...events].sort((a, b) => a.id - b.id);
                  const currentIndex = sortedEvents.findIndex(
                    (event) => event.id === focusedMarker.id
                  );
                  const hasNextEvent =
                    currentIndex >= 0 && currentIndex < sortedEvents.length - 1;

                  return hasNextEvent ? (
                    <div className="next-event-button-container">
                      <button
                        className="next-event-button"
                        onClick={() => {
                          const nextEvent = sortedEvents[currentIndex + 1];

                          if (nextEvent) {
                            // Find the marker for this event
                            const nextMarker = markers.find((m) => {
                              if (m.id === nextEvent.id) return true;
                              if (m.eventsAtLocation) {
                                return m.eventsAtLocation.some(
                                  (e) => e.id === nextEvent.id
                                );
                              }
                              return false;
                            });

                            if (nextMarker) {
                              // Create marker with event data
                              const tempMarker = {
                                ...nextMarker,
                                id: nextEvent.id,
                                phase: nextEvent.phase,
                                year: nextEvent.year,
                                city: nextEvent.location,
                                eventName: nextEvent.eventName,
                                description: nextEvent.description,
                                mediaUrl: nextEvent.mediaUrl,
                                sourceMedia: nextEvent.sourceMedia,
                                templateType: nextEvent.templateType,
                              };
                              dispatch({ type: "FOCUS", payload: tempMarker });
                            }
                          }
                        }}
                      >
                        Next Event →
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </>
        );
      }
    }
  }

  return (
    <Fade className="details" show={!!focusedMarker}>
      {content}
    </Fade>
  );
}
