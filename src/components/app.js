import React from 'react';

import Details from './details';
import Intro from './intro';
import JourneyMap from './journey-map';
import TimelineBar from './timeline-bar';

export default function App() {
  return (
    <>
      <JourneyMap />
      <Intro />
      <TimelineBar />
      <Details />
    </>
  );
}
