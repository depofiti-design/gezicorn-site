// Çeviri segmentlerinden SRT üretir ve YouTube'a altyazı olarak yükler (youtube.force-ssl kapsamı gerekir).
// Kullanım: node yt-captions.mjs <videoId> <segs.json> <tr_LANG.json> <lang> "<ad>" [--dry]
//   segs.json: [{i,start,end,tr}], tr_LANG.json: Gemini çıktısı [{i,t}] (JSON bir metnin içinde de olabilir)
// Aynı dilde bizim yüklediğimiz altyazı varsa önce silinir (tekrar yüklemede çift olmasın).
import { readFileSync, writeFileSync } from 'node:fs';
import { api, token } from './yt-lib.mjs';

const [vid, segP, trP, lang, name] = process.argv.slice(2);
const dry = process.argv.includes('--dry');
const segs = JSON.parse(readFileSync(segP, 'utf8'));
const raw = readFileSync(trP, 'utf8');
const tr = JSON.parse(raw.match(/\[[\s\S]*\]/)[0]);
const byI = Object.fromEntries(tr.map((x) => [x.i, x.t]));
const cjk = /^(zh|ja|ko)/.test(lang);

const fmt = (s) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const cues = [];
for (const s of segs) {
  const t = (byI[s.i] || '').trim();
  if (!t) continue;
  const dur = s.end - s.start;
  const parts = Math.max(1, Math.round(dur / 4.5));
  // kelime (CJK'de karakter) sayısına göre eşit parçalara böl, süreyi uzunlukla orantılı dağıt
  const units = cjk ? [...t] : t.split(/\s+/);
  const per = Math.ceil(units.length / parts);
  const chunks = [];
  for (let k = 0; k < units.length; k += per) chunks.push(units.slice(k, k + per).join(cjk ? '' : ' '));
  const total = chunks.reduce((a, c) => a + c.length, 0);
  let st = s.start;
  for (const c of chunks) { const d = dur * (c.length / total); cues.push([st, st + d, c]); st += d; }
}
const srt = cues.map(([a, b, t], k) => `${k + 1}\n${fmt(a)} --> ${fmt(b)}\n${t}\n`).join('\n');
writeFileSync(trP.replace(/\.json$/, '.srt'), srt);
console.log(`${lang}: ${cues.length} satır, ${srt.length} bayt`);
if (dry) process.exit(0);

const ex = await api('captions', { part: 'snippet', videoId: vid });
for (const c of ex.items.filter((c) => c.snippet.language === lang && c.snippet.trackKind !== 'asr')) {
  await fetch(`https://www.googleapis.com/youtube/v3/captions?id=${c.id}`, { method: 'DELETE', headers: { authorization: 'Bearer ' + await token() } });
  console.log('eski silindi', c.id);
}
const boundary = 'gzc' + Date.now();
const meta = { snippet: { videoId: vid, language: lang, name, isDraft: false } };
const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/x-subrip; charset=UTF-8\r\n\r\n${srt}\r\n--${boundary}--`;
const r = await fetch('https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=snippet', {
  method: 'POST', headers: { authorization: 'Bearer ' + await token(), 'content-type': `multipart/related; boundary=${boundary}` }, body: Buffer.from(body, 'utf8'),
});
const j = await r.json();
console.log(r.status, j.id || JSON.stringify(j).slice(0, 300));
