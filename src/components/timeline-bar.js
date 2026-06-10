import React, { useEffect, useMemo, useState } from 'react';
import { useStateValue } from '../state';

const TimelineBar = () => {
  const [{ events, focusedMarker }, dispatch] = useStateValue();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState({});

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => Number(a.id) - Number(b.id)),
    [events]
  );

  const currentIndex = focusedMarker
    ? sortedEvents.findIndex((event) => event.id === focusedMarker.id)
    : -1;

  useEffect(() => {
    if (!focusedMarker?.phase) return;
    setExpandedPhases((prev) => ({ ...prev, [focusedMarker.phase]: true }));
  }, [focusedMarker?.phase]);

  // Group events by phase
  const groupedEvents = sortedEvents.reduce((acc, event) => {
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
  const maxPhase = Math.max(...sortedEvents.map((event) => event.phase), 0);
  const allPhases = Array.from({ length: maxPhase }, (_, i) => i + 1);

  const handleEventClick = (event) => {
    dispatch({
      type: 'FOCUS',
      payload: { ...event, city: event.location, value: event.phase || 1 },
    });
  };

  return (
    <div className="timeline-bar">
      <button
        type="button"
        className="timeline-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <small>DÒNG THỜI GIAN</small>
          <span>Con đường hoạt động cách mạng</span>
        </div>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </button>

      {isOpen && (
        <div className="timeline-dropdown">
          <div className="timeline-story-controls">
            <span>
              <strong>{currentIndex >= 0 ? currentIndex + 1 : 0}</strong>
              <small>/{sortedEvents.length} mốc tư liệu</small>
            </span>
            <div>
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={() => handleEventClick(sortedEvents[currentIndex - 1])}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => handleEventClick(sortedEvents[0])}
              >
                Từ đầu
              </button>
              <button
                type="button"
                disabled={currentIndex === sortedEvents.length - 1}
                onClick={() =>
                  handleEventClick(sortedEvents[Math.max(0, currentIndex + 1)])
                }
              >
                →
              </button>
            </div>
          </div>
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
                <button
                  type="button"
                  className="phase-header"
                  onClick={togglePhase}
                >
                  <span className="phase-number">{phase}</span>
                  <span className="phase-heading">
                    <small>Giai đoạn {phase}</small>
                    <h3>{phaseLabels[phase] || `Giai đoạn ${phase}`}</h3>
                  </span>
                  <span
                    className={`phase-arrow ${isExpanded ? 'expanded' : ''}`}
                  >
                    &#9660;
                  </span>
                </button>
                {isExpanded && (
                  <div className="phase-events">
                    {(groupedEvents[phase] || []).map((event) => {
                      const eventIndex = sortedEvents.findIndex(
                        (item) => item.id === event.id
                      );
                      const isVisited = currentIndex >= eventIndex && currentIndex >= 0;

                      return (
                        <button
                          type="button"
                          key={event.id}
                          className={`event-item ${
                            focusedMarker?.id === event.id ? 'active-event' : ''
                          } ${isVisited ? 'visited-event' : ''}`}
                          onClick={() => handleEventClick(event)}
                        >
                          <span className="event-status" />
                          <span className="event-copy">
                            <div className="event-year">
                              <span>{event.year}</span>
                              <span>{event.location}</span>
                            </div>
                            <div className="event-name">{event.eventName}</div>
                          </span>
                        </button>
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
