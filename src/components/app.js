import React, { useEffect, useState } from 'react';

import Details from './details';
import Globe from './globe';
import Intro from './intro';
import TimelineBar from './timeline-bar';

export default function App() {
  const [isFestivalTheme, setIsFestivalTheme] = useState(false);

  useEffect(() => {
    const body = document.body;
    if (!body) return;

    if (isFestivalTheme) {
      body.classList.add('theme-festival');
      body.classList.remove('theme-default');
    } else {
      body.classList.add('theme-default');
      body.classList.remove('theme-festival');
    }
  }, [isFestivalTheme]);

  const toggleTheme = () => {
    setIsFestivalTheme((prev) => !prev);
  };

  return (
    <>
      <Globe />
      <Intro />
      <TimelineBar />
      <Details />
      <div className="bottom-right-actions">
        <button
          type="button"
          className="button theme-toggle-button"
          onClick={toggleTheme}
        >
          {isFestivalTheme ? 'Mặc định' : 'Mừng Đảng mừng Xuân'}
        </button>
        <a
          href="https://github.com/PhamXuanKhang/creative_product_HCM202"
          className="button source-code-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mã nguồn
        </a>
      </div>
    </>
  );
}
