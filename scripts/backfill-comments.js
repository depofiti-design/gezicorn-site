// Geçmişte yayınlanmış reels'lere (Facebook + Instagram) site linkli bir tanıtım yorumu ekler.
// KURAL (kullanıcı 14 Kasım 2026): bot/spam kontrolüne takılmamak için ASLA toplu değil, yavaş yavaş.
// Bu yüzden bu script her çalıştırmada en fazla BATCH_SIZE öğe işler, FB/IG arasında ve öğeler arasında
// gerçek gecikme bırakır. GitHub Actions'ta günde birkaç kez tetiklenip kuyruğu haftalar içinde bitirir.
// Composio'nun FACEBOOK/INSTAGRAM araç setinde yorum SABİTLEME (pin) yok, sadece oluşturma var; sabitleme
// gerekiyorsa kullanıcı Meta uygulamasından elle yapmalı (lib-social.js'teki not).
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { postFacebookComment, postInstagramComment } from './lib-social.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(__dirname, 'reels-queue.json');
const queue = JSON.parse(readFileSync(QUEUE, 'utf-8'));

const BATCH_SIZE = Number(process.env.BACKFILL_BATCH_SIZE || 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (baseMs) => baseMs + Math.floor(Math.random() * baseMs * 0.6);

function commentText(item) {
  const link = item.article_slug ? `https://www.gezicorn.com/yazi/${item.article_slug}/` : 'https://www.gezicorn.com';
  return `Bu konu ve ücretsiz rota planı önerileri dahil daha fazla pratik bilgi için yazımıza bakabilirsin: ${link}`;
}

const candidates = queue
  .filter((x) => x.published_id && !x.commented_at)
  .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
  .slice(0, BATCH_SIZE);

if (!candidates.length) { console.log('Yorum atılacak eski gönderi kalmadı.'); process.exit(0); }

for (const item of candidates) {
  const msg = commentText(item);
  const outcome = {};
  try {
    if (item.published_id.facebook) {
      outcome.facebook = await postFacebookComment({ object_id: item.published_id.facebook, message: msg });
      console.log('[FB] yorum atıldı:', item.id, outcome.facebook);
    }
  } catch (e) {
    console.error('[FB] hata:', item.id, e.message || e);
  }
  await sleep(jitter(20000));
  try {
    if (item.published_id.instagram) {
      outcome.instagram = await postInstagramComment({ ig_media_id: item.published_id.instagram, message: msg });
      console.log('[IG] yorum atıldı:', item.id, outcome.instagram);
    }
  } catch (e) {
    console.error('[IG] hata:', item.id, e.message || e);
  }
  item.commented_at = new Date().toISOString();
  item.comment_result = outcome;
  writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n', 'utf-8');
  if (candidates.indexOf(item) < candidates.length - 1) await sleep(jitter(60000));
}

const remaining = queue.filter((x) => x.published_id && !x.commented_at).length;
console.log(`Bu çalıştırmada ${candidates.length} öğeye yorum atıldı, kalan: ${remaining}`);
