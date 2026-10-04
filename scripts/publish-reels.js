// Zamanlanmış sosyal yayın kuyruğu: reels-queue.json'daki vadesi gelmiş, henüz yayınlanmamış girdileri yayınlar.
// platform: 'instagram_reel' (video_url + caption) veya 'facebook_link' (link + message, YouTube kartı için).
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { postInstagramReel, postFacebookLink } from './lib-social.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(__dirname, 'reels-queue.json');
const queue = JSON.parse(readFileSync(QUEUE, 'utf-8'));
const now = Date.now();
let changed = false;

for (const item of queue) {
  if (item.published_id || new Date(item.publish_at).getTime() > now) continue;
  const id = item.platform === 'facebook_link'
    ? await postFacebookLink({ link: item.link, message: item.message })
    : await postInstagramReel({ video_url: item.video_url, caption: item.caption });
  item.published_id = id;
  item.published_at = new Date().toISOString();
  changed = true;
  console.log('Yayında:', item.id, id);
}

if (changed) writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n', 'utf-8');
else console.log('Yayınlanacak öğe yok.');
