// Zamanlanmış sosyal yayın kuyruğu: reels-queue.json'daki vadesi gelmiş, henüz yayınlanmamış girdileri yayınlar.
// platform: 'reel_both' (IG reel + FB video), 'facebook_link' (YouTube kartı + mesaj).
// KURAL (kullanıcı 4 Kasım 2026, kalıcı): günde en fazla 2 reel, aralarında en az 4 saat. Üst üste (aynı çalıştırmada
// birden fazla) ASLA yayınlanmaz. Bu yüzden bu script her çalıştırmada en fazla TEK öğe yayınlar ve yayınlamadan önce
// günlük/aralık sınırını kontrol eder; limit doluysa o çalıştırma hiçbir şey yapmadan çıkar, bir sonraki saatlik
// tetiklemede tekrar dener.
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { postInstagramReel, postFacebookLink, postFacebookVideo } from './lib-social.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(__dirname, 'reels-queue.json');
const queue = JSON.parse(readFileSync(QUEUE, 'utf-8'));
const now = Date.now();

const MAX_PER_DAY = 2;
const MIN_GAP_MS = 4 * 3600 * 1000;
const TR_OFFSET_MS = 3 * 3600 * 1000; // Türkiye saati UTC+3, takvim günü buna göre hesaplanır
const trDay = (iso) => new Date(new Date(iso).getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);

const published = queue.filter((x) => x.published_at).sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
const todayKey = trDay(new Date(now).toISOString());
const publishedToday = published.filter((x) => trDay(x.published_at) === todayKey).length;
const lastPublishedAt = published.length ? new Date(published[0].published_at).getTime() : 0;

if (publishedToday >= MAX_PER_DAY) {
  console.log(`Günlük limit doldu (${publishedToday}/${MAX_PER_DAY} bugün), bu çalıştırmada yayın yapılmayacak.`);
  process.exit(0);
}
if (now - lastPublishedAt < MIN_GAP_MS) {
  const waitMin = Math.ceil((MIN_GAP_MS - (now - lastPublishedAt)) / 60000);
  console.log(`Son yayından bu yana ${((now - lastPublishedAt) / 3600000).toFixed(1)} saat geçmiş (4 saat şart), ${waitMin} dakika sonra tekrar denenecek.`);
  process.exit(0);
}

const due = queue.filter((x) => !x.published_id && new Date(x.publish_at).getTime() <= now).sort((a, b) => new Date(a.publish_at) - new Date(b.publish_at));
if (!due.length) { console.log('Yayınlanacak öğe yok.'); process.exit(0); }

const item = due[0]; // bu çalıştırmada SADECE tek öğe yayınlanır
let result;
if (item.platform === 'facebook_link') {
  result = { facebook: await postFacebookLink({ link: item.link, message: item.message }) };
} else {
  const igId = await postInstagramReel({ video_url: item.video_url, caption: item.caption_ig, cover_url: item.cover_url });
  const fbId = await postFacebookVideo({ file_url: item.video_url, title: item.title, description: item.caption_fb });
  result = { instagram: igId, facebook: fbId };
}
item.published_id = result;
item.published_at = new Date().toISOString();
console.log('Yayında:', item.id, JSON.stringify(result));
if (due.length > 1) console.log(`Not: ${due.length - 1} öğe daha vadesi gelmiş durumda, günlük/4 saatlik kurala göre sıradaki uygun çalıştırmada yayınlanacak.`);

writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n', 'utf-8');
