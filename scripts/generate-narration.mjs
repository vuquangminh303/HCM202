// Tạo sẵn file mp3 giọng kể cho từng sự kiện bằng ElevenLabs.
// Chạy:  node --env-file=.env scripts/generate-narration.mjs
// - Đọc key/voice/model từ .env
// - Bỏ qua file đã tạo (chạy lại không tốn credit; đổi key acc khác để làm nốt phần còn thiếu)
// - Ghi public/audio/event-<id>.mp3 + public/audio/manifest.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5';

if (!API_KEY || !VOICE_ID) {
  console.error('Thiếu ELEVENLABS_API_KEY hoặc ELEVENLABS_VOICE_ID.');
  console.error('Chạy: node --env-file=.env scripts/generate-narration.mjs');
  process.exit(1);
}

// ── Ghép lời kể (PHẢI khớp với src/components/narrator.js) ──
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
function buildText(ev) {
  const parts = [];
  const lead = [spokenDate(ev.year), ev.location].filter(Boolean).join(', tại ');
  if (lead) parts.push(lead + '.');
  if (ev.eventName) parts.push(ev.eventName + '.');
  const desc = Array.isArray(ev.description) ? ev.description.filter(Boolean).join(' ') : ev.description;
  if (desc) parts.push(desc);
  return parts.join(' ');
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/hcm_data.json'), 'utf8'));
const events = [...data.events].sort((a, b) => Number(a.id) - Number(b.id));

const OUT = path.join(ROOT, 'public/audio');
fs.mkdirSync(OUT, { recursive: true });

console.log(`Model: ${MODEL} | Voice: ${VOICE_ID} | ${events.length} sự kiện\n`);

let usedChars = 0;
for (const ev of events) {
  const file = path.join(OUT, `event-${ev.id}.mp3`);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) {
    console.log(`#${ev.id}  ⏭  đã có, bỏ qua`);
    continue;
  }
  const text = buildText(ev);
  process.stdout.write(`#${ev.id}  (${text.length} ký tự) … `);
  const MAX_RETRY = 4;
  let done = false;
  for (let attempt = 1; attempt <= MAX_RETRY && !done; attempt += 1) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
          }),
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        // Hết credit thật → dừng hẳn để đổi key
        if (res.status === 429 || /quota|credit|exceeded/i.test(msg)) {
          console.log(`HẾT CREDIT (${res.status})`);
          process.exitCode = 2;
          attempt = MAX_RETRY + 1; // thoát vòng retry
          break;
        }
        // 401/5xx có thể chỉ là flag chập chờn theo IP → thử lại
        if (attempt < MAX_RETRY) {
          process.stdout.write(`(${res.status}, thử lại ${attempt}/${MAX_RETRY}) `);
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        console.log(`LỖI ${res.status}`);
        console.error('   ' + msg.slice(0, 200));
        break;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(file, buf);
      usedChars += text.length;
      console.log(`OK  ${Math.round(buf.length / 1024)}KB`);
      done = true;
    } catch (e) {
      if (attempt < MAX_RETRY) {
        process.stdout.write(`(mạng lỗi, thử lại ${attempt}/${MAX_RETRY}) `);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      console.log('LỖI mạng: ' + e.message);
    }
  }
  // Nếu lần này hết credit thì dừng vòng ngoài
  if (process.exitCode === 2) break;
}

// Manifest: danh sách id đã có file → app biết khi nào phát mp3, khi nào fallback giọng máy
const haveIds = events.map((e) => e.id).filter((id) => fs.existsSync(path.join(OUT, `event-${id}.mp3`)));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(haveIds));

console.log(`\nXong: ${haveIds.length}/${events.length} file mp3. Ký tự dùng phiên này ~${usedChars} (≈ ${MODEL.includes('v3') ? usedChars : Math.round(usedChars / 2)} credit).`);
if (haveIds.length < events.length) {
  console.log(`Còn thiếu ${events.length - haveIds.length} file → đổi key rồi chạy lại lệnh trên.`);
}
