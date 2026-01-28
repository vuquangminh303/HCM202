import React, { useState, useEffect } from 'react';
import { useStateValue } from '../state';

const TimelineBar = () => {
  const [{ events, focusedMarker }, dispatch] = useStateValue();
  const [isOpen, setIsOpen] = useState(false);
  const [unlockedPhases, setUnlockedPhases] = useState(new Set([1])); // Start with phase 1 unlocked
  const [expandedPhases, setExpandedPhases] = useState({});

  // Load unlocked phases from localStorage on component mount
  useEffect(() => {
    const savedUnlockedPhases = localStorage.getItem('unlockedPhases');
    if (savedUnlockedPhases) {
      setUnlockedPhases(new Set(JSON.parse(savedUnlockedPhases)));
    } else {
      setUnlockedPhases(new Set([1])); // Default to phase 1 unlocked
    }
  }, []);

  // Save unlocked phases to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('unlockedPhases', JSON.stringify([...unlockedPhases]));
  }, [unlockedPhases]);

  // Check if focused marker belongs to a new phase and unlock next phase if all events in current phase are viewed
  useEffect(() => {
    if (focusedMarker) {
      const currentPhase = focusedMarker.phase;

      // Track viewed event in localStorage immediately when focused
      const viewedEvents = JSON.parse(localStorage.getItem(`viewedEvents_phase_${currentPhase}`)) || [];
      if (!viewedEvents.includes(focusedMarker.id)) {
        localStorage.setItem(`viewedEvents_phase_${currentPhase}`,
          JSON.stringify([...viewedEvents, focusedMarker.id]));

        // Check if all events in current phase are now viewed to unlock the next phase
        const phaseEvents = events.filter(event => event.phase === currentPhase);
        const allViewedEvents = JSON.parse(localStorage.getItem(`viewedEvents_phase_${currentPhase}`)) || [];

        if (allViewedEvents.length >= phaseEvents.length && currentPhase < 5) {
          setUnlockedPhases(prev => new Set(prev).add(currentPhase + 1));
        }
      }
    }
  }, [focusedMarker, events]);

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
    1: 'Khởi đầu (1890-1911)',
    2: 'Tìm đường cứu nước (1911-1925)',
    3: 'Thành lập Việt Minh (1925-1945)',
    4: 'Tuyên ngôn Độc lập (1945-1969)',
    5: 'Di sản và tưởng niệm (1969-nay)',
  };

  const handleEventClick = (event) => {
    if (!unlockedPhases.has(event.phase)) {
      return; // Don't allow clicking on locked phases
    }

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
        <span>5 Giai Đoạn</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </div>

      {isOpen && (
        <div className="timeline-dropdown">
          {[1, 2, 3, 4, 5].map((phase) => {
            const isLocked = !unlockedPhases.has(phase);
            const isCurrentPhase = focusedMarker && focusedMarker.phase === phase;
            const isExpanded = expandedPhases[phase] || false;

            const togglePhase = () => {
              if (!isLocked) {
                setExpandedPhases(prev => ({
                  ...prev,
                  [phase]: !prev[phase]
                }));
              }
            };

            return (
              <div key={phase} className={`phase-section ${isCurrentPhase ? 'active-phase' : ''}`}>
                <div className={`phase-header ${isLocked ? 'locked' : 'unlocked'}`}
                     onClick={togglePhase}>
                  <span className="phase-icon">
                    {isLocked ? '🔒' : '🔓'}
                  </span>
                  <h3>{phaseLabels[phase]}</h3>
                  <span className={`phase-arrow ${isExpanded ? 'expanded' : ''}`}>&#9660;</span>
                </div>
                {!isLocked && isExpanded && (
                  <div className="phase-events">
                    {(groupedEvents[phase] || []).map((event) => {
                      const viewedEvents = JSON.parse(localStorage.getItem(`viewedEvents_phase_${phase}`)) || [];
                      const isViewed = viewedEvents.includes(event.id);

                      return (
                        <div
                          key={event.id}
                          className={`event-item ${isViewed ? 'viewed' : ''}`}
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
