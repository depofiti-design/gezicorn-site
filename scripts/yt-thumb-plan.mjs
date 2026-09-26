// Küçük resim planı: uzun videolar için Gemini'den yazı satırları + arka plan sahnesi + duygu üretir (toplu, model rotasyonlu).
// Çıktı: youtube-backup/thumb-plan.json  [{id,title,views,lines:[..],scene,emotion}]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const KEY = readFileSync(new URL('./gemini-key.local.txt', import.meta.url), 'utf8').trim();
const long = JSON.parse(readFileSync('youtube-backup/long.json', 'utf8'));
const vids = JSON.parse(readFileSync('youtube-backup/' + 'videos-2026-09-26.json', 'utf8'));
const byId = new Map(vids.map((v) => [v.id, v]));
const KEEP = new Set([2, 4, 8, 12, 19, 20, 22, 25, 26, 27, 28, 31, 32, 33, 35].map((i) => long[i].id));
const donePath = 'youtube-backup/thumb-plan.json';
const plan = existsSync(donePath) ? JSON.parse(readFileSync(donePath, 'utf8')) : [];
const have = new Set(plan.map((p) => p.id));
const targets = long.filter((v) => !KEEP.has(v.id) && !have.has(v.id));
console.log('planlanacak', targets.length, 'video');
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash'];
const dead = new Set();
async function ask(text) {
  for (let round = 0; round < 3; round++) for (const m of MODELS) {
    if (dead.has(m)) continue;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseMimeType: 'application/json' } }) });
    const j = await r.json();
    if (j.error) { if (j.error.code === 429) { dead.add(m); continue; } await new Promise((s) => setTimeout(s, 3000)); continue; }
    try { const a = JSON.parse(j.candidates[0].content.parts.map((p) => p.text || '').join('')); if (Array.isArray(a)) return a; } catch { /* sonraki */ }
  }
  return null;
}
for (let i = 0; i < targets.length; i += 10) {
  const ch = targets.slice(i, i + 10);
  const items = ch.map((t) => { const v = byId.get(t.id); return `ID: ${t.id}\nBaşlık: ${t.title}\nAçıklama: ${(v.snippet.description || '').replace(/\n\n▶[\s\S]*$/, '').replace(/^▶ [^\n]*\n\n?/, '').slice(0, 220)}`; }).join('\n---\n');
  const text = `Sen YouTube küçük resim (thumbnail) uzmanısın. Kanal: Gezicorn, Türkçe solo gezi/vize/yurt dışı yaşam. Aşağıdaki videolar için küçük resim planı üret.
Her video için nesne: {"id": aynen, "lines": [en fazla 3 kısa satır, her satır en fazla 12 karakter, doğru Türkçe yazım (ç ğ ı ö ş ü İ), videonun asıl konusunu vurgulayan çarpıcı kanca; başlıktan ve açıklamadan doğrulanamayan iddia/rakam YAZMA; büyük/küçük harf fark etmez], "scene": "İngilizce, arka plan sahnesinin kısa tarifi (yer, ortam, ışık; videonun konusuna uygun; insan kalabalığı olabilir ama ana kişi sadece tek erkek olacak; marka/logo/yazı yok)", "emotion": "surprised | happy | worried | curious | serious | excited"}.
JSON dizisi döndür.
VİDEOLAR:
${items}`;
  const arr = await ask(text);
  if (!arr) { console.log('TÜM MODELLER LİMİTTE, durdu'); break; }
  for (const a of arr) { const t = ch.find((x) => x.id === a.id); if (t && Array.isArray(a.lines) && a.scene) plan.push({ id: t.id, title: t.title, views: t.views, lines: a.lines.slice(0, 3).map(String), scene: String(a.scene), emotion: String(a.emotion || 'excited') }); }
  writeFileSync(donePath, JSON.stringify(plan));
  console.log('plan', plan.length);
}
console.log('bitti', plan.length);
