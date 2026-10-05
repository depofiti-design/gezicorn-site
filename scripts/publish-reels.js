// Zamanlanmış sosyal yayın kuyruğu: reels-queue.json'daki vadesi gelmiş, henüz yayınlanmamış girdileri yayınlar.
// platform: 'reel_both' (IG reel + FB video), 'facebook_link' (YouTube kartı + mesaj).
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { postInstagramReel, postFacebookLink, postFacebookVideo } from './lib-social.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(__dirname, 'reels-queue.json');
const queue = JSON.parse(readFileSync(QUEUE, 'utf-8'));
const now = Date.now();
let changed = false;

for (const item of queue) {
  if (item.published_id || new Date(item.publish_at).getTime() > now) continue;
  let result;
  if (item.platform === 'facebook_link') {
    result = { facebook: await postFacebookLink({ link: item.link, message: item.message }) };
  } else {
    const igId = await postInstagramReel({ video_url: item.video_url, caption: item.caption_ig });
    const fbId = await postFacebookVideo({ file_url: item.video_url, title: item.title, description: item.caption_fb });
    result = { instagram: igId, facebook: fbId };
  }
  item.published_id = result;
  item.published_at = new Date().toISOString();
  changed = true;
  console.log('Yayında:', item.id, JSON.stringify(result));
}

if (changed) writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n', 'utf-8');
else console.log('Yayınlanacak öğe yok.');
