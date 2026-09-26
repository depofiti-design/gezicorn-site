// Kanaldaki tüm videoların (başlık, açıklama, etiket, istatistik) yedeği: youtube-backup/videos-<tarih>.json
import { api } from './yt-lib.mjs';
import { writeFileSync } from 'node:fs';
const ch = await api('channels', { part: 'contentDetails', mine: 'true' });
const up = ch.items[0].contentDetails.relatedPlaylists.uploads;
let ids = [], pt = '';
do { const r = await api('playlistItems', { part: 'contentDetails', playlistId: up, maxResults: '50', ...(pt ? { pageToken: pt } : {}) }); ids.push(...r.items.map(i => i.contentDetails.videoId)); pt = r.nextPageToken || ''; } while (pt);
const vids = [];
for (let i = 0; i < ids.length; i += 50) {
  const r = await api('videos', { part: 'snippet,contentDetails,statistics,status', id: ids.slice(i, i + 50).join(',') });
  vids.push(...r.items);
}
const d = new Date().toISOString().slice(0, 10);
writeFileSync(`youtube-backup/videos-${d}.json`, JSON.stringify(vids));
console.log('video', vids.length, 'yedek youtube-backup/videos-' + d + '.json');
