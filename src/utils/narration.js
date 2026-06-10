// Giọng kể chuyện dùng Web Speech API (speechSynthesis) – không cần key, chạy trên trình duyệt.

export function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Chọn giọng tiếng Việt tốt nhất hiện có, fallback về giọng mặc định.
function pickVietnameseVoice() {
  if (!isSupported()) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  return (
    voices.find((v) => /^vi([-_]|$)/i.test(v.lang)) ||
    voices.find((v) => (v.lang || '').toLowerCase().startsWith('vi')) ||
    voices.find((v) => /viet/i.test(v.name)) ||
    null
  );
}

// Voices nạp bất đồng bộ trên Chrome – chờ sẵn để lần đọc đầu có giọng đúng.
export function loadVoices() {
  return new Promise((resolve) => {
    if (!isSupported()) return resolve([]);
    const synth = window.speechSynthesis;
    const current = synth.getVoices();
    if (current.length) return resolve(current);
    synth.onvoiceschanged = () => resolve(synth.getVoices());
  });
}

let keepAlive = null;
let currentAudio = null;

function clearKeepAlive() {
  if (keepAlive) {
    clearInterval(keepAlive);
    keepAlive = null;
  }
}

// Phát file mp3 tạo sẵn (ElevenLabs). Trả về true nếu bắt đầu phát được.
export function playFile(url, { onStart, onEnd, onError } = {}) {
  stop();
  const audio = new Audio(url);
  currentAudio = audio;
  audio.onplay = () => onStart && onStart();
  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
    onEnd && onEnd();
  };
  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null;
    onError && onError();
  };
  audio.play().catch(() => onError && onError());
  return audio;
}

export function speak(text, { rate = 0.9, pitch = 1, onStart, onEnd, onError } = {}) {
  if (!isSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // dừng câu đang đọc trước khi đọc câu mới

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVietnameseVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = (voice && voice.lang) || 'vi-VN';
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;

  utterance.onstart = () => onStart && onStart();
  utterance.onend = () => {
    clearKeepAlive();
    onEnd && onEnd();
  };
  utterance.onerror = (event) => {
    clearKeepAlive();
    // 'interrupted'/'canceled' là do mình chủ động cancel – không coi là lỗi thật
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      onError && onError(event);
    }
  };

  synth.speak(utterance);

  // Workaround lỗi Chrome tự ngắt sau ~15s với câu dài: pause/resume định kỳ.
  clearKeepAlive();
  keepAlive = setInterval(() => {
    if (!synth.speaking) return clearKeepAlive();
    synth.pause();
    synth.resume();
  }, 10000);
}

export function stop() {
  clearKeepAlive();
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio = null;
  }
  if (isSupported()) window.speechSynthesis.cancel();
}
