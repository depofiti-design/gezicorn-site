// Kuyruktaki (reels-queue.json) bir reeli YouTube Shorts olarak zamanlanmış yükler.
// Kullanım: node yt-upload-short.mjs <queue_id_öneki> <publishAt ISO UTC> [--dry]
// Video private yüklenir, publishAt'te YouTube kendisi yayına alır. Kota: yükleme başına ~1600 birim.
// Sonuç reels-queue.json'daki öğeye youtube_short: {id, publish_at} olarak yazılır (aynı reel iki kez yüklenmez).
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { token } from './yt-lib.mjs';

const [prefix, when] = process.argv.slice(2);
const dry = process.argv.includes('--dry');
if (!prefix || !when) { console.log('kullanım: node yt-upload-short.mjs <queue_id_öneki> <publishAt>'); process.exit(1); }
const QP = new URL('./reels-queue.json', import.meta.url);
const Q = JSON.parse(readFileSync(QP, 'utf8'));
const item = Q.find((x) => x.id.startsWith(prefix));
if (!item) throw new Error('kuyrukta yok: ' + prefix);
if (item.youtube_short) { console.log('zaten yüklü:', item.youtube_short); process.exit(0); }
const file = new URL('../img/social/reels-web/' + item.video_url.split('/').pop(), import.meta.url);
const size = statSync(file).size;

const tagsFrom = (cap) => [...new Set((cap.match(/#[\p{L}\d_]+/gu) || []).map((t) => t.slice(1)))].filter((t) => t !== 'gezicorn');
const body = item.caption_ig.replace(/\n*arkadaşına gönder\n*/i, '\n\n').replace(/\n*#[\s\S]*$/, '').replace(/^\s*[.,-]\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
const link = item.article_slug ? `https://www.gezicorn.com/yazi/${item.article_slug}/` : 'https://www.gezicorn.com';
const title = (item.title.length > 85 ? item.title.slice(0, 85) : item.title) + ' #shorts';
const meta = {
  snippet: {
    title,
    description: `${body}\n\nAyrıntılı rehber: ${link}\n\n#shorts #vize #pasaport #seyahat`,
    tags: ['gezicorn', 'vize', 'pasaport', 'seyahat', 'yurt dışı', ...tagsFrom(item.caption_ig)].slice(0, 15),
    categoryId: '19', defaultLanguage: 'tr', defaultAudioLanguage: 'tr',
  },
  status: { privacyStatus: 'private', publishAt: new Date(when).toISOString(), selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
};
console.log(dry ? 'DRY' : 'YÜKLE', item.id, Math.round(size / 1e5) / 10, 'MB', '\n', JSON.stringify(meta, null, 1));
if (dry) process.exit(0);

const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
  method: 'POST',
  headers: { authorization: 'Bearer ' + await token(), 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-length': String(size), 'x-upload-content-type': 'video/mp4' },
  body: JSON.stringify(meta),
});
if (!init.ok) throw new Error('init ' + init.status + ' ' + await init.text());
const up = await fetch(init.headers.get('location'), { method: 'PUT', headers: { 'content-type': 'video/mp4', 'content-length': String(size) }, body: readFileSync(file) });
const j = await up.json();
if (!j.id) throw new Error('yükleme başarısız: ' + JSON.stringify(j).slice(0, 300));
item.youtube_short = { id: j.id, publish_at: meta.status.publishAt };
writeFileSync(QP, JSON.stringify(Q, null, 2));
console.log('ok https://youtube.com/shorts/' + j.id, 'yayın:', meta.status.publishAt);
