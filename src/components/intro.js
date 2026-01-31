import React, { useEffect } from 'react';

import { useStateValue } from '../state';
import Description from './description';
import Fade from './fade';

export default function Intro() {
  const [{ hasLoaded, start }, dispatch] = useStateValue();

  // Auto-start the application when loaded
  useEffect(() => {
    if (hasLoaded && !start) {
      dispatch({ type: 'START' });
    }
  }, [hasLoaded, start, dispatch]);

  return (
    <Fade className="intro" show={!start}>
      <h1>Quá trình hình thành tư tưởng Hồ Chí Minh</h1>
      <p>
        <Description />
      </p>
    </Fade>
  );
}
