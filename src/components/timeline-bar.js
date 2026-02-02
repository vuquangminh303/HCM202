import React, { useState } from 'react';
import { useStateValue } from '../state';

const TimelineBar = () => {
  const [{ events, focusedMarker }, dispatch] = useStateValue();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({});

  // Group events by phase
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.phase]) {
      acc[event.phase] = [];
    }
    acc[event.phase].push(event);
    return acc;
  }, {});

  // Define phase labels
  const phaseLabels = {
    1: 'Thời thơ ấu và thanh niên (Trước 1911)',
    2: 'Khảo sát thực tiễn và tìm thấy con đường cứu nước (1911-1920)',
    3: 'Hoạt động lý luận và chuẩn bị thành lập Đảng (1920-1930)',
    4: 'Kiên trì con đường đã chọn, vượt qua thử thách (1930-1941)',
    5: 'Trực tiếp lãnh đạo Cách mạng giành độc lập và kháng chiến (1941-1969)',
  };

  // Dynamically determine the number of phases based on available data
  const maxPhase = Math.max(...events.map((event) => event.phase), 0);
  const allPhases = Array.from({ length: maxPhase }, (_, i) => i + 1);

  const handleEventClick = (event) => {
    // Find the corresponding marker in the state
    const markers = events.map((e) => ({
      id: e.id,
      phase: e.phase,
      year: e.year,
      city: e.location,
      coordinates: e.coordinates,
      eventName: e.eventName,
      description: e.description,
      mediaUrl: e.mediaUrl,
      sourceMedia: e.sourceMedia,
      quoteSource: e.quoteSource,
      templateType: e.templateType,
      references: e.references, // Add references field
      value: e.phase || 1,
    }));

    const marker = markers.find((m) => m.id === event.id);
    if (marker) {
      dispatch({ type: 'FOCUS', payload: marker });
    }
  };

  return (
    <div className="timeline-bar">
      <div className="timeline-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span>5 Giai Đoạn Chính</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </div>

      {isOpen && (
        <div className="timeline-dropdown">
          {allPhases.map((phase) => {
            const isCurrentPhase =
              focusedMarker && focusedMarker.phase === phase;
            const isExpanded = expandedPhases[phase] || false;

            const togglePhase = () => {
              setExpandedPhases((prev) => ({
                ...prev,
                [phase]: !prev[phase],
              }));
            };

            return (
              <div
                key={phase}
                className={`phase-section ${isCurrentPhase ? 'active-phase' : ''
                  }`}
              >
                <div
                  className="phase-header"
                  onClick={togglePhase}
                >
                  <h3>{phaseLabels[phase] || `Giai đoạn ${phase}`}</h3>
                  <span
                    className={`phase-arrow ${isExpanded ? 'expanded' : ''}`}
                  >
                    &#9660;
                  </span>
                </div>
                {isExpanded && (
                  <div className="phase-events">
                    {(groupedEvents[phase] || []).map((event) => {
                      return (
                        <div
                          key={event.id}
                          className="event-item"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="event-year">{event.year}</div>
                          <div className="event-name">{event.eventName}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimelineBar;
