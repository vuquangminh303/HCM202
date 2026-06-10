import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useStateValue } from '../state';
import * as narration from '../utils/narration';

// Đọc mốc thời gian tự nhiên: "19-5-1890" → "ngày 19 tháng 5 năm 1890"; "1911" → "năm 1911".
function spokenDate(year) {
  if (!year) return '';
  const raw = String(year).trim();
  const full = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (full) return `Ngày ${full[1]} tháng ${full[2]} năm ${full[3]}`;
  const monthYear = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (monthYear) return `Tháng ${monthYear[1]} năm ${monthYear[2]}`;
  if (/^\d{4}$/.test(raw)) return `Năm ${raw}`;
  return raw;
}

// Ghép nội dung sự kiện thành một đoạn kể chuyện liền mạch.
function buildNarrationText(marker) {
  if (!marker) return '';
  const parts = [];
  const location = marker.city || marker.location;
  const lead = [spokenDate(marker.year), location].filter(Boolean).join(', tại ');
  if (lead) parts.push(lead + '.');
  if (marker.eventName) parts.push(marker.eventName + '.');

  const desc = Array.isArray(marker.description)
    ? marker.description.filter(Boolean).join(' ')
    : marker.description;
  if (desc) parts.push(desc);

  return parts.join(' ');
}

const SOUND_KEY = 'narrationSoundOn';
const NEXT_DELAY = 900; // nghỉ giữa hai sự kiện trong chế độ tự động (ms)

export default function Narrator() {
  const [{ events, focusedMarker }, dispatch] = useStateValue();
  const supported = narration.isSupported();

  // Âm thanh: bật thì click sự kiện nào sẽ đọc sự kiện đó. (mặc định bật)
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem(SOUND_KEY) !== 'false';
  });
  // Tự động kể: chạy hết hành trình (không lưu – không tự khởi động khi tải trang)
  const [autoPlay, setAutoPlay] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => Number(a.id) - Number(b.id)),
    [events]
  );

  const sortedRef = useRef(sortedEvents);
  const soundRef = useRef(soundOn);
  const autoRef = useRef(autoPlay);
  const currentIdRef = useRef(null);
  const advanceTimer = useRef(null);
  const audioIdsRef = useRef(null);
  useEffect(() => { sortedRef.current = sortedEvents; }, [sortedEvents]);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  useEffect(() => { autoRef.current = autoPlay; }, [autoPlay]);

  // Nạp danh sách file mp3 tạo sẵn (chưa generate thì rỗng → dùng giọng máy)
  useEffect(() => {
    narration.loadVoices();
    const base = process.env.PUBLIC_URL || '';
    fetch(`${base}/audio/manifest.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((ids) => { audioIdsRef.current = new Set((ids || []).map(String)); })
      .catch(() => { audioIdsRef.current = new Set(); });
  }, []);

  const focusEvent = useCallback(
    (event) => {
      dispatch({
        type: 'FOCUS',
        payload: { ...event, city: event.location, value: event.phase || 1 },
      });
    },
    [dispatch]
  );

  const narrateMarker = useCallback(
    (marker) => {
      const text = buildNarrationText(marker);
      if (!text) return;
      currentIdRef.current = marker.id;

      const onStart = () => setSpeaking(true);
      const onEnd = () => {
        setSpeaking(false);
        if (String(currentIdRef.current) !== String(marker.id)) return;
        if (!autoRef.current) return; // chỉ chế độ tự động mới chuyển sang sự kiện kế
        const list = sortedRef.current;
        const idx = list.findIndex((e) => String(e.id) === String(marker.id));
        if (idx >= 0 && idx < list.length - 1) {
          clearTimeout(advanceTimer.current);
          advanceTimer.current = setTimeout(() => {
            if (autoRef.current) focusEvent(list[idx + 1]);
          }, NEXT_DELAY);
        } else {
          setAutoPlay(false); // hết hành trình
        }
      };

      const ids = audioIdsRef.current;
      if (ids && ids.has(String(marker.id))) {
        const base = process.env.PUBLIC_URL || '';
        narration.playFile(`${base}/audio/event-${marker.id}.mp3`, {
          onStart,
          onEnd,
          onError: () => narration.speak(text, { onStart, onEnd, onError: () => setSpeaking(false) }),
        });
      } else {
        narration.speak(text, { onStart, onEnd, onError: () => setSpeaking(false) });
      }
    },
    [focusEvent]
  );

  // Click/đổi sự kiện + âm thanh bật → đọc sự kiện đó
  useEffect(() => {
    if (!supported) return undefined;
    if (!soundOn || !focusedMarker) {
      narration.stop();
      setSpeaking(false);
      return undefined;
    }
    narrateMarker(focusedMarker);
    return () => narration.stop();
  }, [focusedMarker, soundOn, supported, narrateMarker]);

  useEffect(
    () => () => {
      clearTimeout(advanceTimer.current);
      narration.stop();
    },
    []
  );

  const persistSound = (val) => {
    try { localStorage.setItem(SOUND_KEY, String(val)); } catch (e) { /* ignore */ }
  };

  const toggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev;
      persistSound(next);
      if (!next) {
        clearTimeout(advanceTimer.current);
        narration.stop();
        setSpeaking(false);
        setAutoPlay(false); // tắt tiếng thì dừng luôn tour
      }
      // bật lại: effect theo dõi soundOn sẽ tự đọc sự kiện đang mở (nếu có)
      return next;
    });
  };

  const toggleAuto = () => {
    setAutoPlay((prev) => {
      const next = !prev;
      if (next) {
        if (!soundRef.current) { setSoundOn(true); persistSound(true); }
        const list = sortedRef.current;
        if (list.length) focusEvent(list[0]); // bắt đầu từ sự kiện đầu
      } else {
        clearTimeout(advanceTimer.current);
        narration.stop();
        setSpeaking(false);
      }
      return next;
    });
  };

  if (!supported) return null;

  return (
    <div className="narrator-controls">
      {/* Nút bật/tắt âm thanh */}
      <button
        type="button"
        className={`narrator-sound ${soundOn ? 'is-on' : 'is-off'} ${
          speaking && !autoPlay ? 'is-speaking' : ''
        }`}
        onClick={toggleSound}
        aria-pressed={soundOn}
        title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh (đọc sự kiện đang xem)'}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3z" />
          {soundOn ? (
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M16 8.5a5 5 0 0 1 0 7M18.7 6a8.5 8.5 0 0 1 0 12"
            />
          ) : (
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M16 9.5l5 5M21 9.5l-5 5"
            />
          )}
        </svg>
        <span className="narrator-sound-label">{soundOn ? 'Âm thanh' : 'Đã tắt'}</span>
      </button>

      {/* Nút tự động kể chuyện (tour) */}
      <button
        type="button"
        className={`narrator-toggle ${autoPlay ? 'is-on' : 'is-off'} ${
          speaking && autoPlay ? 'is-speaking' : ''
        }`}
        onClick={toggleAuto}
        aria-pressed={autoPlay}
        title={autoPlay ? 'Dừng kể chuyện tự động' : 'Tự động kể chuyện từ đầu'}
      >
        <svg className="narrator-icon" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          {autoPlay ? (
            <>
              <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3z" />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M16 8.5a5 5 0 0 1 0 7M18.7 6a8.5 8.5 0 0 1 0 12"
              />
            </>
          ) : (
            <path fill="currentColor" d="M8 5v14l11-7L8 5z" />
          )}
        </svg>

        <span className="narrator-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>

        <span className="narrator-label">
          {autoPlay ? 'Đang kể chuyện…' : 'Tự động kể chuyện'}
        </span>
      </button>
    </div>
  );
}
