import React from 'react';

import { useStateValue } from '../state';
import Description from './description';
import Fade from './fade';

// Quốc huy cách điệu – sao vàng năm cánh trong vầng tia, dùng cho màn mở đầu
function CoverEmblem() {
  return (
    <svg
      className="cover-emblem-svg"
      viewBox="0 0 120 120"
      width="96"
      height="96"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="emblemGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f6d98c" />
          <stop offset="55%" stopColor="#d4a853" />
          <stop offset="100%" stopColor="#a9802f" />
        </radialGradient>
      </defs>
      {/* vầng tia toả */}
      <g className="cover-emblem-rays" stroke="#d4a853" strokeWidth="1.1" opacity="0.85">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 24;
          const r1 = 44;
          const r2 = i % 2 === 0 ? 56 : 51;
          return (
            <line
              key={i}
              x1={60 + Math.cos(a) * r1}
              y1={60 + Math.sin(a) * r1}
              x2={60 + Math.cos(a) * r2}
              y2={60 + Math.sin(a) * r2}
            />
          );
        })}
      </g>
      <circle cx="60" cy="60" r="42" fill="none" stroke="#d4a853" strokeWidth="1.4" opacity="0.5" />
      <circle cx="60" cy="60" r="38" fill="none" stroke="#d4a853" strokeWidth="0.8" opacity="0.3" />
      {/* sao vàng năm cánh */}
      <path
        className="cover-emblem-star"
        fill="url(#emblemGlow)"
        d="M60 22 L67.6 45.4 L92.2 45.4 L72.3 59.9 L79.9 83.3 L60 68.8 L40.1 83.3 L47.7 59.9 L27.8 45.4 L52.4 45.4 Z"
      />
    </svg>
  );
}

export default function Intro() {
  const [{ hasLoaded, start }, dispatch] = useStateValue();

  return (
    <Fade className="cover-screen" show={!start} animationDuration={1100}>
      <div className="cover-grain" aria-hidden="true" />
      <div className="cover-glow" aria-hidden="true" />

      <div className="cover-inner">
        <div className="cover-emblem">
          <CoverEmblem />
        </div>

        <span className="cover-eyebrow">Quá trình hình thành</span>

        <h1 className="cover-title">
          Tư tưởng <em>Hồ Chí Minh</em>
        </h1>

        <div className="cover-rule" aria-hidden="true" />

        <p className="cover-sub">
          <Description />
        </p>

        <button
          type="button"
          className="cover-cta"
          disabled={!hasLoaded}
          onClick={() => dispatch({ type: 'START' })}
        >
          <span>{hasLoaded ? 'Bắt đầu hành trình' : 'Đang dựng bản đồ tư liệu…'}</span>
          {hasLoaded && <i className="cover-cta-arrow">→</i>}
        </button>

        <div className="cover-meta">
          <span>1890</span>
          <i />
          <span>Vòng quanh thế giới</span>
          <i />
          <span>1969</span>
        </div>
      </div>
    </Fade>
  );
}
