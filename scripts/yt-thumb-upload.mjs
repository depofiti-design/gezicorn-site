// Hazır küçük resimleri (youtube-backup/thumbs/<id>.jpg) YouTube'a yükler (thumbnails.set, 50 birim/adet).
// Kullanım: node yt-thumb-upload.mjs [--limit 40] [--include-top]   (varsayılan: izlenmesi en yüksek 12 videoyu ATLAR, önce deneme sonucu görülsün)
// Durum: youtube-backup/state.json içinde thumb_done:true. Kota dolunca durur, ertesi gün devam eder.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { token } from './yt-lib.mjs';
const args = process.argv.slice(2);
const limit = +(args.includes('--limit') ? args[args.indexOf('--limit') + 1] : 40);
const includeTop = args.includes('--include-top');
const state = existsSync('youtube-backup/state.json') ? JSON.parse(readFileSync('youtube-backup/state.json', 'utf8')) : {};
const long = JSON.parse(readFileSync('youtube-backup/long.json', 'utf8'));
const views = new Map(long.map((v) => [v.id, v.views]));
const top = new Set(long.slice(0, 12).map((v) => v.id));
const files = readdirSync('youtube-backup/thumbs').filter((f) => f.endsWith('.jpg')).map((f) => f.replace('.jpg', ''));
const todo = files.filter((id) => !state[id]?.thumb_done && (includeTop || !top.has(id))).sort((a, b) => (views.get(a) || 0) - (views.get(b) || 0)).slice(0, limit);
console.log('yüklenecek', todo.length, '(hazır', files.length + ')');
let ok = 0;
for (const id of todo) {
  const img = readFileSync(`youtube-backup/thumbs/${id}.jpg`);
  const r = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${id}&uploadType=media`, { method: 'POST', headers: { authorization: 'Bearer ' + await token(), 'content-type': 'image/jpeg' }, body: img });
  const j = await r.json();
  if (j.error) {
    console.log('HATA', id, JSON.stringify(j.error).slice(0, 200));
    if (/quota/i.test(JSON.stringify(j.error))) { console.log('GÜNLÜK KOTA DOLDU, yarın devam.'); break; }
    if (/forbidden|verif|permission/i.test(JSON.stringify(j.error))) { console.log('Kanal doğrulanmamış olabilir (özel küçük resim için telefon doğrulaması gerekir).'); break; }
    continue;
  }
  state[id] = { ...(state[id] || {}), thumb_done: true };
  writeFileSync('youtube-backup/state.json', JSON.stringify(state));
  ok++; console.log('yüklendi', id);
}
console.log('bitti', ok);
